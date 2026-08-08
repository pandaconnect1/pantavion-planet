"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type Language = {
  code: string;
  label: string;
  speech: string;
};

type TranslationResponse = {
  ok?: boolean;
  translatedText?: string;
  translation?: string;
  text?: string;
  output?: string;
  message?: string;
  error?: string;
  provider?: string;
};

type SpeechRecognitionResultLike = {
  0?: { transcript?: string };
};

type SpeechRecognitionEventLike = {
  results?: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
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

const LANGUAGES: Language[] = [
  { code: "el", label: "Ελληνικά / Greek", speech: "el-GR" },
  { code: "en", label: "English", speech: "en-US" },
  { code: "ar", label: "العربية / Arabic", speech: "ar-SA" },
  { code: "tr", label: "Türkçe / Turkish", speech: "tr-TR" },
  { code: "fr", label: "Français / French", speech: "fr-FR" },
  { code: "es", label: "Español / Spanish", speech: "es-ES" },
  { code: "pt", label: "Português / Portuguese", speech: "pt-PT" },
  { code: "de", label: "Deutsch / German", speech: "de-DE" },
  { code: "it", label: "Italiano / Italian", speech: "it-IT" },
  { code: "ru", label: "Русский / Russian", speech: "ru-RU" },
  { code: "uk", label: "Українська / Ukrainian", speech: "uk-UA" },
  { code: "zh", label: "中文 / Chinese", speech: "zh-CN" },
  { code: "ja", label: "日本語 / Japanese", speech: "ja-JP" },
  { code: "ko", label: "한국어 / Korean", speech: "ko-KR" },
  { code: "hi", label: "हिन्दी / Hindi", speech: "hi-IN" },
  { code: "ur", label: "اردو / Urdu", speech: "ur-PK" },
  { code: "bn", label: "বাংলা / Bengali", speech: "bn-BD" },
  { code: "pa", label: "ਪੰਜਾਬੀ / Punjabi", speech: "pa-IN" },
  { code: "id", label: "Bahasa Indonesia", speech: "id-ID" },
  { code: "ms", label: "Bahasa Melayu / Malay", speech: "ms-MY" },
  { code: "th", label: "ไทย / Thai", speech: "th-TH" },
  { code: "vi", label: "Tiếng Việt / Vietnamese", speech: "vi-VN" },
  { code: "fa", label: "فارسی / Persian", speech: "fa-IR" },
  { code: "he", label: "עברית / Hebrew", speech: "he-IL" },
  { code: "sw", label: "Kiswahili / Swahili", speech: "sw-KE" },
  { code: "af", label: "Afrikaans", speech: "af-ZA" },
  { code: "nl", label: "Nederlands / Dutch", speech: "nl-NL" },
  { code: "pl", label: "Polski / Polish", speech: "pl-PL" },
  { code: "ro", label: "Română / Romanian", speech: "ro-RO" },
  { code: "bg", label: "Български / Bulgarian", speech: "bg-BG" },
  { code: "sr", label: "Српски / Serbian", speech: "sr-RS" },
  { code: "hr", label: "Hrvatski / Croatian", speech: "hr-HR" },
  { code: "cs", label: "Čeština / Czech", speech: "cs-CZ" },
  { code: "hu", label: "Magyar / Hungarian", speech: "hu-HU" },
  { code: "sv", label: "Svenska / Swedish", speech: "sv-SE" },
  { code: "no", label: "Norsk / Norwegian", speech: "nb-NO" },
  { code: "da", label: "Dansk / Danish", speech: "da-DK" },
  { code: "fi", label: "Suomi / Finnish", speech: "fi-FI" },
];

function languageByCode(code: string) {
  return LANGUAGES.find((language) => language.code === code) || LANGUAGES[0];
}

export default function TranslatePage() {
  const [fromLanguage, setFromLanguage] = useState("el");
  const [toLanguage, setToLanguage] = useState("en");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const fromMeta = useMemo(() => languageByCode(fromLanguage), [fromLanguage]);
  const toMeta = useMemo(() => languageByCode(toLanguage), [toLanguage]);

  async function translate() {
    const text = sourceText.trim();

    if (!text) {
      setError("Γράψε ή μίλησε πρώτα το κείμενο που θέλεις να μεταφραστεί.");
      return;
    }

    if (fromLanguage === toLanguage) {
      setError("Επίλεξε δύο διαφορετικές γλώσσες.");
      return;
    }

    setLoading(true);
    setError("");
    setProvider("");

    try {
      const response = await fetch("/api/pantavion/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          from: fromLanguage,
          to: toLanguage,
          sourceLanguage: fromLanguage,
          targetLanguage: toLanguage,
          bidirectional: true,
          mode: "assistive",
          surface: "pantavion-translate",
        }),
      });

      const result = (await response.json().catch(() => ({}))) as TranslationResponse;
      const output =
        result.translatedText ||
        result.translation ||
        result.text ||
        result.output ||
        "";

      if (!response.ok || !output.trim()) {
        setTranslatedText("");
        setError(result.message || result.error || "Η μετάφραση δεν επέστρεψε αποτέλεσμα.");
        return;
      }

      setTranslatedText(output.trim());
      setProvider(result.provider || "Pantavion translation runtime");
    } catch {
      setTranslatedText("");
      setError("Δεν ήταν δυνατή η σύνδεση με τη μετάφραση. Δοκίμασε ξανά.");
    } finally {
      setLoading(false);
    }
  }

  function swapDirection() {
    const nextFrom = toLanguage;
    const nextTo = fromLanguage;
    const nextSource = translatedText.trim() || sourceText;

    setFromLanguage(nextFrom);
    setToLanguage(nextTo);
    setSourceText(nextSource);
    setTranslatedText("");
    setError("");
    setProvider("");
  }

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      setError("Η φωνητική αναγνώριση δεν υποστηρίζεται από αυτόν τον browser.");
      return;
    }

    recognitionRef.current?.stop();

    const recognition = new Recognition();
    recognition.lang = fromMeta.speech;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();

      if (transcript) {
        setSourceText((current) => [current, transcript].filter(Boolean).join(" "));
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setError("Δεν μπόρεσα να ακούσω καθαρά. Δοκίμασε ξανά ή γράψε το κείμενο.");
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    setError("");
    recognition.start();
  }

  function speakResult() {
    if (!translatedText.trim() || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = toMeta.speech;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#192b55_0,#071020_48%,#02040b_100%)] px-4 py-5 text-white sm:px-6 sm:py-8">
      <section className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-full border border-[#f6c85f]/25 bg-white/5 px-4 py-2 text-sm font-bold text-white no-underline"
          >
            ← Pantavion
          </Link>
          <span className="text-xs font-black uppercase tracking-[0.22em] text-[#f6c85f]">
            PantaTranslate
          </span>
        </header>

        <section className="mt-5 rounded-[1.75rem] border border-[#f6c85f]/25 bg-[#071020]/92 p-4 shadow-2xl sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f6c85f]">
              Αμφίδρομη μετάφραση ↔
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Γράψε ή μίλα. Πάρε τη μετάφραση αμέσως.
            </h1>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <label className="block text-xs font-bold text-blue-200">
              Από
              <select
                value={fromLanguage}
                onChange={(event) => setFromLanguage(event.target.value)}
                className="mt-2 w-full rounded-xl border border-blue-300/30 bg-blue-950/25 px-3 py-3 text-sm font-bold text-white outline-none"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={swapDirection}
              aria-label="Αντιστροφή γλωσσών"
              className="mb-0.5 h-12 w-12 rounded-full border border-cyan-300/35 bg-cyan-300/10 text-xl font-black text-cyan-100"
            >
              ↔
            </button>

            <label className="block text-xs font-bold text-yellow-100">
              Προς
              <select
                value={toLanguage}
                onChange={(event) => setToLanguage(event.target.value)}
                className="mt-2 w-full rounded-xl border border-yellow-300/30 bg-yellow-950/15 px-3 py-3 text-sm font-bold text-white outline-none"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-6 block text-sm font-black text-blue-100">
            Κείμενο προς μετάφραση
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="π.χ. Καλησπέρα, πώς είσαι;"
              autoFocus
              className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-blue-300/25 bg-[#020711] p-4 text-lg text-white outline-none placeholder:text-slate-500 focus:border-blue-300/60"
            />
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr]">
            <button
              type="button"
              onClick={startListening}
              className="rounded-full border border-blue-300/40 bg-blue-400/15 px-5 py-3 font-black text-blue-100"
            >
              {listening ? "🎙️ Ακούω…" : "🎙️ Μίλα"}
            </button>
            <button
              type="button"
              onClick={translate}
              disabled={loading}
              className="rounded-full bg-cyan-300 px-6 py-3 text-base font-black text-slate-950 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? "Μεταφράζω…" : `Μετάφραση σε ${toMeta.label}`}
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-400/10 p-4 text-sm font-bold text-red-100">
              {error}
            </div>
          ) : null}

          <section className="mt-5 rounded-2xl border border-yellow-300/30 bg-yellow-950/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-100">
                Αποτέλεσμα · {toMeta.label}
              </p>
              <button
                type="button"
                onClick={speakResult}
                disabled={!translatedText}
                className="rounded-full border border-yellow-300/30 px-3 py-1.5 text-xs font-black text-yellow-100 disabled:opacity-30"
              >
                🔊 Άκου
              </button>
            </div>
            <p className="mt-3 min-h-16 whitespace-pre-wrap text-xl font-bold leading-8 text-white">
              {translatedText || "Η μετάφραση θα εμφανιστεί εδώ."}
            </p>
            {provider ? (
              <p className="mt-3 text-[11px] text-slate-500">Provider: {provider}</p>
            ) : null}
          </section>

          <p className="mt-4 text-xs leading-5 text-slate-400">
            Το ↔ αντιστρέφει αμέσως τις δύο γλώσσες για απλή συνομιλία δύο ατόμων.
          </p>
        </section>
      </section>
    </main>
  );
}
