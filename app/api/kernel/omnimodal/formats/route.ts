import { NextResponse } from "next/server";
import { verifyKernelRequest } from "../../../../../core/kernel/kernel-auth";
import { getOmnimodalFormatRegistry } from "../../../../../core/kernel/omnimodal-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = verifyKernelRequest(request);

  if (!auth.ok && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.statusCode },
    );
  }

  return NextResponse.json({
    ok: true,
    actor: auth.ok ? auth.actor : "local-formats",
    authWarning: auth.ok ? auth.warning : "Local development mode.",
    formats: getOmnimodalFormatRegistry(),
  });
}
