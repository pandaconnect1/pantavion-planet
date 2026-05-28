import { NextResponse } from "next/server";

import { createPantavionProductDNAReport } from "@/core/kernel/kernel-product-dna";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(createPantavionProductDNAReport(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
