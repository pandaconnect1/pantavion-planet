import { NextResponse } from "next/server";
import { getVercelOidcToken } from "@vercel/oidc";
import { experimental_transcribe as transcribe } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { normalizePantavionAccessibleSpeechTranscript } from "@/core/translation/pantavion-speech-accessibility";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

type SpeechResult = { ok: true; text: string; provider: string };
type Attempt = {
  provider: string;
  attempted: boolean;
  ok: boolean;
  status?: number;
  code?: string;
};

function textFromPayload(payload: any) {
  return String(
    payload?.text ||
      payload?.transcript ||
      payload?.output_text ||
      payload?.result?.text ||
      "",
  ).trim();
}

function safeCode(payload: any) {
  const raw = String(payload?.error?.code || payload?.code || "").trim();
  const cleaned = raw.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 80);
  return cleaned || undefined;
}

function primaryProviderAttempts(attempts: Attempt[]) {
  const attempted = attempts.filter((item) => item.attempted);
  const gatewayAttempts = attempted.filter((item) => item.provider.startsWith("vercel_ai_gateway"));
  if (gatewayAttempts.length) return gatewayAttempts;

  const pantavion = attempted.filter((item) => item.provider === "pantavion_speech_provider");
  if (pantavion.length) return pantavion;

  const directOpenAi = attempted.filter((item) => item.provider.startsWith("openai_audio"));
  if (directOpenAi.length) return directOpenAi;

  return attempted;
}

function publicFailureCode(attempts: Attempt[]) {
  const failed = primaryProviderAttempts(attempts).filter((item) => !item.ok);
  if (!failed.length) return "STT_PROVIDER_UNAVAILABLE";
  if (failed.some((item) => item.code === "oidc_token_unavailable")) {
    return "STT_OIDC_TOKEN_UNAVAILABLE";
  }
  if (failed.some((item) => item.status === 401 || item.status === 403)) {
    return "STT_AUTH_FAILED";
  }
  if (failed.some((item) => item.status === 402 || item.status === 429)) {
    return "STT_QUOTA_OR_RATE_LIMIT";
  }
  if (failed.some((item) => [400, 415, 422].includes(item.status || 0))) {
    return "STT_AUDIO_FORMAT_REJECTED";
  }
  if (failed.some((item) => item.status === 404)) {
    return "STT_MODEL_OR_ENDPOINT_UNAVAILABLE";
  }
  if (failed.some((item) => (item.status || 0) >= 500)) {
    return "STT_PROVIDER_TEMPORARY_FAILURE";
  }
  if (failed.some((item) => item.code === "network_or_timeout")) {
    return "STT_NETWORK_OR_TIMEOUT";
  }
  return "STT_PROVIDER_UNAVAILABLE";
}

function statusFromError(error: unknown) {
  const maybe = error as { statusCode?: number; status?: number; response?: { status?: number } };
  return maybe?.statusCode || maybe?.status || maybe?.response?.status;
}

function codeFromError(error: unknown) {
  const maybe = error as { code?: string; name?: string };
  const raw = String(maybe?.code || maybe?.name || "").trim();
  return raw.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 80) || "provider_error";
}

async function gatewayRuntimeAvailable() {
  if (process.env.AI_GATEWAY_API_KEY) return true;
  try {
    return Boolean(await getVercelOidcToken());
  } catch {
    return false;
  }
}

async function transcribeWithVercelAiGateway(
  audio: File,
  attempts: Attempt[],
): Promise<SpeechResult | null> {
  if (!(await gatewayRuntimeAvailable())) {
    attempts.push({
      provider: "vercel_ai_gateway",
      attempted: true,
      ok: false,
      code: "oidc_token_unavailable",
    });
    return null;
  }

  const requested = process.env.PANTAVION_SPEECH_TO_TEXT_GATEWAY_MODEL;
  const models = Array.from(
    new Set(
      [
        requested,
        "openai/gpt-4o-mini-transcribe",
        "openai/gpt-4o-transcribe",
        "openai/whisper-1",
      ].filter((value): value is string => Boolean(value)),
    ),
  );

  const audioBuffer = Buffer.from(await audio.arrayBuffer());

  for (const model of models) {
    const provider = `vercel_ai_gateway:${model}`;
    try {
      const result = await transcribe({
        model: gateway.transcriptionModel(model),
        audio: audioBuffer,
      });
      const text = String(result.text || "").trim();
      attempts.push({ provider, attempted: true, ok: Boolean(text) });
      if (text) return { ok: true, text, provider };
    } catch (error) {
      attempts.push({
        provider,
        attempted: true,
        ok: false,
        status: statusFromError(error),
        code: codeFromError(error),
      });
    }
  }

  return null;
}

async function transcribeWithPantavionEndpoint(
  audio: File,
  language: string,
  attempts: Attempt[],
): Promise<SpeechResult | null> {
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
    process.env.PANTAVION_SPEECH_TO_TEXT_API_KEY || process.env.PANTAVION_TRANSLATE_API_KEY;
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
    attempts.push({
      provider: "pantavion_speech_provider",
      attempted: true,
      ok: response.ok && Boolean(text),
      status: response.status,
      code: safeCode(payload),
    });
    if (!response.ok || !text) return null;
    return { ok: true, text, provider: "pantavion_speech_provider" };
  } catch {
    attempts.push({
      provider: "pantavion_speech_provider",
      attempted: true,
      ok: false,
      code: "network_or_timeout",
    });
    return null;
  }
}

async function transcribeWithOpenAI(
  audio: File,
  language: string,
  attempts: Attempt[],
): Promise<SpeechResult | null> {
  const enabled = process.env.PANTAVION_ENABLE_DIRECT_OPENAI_STT === "true";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!enabled || !apiKey) return null;

  const requestedModel =
    process.env.PANTAVION_SPEECH_TO_TEXT_MODEL || "gpt-4o-mini-transcribe";
  const models = Array.from(new Set([requestedModel, "whisper-1"]));

  for (const model of models) {
    const provider = `openai_audio:${model}`;
    try {
      const form = new FormData();
      form.append("file", audio, audio.name || "pantavion-voice.webm");
      form.append("model", model);
      form.append("response_format", "json");
      const baseLanguage = language.toLowerCase().split("-")[0];
      if (/^[a-z]{2}$/.test(baseLanguage)) form.append("language", baseLanguage);

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(30_000),
      });
      const payload = await response.json().catch(() => ({}));
      const text = textFromPayload(payload);
      attempts.push({
        provider,
        attempted: true,
        ok: response.ok && Boolean(text),
        status: response.status,
        code: safeCode(payload),
      });
      if (response.ok && text) return { ok: true, text, provider };
      if (response.status === 401 || response.status === 403) break;
    } catch {
      attempts.push({
        provider,
        attempted: true,
        ok: false,
        code: "network_or_timeout",
      });
    }
  }
  return null;
}

async function finalizeAccessibleTranscript(result: SpeechResult, language: string) {
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
  const gatewayAvailable = await gatewayRuntimeAvailable();
  const directOpenAiEnabled =
    process.env.PANTAVION_ENABLE_DIRECT_OPENAI_STT === "true" && Boolean(process.env.OPENAI_API_KEY);

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
      gatewayAvailable || process.env.PANTAVION_SPEECH_TO_TEXT_ENDPOINT || directOpenAiEnabled,
    ),
    gatewayRuntimeAvailable: gatewayAvailable,
    gatewayPreferred: true,
    gatewayTransport: "ai-sdk-transcribe",
    directOpenAiFallbackEnabled: directOpenAiEnabled,
  });
}

export async function POST(request: Request) {
  const attempts: Attempt[] = [];
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ ok: false, error: "Invalid audio form data." }, { status: 400 });
  }

  const audio = form.get("audio");
  const language = String(form.get("language") || "auto").trim() || "auto";
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ ok: false, error: "Missing audio recording." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ ok: false, error: "Audio recording is too large." }, { status: 413 });
  }

  const gatewayResult = await transcribeWithVercelAiGateway(audio, attempts);
  if (gatewayResult) {
    return NextResponse.json(await finalizeAccessibleTranscript(gatewayResult, language));
  }

  const pantavionResult = await transcribeWithPantavionEndpoint(audio, language, attempts);
  if (pantavionResult) {
    return NextResponse.json(await finalizeAccessibleTranscript(pantavionResult, language));
  }

  const openAiResult = await transcribeWithOpenAI(audio, language, attempts);
  if (openAiResult) {
    return NextResponse.json(await finalizeAccessibleTranscript(openAiResult, language));
  }

  const publicCode = publicFailureCode(attempts);
  return NextResponse.json(
    {
      ok: false,
      error: `Η φωνή καταγράφηκε, αλλά η υπηρεσία αναγνώρισης φωνής δεν ολοκλήρωσε τη μεταγραφή. Κωδικός: ${publicCode}.`,
      code: "speech_provider_unavailable",
      publicCode,
    },
    { status: 503 },
  );
}
