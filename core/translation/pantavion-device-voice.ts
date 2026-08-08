export type PantavionVoiceCandidate = {
  lang: string;
  default?: boolean;
  localService?: boolean;
};

function languageBase(value: string) {
  return value.trim().toLowerCase().split("-")[0];
}

export function normalizePantavionSpeechLanguage(code: string, preferred?: string) {
  const cleanPreferred = String(preferred || "").trim();
  if (cleanPreferred) return cleanPreferred;
  return String(code || "en").trim() || "en";
}

export function choosePantavionDeviceVoice<T extends PantavionVoiceCandidate>(
  voices: readonly T[],
  languageCode: string,
  preferredLocale?: string,
): T | null {
  if (!voices.length) return null;

  const preferred = normalizePantavionSpeechLanguage(languageCode, preferredLocale).toLowerCase();
  const preferredBase = languageBase(preferred);
  const codeBase = languageBase(languageCode);

  return (
    voices.find((voice) => voice.lang.toLowerCase() === preferred) ||
    voices.find((voice) => languageBase(voice.lang) === preferredBase && voice.localService) ||
    voices.find((voice) => languageBase(voice.lang) === preferredBase) ||
    voices.find((voice) => languageBase(voice.lang) === codeBase && voice.localService) ||
    voices.find((voice) => languageBase(voice.lang) === codeBase) ||
    null
  );
}

export const pantavionDeviceVoicePolicy = {
  id: "pantavion_device_voice_global_v1",
  useDeviceVoicesDynamically: true,
  neverLimitWorldCatalogToManualLocaleMap: true,
  fallbackToLanguageCode: true,
  fallbackToServerSpeechRuntime: true,
} as const;
