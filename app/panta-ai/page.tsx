"use client";

import { useState } from "react";

const assistantOptions = [
  ["publicGuide", "PantaAI Public Guide"],
  ["personalUserAssistant", "Personal PantaAI"],
  ["sosLanguageGuardian", "SOS Language Guardian"],
  ["workIncomeAssistant", "Work and Income Assistant"],
  ["creatorMediaAssistant", "Creator and Media Assistant"],
  ["internalGuardian", "Internal Guardian Kernel"],
] as const;

export default function PantaAiPage() {
  const [assistantKey, setAssistantKey] = useState("publicGuide");
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "ready" | "error">("idle");
  const [notice, setNotice] = useState("");

  async function askPantaAi() {
    setStatus("working");
    setNotice("");

    const response = await fetch("/api/pantavion/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assistantKey, message }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      setStatus("error");
      setNotice(data.message ?? data.error ?? "PantaAI provider error.");
      return;
    }

    setAnswer(data.answer ?? "");
    setStatus("ready");
  }

  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <p style={styles.kicker}>PANTAVION_AI_COMMAND_CENTER_V1</p>
        <h1 style={styles.title}>PantaAI Center</h1>
        <p style={styles.subtitle}>
          Public AI for the world, personal AI for each user, SOS language AI, work/income AI, creator AI, and internal Guardian Kernel AI.
        </p>
      </section>

      <section style={styles.panel}>
        <label style={styles.label}>
          AI assistant
          <select value={assistantKey} onChange={(event) => setAssistantKey(event.target.value)} style={styles.select}>
            {assistantOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          Ask anything
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask PantaAI about travel, translation, safety, work, culture, Pantavion, or your next task."
            style={styles.textarea}
          />
        </label>

        <button type="button" onClick={askPantaAi} style={styles.primaryButton} disabled={status === "working"}>
          {status === "working" ? "PantaAI thinking..." : "Ask PantaAI"}
        </button>

        {notice ? <p style={status === "error" ? styles.error : styles.notice}>{notice}</p> : null}

        <section style={styles.outputBox} aria-live="polite">
          <p style={styles.outputLabel}>PantaAI answer</p>
          <p style={styles.outputText}>{answer || "The answer will appear here."}</p>
        </section>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    padding: "42px",
    background: "radial-gradient(circle at top, #18284e 0, #071020 44%, #030712 100%)",
    color: "#fff8e7",
    fontFamily: "Arial, sans-serif",
  },
  hero: { maxWidth: 1040, margin: "0 auto 28px" },
  kicker: { color: "#f6c85f", letterSpacing: 2, fontSize: 12, fontWeight: 800 },
  title: { fontSize: "clamp(38px, 7vw, 82px)", lineHeight: 0.95, margin: "10px 0" },
  subtitle: { color: "#d8e0f4", maxWidth: 820, fontSize: 18, lineHeight: 1.6 },
  panel: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: 22,
    borderRadius: 26,
    background: "rgba(8,16,32,.86)",
    border: "1px solid rgba(246,200,95,.28)",
    boxShadow: "0 24px 90px rgba(0,0,0,.36)",
  },
  label: { display: "grid", gap: 8, color: "#f8dfa1", fontWeight: 800, marginBottom: 16 },
  select: { padding: 14, borderRadius: 16, border: "1px solid rgba(246,200,95,.35)", background: "#0b1530", color: "#fff" },
  textarea: {
    minHeight: 180,
    padding: 18,
    borderRadius: 20,
    border: "1px solid rgba(246,200,95,.35)",
    background: "#050b18",
    color: "#fff",
    fontSize: 18,
    lineHeight: 1.5,
  },
  primaryButton: { border: 0, borderRadius: 999, padding: "14px 22px", background: "#f6c85f", color: "#081020", fontWeight: 900 },
  notice: { color: "#f6c85f" },
  error: { color: "#ff8f8f", fontWeight: 800 },
  outputBox: { marginTop: 16, padding: 18, borderRadius: 20, background: "rgba(246,200,95,.08)", border: "1px solid rgba(246,200,95,.22)" },
  outputLabel: { margin: 0, color: "#f6c85f", fontWeight: 900 },
  outputText: { fontSize: 20, lineHeight: 1.55, whiteSpace: "pre-wrap" },
};
