export const globalEmergencyLanguages = [
  { code: "en", label: "English" },
  { code: "el", label: "λληνικά" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "tr", label: "Türkçe" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ur", label: "اردو" },
  { code: "fa", label: "فارسی" },
  { code: "he", label: "עברית" },
  { code: "sw", label: "Kiswahili" },
  { code: "am", label: "አማርኛ" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
  { code: "zu", label: "isiZulu" },
  { code: "af", label: "Afrikaans" },
  { code: "nl", label: "Nederlands" },
  { code: "sv", label: "Svenska" },
  { code: "no", label: "Norsk" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
  { code: "pl", label: "Polski" },
  { code: "uk", label: "Українська" },
  { code: "ro", label: "Română" },
  { code: "bg", label: "Български" },
  { code: "sr", label: "Српски" },
  { code: "hr", label: "Hrvatski" },
  { code: "cs", label: "Čeština" },
  { code: "sk", label: "Slovenčina" },
  { code: "hu", label: "Magyar" },
  { code: "sq", label: "Shqip" },
  { code: "mk", label: "Македонски" },
  { code: "sl", label: "Slovenščina" },
  { code: "lt", label: "Lietuvių" },
  { code: "lv", label: "Latviešu" },
  { code: "et", label: "Eesti" },
  { code: "ka", label: "ქართული" },
  { code: "hy", label: "Հայերեն" },
  { code: "az", label: "Azərbaycanca" },
  { code: "kk", label: "Қазақша" },
  { code: "uz", label: "O‘zbek" },
  { code: "mn", label: "Монгол" },
  { code: "ko", label: "한국어" },
  { code: "th", label: "ไทย" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "fil", label: "Filipino" },
  { code: "my", label: "မြန်မာ" },
  { code: "km", label: "ខ្មែរ" },
  { code: "lo", label: "ລາວ" },
  { code: "si", label: "සිංහල" },
  { code: "ne", label: "नेपाली" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "ml", label: "മലയാളം" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "cy", label: "Cymraeg" },
  { code: "ga", label: "Gaeilge" },
  { code: "is", label: "Íslenska" },
  { code: "mt", label: "Malti" },
  { code: "ca", label: "Català" },
  { code: "eu", label: "Euskara" },
  { code: "gl", label: "Galego" },
] as const;

export type GlobalEmergencyLanguage =
  (typeof globalEmergencyLanguages)[number]["code"];

export const globalEmergencyLanguageCodes = globalEmergencyLanguages.map(
  (language) => language.code
) as GlobalEmergencyLanguage[];

const globalEmergencyLanguageAliases: Record<string, GlobalEmergencyLanguage> = {
  "pt-br": "pt",
  "pt-pt": "pt",
  "zh-cn": "zh",
  "zh-hans": "zh",
  "zh-hant": "zh",
  "zh-tw": "zh",
  "nb": "no",
  "nn": "no",
  "iw": "he",
  "tl": "fil",
};

export function normalizeGlobalEmergencyLanguage(
  language?: string | null
): GlobalEmergencyLanguage {
  const value = (language ?? "en").toLowerCase();

  if (value in globalEmergencyLanguageAliases) {
    return globalEmergencyLanguageAliases[value];
  }

  const base = value.split("-")[0];

  if (base in globalEmergencyLanguageAliases) {
    return globalEmergencyLanguageAliases[base];
  }

  const direct = globalEmergencyLanguageCodes.find(
    (code) => value === code || value.startsWith(code + "-")
  );

  return direct ?? "en";
}
