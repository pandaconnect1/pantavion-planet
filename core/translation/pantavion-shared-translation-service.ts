import {
  buildPantavionTranslationPrompt,
  type PantavionTranslationDomain,
} from "./pantavion-universal-translation-runtime";
import { translateWithPantavionProvider } from "./pantavion-translation-provider-adapters";
import { translateWithPantavionPublicTextFallback } from "./pantavion-public-text-fallback";
import {
  normalizeTranslationRequest,
  type PantavionTranslationMode,
  type PantavionTranslationResult,
} from "./pantavion-translation-provider-router";

export const PANTAVION_SHARED_TRANSLATION_SERVICE_ID =
  "pantavion_shared_translation_service_v1" as const;

export type PantavionTranslationSurface =
  | "panta_translate"
  | "social"
  | "chat"
  | "voice"
  | "video"
  | "group_room"
  | "business"
  | "sos";

export type PantavionSharedTranslationInput = {
  text: string;
  sourceLanguage?: string | null;
  targetLanguage: string;
  surface: PantavionTranslationSurface;
  mode?: PantavionTranslationMode;
  sessionId?: string | null;
  domain?: PantavionTranslationDomain;
  tone?: "natural" | "formal" | "simple" | "professional" | "local_demotic";
  bidirectional?: boolean;
};

export type PantavionSharedTranslationResult = PantavionTranslationResult & {
  surface: PantavionTranslationSurface;
  sharedRuntime: typeof PANTAVION_SHARED_TRANSLATION_SERVICE_ID;
  generatedAt: string;
};

const SHARED_SURFACES: readonly PantavionTranslationSurface[] = [
  "panta_translate",
  "social",
  "chat",
  "voice",
  "video",
  "group_room",
  "business",
  "sos",
] as const;

export function normalizePantavionTranslationSurface(
  value: unknown,
): PantavionTranslationSurface {
  return typeof value === "string" &&
    SHARED_SURFACES.includes(value as PantavionTranslationSurface)
    ? (value as PantavionTranslationSurface)
    : "panta_translate";
}

function withSharedMetadata(
  result: PantavionTranslationResult,
  surface: PantavionTranslationSurface,
): PantavionSharedTranslationResult {
  return {
    ...result,
    surface,
    sharedRuntime: PANTAVION_SHARED_TRANSLATION_SERVICE_ID,
    generatedAt: new Date().toISOString(),
  };
}

async function translateWithOpenAI(
  input: PantavionSharedTranslationInput,
): Promise<PantavionTranslationResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const normalized = normalizeTranslationRequest({
    text: input.text,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    mode: input.mode ?? "text",
    sessionId: input.sessionId ?? null,
  });

  try {
    const prompt = buildPantavionTranslationPrompt({
      text: normalized.inputText,
      sourceLanguage:
        normalized.sourceLanguage === "auto" ? undefined : normalized.sourceLanguage,
      targetLanguage: normalized.targetLanguage,
      domain: input.domain ?? (input.surface === "social" || input.surface === "chat" ? "social" : "general"),
      tone: input.tone ?? "natural",
      bidirectional: input.bidirectional ?? true,
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.PANTAVION_TRANSLATION_MODEL || "gpt-4.1-mini",
        input: prompt,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const payload = await response.json().catch(() => ({}));
    const translatedText =
      payload.output_text ||
      payload.output
        ?.flatMap((item: any) => item.content || [])
        ?.map((content: any) => content.text || "")
        ?.join("\n")
        ?.trim() ||
      "";

    if (!response.ok || !translatedText) return null;

    return {
      ok: true,
      status: "translated",
      sourceLanguage: normalized.sourceLanguage,
      targetLanguage: normalized.targetLanguage,
      inputText: normalized.inputText,
      translatedText,
      provider: "openai_responses",
      providerRequired: false,
      message: "Translated through Pantavion shared OpenAI provider.",
    };
  } catch {
    return null;
  }
}

export async function translateWithPantavionSharedService(
  input: PantavionSharedTranslationInput,
): Promise<PantavionSharedTranslationResult> {
  const request = {
    text: input.text,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    mode: input.mode ?? "text",
    sessionId: input.sessionId ?? null,
  };

  const openAiResult = await translateWithOpenAI(input);
  if (openAiResult?.ok && openAiResult.translatedText.trim()) {
    return withSharedMetadata(openAiResult, input.surface);
  }

  const configuredResult = await translateWithPantavionProvider(request).catch(() => null);
  if (configuredResult?.ok && configuredResult.translatedText.trim()) {
    return withSharedMetadata(configuredResult, input.surface);
  }

  const publicFallback = await translateWithPantavionPublicTextFallback(request);
  return withSharedMetadata(publicFallback, input.surface);
}

export const pantavionSharedTranslationCapabilities = {
  id: PANTAVION_SHARED_TRANSLATION_SERVICE_ID,
  surfaces: SHARED_SURFACES,
  oneEngineAcrossPlatform: true,
  groupTranslationReady: true,
  preserveOriginalText: true,
  textTranslation: true,
  speechInputUsesClientOrConfiguredProvider: true,
  speechOutputUsesClientOrConfiguredProvider: true,
} as const;
