import { NextResponse } from "next/server";
import { getPantavionLiveSummary } from "@/core/pantavion/live-backend-contract";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/kernel/status",
    summary: getPantavionLiveSummary(),
  });
}
