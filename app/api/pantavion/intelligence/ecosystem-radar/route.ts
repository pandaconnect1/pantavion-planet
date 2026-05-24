import { NextResponse } from "next/server";
import { getPantavionEcosystemRadarRuntime } from "@/core/intelligence/pantavion-ecosystem-radar-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/intelligence/ecosystem-radar",
    radar: getPantavionEcosystemRadarRuntime(),
  });
}
