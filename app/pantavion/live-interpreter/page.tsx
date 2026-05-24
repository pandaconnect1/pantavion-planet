"use client";

import { useEffect, useRef, useState } from "react";

export default function PantavionLiveInterpreterPage() {
  const recognitionRef = useRef<any>(null);

  const [listening, setListening] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [domain, setDomain] = useState("general");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const browserWindow = window as typeof window & {
      SpeechRecognition?: any;
      webkitSpeechRecognition?: any;
    };

    const SpeechRecognition =
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("speech_recognition_not_supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "auto";

    recognition.onstart = () => {
      setListening(true);
      setStatus("listening");
    };

    recognition.onend = () => {
      setListening(false);
      setStatus("idle");
    };

    recognition.onerror = (event: any) => {
      setStatus("speech_error:" + event.error);
    };

    recognition.onresult = async (event: any) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setSourceText(transcript);

      try {
        setStatus("translating");

        const response = await fetch("/api/pantavion/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: transcript,
            targetLanguage,
            domain,
            bidirectional: true,
            tone: "natural",
          }),
        });

        const payload = await response.json();

        const translated =
          payload.translatedText ||
          payload.warning ||
          payload.error ||
          "";

        setTranslatedText(translated);

        if (
          translated &&
          window.speechSynthesis &&
          payload.ok
        ) {
          const utterance = new SpeechSynthesisUtterance(translated);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }

        setStatus(payload.status || "translated");
      } catch (error) {
        setStatus("translation_runtime_error");
      }
    };

    recognitionRef.current = recognition;
  }, [targetLanguage, domain]);

  function startListening() {
    recognitionRef.current?.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#192b55_0,#071020_48%,#02040b_100%)] px-4 py-6 text-[#fff8e7] sm:px-8">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-[#f6c85f]/25 bg-[#071020]/85 p-5 shadow-2xl sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#f6c85f]">
          PANTAVION LIVE INTERPRETER
        </p>

        <h1 className="mt-4 text-4xl font-black sm:text-6xl">
          Ζωντανός παγκόσμιος διερμηνέας.
        </h1>

        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-200">
          Speech → Translation → Subtitles → Voice output.
          Για κοινωνία, ταξίδι, νοσοκομεία, επαγγέλματα, επείγοντα, καθημερινή ζωή.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="rounded-2xl bg-black/40 p-4 text-white"
          >
            <option>English</option>
            <option>Ελληνικά</option>
            <option>العربية</option>
            <option>中文</option>
            <option>Русский</option>
            <option>Français</option>
            <option>Español</option>
            <option>Hindi</option>
            <option>Português</option>
            <option>日本語</option>
          </select>

          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="rounded-2xl bg-black/40 p-4 text-white"
          >
            <option value="general">general</option>
            <option value="social">social</option>
            <option value="professional">professional</option>
            <option value="medical">medical</option>
            <option value="legal">legal</option>
            <option value="scientific">scientific</option>
            <option value="emergency">emergency</option>
          </select>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={startListening}
            className="rounded-full bg-green-500 px-6 py-4 font-black text-black"
          >
            START LIVE
          </button>

          <button
            onClick={stopListening}
            className="rounded-full bg-red-500 px-6 py-4 font-black text-white"
          >
            STOP
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
            <p className="text-sm font-black uppercase text-[#f6c85f]">
              LIVE INPUT
            </p>

            <p className="mt-4 whitespace-pre-wrap text-2xl leading-10 text-white">
              {sourceText || "Waiting for speech..."}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
            <p className="text-sm font-black uppercase text-[#f6c85f]">
              LIVE TRANSLATION
            </p>

            <p className="mt-4 whitespace-pre-wrap text-2xl leading-10 text-green-200">
              {translatedText || "Waiting for translation..."}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#f6c85f]/20 bg-black/30 p-4">
          <p className="text-sm font-black text-[#f6c85f]">
            STATUS: {status}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Requires browser microphone permission and live translation provider.
          </p>
        </div>
      </section>
    </main>
  );
}
