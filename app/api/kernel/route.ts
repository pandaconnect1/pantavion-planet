import { NextResponse } from "next/server";
import { getCanonicalKernelRuntime, pantavionKernel } from "@/kernel/kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const runtimeHealth = getCanonicalKernelRuntime().health();

  return NextResponse.json({
    ok: true,
    runtime: runtimeHealth,
    summary: pantavionKernel.getStateSummary(),
  });
}
