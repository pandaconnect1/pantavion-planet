import { NextResponse } from "next/server";
import { getVercelOidcToken } from "@vercel/oidc";
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

function normalizeGatewayMediaType(rawMimeType: string) {
  const base = String(rawMimeType || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();

  if (!base) return "audio/webm";
  if (base === "audio/x-m4a" || base === "audio/m4a") return "audio/mp4";
  if (base === "audio/mp3" || base === "audio/mpga") return "audio/mpeg";
  if (base === "audio/x-wav" || base === "audio/wave") return "audio/wav";
  if (base === "video/webm") return "audio/webm";

  const allowed = new Set([
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
    "audio/mpeg",
    "audio/wav",
    "audio/flac",
  ]);
  return allowed.has(base) ? base : "audio/webm";
}

function primaryProviderAttempts(attempts: Attempt[]) {
  const attempted = attempts.filter((item) => item.attempted);
  const gateway = attempted.filter((item) => item.provider.startsWith("vercel_ai_gateway"));
  if (gateway.length) return gateway;

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

async function resolveGatewayCredentials(attempts?: Attempt[]) {
  const credentials: Array<[string, string]> = [];

  try {
    const oidcToken = await getVercelOidcToken();
    if (oidcToken) credentials.push(["vercel_oidc_helper", oidcToken]);
    else if (attempts) {
      attempts.push({
        provider: "vercel_ai_gateway:oidc_helper",
        attempted: true,
        ok: false,
        code: "oidc_token_unavailable",
      });
    }
  } catch {
    if (attempts) {
      attempts.push({
        provider: "vercel_ai_gateway:oidc_helper",
        attempted: true,
        ok: false,
        code: "oidc_token_unavailable",
      });
    }
  }

  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  if (gatewayKey) credentials.push(["ai_gateway_key", gatewayKey]);

  const deduped = new Map<string, [string, string]>();
  for (const entry of credentials) {
    if (!deduped.has(entry[1])) deduped.set(entry[1], entry);
  }
  return Array.from(deduped.values());
}

async function transcribeWithVercelAiGateway(
  audio: File,
  attempts: Attempt[],
): Promise<SpeechResult | null> {
  const credentials = await resolveGatewayCredentials(attempts);
  if (!credentials.length) return null;

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
  const audioBase64 = Buffer.from(await audio.arrayBuffer()).toString("base64");
  const mediaType = normalizeGatewayMediaType(audio.type || "audio/webm");

  for (const [credentialName, token] of credentials) {
    for (const model of models) {
      const provider = `vercel_ai_gateway:${credentialName}:${model}`;
      try {
        const response = await fetch("https://ai-gateway.vercel.sh/v4/ai/transcription-model", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "ai-model-id": model,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio: audioBase64,
            mediaType,
          }),
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
        if (response.ok && text) {
          return { ok: true, text, provider: `vercel_ai_gateway:${model}` };
        }
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
  const gatewayCredentials = await resolveGatewayCredentials();
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
      gatewayCredentials.length || process.env.PANTAVION_SPEECH_TO_TEXT_ENDPOINT || directOpenAiEnabled,
    ),
    gatewayRuntimeAvailable: gatewayCredentials.length > 0,
    gatewayPreferred: true,
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
