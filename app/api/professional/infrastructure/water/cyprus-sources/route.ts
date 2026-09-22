import { NextResponse } from "next/server";

import { getCyprusWaterGeospatialSourceSnapshot } from "@/core/water/cyprus-geospatial-source-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(getCyprusWaterGeospatialSourceSnapshot(), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "X-Pantavion-Water-Source-Registry": "cyprus-v2",
    },
  });
}
