import { NextResponse } from "next/server";
import { verifyKernelRequest } from "../../../../../core/kernel/kernel-auth";
import { generateEvolutionProposal } from "../../../../../core/kernel/evolution-proposal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = verifyKernelRequest(request);

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.statusCode },
    );
  }

  const proposal = await generateEvolutionProposal({ actor: auth.actor });

  return NextResponse.json({
    ok: true,
    authWarning: auth.warning,
    proposal,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
