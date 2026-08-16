import { NextResponse } from "next/server";
import { verifyKernelRequest } from "../../../../../core/kernel/kernel-auth";
import {
  filterConversionFormatMatrix,
  summarizeConversionFormatMatrix,
  type ConversionSupportLevel,
} from "../../../../../core/kernel/conversion-format-matrix";

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

  const url = new URL(request.url);
  const sourceExtension = url.searchParams.get("source") ?? undefined;
  const targetExtension = url.searchParams.get("target") ?? undefined;
  const supportLevel =
    (url.searchParams.get("supportLevel") as ConversionSupportLevel | null) ??
    undefined;

  const rows = filterConversionFormatMatrix({
    sourceExtension,
    targetExtension,
    supportLevel,
  });

  return NextResponse.json({
    ok: true,
    actor: auth.ok ? auth.actor : "local-conversion-matrix",
    authWarning: auth.ok ? auth.warning : "Local development mode.",
    summary: summarizeConversionFormatMatrix(rows),
    rows,
  });
}
