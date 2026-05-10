"use client";

import { useMemo, useState } from "react";

const languages = [
  { code: "el", nativeName: "Ελληνικά", label: "Greek / Cyprus", region: "Κύπρος · Ελλάδα" },
  { code: "en", nativeName: "English", label: "English", region: "Global" },
  { code: "tr", nativeName: "Türkçe", label: "Turkish", region: "Κύπρος · Τουρκία" },
  { code: "ar", nativeName: "العربية", label: "Arabic", region: "Μέση Ανατολή · Αφρική", dir: "rtl" },
  { code: "ar-sy", nativeName: "العربية السورية", label: "Arabic / Syria", region: "Σύριοι", dir: "rtl" },
  { code: "ar-ps", nativeName: "العربية الفلسطينية", label: "Arabic / Palestine", region: "Παλαιστίνιοι", dir: "rtl" },
  { code: "ru", nativeName: "Русский", label: "Russian", region: "Κύπρος · Ευρώπη · Ασία" },
  { code: "uk", nativeName: "Українська", label: "Ukrainian", region: "Ευρώπη" },
  { code: "zh", nativeName: "中文", label: "Chinese", region: "Ασία" },
  { code: "pl", nativeName: "Polski", label: "Polish", region: "Κύπρος · Ευρώπη" },
  { code: "hy", nativeName: "Հայերեն", label: "Armenian", region: "Κύπρος · Αρμενία" },
  { code: "ro", nativeName: "Română", label: "Romanian", region: "Κύπρος · Ευρώπη" },
  { code: "bg", nativeName: "Български", label: "Bulgarian", region: "Κύπρος · Ευρώπη" },
  { code: "fil", nativeName: "Filipino / Tagalog", label: "Filipino", region: "Φιλιππίνες" },
  { code: "ne", nativeName: "नेपाली", label: "Nepali", region: "Νεπάλ" },
  { code: "hi", nativeName: "हिन्दी", label: "Hindi", region: "Ινδία" },
  { code: "ur", nativeName: "اردو", label: "Urdu", region: "Πακιστάν · Ινδία", dir: "rtl" },
  { code: "bn", nativeName: "বাংলা", label: "Bengali", region: "Μπαγκλαντές · Ινδία" },
  { code: "pa", nativeName: "ਪੰਜਾਬੀ", label: "Punjabi", region: "Ινδία · Πακιστάν" },
  { code: "ta", nativeName: "தமிழ்", label: "Tamil", region: "Ινδία · Σρι Λάνκα" },
  { code: "si", nativeName: "සිංහල", label: "Sinhala", region: "Σρι Λάνκα" },
  { code: "fr", nativeName: "Français", label: "French", region: "Ευρώπη · Αφρική · Κονγκό" },
  { code: "ln", nativeName: "Lingála", label: "Lingala", region: "Κονγκό" },
  { code: "sw", nativeName: "Kiswahili", label: "Swahili", region: "Αφρική" },
  { code: "ku", nativeName: "Kurdî", label: "Kurdish", region: "Μέση Ανατολή" }
] as const;

type LanguageCode = (typeof languages)[number]["code"];

type EndpointState = {
  key: string;
  label: string;
  path: string;
  expectedStatus: number;
  statusCode?: number;
  loading: boolean;
  ok: boolean;
  error?: string;
  json?: Record<string, unknown>;
};

type CopyPack = {
  languageLabel: string;
  languagePromise: string;
  title: string;
  subtitle: string;
  explanation: string;
  currentStatus: string;
  productionBlocked: string;
  blockedReason: string;
  runLiveChecks: string;
  copyPresentation: string;
  copied: string;
  printPage: string;
  exportSnapshot: string;
  openReadinessApi: string;
  openServingApi: string;
  openAddressApi: string;
  openBboxApi: string;
  liveChecksTitle: string;
  liveChecksText: string;
  lastRun: string;
  notRun: string;
  checking: string;
  notChecked: string;
  expected: string;
  jsonError: string;
  presentationTitle: string;
  presentationP1: string;
  presentationP2: string;
  readinessTitle: string;
  overallReady: string;
  productionActivationAllowed: string;
  dataReturned: string;
  mayReturnRawMaster: string;
  mayReturnCompleteNetwork: string;
  addressTitle: string;
  addressP1: string;
  addressP2: string;
  selectedCandidateRequired: string;
  mayAutoPick: string;
  bboxDataReturned: string;
  requiredBeforeProduction: string;
  safeGuaranteeTitle: string;
  safe1: string;
  safe2: string;
  safe3: string;
};

const endpoints = {
  productionReadiness: "/api/professional/infrastructure/water/production-readiness",
  servingReadiness: "/api/professional/infrastructure/water/serving/readiness",
  addressCandidates:
    "/api/professional/infrastructure/water/address/candidates?query=Makariou&city=Limassol",
  controlledBbox:
    "/api/professional/infrastructure/water/serving/bbox?minLng=33.018&minLat=34.662&maxLng=33.055&maxLat=34.692&zoom=17&targetSource=address-search&searchQuery=Makariou%20Limassol&selectedCandidateId=demo-limassol-zone-001",
};

const initialEndpointState: EndpointState[] = [
  {
    key: "production",
    label: "Production readiness",
    path: endpoints.productionReadiness,
    expectedStatus: 200,
    loading: false,
    ok: false,
  },
  {
    key: "serving",
    label: "Serving readiness",
    path: endpoints.servingReadiness,
    expectedStatus: 200,
    loading: false,
    ok: false,
  },
  {
    key: "address",
    label: "Address candidates",
    path: endpoints.addressCandidates,
    expectedStatus: 423,
    loading: false,
    ok: false,
  },
  {
    key: "bbox",
    label: "Controlled bbox",
    path: endpoints.controlledBbox,
    expectedStatus: 423,
    loading: false,
    ok: false,
  },
];

const el: CopyPack = {
  languageLabel: "Γλώσσα",
  languagePromise:
    "Το Pantavion στηρίζει γλώσσα επιλογής χρήστη. Πρώτος στόχος: 250 γλώσσες. Μετά, σταδιακή επέκταση προς 7200 φυσικές διαλέκτους, ανά χώρα, ήπειρο και πραγματικό πληθυσμό.",
  title: "Pantavion Water Module",
  subtitle: "Ζωντανό κέντρο ελέγχου ετοιμότητας — όχι στατική βιτρίνα.",
  explanation:
    "Το πλήρες master δίκτυο ύδρευσης παραμένει προστατευμένο. Η σελίδα κάνει live ελέγχους στα readiness, address candidate και controlled bbox contracts, χωρίς να επιστρέφει geometry, raw master ή complete water network payloads.",
  currentStatus: "Τρέχουσα κατάσταση",
  productionBlocked: "Production μπλοκαρισμένο",
  blockedReason:
    "Μπλοκαρισμένο σωστά μέχρι να υπάρχουν spatial index, bbox provider, access filtering, durable audit, authorized-person store και founder/admin approval.",
  runLiveChecks: "Εκτέλεση live ελέγχου",
  copyPresentation: "Αντιγραφή μηνύματος παρουσίασης",
  copied: "Αντιγράφηκε",
  printPage: "Εκτύπωση / αποθήκευση",
  exportSnapshot: "Εξαγωγή JSON snapshot",
  openReadinessApi: "Άνοιγμα readiness API",
  openServingApi: "Άνοιγμα serving API",
  openAddressApi: "Άνοιγμα address candidates API",
  openBboxApi: "Άνοιγμα controlled bbox API",
  liveChecksTitle: "Live contract checks",
  liveChecksText:
    "Κάθε ενεργό κουμπί κάνει πραγματική ενέργεια. Το 423 είναι επιτυχές safety block, όχι αποτυχία.",
  lastRun: "Τελευταίος έλεγχος",
  notRun: "Δεν έγινε ακόμα",
  checking: "Έλεγχος...",
  notChecked: "Δεν ελέγχθηκε",
  expected: "Αναμενόμενο",
  jsonError: "Η απάντηση δεν ήταν JSON. Πιθανό protection/auth ή HTML error page.",
  presentationTitle: "Μήνυμα παρουσίασης",
  presentationP1:
    "Το Pantavion Water Module δεν φορτώνει ολόκληρο το δίκτυο ύδρευσης στον browser. Το πλήρες master παραμένει προστατευμένο. Το σύστημα ζητά μόνο ελεγχόμενο τμήμα βάσει τρέχουσας θέσης, αναζήτησης διεύθυνσης, χειροκίνητης μετακίνησης/zoom ή founder/admin selected area.",
  presentationP2:
    "Για διευθύνσεις ή οδούς που υπάρχουν πολλές φορές στην ίδια πόλη, το σύστημα δεν κάνει ποτέ auto-pick. Επιστρέφει candidates και απαιτεί selectedCandidateId πριν από οποιοδήποτε controlled bbox serving.",
  readinessTitle: "Live production readiness",
  overallReady: "Συνολικά έτοιμο",
  productionActivationAllowed: "Επιτρέπεται production activation",
  dataReturned: "Επιστρέφονται δεδομένα",
  mayReturnRawMaster: "Μπορεί να επιστρέψει raw master",
  mayReturnCompleteNetwork: "Μπορεί να επιστρέψει complete network",
  addressTitle: "Address disambiguation",
  addressP1:
    "Ίδιες οδοί ή ίδιες διευθύνσεις μπορεί να υπάρχουν πολλές φορές στην ίδια πόλη, δήμο, συνοικία, τομέα ή ζώνη.",
  addressP2:
    "Το σύστημα δεν επιτρέπεται να επιλέξει αυτόματα ambiguous address. Candidate selection απαιτείται πριν δημιουργηθεί target viewport.",
  selectedCandidateRequired: "selectedCandidateId απαιτείται πριν το bbox",
  mayAutoPick: "mayAutoPickAmbiguousAddress",
  bboxDataReturned: "controlled bbox dataReturned",
  requiredBeforeProduction: "Απαιτούνται πριν το production",
  safeGuaranteeTitle: "Safe presentation guarantee",
  safe1: "No raw master network is returned.",
  safe2: "No complete network payload is returned.",
  safe3: "No renderer or map layer is activated here.",
};

const en: CopyPack = {
  ...el,
  languageLabel: "Language",
  languagePromise:
    "Pantavion supports user-selected language. First target: 250 languages. Then progressive support for 7200 natural dialects by country, continent, and real population needs.",
  subtitle: "Live readiness control center — not a static display.",
  explanation:
    "The complete master water network remains protected. This page performs live checks against readiness, address candidate, and controlled bbox contracts without returning geometry, raw master data, or complete water network payloads.",
  currentStatus: "Current status",
  productionBlocked: "Production blocked",
  blockedReason:
    "Blocked by design until spatial index, bbox provider, access filtering, durable audit, authorized-person store, and founder/admin approval are complete.",
  runLiveChecks: "Run live checks",
  copyPresentation: "Copy presentation message",
  copied: "Copied",
  printPage: "Print / save",
  exportSnapshot: "Export JSON snapshot",
  openReadinessApi: "Open readiness API",
  openServingApi: "Open serving API",
  openAddressApi: "Open address candidates API",
  openBboxApi: "Open controlled bbox API",
  liveChecksText:
    "Every active button performs a real action. Status 423 is a successful safety block, not a failure.",
  lastRun: "Last run",
  notRun: "Not run yet",
  checking: "Checking...",
  notChecked: "Not checked",
  expected: "Expected",
  presentationTitle: "Presentation message",
  presentationP1:
    "The Pantavion Water Module does not load the complete water network in the browser. The full master remains protected. The system requests only a controlled segment based on current location, address search, manual pan/zoom, or founder/admin selected area.",
  presentationP2:
    "For addresses or street names that exist multiple times in the same city, the system never auto-picks. It returns candidates and requires selectedCandidateId before any controlled bbox serving.",
  overallReady: "Overall ready",
  productionActivationAllowed: "Production activation allowed",
  dataReturned: "Data returned",
  mayReturnRawMaster: "May return raw master",
  mayReturnCompleteNetwork: "May return complete network",
  addressP1:
    "Same streets or addresses can exist multiple times in the same city, municipality, quarter, sector, or zone.",
  addressP2:
    "The system is not allowed to auto-pick an ambiguous address. Candidate selection is required before target viewport creation.",
  selectedCandidateRequired: "selectedCandidateId required before bbox",
  requiredBeforeProduction: "Required before production",
};

const partialCopies: Record<string, Partial<CopyPack>> = {
  tr: {
    languageLabel: "Dil",
    languagePromise:
      "Pantavion kullanıcının seçtiği dili destekler. İlk hedef: 250 dil. Sonra ülke, kıta ve gerçek nüfus ihtiyaçlarına göre 7200 doğal lehçe.",
    subtitle: "Canlı hazırlık kontrol merkezi — statik vitrin değil.",
    currentStatus: "Mevcut durum",
    productionBlocked: "Production engellendi",
    runLiveChecks: "Canlı kontrolü çalıştır",
    copyPresentation: "Sunum mesajını kopyala",
  },
  ar: {
    languageLabel: "اللغة",
    languagePromise:
      "يدعم Pantavion لغة يختارها المستخدم. الهدف الأول: 250 لغة، ثم دعم تدريجي لـ 7200 لهجة طبيعية حسب البلد والقارة واحتياجات السكان.",
    subtitle: "مركز تحقق مباشر للجاهزية — ليس عرضاً ثابتاً.",
    currentStatus: "الحالة الحالية",
    productionBlocked: "الإنتاج محظور",
    runLiveChecks: "تشغيل الفحص المباشر",
    copyPresentation: "نسخ رسالة العرض",
  },
  "ar-sy": {
    languageLabel: "اللغة",
    languagePromise:
      "دعم خاص للناطقين بالعربية السورية ضمن خطة Pantavion للغات والجاليات في قبرص والعالم.",
    subtitle: "مركز تحقق مباشر للجاهزية — ليس عرضاً ثابتاً.",
    runLiveChecks: "تشغيل الفحص المباشر",
  },
  "ar-ps": {
    languageLabel: "اللغة",
    languagePromise:
      "دعم خاص للناطقين بالعربية الفلسطينية ضمن خطة Pantavion للغات والجاليات في قبرص والعالم.",
    subtitle: "مركز تحقق مباشر للجاهزية — ليس عرضاً ثابتاً.",
    runLiveChecks: "تشغيل الفحص المباشر",
  },
  ru: {
    languageLabel: "Язык",
    languagePromise:
      "Pantavion поддерживает язык, выбранный пользователем. Цель: 250 языков, затем 7200 естественных диалектов.",
    subtitle: "Живой центр проверки готовности — не статическая витрина.",
    currentStatus: "Текущее состояние",
    productionBlocked: "Production заблокирован",
    runLiveChecks: "Запустить live-проверку",
  },
  uk: {
    languageLabel: "Мова",
    languagePromise:
      "Pantavion підтримує мову, обрану користувачем. Мета: 250 мов, потім 7200 природних діалектів.",
    subtitle: "Живий центр перевірки готовності — не статична вітрина.",
    runLiveChecks: "Запустити live-перевірку",
  },
  zh: {
    languageLabel: "语言",
    languagePromise:
      "Pantavion 支持用户选择语言。第一目标：250种语言；随后逐步支持7200种自然方言。",
    subtitle: "实时就绪控制中心 — 不是静态展示。",
    currentStatus: "当前状态",
    productionBlocked: "生产已阻止",
    runLiveChecks: "运行实时检查",
  },
  pl: {
    languageLabel: "Język",
    languagePromise:
      "Pantavion obsługuje język wybrany przez użytkownika. Cel: 250 języków, potem 7200 naturalnych dialektów.",
    subtitle: "Centrum kontroli gotowości na żywo — nie statyczna witryna.",
    currentStatus: "Aktualny status",
    productionBlocked: "Production zablokowane",
    runLiveChecks: "Uruchom kontrolę live",
  },
  hy: {
    languageLabel: "Լեզու",
    languagePromise:
      "Pantavion-ը աջակցում է օգտատիրոջ ընտրած լեզուն։ Նպատակ՝ 250 լեզու, ապա 7200 բնական բարբառ։",
    subtitle: "Կենդանի պատրաստության վերահսկման կենտրոն — ոչ ստատիկ էջ։",
    runLiveChecks: "Գործարկել կենդանի ստուգումը",
  },
  ro: {
    languageLabel: "Limbă",
    languagePromise:
      "Pantavion susține limba aleasă de utilizator. Țintă: 250 de limbi, apoi 7200 de dialecte naturale.",
    subtitle: "Centru live de verificare a pregătirii — nu vitrină statică.",
    currentStatus: "Stare curentă",
    productionBlocked: "Production blocat",
    runLiveChecks: "Rulează verificarea live",
  },
  bg: {
    languageLabel: "Език",
    languagePromise:
      "Pantavion поддържа избрания от потребителя език. Цел: 250 езика, после 7200 естествени диалекта.",
    subtitle: "Жив център за проверка на готовността — не статична витрина.",
    currentStatus: "Текущо състояние",
    productionBlocked: "Production блокирано",
    runLiveChecks: "Стартирай live проверка",
  },
  fil: {
    languageLabel: "Wika",
    languagePromise:
      "Sinusuportahan ng Pantavion ang wikang pinili ng user. Target: 250 wika, pagkatapos 7200 natural dialects.",
    subtitle: "Live readiness control center — hindi static display.",
    runLiveChecks: "Patakbuhin ang live check",
  },
  ne: {
    languageLabel: "भाषा",
    languagePromise:
      "Pantavion ले प्रयोगकर्ताले रोजेको भाषा समर्थन गर्छ। लक्ष्य: 250 भाषा, त्यसपछि 7200 प्राकृतिक बोलिहरू।",
    subtitle: "प्रत्यक्ष readiness control center — static display होइन।",
    runLiveChecks: "Live check चलाउनुहोस्",
  },
  hi: {
    languageLabel: "भाषा",
    languagePromise:
      "Pantavion उपयोगकर्ता द्वारा चुनी गई भाषा का समर्थन करता है। लक्ष्य: 250 भाषाएँ, फिर 7200 प्राकृतिक बोलियाँ।",
    subtitle: "Live readiness control center — static display नहीं।",
    runLiveChecks: "Live check चलाएँ",
  },
  ur: {
    languageLabel: "زبان",
    languagePromise:
      "Pantavion صارف کی منتخب زبان کو سپورٹ کرتا ہے۔ ہدف: 250 زبانیں، پھر 7200 قدرتی بولیاں۔",
    subtitle: "براہ راست readiness control center — static display نہیں۔",
    runLiveChecks: "Live check چلائیں",
  },
  bn: {
    languageLabel: "ভাষা",
    languagePromise:
      "Pantavion ব্যবহারকারীর নির্বাচিত ভাষা সমর্থন করে। লক্ষ্য: 250 ভাষা, তারপর 7200 প্রাকৃতিক উপভাষা।",
    subtitle: "লাইভ readiness control center — static display নয়।",
    runLiveChecks: "Live check চালান",
  },
  pa: {
    languageLabel: "ਭਾਸ਼ਾ",
    languagePromise:
      "Pantavion ਯੂਜ਼ਰ ਦੀ ਚੁਣੀ ਭਾਸ਼ਾ ਦਾ ਸਮਰਥਨ ਕਰਦਾ ਹੈ। ਟੀਚਾ: 250 ਭਾਸ਼ਾਵਾਂ, ਫਿਰ 7200 ਕੁਦਰਤੀ ਬੋਲੀਆਂ।",
    subtitle: "Live readiness control center — static display ਨਹੀਂ।",
    runLiveChecks: "Live check ਚਲਾਓ",
  },
  ta: {
    languageLabel: "மொழி",
    languagePromise:
      "Pantavion பயனர் தேர்ந்தெடுத்த மொழியை ஆதரிக்கிறது. இலக்கு: 250 மொழிகள், பின்னர் 7200 இயல்பான வழக்குகள்.",
    subtitle: "Live readiness control center — static display அல்ல.",
    runLiveChecks: "Live check இயக்கவும்",
  },
  si: {
    languageLabel: "භාෂාව",
    languagePromise:
      "Pantavion පරිශීලකයා තෝරාගත් භාෂාවට සහාය දක්වයි. ඉලක්කය: භාෂා 250, පසුව ස්වභාවික උපභාෂා 7200.",
    subtitle: "Live readiness control center — static display එකක් නොවේ.",
    runLiveChecks: "Live check ධාවනය කරන්න",
  },
  fr: {
    languageLabel: "Langue",
    languagePromise:
      "Pantavion prend en charge la langue choisie par l’utilisateur. Objectif: 250 langues, puis 7200 dialectes naturels.",
    subtitle: "Centre de contrôle de préparation en direct — pas une vitrine statique.",
    currentStatus: "État actuel",
    productionBlocked: "Production bloquée",
    runLiveChecks: "Lancer le contrôle en direct",
  },
  ln: {
    languageLabel: "Lokota",
    languagePromise:
      "Pantavion esungaka lokota oyo mosaleli aponi. Mokano: minoko 250, sima maloba ya mboka 7200.",
    subtitle: "Centre ya contrôle ya bomilengeli na live — ezali vitrine statique te.",
    runLiveChecks: "Bandisa contrôle live",
  },
  sw: {
    languageLabel: "Lugha",
    languagePromise:
      "Pantavion inaunga mkono lugha iliyochaguliwa na mtumiaji. Lengo: lugha 250, kisha lahaja asilia 7200.",
    subtitle: "Kituo cha ukaguzi wa utayari live — si onyesho tuli.",
    runLiveChecks: "Endesha ukaguzi live",
  },
  ku: {
    languageLabel: "Ziman",
    languagePromise:
      "Pantavion piştgirî dide zimanê ku bikarhêner hilbijêre. Armanc: 250 ziman, paşê 7200 zaravayên xwezayî.",
    subtitle: "Navenda kontrola amadebûnê ya live — ne dîmenderek statîk.",
    runLiveChecks: "Kontrola live bike",
  },
};

function copyFor(language: LanguageCode): CopyPack {
  if (language === "el") return el;
  if (language === "en") return en;

  return {
    ...en,
    ...partialCopies[language],
  };
}

const cardCopies = {
  el: [
    ["Προστατευμένο", "Πλήρες master δίκτυο", "Το πλήρες master μένει προστατευμένο και δεν εκτίθεται ως public geodata."],
    ["Μπλοκαρισμένο", "Φόρτωση στον browser", "Ο browser δεν παίρνει raw/full δίκτυο."],
    ["Contract ready", "Target viewport", "Η περιοχή μπορεί να προκύψει από θέση, αναζήτηση, pan/zoom ή admin selection."],
    ["Απαιτείται διαχωρισμός", "Ίδιες οδοί σε πολλές περιοχές", "Ίδιες οδοί απαιτούν candidate selection πριν δημιουργηθεί bbox."],
  ],
  en: [
    ["Protected", "Full master network", "The complete master remains protected and is not exposed as public geodata."],
    ["Blocked", "Browser loading", "The browser does not receive the raw/full network."],
    ["Contract ready", "Target viewport", "The requested area can come from location, address search, pan/zoom, or admin selection."],
    ["Disambiguation required", "Repeated street names", "Repeated streets require candidate selection before bbox creation."],
  ],
} as const;

const requiredItems = {
  el: [
    "Πλήρης προστατευμένη master πηγή",
    "Spatial index από ολόκληρο το master",
    "Server-side bbox query provider",
    "Access filtering ανά viewport / ρόλο / κατάσταση",
    "Durable authorized-person store",
    "Append-only encrypted audit sink",
    "Address candidate / place-zone disambiguation",
    "Founder/admin approval για production activation",
  ],
  en: [
    "Complete protected master source",
    "Spatial index from the complete master",
    "Server-side bbox query provider",
    "Viewport / role / status access filtering",
    "Durable authorized-person store",
    "Append-only encrypted audit sink",
    "Address candidate / place-zone disambiguation",
    "Founder/admin approval for production activation",
  ],
} as const;

function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return "el";

  const stored = window.localStorage.getItem("pantavion-language");

  if (stored && languages.some((language) => language.code === stored)) {
    return stored as LanguageCode;
  }

  const browserLanguage = window.navigator.language.toLowerCase();

  const exact = languages.find((language) => language.code === browserLanguage);
  if (exact) return exact.code;

  const short = browserLanguage.slice(0, 2);
  const match = languages.find((language) => language.code === short);
  if (match) return match.code;

  return "el";
}

function boolText(value: unknown) {
  if (value === true) return "true";
  if (value === false) return "false";
  if (value === null || typeof value === "undefined") return "n/a";
  return String(value);
}

function valueFromJson(json: Record<string, unknown> | undefined, key: string) {
  if (!json) return "n/a";
  return boolText(json[key]);
}

function statusTone(endpoint: EndpointState) {
  if (endpoint.loading) return "border-blue-400/30 bg-blue-950/30 text-blue-100";
  if (endpoint.ok) return "border-emerald-400/30 bg-emerald-950/30 text-emerald-100";
  if (endpoint.statusCode) return "border-red-400/30 bg-red-950/30 text-red-100";
  return "border-white/10 bg-white/[0.04] text-slate-100";
}

async function loadEndpoint(endpoint: EndpointState, copy: CopyPack): Promise<EndpointState> {
  try {
    const response = await fetch(endpoint.path, { cache: "no-store" });
    const text = await response.text();

    let json: Record<string, unknown> | undefined;

    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {
        ...endpoint,
        statusCode: response.status,
        loading: false,
        ok: false,
        error: copy.jsonError,
      };
    }

    return {
      ...endpoint,
      statusCode: response.status,
      loading: false,
      ok: response.status === endpoint.expectedStatus,
      json,
    };
  } catch (error) {
    return {
      ...endpoint,
      loading: false,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown request error",
    };
  }
}

export default function WaterReadinessLiveConsole() {
  const [language, setLanguage] = useState<LanguageCode>(() => getInitialLanguage());
  const [endpointStates, setEndpointStates] = useState<EndpointState[]>(initialEndpointState);
  const [lastRun, setLastRun] = useState("");
  const [copyState, setCopyState] = useState("");

  const copy = copyFor(language);
  const languageMeta = languages.find((item) => item.code === language) ?? languages[0];
  const direction = languageMeta.dir ?? "ltr";
  const cards = language === "el" ? cardCopies.el : cardCopies.en;
  const required = language === "el" ? requiredItems.el : requiredItems.en;

  const production = endpointStates.find((item) => item.key === "production");
  const address = endpointStates.find((item) => item.key === "address");
  const bbox = endpointStates.find((item) => item.key === "bbox");

  const summary = useMemo(
    () => ({
      overallReady: valueFromJson(production?.json, "overallReady"),
      productionActivationAllowed: valueFromJson(production?.json, "productionActivationAllowed"),
      dataReturned: valueFromJson(production?.json, "dataReturned"),
      mayReturnRawMaster: valueFromJson(production?.json, "mayReturnRawMaster"),
      mayReturnCompleteNetwork: valueFromJson(production?.json, "mayReturnCompleteNetwork"),
      addressAutoPick: valueFromJson(address?.json, "mayAutoPickAmbiguousAddress"),
      selectedCandidateRequired: valueFromJson(address?.json, "selectedCandidateIdRequiredBeforeBbox"),
      bboxDataReturned: valueFromJson(bbox?.json, "dataReturned"),
    }),
    [address?.json, bbox?.json, production?.json],
  );

  function changeLanguage(nextLanguage: LanguageCode) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("pantavion-language", nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.documentElement.dir =
      languages.find((item) => item.code === nextLanguage)?.dir ?? "ltr";
  }

  async function runAllChecks() {
    setEndpointStates((current) =>
      current.map((item) => ({ ...item, loading: true, error: undefined })),
    );

    const results = await Promise.all(
      initialEndpointState.map((endpoint) => loadEndpoint(endpoint, copy)),
    );

    setEndpointStates(results);
    setLastRun(new Date().toLocaleString(language === "el" ? "el-CY" : language));
  }

  async function copyPresentationMessage() {
    const message = `${copy.presentationP1}\n\n${copy.presentationP2}`;

    try {
      await window.navigator.clipboard.writeText(message);
      setCopyState(copy.copied);
    } catch {
      setCopyState("Copy blocked");
    }

    window.setTimeout(() => setCopyState(""), 1800);
  }

  function openContract(path: string) {
    window.open(path, "_blank", "noopener,noreferrer");
  }

  function exportSnapshot() {
    const snapshot = {
      language,
      languageRegion: languageMeta.region,
      lastRun,
      endpoints: endpointStates.map((endpoint) => ({
        label: endpoint.label,
        path: endpoint.path,
        expectedStatus: endpoint.expectedStatus,
        statusCode: endpoint.statusCode ?? null,
        ok: endpoint.ok,
        dataReturned: endpoint.json?.dataReturned ?? null,
        status: endpoint.json?.status ?? null,
      })),
      summary,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "pantavion-water-readiness-snapshot.json";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#07101f] text-white" dir={direction}>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-10 md:py-12">
        <header className="rounded-[2rem] border border-[#d8b35a]/30 bg-[#0c1830] p-7 shadow-2xl">
          <div className="mb-7 rounded-3xl border border-[#d8b35a]/20 bg-black/20 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr] lg:items-center">
              <div>
                <label
                  htmlFor="pantavion-language-selector"
                  className="text-xs font-bold uppercase tracking-[0.28em] text-[#d8b35a]"
                >
                  {copy.languageLabel}
                </label>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {copy.languagePromise}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Cyprus priority languages · six continents · 250 languages · 7200 natural dialects
                </p>
              </div>

              <select
                id="pantavion-language-selector"
                value={language}
                onChange={(event) => changeLanguage(event.target.value as LanguageCode)}
                className="min-h-12 rounded-2xl border border-[#d8b35a]/40 bg-[#07101f] px-4 py-3 text-sm font-bold text-[#ffe8a3] outline-none"
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.nativeName} / {item.label} — {item.region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#d8b35a]">
            Pantavion Professional Infrastructure
          </p>

          <div className="grid gap-7 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-3xl text-xl font-semibold text-[#f2d27a]">
                {copy.subtitle}
              </p>
              <p className="mt-5 max-w-4xl text-base leading-8 text-slate-200">
                {copy.explanation}
              </p>
            </div>

            <div className="rounded-3xl border border-red-400/30 bg-red-950/30 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-200">
                {copy.currentStatus}
              </p>
              <p className="mt-3 text-3xl font-bold text-red-100">
                {copy.productionBlocked}
              </p>
              <p className="mt-3 text-sm leading-6 text-red-100/80">
                {copy.blockedReason}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={runAllChecks} className="rounded-2xl border border-[#d8b35a]/50 bg-[#d8b35a]/15 px-5 py-3 text-sm font-bold text-[#ffe8a3] transition hover:bg-[#d8b35a]/25">
              {copy.runLiveChecks}
            </button>
            <button type="button" onClick={copyPresentationMessage} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copyState || copy.copyPresentation}
            </button>
            <button type="button" onClick={() => window.print()} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.printPage}
            </button>
            <button type="button" onClick={exportSnapshot} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.exportSnapshot}
            </button>
            <button type="button" onClick={() => openContract(endpoints.productionReadiness)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.openReadinessApi}
            </button>
            <button type="button" onClick={() => openContract(endpoints.servingReadiness)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.openServingApi}
            </button>
            <button type="button" onClick={() => openContract(endpoints.addressCandidates)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.openAddressApi}
            </button>
            <button type="button" onClick={() => openContract(endpoints.controlledBbox)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {copy.openBboxApi}
            </button>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(([status, title, text]) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d8b35a]">{status}</p>
              <h2 className="mt-3 text-xl font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-[#d8b35a]/25 bg-[#111a2c] p-6">
          <h2 className="text-2xl font-bold text-[#f2d27a]">{copy.liveChecksTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{copy.liveChecksText}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
            {copy.lastRun}: {lastRun || copy.notRun}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {endpointStates.map((endpoint) => (
              <article key={endpoint.key} className={`rounded-2xl border p-4 ${statusTone(endpoint)}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{endpoint.label}</p>
                <p className="mt-3 text-2xl font-bold">
                  {endpoint.loading ? copy.checking : endpoint.statusCode ? endpoint.statusCode : copy.notChecked}
                </p>
                <p className="mt-2 text-xs opacity-75">{copy.expected}: {endpoint.expectedStatus}</p>
                <p className="mt-3 break-words text-xs leading-5 opacity-80">{endpoint.error || endpoint.path}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">{copy.presentationTitle}</h2>
            <p className="mt-5 text-base leading-8 text-slate-200">{copy.presentationP1}</p>
            <p className="mt-4 text-base leading-8 text-slate-200">{copy.presentationP2}</p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">{copy.readinessTitle}</h2>
            <dl className="mt-5 grid gap-4">
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4"><dt className="text-slate-300">{copy.overallReady}</dt><dd className="font-bold text-red-200">{summary.overallReady}</dd></div>
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4"><dt className="text-slate-300">{copy.productionActivationAllowed}</dt><dd className="font-bold text-red-200">{summary.productionActivationAllowed}</dd></div>
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4"><dt className="text-slate-300">{copy.dataReturned}</dt><dd className="font-bold text-emerald-200">{summary.dataReturned}</dd></div>
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4"><dt className="text-slate-300">{copy.mayReturnRawMaster}</dt><dd className="font-bold text-emerald-200">{summary.mayReturnRawMaster}</dd></div>
              <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4"><dt className="text-slate-300">{copy.mayReturnCompleteNetwork}</dt><dd className="font-bold text-emerald-200">{summary.mayReturnCompleteNetwork}</dd></div>
            </dl>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">{copy.addressTitle}</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-200">
              <p>{copy.addressP1}</p>
              <p>{copy.addressP2}</p>
            </div>
            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-[#d8b35a]/20 bg-[#d8b35a]/10 p-4 text-sm leading-7 text-[#f6e4aa]">{copy.selectedCandidateRequired}: <strong>{summary.selectedCandidateRequired}</strong></div>
              <div className="rounded-2xl border border-[#d8b35a]/20 bg-[#d8b35a]/10 p-4 text-sm leading-7 text-[#f6e4aa]">{copy.mayAutoPick}: <strong>{summary.addressAutoPick}</strong></div>
              <div className="rounded-2xl border border-[#d8b35a]/20 bg-[#d8b35a]/10 p-4 text-sm leading-7 text-[#f6e4aa]">{copy.bboxDataReturned}: <strong>{summary.bboxDataReturned}</strong></div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-bold text-[#f2d27a]">{copy.requiredBeforeProduction}</h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {required.map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-200">{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-950/20 p-7">
          <h2 className="text-2xl font-bold text-emerald-100">{copy.safeGuaranteeTitle}</h2>
          <div className="mt-5 grid gap-4 text-sm leading-7 text-emerald-50/90 md:grid-cols-3">
            <p>{copy.safe1}</p>
            <p>{copy.safe2}</p>
            <p>{copy.safe3}</p>
          </div>
        </section>
      </section>
    </main>
  );
}
