import json
import sys
from collections import Counter
import ijson

types = Counter()
keys = Counter()
features = 0
segments = 0
with open(sys.argv[1], "rb") as src:
    for item in ijson.items(src, "features.item", use_float=True):
        features += 1
        geom = item.get("geometry") or {}
        typ = geom.get("type", "")
        types[typ] += 1
        keys.update((item.get("properties") or {}).keys())
        coords = geom.get("coordinates") or []
        if typ == "LineString":
            segments += max(len(coords) - 1, 0)
        if typ == "MultiLineString":
            segments += sum(max(len(line) - 1, 0) for line in coords)
        if features > 3000000:
            raise ValueError("too_many_features")
print(json.dumps({"features": features, "estimatedLineSegments": segments,
                  "geometryTypes": dict(types), "propertyKeys": dict(keys)}))
if features == 0 or segments == 0:
    raise ValueError("no_real_line_segments")
