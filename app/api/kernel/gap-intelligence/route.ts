import { NextRequest, NextResponse } from "next/server";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import { createPantavionGapIntelligenceReport } from "@/core/kernel/kernel-gap-intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isPantavionKernelRequestAllowed(request)) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(createPantavionGapIntelligenceReport(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
