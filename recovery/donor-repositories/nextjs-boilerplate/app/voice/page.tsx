"use client";

import { useState } from "react";

export default function VoiceInterpreterPage() {
  const [status, setStatus] = useState<"idle" | "listening" | "processing">("idle");
  const [text, setText] = useState("");
  const [translated, setTranslated] = useState("");

  const handleMockListen = () => {
    setStatus("listening");
    setTimeout(() => {
      const mock = "Γεια σου, μπορούμε να μιλάμε σε οποιαδήποτε γλώσσα.";
      setText(mock);
      setTranslated("Hello, we can speak in any language.");
      setStatus("processing");
      setTimeout(() => setStatus("idle"), 800);
    }, 800);
  };

  return (
    <div className="pv-page">
      <h1>Live Voice Interpreter (V1 placeholder)</h1>
      <p className="pv-page-subtitle">
        Αυτό είναι demo. Εδώ θα μπει ο πραγματικός ζωντανός φωνητικός διερμηνέας
        με αυτόματο εντοπισμό γλώσσας (STT + TTS).
      </p>

      <div className="pv-card pv-voice-card">
        <button
          className="pv-button pv-button-primary"
          onClick={handleMockListen}
          disabled={status !== "idle"}
        >
          {status === "idle" && "🎙 Πατήστε για δοκιμή"}
          {status === "listening" && "Listening…"}
          {status === "processing" && "Translating…"}
        </button>

        <div className="pv-voice-output">
          <div>
            <h3>Original</h3>
            <p>{text || "Εδώ θα εμφανίζεται αυτό που λες."}</p>
          </div>
          <div>
            <h3>Translated</h3>
            <p>{translated || "Και εδώ η μετάφραση σε πραγματικό χρόνο."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
