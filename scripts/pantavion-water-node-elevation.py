"""Ground elevation for every staged water-network node.

Source: Copernicus DEM GLO-30 (ESA / EU Copernicus, free and open use; public
cloud-optimised GeoTIFFs on AWS Open Data). It is a surface model at 30 m:
roofs and trees can lift a value by a few metres, so every row says where it
came from, and surveyed or drawing elevations replace it later.

Reads nodes (lon/lat) and writes elevations through two service-role RPCs:
pantavion_water_stage_nodes_lonlat and pantavion_water_stage_set_node_elevations.
"""
import json
import math
import os
import sys
import urllib.request

import numpy as np
import rasterio
from rasterio.windows import Window

URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SECRET_KEY"]
SOURCE = "copernicus-dem-glo30"
TILE_URL = ("https://copernicus-dem-30m.s3.amazonaws.com/"
            "Copernicus_DSM_COG_10_{ns}{lat:02d}_00_{ew}{lon:03d}_00_DEM/"
            "Copernicus_DSM_COG_10_{ns}{lat:02d}_00_{ew}{lon:03d}_00_DEM.tif")


def rpc(name, body):
    req = urllib.request.Request(
        f"{URL}/rest/v1/rpc/{name}", data=json.dumps(body).encode(), method="POST",
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read() or b"null")


def notice(title, msg):
    print(f"::notice title={title}::{msg}", flush=True)


def main():
    nodes, after = [], 0
    while True:
        page = rpc("pantavion_water_stage_nodes_lonlat", {"p_after": after, "p_limit": 10000})
        if not page:
            break
        nodes.extend(page)
        after = page[-1]["node_id"]
    if not nodes:
        print("::error title=Elevation::no nodes returned")
        sys.exit(1)

    by_tile = {}
    for n in nodes:
        key = (math.floor(n["lat"]), math.floor(n["lon"]))
        by_tile.setdefault(key, []).append(n)

    rows, missing = [], 0
    for (lat, lon), group in sorted(by_tile.items()):
        url = TILE_URL.format(ns="N" if lat >= 0 else "S", lat=abs(lat), ew="E" if lon >= 0 else "W", lon=abs(lon))
        with rasterio.open(url) as ds:
            band = ds.read(1).astype("float64")
            nodata = ds.nodata
            for n in group:
                # Bilinear sample at the node.
                col_f, row_f = ~ds.transform * (n["lon"], n["lat"])
                c0, r0 = int(math.floor(col_f - 0.5)), int(math.floor(row_f - 0.5))
                fx, fy = col_f - 0.5 - c0, row_f - 0.5 - r0
                if c0 < 0 or r0 < 0 or c0 + 1 >= ds.width or r0 + 1 >= ds.height:
                    missing += 1
                    continue
                q = band[r0:r0 + 2, c0:c0 + 2]
                if nodata is not None and np.any(q == nodata):
                    missing += 1
                    continue
                z = (q[0, 0] * (1 - fx) * (1 - fy) + q[0, 1] * fx * (1 - fy)
                     + q[1, 0] * (1 - fx) * fy + q[1, 1] * fx * fy)
                rows.append({"node_id": n["node_id"], "z": round(float(z), 2)})
        notice("Elevation tile", json.dumps({"tile": [lat, lon], "nodes": len(group)}))

    written = 0
    for i in range(0, len(rows), 2000):
        written += rpc("pantavion_water_stage_set_node_elevations", {"p_rows": rows[i:i + 2000], "p_source": SOURCE}) or 0

    zs = np.array([r["z"] for r in rows]) if rows else np.array([0.0])
    notice("Node elevations written", json.dumps({
        "nodes": len(nodes), "written": written, "missing": missing, "source": SOURCE,
        "min_m": round(float(zs.min()), 1), "max_m": round(float(zs.max()), 1),
        "median_m": round(float(np.median(zs)), 1)}))


if __name__ == "__main__":
    main()
