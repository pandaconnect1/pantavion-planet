import { NextResponse } from "next/server";

import { getPantavionMultimodalLanguageReadiness } from "@/core/i18n/pantavion-multimodal-language-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getPantavionMultimodalLanguageReadiness(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Pantavion-Multimodal-Language": "contract-ready-provider-blocked",
      "X-Pantavion-Data-Returned": "false",
    },
  });
}
