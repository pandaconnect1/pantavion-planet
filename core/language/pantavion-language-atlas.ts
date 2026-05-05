export type PantavionLanguageDirection = "ltr" | "rtl";
export type PantavionLanguageTier =
  | "core"
  | "global"
  | "regional"
  | "indigenous"
  | "signed"
  | "historical"
  | "iso-639-3-ready";

export type PantavionLanguageModality =
  | "text"
  | "speech"
  | "camera"
  | "subtitle"
  | "social"
  | "sos"
  | "elder"
  | "travel"
  | "work";

export interface PantavionUiLanguage {
  code: string;
  name: string;
  nativeName?: string;
  direction: PantavionLanguageDirection;
  tier: PantavionLanguageTier;
}

export interface PantavionAtlasLanguage {
  code: string;
  name: string;
  direction: PantavionLanguageDirection;
  tier: PantavionLanguageTier;
}

export const PANTAVION_LANGUAGE_ATLAS_DOCTRINE = {
  marker: "PANTAVION_LANGUAGE_ATLAS_V1",
  productName: "Pantavion Universal Language Atlas",
  independentInterpreterRoute: "/translate",
  sosInterpreterReuse: true,
  supports7000NaturalLanguages: true,
  globalInitialCoverageMinimum: 250,
  providerExpandable: true,
  modalities: [
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
  doctrine:
    "Pantavion translation is not locked inside SOS. SOS reuses the universal interpreter. Every user should eventually communicate bidirectionally anywhere: travel, street, work, nightlife, social, services, emergency, accessibility.",
} as const;

export const PANTAVION_UI_LANGUAGES: readonly PantavionUiLanguage[] = [
  { code: "auto", name: "Automatic detection", nativeName: "Auto", direction: "ltr", tier: "core" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", direction: "ltr", tier: "core" },
  { code: "en", name: "English", nativeName: "English", direction: "ltr", tier: "core" },
  { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl", tier: "core" },
  { code: "zh", name: "Chinese", nativeName: "中文", direction: "ltr", tier: "core" },
  { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr", tier: "core" },
  { code: "fr", name: "French", nativeName: "Français", direction: "ltr", tier: "core" },
  { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr", tier: "core" },
  { code: "it", name: "Italian", nativeName: "Italiano", direction: "ltr", tier: "core" },
  { code: "pt", name: "Portuguese", nativeName: "Português", direction: "ltr", tier: "core" },
  { code: "ru", name: "Russian", nativeName: "Русский", direction: "ltr", tier: "core" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", direction: "ltr", tier: "core" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", direction: "ltr", tier: "core" },
  { code: "he", name: "Hebrew", nativeName: "עברית", direction: "rtl", tier: "core" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", direction: "ltr", tier: "core" },
  { code: "ur", name: "Urdu", nativeName: "اردو", direction: "rtl", tier: "core" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", direction: "ltr", tier: "core" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", direction: "ltr", tier: "global" },
  { code: "fa", name: "Persian", nativeName: "فارسی", direction: "rtl", tier: "global" },
  { code: "ja", name: "Japanese", nativeName: "日本語", direction: "ltr", tier: "core" },
  { code: "ko", name: "Korean", nativeName: "한국어", direction: "ltr", tier: "core" },
  { code: "th", name: "Thai", nativeName: "ไทย", direction: "ltr", tier: "global" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", direction: "ltr", tier: "global" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", direction: "ltr", tier: "global" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", direction: "ltr", tier: "global" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", direction: "ltr", tier: "global" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", direction: "ltr", tier: "global" },
  { code: "ha", name: "Hausa", nativeName: "Hausa", direction: "ltr", tier: "global" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá", direction: "ltr", tier: "global" },
  { code: "ig", name: "Igbo", nativeName: "Igbo", direction: "ltr", tier: "global" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu", direction: "ltr", tier: "global" },
];

const RAW_GLOBAL_LANGUAGE_NAMES = `Abkhaz|Acehnese|Acholi|Afar|Afrikaans|Akan|Albanian|Amharic|Arabic|Armenian|Assamese|Aymara|Azerbaijani|Balinese|Bambara|Bashkir|Basque|Batak Karo|Batak Simalungun|Batak Toba|Belarusian|Bemba|Bengali|Bhojpuri|Bikol|Bosnian|Breton|Bulgarian|Burmese|Cantonese|Catalan|Cebuano|Chamorro|Chechen|Cherokee|Chichewa|Chinese|Chuvash|Comorian|Cornish|Corsican|Croatian|Czech|Danish|Dari|Dinka|Divehi|Dogri|Dutch|Dzongkha|English|Esperanto|Estonian|Ewe|Faroese|Fijian|Filipino|Finnish|Fon|French|Friulian|Fulani|Galician|Ganda|Georgian|German|Greek|Greenlandic|Guarani|Gujarati|Haitian Creole|Hausa|Hawaiian|Hebrew|Hiligaynon|Hindi|Hmong|Hungarian|Iban|Icelandic|Igbo|Ilocano|Indonesian|Irish|Italian|Japanese|Javanese|Kannada|Kanuri|Kapampangan|Kazakh|Khasi|Khmer|Kikongo|Kinyarwanda|Kirundi|Komi|Konkani|Korean|Kurdish Kurmanji|Kurdish Sorani|Kyrgyz|Lao|Latin|Latvian|Lingala|Lithuanian|Lombard|Luxembourgish|Macedonian|Maithili|Malagasy|Malay|Malayalam|Maltese|Maori|Marathi|Marshallese|Meiteilon|Mizo|Mongolian|Navajo|Nepali|Norwegian|Nuer|Occitan|Odia|Oromo|Papiamento|Pashto|Persian|Polish|Portuguese|Punjabi|Quechua|Romanian|Romani|Russian|Samoan|Sanskrit|Santali|Scottish Gaelic|Serbian|Sesotho|Shona|Sindhi|Sinhala|Slovak|Slovenian|Somali|Spanish|Sundanese|Swahili|Swedish|Tagalog|Tahitian|Tajik|Tamil|Tatar|Telugu|Thai|Tibetan|Tigrinya|Tok Pisin|Tongan|Tsonga|Tswana|Turkish|Turkmen|Ukrainian|Urdu|Uyghur|Uzbek|Vietnamese|Welsh|Wolof|Xhosa|Yiddish|Yoruba|Zulu|American Sign Language|British Sign Language|International Sign|Cypriot Greek|Pontic Greek|Sicilian|Sardinian|Neapolitan|Venetian|Ladino|Yucatec Maya|Kiche|Kaqchikel|Nahuatl|Mapudungun|Quechua Cuzco|Tzotzil|Tzeltal|Zapotec|Mixtec|Miskito|Garifuna|Arawak|Wayuu|Nheengatu|Inuktitut|Inuinnaqtun|Cree|Ojibwe|Mohawk|Innu|Mi'kmaq|Dakota|Lakota|Choctaw|Chickasaw|Creek|Hopi|Zuni|Tlingit|Haida|Yupik|Aleut|Guarani Mbya|Kabuverdianu|Fula|Mandinka|Wolaytta|Somali Maay|Tamasheq|Tamazight|Kabyle|Riffian|Shilha|Mossi|Edo|Efik|Ibibio|Tiv|Kanembu|Fur|Nubian|Krio|Luo|Luhya|Kalenjin|Meru|Kikuyu|Gusii|Maasai|Sukuma|Nyamwezi|Makonde|Yao|Chewa|Lozi|Herero|Khoekhoe|Swazi|Venda|Ndebele|Sango|Umbundu|Kimbundu|Chokwe|Tetum|Hiri Motu|Bislama|Palauan|Chuukese|Kosraean|Pohnpeian|Yapese|Gilbertese|Tuvaluan|Fijian Hindi|Buginese|Madurese|Minangkabau|Sasak|Rejang|Makassarese|Waray|Pangasinan|Maranao|Maguindanao|Tausug|Ifugao|Igorot|Buryat|Yakut|Tuvan|Kalmyk|Ossetian|Avar|Lezgian|Udmurt|Mari|Erzya|Moksha|Komi Permyak|Karakalpak|Nogai|Crimean Tatar|Balochi|Kashmiri|Saraiki|Dhivehi|Limbu|Newar|Tamang|Sherpa|Bodo|Manipuri|Garo|Mundari|Ho|Kurukh|Gondi|Kui|Bhili|Magahi|Awadhi|Marwari|Rajasthani|Chhattisgarhi|Haryanvi|Braj|Tulu|Kodava|Rohingya|Mon|Shan|Karen|Karen Sgaw|Karen Pwo|Hmong Daw|Hmong Njua|Zhuang|Miao|Yi|Tibetan Amdo|Tibetan Kham|Monguor|Dongxiang|Salar|Manchu|Evenki|Oroqen`;

export const PANTAVION_GLOBAL_250_LANGUAGE_NAMES: readonly string[] = Array.from(
  new Set(RAW_GLOBAL_LANGUAGE_NAMES.split("|").map((name) => name.trim()).filter(Boolean)),
);

export const PANTAVION_GLOBAL_250_LANGUAGES: readonly PantavionAtlasLanguage[] =
  PANTAVION_GLOBAL_250_LANGUAGE_NAMES.map((name, index) => ({
    code: `panta-${String(index + 1).padStart(3, "0")}`,
    name,
    direction: /Arabic|Hebrew|Urdu|Persian|Dari|Pashto|Balochi|Rohingya/.test(name) ? "rtl" : "ltr",
    tier:
      /Sign/.test(name)
        ? "signed"
        : /Ancient|Latin|Sanskrit/.test(name)
          ? "historical"
          : index < 80
            ? "global"
            : "iso-639-3-ready",
  }));

const LANGUAGE_BY_CODE = new Map(PANTAVION_UI_LANGUAGES.map((language) => [language.code, language]));

export function getPantavionLanguageLabel(code: string): string {
  if (!code || code === "auto") return "Automatic language detection";
  return LANGUAGE_BY_CODE.get(code)?.name ?? code;
}

export function getPantavionLanguageCountSummary() {
  return {
    marker: PANTAVION_LANGUAGE_ATLAS_DOCTRINE.marker,
    uiLanguages: PANTAVION_UI_LANGUAGES.length,
    globalAtlasLanguages: PANTAVION_GLOBAL_250_LANGUAGES.length,
    supports7000NaturalLanguages: PANTAVION_LANGUAGE_ATLAS_DOCTRINE.supports7000NaturalLanguages,
  };
}
