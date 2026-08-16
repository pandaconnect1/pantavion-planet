import { NextResponse } from "next/server";
import { getPantavionAgentRuntimeStatus } from "../../../../../../core/agents/pantavion-agent-runtime-guardrails";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getPantavionAgentRuntimeStatus());
}
