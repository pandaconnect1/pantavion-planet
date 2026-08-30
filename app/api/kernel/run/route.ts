import { NextResponse } from "next/server";

import { enforcePantavionKernelPrivilegedMutationBoundary } from "@/core/kernel/kernel-privileged-mutation-boundary";
import { pantavionKernel } from "@/kernel/kernel";
import type { KernelRunRequest } from "@/kernel/types";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const mutationBoundaryResponse = enforcePantavionKernelPrivilegedMutationBoundary(request);
  if (mutationBoundaryResponse) return mutationBoundaryResponse;

  if (!(await isPantavionKernelFounderRequestAllowed(request))) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const body = (await request.json()) as KernelRunRequest;
  const result = pantavionKernel.run(body);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
