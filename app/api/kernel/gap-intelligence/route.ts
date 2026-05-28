import { NextResponse } from "next/server";

import { createPantavionGapIntelligenceReport } from "@/core/kernel/kernel-gap-intelligence";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(createPantavionGapIntelligenceReport(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
