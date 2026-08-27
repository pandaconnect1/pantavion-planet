import { NextResponse } from "next/server";
import { pantavionKernel } from "@/kernel/kernel";
import type { KernelCompleteRequest } from "@/kernel/types";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelRequestAllowed,
} from "@/core/kernel/kernel-access-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  if (!isPantavionKernelRequestAllowed(request)) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const body = (await request.json()) as KernelCompleteRequest;
  const result = pantavionKernel.complete(body);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
