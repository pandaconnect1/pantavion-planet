import { NextResponse } from "next/server";

import { getWaterProductionReadinessSummary } from "@/core/infrastructure/water/water-production-readiness-summary";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getWaterProductionReadinessSummary(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
