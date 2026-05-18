import { NextResponse } from "next/server";
import { getPantavionTranslationProviderStatus } from "@/core/translation/pantavion-translation-provider-adapters";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getPantavionTranslationProviderStatus());
}
