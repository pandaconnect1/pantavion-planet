import { NextRequest, NextResponse } from "next/server";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelAccessAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
} from "@/core/kernel/kernel-access-guard";
import { createPantavionKernelHeartbeat } from "@/core/kernel/kernel-heartbeat";

export const dynamic = "force-dynamic";

function parseReserveKernelCount(): number {
  const raw = process.env.PANTAVION_RESERVE_KERNEL_COUNT;
  if (!raw) return 0;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get(PANTAVION_KERNEL_ACCESS_QUERY);

  if (!isPantavionKernelAccessAllowed(token)) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const report = createPantavionKernelHeartbeat({
    source: "api",
    mode: "online",
    runtime: {
      host: request.headers.get("host"),
      vercel: process.env.VERCEL === "1",
      region: process.env.VERCEL_REGION ?? process.env.PANTAVION_KERNEL_REGION ?? null,
      deploymentEnv: process.env.VERCEL_ENV ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
      reserveKernelCount: parseReserveKernelCount(),
    },
  });

  return NextResponse.json(report, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
