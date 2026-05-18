import { NextResponse } from "next/server";
import { getPantavionOpportunities } from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/intelligence/opportunities",
    opportunities: getPantavionOpportunities(),
  });
}

