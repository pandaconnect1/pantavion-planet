"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type Language = { code: string; label: string; speech: string };
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

const LANGUAGES: Language[] = [
  { code: "el", label: "Ελληνικά", speech: "el-GR" },
  { code: "en", label: "English", speech: "en-US" },
  { code: "ar", label: "العربية", speech: "ar-SA" },
  { code: "tr", label: "Türkçe", speech: "tr-TR" },
  { code: "fr", label: "Français", speech: "fr-FR" },
  { code: "es", label: "Español", speech: "es-ES" },
  { code: "pt", label: "Português", speech: "pt-PT" },
  { code: "de", label: "Deutsch", speech: "de-DE" },
  { code: "it", label: "Italiano", speech: "it-IT" },
  { code: "ru", label: "Русский", speech: "ru-RU" },
  { code: "uk", label: "Українська", speech: "uk-UA" },
  { code: "zh", label: "中文", speech: "zh-CN" },
  { code: "ja", label: "日本語", speech: "ja-JP" },
  { code: "ko", label: "한국어", speech: "ko-KR" },
  { code: "hi", label: "हिन्दी", speech: "hi-IN" },
  { code: "ur", label: "اردو", speech: "ur-PK" },
  { code: "bn", label: "বাংলা", speech: "bn-BD" },
  { code: "pa", label: "ਪੰਜਾਬੀ", speech: "pa-IN" },
  { code: "id", label: "Bahasa Indonesia", speech: "id-ID" },
  { code: "ms", label: "Bahasa Melayu", speech: "ms-MY" },
  { code: "th", label: "ไทย", speech: "th-TH" },
  { code: "vi", label: "Tiếng Việt", speech: "vi-VN" },
  { code: "fa", label: "فارسی", speech: "fa-IR" },
  { code: "he", label: "עברית", speech: "he-IL" },
  { code: "sw", label: "Kiswahili", speech: "sw-KE" },
  { code: "af", label: "Afrikaans", speech: "af-ZA" },
  { code: "nl", label: "Nederlands", speech: "nl-NL" },
  { code: "pl", label: "Polski", speech: "pl-PL" },
  { code: "ro", label: "Română", speech: "ro-RO" },
  { code: "bg", label: "Български", speech: "bg-BG" },
  { code: "sr", label: "Српски", speech: "sr-RS" },
  { code: "hr", label: "Hrvatski", speech: "hr-HR" },
  { code: "cs", label: "Čeština", speech: "cs-CZ" },
  { code: "hu", label: "Magyar", speech: "hu-HU" },
  { code: "sv", label: "Svenska", speech: "sv-SE" },
  { code: "no", label: "Norsk", speech: "nb-NO" },
  { code: "da", label: "Dansk", speech: "da-DK" },
  { code: "fi", label: "Suomi", speech: "fi-FI" },
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
      setError("Γράψε ή μίλα πρώτα το κείμενο που θέλεις να μεταφραστεί.");
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
      const output = result.translatedText || result.translation || result.text || result.output || "";

      if (!response.ok || !output.trim()) {
        setTranslatedText("");
        setError(result.message || result.error || "Η μετάφραση δεν επέστρεψε αποτέλεσμα.");
        return;
      }

      setTranslatedText(output.trim());
      setProvider(result.provider || "Pantavion");
    } catch {
      setTranslatedText("");
      setError("Δεν ήταν δυνατή η σύνδεση με τη μετάφραση. Δοκίμασε ξανά.");
    } finally {
      setLoading(false);
    }
  }

  function swapDirection() {
    setFromLanguage(toLanguage);
    setToLanguage(fromLanguage);
    setSourceText(translatedText.trim() || sourceText);
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
      if (transcript) setSourceText((current) => [current, transcript].filter(Boolean).join(" "));
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
    <main className="min-h-screen bg-[#102a56] px-4 py-4 text-white sm:px-6 sm:py-6">
      <section className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-3 py-1">
          <Link href="/" className="text-sm font-bold text-white/85 no-underline">← Pantavion</Link>
          <span className="text-sm font-black tracking-wide text-[#f6c85f]">PantaTranslate</span>
        </header>

        <section className="mt-4 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#17376d] shadow-xl">
          <div className="border-b border-white/10 px-4 py-4 sm:px-6">
            <h1 className="text-2xl font-black sm:text-3xl">Μετάφραση</h1>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/10 px-4 py-4 sm:px-6">
            <select value={fromLanguage} onChange={(event) => setFromLanguage(event.target.value)} className="min-w-0 rounded-xl border border-blue-300/30 bg-[#214784] px-3 py-3 text-sm font-bold text-white outline-none">
              {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
            </select>
            <button type="button" onClick={swapDirection} aria-label="Αντιστροφή γλωσσών" className="h-11 w-11 rounded-full border border-cyan-200/30 bg-[#245b92] text-xl font-black text-cyan-100">↔</button>
            <select value={toLanguage} onChange={(event) => setToLanguage(event.target.value)} className="min-w-0 rounded-xl border border-[#f6c85f]/35 bg-[#3a4d79] px-3 py-3 text-sm font-bold text-white outline-none">
              {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
            </select>
          </div>

          <div className="px-4 py-4 sm:px-6">
            <textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Γράψε εδώ…" autoFocus className="min-h-40 w-full resize-y rounded-2xl border border-white/10 bg-[#0f2b59] p-4 text-lg text-white outline-none placeholder:text-blue-100/45 focus:border-cyan-300/55" />

            <div className="mt-3 flex gap-3">
              <button type="button" onClick={startListening} className="rounded-full border border-blue-200/30 bg-[#245b92] px-4 py-3 font-black text-white">{listening ? "🎙️ Ακούω…" : "🎙️ Μίλα"}</button>
              <button type="button" onClick={translate} disabled={loading} className="flex-1 rounded-full bg-cyan-300 px-5 py-3 font-black text-[#102a56] disabled:opacity-60">{loading ? "Μεταφράζω…" : "Μετάφραση"}</button>
            </div>

            {error ? <div className="mt-4 rounded-xl border border-red-200/30 bg-red-300/10 p-3 text-sm font-bold text-red-50">{error}</div> : null}

            <div className="mt-4 rounded-2xl border border-[#f6c85f]/25 bg-[#203b6e] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#f6c85f]">{toMeta.label}</span>
                <button type="button" onClick={speakResult} disabled={!translatedText} className="rounded-full border border-[#f6c85f]/25 px-3 py-1.5 text-xs font-black text-[#ffe29a] disabled:opacity-30">🔊 Άκου</button>
              </div>
              <p className="mt-3 min-h-16 whitespace-pre-wrap text-xl font-bold leading-8 text-white">{translatedText || "Η μετάφραση θα εμφανιστεί εδώ."}</p>
              {provider ? <p className="mt-2 text-[10px] text-white/35">{provider}</p> : null}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
