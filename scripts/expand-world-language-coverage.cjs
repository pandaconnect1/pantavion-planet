const fs = require("fs");

const outPath = "core/emergency/global-emergency-languages.ts";

const languages = [
  // Global / Europe
  ["en", "English", "Global"],
  ["el", "λληνικά", "Europe"],
  ["es", "Español", "Europe / Americas"],
  ["fr", "Français", "Europe / Africa / Americas"],
  ["de", "Deutsch", "Europe"],
  ["it", "Italiano", "Europe"],
  ["pt", "Português", "Europe / Africa / Americas"],
  ["nl", "Nederlands", "Europe"],
  ["sv", "Svenska", "Europe"],
  ["no", "Norsk", "Europe"],
  ["da", "Dansk", "Europe"],
  ["fi", "Suomi", "Europe"],
  ["is", "Íslenska", "Europe"],
  ["ga", "Gaeilge", "Europe"],
  ["cy", "Cymraeg", "Europe"],
  ["mt", "Malti", "Europe"],
  ["ca", "Català", "Europe"],
  ["eu", "Euskara", "Europe"],
  ["gl", "Galego", "Europe"],
  ["lb", "Lëtzebuergesch", "Europe"],
  ["rm", "Rumantsch", "Europe"],
  ["pl", "Polski", "Europe"],
  ["cs", "Čeština", "Europe"],
  ["sk", "Slovenčina", "Europe"],
  ["sl", "Slovenščina", "Europe"],
  ["hr", "Hrvatski", "Europe"],
  ["bs", "Bosanski", "Europe"],
  ["sr", "Српски", "Europe"],
  ["mk", "Македонски", "Europe"],
  ["bg", "Български", "Europe"],
  ["ro", "Română", "Europe"],
  ["hu", "Magyar", "Europe"],
  ["sq", "Shqip", "Europe"],
  ["lt", "Lietuvių", "Europe"],
  ["lv", "Latviešu", "Europe"],
  ["et", "Eesti", "Europe"],
  ["uk", "Українська", "Europe"],
  ["be", "Беларуская", "Europe"],
  ["ru", "Русский", "Europe / Asia"],

  // Middle East / Central Asia / Caucasus
  ["ar", "العربية", "Africa / Asia"],
  ["he", "עברית", "Asia"],
  ["fa", "فارسی", "Asia"],
  ["ps", "پښتو", "Asia"],
  ["ku", "Kurdî", "Asia"],
  ["tr", "Türkçe", "Asia / Europe"],
  ["az", "Azərbaycanca", "Asia"],
  ["hy", "Հայերեն", "Asia"],
  ["ka", "ქართული", "Asia"],
  ["kk", "Қазақша", "Asia"],
  ["ky", "Кыргызча", "Asia"],
  ["tg", "Тоҷикӣ", "Asia"],
  ["tk", "Türkmençe", "Asia"],
  ["uz", "O‘zbek", "Asia"],
  ["ug", "ئۇيغۇرچە", "Asia"],
  ["mn", "Монгол", "Asia"],

  // South Asia
  ["hi", "हिन्दी", "Asia"],
  ["ur", "اردو", "Asia"],
  ["bn", "বাংলা", "Asia"],
  ["pa", "ਪੰਜਾਬੀ", "Asia"],
  ["gu", "ગુજરાતી", "Asia"],
  ["mr", "मराठी", "Asia"],
  ["ne", "नेपाली", "Asia"],
  ["si", "සිංහල", "Asia"],
  ["ta", "தமிழ்", "Asia"],
  ["te", "తెలుగు", "Asia"],
  ["kn", "ಕನ್ನಡ", "Asia"],
  ["ml", "മലയാളം", "Asia"],
  ["or", "ଓଡ଼ିଆ", "Asia"],
  ["as", "অসমীয়া", "Asia"],
  ["sd", "سنڌي", "Asia"],
  ["ks", "کٲشُر", "Asia"],
  ["mai", "मैथिली", "Asia"],
  ["bho", "भोजपुरी", "Asia"],
  ["sa", "संस्कृतम्", "Asia"],
  ["dz", "རྫོང་ཁ", "Asia"],
  ["bo", "བོད་ཡིག", "Asia"],

  // East / Southeast Asia
  ["zh", "中文", "Asia"],
  ["yue", "粵語", "Asia"],
  ["wuu", "吴语", "Asia"],
  ["ja", "日本語", "Asia"],
  ["ko", "한국어", "Asia"],
  ["vi", "Tiếng Việt", "Asia"],
  ["th", "ไทย", "Asia"],
  ["lo", "ລາວ", "Asia"],
  ["km", "ខ្មែរ", "Asia"],
  ["my", "မြန်မာ", "Asia"],
  ["id", "Bahasa Indonesia", "Asia"],
  ["ms", "Bahasa Melayu", "Asia"],
  ["fil", "Filipino", "Asia"],
  ["jv", "Basa Jawa", "Asia"],
  ["su", "Basa Sunda", "Asia"],
  ["mad", "Madhurâ", "Asia"],
  ["ceb", "Cebuano", "Asia"],
  ["ilo", "Ilokano", "Asia"],
  ["hmn", "Hmoob", "Asia"],
  ["mnw", "ဘာသာမန်", "Asia"],

  // Africa
  ["sw", "Kiswahili", "Africa"],
  ["am", "አማርኛ", "Africa"],
  ["ti", "ትግርኛ", "Africa"],
  ["om", "Afaan Oromoo", "Africa"],
  ["so", "Soomaali", "Africa"],
  ["ha", "Hausa", "Africa"],
  ["yo", "Yorùbá", "Africa"],
  ["ig", "Igbo", "Africa"],
  ["zu", "isiZulu", "Africa"],
  ["xh", "isiXhosa", "Africa"],
  ["st", "Sesotho", "Africa"],
  ["tn", "Setswana", "Africa"],
  ["ss", "siSwati", "Africa"],
  ["ve", "Tshivenḓa", "Africa"],
  ["ts", "Tsonga", "Africa"],
  ["sn", "ChiShona", "Africa"],
  ["rw", "Kinyarwanda", "Africa"],
  ["rn", "Kirundi", "Africa"],
  ["lg", "Luganda", "Africa"],
  ["ny", "Chichewa", "Africa"],
  ["ln", "Lingála", "Africa"],
  ["kg", "Kikongo", "Africa"],
  ["wo", "Wolof", "Africa"],
  ["ff", "Fulfulde", "Africa"],
  ["bm", "Bamanankan", "Africa"],
  ["ak", "Akan", "Africa"],
  ["tw", "Twi", "Africa"],
  ["ee", "Eʋegbe", "Africa"],
  ["kr", "Kanuri", "Africa"],
  ["ber", "Tamaziɣt", "Africa"],
  ["kab", "Taqbaylit", "Africa"],
  ["mg", "Malagasy", "Africa"],
  ["af", "Afrikaans", "Africa"],

  // Americas
  ["ht", "Kreyòl Ayisyen", "Americas"],
  ["qu", "Runasimi", "South America"],
  ["ay", "Aymar aru", "South America"],
  ["gn", "Avañe'ẽ", "South America"],
  ["nah", "Nāhuatl", "North America"],
  ["iu", "ᐃᓄᒃᑎᑐᑦ", "North America"],
  ["chr", "ᏣᎳᎩ", "North America"],
  ["lkt", "Lakȟótiyapi", "North America"],

  // Oceania
  ["mi", "Māori", "Oceania"],
  ["sm", "Gagana Samoa", "Oceania"],
  ["to", "Lea Faka-Tonga", "Oceania"],
  ["fj", "Vosa Vakaviti", "Oceania"],
  ["haw", "ʻŌlelo Hawaiʻi", "Oceania"],
  ["ty", "Reo Tahiti", "Oceania"],
  ["tpi", "Tok Pisin", "Oceania"],
  ["bi", "Bislama", "Oceania"],
];

const unique = [];
const seen = new Set();

for (const [code, label, region] of languages) {
  if (seen.has(code)) continue;
  seen.add(code);
  unique.push({ code, label, region });
}

const codeUnion = unique.map((language) => `  { code: ${JSON.stringify(language.code)}, label: ${JSON.stringify(language.label)}, region: ${JSON.stringify(language.region)} },`).join("\n");

const output = `export const globalEmergencyLanguages = [
${codeUnion}
] as const;

export type GlobalEmergencyLanguage =
  (typeof globalEmergencyLanguages)[number]["code"];

export const globalEmergencyLanguageCodes = globalEmergencyLanguages.map(
  (language) => language.code
) as GlobalEmergencyLanguage[];

export const globalEmergencyLanguageRegions = Array.from(
  new Set(globalEmergencyLanguages.map((language) => language.region))
);

const globalEmergencyLanguageAliases: Record<string, GlobalEmergencyLanguage> = {
  "pt-br": "pt",
  "pt-pt": "pt",
  "zh-cn": "zh",
  "zh-hans": "zh",
  "zh-hant": "zh",
  "zh-tw": "zh",
  "zh-hk": "yue",
  "zh-mo": "yue",
  "nb": "no",
  "nn": "no",
  "iw": "he",
  "tl": "fil",
  "in": "id",
  "jw": "jv",
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

export const globalEmergencyLanguageCoverageDoctrine = {
  currentScope:
    "Launch registry covers major global, official, regional, indigenous, and diaspora languages across Africa, Europe, Asia, the Americas, and Oceania.",
  longTermScope:
    "Pantavion must not be architecturally limited to this registry. The emergency language layer is designed to expand toward the thousands of natural languages through AI translation, community verification, institutional localization, and region-specific safety review.",
  fallbackRule:
    "If a language has no full professional emergency/legal localization yet, Pantavion must show the language in the registry where appropriate and use a safe verified fallback until professional localization exists.",
} as const;
`;

fs.writeFileSync(outPath, output, "utf8");

console.log(`World language coverage written: ${unique.length} languages.`);
