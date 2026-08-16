import { NextResponse } from "next/server";
import { runPantavionRepoSafetyScan } from "../../../../../../core/agents/pantavion-agent-runtime-guardrails";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const result = await runPantavionRepoSafetyScan(body);

  return NextResponse.json(result, {
    status: result.founderApprovalRequired ? 202 : 200,
  });
}
