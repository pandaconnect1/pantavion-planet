import { NextResponse } from "next/server";
import { getPantavionAgentRunDashboard } from "../../../../../../core/agents/pantavion-agent-run-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PANTAVION_AGENT_DASHBOARD_ROUTE_MARKER =
  "/api/pantavion/agents/runtime/dashboard";

export async function GET() {
  void PANTAVION_AGENT_DASHBOARD_ROUTE_MARKER;
  return NextResponse.json(getPantavionAgentRunDashboard());
}

export async function POST() {
  void PANTAVION_AGENT_DASHBOARD_ROUTE_MARKER;
  return NextResponse.json(getPantavionAgentRunDashboard());
}
