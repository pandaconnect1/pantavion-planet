import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DLS_CADASTRAL_EXPORT =
  "https://eservices.dls.moi.gov.cy/arcgis/rest/services/National/CadastralMap_GR/MapServer/export";
const DLS_TOPOGRAPHY_EXPORT =
  "https://eservices.dls.moi.gov.cy/arcgis/rest/services/National/Topography_GR/MapServer/export";
const WEB_MERCATOR_HALF_WORLD = 20037508.342789244;
const TILE_SIZE = 256;
const MIN_ZOOM = 8;
const MAX_ZOOM = 20;

function parseTileInteger(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function tileBounds3857(z: number, x: number, y: number) {
  const tileCount = 2 ** z;
  const span = (WEB_MERCATOR_HALF_WORLD * 2) / tileCount;
  const minX = -WEB_MERCATOR_HALF_WORLD + x * span;
  const maxX = minX + span;
  const maxY = WEB_MERCATOR_HALF_WORLD - y * span;
  const minY = maxY - span;

  return { minX, minY, maxX, maxY };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const z = parseTileInteger(url.searchParams.get("z"));
  const x = parseTileInteger(url.searchParams.get("x"));
  const y = parseTileInteger(url.searchParams.get("y"));
  const mode = url.searchParams.get("mode") === "roads" ? "roads" : "cadastral";

  if (z === null || x === null || y === null || z < MIN_ZOOM || z > MAX_ZOOM) {
    return NextResponse.json(
      { status: "invalid_tile" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const tileCount = 2 ** z;
  if (x < 0 || y < 0 || x >= tileCount || y >= tileCount) {
    return NextResponse.json(
      { status: "invalid_tile" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const bounds = tileBounds3857(z, x, y);
  const upstream = new URL(
    mode === "roads" ? DLS_TOPOGRAPHY_EXPORT : DLS_CADASTRAL_EXPORT,
  );
  upstream.searchParams.set(
    "bbox",
    [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].join(","),
  );
  upstream.searchParams.set("bboxSR", "3857");
  upstream.searchParams.set("imageSR", "3857");
  // Retina-size transparent exports. Cadastral mode shows the detailed
  // official plan information used by field crews: parcel boundaries and
  // parcel numbers (0), locality/toponyms (19), topographic points/lines/areas
  // (21/22/23) and surveyed buildings (28). Roads mode adds official area/
  // service labels and the primary/secondary/local road network (4/7/13/14/15).
  upstream.searchParams.set("size", `${TILE_SIZE * 2},${TILE_SIZE * 2}`);
  upstream.searchParams.set("dpi", "192");
  upstream.searchParams.set("format", "png32");
  upstream.searchParams.set("transparent", mode === "roads" ? "true" : "false");
  upstream.searchParams.set(
    "layers",
    mode === "roads" ? "show:4,7,13,14,15" : "show:0,19,21,22,23,28",
  );
  upstream.searchParams.set("f", "image");

  try {
    const response = await fetch(upstream, {
      cache: "force-cache",
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: "image/png,image/*;q=0.8",
        "User-Agent": "PantavionWater/1.0 (pantavion.com)",
      },
    });

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!response.ok || !contentType.startsWith("image/")) {
      return new Response(null, {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Basemap": "cyprus-dls-upstream-error",
        },
      });
    }

    const body = await response.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=900, s-maxage=86400, stale-while-revalidate=604800",
        "X-Pantavion-Basemap":
          mode === "roads"
            ? "cyprus-dls-road-labels-v1"
            : "cyprus-dls-detailed-cadastral-v2",
      },
    });
  } catch {
    return new Response(null, {
      status: 504,
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Basemap": "cyprus-dls-upstream-timeout",
      },
    });
  }
}
