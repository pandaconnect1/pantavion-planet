import {
  globalEmergencyLanguages,
  normalizeGlobalEmergencyLanguage,
  type GlobalEmergencyLanguage,
  type GlobalEmergencyLanguageMeta,
} from "../emergency/global-emergency-languages";

export const pantavionNaturalLanguageUniverseId =
  "pantavion_natural_language_universe_v1";

export const pantavionNaturalLanguageUniverse = {
  id: pantavionNaturalLanguageUniverseId,
  doctrine:
    "Pantavion translation is a platform kernel, not an SOS-only feature. It is designed for the full natural-language universe of humanity, with a practical selectable catalog now and provider routing as coverage grows.",
  targetNaturalLanguageCount: 7000,
  practicalWorldMenuMinimum: 250,
  currentPracticalLanguages: globalEmergencyLanguages,
  truthBoundary:
    "Pantavion can preserve a 7000+ natural-language target, but real live speech/text support depends on configured providers, model coverage, region, latency, cost, and safety policy.",
  usageSurfaces: [
    "panta_translate_main",
    "sos_orange_emergency_interpreter",
    "elder_simple_interpreter",
    "social_chat_translation",
    "voice_call_translation",
    "video_subtitle_translation",
    "travel_interpreter",
    "work_interpreter",
    "camera_sign_menu_document_scan",
    "accessibility_audio_subtitles",
    "public_pantaai_translation",
    "per_user_ai_assistant_language_memory"
  ]
} as const;

export type PantavionNaturalLanguageCode = GlobalEmergencyLanguage;
export type PantavionNaturalLanguageMeta = GlobalEmergencyLanguageMeta;

export const pantavionPracticalLanguageMenu = globalEmergencyLanguages;

export function normalizePantavionNaturalLanguage(
  language?: string | null
): PantavionNaturalLanguageCode {
  return normalizeGlobalEmergencyLanguage(language);
}

export function getPantavionPracticalLanguageMenu() {
  return pantavionPracticalLanguageMenu;
}
