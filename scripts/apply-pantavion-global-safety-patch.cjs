const fs = require("fs");
const path = require("path");

const root = process.cwd();

function full(file) {
  return path.join(root, file);
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(full(file)), { recursive: true });
}

function write(file, content) {
  ensureDir(file);
  fs.writeFileSync(full(file), content.replace(/\r?\n/g, "\n"), "utf8");
  console.log("[write]", file);
}

function writeIfMissing(file, content) {
  if (fs.existsSync(full(file))) {
    console.log("[keep]", file);
    return;
  }
  write(file, content);
}

function read(file) {
  return fs.readFileSync(full(file), "utf8");
}

function patchText(file, updater) {
  if (!fs.existsSync(full(file))) {
    console.log("[skip missing]", file);
    return;
  }
  const before = read(file);
  const after = updater(before);
  if (after !== before) {
    write(file, after);
    console.log("[patch]", file);
  } else {
    console.log("[no change]", file);
  }
}

function walk(dir) {
  if (!fs.existsSync(full(dir))) return [];
  const out = [];
  for (const item of fs.readdirSync(full(dir), { withFileTypes: true })) {
    const rel = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (["node_modules", ".next", ".git", "dist", "out"].includes(item.name)) continue;
      out.push(...walk(rel));
    } else {
      out.push(rel);
    }
  }
  return out;
}

write("core/i18n/pantavion-global-language.ts", `
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
`);

write("components/pantavion/PantavionLanguageSelect.tsx", `
"use client";

import { useEffect, useState } from "react";
import {
  PANTAVION_LANGUAGE_STORAGE_KEY,
  isRtlLanguage,
  pantavionLanguages,
  resolvePantavionLanguage,
} from "@/core/i18n/pantavion-global-language";

export function usePantavionLanguage(defaultLang = "el") {
  const [lang, setLangState] = useState(defaultLang);

  useEffect(() => {
    const saved = window.localStorage.getItem(PANTAVION_LANGUAGE_STORAGE_KEY);
    const next = saved || defaultLang;
    setLangState(next);
    document.documentElement.lang = next;
    document.documentElement.dir = isRtlLanguage(next) ? "rtl" : "ltr";

    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (!custom.detail) return;
      setLangState(custom.detail);
      document.documentElement.lang = custom.detail;
      document.documentElement.dir = isRtlLanguage(custom.detail) ? "rtl" : "ltr";
    };

    window.addEventListener("pantavion-language-change", handler as EventListener);
    return () => window.removeEventListener("pantavion-language-change", handler as EventListener);
  }, [defaultLang]);

  function setLang(value: string) {
    setLangState(value);
    window.localStorage.setItem(PANTAVION_LANGUAGE_STORAGE_KEY, value);
    document.documentElement.lang = value;
    document.documentElement.dir = isRtlLanguage(value) ? "rtl" : "ltr";
    window.dispatchEvent(new CustomEvent("pantavion-language-change", { detail: value }));
  }

  return {
    lang,
    setLang,
    language: resolvePantavionLanguage(lang),
  };
}

export function PantavionLanguageSelect({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const { lang, setLang } = usePantavionLanguage();

  return (
    <label className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {label ? <span>{label}</span> : null}
      <select
        value={lang}
        onChange={(event) => setLang(event.target.value)}
        aria-label="Pantavion global language selector"
        style={{
          minWidth: 190,
          borderRadius: 999,
          border: "1px solid rgba(243, 196, 84, .55)",
          background: "#050914",
          color: "#fff7d6",
          padding: "10px 14px",
          fontWeight: 800,
        }}
      >
        {pantavionLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
`);

write("core/actions/pantavion-action-state.ts", `
export type PantavionActionState =
  | "worksNow"
  | "opensRoute"
  | "needsPermission"
  | "needsSetup"
  | "needsContact"
  | "needsInstitution"
  | "comingSoon"
  | "disabled";

export type PantavionActionSpec = {
  id: string;
  label: string;
  state: PantavionActionState;
  href?: string;
  permission?: "location" | "camera" | "microphone" | "contacts" | "notifications";
  institutionRequired?: boolean;
  explanation: {
    el: string;
    en: string;
  };
};

export const actionStateLabels: Record<PantavionActionState, { el: string; en: string }> = {
  worksNow: { el: "Λειτουργεί τώρα", en: "Works now" },
  opensRoute: { el: "Ανοίγει πραγματική σελίδα", en: "Opens real page" },
  needsPermission: { el: "Χρειάζεται άδεια", en: "Needs permission" },
  needsSetup: { el: "Χρειάζεται ρύθμιση", en: "Needs setup" },
  needsContact: { el: "Χρειάζεται trusted contact", en: "Needs trusted contact" },
  needsInstitution: { el: "Χρειάζεται θεσμική συμφωνία", en: "Institution required" },
  comingSoon: { el: "Έρχεται σύντομα", en: "Coming soon" },
  disabled: { el: "Ανενεργό", en: "Disabled" },
};

export function explainActionState(state: PantavionActionState, lang = "el") {
  const text = actionStateLabels[state] ?? actionStateLabels.disabled;
  return lang === "el" ? text.el : text.en;
}

export function isActionAllowedNow(action: PantavionActionSpec): boolean {
  return action.state === "worksNow" || action.state === "opensRoute" || action.state === "needsPermission";
}

export const pantavionButtonLaw = {
  el: "Κάθε κουμπί πρέπει να λειτουργεί, να ανοίγει πραγματική σελίδα, να ζητά άδεια, να εξηγεί τι λείπει ή να είναι καθαρά ανενεργό.",
  en: "Every button must work, open a real route, request permission, explain what is missing, or be clearly disabled.",
} as const;
`);

write("core/identity/age-role-engine.ts", `
export type PantavionAgeBand =
  | "guardianManagedChild"
  | "child"
  | "youngTeen"
  | "olderTeen"
  | "adult"
  | "elderOptional";

export type PantavionSafetyRole =
  | "guardianManaged"
  | "minorProtected"
  | "teenProtected"
  | "independentAdult"
  | "elderSupportOptional";

export type PantavionAgeRole = {
  age: number | null;
  ageBand: PantavionAgeBand;
  safetyRole: PantavionSafetyRole;
  requiresGuardian: boolean;
  yearlyReviewRequired: boolean;
  nextReviewReason: string;
  uiMode: "simple" | "protected" | "standard" | "elder-simple";
};

export function calculateAgeFromBirthDate(birthDate: string, now = new Date()): number | null {
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return null;

  let age = now.getFullYear() - parsed.getFullYear();
  const monthDelta = now.getMonth() - parsed.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < parsed.getDate())) {
    age -= 1;
  }

  return Math.max(0, age);
}

export function resolvePantavionAgeRole(input: {
  age?: number | null;
  birthDate?: string | null;
  elderSupportOptIn?: boolean;
  now?: Date;
}): PantavionAgeRole {
  const age = typeof input.age === "number"
    ? input.age
    : input.birthDate
      ? calculateAgeFromBirthDate(input.birthDate, input.now)
      : null;

  if (age === null) {
    return {
      age,
      ageBand: "adult",
      safetyRole: "independentAdult",
      requiresGuardian: false,
      yearlyReviewRequired: true,
      nextReviewReason: "Age not yet verified. Ask for age band during onboarding.",
      uiMode: "standard",
    };
  }

  if (age <= 6) {
    return {
      age,
      ageBand: "guardianManagedChild",
      safetyRole: "guardianManaged",
      requiresGuardian: true,
      yearlyReviewRequired: true,
      nextReviewReason: "Child account must remain guardian-managed.",
      uiMode: "simple",
    };
  }

  if (age <= 12) {
    return {
      age,
      ageBand: "child",
      safetyRole: "minorProtected",
      requiresGuardian: true,
      yearlyReviewRequired: true,
      nextReviewReason: "Child Safety Mode should be reviewed every birthday.",
      uiMode: "simple",
    };
  }

  if (age <= 15) {
    return {
      age,
      ageBand: "youngTeen",
      safetyRole: "teenProtected",
      requiresGuardian: true,
      yearlyReviewRequired: true,
      nextReviewReason: "Teen protection, bullying and silent SOS settings must be reviewed yearly.",
      uiMode: "protected",
    };
  }

  if (age <= 17) {
    return {
      age,
      ageBand: "olderTeen",
      safetyRole: "teenProtected",
      requiresGuardian: true,
      yearlyReviewRequired: true,
      nextReviewReason: "Older minor status must transition to adult control at 18.",
      uiMode: "protected",
    };
  }

  if (age >= 65 && input.elderSupportOptIn) {
    return {
      age,
      ageBand: "elderOptional",
      safetyRole: "elderSupportOptional",
      requiresGuardian: false,
      yearlyReviewRequired: true,
      nextReviewReason: "Elder support is optional and must never remove adult autonomy.",
      uiMode: "elder-simple",
    };
  }

  return {
    age,
    ageBand: "adult",
    safetyRole: "independentAdult",
    requiresGuardian: false,
    yearlyReviewRequired: age === 18,
    nextReviewReason: age === 18
      ? "Adult transition review: confirm whether guardian links remain by consent."
      : "Standard adult account.",
    uiMode: "standard",
  };
}
`);

write("core/safety/human-safety-scenarios.ts", `
import type { PantavionActionState } from "@/core/actions/pantavion-action-state";
import type { PantavionAgeBand } from "@/core/identity/age-role-engine";

export type HumanSafetyScenario = {
  id: string;
  category:
    | "minor"
    | "elder"
    | "violence"
    | "robbery"
    | "bullying"
    | "medical"
    | "travel"
    | "offgrid"
    | "home"
    | "disaster";
  title: { el: string; en: string };
  description: { el: string; en: string };
  primaryAction: PantavionActionState;
  trustedContactFirst: boolean;
  silentOption: boolean;
  audience: PantavionAgeBand[];
};

export const humanSafetyScenarios: HumanSafetyScenario[] = [
  {
    id: "child-afraid",
    category: "minor",
    title: { el: "Παιδί: Φοβάμαι", en: "Child: I am afraid" },
    description: {
      el: "Απλό SOS για ανήλικο με γονέα/κηδεμόνα και trusted contacts πρώτα.",
      en: "Simple minor SOS with guardian and trusted contacts first.",
    },
    primaryAction: "needsSetup",
    trustedContactFirst: true,
    silentOption: true,
    audience: ["guardianManagedChild", "child", "youngTeen", "olderTeen"],
  },
  {
    id: "bullying-threat",
    category: "bullying",
    title: { el: "Bullying / απειλή", en: "Bullying / threat" },
    description: {
      el: "Ασφαλής ειδοποίηση trusted adult χωρίς περίπλοκη διαδικασία.",
      en: "Safe trusted-adult alert without a complicated process.",
    },
    primaryAction: "needsContact",
    trustedContactFirst: true,
    silentOption: true,
    audience: ["child", "youngTeen", "olderTeen"],
  },
  {
    id: "elder-fall",
    category: "elder",
    title: { el: "Ηλικιωμένος: Έπεσα", en: "Elder: I fell" },
    description: {
      el: "Μεγάλα κουμπιά, οικογένεια πρώτη, δυνατότητα SOS χωρίς πολλά βήματα.",
      en: "Large buttons, family first, SOS without many steps.",
    },
    primaryAction: "needsContact",
    trustedContactFirst: true,
    silentOption: false,
    audience: ["elderOptional"],
  },
  {
    id: "silent-violence",
    category: "violence",
    title: { el: "Silent SOS για βία", en: "Silent SOS for violence" },
    description: {
      el: "Σιωπηλό SOS όταν ο χρήστης δεν μπορεί ή δεν πρέπει να μιλήσει.",
      en: "Silent SOS when the user cannot or should not speak.",
    },
    primaryAction: "needsContact",
    trustedContactFirst: true,
    silentOption: true,
    audience: ["youngTeen", "olderTeen", "adult", "elderOptional"],
  },
  {
    id: "home-robbery",
    category: "robbery",
    title: { el: "Ληστεία / εισβολή", en: "Robbery / intrusion" },
    description: {
      el: "Προτεραιότητα σε σιωπηλή ειδοποίηση και τελευταία γνωστή τοποθεσία.",
      en: "Prioritizes silent alert and last known location.",
    },
    primaryAction: "needsContact",
    trustedContactFirst: true,
    silentOption: true,
    audience: ["adult", "elderOptional", "olderTeen"],
  },
  {
    id: "remote-no-signal",
    category: "offgrid",
    title: { el: "Χωρίς σήμα / απομόνωση", en: "No signal / isolation" },
    description: {
      el: "Offline queue, emergency profile και αποστολή όταν επιστρέψει σύνδεση.",
      en: "Offline queue, emergency profile and send when connection returns.",
    },
    primaryAction: "worksNow",
    trustedContactFirst: true,
    silentOption: false,
    audience: ["adult", "olderTeen", "elderOptional"],
  },
  {
    id: "earthquake-collapse",
    category: "disaster",
    title: { el: "Σεισμός / κατάρρευση", en: "Earthquake / collapse" },
    description: {
      el: "Γρήγορη ταυτότητα ανάγκης, φράσεις βοήθειας και τελευταία γνωστή τοποθεσία.",
      en: "Fast emergency identity, help phrases and last known location.",
    },
    primaryAction: "worksNow",
    trustedContactFirst: true,
    silentOption: false,
    audience: ["child", "youngTeen", "olderTeen", "adult", "elderOptional"],
  },
];

export function getHumanSafetyScenariosForAgeBand(ageBand: PantavionAgeBand) {
  return humanSafetyScenarios.filter((scenario) => scenario.audience.includes(ageBand));
}
`);

const safetyPage = `
"use client";

import Link from "next/link";
import { PantavionLanguageSelect, usePantavionLanguage } from "@/components/pantavion/PantavionLanguageSelect";
import { explainActionState, pantavionButtonLaw } from "@/core/actions/pantavion-action-state";
import { humanSafetyScenarios } from "@/core/safety/human-safety-scenarios";

const copy = {
  el: {
    back: "← Πίσω στην αρχική",
    eyebrow: "PANTAVION HUMAN SAFETY",
    title: "Κέντρο Ανθρώπινης Ασφάλειας",
    intro: "Παιδιά, έφηβοι, ηλικιωμένοι, βία, bullying, ληστεία, πτώση, ταξίδι, καταστροφή και απομόνωση — όλα πρέπει να είναι απλά, αληθινά και προσβάσιμα.",
    language: "Γλώσσα",
    openSos: "Άνοιγμα SOS",
    guardian: "Guardian Mode",
    rule: "Κανόνας κουμπιών",
    scenarios: "Βασικά σενάρια ασφάλειας",
    actionState: "Κατάσταση ενέργειας",
    trusted: "Trusted contacts πρώτα",
    silent: "Silent option",
    yes: "Ναι",
    no: "Όχι",
    next: "Επόμενο: σύνδεση με πραγματικό onboarding ηλικίας, trusted contacts και consent.",
  },
  en: {
    back: "← Back home",
    eyebrow: "PANTAVION HUMAN SAFETY",
    title: "Human Safety Center",
    intro: "Children, teens, elders, violence, bullying, robbery, falls, travel, disasters and isolation must stay simple, real and accessible.",
    language: "Language",
    openSos: "Open SOS",
    guardian: "Guardian Mode",
    rule: "Button rule",
    scenarios: "Core safety scenarios",
    actionState: "Action state",
    trusted: "Trusted contacts first",
    silent: "Silent option",
    yes: "Yes",
    no: "No",
    next: "Next: connect to real age onboarding, trusted contacts and consent.",
  },
};

function localized(value: { el: string; en: string }, lang: string) {
  return lang === "el" ? value.el : value.en;
}

export default function SafetyPage() {
  const { lang } = usePantavionLanguage();
  const t = lang === "el" ? copy.el : copy.en;

  return (
    <main className="safetyShell">
      <section className="panel">
        <div className="top">
          <Link href="/" className="back">{t.back}</Link>
          <PantavionLanguageSelect label={t.language} />
        </div>

        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p className="intro">{t.intro}</p>

        <div className="actions">
          <Link href="/sos" className="red">{t.openSos}</Link>
          <Link href="/pantavion/emergency/guardian" className="gold">{t.guardian}</Link>
        </div>

        <article className="law">
          <h2>{t.rule}</h2>
          <p>{lang === "el" ? pantavionButtonLaw.el : pantavionButtonLaw.en}</p>
        </article>

        <h2 className="sectionTitle">{t.scenarios}</h2>
        <section className="grid">
          {humanSafetyScenarios.map((scenario) => (
            <article key={scenario.id} className="card">
              <h3>{localized(scenario.title, lang)}</h3>
              <p>{localized(scenario.description, lang)}</p>
              <small>{t.actionState}: {explainActionState(scenario.primaryAction, lang)}</small>
              <small>{t.trusted}: {scenario.trustedContactFirst ? t.yes : t.no}</small>
              <small>{t.silent}: {scenario.silentOption ? t.yes : t.no}</small>
            </article>
          ))}
        </section>

        <article className="next">{t.next}</article>
      </section>

      <style>{\`
        .safetyShell {
          min-height: 100vh;
          background: radial-gradient(circle at 75% 10%, rgba(31, 81, 150, .35), transparent 34%), #040915;
          color: white;
          font-family: Arial, Helvetica, sans-serif;
          padding: 42px 18px 110px;
        }
        .panel {
          width: min(1180px, 100%);
          margin: 0 auto;
          border: 1px solid rgba(243,196,84,.35);
          border-radius: 28px;
          padding: clamp(22px, 5vw, 54px);
          background: rgba(8, 17, 34, .86);
        }
        .top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
        }
        .back, .gold, .red {
          text-decoration: none;
          font-weight: 900;
          border-radius: 999px;
        }
        .back {
          color: #fff2b8;
          border: 1px solid rgba(243,196,84,.45);
          padding: 10px 16px;
        }
        .eyebrow {
          color: #f3c454;
          letter-spacing: .35em;
          font-weight: 900;
          margin-top: 42px;
        }
        h1 {
          font-size: clamp(42px, 8vw, 82px);
          line-height: .96;
          margin: 14px 0 22px;
        }
        .intro {
          max-width: 980px;
          color: #d8e6ff;
          font-size: clamp(18px, 2.2vw, 24px);
          line-height: 1.65;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin: 30px 0;
        }
        .red, .gold {
          padding: 18px 24px;
          min-width: 220px;
          text-align: center;
        }
        .red {
          background: #ef2e37;
          color: white;
          box-shadow: 0 22px 55px rgba(239,46,55,.25);
        }
        .gold {
          background: linear-gradient(135deg, #f7d86b, #d9a82f);
          color: #080b12;
        }
        .law, .next {
          border: 1px solid rgba(243,196,84,.35);
          background: rgba(243,196,84,.08);
          border-radius: 22px;
          padding: 20px;
          margin: 28px 0;
        }
        .sectionTitle {
          color: #f7d86b;
          font-size: 34px;
          margin-top: 36px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        .card {
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 24px;
          padding: 22px;
          background: rgba(255,255,255,.045);
          min-height: 230px;
        }
        .card h3 {
          color: #f7d86b;
          font-size: 24px;
          margin: 0 0 16px;
        }
        .card p {
          color: #dbe7ff;
          line-height: 1.55;
        }
        .card small {
          display: block;
          color: #b7c8e8;
          margin-top: 9px;
          font-weight: 800;
        }
        @media (max-width: 700px) {
          .panel { border-radius: 0; border-left: 0; border-right: 0; }
          .red, .gold { width: 100%; }
        }
      \`}</style>
    </main>
  );
}
`;

write("app/safety/page.tsx", safetyPage);

const routeTemplate = (titleEl, titleEn, textEl, textEn, badge) => `
"use client";

import Link from "next/link";
import { PantavionLanguageSelect, usePantavionLanguage } from "@/components/pantavion/PantavionLanguageSelect";

export default function PantavionRoutePage() {
  const { lang } = usePantavionLanguage();
  const isEl = lang === "el";

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 78% 18%, rgba(31,81,150,.32), transparent 34%), #040915",
      color: "white",
      fontFamily: "Arial, Helvetica, sans-serif",
      padding: "34px 18px 100px"
    }}>
      <section style={{
        width: "min(1080px, 100%)",
        margin: "0 auto",
        border: "1px solid rgba(243,196,84,.35)",
        borderRadius: 28,
        padding: "clamp(22px, 5vw, 54px)",
        background: "rgba(8,17,34,.86)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/" style={{ color: "#fff2b8", textDecoration: "none", fontWeight: 900, border: "1px solid rgba(243,196,84,.45)", borderRadius: 999, padding: "10px 16px" }}>
            {isEl ? "← Πίσω στην αρχική" : "← Back home"}
          </Link>
          <PantavionLanguageSelect label={isEl ? "Γλώσσα" : "Language"} />
        </div>

        <p style={{ color: "#f3c454", letterSpacing: ".35em", fontWeight: 900, marginTop: 42 }}>${badge}</p>
        <h1 style={{ fontSize: "clamp(44px, 8vw, 84px)", lineHeight: .96, margin: "14px 0 22px" }}>
          {isEl ? ${JSON.stringify(titleEl)} : ${JSON.stringify(titleEn)}}
        </h1>
        <p style={{ maxWidth: 900, color: "#d8e6ff", fontSize: "clamp(18px, 2.2vw, 24px)", lineHeight: 1.65 }}>
          {isEl ? ${JSON.stringify(textEl)} : ${JSON.stringify(textEn)}}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 34 }}>
          <Link href="/sos" style={button("#ef2e37", "white")}>SOS</Link>
          <Link href="/safety" style={button("linear-gradient(135deg,#f7d86b,#d9a82f)", "#080b12")}>
            {isEl ? "Κέντρο ασφάλειας" : "Safety Center"}
          </Link>
          <Link href="/language" style={button("#101828", "white")}>
            {isEl ? "Γλώσσες" : "Languages"}
          </Link>
        </div>
      </section>
    </main>
  );
}

function button(background: string, color: string) {
  return {
    display: "block",
    textAlign: "center" as const,
    textDecoration: "none",
    background,
    color,
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 18,
    padding: "18px 20px",
    fontWeight: 900,
  };
}
`;

writeIfMissing("app/people/page.tsx", routeTemplate(
  "Άνθρωποι / Trusted Circles",
  "People / Trusted Circles",
  "Εδώ θα χτιστεί η ανθρώπινη σύνδεση: οικογένεια, φίλοι, trusted contacts, γονείς, κηδεμόνες και κύκλοι προστασίας.",
  "This surface will hold human connection: family, friends, trusted contacts, parents, guardians and protection circles.",
  "PANTAVION PEOPLE"
));

writeIfMissing("app/media/page.tsx", routeTemplate(
  "Media χωρίς νεκρά κουμπιά",
  "Media without dead buttons",
  "Η media επιφάνεια θα ανοίξει μόνο με πραγματικές λειτουργίες, καθαρά δικαιώματα και safety boundaries.",
  "The media surface will open only with real actions, clear permissions and safety boundaries.",
  "PANTAVION MEDIA"
));

writeIfMissing("app/pantaai/page.tsx", routeTemplate(
  "PantaAI Κέντρο Εκτέλεσης",
  "PantaAI Execution Center",
  "Το PantaAI θα λειτουργεί ως οργανωτής προθέσεων, ελέγχων, εργασιών και AI-assisted execution με audit πριν από κάθε κρίσιμη ενέργεια.",
  "PantaAI will work as an intent, audit, task and AI-assisted execution center before every critical action.",
  "PANTAVION AI"
));

writeIfMissing("app/work/page.tsx", routeTemplate(
  "Work / Services / Income",
  "Work / Services / Income",
  "Το Work θα χτιστεί με νόμιμα services, επαγγελματικά προφίλ, εισόδημα, αγγελίες και καθαρά όρια πληρωμών.",
  "Work will be built around legal services, professional profiles, income, listings and clear payment boundaries.",
  "PANTAVION WORK"
));

writeIfMissing("app/planet/page.tsx", routeTemplate(
  "Planet Screen",
  "Planet Screen",
  "Το Planet είναι η κεντρική ζωντανή οθόνη του Pantavion για χώρες, γλώσσες, πολιτισμούς, κοινότητες, ασφάλεια και παγκόσμια σύνδεση.",
  "Planet is Pantavion's living world screen for countries, languages, cultures, communities, safety and global connection.",
  "PANTAVION PLANET"
));

write("app/language/page.tsx", `
"use client";

import Link from "next/link";
import { PantavionLanguageSelect, usePantavionLanguage } from "@/components/pantavion/PantavionLanguageSelect";
import { pantavionLanguageDoctrine, pantavionLanguages } from "@/core/i18n/pantavion-global-language";

export default function LanguagePage() {
  const { lang } = usePantavionLanguage();
  const isEl = lang === "el";

  return (
    <main style={{
      minHeight: "100vh",
      background: "#040915",
      color: "white",
      fontFamily: "Arial, Helvetica, sans-serif",
      padding: "34px 18px 100px"
    }}>
      <section style={{
        width: "min(1180px, 100%)",
        margin: "0 auto",
        border: "1px solid rgba(243,196,84,.35)",
        borderRadius: 28,
        padding: "clamp(22px, 5vw, 54px)",
        background: "rgba(8,17,34,.86)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/" style={{ color: "#fff2b8", textDecoration: "none", fontWeight: 900, border: "1px solid rgba(243,196,84,.45)", borderRadius: 999, padding: "10px 16px" }}>
            {isEl ? "← Πίσω στην αρχική" : "← Back home"}
          </Link>
          <PantavionLanguageSelect label={isEl ? "Γλώσσα" : "Language"} />
        </div>

        <p style={{ color: "#f3c454", letterSpacing: ".35em", fontWeight: 900, marginTop: 42 }}>PANTAVION GLOBAL LANGUAGE GRID</p>
        <h1 style={{ fontSize: "clamp(44px, 8vw, 84px)", lineHeight: .96, margin: "14px 0 22px" }}>
          {isEl ? "Παγκόσμιο γλωσσικό σύστημα" : "Global language system"}
        </h1>
        <p style={{ maxWidth: 980, color: "#d8e6ff", fontSize: "clamp(18px, 2.2vw, 24px)", lineHeight: 1.65 }}>
          {isEl ? pantavionLanguageDoctrine.rule : "One language selection follows the user across every Pantavion surface."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginTop: 34 }}>
          {pantavionLanguages.map((language) => (
            <article key={language.code} style={{
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 18,
              padding: 16,
              background: "rgba(255,255,255,.045)"
            }}>
              <strong style={{ color: "#f7d86b", fontSize: 18 }}>{language.label}</strong>
              <p style={{ color: "#c9d7ef", marginBottom: 0 }}>{language.englishName} · {language.continent}</p>
              <small style={{ color: "#93a7c8" }}>{language.tier}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
`);

write("scripts/pantavion-ai-integrity-check.cjs", `
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const roots = ["app", "core", "components", "kernel"].filter((dir) => fs.existsSync(path.join(root, dir)));
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

const forbidden = [
  { text: "Route not mapped", reason: "public debug route text must not appear live" },
  { text: "works-now", reason: "internal registry language must not appear live" },
  { text: "next integrations", reason: "internal roadmap text must not appear live" },
  { text: "pantavion-home-language", reason: "language must be global, not homepage-only" },
  { text: "pantavion-emergency-language", reason: "language must be global, not emergency-only" },
  { text: "Λληνικά", reason: "Greek language label must be Ελληνικά" },
];

function walk(dir) {
  const out = [];
  for (const item of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (["node_modules", ".next", ".git", "dist", "out"].includes(item.name)) continue;
      out.push(...walk(rel));
    } else if (extensions.has(path.extname(item.name))) {
      out.push(rel);
    }
  }
  return out;
}

const files = roots.flatMap(walk);
const failures = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  for (const rule of forbidden) {
    if (content.includes(rule.text)) {
      failures.push({ file, text: rule.text, reason: rule.reason });
    }
  }
}

console.log("\\nPANTAVION AI READINESS AUDIT");
console.log("Checked files:", files.length);

if (failures.length) {
  console.log("\\nFAILURES:");
  for (const item of failures) {
    console.log("- " + item.file + " contains " + JSON.stringify(item.text) + " -> " + item.reason);
  }
  process.exit(1);
}

console.log("PASS: no known public debug strings, wrong Greek label, or non-global language keys found.");
`);

for (const dir of ["app", "components", "core"]) {
  for (const file of walk(dir)) {
    if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue;
    patchText(file, (text) =>
      text
        .replaceAll("pantavion-home-language", "pantavion-language")
        .replaceAll("pantavion-emergency-language", "pantavion-language")
        .replaceAll("Λληνικά", "Ελληνικά")
        .replaceAll("LLHNIKA", "Ελληνικά")
    );
  }
}

patchText("app/page.tsx", (text) => {
  let s = text
    .replaceAll("pantavion-home-language", "pantavion-language")
    .replaceAll("pantavion-emergency-language", "pantavion-language")
    .replaceAll("Λληνικά", "Ελληνικά");

  if (!s.includes("function labelFor(")) {
    s = s.replace(
      "const emergencyCards = [",
      `const navCopy: Record<string, Record<string, string>> = {
  el: {
    Planet: "Πλανήτης",
    Language: "Γλώσσα",
    People: "Άνθρωποι",
    Media: "Media",
    PantaAI: "PantaAI",
    Work: "Εργασία",
    Safety: "Ασφάλεια",
    SOS: "SOS",
  },
  en: {
    Planet: "Planet",
    Language: "Language",
    People: "People",
    Media: "Media",
    PantaAI: "PantaAI",
    Work: "Work",
    Safety: "Safety",
    SOS: "SOS",
  },
};

function labelFor(label: string, lang: string) {
  return navCopy[lang]?.[label] ?? navCopy.en[label] ?? label;
}

function detailFor(detail: string | { el: string; en: string }, lang: string) {
  if (typeof detail === "string") return detail;
  return lang === "el" ? detail.el : detail.en;
}

const emergencyCards = [`
    );
  }

  s = s.replaceAll("{item.label}", "{labelFor(item.label, lang)}");

  const details = [
    ["Real browser/PWA emergency command center", "Πραγματικό browser/PWA κέντρο έκτακτης ανάγκης"],
    ["Emergency profile, device support and offline doctrine", "Emergency profile, υποστήριξη συσκευής και offline δόγμα"],
    ["Before travel, driving, child safety, hunting or isolation", "Πριν από ταξίδι, οδήγηση, παιδί, κυνήγι ή απομόνωση"],
    ["Photo, video and audio capture with permission boundaries", "Φωτογραφία, βίντεο και ήχος με όρια συγκατάθεσης"],
    ["Remote area, disaster, no-signal and satellite-aware doctrine", "Απομακρυσμένη περιοχή, καταστροφή, χωρίς σήμα και satellite-aware δόγμα"],
    ["Countries, agencies, rescue teams and providers can request review", "Χώρες, υπηρεσίες, ομάδες διάσωσης και πάροχοι μπορούν να ζητήσουν έλεγχο σύνδεσης"],
    ["When and how to use SOS before and during real danger", "Πότε και πώς χρησιμοποιείται το SOS πριν και κατά τη διάρκεια πραγματικού κινδύνου"],
  ];

  for (const [en, el] of details) {
    s = s.replaceAll(`detail: "${en}"`, `detail: { el: "${el}", en: "${en}" }`);
  }

  s = s.replaceAll("<p>{card.detail}</p>", "<p>{detailFor(card.detail, lang)}</p>");
  s = s.replaceAll("<h2>Global language selector</h2>", `<h2>{lang === "el" ? "Παγκόσμια επιλογή γλώσσας" : "Global language selector"}</h2>`);

  return s;
});

const packagePath = full("package.json");
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  pkg.scripts = pkg.scripts || {};
  pkg.scripts["audit:pantavion"] = "node scripts/pantavion-ai-integrity-check.cjs";
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\\n", "utf8");
  console.log("[patch] package.json audit:pantavion");
}

console.log("\\nDONE: Pantavion global language, human safety, age role and AI audit foundation applied.");



