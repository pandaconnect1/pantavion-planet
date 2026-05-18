import { NextResponse } from "next/server";
import { getPantavionBuildQueue } from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/intelligence/build-queue",
    buildQueue: getPantavionBuildQueue(),
  });
}

