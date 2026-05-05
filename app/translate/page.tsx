"use client";

import { useMemo, useState } from "react";
import {
  PANTAVION_LANGUAGE_ATLAS_DOCTRINE,
  PANTAVION_GLOBAL_250_LANGUAGES,
  PANTAVION_UI_LANGUAGES,
} from "../../core/language/pantavion-language-atlas";

type TranslateStatus = "idle" | "working" | "ready" | "error";

export default function PantavionTranslatePage() {
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [mode, setMode] = useState("auto-bidirectional");
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [status, setStatus] = useState<TranslateStatus>("idle");
  const [notice, setNotice] = useState("");

  const languageCount = useMemo(() => PANTAVION_GLOBAL_250_LANGUAGES.length, []);

  async function translate(input?: { imageDataUrl?: string }) {
    setStatus("working");
    setNotice("");

    const response = await fetch("/api/pantavion/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        imageDataUrl: input?.imageDataUrl,
        sourceLanguage,
        targetLanguage,
        mode,
        surface: mode === "sos-safe" ? "sos" : mode === "camera-text" ? "camera" : "global",
        outputStyle: mode === "sos-safe" || mode === "elder-simple" ? "simple" : "natural",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      setStatus("error");
      setNotice(data.message ?? data.error ?? "Pantavion translation provider error.");
      return;
    }

    setTranslatedText(data.translatedText ?? "");
    setStatus("ready");
  }

  function startSpeechInput() {
    const speechWindow = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };

    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setStatus("error");
      setNotice("Speech recognition is not available in this browser. Use text input or mobile Chrome/Edge.");
      return;
    }

    const recognition = new Recognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    if (sourceLanguage !== "auto") {
      recognition.lang = sourceLanguage;
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (typeof transcript === "string") {
        setText(transcript);
        setNotice("Speech captured. Press Translate.");
      }
    };

    recognition.onerror = () => {
      setStatus("error");
      setNotice("Speech capture failed. Try again or type the phrase.");
    };

    recognition.start();
    setNotice("Listening...");
  }

  function speakOutput() {
    const phrase = translatedText || text;
    if (!phrase.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    if (targetLanguage !== "auto") utterance.lang = targetLanguage;
    window.speechSynthesis.speak(utterance);
  }

  async function scanImage(file: File | undefined) {
    if (!file) return;
    const imageDataUrl = await readFileAsDataUrl(file);
    setMode("camera-text");
    await translate({ imageDataUrl });
  }

  function swapLanguages() {
    if (sourceLanguage === "auto") return;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setText(translatedText);
    setTranslatedText(text);
  }

  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <p style={styles.kicker}>PANTAVION_UNIVERSAL_INTERPRETER_V1</p>
        <h1 style={styles.title}>Pantavion Universal Interpreter</h1>
        <p style={styles.subtitle}>
          Independent live translation center for travel, social life, work, accessibility, camera text, SOS, and elder-safe communication.
        </p>
        <div style={styles.metaRow}>
          <span style={styles.meta}>7000+ natural-language atlas ready</span>
          <span style={styles.meta}>{languageCount}+ initial global language seeds</span>
          <span style={styles.meta}>{PANTAVION_LANGUAGE_ATLAS_DOCTRINE.modalities.length} modalities</span>
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.grid}>
          <label style={styles.label}>
            Source
            <select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)} style={styles.select}>
              {PANTAVION_UI_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Target
            <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} style={styles.select}>
              {PANTAVION_UI_LANGUAGES.filter((language) => language.code !== "auto").map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Mode
            <select value={mode} onChange={(event) => setMode(event.target.value)} style={styles.select}>
              <option value="auto-bidirectional">Auto bidirectional interpreter</option>
              <option value="manual-helper-language">Manual helper language backup</option>
              <option value="travel-natural">Travel / street / nightlife</option>
              <option value="social-chat">Social Pantavion chat</option>
              <option value="camera-text">Camera / sign / document text</option>
              <option value="accessibility-subtitles">Accessibility subtitles</option>
              <option value="elder-simple">Elder simple mode</option>
              <option value="sos-safe">SOS safe phrases</option>
            </select>
          </label>
        </div>

        <label style={styles.label}>
          Speak, type, paste, or scan
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write or speak here. Example: I am lost. Can you help me find my hotel?"
            style={styles.textarea}
          />
        </label>

        <div style={styles.actions}>
          <button type="button" onClick={startSpeechInput} style={styles.secondaryButton}>
            Speak input
          </button>
          <button type="button" onClick={() => translate()} style={styles.primaryButton} disabled={status === "working"}>
            {status === "working" ? "Translating..." : "Translate"}
          </button>
          <button type="button" onClick={swapLanguages} style={styles.secondaryButton}>
            Swap
          </button>
          <button type="button" onClick={speakOutput} style={styles.secondaryButton}>
            Read output
          </button>
          <label style={styles.fileButton}>
            Scan image
            <input
              type="file"
              accept="image/*"
              onChange={(event) => scanImage(event.target.files?.[0])}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {notice ? <p style={status === "error" ? styles.error : styles.notice}>{notice}</p> : null}

        <section style={styles.outputBox} aria-live="polite">
          <p style={styles.outputLabel}>Translation / subtitles</p>
          <p style={styles.outputText}>{translatedText || "Your translated output will appear here."}</p>
        </section>
      </section>
    </main>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    padding: "42px",
    background: "radial-gradient(circle at top, #172448 0, #071020 44%, #030712 100%)",
    color: "#fff8e7",
    fontFamily: "Arial, sans-serif",
  },
  hero: { maxWidth: 1040, margin: "0 auto 28px" },
  kicker: { color: "#f6c85f", letterSpacing: 2, fontSize: 12, fontWeight: 800 },
  title: { fontSize: "clamp(36px, 7vw, 76px)", lineHeight: 0.96, margin: "10px 0" },
  subtitle: { color: "#d8e0f4", maxWidth: 820, fontSize: 18, lineHeight: 1.6 },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 },
  meta: { border: "1px solid rgba(246,200,95,.45)", borderRadius: 999, padding: "8px 12px", color: "#f6c85f" },
  panel: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: 22,
    borderRadius: 26,
    background: "rgba(8,16,32,.86)",
    border: "1px solid rgba(246,200,95,.28)",
    boxShadow: "0 24px 90px rgba(0,0,0,.36)",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 },
  label: { display: "grid", gap: 8, color: "#f8dfa1", fontWeight: 800 },
  select: { padding: 14, borderRadius: 16, border: "1px solid rgba(246,200,95,.35)", background: "#0b1530", color: "#fff" },
  textarea: {
    minHeight: 170,
    marginTop: 14,
    padding: 18,
    borderRadius: 20,
    border: "1px solid rgba(246,200,95,.35)",
    background: "#050b18",
    color: "#fff",
    fontSize: 18,
    lineHeight: 1.5,
  },
  actions: { display: "flex", flexWrap: "wrap", gap: 12, margin: "18px 0" },
  primaryButton: { border: 0, borderRadius: 999, padding: "14px 22px", background: "#f6c85f", color: "#081020", fontWeight: 900 },
  secondaryButton: { border: "1px solid rgba(246,200,95,.42)", borderRadius: 999, padding: "14px 18px", background: "transparent", color: "#fff8e7", fontWeight: 800 },
  fileButton: { cursor: "pointer", border: "1px solid rgba(246,200,95,.42)", borderRadius: 999, padding: "14px 18px", color: "#fff8e7", fontWeight: 800 },
  notice: { color: "#f6c85f" },
  error: { color: "#ff8f8f", fontWeight: 800 },
  outputBox: { marginTop: 16, padding: 18, borderRadius: 20, background: "rgba(246,200,95,.08)", border: "1px solid rgba(246,200,95,.22)" },
  outputLabel: { margin: 0, color: "#f6c85f", fontWeight: 900 },
  outputText: { fontSize: 24, lineHeight: 1.45, whiteSpace: "pre-wrap" },
};
