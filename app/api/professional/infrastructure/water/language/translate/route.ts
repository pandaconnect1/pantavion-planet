import { NextResponse } from "next/server";

import { getPantavionMultimodalLanguageReadiness } from "@/core/i18n/pantavion-multimodal-language-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let requestBody: unknown = null;

  try {
    requestBody = await request.json();
  } catch {
    requestBody = null;
  }

  return NextResponse.json(
    {
      marker: "pantavion_multimodal_translation_provider_blocked_v1",
      status: "blocked",
      reason:
        "Multimodal translation contract exists, but no approved translation/speech/audio/image provider is connected yet. No fake translation is returned.",
      requestReceived: Boolean(requestBody),
      dataReturned: false,
      translatedTextReturned: false,
      audioReturned: false,
      imageTextReturned: false,
      waterNetworkDataReturned: false,
      providerReadiness: getPantavionMultimodalLanguageReadiness(),
      requiredBeforeActivation: [
        "approved translation provider",
        "approved speech-to-text provider",
        "approved text-to-speech provider",
        "approved OCR/image provider",
        "approved audio transcription provider",
        "privacy and cost controls",
        "founder/admin approval",
      ],
    },
    {
      status: 423,
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Multimodal-Translation": "provider-blocked",
        "X-Pantavion-Data-Returned": "false",
      },
    },
  );
}
