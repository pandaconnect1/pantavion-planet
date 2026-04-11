import { NextResponse } from "next/server";
import { pantavionKernel } from "@/kernel/kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const full = url.searchParams.get("full");

  if (full === "1") {
    return NextResponse.json({
      ok: true,
      state: pantavionKernel.getState(),
    });
  }

  return NextResponse.json({
    ok: true,
    summary: pantavionKernel.getStateSummary(),
  });
}
