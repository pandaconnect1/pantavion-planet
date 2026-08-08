"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

type SpeechToTextResponse = {
  ok?: boolean;
  text?: string;
  error?: string;
  code?: string;
  provider?: string;
};

type SpeechRecognitionResultLike = { 0?: { transcript?: string } };
type SpeechRecognitionEventLike = { results?: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionErrorEventLike = { error?: string; message?: string };
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
type MicrophonePermissionState = "unknown" | "requesting" | "granted" | "denied";

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

function audioExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

const tapClass = "select-none touch-manipulation [-webkit-touch-callout:none]";

export default function TranslatePage() {
  const [fromLanguage, setFromLanguage] = useState("el");
  const [toLanguage, setToLanguage] = useState("en");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [microphonePermission, setMicrophonePermission] = useState<MicrophonePermissionState>("unknown");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fromMeta = useMemo(() => languageByCode(fromLanguage), [fromLanguage]);
  const toMeta = useMemo(() => languageByCode(toLanguage), [toLanguage]);
  const voiceBusy = listening || recording || transcribing || microphonePermission === "requesting";

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function requestMicrophonePermission() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophonePermission("denied");
      setVoiceStatus("");
      setError("Ο browser δεν δίνει πρόσβαση στο μικρόφωνο. Άνοιξε το Pantavion σε Safari, Chrome ή άλλο πλήρη browser.");
      return false;
    }

    setMicrophonePermission("requesting");
    setError("");
    setVoiceStatus("Ζητώ άδεια μικροφώνου…");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicrophonePermission("granted");
      setError("");
      setVoiceStatus("✓ Το μικρόφωνο είναι ενεργό για το Pantavion.");
      return true;
    } catch {
      setMicrophonePermission("denied");
      setVoiceStatus("");
      setError(
        "Το μικρόφωνο είναι μπλοκαρισμένο για το pantavion.com. Αν είχες πατήσει Απαγόρευση, άνοιξε τις Ρυθμίσεις/Δικαιώματα του ιστοτόπου και επίλεξε Μικρόφωνο → Επιτρέπεται.",
      );
      return false;
    }
  }

  function speak(text: string, languageCode: string) {
    if (!text.trim()) return;
    if (!("speechSynthesis" in window)) {
      setError("Η συσκευή δεν υποστηρίζει φωνητική αναπαραγωγή σε αυτόν τον browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageByCode(languageCode).speech;
    utterance.onerror = () => {
      setVoiceStatus("Η μετάφραση εμφανίστηκε, αλλά η συσκευή δεν μπόρεσε να την εκφωνήσει.");
    };
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
    setVoiceStatus(autoSpeak ? "Μεταφράζω…" : "");

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
        setVoiceStatus("");
        setError(result.message || result.error || "Η μετάφραση δεν επέστρεψε αποτέλεσμα για αυτό το ζεύγος γλωσσών.");
        return "";
      }

      const translated = output.trim();
      setTranslatedText(translated);
      setProvider(result.provider || "Pantavion");
      if (autoSpeak) {
        setVoiceStatus("Μεταφράστηκε. Αναπαράγω τη μετάφραση…");
        speak(translated, toLanguage);
      }
      return translated;
    } catch {
      setTranslatedText("");
      setVoiceStatus("");
      setError("Δεν ήταν δυνατή η σύνδεση με τη μετάφραση. Δοκίμασε ξανά.");
      return "";
    } finally {
      setLoading(false);
    }
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
    setVoiceStatus("");
  }

  function cleanupMediaStream() {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    setRecording(false);
  }

  async function sendAudioForTranscription(blob: Blob, autoTranslate: boolean) {
    if (!blob.size) {
      setError("Δεν καταγράφηκε ήχος. Δοκίμασε ξανά.");
      return;
    }

    setTranscribing(true);
    setError("");
    setVoiceStatus("Μετατρέπω τη φωνή σε κείμενο…");

    try {
      const form = new FormData();
      const mimeType = blob.type || "audio/webm";
      form.append("audio", new File([blob], `pantavion-voice.${audioExtension(mimeType)}`, { type: mimeType }));
      form.append("language", fromLanguage);

      const response = await fetch("/api/pantavion/speech-to-text", { method: "POST", body: form });
      const result = (await response.json().catch(() => ({}))) as SpeechToTextResponse;
      const transcript = String(result.text || "").trim();

      if (!response.ok || !transcript) {
        setVoiceStatus("");
        setError(result.error || "Η φωνή καταγράφηκε, αλλά δεν επέστρεψε κείμενο. Δοκίμασε ξανά.");
        return;
      }

      setSourceText(transcript);
      setVoiceStatus(`Άκουσα: ${transcript}`);
      if (autoTranslate) await translateText(transcript, true);
    } catch {
      setVoiceStatus("");
      setError("Δεν ήταν δυνατή η αποστολή της φωνής για αναγνώριση.");
    } finally {
      setTranscribing(false);
    }
  }

  async function startServerRecording(autoTranslate: boolean) {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Ο browser δεν δίνει πρόσβαση σε μικρόφωνο/ηχογράφηση. Άνοιξε τη σελίδα σε Safari, Chrome ή άλλο πλήρη browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission("granted");
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];

      const preferredMimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
        .find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
      const recorder = preferredMimeType ? new MediaRecorder(stream, { mimeType: preferredMimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        cleanupMediaStream();
        setVoiceStatus("");
        setError("Η εγγραφή μικροφώνου απέτυχε. Έλεγξε την άδεια μικροφώνου.");
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || preferredMimeType || "audio/webm";
        const blob = new Blob(mediaChunksRef.current, { type: mimeType });
        cleanupMediaStream();
        void sendAudioForTranscription(blob, autoTranslate);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      setError("");
      setVoiceStatus(autoTranslate
        ? "Ηχογραφώ… μίλα τώρα. Πάτησε ξανά για Τέλος & Μετάφραση."
        : "Ηχογραφώ… μίλα τώρα. Πάτησε ξανά για Τέλος.");

      recordingTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      }, 15_000);
    } catch {
      cleanupMediaStream();
      setMicrophonePermission("denied");
      setVoiceStatus("");
      setError("Το μικρόφωνο είναι μπλοκαρισμένο. Πάτησε «Ενεργοποίηση μικροφώνου» ή άλλαξε τα Δικαιώματα ιστοτόπου αν το είχες απαγορεύσει.");
    }
  }

  function stopServerRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      setVoiceStatus("Ολοκληρώνω την εγγραφή…");
      mediaRecorderRef.current.stop();
    }
  }

  async function startListening(autoTranslate = false) {
    if (recording) {
      stopServerRecording();
      return;
    }

    if (microphonePermission !== "granted") {
      const allowed = await requestMicrophonePermission();
      if (!allowed) return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      await startServerRecording(autoTranslate);
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new Recognition();
    let receivedTranscript = false;
    let fallbackStarted = false;

    const startFallback = () => {
      if (fallbackStarted || receivedTranscript) return;
      fallbackStarted = true;
      void startServerRecording(autoTranslate);
    };

    recognition.lang = fromMeta.speech;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();
      if (!transcript) return;
      receivedTranscript = true;
      setSourceText(transcript);
      setVoiceStatus(`Άκουσα: ${transcript}`);
      if (autoTranslate) void translateText(transcript, true);
    };
    recognition.onerror = (event) => {
      setListening(false);
      const code = event?.error || "unknown";

      if (code === "not-allowed" || code === "service-not-allowed") {
        fallbackStarted = true;
        setMicrophonePermission("denied");
        setVoiceStatus("");
        setError("Το μικρόφωνο είναι μπλοκαρισμένο για το pantavion.com. Άλλαξε τα Δικαιώματα ιστοτόπου σε Μικρόφωνο → Επιτρέπεται.");
        return;
      }
      if (code === "audio-capture") {
        fallbackStarted = true;
        setVoiceStatus("");
        setError("Δεν βρέθηκε διαθέσιμο μικρόφωνο στη συσκευή.");
        return;
      }

      setVoiceStatus("Η αναγνώριση του browser δεν επέστρεψε κείμενο. Περνάω σε εφεδρική εγγραφή…");
      startFallback();
    };
    recognition.onend = () => {
      setListening(false);
      if (!receivedTranscript && !fallbackStarted) {
        setVoiceStatus("Δεν έλαβα κείμενο από τον browser. Περνάω σε εφεδρική εγγραφή…");
        startFallback();
      }
    };

    recognitionRef.current = recognition;
    setListening(true);
    setError("");
    setVoiceStatus("Ακούω… μίλα τώρα.");

    try {
      recognition.start();
    } catch {
      setListening(false);
      startFallback();
    }
  }

  const microphoneLabel = microphonePermission === "requesting"
    ? "🎙️ Ζητώ άδεια…"
    : microphonePermission === "granted"
      ? "✓ Μικρόφωνο ενεργό"
      : "🎙️ Ενεργοποίηση μικροφώνου";

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
            <button type="button" onClick={() => swapDirection(false)} onContextMenu={(event) => event.preventDefault()} aria-label="Αντιστροφή γλωσσών" className={`${tapClass} h-11 w-11 rounded-full border border-cyan-200/30 bg-[#245b92] text-xl font-black text-cyan-100`}>↔</button>
            <select value={toLanguage} onChange={(event) => setToLanguage(event.target.value)} className="min-w-0 rounded-xl border border-[#f6c85f]/35 bg-[#3a4d79] px-3 py-3 text-sm font-bold text-white outline-none">
              {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
            </select>
          </div>

          <div className="px-4 py-4 sm:px-6">
            <textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Γράψε εδώ…" dir={fromMeta.direction} autoFocus className="min-h-40 w-full resize-y rounded-2xl border border-white/10 bg-[#0f2b59] p-4 text-lg text-white outline-none placeholder:text-blue-100/45 focus:border-cyan-300/55" />

            <button
              type="button"
              onClick={() => void requestMicrophonePermission()}
              onContextMenu={(event) => event.preventDefault()}
              disabled={microphonePermission === "requesting" || recording || listening || transcribing}
              className={`${tapClass} mt-3 w-full rounded-full border border-emerald-200/30 bg-emerald-300/15 px-4 py-3 font-black text-emerald-50 disabled:opacity-60`}
            >
              {microphoneLabel}
            </button>

            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => void startListening(false)} onContextMenu={(event) => event.preventDefault()} disabled={transcribing || loading || microphonePermission === "requesting"} className={`${tapClass} rounded-full border border-blue-200/30 bg-[#245b92] px-4 py-3 font-black text-white disabled:opacity-60`}>
                {recording ? "⏹ Τέλος" : listening ? "🎙️ Ακούω…" : "🎙️ Μίλα"}
              </button>
              <button type="button" onClick={() => void startListening(true)} onContextMenu={(event) => event.preventDefault()} disabled={transcribing || loading || microphonePermission === "requesting"} className={`${tapClass} rounded-full border border-cyan-200/30 bg-[#1d6388] px-4 py-3 font-black text-white disabled:opacity-60`}>
                {recording ? "⏹ Τέλος & Μετάφραση" : listening ? "🎙️ Ακούω…" : "🎙️ Μίλα & Μετάφραση"}
              </button>
              <button type="button" onClick={() => void translateText(sourceText, false)} onContextMenu={(event) => event.preventDefault()} disabled={loading || voiceBusy} className={`${tapClass} rounded-full bg-cyan-300 px-5 py-3 font-black text-[#102a56] disabled:opacity-60`}>
                {loading ? "Μεταφράζω…" : transcribing ? "Μεταγράφω…" : "Μετάφραση"}
              </button>
            </div>

            {microphonePermission === "denied" ? (
              <p className="mt-2 text-xs font-semibold leading-5 text-white/70">
                Αν η άδεια είχε ήδη απορριφθεί, ο browser δεν επιτρέπει στο Pantavion να την αλλάξει μόνο του. Άνοιξε τα Δικαιώματα ιστοτόπου για το pantavion.com και επίλεξε Μικρόφωνο → Επιτρέπεται.
              </p>
            ) : null}

            {voiceStatus ? <div className="mt-3 rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-sm font-bold text-cyan-50">{voiceStatus}</div> : null}
            {error ? <div className="mt-4 rounded-xl border border-red-200/30 bg-red-300/10 p-3 text-sm font-bold text-red-50">{error}</div> : null}

            <div className="mt-4 rounded-2xl border border-[#f6c85f]/25 bg-[#203b6e] p-4" dir={toMeta.direction}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#f6c85f]">{toMeta.label}</span>
                <button type="button" onClick={() => speak(translatedText, toLanguage)} onContextMenu={(event) => event.preventDefault()} disabled={!translatedText} className={`${tapClass} rounded-full border border-[#f6c85f]/25 px-3 py-1.5 text-xs font-black text-[#ffe29a] disabled:opacity-30`}>🔊 Άκου</button>
              </div>
              <p className="mt-3 min-h-16 whitespace-pre-wrap text-xl font-bold leading-8 text-white">{translatedText || "Η μετάφραση θα εμφανιστεί εδώ."}</p>
              {provider ? <p className="mt-2 text-[10px] text-white/35">{provider}</p> : null}
            </div>

            <button type="button" onClick={() => swapDirection(true)} onContextMenu={(event) => event.preventDefault()} className={`${tapClass} mt-3 w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-white/90`}>
              Επόμενος ομιλητής ↔
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
