import { NextResponse } from "next/server";

import {
  evaluatePantavionPreAction,
  type PantavionPreActionInput,
} from "@/core/governance/pantavion-preaction-governor";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import { enforcePantavionKernelPrivilegedMutationBoundary } from "@/core/kernel/kernel-privileged-mutation-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const boundaryResponse = enforcePantavionKernelPrivilegedMutationBoundary(request);
  if (boundaryResponse) return boundaryResponse;

  if (!(await isPantavionKernelFounderRequestAllowed(request))) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const body = (await request.json()) as PantavionPreActionInput;
  const result = evaluatePantavionPreAction(body);

  return NextResponse.json(
    {
      marker: "pantavion_preaction_governor_v1",
      ...result,
    },
    {
      status: result.allowed ? 200 : 409,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
