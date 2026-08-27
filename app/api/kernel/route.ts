import { NextResponse } from "next/server";
import { getCanonicalKernelRuntime, pantavionKernel } from "@/kernel/kernel";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelRequestAllowed,
} from "@/core/kernel/kernel-access-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  if (!isPantavionKernelRequestAllowed(request)) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const runtimeHealth = getCanonicalKernelRuntime().health();

  return NextResponse.json(
    {
      ok: true,
      runtime: runtimeHealth,
      summary: pantavionKernel.getStateSummary(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
