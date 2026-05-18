import {
  normalizePantavionNaturalLanguage,
  type PantavionNaturalLanguageCode,
} from "./pantavion-natural-language-universe";

export type PantavionTranslationMode =
  | "text"
  | "speech"
  | "camera"
  | "subtitle"
  | "same_phone"
  | "two_device"
  | "social"
  | "sos"
  | "elder";

export type PantavionTranslationRequest = {
  text: string;
  sourceLanguage?: string | null;
  targetLanguage?: string | null;
  mode?: PantavionTranslationMode;
  sessionId?: string | null;
};

export type PantavionTranslationResult = {
  ok: boolean;
  status: "translated" | "provider_pending" | "empty_input" | "provider_error";
  sourceLanguage: PantavionNaturalLanguageCode | "auto";
  targetLanguage: PantavionNaturalLanguageCode;
  inputText: string;
  translatedText: string;
  provider: string;
  providerRequired: boolean;
  message: string;
};

export type NormalizedPantavionTranslationRequest = {
  inputText: string;
  sourceLanguage: PantavionNaturalLanguageCode | "auto";
  targetLanguage: PantavionNaturalLanguageCode;
  mode: PantavionTranslationMode;
  sessionId: string | null;
};

export function normalizeTranslationRequest(
  request: PantavionTranslationRequest
): NormalizedPantavionTranslationRequest {
  const inputText = String(request.text ?? "").trim();

  const sourceLanguage: PantavionNaturalLanguageCode | "auto" =
    !request.sourceLanguage || request.sourceLanguage === "auto"
      ? "auto"
      : normalizePantavionNaturalLanguage(request.sourceLanguage);

  const targetLanguage: PantavionNaturalLanguageCode =
    normalizePantavionNaturalLanguage(request.targetLanguage || "en");

  return {
    inputText,
    sourceLanguage,
    targetLanguage,
    mode: request.mode ?? "text",
    sessionId: request.sessionId ?? null,
  };
}

export function createProviderPendingTranslationResult(
  request: PantavionTranslationRequest
): PantavionTranslationResult {
  const normalized = normalizeTranslationRequest(request);

  return {
    ok: false,
    status: normalized.inputText ? "provider_pending" : "empty_input",
    sourceLanguage: normalized.sourceLanguage,
    targetLanguage: normalized.targetLanguage,
    inputText: normalized.inputText,
    translatedText: "",
    provider: "provider_not_configured",
    providerRequired: true,
    message: normalized.inputText
      ? "PantaTranslate is ready, but no live translation provider is configured yet."
      : "Text is empty.",
  };
}

export const pantavionTranslationProviderRouter = {
  id: "pantavion_translation_provider_router_v1",
  providerEnvKeys: [
    "PANTAVION_TRANSLATE_ENDPOINT",
    "PANTAVION_TRANSLATE_API_KEY",
    "PANTAVION_SPEECH_TO_TEXT_PROVIDER",
    "PANTAVION_TEXT_TO_SPEECH_PROVIDER",
    "PANTAVION_OCR_PROVIDER",
  ],
  routeBy: [
    "language_pair",
    "mode",
    "latency",
    "cost",
    "jurisdiction",
    "accessibility_need",
    "emergency_context",
    "provider_availability",
  ],
  fallbackOrder: [
    "live_provider",
    "text_fallback",
    "large_text_cards",
    "saved_phrase_pack",
    "provider_pending_truth_state",
  ],
} as const;
