
export type PantavionLanguageTier =
  | "full-ui"
  | "emergency-ready"
  | "identity-ready"
  | "future-community";

export type PantavionContinent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania"
  | "Global";

export type PantavionLanguage = {
  code: string;
  label: string;
  englishName: string;
  continent: PantavionContinent;
  tier: PantavionLanguageTier;
  rtl?: boolean;
  emergencyReady?: boolean;
};

export const PANTAVION_LANGUAGE_STORAGE_KEY = "pantavion-language";

const rows: readonly PantavionLanguage[] = [
  { code: "el", label: "Ελληνικά", englishName: "Greek", continent: "Europe", tier: "full-ui", emergencyReady: true },
  { code: "en", label: "English", englishName: "English", continent: "Global", tier: "full-ui", emergencyReady: true },
  { code: "es", label: "Español", englishName: "Spanish", continent: "South America", tier: "full-ui", emergencyReady: true },
  { code: "fr", label: "Français", englishName: "French", continent: "Europe", tier: "full-ui", emergencyReady: true },
  { code: "de", label: "Deutsch", englishName: "German", continent: "Europe", tier: "full-ui", emergencyReady: true },
  { code: "it", label: "Italiano", englishName: "Italian", continent: "Europe", tier: "emergency-ready", emergencyReady: true },
  { code: "pt", label: "Português", englishName: "Portuguese", continent: "South America", tier: "emergency-ready", emergencyReady: true },
  { code: "ar", label: "العربية", englishName: "Arabic", continent: "Asia", tier: "full-ui", rtl: true, emergencyReady: true },
  { code: "tr", label: "Türkçe", englishName: "Turkish", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "ru", label: "Русский", englishName: "Russian", continent: "Europe", tier: "emergency-ready", emergencyReady: true },
  { code: "zh", label: "中文", englishName: "Chinese", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "ja", label: "日本語", englishName: "Japanese", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "ko", label: "한국어", englishName: "Korean", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "hi", label: "हिन्दी", englishName: "Hindi", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "bn", label: "বাংলা", englishName: "Bengali", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "ur", label: "اردو", englishName: "Urdu", continent: "Asia", tier: "emergency-ready", rtl: true, emergencyReady: true },
  { code: "fa", label: "فارسی", englishName: "Persian", continent: "Asia", tier: "emergency-ready", rtl: true, emergencyReady: true },
  { code: "he", label: "עברית", englishName: "Hebrew", continent: "Asia", tier: "emergency-ready", rtl: true, emergencyReady: true },
  { code: "id", label: "Bahasa Indonesia", englishName: "Indonesian", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "ms", label: "Bahasa Melayu", englishName: "Malay", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "fil", label: "Filipino", englishName: "Filipino", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "vi", label: "Tiếng Việt", englishName: "Vietnamese", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "th", label: "ไทย", englishName: "Thai", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "sw", label: "Kiswahili", englishName: "Swahili", continent: "Africa", tier: "emergency-ready", emergencyReady: true },
  { code: "ha", label: "Hausa", englishName: "Hausa", continent: "Africa", tier: "emergency-ready", emergencyReady: true },
  { code: "yo", label: "Yorùbá", englishName: "Yoruba", continent: "Africa", tier: "emergency-ready", emergencyReady: true },
  { code: "ig", label: "Igbo", englishName: "Igbo", continent: "Africa", tier: "emergency-ready", emergencyReady: true },
  { code: "am", label: "አማርኛ", englishName: "Amharic", continent: "Africa", tier: "emergency-ready", emergencyReady: true },
  { code: "zu", label: "isiZulu", englishName: "Zulu", continent: "Africa", tier: "emergency-ready", emergencyReady: true },
  { code: "xh", label: "isiXhosa", englishName: "Xhosa", continent: "Africa", tier: "identity-ready" },
  { code: "af", label: "Afrikaans", englishName: "Afrikaans", continent: "Africa", tier: "emergency-ready", emergencyReady: true },
  { code: "nl", label: "Nederlands", englishName: "Dutch", continent: "Europe", tier: "emergency-ready", emergencyReady: true },
  { code: "pl", label: "Polski", englishName: "Polish", continent: "Europe", tier: "emergency-ready", emergencyReady: true },
  { code: "uk", label: "Українська", englishName: "Ukrainian", continent: "Europe", tier: "emergency-ready", emergencyReady: true },
  { code: "ro", label: "Română", englishName: "Romanian", continent: "Europe", tier: "emergency-ready", emergencyReady: true },
  { code: "cs", label: "Čeština", englishName: "Czech", continent: "Europe", tier: "identity-ready" },
  { code: "sv", label: "Svenska", englishName: "Swedish", continent: "Europe", tier: "identity-ready" },
  { code: "no", label: "Norsk", englishName: "Norwegian", continent: "Europe", tier: "identity-ready" },
  { code: "da", label: "Dansk", englishName: "Danish", continent: "Europe", tier: "identity-ready" },
  { code: "fi", label: "Suomi", englishName: "Finnish", continent: "Europe", tier: "identity-ready" },
  { code: "ca", label: "Català", englishName: "Catalan", continent: "Europe", tier: "identity-ready" },
  { code: "eu", label: "Euskara", englishName: "Basque", continent: "Europe", tier: "identity-ready" },
  { code: "gl", label: "Galego", englishName: "Galician", continent: "Europe", tier: "identity-ready" },
  { code: "sq", label: "Shqip", englishName: "Albanian", continent: "Europe", tier: "identity-ready" },
  { code: "sr", label: "Српски", englishName: "Serbian", continent: "Europe", tier: "identity-ready" },
  { code: "hr", label: "Hrvatski", englishName: "Croatian", continent: "Europe", tier: "identity-ready" },
  { code: "bg", label: "Български", englishName: "Bulgarian", continent: "Europe", tier: "identity-ready" },
  { code: "ka", label: "ქართული", englishName: "Georgian", continent: "Asia", tier: "identity-ready" },
  { code: "hy", label: "Հայերեն", englishName: "Armenian", continent: "Asia", tier: "identity-ready" },
  { code: "az", label: "Azərbaycan", englishName: "Azerbaijani", continent: "Asia", tier: "identity-ready" },
  { code: "kk", label: "Қазақша", englishName: "Kazakh", continent: "Asia", tier: "identity-ready" },
  { code: "uz", label: "Oʻzbekcha", englishName: "Uzbek", continent: "Asia", tier: "identity-ready" },
  { code: "ne", label: "नेपाली", englishName: "Nepali", continent: "Asia", tier: "identity-ready" },
  { code: "ta", label: "தமிழ்", englishName: "Tamil", continent: "Asia", tier: "emergency-ready", emergencyReady: true },
  { code: "te", label: "తెలుగు", englishName: "Telugu", continent: "Asia", tier: "identity-ready" },
  { code: "ml", label: "മലയാളം", englishName: "Malayalam", continent: "Asia", tier: "identity-ready" },
  { code: "kn", label: "ಕನ್ನಡ", englishName: "Kannada", continent: "Asia", tier: "identity-ready" },
  { code: "mr", label: "मराठी", englishName: "Marathi", continent: "Asia", tier: "identity-ready" },
  { code: "gu", label: "ગુજરાતી", englishName: "Gujarati", continent: "Asia", tier: "identity-ready" },
  { code: "pa", label: "ਪੰਜਾਬੀ", englishName: "Punjabi", continent: "Asia", tier: "identity-ready" },
  { code: "my", label: "မြန်မာ", englishName: "Burmese", continent: "Asia", tier: "identity-ready" },
  { code: "km", label: "ភាសាខ្មែរ", englishName: "Khmer", continent: "Asia", tier: "identity-ready" },
  { code: "lo", label: "ລາວ", englishName: "Lao", continent: "Asia", tier: "identity-ready" },
  { code: "si", label: "සිංහල", englishName: "Sinhala", continent: "Asia", tier: "identity-ready" },
  { code: "mn", label: "Монгол", englishName: "Mongolian", continent: "Asia", tier: "identity-ready" },
  { code: "ps", label: "پښتو", englishName: "Pashto", continent: "Asia", tier: "identity-ready", rtl: true },
  { code: "ku", label: "Kurdî", englishName: "Kurdish", continent: "Asia", tier: "identity-ready" },
  { code: "so", label: "Soomaali", englishName: "Somali", continent: "Africa", tier: "identity-ready" },
  { code: "rw", label: "Kinyarwanda", englishName: "Kinyarwanda", continent: "Africa", tier: "identity-ready" },
  { code: "rn", label: "Kirundi", englishName: "Kirundi", continent: "Africa", tier: "identity-ready" },
  { code: "mg", label: "Malagasy", englishName: "Malagasy", continent: "Africa", tier: "identity-ready" },
  { code: "st", label: "Sesotho", englishName: "Sesotho", continent: "Africa", tier: "identity-ready" },
  { code: "tn", label: "Setswana", englishName: "Tswana", continent: "Africa", tier: "identity-ready" },
  { code: "sn", label: "Shona", englishName: "Shona", continent: "Africa", tier: "identity-ready" },
  { code: "mi", label: "Māori", englishName: "Maori", continent: "Oceania", tier: "identity-ready" },
  { code: "sm", label: "Gagana Samoa", englishName: "Samoan", continent: "Oceania", tier: "identity-ready" },
  { code: "to", label: "Lea Faka-Tonga", englishName: "Tongan", continent: "Oceania", tier: "identity-ready" },
  { code: "fj", label: "Vosa Vakaviti", englishName: "Fijian", continent: "Oceania", tier: "identity-ready" },
  { code: "haw", label: "ʻŌlelo Hawaiʻi", englishName: "Hawaiian", continent: "Oceania", tier: "identity-ready" },
  { code: "qu", label: "Runasimi", englishName: "Quechua", continent: "South America", tier: "identity-ready" },
  { code: "ay", label: "Aymar aru", englishName: "Aymara", continent: "South America", tier: "identity-ready" },
  { code: "gn", label: "Avañe'ẽ", englishName: "Guarani", continent: "South America", tier: "identity-ready" },
  { code: "ht", label: "Kreyòl ayisyen", englishName: "Haitian Creole", continent: "North America", tier: "identity-ready" },
  { code: "iu", label: "ᐃᓄᒃᑎᑐᑦ", englishName: "Inuktitut", continent: "North America", tier: "identity-ready" },
  { code: "nv", label: "Diné bizaad", englishName: "Navajo", continent: "North America", tier: "identity-ready" }
];

export const pantavionLanguages = rows;

export function resolvePantavionLanguage(code: string | null | undefined): PantavionLanguage {
  return pantavionLanguages.find((item) => item.code === code) ?? pantavionLanguages[1];
}

export function isRtlLanguage(code: string | null | undefined): boolean {
  return Boolean(resolvePantavionLanguage(code).rtl);
}

export function getPantavionLanguageLabel(code: string | null | undefined): string {
  return resolvePantavionLanguage(code).label;
}

export const pantavionLanguageDoctrine = {
  storageKey: PANTAVION_LANGUAGE_STORAGE_KEY,
  rule: "One language selection follows the user across every Pantavion surface.",
  coverageGoal: "The registry starts with global seed coverage and expands toward all living human languages through verified phrase packs, community review and institutional validation.",
  fallbackRule: "If full UI translation is not ready, emergency-critical copy falls back to Greek or English without hiding the user's selected language."
} as const;
