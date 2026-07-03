import { NextResponse } from "next/server";
import {
  PANTAVION_CAPABILITY_REGISTRY,
  PANTAVION_EXECUTION_KERNEL_ID,
  runPantavionExecution
} from "../../../../core/execution/pantavion-execution-kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/execute",
    runtime: PANTAVION_EXECUTION_KERNEL_ID,
    status: "live_internal_execution_kernel",
    capabilities: Object.values(PANTAVION_CAPABILITY_REGISTRY)
  });
}

export async function POST(request: Request) {
  let body: { input?: string; actor?: string } = {};

  try {
    body = (await request.json()) as { input?: string; actor?: string };
  } catch {
    body = {};
  }

  const input = String(body.input || "").trim();

  if (!input) {
    return NextResponse.json(
      {
        ok: false,
        error: "input_required",
        message: "Provide input for Pantavion execution."
      },
      { status: 400 }
    );
  }

  const result = await runPantavionExecution(input, body.actor || "anonymous_or_internal_user");

  return NextResponse.json(result);
}
