import { NextResponse } from "next/server";
import {
  readPantavionAgentRuntimeState,
  runPantavionAgentRuntimeTick,
} from "../../../../../../core/agents/pantavion-agent-runtime-tick";

export const runtime = "nodejs";

export async function GET() {
  const state = await readPantavionAgentRuntimeState();
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/agents/runtime/tick",
    state,
  });
}

export async function POST(request: Request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const result = await runPantavionAgentRuntimeTick({
    ...body,
    source: "api",
  });

  return NextResponse.json(result);
}
