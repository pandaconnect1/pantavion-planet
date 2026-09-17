import { NextResponse } from "next/server";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import { getPantavionKernelControlPlaneSnapshot } from "@/core/kernel/pantavion-kernel-control-plane";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const controlPlane = await getPantavionKernelControlPlaneSnapshot();

    return NextResponse.json(
      {
        ok: true,
        service: "pantavion-kernel",
        route: "/api/kernel/status",
        kernel: {
          name: "Pantavion Prime Kernel",
          mode: "control-plane-foundation",
          status: "online",
          sovereignty: "active",
          orchestration: "durable-ledger-bound",
        },
        controlPlane,
        checks: {
          durableExecution: "operational",
          sos: "durable-intake-active",
          identity: "planned",
          safety: "planned",
          translation: "planned",
          pantai: "planned",
          registry: "planned",
        },
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: "pantavion-kernel",
        route: "/api/kernel/status",
        kernel: {
          name: "Pantavion Prime Kernel",
          mode: "control-plane-foundation",
          status: "degraded",
          sovereignty: "active",
          orchestration: "durable-ledger-unavailable",
        },
        checks: {
          durableExecution: "degraded",
          sos: "verification-required",
          identity: "planned",
          safety: "planned",
          translation: "planned",
          pantai: "planned",
          registry: "planned",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
