import { NextResponse } from "next/server";
import {
  getPantavionLanguageCapabilityMatrixSummary,
  PANTAVION_INITIAL_LANGUAGE_CAPABILITY_MATRIX,
} from "@/core/translation/pantavion-language-capability-matrix";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    ok: true,
    summary: getPantavionLanguageCapabilityMatrixSummary(),
    languages: PANTAVION_INITIAL_LANGUAGE_CAPABILITY_MATRIX,
  });
}
