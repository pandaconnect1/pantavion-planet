const fs = require("fs");

const registryPath = "core/emergency/global-emergency-languages.ts";
const i18nPath = "core/emergency/lifeshield-emergency-i18n.ts";
const sosPath = "app/sos/page.tsx";

const languages = [
  ["en", "English"], ["el", "λληνικά"], ["es", "Español"], ["fr", "Français"],
  ["de", "Deutsch"], ["it", "Italiano"], ["pt", "Português"], ["ar", "العربية"],
  ["tr", "Türkçe"], ["ru", "Русский"], ["zh", "中文"], ["ja", "日本語"],
  ["hi", "हिन्दी"], ["bn", "বাংলা"], ["ur", "اردو"], ["fa", "فارسی"],
  ["he", "עברית"], ["sw", "Kiswahili"], ["am", "አማርኛ"], ["ha", "Hausa"],
  ["yo", "Yorùbá"], ["ig", "Igbo"], ["zu", "isiZulu"], ["af", "Afrikaans"],
  ["nl", "Nederlands"], ["sv", "Svenska"], ["no", "Norsk"], ["da", "Dansk"],
  ["fi", "Suomi"], ["pl", "Polski"], ["uk", "Українська"], ["ro", "Română"],
  ["bg", "Български"], ["sr", "Српски"], ["hr", "Hrvatski"], ["cs", "Čeština"],
  ["sk", "Slovenčina"], ["hu", "Magyar"], ["sq", "Shqip"], ["mk", "Македонски"],
  ["sl", "Slovenščina"], ["lt", "Lietuvių"], ["lv", "Latviešu"], ["et", "Eesti"],
  ["ka", "ქართული"], ["hy", "Հայերեն"], ["az", "Azərbaycanca"], ["kk", "Қазақша"],
  ["uz", "O‘zbek"], ["mn", "Монгол"], ["ko", "한국어"], ["th", "ไทย"],
  ["vi", "Tiếng Việt"], ["id", "Bahasa Indonesia"], ["ms", "Bahasa Melayu"],
  ["fil", "Filipino"], ["my", "မြန်မာ"], ["km", "ខ្មែរ"], ["lo", "ລາວ"],
  ["si", "සිංහල"], ["ne", "नेपाली"], ["ta", "தமிழ்"], ["te", "తెలుగు"],
  ["ml", "മലയാളം"], ["kn", "ಕನ್ನಡ"], ["mr", "मराठी"], ["gu", "ગુજરાતી"],
  ["pa", "ਪੰਜਾਬੀ"], ["cy", "Cymraeg"], ["ga", "Gaeilge"], ["is", "Íslenska"],
  ["mt", "Malti"], ["ca", "Català"], ["eu", "Euskara"], ["gl", "Galego"]
];

const registry = `export const globalEmergencyLanguages = [
${languages.map(([code, label]) => `  { code: ${JSON.stringify(code)}, label: ${JSON.stringify(label)} },`).join("\n")}
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
`;

fs.writeFileSync(registryPath, registry, "utf8");

let core = fs.readFileSync(i18nPath, "utf8");

const typeStart = core.indexOf("export type EmergencyLanguage =");
const copyStart = core.indexOf("export type EmergencyCopy =");

if (typeStart < 0 || copyStart < 0) {
  throw new Error("Could not find EmergencyLanguage / EmergencyCopy block.");
}

core =
  core.slice(0, typeStart) +
  `import {
  globalEmergencyLanguages,
  normalizeGlobalEmergencyLanguage,
  type GlobalEmergencyLanguage,
} from "./global-emergency-languages";

export type EmergencyLanguage = GlobalEmergencyLanguage;

` +
  core.slice(copyStart);

core = core.replace(
  /export const emergencyLanguages:[\s\S]*?\n\];/,
  `export const emergencyLanguages = globalEmergencyLanguages;`
);

core = core.replace(
  /export function normalizeEmergencyLanguage\(language\?: string \| null\): EmergencyLanguage \{[\s\S]*?\n\}\s*\n\nconst englishCopy/,
  `export function normalizeEmergencyLanguage(
  language?: string | null
): EmergencyLanguage {
  return normalizeGlobalEmergencyLanguage(language);
}

const englishCopy`
);

core = core.replace(
  "export const emergencyCopy: Record<EmergencyLanguage, Partial<EmergencyCopy>> = {",
  "export const emergencyCopy: Partial<Record<EmergencyLanguage, Partial<EmergencyCopy>>> & { en: EmergencyCopy } = {"
);

core = core.replace(
  "return { ...englishCopy, ...emergencyCopy[language] };",
  "return { ...englishCopy, ...(emergencyCopy[language] ?? {}) };"
);

fs.writeFileSync(i18nPath, core, "utf8");

let sos = fs.readFileSync(sosPath, "utf8");

const translations = `const sosFallbackCopy: Partial<Record<EmergencyLanguage, Partial<typeof sosCopy.en>>> = {
  es: { title: "Centro real de SOS", language: "Idioma", activate: "ACTIVAR SOS AHORA", capture: "Capturar ubicación", call: "Llamar a emergencias", sms: "SMS al primer contacto", map: "Abrir mapa", status: "Estado en vivo", network: "Red" },
  fr: { title: "Centre SOS réel", language: "Langue", activate: "ACTIVER SOS MAINTENANT", capture: "Capturer la position", call: "Appeler les urgences", sms: "SMS au premier contact", map: "Ouvrir la carte", status: "État en direct", network: "Réseau" },
  de: { title: "Echte SOS-Zentrale", language: "Sprache", activate: "SOS JETZT AKTIVIEREN", capture: "Standort erfassen", call: "Notruf anrufen", sms: "SMS an ersten Kontakt", map: "Karte öffnen", status: "Live-Status", network: "Netzwerk" },
  it: { title: "Centro SOS reale", language: "Lingua", activate: "ATTIVA SOS ORA", capture: "Rileva posizione", call: "Chiama emergenza", sms: "SMS al primo contatto", map: "Apri mappa", status: "Stato live", network: "Rete" },
  pt: { title: "Centro SOS real", language: "Idioma", activate: "ATIVAR SOS AGORA", capture: "Capturar localização", call: "Ligar para emergência", sms: "SMS ao primeiro contato", map: "Abrir mapa", status: "Estado ao vivo", network: "Rede" },
  ar: { title: "مركز SOS الحقيقي", language: "اللغة", activate: "تفعيل SOS الآن", capture: "التقاط الموقع", call: "اتصال بالطوارئ", sms: "رسالة لأول جهة اتصال", map: "فتح الخريطة", status: "الحالة المباشرة", network: "الشبكة" },
  tr: { title: "Gerçek SOS Merkezi", language: "Dil", activate: "SOS'U ŞİMDİ AKTİF ET", capture: "Konumu al", call: "Acil numarayı ara", sms: "İlk kişiye SMS", map: "Haritayı aç", status: "Canlı durum", network: "Ağ" },
  ru: { title: "Реальный центр SOS", language: "Язык", activate: "АКТИВИРОВАТЬ SOS", capture: "Получить местоположение", call: "Позвонить в экстренную службу", sms: "SMS первому контакту", map: "Открыть карту", status: "Текущий статус", network: "Сеть" },
  zh: { title: "真实 SOS 指挥中心", language: "语言", activate: "立即启动 SOS", capture: "获取位置", call: "拨打紧急电话", sms: "短信给第一联系人", map: "打开地图", status: "实时状态", network: "网络" },
  ja: { title: "リアルSOSセンター", language: "言語", activate: "今すぐSOSを起動", capture: "位置を取得", call: "緊急番号に電話", sms: "最初の連絡先へSMS", map: "地図を開く", status: "ライブ状態", network: "ネットワーク" },
  hi: { title: "वास्तविक SOS केंद्र", language: "भाषा", activate: "SOS अभी सक्रिय करें", capture: "स्थान प्राप्त करें", call: "आपातकालीन नंबर पर कॉल करें", sms: "पहले संपर्क को SMS", map: "मानचित्र खोलें", status: "लाइव स्थिति", network: "नेटवर्क" },
  ko: { title: "실제 SOS 센터", language: "언어", activate: "지금 SOS 활성화", capture: "위치 가져오기", call: "긴급 번호로 전화", sms: "첫 연락처로 SMS", map: "지도 열기", status: "실시간 상태", network: "네트워크" },
  vi: { title: "Trung tâm SOS thật", language: "Ngôn ngữ", activate: "KÍCH HOẠT SOS NGAY", capture: "Lấy vị trí", call: "Gọi số khẩn cấp", sms: "SMS liên hệ đầu tiên", map: "Mở bản đồ", status: "Trạng thái trực tiếp", network: "Mạng" },
  id: { title: "Pusat SOS nyata", language: "Bahasa", activate: "AKTIFKAN SOS SEKARANG", capture: "Ambil lokasi", call: "Telepon darurat", sms: "SMS kontak pertama", map: "Buka peta", status: "Status langsung", network: "Jaringan" },
};

function getCopy(language: EmergencyLanguage) {
  return {
    ...sosCopy.en,
    ...(language === "el" ? sosCopy.el : {}),
    ...(sosFallbackCopy[language] ?? {}),
  };
}`;

sos = sos.replace(
  /function getCopy\(language: EmergencyLanguage\) \{[\s\S]*?\n\}/,
  translations
);

fs.writeFileSync(sosPath, sos, "utf8");

console.log("Expanded emergency language selector to", languages.length, "languages.");
