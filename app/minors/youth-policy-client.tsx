"use client";

import { useState } from "react";

const capabilities = [
  ["learning", "Μάθηση / Learning"],
  ["support", "Υποστήριξη / Support"],
  ["interpreter", "Μετάφραση / Interpreter"],
  ["protected_communication", "Προστατευμένη επικοινωνία"],
  ["community_participation", "Κοινότητες"],
  ["public_social_feed", "Δημόσιο social feed"],
  ["public_social_publish", "Δημόσια δημοσίευση"],
  ["ai_assistant", "AI assistant"],
  ["marketplace", "Marketplace"],
  ["payments", "Payments"],
  ["dating", "Dating"],
  ["adult_restricted", "Adult restricted"],
] as const;

type Decision = {
  access: string;
  purpose: string;
  regulatoryClass: string;
  riskLevel: string;
  childBenefits: string[];
  safetyControls: string[];
  jurisdictionStatus: string;
  jurisdictionReviewRequired: boolean;
  optimizeForChildBenefitNotEngagement: boolean;
  reasons: string[];
};

export default function YouthPolicyClient() {
  const [age, setAge] = useState("13");
  const [country, setCountry] = useState("CY");
  const [capability, setCapability] = useState("learning");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function inspectPolicy() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ country, age, capability });
      const response = await fetch(`/api/pantavion/youth-policy?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Policy request failed");
      setDecision(payload.decision);
    } catch (cause) {
      setDecision(null);
      setError(cause instanceof Error ? cause.message : "Policy request failed");
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "12px 14px",
    fontSize: 15,
  } as const;

  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ marginBottom: 8, color: "#f7d98b" }}>Live Youth Policy Inspector</h2>
      <p style={{ color: "#b9c9e8", lineHeight: 1.6, marginTop: 0 }}>
        Δείχνει πώς το Pantavion χωρίζει μάθηση, υποστήριξη και δημόσιο social ανά ηλικία και χώρα. Δεν χρειάζεται προσωπική ιστορία ή ευαίσθητα δεδομένα.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginTop: 20 }}>
        <label style={{ color: "#dbe7ff", fontSize: 13 }}>
          Ηλικία
          <input aria-label="Ηλικία" value={age} onChange={(event) => setAge(event.target.value)} inputMode="numeric" style={{ ...fieldStyle, marginTop: 6 }} />
        </label>
        <label style={{ color: "#dbe7ff", fontSize: 13 }}>
          Χώρα (ISO)
          <input aria-label="Χώρα" value={country} maxLength={2} onChange={(event) => setCountry(event.target.value.toUpperCase())} style={{ ...fieldStyle, marginTop: 6 }} />
        </label>
        <label style={{ color: "#dbe7ff", fontSize: 13 }}>
          Capability
          <select aria-label="Capability" value={capability} onChange={(event) => setCapability(event.target.value)} style={{ ...fieldStyle, marginTop: 6 }}>
            {capabilities.map(([value, label]) => <option key={value} value={value} style={{ color: "#111" }}>{label}</option>)}
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={inspectPolicy}
        disabled={loading}
        style={{
          marginTop: 16,
          borderRadius: 999,
          border: "1px solid rgba(247,217,139,0.45)",
          background: "rgba(247,217,139,0.12)",
          color: "#f7d98b",
          padding: "11px 20px",
          cursor: loading ? "wait" : "pointer",
          fontWeight: 700,
        }}
      >
        {loading ? "Έλεγχος…" : "Έλεγχος πολιτικής"}
      </button>

      {error ? <p role="alert" style={{ color: "#fca5a5" }}>{error}</p> : null}

      {decision ? (
        <div style={{ marginTop: 20, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 18, background: "rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <strong style={{ color: "#f7d98b" }}>Access: {decision.access}</strong>
            <span style={{ color: "#9fb6df" }}>Risk: {decision.riskLevel}</span>
            <span style={{ color: "#9fb6df" }}>Class: {decision.regulatoryClass}</span>
            <span style={{ color: "#9fb6df" }}>Jurisdiction: {decision.jurisdictionStatus}</span>
          </div>
          <p style={{ color: "#dbe7ff" }}>Purpose: {decision.purpose}</p>
          <p style={{ color: "#dbe7ff" }}>
            Child-benefit optimization: {decision.optimizeForChildBenefitNotEngagement ? "ON" : "N/A"}
          </p>
          <p style={{ color: decision.jurisdictionReviewRequired ? "#fde68a" : "#86efac" }}>
            {decision.jurisdictionReviewRequired ? "Απαιτείται νομικός/ρυθμιστικός επανέλεγχος χώρας." : "Ο ενεργός jurisdiction rule είναι επαληθευμένος για enforcement."}
          </p>
          <details>
            <summary style={{ cursor: "pointer", color: "#b9c9e8" }}>Safety controls ({decision.safetyControls.length})</summary>
            <ul style={{ color: "#b9c9e8", lineHeight: 1.6 }}>{decision.safetyControls.map((item) => <li key={item}>{item}</li>)}</ul>
          </details>
        </div>
      ) : null}
    </section>
  );
}
