import { NextResponse } from "next/server";
import { verifyKernelRequest } from "../../../../../core/kernel/kernel-auth";
import { getConversionOptions } from "../../../../../core/kernel/conversion-engine";

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
    actor: auth.ok ? auth.actor : "local-conversion-options",
    authWarning: auth.ok ? auth.warning : "Local development mode.",
    options: getConversionOptions(),
  });
}
