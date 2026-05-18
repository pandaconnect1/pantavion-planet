import { NextResponse } from "next/server";
import { getPantavionSovereignIntelligenceFabric } from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/intelligence/status",
    fabric: getPantavionSovereignIntelligenceFabric(),
  });
}

