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
    "aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu ace ach ada ady agq ain alt arn asa ast awa bal ban bas bem bez bho bik bin bla brx bug byn ceb cgg chr ckb cop crh dav doi dsb dua dyo ebu efi fil fon fur gaa gez gil gom gor haw hmn hsb iba ibb ilo kam kab kcg kfo kha khq kok kpe kri ksb ksf ksh lag lah lkt lua luo lus luy mai mak mas mdf mer mfe mgh mgo mni moh mua mus naq nds nso nus nyn pap pcm quc raj rof rom rup rwk sad sah saq sat sbp scn sco ses shi sid smn sms syr tem teo tig tiv tpi twq vai vun wae xog yav ybb yue zgh".split(/\s+/)
  )
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
    // Fall through to the code.
  }

  return code.toUpperCase();
}

const LANGUAGE_OPTIONS: LanguageOption[] = STARTER_LANGUAGE_CODES.map((code) => ({
  code,
  label: displayLanguageName(code),
  htmlLang: code,
})).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

function getLanguage(code: string) {
  return LANGUAGE_OPTIONS.find((language) => language.code === code) ||
    LANGUAGE_OPTIONS.find((language) => language.code === "en") ||
    LANGUAGE_OPTIONS[0];
}

function isKnownLanguage(code: string) {
  return LANGUAGE_OPTIONS.some((language) => language.code === code);
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

export default function TranslatePage() {
  const [myLanguage, setMyLanguage] = useState("el");
  const [partnerLanguage, setPartnerLanguage] = useState<string | null>(null);
  const [manualPartnerLanguage, setManualPartnerLanguage] = useState("en");
  const [conversationActive, setConversationActive] = useState(false);
  const [listening, setListening] = useState<"me" | "other" | null>(null);
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState("Ready.");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const myLanguageMeta = useMemo(() => getLanguage(myLanguage), [myLanguage]);
  const partnerLanguageMeta = useMemo(
    () => getLanguage(partnerLanguage || manualPartnerLanguage),
    [partnerLanguage, manualPartnerLanguage]
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
      recognitionRef.current?.stop();
    };
  }, []);

  function speak(textToSpeak: string, languageCode: string) {
    if (!textToSpeak.trim() || typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = getLanguage(languageCode).htmlLang;
    window.speechSynthesis.speak(utterance);
  }

  async function detectLanguage(sourceText: string) {
    try {
      const response = await fetch("/api/pantavion/detect-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });
      const payload = await response.json().catch(() => ({}));
      const language = typeof payload.language === "string" ? payload.language : "";
      return isKnownLanguage(language) ? language : null;
    } catch {
      return null;
    }
  }

  async function translate(sourceText: string, sourceLanguage: string, targetLanguage: string) {
    const response = await fetch("/api/pantavion/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: sourceText,
        sourceLanguage,
        targetLanguage,
        from: sourceLanguage,
        to: targetLanguage,
        mode: "same_phone",
        surface: "pantavion-simple-interpreter",
        bidirectional: true,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    const translatedText =
      payload.translatedText || payload.translation || payload.text || payload.output || "";

    if (!response.ok || !translatedText) {
      throw new Error(payload.message || payload.error || "Translation provider is unavailable.");
    }

    return translatedText as string;
  }

  async function submitTurn(sourceText: string, speaker: "me" | "other") {
    const cleanText = sourceText.trim();
    if (!cleanText) return;

    setError("");
    setStatus("Translating…");

    try {
      let detectedPartnerLanguage = partnerLanguage;

      if (speaker === "other" && !detectedPartnerLanguage) {
        setStatus("Detecting the other person's language…");
        detectedPartnerLanguage = await detectLanguage(cleanText);
        if (detectedPartnerLanguage) setPartnerLanguage(detectedPartnerLanguage);
      }

      if (speaker === "me" && !detectedPartnerLanguage) {
        setStatus("Waiting for the other person to speak once so Pantavion can detect their language.");
        setError("The other person can speak or type first. After Pantavion detects their language, the conversation runs in both directions.");
        return;
      }

      const sourceLanguage = speaker === "me" ? myLanguage : "auto";
      const targetLanguage = speaker === "me"
        ? detectedPartnerLanguage || manualPartnerLanguage
        : myLanguage;

      const translatedText = await translate(cleanText, sourceLanguage, targetLanguage);
      const actualPartnerLanguage = detectedPartnerLanguage || manualPartnerLanguage;

      setTurns((current) => [
        ...current,
        {
          id: Date.now(),
          speaker,
          sourceText: cleanText,
          translatedText,
          sourceLanguage: speaker === "me" ? myLanguage : actualPartnerLanguage,
          targetLanguage,
        },
      ]);

      setText("");
      setStatus("Ready for the next person.");

      if (speaker === "me") {
        speak(translatedText, actualPartnerLanguage);
      } else {
        speak(translatedText, myLanguage);
      }
    } catch (translationError) {
      setStatus("Translation unavailable.");
      setError(
        translationError instanceof Error
          ? translationError.message
          : "Translation provider is unavailable."
      );
    }
  }

  function startListening(speaker: "me" | "other") {
    if (typeof window === "undefined") return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError(
        "This browser does not expose Web Speech Recognition. Pantavion needs the platform speech-to-text provider for reliable voice use on all devices and in-app browsers."
      );
      return;
    }

    if (speaker === "other" && !partnerLanguage) {
      setError(
        "Automatic spoken-language detection needs the multilingual speech-to-text provider. For now, the other person can type once, or choose a fallback language below."
      );
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new Recognition();
    recognition.lang = speaker === "me" ? myLanguageMeta.htmlLang : partnerLanguageMeta.htmlLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results || [])
        .map((result: any) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();
      if (transcript) void submitTurn(transcript, speaker);
    };

    recognition.onerror = () => {
      setListening(null);
      setError("Voice recognition failed in this browser. Text translation remains available.");
    };

    recognition.onend = () => setListening(null);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(speaker);
    setStatus(speaker === "me" ? "Listening to you…" : "Listening to the other person…");
  }

  function resetConversation() {
    recognitionRef.current?.stop();
    setTurns([]);
    setPartnerLanguage(null);
    setConversationActive(false);
    setText("");
    setError("");
    setStatus("Ready.");
  }

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 text-white sm:px-6">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-cyan-300/25 bg-gradient-to-br from-[#071528] via-[#08111f] to-black p-5 shadow-2xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="rounded-full border border-yellow-300/30 px-4 py-2 text-sm font-bold text-yellow-100"
            >
              Back to Pantavion
            </Link>
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
              One language • One conversation
            </span>
          </div>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.35em] text-cyan-200">
            PantaTranslate / Universal Interpreter
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
            Choose your language. Then just talk.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
            Pantavion keeps your language fixed, learns the other person's language, and translates the conversation both ways. The same interaction model is designed to scale to social groups, calls, video, travel, work and SOS.
          </p>
        </div>

        <section className="mt-5 rounded-[2rem] border border-blue-300/25 bg-blue-950/25 p-5 sm:p-7">
          <label className="block text-sm font-black text-blue-100">
            My language
            <select
              value={myLanguage}
              onChange={(event) => {
                const language = event.target.value;
                setMyLanguage(language);
                try {
                  window.localStorage.setItem(STORAGE_KEY, language);
                  window.dispatchEvent(
                    new CustomEvent("pantavion:language-change", { detail: { language } })
                  );
                } catch {
                  // Local storage can be unavailable in restricted browsers.
                }
              }}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-lg font-bold text-white outline-none"
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-3xl border border-cyan-300/20 bg-black/30 p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Other person</p>
              <p className="mt-1 text-xl font-black">
                {partnerLanguage ? partnerLanguageMeta.label : "Auto-detect"}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {partnerLanguage
                  ? "Detected for this conversation."
                  : "No language menu for the other person."}
              </p>
            </div>
            <div className="text-3xl" aria-hidden="true">⇄</div>
          </div>

          {!conversationActive ? (
            <button
              type="button"
              onClick={() => {
                setConversationActive(true);
                setStatus("Conversation started. The other person can speak or type first for automatic language detection.");
              }}
              className="mt-5 w-full rounded-full bg-cyan-300 px-6 py-4 text-lg font-black text-slate-950"
            >
              Start conversation
            </button>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => startListening("me")}
                className="rounded-full bg-blue-400 px-5 py-4 text-lg font-black text-slate-950"
              >
                {listening === "me" ? "Listening…" : `I speak ${myLanguageMeta.label}`}
              </button>
              <button
                type="button"
                onClick={() => startListening("other")}
                className="rounded-full bg-yellow-300 px-5 py-4 text-lg font-black text-slate-950"
              >
                {listening === "other"
                  ? "Listening…"
                  : partnerLanguage
                    ? `Other person speaks ${partnerLanguageMeta.label}`
                    : "Other person speaks • auto"}
              </button>
            </div>
          )}

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-4">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type a sentence if voice is unavailable…"
              className="min-h-28 w-full resize-none bg-transparent text-lg text-white outline-none placeholder:text-slate-500"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void submitTurn(text, "me")}
                className="rounded-full border border-blue-300/40 px-4 py-2 font-bold text-blue-100"
              >
                Send as me
              </button>
              <button
                type="button"
                onClick={() => void submitTurn(text, "other")}
                className="rounded-full border border-yellow-300/40 px-4 py-2 font-bold text-yellow-100"
              >
                Send as other person
              </button>
            </div>
          </div>

          <details className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <summary className="cursor-pointer font-bold text-slate-100">Fallback / advanced</summary>
            <p className="mt-3">
              Automatic partner-language detection is the default. A manual fallback remains available for browsers or deployments without the multilingual speech provider.
            </p>
            <select
              value={manualPartnerLanguage}
              onChange={(event) => {
                setManualPartnerLanguage(event.target.value);
                if (!partnerLanguage) setPartnerLanguage(event.target.value);
              }}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-white"
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </details>
        </section>

        <section className="mt-5 space-y-3">
          {turns.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center text-slate-400">
              Conversation will appear here automatically.
            </div>
          ) : (
            turns.map((turn) => (
              <article
                key={turn.id}
                className={`rounded-[2rem] border p-5 ${
                  turn.speaker === "me"
                    ? "border-blue-300/25 bg-blue-950/25"
                    : "border-yellow-300/25 bg-yellow-950/15"
                }`}
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                  {turn.speaker === "me" ? "You" : "Other person"}
                </p>
                <p className="mt-2 text-xl font-bold">{turn.sourceText}</p>
                <div className="my-4 h-px bg-white/10" />
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                  Pantavion translation
                </p>
                <p className="mt-2 text-2xl font-black">{turn.translatedText}</p>
                <button
                  type="button"
                  onClick={() => speak(turn.translatedText, turn.targetLanguage)}
                  className="mt-4 rounded-full border border-cyan-200/40 px-4 py-2 text-sm font-black text-cyan-100"
                >
                  Speak translation
                </button>
              </article>
            ))
          )}
        </section>

        <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-cyan-100">Status</p>
              <p className="mt-1 text-slate-200">{status}</p>
            </div>
            <button
              type="button"
              onClick={resetConversation}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-slate-200"
            >
              New conversation
            </button>
          </div>
          {error ? (
            <p className="mt-4 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-yellow-100">
              {error}
            </p>
          ) : null}
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Platform rule: the user chooses only their own language. The receiving person's language should come from their Pantavion profile in connected social/call surfaces, or from automatic multilingual speech detection in same-device conversations. Browser speech APIs are only a fallback, not the platform architecture.
          </p>
        </section>
      </section>
    </main>
  );
}
