import { NextResponse } from "next/server";
import { pantavionKernel } from "@/kernel/kernel";
import type { KernelIntakeRequest } from "@/kernel/types";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const body = (await request.json()) as KernelIntakeRequest;
  const result = pantavionKernel.intake(body);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
