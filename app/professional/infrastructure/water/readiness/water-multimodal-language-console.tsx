"use client";

import { useMemo, useState } from "react";

type SpeechRecognitionResultEventLike = {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const priorityLanguages = [
  { code: "el", label: "Ελληνικά / Greek" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe / Turkish" },
  { code: "ar", label: "العربية / Arabic" },
  { code: "ar-SY", label: "العربية السورية / Syrian Arabic" },
  { code: "ar-PS", label: "العربية الفلسطينية / Palestinian Arabic" },
  { code: "ne", label: "नेपाली / Nepali" },
  { code: "hi", label: "हिन्दी / Hindi" },
  { code: "ur", label: "اردو / Urdu" },
  { code: "fil", label: "Filipino / Tagalog" },
  { code: "fr", label: "Français / French" },
  { code: "ln", label: "Lingála / Congo" },
  { code: "sw", label: "Kiswahili / Swahili" },
  { code: "ru", label: "Русский / Russian" },
  { code: "zh", label: "中文 / Chinese" },
  { code: "pl", label: "Polski / Polish" },
  { code: "hy", label: "Հայերեն / Armenian" },
  { code: "ro", label: "Română / Romanian" },
  { code: "bg", label: "Български / Bulgarian" },
];

const readinessPath =
  "/api/professional/infrastructure/water/language/multimodal/readiness";

const translationPath =
  "/api/professional/infrastructure/water/language/translate";

function shortSpeechLocale(code: string) {
  if (code === "ar-SY") return "ar-SY";
  if (code === "ar-PS") return "ar-PS";
  if (code === "zh") return "zh-CN";
  return code;
}

export default function WaterMultimodalLanguageConsole() {
  const [sourceLanguage, setSourceLanguage] = useState("el");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [spokenText, setSpokenText] = useState(
    "Το Pantavion πρέπει να υποστηρίζει κείμενο, ομιλία, ήχο, εικόνα και αμφίδρομη επικοινωνία.",
  );
  const [readinessJson, setReadinessJson] = useState("");
  const [translationJson, setTranslationJson] = useState("");
  const [speechStatus, setSpeechStatus] = useState("Δεν έγινε έλεγχος μικροφώνου ακόμα.");

  const speechSupported = useMemo(() => {
    if (typeof window === "undefined") return false;

    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }, []);

  async function runMultimodalReadiness() {
    const response = await fetch(readinessPath, { cache: "no-store" });
    const json = await response.json();

    setReadinessJson(JSON.stringify(json, null, 2));
  }

  async function runTranslationContract() {
    const response = await fetch(translationPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceLanguage,
        targetLanguage,
        inputText: spokenText,
        requestedModalities: [
          "text",
          "speech",
          "audio",
          "image-ocr",
          "subtitles",
          "bidirectional-conversation",
        ],
      }),
    });

    const json = await response.json();

    setTranslationJson(JSON.stringify(json, null, 2));
  }

  function startVoiceInput() {
    const SpeechRecognitionApi =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      setSpeechStatus("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionApi();

    recognition.lang = shortSpeechLocale(sourceLanguage);
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult?.[0]?.transcript ?? "";

      setSpokenText(transcript);
      setSpeechStatus("Voice captured locally by browser speech recognition.");
    };

    recognition.onerror = (event) => {
      setSpeechStatus(`Speech input error: ${event.error ?? "unknown"}`);
    };

    recognition.onend = () => {
      setSpeechStatus("Speech input ended.");
    };

    recognition.start();
    setSpeechStatus("Listening locally through browser speech recognition...");
  }

  function speakCurrentText() {
    if (!("speechSynthesis" in window)) {
      setSpeechStatus("Speech synthesis is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(spokenText);

    utterance.lang = shortSpeechLocale(targetLanguage);
    utterance.rate = 0.95;

    window.speechSynthesis.speak(utterance);
    setSpeechStatus("Speaking locally through browser text-to-speech.");
  }

  function stopSpeech() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setSpeechStatus("Speech output stopped.");
  }

  return (
    <section className="bg-[#07101f] px-5 pb-12 text-white md:px-10">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#d8b35a]/30 bg-[#101b2f] p-7 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d8b35a]">
          Pantavion Universal Multimodal Language Layer
        </p>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Κείμενο · Ομιλία · Ήχος · Εικόνα · Υπότιτλοι · Αμφίδρομη επικοινωνία
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-200">
              Η επιλογή γλώσσας στο Pantavion δεν είναι μόνο UI text. Είναι συμβόλαιο
              για φυσική ομιλία, ακρόαση, μετάφραση, ήχο, εικόνα/OCR, υπότιτλους και
              αμφίδρομη συνομιλία. Το browser speech layer δουλεύει τοπικά όπου
              υποστηρίζεται. Η πραγματική provider μετάφραση μένει blocked μέχρι
              έγκριση provider, κόστος, privacy και founder/admin approval.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-400/25 bg-amber-950/20 p-5">
            <h3 className="text-xl font-bold text-amber-100">
              Live local capability
            </h3>
            <p className="mt-3 text-sm leading-6 text-amber-50/80">
              Browser speech recognition:{" "}
              <strong>{speechSupported ? "supported" : "not supported"}</strong>
            </p>
            <p className="mt-3 text-sm leading-6 text-amber-50/80">
              {speechStatus}
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            Source language / Γλώσσα εισόδου
            <select
              value={sourceLanguage}
              onChange={(event) => setSourceLanguage(event.target.value)}
              className="rounded-2xl border border-white/15 bg-[#07101f] px-4 py-3 text-[#ffe8a3]"
            >
              {priorityLanguages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            Target language / Γλώσσα εξόδου
            <select
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
              className="rounded-2xl border border-white/15 bg-[#07101f] px-4 py-3 text-[#ffe8a3]"
            >
              {priorityLanguages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-200">
          Text / speech buffer
          <textarea
            value={spokenText}
            onChange={(event) => setSpokenText(event.target.value)}
            className="min-h-32 rounded-2xl border border-white/15 bg-[#07101f] p-4 text-slate-100 outline-none"
          />
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runMultimodalReadiness}
            className="rounded-2xl border border-[#d8b35a]/50 bg-[#d8b35a]/15 px-5 py-3 text-sm font-bold text-[#ffe8a3]"
          >
            Έλεγχος multimodal readiness
          </button>

          <button
            type="button"
            onClick={startVoiceInput}
            className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white"
          >
            Μίλησε / Speech input
          </button>

          <button
            type="button"
            onClick={speakCurrentText}
            className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white"
          >
            Άκου / Text-to-speech
          </button>

          <button
            type="button"
            onClick={stopSpeech}
            className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white"
          >
            Stop speech
          </button>

          <button
            type="button"
            onClick={runTranslationContract}
            className="rounded-2xl border border-red-400/30 bg-red-950/30 px-5 py-3 text-sm font-bold text-red-100"
          >
            Δοκιμή translation provider contract
          </button>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-lg font-bold text-[#f2d27a]">
              Multimodal readiness JSON
            </h3>
            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-black/30 p-4 text-xs text-slate-200">
              {readinessJson || "Not checked yet."}
            </pre>
          </article>

          <article className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-lg font-bold text-[#f2d27a]">
              Translation provider contract JSON
            </h3>
            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-black/30 p-4 text-xs text-slate-200">
              {translationJson || "Not checked yet."}
            </pre>
          </article>
        </div>
      </div>
    </section>
  );
}
