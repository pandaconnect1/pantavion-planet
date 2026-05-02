import {
  globalEmergencyLanguages,
  normalizeGlobalEmergencyLanguage,
  type GlobalEmergencyLanguage,
} from "./global-emergency-languages";

export type EmergencyLanguage = GlobalEmergencyLanguage;

export type EmergencyCopy = {
  badge: string;
  title: string;
  mission: string;
  doctrineLabel: string;
  doctrine: string;
  language: string;
  realActions: string;
  open: string;
  back: string;
  status: string;
  availableNow: string;
  deviceDependent: string;
  hardwareRequired: string;
  institutionRequired: string;
  futureRoadmap: string;
  normalPhone: string;
  specialHardware: string;
  institutionalAgreement: string;
  required: string;
  notRequired: string;
  yes: string;
  no: string;
  truthBoundary: string;
  capabilities: string;
  forbiddenTitle: string;
  forbiddenIntro: string;
  sosButton: string;
  deviceButton: string;
  profileButton: string;
  disasterButton: string;
  beaconButton: string;
  multiSignalButton: string;
  safepulseButton: string;
  networkButton: string;
  betaNotice: string;
};

export const emergencyLanguages = globalEmergencyLanguages;

export function normalizeEmergencyLanguage(language?: string | null): EmergencyLanguage {
  const value = (language ?? "en").toLowerCase();

  if (value.startsWith("el")) return "el";
  if (value.startsWith("es")) return "es";
  if (value.startsWith("fr")) return "fr";
  if (value.startsWith("de")) return "de";
  if (value.startsWith("it")) return "it";
  if (value.startsWith("pt")) return "pt";
  if (value.startsWith("ar")) return "ar";
  if (value.startsWith("tr")) return "tr";
  if (value.startsWith("ru")) return "ru";
  if (value.startsWith("zh")) return "zh";
  if (value.startsWith("ja")) return "ja";

  return "en";
}

const englishCopy: EmergencyCopy = {
  badge: "Pantavion LifeShield",
  title: "Pantavion LifeShield Emergency System",
  mission:
    "Keep a human being visible, identifiable, translatable, locatable, and reachable under degraded or collapsed network conditions.",
  doctrineLabel: "Official Doctrine",
  doctrine:
    "Phone-first. Offline-ready. Satellite-aware. Hardware-expandable. Institution-compatible. Truth-governed.",
  language: "Language",
  realActions: "Real emergency actions",
  open: "Open",
  back: "Back to Emergency System",
  status: "System status",
  availableNow: "Available now",
  deviceDependent: "Device dependent",
  hardwareRequired: "Hardware required",
  institutionRequired: "Institution required",
  futureRoadmap: "Future roadmap",
  normalPhone: "Normal phone",
  specialHardware: "Special hardware",
  institutionalAgreement: "Institutional agreement",
  required: "Required",
  notRequired: "Not required",
  yes: "Yes",
  no: "No",
  truthBoundary: "Truth Boundary",
  capabilities: "Capabilities",
  forbiddenTitle: "Forbidden Emergency Claims",
  forbiddenIntro:
    "Pantavion must stay truth-governed. These claims are blocked from product, marketing, UI, legal pages, investor material, and AI output.",
  sosButton: "Open SOS",
  deviceButton: "All Devices",
  profileButton: "Emergency Profile",
  disasterButton: "Disaster Mode",
  beaconButton: "Offline Beacon",
  multiSignalButton: "Multi-Signal SOS",
  safepulseButton: "SafePulse",
  networkButton: "Global Network",
  betaNotice:
    "This page is a real route. Features marked hardware/institution required are not fake buttons; they are locked roadmap surfaces until the required device, certification, or agreement exists.",
};

export const emergencyCopy: Partial<Record<EmergencyLanguage, Partial<EmergencyCopy>>> & { en: EmergencyCopy } = {
  en: englishCopy,
  el: {
    badge: "Pantavion LifeShield",
    title: "Σύστημα Έκτακτης Ανάγκης Pantavion LifeShield",
    mission:
      "Κρατά έναν άνθρωπο ορατό, αναγνωρίσιμο, μεταφράσιμο, εντοπίσιμο και προσβάσιμο όταν τα δίκτυα έχουν πέσει ή λειτουργούν με περιορισμούς.",
    doctrineLabel: "Επίσημο Δόγμα",
    doctrine:
      "Πρώτα το κινητό. Έτοιμο offline. Συμβατό με δορυφόρο όπου υπάρχει. Επεκτάσιμο με hardware. Συμβατό με θεσμούς. Δεμένο με αλήθεια.",
    language: "Γλώσσα",
    realActions: "Πραγματικές ενέργειες έκτακτης ανάγκης",
    open: "Άνοιγμα",
    back: "Πίσω στο Emergency System",
    status: "Κατάσταση συστήματος",
    availableNow: "Διαθέσιμο τώρα",
    deviceDependent: "Εξαρτάται από τη συσκευή",
    hardwareRequired: "Απαιτεί hardware",
    institutionRequired: "Απαιτεί θεσμική συμφωνία",
    futureRoadmap: "Μελλοντικός οδικός χάρτης",
    normalPhone: "Απλό κινητό",
    specialHardware: "Ειδικό hardware",
    institutionalAgreement: "Θεσμική συμφωνία",
    required: "Απαιτείται",
    notRequired: "Δεν απαιτείται",
    yes: "Ναι",
    no: "Όχι",
    truthBoundary: "Όριο Αλήθειας",
    capabilities: "Δυνατότητες",
    forbiddenTitle: "Απαγορευμένες Υποσχέσεις Έκτακτης Ανάγκης",
    forbiddenIntro:
      "Το Pantavion πρέπει να μένει δεμένο με την αλήθεια. Αυτές οι υποσχέσεις μπλοκάρονται από προϊόν, marketing, UI, νομικές σελίδες, investor υλικό και AI output.",
    sosButton: "Άνοιγμα SOS",
    deviceButton: "Όλες οι συσκευές",
    profileButton: "Emergency Προφίλ",
    disasterButton: "Disaster Mode",
    beaconButton: "Offline Beacon",
    multiSignalButton: "Multi-Signal SOS",
    safepulseButton: "SafePulse",
    networkButton: "Global Network",
    betaNotice:
      "Αυτή είναι πραγματική σελίδα. Όσα χρειάζονται hardware ή θεσμική συμφωνία δεν είναι ψεύτικα κουμπιά· είναι κλειδωμένες roadmap επιφάνειες μέχρι να υπάρχει συσκευή, πιστοποίηση ή συμφωνία.",
  },
  es: { title: "Sistema de Emergencia Pantavion LifeShield", language: "Idioma", deviceButton: "Todos los dispositivos" },
  fr: { title: "Système d'urgence Pantavion LifeShield", language: "Langue", deviceButton: "Tous les appareils" },
  de: { title: "Pantavion LifeShield Notfallsystem", language: "Sprache", deviceButton: "Alle Geräte" },
  it: { language: "Lingua", deviceButton: "Tutti i dispositivi" },
  pt: { language: "Idioma", deviceButton: "Todos os dispositivos" },
  ar: { language: "اللغة", deviceButton: "كل الأجهزة" },
  tr: { language: "Dil", deviceButton: "Tüm cihazlar" },
  ru: { language: "Язык", deviceButton: "Все устройства" },
  zh: { language: "语言", deviceButton: "所有设备" },
  ja: { language: "言語", deviceButton: "すべてのデバイス" },
};

export function getEmergencyCopy(language: EmergencyLanguage): EmergencyCopy {
  return { ...englishCopy, ...(emergencyCopy[language] ?? {}) };
}

export const emergencyActionRoutes: {
  id: string;
  href: string;
  labelKey: keyof EmergencyCopy;
}[] = [
  { id: "sos", href: "/sos", labelKey: "sosButton" },
  { id: "device-support", href: "/pantavion/emergency/device-support", labelKey: "deviceButton" },
  { id: "profile", href: "/pantavion/emergency/profile", labelKey: "profileButton" },
  { id: "disaster", href: "/pantavion/emergency/disaster", labelKey: "disasterButton" },
  { id: "offline-beacon", href: "/pantavion/emergency/offline-beacon", labelKey: "beaconButton" },
  { id: "multi-signal-sos", href: "/pantavion/emergency/multi-signal-sos", labelKey: "multiSignalButton" },
  { id: "safepulse", href: "/pantavion/emergency/safepulse", labelKey: "safepulseButton" },
  { id: "global-network", href: "/pantavion/emergency/global-network", labelKey: "networkButton" },
];

export const emergencyFeaturePages = {
  profile: {
    eyebrow: "Emergency Profile",
    title: "Offline Emergency Identity Pack",
    description:
      "A real user-controlled emergency identity surface for language, medical basics, allergies, trusted contacts, QR/NFC rescue card, and last-known context.",
    status: "availableNow",
    truth:
      "This must be opt-in, minimal, locally available, and never treated as a replacement for official medical records.",
  },
  disaster: {
    eyebrow: "Disaster Mode",
    title: "Pantavion Disaster Mode",
    description:
      "A real disaster route for earthquakes, fires, floods, blackouts, war zones, infrastructure collapse, and mass network failure.",
    status: "deviceDependent",
    truth:
      "Real behavior depends on device power, OS permissions, configured emergency contacts, and network return.",
  },
  offlineBeacon: {
    eyebrow: "Offline Beacon",
    title: "Pantavion Offline Beacon",
    description:
      "A real offline route for screen beacon, QR/NFC rescue display, flash, siren, haptic pattern, cached phrases, and offline queue.",
    status: "deviceDependent",
    truth:
      "A phone beacon is not an EPIRB, PLB, ELT, certified satellite beacon, or guaranteed rescue transmitter.",
  },
  multiSignal: {
    eyebrow: "Multi-Signal SOS",
    title: "Pantavion Multi-Signal SOS",
    description:
      "A real roadmap route for lawful signal paths: cellular, Wi-Fi, Bluetooth, BLE, compatible satellite, LoRa hardware, rescue gateways, and certified integrations.",
    status: "hardwareRequired",
    truth:
      "LoRa, HF, VHF, UHF, maritime, aviation, and SAR paths require compatible hardware, legal radio use, certification, and field testing.",
  },
  safepulse: {
    eyebrow: "SafePulse",
    title: "Pantavion SafePulse",
    description:
      "A real future route for survival-state signals using motion, sound, device sensors, wearables, rescue hardware, and explicit consent.",
    status: "futureRoadmap",
    truth:
      "No claim of guaranteed vital-sign detection under rubble or through concrete without validated sensors and rescue-grade testing.",
  },
  globalNetwork: {
    eyebrow: "Global Emergency Network",
    title: "Pantavion Global Emergency Network",
    description:
      "A real institutional route for connecting people, phones, offline identity, local mesh, rescue hardware, hospitals, civil protection, coast guards, and SAR partners.",
    status: "institutionRequired",
    truth:
      "Global rescue routing requires formal agreements, jurisdiction controls, audit logs, consent, false-alarm governance, and lawful dispatch rules.",
  },
} as const;
