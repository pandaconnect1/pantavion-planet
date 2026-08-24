import { NextResponse } from "next/server";

import { createPantavionKernelAuditMemoryReport } from "@/core/kernel/kernel-audit-memory";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelRequestAllowed,
} from "@/core/kernel/kernel-access-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isPantavionKernelRequestAllowed(request)) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(createPantavionKernelAuditMemoryReport(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
