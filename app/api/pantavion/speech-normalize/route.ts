import { NextResponse } from "next/server";
import { normalizePantavionAccessibleSpeechTranscript } from "@/core/translation/pantavion-speech-accessibility";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const transcript = String(body?.transcript || "").trim();
  const language = String(body?.language || "auto").trim() || "auto";

  if (!transcript) {
    return NextResponse.json(
      { ok: false, error: "Missing speech transcript." },
      { status: 400 },
    );
  }

  const result = await normalizePantavionAccessibleSpeechTranscript({
    transcript,
    language,
    accessibilityMode: body?.accessibilityMode !== false,
  });

  return NextResponse.json({
    ok: true,
    text: result.normalizedText,
    rawText: result.rawText,
    normalizedText: result.normalizedText,
    changed: result.changed,
    provider: result.provider,
    speechAccessibility: {
      enabled: true,
      stutterTolerance: true,
      articulationVariationTolerance: true,
      preserveRawTranscript: true,
    },
  });
}
