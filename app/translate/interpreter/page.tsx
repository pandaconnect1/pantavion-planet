"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { globalEmergencyLanguages } from "@/core/emergency/global-emergency-languages";
import {
  choosePantavionDeviceVoice,
  normalizePantavionSpeechLanguage,
} from "@/core/translation/pantavion-device-voice";
import TwoDeviceInterpreterSession, {
  type InterpreterBroadcastFunction,
  type InterpreterBroadcastTurn,
} from "./two-device-session";

type Speaker = "A" | "B";
type MicrophoneState = "unknown" | "requesting" | "granted" | "denied";
type TranslationResponse = {
  translatedText?: string;
  translation?: string;
  text?: string;
  output?: string;
  provider?: string;
  message?: string;
  error?: string;
};
type SpeechResponse = {
  text?: string;
  rawText?: string;
  normalizedText?: string;
  error?: string;
};
type NormalizeResponse = {
  text?: string;
  rawText?: string;
  normalizedText?: string;
};
type SpeechRecognitionResultLike = { 0?: { transcript?: string } };
type SpeechRecognitionEventLike = { results?: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionErrorEventLike = { error?: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const LANGUAGES = globalEmergencyLanguages.map((language) => ({
  code: language.code,
  label:
    language.nativeLabel && language.nativeLabel !== language.label
      ? `${language.nativeLabel} · ${language.label}`
      : language.label,
  direction: language.direction,
  speech: normalizePantavionSpeechLanguage(language.code),
}));

function byCode(code: string) {
  return LANGUAGES.find((item) => item.code === code) || LANGUAGES[0];
}

function extension(mime: string) {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

function getSpeechRecognitionConstructor() {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
}

export default function InterpreterPage() {
  const [languageA, setLanguageA] = useState("el");
  const [languageB, setLanguageB] = useState("en");
  const [speaker, setSpeaker] = useState<Speaker>("A");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [lastSourceCode, setLastSourceCode] = useState("el");
  const [lastTargetCode, setLastTargetCode] = useState("en");
  const [status, setStatus] = useState("Έτοιμο για αμφίδρομη διερμηνεία.");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [microphone, setMicrophone] = useState<MicrophoneState>("unknown");
  const [provider, setProvider] = useState("");
  const [twoDeviceActive, setTwoDeviceActive] = useState(false);
  const [twoDevicePeerCount, setTwoDevicePeerCount] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micGrantedRef = useRef(false);
  const recordingContextRef = useRef<{ source: string; target: string } | null>(null);
  const twoDeviceBroadcasterRef = useRef<InterpreterBroadcastFunction | null>(null);

  const sourceCode = speaker === "A" ? languageA : languageB;
  const targetCode = speaker === "A" ? languageB : languageA;
  const sourceMeta = useMemo(() => byCode(sourceCode), [sourceCode]);
  const targetMeta = useMemo(() => byCode(targetCode), [targetCode]);
  const lastSourceMeta = useMemo(() => byCode(lastSourceCode), [lastSourceCode]);
  const lastTargetMeta = useMemo(() => byCode(lastTargetCode), [lastTargetCode]);

  async function requestMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophone("denied");
      setError("Ο browser δεν δίνει πρόσβαση στο μικρόφωνο.");
      return false;
    }
    setMicrophone("requesting");
    setError("");
    setStatus("Ζητώ άδεια μικροφώνου…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      micGrantedRef.current = true;
      setMicrophone("granted");
      setStatus("✓ Μικρόφωνο ενεργό. Ο διερμηνέας είναι έτοιμος.");
      return true;
    } catch {
      micGrantedRef.current = false;
      setMicrophone("denied");
      setError("Το μικρόφωνο είναι μπλοκαρισμένο για το pantavion.com.");
      return false;
    }
  }

  const speak = useCallback((text: string, languageCode: string) => {
    if (!text.trim() || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const meta = byCode(languageCode);
    const voices = window.speechSynthesis.getVoices();
    const voice = choosePantavionDeviceVoice(voices, languageCode, meta.speech);
    utterance.lang = voice?.lang || meta.speech;
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const applySessionLanguages = useCallback((nextLanguageA: string, nextLanguageB: string) => {
    setLanguageA(nextLanguageA);
    setLanguageB(nextLanguageB);
    setSpeaker("A");
    setLastSourceCode(nextLanguageA);
    setLastTargetCode(nextLanguageB);
    setStatus("Το language pair κλειδώθηκε από το ιδιωτικό two-device session.");
  }, []);

  const handleRemoteTurn = useCallback(
    (turn: InterpreterBroadcastTurn) => {
      setSourceText(turn.sourceText);
      setTranslatedText(turn.translatedText);
      setLastSourceCode(turn.sourceCode);
      setLastTargetCode(turn.targetCode);
      setProvider("Pantavion Private Realtime");
      const nextSpeaker: Speaker = turn.speaker === "A" ? "B" : "A";
      setSpeaker(nextSpeaker);
      speak(turn.translatedText, turn.targetCode);
      setStatus(
        `✓ Λήφθηκε μεταφρασμένη φράση από το private realtime session και εκφωνήθηκε. Τώρα μιλά ο Ομιλητής ${nextSpeaker}.`,
      );
      setError("");
    },
    [speak],
  );

  async function normalizeTranscript(raw: string, language: string) {
    const clean = raw.trim();
    if (!clean) return { rawText: "", normalizedText: "" };
    try {
      const response = await fetch("/api/pantavion/speech-normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: clean, language, accessibilityMode: true }),
      });
      const result = (await response.json().catch(() => ({}))) as NormalizeResponse;
      return {
        rawText: String(result.rawText || clean).trim() || clean,
        normalizedText: String(result.normalizedText || result.text || clean).trim() || clean,
      };
    } catch {
      return { rawText: clean, normalizedText: clean };
    }
  }

  async function translateTurn(text: string, source: string, target: string, rawText?: string) {
    const clean = text.trim();
    if (!clean) return;
    if (source === target) {
      setError("Επίλεξε δύο διαφορετικές γλώσσες.");
      return;
    }

    setBusy(true);
    setError("");
    setStatus(`Μεταφράζω ${byCode(source).label} → ${byCode(target).label}…`);
    try {
      const response = await fetch("/api/pantavion/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: clean,
          from: source,
          to: target,
          sourceLanguage: source,
          targetLanguage: target,
          bidirectional: true,
          mode: "assistive",
          surface: "pantavion-interpreter",
        }),
      });
      const result = (await response.json().catch(() => ({}))) as TranslationResponse;
      const output = String(
        result.translatedText || result.translation || result.text || result.output || "",
      ).trim();
      if (!response.ok || !output) {
        setTranslatedText("");
        setError(result.message || result.error || "Η μετάφραση δεν επέστρεψε αποτέλεσμα.");
        setStatus("Η διερμηνεία δεν ολοκληρώθηκε.");
        return;
      }

      const displayedSource = rawText?.trim() || clean;
      setSourceText(displayedSource);
      setTranslatedText(output);
      setLastSourceCode(source);
      setLastTargetCode(target);
      setProvider(result.provider || "Pantavion");

      const completedSpeaker: Speaker = source === languageA ? "A" : "B";
      let realtimeAccepted = false;
      if (twoDeviceActive && twoDevicePeerCount > 0 && twoDeviceBroadcasterRef.current) {
        realtimeAccepted = await twoDeviceBroadcasterRef.current({
          turnId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
          speaker: completedSpeaker,
          sourceCode: source,
          targetCode: target,
          sourceText: displayedSource,
          translatedText: output,
          createdAt: new Date().toISOString(),
        });
      }

      if (!realtimeAccepted) speak(output, target);

      const nextSpeaker: Speaker = completedSpeaker === "A" ? "B" : "A";
      setSpeaker(nextSpeaker);
      const nextSource = nextSpeaker === "A" ? languageA : languageB;
      const nextTarget = nextSpeaker === "A" ? languageB : languageA;
      setStatus(
        realtimeAccepted
          ? `✓ Μεταφράστηκε. Το private realtime broadcast έγινε δεκτό και υπάρχει δεύτερη ενεργή συσκευή. Τώρα μιλά ο Ομιλητής ${nextSpeaker}: ${byCode(nextSource).label} → ${byCode(nextTarget).label}.`
          : `✓ Μεταφράστηκε και εκφωνήθηκε τοπικά. Τώρα μιλά ο Ομιλητής ${nextSpeaker}: ${byCode(nextSource).label} → ${byCode(nextTarget).label}.`,
      );
    } catch {
      setError("Δεν ήταν δυνατή η σύνδεση με τη μετάφραση.");
      setStatus("Η διερμηνεία δεν ολοκληρώθηκε.");
    } finally {
      setBusy(false);
    }
  }

  function cleanupRecording() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(false);
  }

  async function sendRecording(blob: Blob, source: string, target: string) {
    if (!blob.size) {
      setError("Δεν καταγράφηκε ήχος.");
      return;
    }
    setBusy(true);
    setStatus("Μετατρέπω τη φωνή σε κείμενο…");
    try {
      const mime = blob.type || "audio/webm";
      const form = new FormData();
      form.append(
        "audio",
        new File([blob], `pantavion-interpreter.${extension(mime)}`, { type: mime }),
      );
      form.append("language", source);
      const response = await fetch("/api/pantavion/speech-to-text", {
        method: "POST",
        body: form,
      });
      const result = (await response.json().catch(() => ({}))) as SpeechResponse;
      const normalized = String(result.text || result.normalizedText || "").trim();
      const raw = String(result.rawText || normalized).trim();
      if (!response.ok || !normalized) {
        setError(result.error || "Η φωνή καταγράφηκε αλλά δεν επέστρεψε κείμενο.");
        setStatus("Δεν μπόρεσα να αναγνωρίσω τη φωνή.");
        return;
      }
      await translateTurn(normalized, source, target, raw);
    } catch {
      setError("Δεν ήταν δυνατή η αποστολή της φωνής για αναγνώριση.");
      setStatus("Η αναγνώριση φωνής απέτυχε.");
    } finally {
      setBusy(false);
    }
  }

  async function startRecording(source: string, target: string) {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Ο browser δεν υποστηρίζει εγγραφή μικροφώνου.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micGrantedRef.current = true;
      setMicrophone("granted");
      streamRef.current = stream;
      chunksRef.current = [];
      recordingContextRef.current = { source, target };

      const mime = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((item) => MediaRecorder.isTypeSupported(item));
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const context = recordingContextRef.current;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mime || "audio/webm",
        });
        cleanupRecording();
        if (context) void sendRecording(blob, context.source, context.target);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setStatus(
        `Ηχογραφώ τον Ομιλητή ${speaker}… πάτησε ξανά για Τέλος & Διερμηνεία.`,
      );
      timerRef.current = setTimeout(() => {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      }, 15_000);
    } catch {
      micGrantedRef.current = false;
      setMicrophone("denied");
      setError("Δεν δόθηκε πρόσβαση στο μικρόφωνο.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      setStatus("Ολοκληρώνω και μεταφράζω…");
      recorderRef.current.stop();
    }
  }

  async function handleBrowserTranscript(raw: string, source: string, target: string) {
    const normalized = await normalizeTranscript(raw, source);
    if (!normalized.normalizedText) return;
    await translateTurn(normalized.normalizedText, source, target, normalized.rawText);
  }

  async function startInterpreterTurn() {
    if (recording) {
      stopRecording();
      return;
    }
    if (busy || listening) return;

    let allowed = micGrantedRef.current;
    if (!allowed) {
      allowed = await requestMicrophone();
      if (!allowed) return;
    }

    const source = sourceCode;
    const target = targetCode;
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      await startRecording(source, target);
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current?.stop();
    recognitionRef.current = recognition;
    let received = false;
    let fallback = false;

    const useRecordingFallback = () => {
      if (fallback || received) return;
      fallback = true;
      setListening(false);
      void startRecording(source, target);
    };

    recognition.lang = byCode(source).speech;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();
      if (!transcript) return;
      received = true;
      setListening(false);
      void handleBrowserTranscript(transcript, source, target);
    };
    recognition.onerror = () => {
      setListening(false);
      useRecordingFallback();
    };
    recognition.onend = () => {
      setListening(false);
      if (!received && !fallback) useRecordingFallback();
    };

    setError("");
    setListening(true);
    setStatus(
      `Ακούω τον Ομιλητή ${speaker}: ${byCode(source).label} → ${byCode(target).label}…`,
    );
    try {
      recognition.start();
    } catch {
      setListening(false);
      useRecordingFallback();
    }
  }

  function swapPeople() {
    if (twoDeviceActive) {
      setStatus("Οι γλώσσες είναι κλειδωμένες όσο το two-device session είναι ενεργό.");
      return;
    }
    setLanguageA(languageB);
    setLanguageB(languageA);
    setSpeaker("A");
    setSourceText("");
    setTranslatedText("");
    setProvider("");
    setLastSourceCode(languageB);
    setLastTargetCode(languageA);
    setStatus("Οι γλώσσες αντιστράφηκαν. Ο Ομιλητής A ξεκινά.");
  }

  const buttonLabel = recording
    ? "⏹ Τέλος & Διερμηνεία"
    : listening
      ? "🎙️ Ακούω…"
      : busy
        ? "Επεξεργάζομαι…"
        : `🎙️ Μίλα — Ομιλητής ${speaker}`;

  return (
    <main className="min-h-screen bg-[#102a56] px-4 py-4 text-white sm:px-6 sm:py-6">
      <section className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-3 py-1">
          <Link href="/translate" className="text-sm font-bold text-white/85 no-underline">
            ← PantaTranslate
          </Link>
          <span className="text-sm font-black tracking-wide text-[#f6c85f]">
            PantaInterpreter
          </span>
        </header>

        <section className="mt-4 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#17376d] shadow-xl">
          <div className="border-b border-white/10 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-black sm:text-3xl">Αμφίδρομος Διερμηνέας</h1>
              <span className="text-xs font-bold text-white/55">
                7 ήπειροι · {LANGUAGES.length}+ γλώσσες
              </span>
            </div>
            <p className="mt-1 text-sm text-white/65">
              Η κατεύθυνση αλλάζει αυτόματα μετά από κάθε επιτυχημένη μετάφραση.
            </p>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/10 px-4 py-4 sm:px-6">
            <div>
              <div className="mb-1 text-xs font-black text-cyan-100">ΟΜΙΛΗΤΗΣ A</div>
              <select
                value={languageA}
                disabled={twoDeviceActive}
                onChange={(event) => {
                  setLanguageA(event.target.value);
                  setSpeaker("A");
                }}
                className="w-full rounded-xl border border-blue-300/30 bg-[#214784] px-3 py-3 text-sm font-bold text-white outline-none disabled:cursor-not-allowed disabled:opacity-55"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={swapPeople}
              disabled={twoDeviceActive}
              className="mt-5 h-11 w-11 rounded-full border border-cyan-200/30 bg-[#245b92] text-xl font-black text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↔
            </button>
            <div>
              <div className="mb-1 text-xs font-black text-[#ffe29a]">ΟΜΙΛΗΤΗΣ B</div>
              <select
                value={languageB}
                disabled={twoDeviceActive}
                onChange={(event) => {
                  setLanguageB(event.target.value);
                  setSpeaker("A");
                }}
                className="w-full rounded-xl border border-[#f6c85f]/35 bg-[#3a4d79] px-3 py-3 text-sm font-bold text-white outline-none disabled:cursor-not-allowed disabled:opacity-55"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-4 pt-4 sm:px-6">
            <TwoDeviceInterpreterSession
              languageA={languageA}
              languageB={languageB}
              broadcasterRef={twoDeviceBroadcasterRef}
              onRemoteTurn={handleRemoteTurn}
              onSessionLanguages={applySessionLanguages}
              onActiveChange={setTwoDeviceActive}
              onPeerCountChange={setTwoDevicePeerCount}
            />
          </div>

          <div className="px-4 py-4 sm:px-6">
            <div className="rounded-2xl border border-cyan-200/20 bg-[#0f2b59] p-4">
              <div className="text-xs font-black uppercase tracking-wider text-cyan-100">
                Τώρα μιλά ο Ομιλητής {speaker}
              </div>
              <div className="mt-1 text-lg font-black">
                {sourceMeta.label} → {targetMeta.label}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void requestMicrophone()}
              disabled={microphone === "requesting" || busy || listening || recording}
              className="mt-3 w-full rounded-full border border-emerald-200/30 bg-emerald-300/15 px-4 py-3 font-black text-emerald-50 disabled:opacity-60"
            >
              {microphone === "granted"
                ? "✓ Μικρόφωνο ενεργό"
                : microphone === "requesting"
                  ? "🎙️ Ζητώ άδεια…"
                  : "🎙️ Ενεργοποίηση μικροφώνου"}
            </button>

            <button
              type="button"
              onClick={() => void startInterpreterTurn()}
              disabled={busy && !recording}
              className="mt-2 w-full rounded-full bg-cyan-300 px-5 py-4 text-lg font-black text-[#102a56] disabled:opacity-60"
            >
              {buttonLabel}
            </button>

            <div className="mt-3 rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-3 text-sm font-bold text-cyan-50">
              {status}
            </div>
            {error ? (
              <div className="mt-3 rounded-xl border border-red-200/30 bg-red-300/10 p-3 text-sm font-bold text-red-50">
                {error}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                className="rounded-2xl border border-blue-200/20 bg-[#163666] p-4"
                dir={lastSourceMeta.direction}
              >
                <div className="text-xs font-black uppercase text-blue-200">
                  Τελευταία φράση · {lastSourceMeta.label}
                </div>
                <p className="mt-2 min-h-14 whitespace-pre-wrap text-lg font-bold">
                  {sourceText || "—"}
                </p>
              </div>
              <div
                className="rounded-2xl border border-[#f6c85f]/25 bg-[#203b6e] p-4"
                dir={lastTargetMeta.direction}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black uppercase text-[#f6c85f]">
                    Μετάφραση · {lastTargetMeta.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => speak(translatedText, lastTargetCode)}
                    disabled={!translatedText}
                    className="rounded-full border border-[#f6c85f]/25 px-3 py-1 text-xs font-black text-[#ffe29a] disabled:opacity-30"
                  >
                    🔊 Άκου
                  </button>
                </div>
                <p className="mt-2 min-h-14 whitespace-pre-wrap text-lg font-bold">
                  {translatedText || "—"}
                </p>
                {provider ? <p className="mt-2 text-[10px] text-white/35">{provider}</p> : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSpeaker(speaker === "A" ? "B" : "A");
                setStatus("Η σειρά ομιλητή άλλαξε χειροκίνητα.");
              }}
              className="mt-3 w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-white/90"
            >
              Αλλαγή ομιλητή χειροκίνητα ↔
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
