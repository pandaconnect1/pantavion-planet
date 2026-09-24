import { NextResponse } from "next/server";

import { GET as getProtectedWaterSegment } from "@/app/api/professional/infrastructure/water/segment/bbox/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function normalizeBbox(url: URL) {
  const bbox = url.searchParams.get("bbox");
  if (!bbox) return;

  const parts = bbox.split(",").map((value) => Number(value.trim()));
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) return;

  const [minLng, minLat, maxLng, maxLat] = parts;
  url.searchParams.set("minLng", String(minLng));
  url.searchParams.set("minLat", String(minLat));
  url.searchParams.set("maxLng", String(maxLng));
  url.searchParams.set("maxLat", String(maxLat));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  normalizeBbox(url);

  const segmentUrl = new URL(
    "/api/professional/infrastructure/water/segment/bbox",
    request.url,
  );

  for (const [key, value] of url.searchParams.entries()) {
    segmentUrl.searchParams.set(key, value);
  }

  const response = await getProtectedWaterSegment(
    new Request(segmentUrl, {
      method: "GET",
      headers: request.headers,
    }),
  );

  const body = await response.json();

  return NextResponse.json(
    {
      ...body,
      mapServer: {
        service: "Pantavion Water",
        layerId: 0,
        layerName: "Water Network A",
        spatialReference: { wkid: 4326 },
        geometryMode: "visible-viewport-only",
        rawMasterIncluded: false,
      },
    },
    {
      status: response.status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Pantavion-Water-MapServer": response.ok ? "layer-0-query" : "layer-0-query-error",
        "X-Pantavion-Water-Raw-Master": "not-included",
      },
    },
  );
}
