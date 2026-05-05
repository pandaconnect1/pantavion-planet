import {
  PANTAVION_LANGUAGE_ATLAS_DOCTRINE,
  getPantavionLanguageLabel,
  type PantavionLanguageModality,
} from "../language/pantavion-language-atlas";

export type PantavionInterpreterSurface =
  | "global"
  | "sos"
  | "elder"
  | "social"
  | "travel"
  | "work"
  | "accessibility"
  | "camera"
  | "subtitle";

export type PantavionInterpreterMode =
  | "auto-bidirectional"
  | "manual-helper-language"
  | "sos-safe"
  | "elder-simple"
  | "social-chat"
  | "travel-natural"
  | "camera-text"
  | "accessibility-subtitles";

export interface PantavionTranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  mode: PantavionInterpreterMode;
  surface: PantavionInterpreterSurface;
  outputStyle?: "natural" | "literal" | "emergency" | "formal" | "simple";
  userContext?: string;
}

export const PANTAVION_UNIVERSAL_INTERPRETER_LOCK = {
  marker: "PANTAVION_UNIVERSAL_INTERPRETER_V1",
  independentFromSos: true,
  sharedWithSos: true,
  homepageRoute: "/translate",
  sosMayReuse: true,
  elderMayReuse: true,
  defaultUserLanguageMeaning: "The user's UI/page language.",
  defaultSecondLanguageMeaning:
    "Automatic speech language detection first; manual helper language is backup for nurse, doctor, taxi, public service, assistant, worker, tourist, friend.",
  requiredModes: [
    "auto-bidirectional",
    "manual-helper-language",
    "sos-safe",
    "elder-simple",
    "social-chat",
    "travel-natural",
    "camera-text",
    "accessibility-subtitles",
  ] satisfies PantavionInterpreterMode[],
  requiredModalities: [
    "text",
    "speech",
    "camera",
    "subtitle",
    "social",
    "sos",
    "elder",
    "travel",
    "work",
  ] satisfies PantavionLanguageModality[],
} as const;

export function createPantavionTranslationPrompt(request: PantavionTranslationRequest): string {
  const source = getPantavionLanguageLabel(request.sourceLanguage);
  const target = getPantavionLanguageLabel(request.targetLanguage);
  const outputStyle = request.outputStyle ?? "natural";

  return [
    "You are Pantavion Universal Interpreter.",
    "Translate as a natural human interpreter, not as a dictionary.",
    "Preserve meaning, intent, urgency, politeness, names, numbers, addresses, prices, dates, medical words, and safety-critical details.",
    "If source is automatic detection, detect the language before translating.",
    "If the input is unclear, produce the best safe translation and mark uncertainty briefly.",
    "For SOS or elder mode: use short, clear, safe phrases. Do not diagnose. Do not claim emergency dispatch.",
    "For social/travel mode: make the translation natural for real human conversation.",
    "For camera mode: read visible text first, then translate it.",
    `Source language: ${source}.`,
    `Target language: ${target}.`,
    `Mode: ${request.mode}.`,
    `Surface: ${request.surface}.`,
    `Output style: ${outputStyle}.`,
    request.userContext ? `User context: ${request.userContext}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function createPantavionInterpreterAdminSummary() {
  return {
    lock: PANTAVION_UNIVERSAL_INTERPRETER_LOCK.marker,
    independentRoute: PANTAVION_UNIVERSAL_INTERPRETER_LOCK.homepageRoute,
    languageAtlas: PANTAVION_LANGUAGE_ATLAS_DOCTRINE.marker,
    globalInitialCoverageMinimum: PANTAVION_LANGUAGE_ATLAS_DOCTRINE.globalInitialCoverageMinimum,
    supports7000NaturalLanguages: PANTAVION_LANGUAGE_ATLAS_DOCTRINE.supports7000NaturalLanguages,
  };
}
