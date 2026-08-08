"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { globalEmergencyLanguages } from "@/core/emergency/global-emergency-languages";

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

type SpeechRecognitionResultLike = { 0?: { transcript?: string } };
type SpeechRecognitionEventLike = { results?: ArrayLike<SpeechRecognitionResultLike> };
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

const SPEECH_LOCALES: Record<string, string> = {
  el: "el-GR", en: "en-US", ar: "ar-SA", tr: "tr-TR", fr: "fr-FR",
  es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", ru: "ru-RU",
  uk: "uk-UA", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR", hi: "hi-IN",
  ur: "ur-PK", bn: "bn-BD", pa: "pa-IN", id: "id-ID", ms: "ms-MY",
  th: "th-TH", vi: "vi-VN", fa: "fa-IR", he: "he-IL", sw: "sw-KE",
  af: "af-ZA", nl: "nl-NL", pl: "pl-PL", ro: "ro-RO", bg: "bg-BG",
  sr: "sr-RS", hr: "hr-HR", cs: "cs-CZ", hu: "hu-HU", sv: "sv-SE",
  no: "nb-NO", da: "da-DK", fi: "fi-FI", am: "am-ET", ha: "ha-NG",
  zu: "zu-ZA", xh: "xh-ZA", ta: "ta-IN", te: "te-IN", ml: "ml-IN",
  kn: "kn-IN", mr: "mr-IN", gu: "gu-IN", ne: "ne-NP", si: "si-LK",
};

const LANGUAGES = globalEmergencyLanguages.map((language) => ({
  code: language.code,
  label:
    language.nativeLabel && language.nativeLabel !== language.label
      ? `${language.nativeLabel} · ${language.label}`
      : language.label,
  speech: SPEECH_LOCALES[language.code] || language.code,
  direction: language.direction,
}));

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

  function speak(text: string, languageCode: string) {
    if (!text.trim() || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageByCode(languageCode).speech;
    window.speechSynthesis.speak(utterance);
  }

  async function translateText(text: string, autoSpeak = false) {
    const cleanText = text.trim();
    if (!cleanText) {
      setError("Γράψε ή μίλα πρώτα το κείμενο που θέλεις να μεταφραστεί.");
      return "";
    }
    if (fromLanguage === toLanguage) {
      setError("Επίλεξε δύο διαφορετικές γλώσσες.");
      return "";
    }

    setLoading(true);
    setError("");
    setProvider("");

    try {
      const response = await fetch("/api/pantavion/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanText,
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
      const output = result.translatedText || result.translation || result.text || result.output || "";

      if (!response.ok || !output.trim()) {
        setTranslatedText("");
        setError(result.message || result.error || "Η μετάφραση δεν επέστρεψε αποτέλεσμα για αυτό το ζεύγος γλωσσών.");
        return "";
      }

      const translated = output.trim();
      setTranslatedText(translated);
      setProvider(result.provider || "Pantavion");
      if (autoSpeak) speak(translated, toLanguage);
      return translated;
    } catch {
      setTranslatedText("");
      setError("Δεν ήταν δυνατή η σύνδεση με τη μετάφραση. Δοκίμασε ξανά.");
      return "";
    } finally {
      setLoading(false);
    }
  }

  function translate() {
    void translateText(sourceText, false);
  }

  function swapDirection(clearForNextSpeaker = false) {
    const oldFrom = fromLanguage;
    const oldTo = toLanguage;
    setFromLanguage(oldTo);
    setToLanguage(oldFrom);
    setSourceText(clearForNextSpeaker ? "" : translatedText.trim() || sourceText);
    setTranslatedText("");
    setError("");
    setProvider("");
  }

  function startListening(autoTranslate = false) {
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

      if (!transcript) return;
      setSourceText(transcript);
      if (autoTranslate) void translateText(transcript, true);
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

  return (
    <main className="min-h-screen bg-[#102a56] px-4 py-4 text-white sm:px-6 sm:py-6">
      <section className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-3 py-1">
          <Link href="/" className="text-sm font-bold text-white/85 no-underline">← Pantavion</Link>
          <span className="text-sm font-black tracking-wide text-[#f6c85f]">PantaTranslate</span>
        </header>

        <section className="mt-4 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#17376d] shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
            <h1 className="text-2xl font-black sm:text-3xl">Μετάφραση</h1>
            <span className="text-xs font-bold text-white/55">7 ήπειροι · {LANGUAGES.length}+ γλώσσες</span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/10 px-4 py-4 sm:px-6">
            <select value={fromLanguage} onChange={(event) => setFromLanguage(event.target.value)} className="min-w-0 rounded-xl border border-blue-300/30 bg-[#214784] px-3 py-3 text-sm font-bold text-white outline-none">
              {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
            </select>
            <button type="button" onClick={() => swapDirection(false)} aria-label="Αντιστροφή γλωσσών" className="h-11 w-11 rounded-full border border-cyan-200/30 bg-[#245b92] text-xl font-black text-cyan-100">↔</button>
            <select value={toLanguage} onChange={(event) => setToLanguage(event.target.value)} className="min-w-0 rounded-xl border border-[#f6c85f]/35 bg-[#3a4d79] px-3 py-3 text-sm font-bold text-white outline-none">
              {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
            </select>
          </div>

          <div className="px-4 py-4 sm:px-6">
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Γράψε εδώ…"
              dir={fromMeta.direction}
              autoFocus
              className="min-h-40 w-full resize-y rounded-2xl border border-white/10 bg-[#0f2b59] p-4 text-lg text-white outline-none placeholder:text-blue-100/45 focus:border-cyan-300/55"
            />

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => startListening(false)} className="rounded-full border border-blue-200/30 bg-[#245b92] px-4 py-3 font-black text-white">{listening ? "🎙️ Ακούω…" : "🎙️ Μίλα"}</button>
              <button type="button" onClick={() => startListening(true)} disabled={loading} className="rounded-full border border-cyan-200/30 bg-[#1d6388] px-4 py-3 font-black text-white disabled:opacity-60">🎙️ Μίλα & Μετάφραση</button>
              <button type="button" onClick={translate} disabled={loading} className="rounded-full bg-cyan-300 px-5 py-3 font-black text-[#102a56] disabled:opacity-60">{loading ? "Μεταφράζω…" : "Μετάφραση"}</button>
            </div>

            {error ? <div className="mt-4 rounded-xl border border-red-200/30 bg-red-300/10 p-3 text-sm font-bold text-red-50">{error}</div> : null}

            <div className="mt-4 rounded-2xl border border-[#f6c85f]/25 bg-[#203b6e] p-4" dir={toMeta.direction}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#f6c85f]">{toMeta.label}</span>
                <button type="button" onClick={() => speak(translatedText, toLanguage)} disabled={!translatedText} className="rounded-full border border-[#f6c85f]/25 px-3 py-1.5 text-xs font-black text-[#ffe29a] disabled:opacity-30">🔊 Άκου</button>
              </div>
              <p className="mt-3 min-h-16 whitespace-pre-wrap text-xl font-bold leading-8 text-white">{translatedText || "Η μετάφραση θα εμφανιστεί εδώ."}</p>
              {provider ? <p className="mt-2 text-[10px] text-white/35">{provider}</p> : null}
            </div>

            <button type="button" onClick={() => swapDirection(true)} className="mt-3 w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-white/90">
              Επόμενος ομιλητής ↔
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
