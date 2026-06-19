"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type PantavionLanguageOption = {
  code: string;
  label: string;
  nativeLabel: string;
  htmlLang: string;
};

type UiText = {
  back: string;
  layer: string;
  title: string;
  subtitle: string;
  naturalTarget: string;
  selectableNow: string;
  modes: string;
  me: string;
  myLanguage: string;
  mySearch: string;
  myPlaceholder: string;
  speak: string;
  translateToOther: string;
  speakTranslation: string;
  other: string;
  otherLanguage: string;
  otherSearch: string;
  otherPlaceholder: string;
  otherSpeaks: string;
  translateBack: string;
  speakBack: string;
  userHears: string;
  cameraTitle: string;
  cameraText: string;
  statusTitle: string;
  truth: string;
  providerRequired: string;
  providerMissing: string;
  listening: string;
  speechUnavailable: string;
  writeFirst: string;
  translationRequested: string;
  translated: string;
  globalSelectorSynced: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const STORAGE_KEY = "pantavion.ui.language";

const PRIORITY_LABELS: Record<string, string> = {
  el: "Greek / Ελληνικά",
  en: "English",
  fr: "French / Français",
  es: "Spanish / Español",
  de: "German / Deutsch",
  it: "Italian / Italiano",
  pt: "Portuguese / Português",
  ru: "Russian / Русский",
  ar: "Arabic / العربية",
  he: "Hebrew / עברית",
  tr: "Turkish / Türkçe",
  zh: "Chinese / 中文",
  ja: "Japanese / 日本語",
  ko: "Korean / 한국어",
  hi: "Hindi / हिन्दी",
  ur: "Urdu / اردو",
  fa: "Persian / فارسی",
  sw: "Swahili / Kiswahili",
};

const STARTER_LANGUAGE_CODES = Array.from(
  new Set(
    "aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu ace ach ada ady agq ain alt arn asa ast awa bal ban bas bem bez bho bik bin bla brx bug byn ceb cgg chr ckb cop crh dav doi dsb dua dyo ebu efi fil fon fur gaa gez gil gom gor haw hmn hsb iba ibb ilo kam kab kcg kfo kha khq kok kpe kri ksb ksf ksh lag lah lkt lua luo lus luy mai mak mas mdf mer mfe mgh mgo mni moh mua mus naq nds nso nus nyn pap pcm quc raj rof rom rup rwk sad sah saq sat sbp scn sco ses shi sid smn sms syr tem teo tig tiv tpi twq vai vun wae xog yav ybb yue zgh".split(/\s+/)
  )
).filter(Boolean);

function displayLanguageName(code: string): string {
  if (PRIORITY_LABELS[code]) return PRIORITY_LABELS[code];

  try {
    const displayNamesConstructor = (Intl as typeof Intl & {
      DisplayNames?: new (
        locales: string[],
        options: { type: "language"; languageDisplay?: "standard" | "dialect" }
      ) => { of: (code: string) => string | undefined };
    }).DisplayNames;

    if (displayNamesConstructor) {
      const displayNames = new displayNamesConstructor(["en"], {
        type: "language",
        languageDisplay: "standard",
      });

      return displayNames.of(code) || code.toUpperCase();
    }
  } catch {
    return code.toUpperCase();
  }

  return code.toUpperCase();
}

const LANGUAGE_OPTIONS: PantavionLanguageOption[] = STARTER_LANGUAGE_CODES.map((code) => {
  const label = displayLanguageName(code);
  return {
    code,
    label,
    nativeLabel: label,
    htmlLang: code,
  };
}).sort((a, b) =>
  a.label.localeCompare(b.label, undefined, {
    sensitivity: "base",
    numeric: true,
  })
);

function isKnownLanguage(code: string): boolean {
  return LANGUAGE_OPTIONS.some((language) => language.code === code);
}

function getLanguageMeta(code: string): PantavionLanguageOption {
  return LANGUAGE_OPTIONS.find((language) => language.code === code) || LANGUAGE_OPTIONS.find((language) => language.code === "en") || LANGUAGE_OPTIONS[0];
}

const UI_TEXT: Record<"en" | "el", UiText> = {
  en: {
    back: "Back to Pantavion",
    layer: "PantaTranslate / Universal Interpreter",
    title: "Speak naturally. Let Pantavion interpret the world.",
    subtitle:
      "Platform-level translation for travel, work, social, accessibility, camera scan, PantaAI and SOS. SOS only uses this system in emergency mode.",
    naturalTarget: "Natural-language universe target",
    selectableNow: "Selectable practical menu now",
    modes: "Voice • Text • Subtitles • Camera • SOS",
    me: "Me / User",
    myLanguage: "My language",
    mySearch: "Search my language",
    myPlaceholder: "Speak or write in your natural language...",
    speak: "Speak",
    translateToOther: "Translate to other person",
    speakTranslation: "Speak translation",
    other: "Other person",
    otherLanguage: "Other person's language",
    otherSearch: "Search other language",
    otherPlaceholder: "The other person speaks or writes here...",
    otherSpeaks: "Other speaks",
    translateBack: "Translate back to me",
    speakBack: "Speak back",
    userHears: "User hears / reads in",
    cameraTitle: "Camera / signs / menus / accessibility",
    cameraText:
      "Select an image from camera or files. Real OCR requires OCR provider configuration. This route is ready without pretending the provider exists.",
    statusTitle: "Status",
    truth:
      "Truth boundary: translation is assistive. Legal, medical, emergency and certified interpretation require configured providers, agreements and human/professional review where required.",
    providerRequired: "Provider required",
    providerMissing:
      "Live translation provider is not configured yet. Connect Google, Azure, DeepL, OpenAI or another approved provider before presenting this as fully live.",
    listening: "Listening...",
    speechUnavailable: "Speech recognition is not available in this browser.",
    writeFirst: "Write or speak text first.",
    translationRequested: "Translation requested. Checking provider...",
    translated: "Translation returned by configured provider.",
    globalSelectorSynced: "Global Pantavion language synced.",
  },
  el: {
    back: "Πίσω στο Pantavion",
    layer: "PantaTranslate / Παγκόσμιος Διερμηνέας",
    title: "Μίλα φυσικά. Άφησε το Pantavion να ερμηνεύσει τον κόσμο.",
    subtitle:
      "Μετάφραση επιπέδου πλατφόρμας για ταξίδι, εργασία, κοινωνική χρήση, προσβασιμότητα, κάμερα, PantaAI και SOS. Το SOS χρησιμοποιεί αυτό το σύστημα μόνο σε λειτουργία ανάγκης.",
    naturalTarget: "Πλανητικός στόχος φυσικών γλωσσών",
    selectableNow: "Πρακτικές επιλογές τώρα",
    modes: "Φωνή • Κείμενο • Υπότιτλοι • Κάμερα • SOS",
    me: "Εγώ / Χρήστης",
    myLanguage: "Η γλώσσα μου",
    mySearch: "Αναζήτηση γλώσσας μου",
    myPlaceholder: "Μίλησε ή γράψε στη φυσική σου γλώσσα...",
    speak: "Μίλησε",
    translateToOther: "Μετάφραση προς τον άλλο",
    speakTranslation: "Άκου μετάφραση",
    other: "Άλλο άτομο",
    otherLanguage: "Γλώσσα άλλου ατόμου",
    otherSearch: "Αναζήτηση άλλης γλώσσας",
    otherPlaceholder: "Το άλλο άτομο μιλά ή γράφει εδώ...",
    otherSpeaks: "Μιλά ο άλλος",
    translateBack: "Μετάφραση πίσω σε μένα",
    speakBack: "Άκου πίσω",
    userHears: "Ο χρήστης ακούει / διαβάζει σε",
    cameraTitle: "Κάμερα / πινακίδες / μενού / προσβασιμότητα",
    cameraText:
      "Επίλεξε εικόνα από κάμερα ή αρχεία. Η πραγματική OCR ανάγνωση χρειάζεται provider. Η διαδρομή είναι έτοιμη χωρίς να προσποιείται ότι ο provider υπάρχει.",
    statusTitle: "Κατάσταση",
    truth:
      "Όριο αλήθειας: η μετάφραση είναι βοηθητική. Νομική, ιατρική, έκτακτη και πιστοποιημένη διερμηνεία απαιτεί ρυθμισμένους providers, συμφωνίες και ανθρώπινο/επαγγελματικό έλεγχο όπου χρειάζεται.",
    providerRequired: "Απαιτείται provider",
    providerMissing:
      "Δεν έχει ρυθμιστεί ακόμα live translation provider. Σύνδεσε Google, Azure, DeepL, OpenAI ή άλλον εγκεκριμένο provider πριν εμφανιστεί ως πλήρως ζωντανή μετάφραση.",
    listening: "Ακούω...",
    speechUnavailable: "Η αναγνώριση ομιλίας δεν είναι διαθέσιμη σε αυτόν τον browser.",
    writeFirst: "Γράψε ή μίλησε πρώτα.",
    translationRequested: "Ζητήθηκε μετάφραση. Έλεγχος provider...",
    translated: "Η μετάφραση επιστράφηκε από ρυθμισμένο provider.",
    globalSelectorSynced: "Η παγκόσμια γλώσσα Pantavion συγχρονίστηκε.",
  },
};

function getUiLanguage(globalLanguage: string): "en" | "el" {
  return globalLanguage === "el" ? "el" : "en";
}

function filterLanguageOptions(query: string, selectedCode: string): PantavionLanguageOption[] {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? LANGUAGE_OPTIONS.filter((language) => {
        return (
          language.code.toLowerCase().includes(normalizedQuery) ||
          language.label.toLowerCase().includes(normalizedQuery) ||
          language.nativeLabel.toLowerCase().includes(normalizedQuery)
        );
      })
    : LANGUAGE_OPTIONS;

  const selected = LANGUAGE_OPTIONS.find((language) => language.code === selectedCode);
  const withSelected = selected && !filtered.some((language) => language.code === selected.code)
    ? [selected, ...filtered]
    : filtered;

  return withSelected.slice(0, 320);
}

function normalizeGlobalLanguage(value: string | null): string {
  if (!value) return "auto";
  if (value === "auto" || value === "world") return value;
  return isKnownLanguage(value) ? value : "auto";
}

function getStoredLanguage(): string {
  if (typeof window === "undefined") return "auto";

  try {
    return normalizeGlobalLanguage(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return "auto";
  }
}

export default function TranslatePage() {
  const [globalLanguage, setGlobalLanguage] = useState("auto");
  const [myLanguage, setMyLanguage] = useState("el");
  const [otherLanguage, setOtherLanguage] = useState("en");
  const [mySearch, setMySearch] = useState("");
  const [otherSearch, setOtherSearch] = useState("");
  const [userText, setUserText] = useState("");
  const [otherText, setOtherText] = useState("");
  const [userTranslation, setUserTranslation] = useState("");
  const [otherTranslation, setOtherTranslation] = useState("");
  const [status, setStatus] = useState("Ready.");
  const [providerMessage, setProviderMessage] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const uiLanguage = getUiLanguage(globalLanguage);
  const t = UI_TEXT[uiLanguage];

  const myLanguageMeta = getLanguageMeta(myLanguage);
  const otherLanguageMeta = getLanguageMeta(otherLanguage);

  const myOptions = useMemo(() => filterLanguageOptions(mySearch, myLanguage), [mySearch, myLanguage]);
  const otherOptions = useMemo(() => filterLanguageOptions(otherSearch, otherLanguage), [otherSearch, otherLanguage]);

  useEffect(() => {
    const initialLanguage = getStoredLanguage();
    setGlobalLanguage(initialLanguage);

    if (isKnownLanguage(initialLanguage)) {
      setMyLanguage(initialLanguage);
      setStatus(UI_TEXT[getUiLanguage(initialLanguage)].globalSelectorSynced);
    }

    function applyLanguage(value: string | null) {
      const nextLanguage = normalizeGlobalLanguage(value);
      setGlobalLanguage(nextLanguage);

      if (isKnownLanguage(nextLanguage)) {
        setMyLanguage(nextLanguage);
      }

      setStatus(UI_TEXT[getUiLanguage(nextLanguage)].globalSelectorSynced);
    }

    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) applyLanguage(event.newValue);
    }

    function onPantavionLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: string }>;
      applyLanguage(customEvent.detail?.language || getStoredLanguage());
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("pantavion:language-change", onPantavionLanguageChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pantavion:language-change", onPantavionLanguageChange);
      recognitionRef.current?.stop();
    };
  }, []);

  function speak(text: string, languageCode: string) {
    if (typeof window === "undefined" || !text.trim()) return;

    if (!("speechSynthesis" in window)) {
      setStatus(t.speechUnavailable);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageMeta(languageCode).htmlLang;
    window.speechSynthesis.speak(utterance);
  }

  function startListening(target: "user" | "other") {
    if (typeof window === "undefined") return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      setStatus(t.speechUnavailable);
      return;
    }

    recognitionRef.current?.stop();

    const recognition = new Recognition();
    recognition.lang = target === "user" ? myLanguageMeta.htmlLang : otherLanguageMeta.htmlLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results || [])
        .map((result: any) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();

      if (!transcript) return;

      if (target === "user") {
        setUserText((current) => [current, transcript].filter(Boolean).join(" "));
      } else {
        setOtherText((current) => [current, transcript].filter(Boolean).join(" "));
      }
    };

    recognition.onerror = () => {
      setStatus(t.speechUnavailable);
      setListening(null);
    };

    recognition.onend = () => {
      setListening(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(target);
    setStatus(t.listening);
  }

  const [listening, setListening] = useState<"user" | "other" | null>(null);

  async function requestTranslation(direction: "userToOther" | "otherToUser") {
    const sourceText = direction === "userToOther" ? userText.trim() : otherText.trim();
    const from = direction === "userToOther" ? myLanguage : otherLanguage;
    const to = direction === "userToOther" ? otherLanguage : myLanguage;

    if (!sourceText) {
      setStatus(t.writeFirst);
      return;
    }

    setStatus(t.translationRequested);
    setProviderMessage("");

    try {
      const response = await fetch("/api/pantavion/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sourceText,
          from,
          to,
          mode: "assistive",
          surface: "pantavion-translate",
        }),
      });

      const result = await response.json().catch(() => ({}));

      const translatedText =
        result.translatedText ||
        result.translation ||
        result.text ||
        result.output ||
        "";

      if (!response.ok || !translatedText) {
        setStatus(t.providerRequired);
        setProviderMessage(result.message || result.error || t.providerMissing);
        return;
      }

      if (direction === "userToOther") {
        setUserTranslation(translatedText);
      } else {
        setOtherTranslation(translatedText);
      }

      setStatus(t.translated);
    } catch {
      setStatus(t.providerRequired);
      setProviderMessage(t.providerMissing);
    }
  }

  function handleCameraFile(file: File | null) {
    if (!file) return;

    setStatus("Camera/image selected. OCR provider is required for real text extraction.");
    setProviderMessage(
      "PantaTranslate camera scan route is ready, but OCR provider is not configured yet."
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] px-5 py-8 text-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[2rem] border border-cyan-300/30 bg-gradient-to-br from-[#071528] via-[#08111f] to-black p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="rounded-full border border-yellow-300/30 px-4 py-2 text-sm font-bold text-yellow-100"
            >
              {t.back}
            </Link>
            <div className="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-xs text-yellow-100">
              <strong>World Language Layer</strong>
              <br />
              250+ starter language/locales now. 7,000+ natural languages in Pantavion scope.
            </div>
          </div>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.35em] text-cyan-200">
            {t.layer}
          </p>
          <h1 className="mt-4 max-w-5xl text-5xl font-black leading-none sm:text-6xl">
            {t.title}
          </h1>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-100">
            {t.subtitle}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-200">{t.naturalTarget}</p>
              <p className="mt-2 text-3xl font-black text-yellow-200">7,000+</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-200">{t.selectableNow}</p>
              <p className="mt-2 text-3xl font-black text-cyan-200">
                {LANGUAGE_OPTIONS.length}+
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-200">Modes</p>
              <p className="mt-2 text-lg font-black text-emerald-100">{t.modes}</p>
            </div>
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-blue-300/30 bg-blue-950/30 p-5">
            <h2 className="text-2xl font-black">{t.me}</h2>

            <label className="mt-5 block text-sm font-bold text-blue-100">
              {t.mySearch}
              <input
                value={mySearch}
                onChange={(event) => setMySearch(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-white outline-none"
                placeholder="Greek, Ελληνικά, el..."
              />
            </label>

            <label className="mt-4 block text-sm font-bold text-blue-100">
              {t.myLanguage}
              <select
                value={myLanguage}
                onChange={(event) => setMyLanguage(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-white outline-none"
              >
                {myOptions.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label} - {language.code}
                  </option>
                ))}
              </select>
            </label>

            <textarea
              value={userText}
              onChange={(event) => setUserText(event.target.value)}
              placeholder={t.myPlaceholder}
              className="mt-4 min-h-40 w-full rounded-3xl border border-white/10 bg-black/40 p-4 text-white"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => startListening("user")}
                className="rounded-full bg-blue-400 px-5 py-3 font-black text-slate-950"
              >
                {listening === "user" ? t.listening : t.speak}
              </button>
              <button
                type="button"
                onClick={() => requestTranslation("userToOther")}
                className="rounded-full bg-cyan-300 px-5 py-3 font-black text-slate-950"
              >
                {t.translateToOther}
              </button>
              <button
                type="button"
                onClick={() => speak(userTranslation, otherLanguage)}
                className="rounded-full border border-cyan-200 px-5 py-3 font-black text-cyan-100"
              >
                {t.speakTranslation}
              </button>
            </div>

            <div className="mt-4 rounded-3xl border border-cyan-300/20 bg-black/30 p-4">
              <p className="text-sm font-bold text-cyan-100">
                Other person hears / reads in {otherLanguageMeta.label}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xl font-bold">
                {userTranslation || "—"}
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-yellow-300/30 bg-yellow-950/10 p-5">
            <h2 className="text-2xl font-black">{t.other}</h2>

            <label className="mt-5 block text-sm font-bold text-yellow-100">
              {t.otherSearch}
              <input
                value={otherSearch}
                onChange={(event) => setOtherSearch(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-white outline-none"
                placeholder="English, Turkish, Arabic..."
              />
            </label>

            <label className="mt-4 block text-sm font-bold text-yellow-100">
              {t.otherLanguage}
              <select
                value={otherLanguage}
                onChange={(event) => setOtherLanguage(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-white outline-none"
              >
                {otherOptions.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label} - {language.code}
                  </option>
                ))}
              </select>
            </label>

            <textarea
              value={otherText}
              onChange={(event) => setOtherText(event.target.value)}
              placeholder={t.otherPlaceholder}
              className="mt-4 min-h-40 w-full rounded-3xl border border-white/10 bg-black/40 p-4 text-white"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => startListening("other")}
                className="rounded-full bg-orange-300 px-5 py-3 font-black text-slate-950"
              >
                {listening === "other" ? t.listening : t.otherSpeaks}
              </button>
              <button
                type="button"
                onClick={() => requestTranslation("otherToUser")}
                className="rounded-full bg-yellow-300 px-5 py-3 font-black text-slate-950"
              >
                {t.translateBack}
              </button>
              <button
                type="button"
                onClick={() => speak(otherTranslation, myLanguage)}
                className="rounded-full border border-yellow-200 px-5 py-3 font-black text-yellow-100"
              >
                {t.speakBack}
              </button>
            </div>

            <div className="mt-4 rounded-3xl border border-yellow-300/20 bg-black/30 p-4">
              <p className="text-sm font-bold text-yellow-100">
                {t.userHears} {myLanguageMeta.label}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xl font-bold">
                {otherTranslation || "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-300/30 bg-emerald-950/20 p-5">
          <h2 className="text-2xl font-black">{t.cameraTitle}</h2>
          <p className="mt-2 text-slate-200">{t.cameraText}</p>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => handleCameraFile(event.target.files?.[0] || null)}
            className="mt-4 block w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white"
          />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-black">{t.statusTitle}</h2>
          <p className="mt-2 text-cyan-100">{status}</p>
          {providerMessage ? (
            <p className="mt-3 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-3 text-yellow-100">
              {providerMessage}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-slate-300">{t.truth}</p>
        </section>
      </section>
    </main>
  );
}
