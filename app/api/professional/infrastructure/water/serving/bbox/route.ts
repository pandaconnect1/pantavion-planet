import { NextRequest } from "next/server";

import { GET as getProtectedWaterSegment } from "@/app/api/professional/infrastructure/water/segment/bbox/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WATER_SERVING_BBOX_ROUTE_VERSION = "water-serving-bbox-route-v2" as const;

// Founder directive 2026-09-30:
// private/protected does not mean disabled. This route must never expose the
// raw/full master, but authorized founder/admin/approved-device traffic must
// use the same protected segmented serving path as Map A.
export async function GET(request: NextRequest) {
  const response = await getProtectedWaterSegment(request);
  response.headers.set("X-Pantavion-Water-Serving-Route", WATER_SERVING_BBOX_ROUTE_VERSION);
  response.headers.set("X-Pantavion-Water-Serving-Mode", "protected-operational");
  return response;
}
