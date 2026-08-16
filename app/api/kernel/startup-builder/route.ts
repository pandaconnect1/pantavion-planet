import { NextResponse } from "next/server";
import { verifyKernelRequest } from "../../../../core/kernel/kernel-auth";
import { runStartupBuilder } from "../../../../core/agents/startup-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = verifyKernelRequest(request);

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.statusCode },
    );
  }

  let body: { idea?: string } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const result = await runStartupBuilder({
    idea: body.idea ?? "",
    actor: auth.actor,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
