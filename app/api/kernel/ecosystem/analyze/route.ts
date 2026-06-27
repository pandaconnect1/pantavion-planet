import { NextResponse } from "next/server";
import { verifyKernelRequest } from "../../../../../core/kernel/kernel-auth";
import { runEcosystemGapFinder } from "../../../../../core/kernel/ecosystem-gap-finder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  const auth = verifyKernelRequest(request);

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.statusCode },
    );
  }

  const report = await runEcosystemGapFinder({
    actor: auth.actor,
  });

  return NextResponse.json({
    ok: true,
    authWarning: auth.warning,
    report,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
