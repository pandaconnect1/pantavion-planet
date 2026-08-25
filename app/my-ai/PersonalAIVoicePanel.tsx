"use client";

import { useRef, useState } from "react";

type SpeechPayload = {
  ok?: boolean;
  text?: string;
  rawText?: string;
  normalizedText?: string;
  provider?: string;
  detectedLanguage?: string;
  requestedLanguage?: string;
  publicCode?: string;
  error?: string;
  speechAccessibility?: {
    enabled?: boolean;
    changed?: boolean;
    normalizer?: string;
    preservedRawTranscript?: boolean;
  };
};

type PersonalAIResult = {
  threadId?: string;
  reply?: string;
  truthState?: string;
  executionStatus?: string;
  provider?: string;
  providerAuth?: string;
};

const MAX_RECORDING_MS = 60_000;

function preferredRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((value) => MediaRecorder.isTypeSupported(value)) || "";
}

function extensionForMime(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export default function PersonalAIVoicePanel({ language }: { language: string | null }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [rawTranscript, setRawTranscript] = useState("");
  const [normalizedTranscript, setNormalizedTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [truthState, setTruthState] = useState("");
  const [provider, setProvider] = useState("");
  const [error, setError] = useState<string | null>(null);

  function cleanupStream() {
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(false);
  }

  async function sendAudio(blob: Blob, mimeType: string) {
    if (!blob.size) throw new Error("Δεν καταγράφηκε ήχος.");
    setProcessing(true);
    setError(null);

    try {
      const form = new FormData();
      const safeMime = mimeType || blob.type || "audio/webm";
      form.append("audio", new File([blob], `personal-ai-voice.${extensionForMime(safeMime)}`, { type: safeMime }));
      form.append("language", language || "auto");

      const speechResponse = await fetch("/api/pantavion/speech-to-text", {
        method: "POST",
        body: form,
      });
      const speech = (await speechResponse.json().catch(() => ({}))) as SpeechPayload;
      if (!speechResponse.ok || !speech.ok) {
        throw new Error(speech.error || speech.publicCode || `speech_failed_${speechResponse.status}`);
      }

      const raw = (speech.rawText || speech.text || "").trim();
      const normalized = (speech.normalizedText || speech.text || raw).trim();
      if (!normalized) throw new Error("Η φωνή αναγνωρίστηκε χωρίς χρήσιμο κείμενο.");

      setRawTranscript(raw);
      setNormalizedTranscript(normalized);

      const aiResponse = await fetch("/api/personal-ai/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: normalized,
          threadId,
          inputMode: "voice",
          originalLanguage: speech.detectedLanguage || speech.requestedLanguage || language || null,
          metadata: {
            surface: "my-ai-voice-v4",
            handsFree,
            driving: handsFree,
            speech: {
              rawTranscript: raw,
              normalizedTranscript: normalized,
              provider: speech.provider || null,
              detectedLanguage: speech.detectedLanguage || null,
              requestedLanguage: speech.requestedLanguage || language || "auto",
              accessibility: speech.speechAccessibility || null,
              rawAudioPersisted: false,
            },
          },
        }),
      });
      const ai = (await aiResponse.json().catch(() => ({}))) as PersonalAIResult & { error?: string; detail?: string };
      if (!aiResponse.ok && aiResponse.status !== 503) {
        throw new Error(ai.detail || ai.error || `personal_ai_failed_${aiResponse.status}`);
      }

      if (ai.threadId) setThreadId(ai.threadId);
      setReply(ai.reply || "Δεν επιστράφηκε απάντηση.");
      setTruthState(ai.truthState || "UNVERIFIED");
      setProvider(ai.provider || ai.providerAuth || "unknown");
      if (aiResponse.status === 503) setError(ai.reply || "Ο AI provider είναι προσωρινά BLOCKED.");
    } finally {
      setProcessing(false);
    }
  }

  async function startRecording() {
    if (recording || processing) return;
    setError(null);
    setReply("");

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Η συσκευή ή ο browser δεν υποστηρίζει ασφαλή εγγραφή φωνής εδώ.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = preferredRecorderMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        setError("Η εγγραφή φωνής απέτυχε.");
        cleanupStream();
      };

      recorder.onstop = async () => {
        const recordedType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: recordedType });
        chunksRef.current = [];
        cleanupStream();
        try {
          await sendAudio(blob, recordedType);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "voice_processing_failed");
        }
      };

      recorder.start(500);
      setRecording(true);
      autoStopRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, MAX_RECORDING_MS);
    } catch (cause) {
      cleanupStream();
      const message = cause instanceof DOMException && cause.name === "NotAllowedError"
        ? "Δεν δόθηκε άδεια μικροφώνου."
        : cause instanceof Error ? cause.message : "microphone_failed";
      setError(message);
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  return (
    <div className="pv-panel">
      <p className="pv-kicker">Personal AI Voice · v4</p>
      <h2>Μίλα φυσικά — το ίδιο AI συνεχίζει τη μνήμη.</h2>
      <p className="pv-muted">
        Η φωνή περνά από το υπάρχον Pantavion STT, κρατά raw και meaning-preserving normalized transcript,
        και συνεχίζει στο ίδιο Personal AI thread. Το raw audio δεν αποθηκεύεται από αυτή τη ροή.
      </p>

      <div className="pv-actions" style={{ marginBottom: 12 }}>
        <button className="pv-button" type="button" onClick={() => setHandsFree((value) => !value)} disabled={recording || processing}>
          Hands-free / driving-safe response: {handsFree ? "ON" : "OFF"}
        </button>
        {!recording ? (
          <button className="pv-button gold" type="button" onClick={startRecording} disabled={processing}>
            {processing ? "Επεξεργασία..." : "Έναρξη φωνής"}
          </button>
        ) : (
          <button className="pv-button gold" type="button" onClick={stopRecording}>
            Διακοπή τώρα
          </button>
        )}
      </div>

      {handsFree ? (
        <div className="pv-card">
          <strong>Hands-free safety</strong>
          <p style={{ marginBottom: 0 }}>
            Ενεργοποίησέ το μόνο όταν είναι ασφαλές. Η εγγραφή σταματά αυτόματα σε 60 δευτερόλεπτα.
            Αν οδηγείς, μην κοιτάζεις ή χειρίζεσαι την οθόνη.
          </p>
        </div>
      ) : null}

      {recording ? <p><span className="pv-status gold">RECORDING</span> Αυτόματη διακοπή έως 60s.</p> : null}

      {rawTranscript ? (
        <div className="pv-card" style={{ marginTop: 12 }}>
          <small>Original / raw transcript</small>
          <p>{rawTranscript}</p>
          <small>Meaning-preserving normalized transcript</small>
          <p style={{ marginBottom: 0 }}>{normalizedTranscript}</p>
        </div>
      ) : null}

      {reply ? (
        <div className="pv-card" style={{ marginTop: 12 }}>
          <span className="pv-status gold">{truthState || "UNVERIFIED"}</span>
          <p style={{ whiteSpace: "pre-wrap" }}>{reply}</p>
          <small>provider: {provider || "unknown"} · thread: {threadId || "new"}</small>
        </div>
      ) : null}

      {error ? (
        <div className="pv-card" style={{ marginTop: 12 }}>
          <span className="pv-status">BLOCKED / INPUT ERROR</span>
          <p style={{ marginBottom: 0 }}>{error}</p>
        </div>
      ) : null}
    </div>
  );
}
