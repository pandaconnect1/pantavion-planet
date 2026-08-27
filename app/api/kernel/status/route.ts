import { NextResponse } from "next/server";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelRequestAllowed,
} from "@/core/kernel/kernel-access-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isPantavionKernelRequestAllowed(request)) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      service: "pantavion-kernel",
      route: "/api/kernel/status",
      kernel: {
        name: "Pantavion Prime Kernel",
        mode: "foundation",
        status: "online",
        sovereignty: "active",
        orchestration: "initializing",
      },
      checks: {
        identity: "planned",
        safety: "planned",
        translation: "planned",
        sos: "planned",
        pantai: "planned",
        registry: "planned",
      },
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
