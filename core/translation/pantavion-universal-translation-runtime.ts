export type PantavionTranslationDomain =
  | "general"
  | "social"
  | "professional"
  | "medical"
  | "legal"
  | "scientific"
  | "emergency"
  | "education"
  | "travel"
  | "technical";

export type PantavionTranslationRequest = {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  domain?: PantavionTranslationDomain;
  tone?: "natural" | "formal" | "simple" | "professional" | "local_demotic";
  bidirectional?: boolean;
};

export const pantavionUniversalTranslationContract = {
  id: "pantavion_universal_translation_runtime_v1",
  apiRoute: "/api/pantavion/translate",
  liveRoute: "/pantavion/translate-live",
  truth:
    "Pantavion translation runtime accepts any user-requested human language label and domain context. Perfect translation is not guaranteed. Live provider execution requires OPENAI_API_KEY or another approved provider adapter.",
  nonNegotiables: [
    "No fake perfect translation claim",
    "No medical/legal replacement claim",
    "No provider claim without provider key",
    "Support user-chosen language labels beyond fixed catalogs",
    "Preserve domain context: medical, legal, professional, scientific, emergency, social, local demotic speech",
  ],
} as const;

export function buildPantavionTranslationPrompt(request: PantavionTranslationRequest) {
  return [
    "You are Pantavion Universal Interpreter.",
    "Translate accurately, naturally, and safely.",
    "Respect the requested target language, dialect, register, and domain.",
    "If the text contains medical/legal/emergency content, translate faithfully and add no diagnosis or legal advice.",
    "",
    `Source language: ${request.sourceLanguage || "auto-detect"}`,
    `Target language: ${request.targetLanguage}`,
    `Domain: ${request.domain || "general"}`,
    `Tone/register: ${request.tone || "natural"}`,
    `Bidirectional support: ${request.bidirectional ? "yes" : "no"}`,
    "",
    "Text:",
    request.text,
  ].join("\n");
}

export function createProviderPendingTranslation(request: PantavionTranslationRequest) {
  return {
    ok: false,
    status: "provider_required",
    contract: pantavionUniversalTranslationContract,
    input: request,
    translatedText: "",
    detectedSourceLanguage: request.sourceLanguage || "auto-detect-provider-pending",
    targetLanguage: request.targetLanguage,
    warning:
      "No live translation provider is configured. Add OPENAI_API_KEY or approved translation provider credentials to enable real runtime translation.",
    generatedAt: new Date().toISOString(),
  };
}
