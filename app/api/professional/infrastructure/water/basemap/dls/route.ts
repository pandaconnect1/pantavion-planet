import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const upstream = new URL(DLS_TOPOGRAPHY_EXPORT);
  upstream.searchParams.set(
    "bbox",
    [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].join(","),
  );
  upstream.searchParams.set("bboxSR", "3857");
  upstream.searchParams.set("imageSR", "3857");
  upstream.searchParams.set("size", `${TILE_SIZE},${TILE_SIZE}`);
  upstream.searchParams.set("dpi", "96");
  upstream.searchParams.set("format", "png32");
  upstream.searchParams.set("transparent", "false");
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
        "X-Pantavion-Basemap": "cyprus-dls-topography-proxy-v1",
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
