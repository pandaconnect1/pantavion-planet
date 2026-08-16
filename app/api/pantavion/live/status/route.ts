import { NextResponse } from "next/server";
import { getPantavionLiveSurfaceStatus } from "../../../../../core/live/pantavion-live-surface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/live/status",
    live: getPantavionLiveSurfaceStatus()
  });
}
