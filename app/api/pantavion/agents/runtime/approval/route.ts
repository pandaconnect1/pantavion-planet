import { NextResponse } from "next/server";
import { createPantavionFounderApprovalRequest } from "../../../../../../core/agents/pantavion-agent-runtime-guardrails";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const result = await createPantavionFounderApprovalRequest(body);

  return NextResponse.json(result, { status: 202 });
}
