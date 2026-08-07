"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type LanguageOption = {
  code: string;
  label: string;
  htmlLang: string;
};

type Turn = {
  id: number;
  speaker: "me" | "other";
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
};

const STORAGE_KEY = "pantavion.ui.language";

const PRIORITY_LABELS: Record<string, string> = {
  el: "Ελληνικά / Greek",
  en: "English",
  fr: "Français / French",
  es: "Español / Spanish",
  de: "Deutsch / German",
  it: "Italiano / Italian",
  pt: "Português / Portuguese",
  ru: "Русский / Russian",
  ar: "العربية / Arabic",
  he: "עברית / Hebrew",
  tr: "Türkçe / Turkish",
  zh: "中文 / Chinese",
  ja: "日本語 / Japanese",
  ko: "한국어 / Korean",
  hi: "हिन्दी / Hindi",
  ur: "اردو / Urdu",
  fa: "فارسی / Persian",
  sw: "Kiswahili / Swahili",
};

const STARTER_LANGUAGE_CODES = Array.from(
  new Set(
    "aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu ace ach ada ady agq ain alt arn asa ast awa bal ban bas bem bez bho bik bin bla brx bug byn ceb cgg chr ckb cop crh dav doi dsb dua dyo ebu efi fil fon fur gaa gez gil gom gor haw hmn hsb iba ibb ilo kam kab kcg kfo kha khq kok kpe kri ksb ksf ksh lag lah lkt lua luo lus luy mai mak mas mdf mer mfe mgh mgo mni moh mua mus naq nds nso nus nyn pap pcm quc raj rof rom rup rwk sad sah saq sat sbp scn sco ses shi sid smn sms syr tem teo tig tiv tpi twq vai vun wae xog yav ybb yue zgh".split(/\s+/),
  ),
).filter(Boolean);

function displayLanguageName(code: string) {
  if (PRIORITY_LABELS[code]) return PRIORITY_LABELS[code];

  try {
    const DisplayNames = (Intl as typeof Intl & {
      DisplayNames?: new (locales: string[], options: { type: "language" }) => {
        of: (code: string) => string | undefined;
      };
    }).DisplayNames;

    if (DisplayNames) {
      return new DisplayNames(["en"], { type: "language" }).of(code) || code.toUpperCase();
    }
  } catch {
    // Fall through to code.
  }

  return code.toUpperCase();
}

const LANGUAGE_OPTIONS: LanguageOption[] = STARTER_LANGUAGE_CODES.map((code) => ({
  code,
  label: displayLanguageName(code),
  htmlLang: code,
})).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

function isKnownLanguage(code: string) {
  return LANGUAGE_OPTIONS.some((language) => language.code === code);
}

function getLanguage(code: string) {
  return (
    LANGUAGE_OPTIONS.find((language) => language.code === code) ||
    LANGUAGE_OPTIONS.find((language) => language.code === "en") ||
    LANGUAGE_OPTIONS[0]
  );
}

function readStoredLanguage() {
  if (typeof window === "undefined") return "el";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) || "el";
    return isKnownLanguage(stored) ? stored : "el";
  } catch {
    return "el";
  }
}

function chooseRecordingMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const choices = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return choices.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export default function TranslatePage() {
  const [myLanguage, setMyLanguage] = useState("el");
  const [partnerLanguage, setPartnerLanguage] = useState<string | null>(null);
  const [manualPartnerLanguage, setManualPartnerLanguage] = useState("en");
  const [conversationActive, setConversationActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pendingMyText, setPendingMyText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [status, setStatus] = useState("Ready.");
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myLanguageMeta = useMemo(() => getLanguage(myLanguage), [myLanguage]);
  const partnerLanguageMeta = useMemo(
    () => getLanguage(partnerLanguage || manualPartnerLanguage),
    [partnerLanguage, manualPartnerLanguage],
  );

  useEffect(() => {
    setMyLanguage(readStoredLanguage());

    function onLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: string }>;
      const language = customEvent.detail?.language;
      if (language && isKnownLanguage(language)) setMyLanguage(language);
    }

    window.addEventListener("pantavion:language-change", onLanguageChange);
    return () => {
      window.removeEventListener("pantavion:language-change", onLanguageChange);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function speak(text: string, languageCode: string) {
    if (!text.trim() || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguage(languageCode).htmlLang;
    window.speechSynthesis.speak(utterance);
  }

  async function detectLanguage(text: string) {
    try {
      const response = await fetch("/api/pantavion/detect-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const payload = await response.json().catch(() => ({}));
      const language = typeof payload.language === "string" ? payload.language : "";
      return isKnownLanguage(language) ? language : null;
    } catch {
      return null;
    }
  }

  async function translate(text: string, sourceLanguage: string, targetLanguage: string) {
    const response = await fetch("/api/pantavion/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage,
        from: sourceLanguage,
        to: targetLanguage,
        mode: "same_phone",
        surface: "pantavion-interpreter",
        bidirectional: true,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    const translatedText = payload.translatedText || payload.translation || payload.text || payload.output || "";

    if (!response.ok || !translatedText) {
      throw new Error(payload.message || payload.error || "Translation is temporarily unavailable.");
    }

    return translatedText as string;
  }

  async function addTranslatedTurn(
    sourceText: string,
    speaker: "me" | "other",
    sourceLanguage: string,
    targetLanguage: string,
  ) {
    const translatedText = await translate(sourceText, sourceLanguage, targetLanguage);
    const turn: Turn = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      speaker,
      sourceText,
      translatedText,
      sourceLanguage,
      targetLanguage,
    };

    setTurns((current) => [...current, turn]);
    speak(translatedText, targetLanguage);
    return turn;
  }

  async function processRecognizedText(sourceText: string, detectedLanguage?: string | null) {
    const cleanText = sourceText.trim();
    if (!cleanText) return;

    setError("");
    setProcessing(true);

    try {
      const language = detectedLanguage || (await detectLanguage(cleanText));
      if (!language) {
        throw new Error("Pantavion could not identify the spoken language. Please try a slightly longer sentence.");
      }

      const speaker: "me" | "other" = language === myLanguage ? "me" : "other";

      if (speaker === "me" && !partnerLanguage) {
        setPendingMyText(cleanText);
        setStatus("I heard you. Let the other person speak once so I can detect their language.");
        return;
      }

      if (speaker === "other") {
        if (!partnerLanguage || partnerLanguage !== language) setPartnerLanguage(language);

        if (pendingMyText) {
          setStatus("Language detected. Translating both sides…");
          await addTranslatedTurn(pendingMyText, "me", myLanguage, language);
          setPendingMyText("");
        }

        await addTranslatedTurn(cleanText, "other", language, myLanguage);
        setStatus(`Interpreter ready • ${getLanguage(language).label}`);
        return;
      }

      await addTranslatedTurn(cleanText, "me", myLanguage, partnerLanguage || manualPartnerLanguage);
      setStatus("Interpreter ready.");
    } catch (processingError) {
      setStatus("Interpreter needs attention.");
      setError(processingError instanceof Error ? processingError.message : "Pantavion could not process that speech.");
    } finally {
      setProcessing(false);
    }
  }

  async function transcribeAudio(blob: Blob) {
    const form = new FormData();
    const extension = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
    form.set("audio", new File([blob], `pantavion-conversation.${extension}`, { type: blob.type || "audio/webm" }));

    const response = await fetch("/api/pantavion/transcribe", { method: "POST", body: form });
    const payload = await response.json().catch(() => ({}));
    const transcript = typeof payload.text === "string" ? payload.text.trim() : "";

    if (!response.ok || !transcript) {
      throw new Error(payload.message || "Speech transcription is unavailable.");
    }

    return transcript;
  }

  async function finishRecording(blob: Blob) {
    setProcessing(true);
    setStatus("Understanding speech…");
    try {
      const transcript = await transcribeAudio(blob);
      setStatus("Detecting language…");
      const language = await detectLanguage(transcript);
      await processRecognizedText(transcript, language);
    } catch (recordingError) {
      setError(recordingError instanceof Error ? recordingError.message : "Voice processing failed.");
      setStatus("Voice unavailable.");
    } finally {
      setProcessing(false);
    }
  }

  async function startRecording() {
    if (processing) return;
    setError("");
    if (!conversationActive) setConversationActive(true);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser cannot record microphone audio. You can still use the text fallback below.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = chooseRecordingMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        setRecording(false);
        setStatus("Microphone error.");
        setError("The microphone could not record audio.");
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.onstop = () => {
        if (autoStopRef.current) clearTimeout(autoStopRef.current);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        if (blob.size) void finishRecording(blob);
      };

      recorder.start(250);
      setRecording(true);
      setStatus("Listening… speak naturally.");
      autoStopRef.current = setTimeout(() => recorder.state === "recording" && recorder.stop(), 20000);
    } catch (microphoneError) {
      setRecording(false);
      setStatus("Microphone unavailable.");
      const message = microphoneError instanceof Error ? microphoneError.message : "Microphone permission was not granted.";
      setError(`Pantavion needs microphone access for live interpreting. ${message}`);
    }
  }

  function stopRecording() {
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      setStatus("Processing…");
      recorder.stop();
    }
  }

  function resetConversation() {
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setTurns([]);
    setPartnerLanguage(null);
    setPendingMyText("");
    setTypedText("");
    setConversationActive(false);
    setRecording(false);
    setProcessing(false);
    setError("");
    setStatus("Ready.");
  }

  function changeMyLanguage(language: string) {
    resetConversation();
    setMyLanguage(language);
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
      window.dispatchEvent(new CustomEvent("pantavion:language-change", { detail: { language } }));
    } catch {
      // Restricted browsers may block local storage.
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#102b3a_0,#07111c_44%,#03070d_100%)] px-4 py-5 text-white sm:px-6 sm:py-8">
      <section className="mx-auto max-w-3xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-slate-100">← Pantavion</Link>
            <span className="rounded-full bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100">INTERPRETER</span>
          </div>

          <h1 className="mt-7 text-4xl font-black leading-tight sm:text-6xl">Just talk.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Your personal interpreter for everyday life. Pantavion listens, detects the language and speaks the translation back.
          </p>
        </header>

        <section className="mt-4 rounded-[2rem] border border-white/10 bg-black/25 p-5 sm:p-7">
          <label className="block text-sm font-black text-slate-200">
            My language
            <select
              value={myLanguage}
              onChange={(event) => changeMyLanguage(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#08121d] p-4 text-lg font-bold text-white outline-none"
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language.code} value={language.code}>{language.label}</option>
              ))}
            </select>
          </label>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Other person</p>
              <p className="mt-1 text-xl font-black">{partnerLanguage ? partnerLanguageMeta.label : "Automatic detection"}</p>
            </div>
            <span className="text-2xl" aria-hidden="true">◎</span>
          </div>

          <button
            type="button"
            disabled={processing}
            onClick={() => {
              if (recording) stopRecording();
              else void startRecording();
            }}
            className={`mx-auto mt-7 flex h-44 w-44 whitespace-pre-line items-center justify-center rounded-full border-8 text-center text-xl font-black shadow-2xl transition sm:h-52 sm:w-52 ${
              recording
                ? "border-red-200/40 bg-red-400 text-[#190507]"
                : processing
                  ? "border-slate-300/20 bg-slate-500/40 text-slate-200"
                  : "border-cyan-100/35 bg-cyan-300 text-[#03131b] hover:scale-[1.02]"
            }`}
          >
            {recording ? "STOP\nLISTENING" : processing ? "WORKING…" : conversationActive ? "TAP TO\nTALK" : "START\nINTERPRETER"}
          </button>

          <p className="mt-5 text-center text-base font-bold text-slate-200">{status}</p>
          {pendingMyText ? (
            <p className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-center text-sm text-cyan-100">
              Your first sentence is saved. Let the other person speak once; Pantavion will detect their language and translate it automatically.
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">{error}</p>
          ) : null}

          <details className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300">
            <summary className="cursor-pointer font-bold text-slate-100">Text / manual fallback</summary>
            <textarea
              value={typedText}
              onChange={(event) => setTypedText(event.target.value)}
              placeholder="Type here if microphone use is not possible…"
              className="mt-4 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-3 text-white outline-none"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  const value = typedText;
                  setTypedText("");
                  void processRecognizedText(value, myLanguage);
                }}
                className="rounded-full border border-cyan-300/30 px-4 py-3 font-bold text-cyan-100"
              >
                I wrote this
              </button>
              <button
                type="button"
                onClick={async () => {
                  const value = typedText;
                  setTypedText("");
                  const language = (await detectLanguage(value)) || manualPartnerLanguage;
                  void processRecognizedText(value, language);
                }}
                className="rounded-full border border-amber-300/30 px-4 py-3 font-bold text-amber-100"
              >
                Other person wrote this
              </button>
            </div>
            <label className="mt-4 block">
              Manual language only if automatic detection cannot work
              <select
                value={manualPartnerLanguage}
                onChange={(event) => setManualPartnerLanguage(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#08121d] p-3 text-white"
              >
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language.code} value={language.code}>{language.label}</option>
                ))}
              </select>
            </label>
          </details>
        </section>

        <section className="mt-4 space-y-3">
          {turns.map((turn) => (
            <article
              key={turn.id}
              className={`rounded-[1.6rem] border p-5 ${
                turn.speaker === "me" ? "border-cyan-300/20 bg-cyan-950/20" : "border-amber-300/20 bg-amber-950/15"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  {turn.speaker === "me" ? "You" : "Other person"} • {getLanguage(turn.sourceLanguage).label}
                </p>
                <button
                  type="button"
                  onClick={() => speak(turn.translatedText, turn.targetLanguage)}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-slate-200"
                >
                  🔊 Replay
                </button>
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-200">{turn.sourceText}</p>
              <div className="my-4 h-px bg-white/10" />
              <p className="text-2xl font-black leading-9">{turn.translatedText}</p>
            </article>
          ))}
        </section>

        {turns.length > 0 || conversationActive ? (
          <button
            type="button"
            onClick={resetConversation}
            className="mt-5 w-full rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-slate-300"
          >
            New conversation
          </button>
        ) : null}

        <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-5 text-slate-500">
          Live microphone interpreting uses the configured multilingual speech provider. The first microphone use may require the browser's standard microphone permission.
        </p>
      </section>
    </main>
  );
}
