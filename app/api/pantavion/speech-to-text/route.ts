import { NextResponse } from "next/server";
import { normalizePantavionAccessibleSpeechTranscript } from "@/core/translation/pantavion-speech-accessibility";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

function textFromPayload(payload: any) {
  return String(
    payload?.text ||
      payload?.transcript ||
      payload?.output_text ||
      payload?.result?.text ||
      "",
  ).trim();
}

async function transcribeWithPantavionEndpoint(audio: File, language: string) {
  const endpoint = process.env.PANTAVION_SPEECH_TO_TEXT_ENDPOINT;
  if (!endpoint) return null;

  const form = new FormData();
  form.append("file", audio, audio.name || "pantavion-voice.webm");
  if (language && language !== "auto") form.append("language", language);
  form.append("accessibility_mode", "speech_variation_tolerant");
  form.append("preserve_meaning", "true");
  form.append("speech_variations", "stutter,repetition,articulation");

  const headers: Record<string, string> = {};
  const apiKey =
    process.env.PANTAVION_SPEECH_TO_TEXT_API_KEY ||
    process.env.PANTAVION_TRANSLATE_API_KEY;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: form,
      signal: AbortSignal.timeout(25_000),
    });
    const payload = await response.json().catch(() => ({}));
    const text = textFromPayload(payload);
    if (!response.ok || !text) return null;

    return {
      ok: true,
      text,
      provider: "pantavion_speech_provider",
    } as const;
  } catch {
    return null;
  }
}

async function transcribeWithOpenAI(audio: File, language: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const requestedModel =
    process.env.PANTAVION_SPEECH_TO_TEXT_MODEL || "gpt-4o-mini-transcribe";
  const models = Array.from(new Set([requestedModel, "whisper-1"]));

  for (const model of models) {
    try {
      const form = new FormData();
      form.append("file", audio, audio.name || "pantavion-voice.webm");
      form.append("model", model);
      form.append("response_format", "json");

      const baseLanguage = language.toLowerCase().split("-")[0];
      if (/^[a-z]{2}$/.test(baseLanguage)) {
        form.append("language", baseLanguage);
      }

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
        signal: AbortSignal.timeout(30_000),
      });
      const payload = await response.json().catch(() => ({}));
      const text = textFromPayload(payload);
      if (response.ok && text) {
        return {
          ok: true,
          text,
          provider: `openai_audio:${model}`,
        } as const;
      }
    } catch {
      // Try the next approved fallback model.
    }
  }

  return null;
}

async function finalizeAccessibleTranscript(
  result: { ok: true; text: string; provider: string },
  language: string,
) {
  const normalized = await normalizePantavionAccessibleSpeechTranscript({
    transcript: result.text,
    language,
    accessibilityMode: true,
  });

  return {
    ...result,
    text: normalized.normalizedText,
    rawText: normalized.rawText,
    normalizedText: normalized.normalizedText,
    speechAccessibility: {
      enabled: true,
      changed: normalized.changed,
      normalizer: normalized.provider,
      stutterTolerance: true,
      articulationVariationTolerance: true,
      preservedRawTranscript: true,
    },
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    browserSpeechRecognitionFallback: true,
    speechAccessibility: {
      enabled: true,
      stutterTolerance: true,
      articulationVariationTolerance: true,
      preserveRawTranscript: true,
    },
    serverProviderConfigured: Boolean(
      process.env.PANTAVION_SPEECH_TO_TEXT_ENDPOINT || process.env.OPENAI_API_KEY,
    ),
  });
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { ok: false, error: "Invalid audio form data." },
      { status: 400 },
    );
  }

  const audio = form.get("audio");
  const language = String(form.get("language") || "auto").trim() || "auto";

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json(
      { ok: false, error: "Missing audio recording." },
      { status: 400 },
    );
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Audio recording is too large." },
      { status: 413 },
    );
  }

  const pantavionResult = await transcribeWithPantavionEndpoint(audio, language);
  if (pantavionResult) {
    return NextResponse.json(
      await finalizeAccessibleTranscript(pantavionResult, language),
    );
  }

  const openAiResult = await transcribeWithOpenAI(audio, language);
  if (openAiResult) {
    return NextResponse.json(
      await finalizeAccessibleTranscript(openAiResult, language),
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        "Η συσκευή δεν επέστρεψε αναγνώριση φωνής και δεν υπάρχει διαθέσιμο server speech-to-text provider.",
      code: "speech_provider_unavailable",
    },
    { status: 503 },
  );
}
