import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Pantavion",
    route: "/api/health",
    status: "live",
    thirdPartyAiUsed: false,
    timestamp: new Date().toISOString(),
  });
}
