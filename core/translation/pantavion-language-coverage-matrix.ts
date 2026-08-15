import { globalEmergencyLanguages } from "../emergency/global-emergency-languages";
import { getPantavionLanguageRuntimeSnapshot } from "./pantavion-language-provider-runtime";
import { pantavionNaturalLanguageUniverse } from "./pantavion-natural-language-universe";

export type PantavionLanguageVerificationState =
  | "registered"
  | "unverified"
  | "pass"
  | "fail";

export type PantavionLanguageCoverageRow = {
  code: string;
  label: string;
  nativeLabel: string;
  direction: "ltr" | "rtl";
  registered: true;
  textTranslation: PantavionLanguageVerificationState;
  speechToText: PantavionLanguageVerificationState;
  textToSpeech: PantavionLanguageVerificationState;
  fullInterpreter: PantavionLanguageVerificationState;
  evidence: string[];
};

export type PantavionLanguageCoverageSnapshot = {
  id: "pantavion_language_coverage_matrix_v1";
  generatedAt: string;
  targetNaturalLanguageCount: number;
  registeredLanguageCount: number;
  verified: {
    textTranslationPass: number;
    speechToTextPass: number;
    textToSpeechPass: number;
    fullInterpreterPass: number;
  };
  runtime: {
    textTranslationAvailable: boolean;
    speechToTextAvailable: boolean;
    textToSpeechAvailable: boolean;
  };
  rows: PantavionLanguageCoverageRow[];
  truthBoundary: string;
};

function capabilityAvailable(
  capabilities: Awaited<ReturnType<typeof getPantavionLanguageRuntimeSnapshot>>["capabilities"],
  capability: "text_translation" | "speech_to_text" | "text_to_speech"
) {
  return capabilities.find((item) => item.capability === capability)?.available === true;
}

/**
 * Builds a truth-first coverage matrix.
 *
 * Runtime availability is NOT equivalent to language-level verification. A row
 * only moves from `unverified` to `pass` after a language-specific automated or
 * human acceptance result is recorded by a verification runner. This prevents
 * the 7,000-language product target from being presented as live coverage.
 */
export async function getPantavionLanguageCoverageSnapshot(): Promise<PantavionLanguageCoverageSnapshot> {
  const runtime = await getPantavionLanguageRuntimeSnapshot();
  const textTranslationAvailable = capabilityAvailable(runtime.capabilities, "text_translation");
  const speechToTextAvailable = capabilityAvailable(runtime.capabilities, "speech_to_text");
  const textToSpeechAvailable = capabilityAvailable(runtime.capabilities, "text_to_speech");

  const rows: PantavionLanguageCoverageRow[] = globalEmergencyLanguages.map((language) => ({
    code: language.code,
    label: language.label,
    nativeLabel: language.nativeLabel,
    direction: language.direction,
    registered: true,
    textTranslation: "unverified",
    speechToText: "unverified",
    textToSpeech: "unverified",
    fullInterpreter: "unverified",
    evidence: [
      "registered_in_global_language_catalog",
      ...(textTranslationAvailable ? ["text_runtime_available_not_language_verified"] : []),
      ...(speechToTextAvailable ? ["stt_runtime_available_not_language_verified"] : []),
      ...(textToSpeechAvailable ? ["tts_runtime_available_not_language_verified"] : []),
    ],
  }));

  return {
    id: "pantavion_language_coverage_matrix_v1",
    generatedAt: new Date().toISOString(),
    targetNaturalLanguageCount: pantavionNaturalLanguageUniverse.targetNaturalLanguageCount,
    registeredLanguageCount: rows.length,
    verified: {
      textTranslationPass: 0,
      speechToTextPass: 0,
      textToSpeechPass: 0,
      fullInterpreterPass: 0,
    },
    runtime: {
      textTranslationAvailable,
      speechToTextAvailable,
      textToSpeechAvailable,
    },
    rows,
    truthBoundary:
      "The 7000-language figure is a target, not a live-support claim. Registry presence and provider/runtime availability do not count as language verification. PASS requires language-specific evidence for the relevant capability; full Interpreter PASS requires STT + translation + TTS end-to-end evidence.",
  };
}
