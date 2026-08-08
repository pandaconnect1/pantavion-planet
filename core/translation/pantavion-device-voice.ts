export type PantavionVoiceCandidate = {
  lang: string;
  default?: boolean;
  localService?: boolean;
};

function languageBase(value: string) {
  return value.trim().toLowerCase().split("-")[0];
}

function likelyRegionLocale(code: string) {
  const cleanCode = String(code || "").trim();
  if (!cleanCode) return "";
  if (cleanCode.includes("-")) return cleanCode;

  try {
    if (typeof Intl !== "undefined" && "Locale" in Intl) {
      const maximized = new Intl.Locale(cleanCode).maximize();
      const language = maximized.language || cleanCode;
      const region = maximized.region;
      if (region) return `${language}-${region}`;
    }
  } catch {
    // Fall through to the language code. Some rare language tags are not known to Intl.Locale.
  }

  return cleanCode;
}

export function normalizePantavionSpeechLanguage(code: string, preferred?: string) {
  const cleanPreferred = String(preferred || "").trim();
  if (cleanPreferred) return cleanPreferred;

  const cleanCode = String(code || "en").trim() || "en";
  return likelyRegionLocale(cleanCode) || cleanCode;
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
  id: "pantavion_device_voice_global_v2",
  useDeviceVoicesDynamically: true,
  useIntlLikelyRegionForSpeechRecognition: true,
  neverLimitWorldCatalogToManualLocaleMap: true,
  fallbackToLanguageCode: true,
  fallbackToServerSpeechRuntime: true,
} as const;
