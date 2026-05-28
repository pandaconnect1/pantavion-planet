import { NextResponse } from "next/server";

import { createPantavionResearchAssimilationReport } from "@/core/kernel/kernel-research-assimilation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(createPantavionResearchAssimilationReport(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
