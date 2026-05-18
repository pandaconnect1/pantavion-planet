"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  pantavionNaturalLanguageUniverse,
  pantavionPracticalLanguageMenu,
  normalizePantavionNaturalLanguage,
  type PantavionNaturalLanguageCode,
} from "@/core/translation/pantavion-natural-language-universe";

type SpeechRecognitionAlternativeLike = {
  transcript?: string;
};

type SpeechRecognitionResultLike = {
  isFinal?: boolean;
  0?: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike | undefined;
};

type SpeechRecognitionResultEventLike = {
  resultIndex?: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const globalLanguageKey = "pantavion_global_language_v1";
const otherLanguageKey = "pantavion_translate_other_language_v1";

export default function PantaTranslatePage() {
  const [myLanguage, setMyLanguage] = useState<PantavionNaturalLanguageCode>("en");
  const [otherLanguage, setOtherLanguage] = useState<PantavionNaturalLanguageCode>("el");
  const [myText, setMyText] = useState("");
  const [otherText, setOtherText] = useState("");
  const [myTranslation, setMyTranslation] = useState("");
  const [otherTranslation, setOtherTranslation] = useState("");
  const [status, setStatus] = useState("PantaTranslate ready.");
  const [providerMessage, setProviderMessage] = useState("");
  const [listening, setListening] = useState<"me" | "other" | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const languages = pantavionPracticalLanguageMenu;

  const myLanguageMeta = useMemo(
    () => languages.find((language) => language.code === myLanguage),
    [languages, myLanguage]
  );

  const otherLanguageMeta = useMemo(
    () => languages.find((language) => language.code === otherLanguage),
    [languages, otherLanguage]
  );

  useEffect(() => {
    const storedMine = window.localStorage.getItem(globalLanguageKey);
    const storedOther = window.localStorage.getItem(otherLanguageKey);

    setMyLanguage(normalizePantavionNaturalLanguage(storedMine || window.navigator.language));
    setOtherLanguage(normalizePantavionNaturalLanguage(storedOther || "en"));
  }, []);

  function updateMyLanguage(next: PantavionNaturalLanguageCode) {
    setMyLanguage(next);
    window.localStorage.setItem(globalLanguageKey, next);
  }

  function updateOtherLanguage(next: PantavionNaturalLanguageCode) {
    setOtherLanguage(next);
    window.localStorage.setItem(otherLanguageKey, next);
  }

  async function translateLane(lane: "me" | "other") {
    const inputText = lane === "me" ? myText : otherText;
    const sourceLanguage = lane === "me" ? myLanguage : otherLanguage;
    const targetLanguage = lane === "me" ? otherLanguage : myLanguage;

    if (!inputText.trim()) {
      setStatus("Write or speak first.");
      return;
    }

    setStatus("Translating...");
    setProviderMessage("");

    const response = await fetch("/api/translate/universal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: inputText,
        sourceLanguage,
        targetLanguage,
        mode: "same_phone",
      }),
    });

    const result = await response.json();

    if (lane === "me") {
      setMyTranslation(result.translatedText || "");
    } else {
      setOtherTranslation(result.translatedText || "");
    }

    setProviderMessage(result.message || "");
    setStatus(result.ok ? "Translation ready." : "Provider pending / fallback mode.");
  }

  function speak(text: string, language: PantavionNaturalLanguageCode) {
    if (!text.trim()) {
      setStatus("No text to speak.");
      return;
    }

    if (!("speechSynthesis" in window)) {
      setStatus("Speech output is not supported on this device/browser.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setStatus("Speaking.");
  }

  function startListening(lane: "me" | "other") {
    const speechWindow = window as unknown as SpeechWindow;
    const Recognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setStatus("Speech recognition is not supported on this device/browser.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new Recognition();
    recognition.lang = lane === "me" ? myLanguage : otherLanguage;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
      let finalText = "";
      const startIndex = typeof event.resultIndex === "number" ? event.resultIndex : 0;

      for (let index = startIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? "";

        if (result?.isFinal && transcript) {
          finalText += transcript;
        }
      }

      if (finalText.trim()) {
        if (lane === "me") {
          setMyText((current) => (current ? current + " " : "") + finalText.trim());
        } else {
          setOtherText((current) => (current ? current + " " : "") + finalText.trim());
        }
      }
    };

    recognition.onerror = () => {
      setStatus("Speech recognition failed or permission was denied.");
      setListening(null);
    };

    recognition.onend = () => {
      setListening(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(lane);
    setStatus("Listening...");
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
              â† Pantavion
            </Link>
            <Link
              href="/sos/elder"
              className="rounded-full border border-orange-300/40 px-4 py-2 text-sm font-bold text-orange-100"
            >
              Elder simple mode
            </Link>
          </div>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.35em] text-cyan-200">
            PantaTranslate / Universal Interpreter
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            Speak naturally. Let Pantavion interpret the world.
          </h1>
          <p className="mt-5 max-w-4xl text-lg text-slate-200">
            Platform-level translation for travel, work, social, accessibility, camera scan,
            PantaAI, and SOS. Not locked inside SOS. SOS only uses this system in emergency mode.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-300">Natural-language universe target</p>
              <p className="mt-2 text-3xl font-black text-yellow-200">
                {pantavionNaturalLanguageUniverse.targetNaturalLanguageCount}+
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-300">Selectable practical menu now</p>
              <p className="mt-2 text-3xl font-black text-cyan-200">{languages.length}+</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-300">Modes</p>
              <p className="mt-2 text-lg font-black text-green-200">
                Voice Â· Text Â· Subtitles Â· Camera Â· SOS
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-blue-300/30 bg-blue-950/25 p-5">
            <h2 className="text-2xl font-black">Me / User</h2>
            <label className="mt-4 block text-sm font-bold text-blue-100">
              My language
              <select
                value={myLanguage}
                onChange={(event) =>
                  updateMyLanguage(event.target.value as PantavionNaturalLanguageCode)
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 p-3 text-white"
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.nativeLabel} â€” {language.label}
                  </option>
                ))}
              </select>
            </label>

            <textarea
              value={myText}
              onChange={(event) => setMyText(event.target.value)}
              placeholder="Speak or write in your natural language..."
              className="mt-4 min-h-40 w-full rounded-3xl border border-white/10 bg-black/40 p-4 text-white"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => startListening("me")}
                className="rounded-full bg-blue-400 px-5 py-3 font-black text-black"
              >
                {listening === "me" ? "Listening..." : "Speak"}
              </button>
              <button
                onClick={() => translateLane("me")}
                className="rounded-full bg-cyan-300 px-5 py-3 font-black text-black"
              >
                Translate to other person
              </button>
              <button
                onClick={() => speak(myTranslation, otherLanguage)}
                className="rounded-full border border-cyan-200 px-5 py-3 font-black text-cyan-100"
              >
                Speak translation
              </button>
            </div>

            <div className="mt-4 rounded-3xl border border-cyan-300/20 bg-black/30 p-4">
              <p className="text-sm font-bold text-cyan-100">
                Other person hears/reads in {otherLanguageMeta?.nativeLabel || otherLanguage}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xl font-bold">
                {myTranslation || "Translation will appear here."}
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-orange-300/30 bg-orange-950/25 p-5">
            <h2 className="text-2xl font-black">Other person</h2>
            <label className="mt-4 block text-sm font-bold text-orange-100">
              Other person's language
              <select
                value={otherLanguage}
                onChange={(event) =>
                  updateOtherLanguage(event.target.value as PantavionNaturalLanguageCode)
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 p-3 text-white"
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.nativeLabel} â€” {language.label}
                  </option>
                ))}
              </select>
            </label>

            <textarea
              value={otherText}
              onChange={(event) => setOtherText(event.target.value)}
              placeholder="The other person speaks or writes here..."
              className="mt-4 min-h-40 w-full rounded-3xl border border-white/10 bg-black/40 p-4 text-white"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => startListening("other")}
                className="rounded-full bg-orange-300 px-5 py-3 font-black text-black"
              >
                {listening === "other" ? "Listening..." : "Other speaks"}
              </button>
              <button
                onClick={() => translateLane("other")}
                className="rounded-full bg-yellow-300 px-5 py-3 font-black text-black"
              >
                Translate back to me
              </button>
              <button
                onClick={() => speak(otherTranslation, myLanguage)}
                className="rounded-full border border-yellow-200 px-5 py-3 font-black text-yellow-100"
              >
                Speak back
              </button>
            </div>

            <div className="mt-4 rounded-3xl border border-yellow-300/20 bg-black/30 p-4">
              <p className="text-sm font-bold text-yellow-100">
                User hears/reads in {myLanguageMeta?.nativeLabel || myLanguage}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xl font-bold">
                {otherTranslation || "Return translation will appear here."}
              </p>
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-emerald-300/30 bg-emerald-950/20 p-5">
          <h2 className="text-2xl font-black">Camera / signs / menus / accessibility</h2>
          <p className="mt-2 text-slate-200">
            Select an image from camera or files. Real OCR requires OCR provider configuration.
            This route is ready without pretending the provider exists.
          </p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => handleCameraFile(event.target.files?.[0] || null)}
            className="mt-4 block w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white"
          />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-black">Status</h2>
          <p className="mt-2 text-cyan-100">{status}</p>
          {providerMessage ? (
            <p className="mt-2 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-3 text-yellow-100">
              {providerMessage}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-slate-300">
            Truth boundary: translation is assistive. Legal, medical, emergency, and certified
            interpretation require configured providers, agreements, and human/professional review
            where required.
          </p>
        </section>
      </section>
    </main>
  );
}


