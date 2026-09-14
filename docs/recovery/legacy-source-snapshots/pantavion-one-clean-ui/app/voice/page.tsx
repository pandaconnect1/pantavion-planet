"use client";

import { useEffect, useRef, useState } from "react";

export default function VoicePage() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState(
    "Μόλις ξεκινήσει η αναγνώριση εδώ θα μπαίνει demo \"μετάφραση\"…"
  );

  const recognitionRef = useRef<any | null>(null);

  // Έλεγχος υποστήριξης Web Speech API στον browser
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      setIsSupported(true);
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "el-GR"; // demo γλώσσα
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setOriginalText(text);

        // Demo "μετάφραση": απλά προσθέτουμε ένα μήνυμα.
        setTranslatedText(
          `Demo μετάφραση (όχι πραγματική):\n\n${text || "[Περίμενε λίγο κείμενο...]"}`
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }
  }, []);

  const handleStart = () => {
    if (!isSupported || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // Μερικοί browsers πετάνε error αν είναι ήδη on
    }
  };

  const handleStop = () => {
    if (!isSupported || !recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  return (
    <main
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        justifyContent: "center",
        padding: "32px 16px 40px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1100px" }}>
        {/* HEADER */}
        <header style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "clamp(2.1rem, 3.6vw, 2.9rem)",
              fontWeight: 700,
              color: "#bfdbfe",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            VOICE · LIVE INTERPRETER
          </h1>
          <p
            style={{
              marginTop: "10px",
              fontSize: "0.95rem",
              maxWidth: "700px",
              opacity: 0.9,
            }}
          >
            Demo ζωντανού διερμηνέα φωνής. Πάτα{" "}
            <strong>Start listening</strong>, μίλα στο μικρόφωνο και το κείμενο
            θα εμφανιστεί στο πλαίσιο <em>Original Speech</em>. Στη συνέχεια θα
            βλέπεις demo κείμενο στην περιοχή <em>Translated Speech</em>. Σε
            επόμενα βήματα θα συνδέσουμε πραγματική μετάφραση (AI).
          </p>

          {!isSupported && (
            <p
              style={{
                marginTop: "10px",
                fontSize: "0.9rem",
                color: "#fecaca",
              }}
            >
              ⚠ Ο browser δεν φαίνεται να υποστηρίζει Web Speech API
              (SpeechRecognition). Η σελίδα λειτουργεί σαν demo UI. Δοκίμασε
              Chrome ή Edge για καλύτερα αποτελέσματα.
            </p>
          )}
        </header>

        {/* CONTROLS */}
        <section
          style={{
            marginBottom: "18px",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            onClick={handleStart}
            disabled={!isSupported || isListening}
            style={{
              padding: "8px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(56,189,248,0.9)",
              background: isListening
                ? "rgba(56,189,248,0.15)"
                : "rgba(15,23,42,0.9)",
              color: "#e0f2fe",
              fontSize: "0.9rem",
              cursor: !isSupported || isListening ? "not-allowed" : "pointer",
            }}
          >
            Start listening
          </button>
          <button
            onClick={handleStop}
            disabled={!isSupported || !isListening}
            style={{
              padding: "8px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(248,113,113,0.9)",
              background: !isListening
                ? "rgba(15,23,42,0.9)"
                : "rgba(248,113,113,0.12)",
              color: "#fee2e2",
              fontSize: "0.9rem",
              cursor: !isSupported || !isListening ? "not-allowed" : "pointer",
            }}
          >
            Stop
          </button>
        </section>

        {/* PANELS */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "18px",
          }}
        >
          {/* Original Speech */}
          <div
            style={{
              borderRadius: "16px",
              padding: "18px 16px",
              border: "1px solid rgba(37,99,235,0.9)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,64,175,0.8))",
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Original Speech
            </h2>
            <p style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Το κείμενο που αναγνωρίζεται από τη φωνή σου σε πραγματικό
              χρόνο.
            </p>
            <div
              style={{
                marginTop: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(59,130,246,0.9)",
                padding: "10px 12px",
                minHeight: "120px",
                fontSize: "0.9rem",
                background: "rgba(15,23,42,0.9)",
                whiteSpace: "pre-wrap",
              }}
            >
              {originalText || "[Περίμενε… όταν μιλήσεις θα εμφανιστεί εδώ.]"}
            </div>
          </div>

          {/* Translated Speech */}
          <div
            style={{
              borderRadius: "16px",
              padding: "18px 16px",
              border: "1px solid rgba(56,189,248,0.9)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(56,189,248,0.7))",
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Translated Speech (demo)
            </h2>
            <p style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Demo περιοχή «μετάφρασης». Αργότερα θα συνδεθεί με πραγματική
              υπηρεσία μετάφρασης & σύνθεσης φωνής (AI).
            </p>
            <div
              style={{
                marginTop: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(59,130,246,0.9)",
                padding: "10px 12px",
                minHeight: "120px",
                fontSize: "0.9rem",
                background: "rgba(15,23,42,0.9)",
                whiteSpace: "pre-wrap",
              }}
            >
              {translatedText}
            </div>
          </div>
        </section>

        {/* FOOTER NOTE */}
        <section
          style={{
            marginTop: "22px",
            borderRadius: "14px",
            padding: "14px 12px",
            border: "1px dashed rgba(148,163,184,0.7)",
            background: "rgba(15,23,42,0.95)",
            fontSize: "0.82rem",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#fde68a" }}>Σημείωση υλοποίησης:</strong>{" "}
          Το Voice module αυτή τη στιγμή είναι demo UI με βασική χρήση του Web
          Speech API στον browser. Στα επόμενα βήματα μπορούμε να το επεκτείνουμε
          με πραγματική μετάφραση, επιλογή γλωσσών, αποθήκευση ιστορικού
          συνομιλιών και σύνδεση με mobile εφαρμογές.
        </section>
      </div>
    </main>
  );
}
