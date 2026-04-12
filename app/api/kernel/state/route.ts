import { NextResponse } from "next/server";
import { getCanonicalKernelRuntime, pantavionKernel } from "@/kernel/kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const full = url.searchParams.get("full");
  const runtimeHealth = getCanonicalKernelRuntime().health();

  if (full === "1") {
    return NextResponse.json({
      ok: true,
      runtime: runtimeHealth,
      state: pantavionKernel.getState(),
    });
  }

  return NextResponse.json({
    ok: true,
    runtime: runtimeHealth,
    summary: pantavionKernel.getStateSummary(),
  });
}
