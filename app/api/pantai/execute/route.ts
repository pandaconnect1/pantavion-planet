import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
type ExecuteBody = { intent?: string; input?: string; };
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pantai-execute",
    route: "/api/pantai/execute",
    status: "online",
    message: "PantaAI execution endpoint is reachable. Use POST with intent or input."
  });
}
export async function POST(request: NextRequest) {
  let body: ExecuteBody = {};
  try { body = await request.json(); } catch { body = {}; }
  const intent = body.intent || body.input || "unspecified";
  return NextResponse.json({
    ok: true,
    service: "pantai-execute",
    route: "/api/pantai/execute",
    received: { intent },
    execution: {
      status: "accepted",
      mode: "foundation_stub",
      note: "This endpoint is intentionally minimal until the full Pantavion capability registry and orchestrator are connected."
    },
    timestamp: new Date().toISOString()
  });
}
