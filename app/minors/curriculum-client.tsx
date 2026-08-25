"use client";

import { useState } from "react";

type CurriculumDecision = {
  coverage: string;
  canUseOfficialCurriculumStructure: boolean;
  canShowFullBookText: boolean;
  canShowLicensedExercises: boolean;
  canGenerateOriginalPractice: boolean;
  canGenerateOriginalExplanations: boolean;
  sourceVerificationRequired: boolean;
  notes: string[];
  resources: Array<{
    id: string;
    title: string;
    publisherOrAuthority?: string;
    officialSourceUrl?: string;
    license: string;
    verificationStatus: string;
  }>;
};

export default function CurriculumClient() {
  const [country, setCountry] = useState("CY");
  const [year, setYear] = useState("2026-2027");
  const [grade, setGrade] = useState("A");
  const [subject, setSubject] = useState("MATH");
  const [language, setLanguage] = useState("EL");
  const [decision, setDecision] = useState<CurriculumDecision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkCoverage() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ country, year, grade, subject, language });
      const response = await fetch(`/api/pantavion/curriculum?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Curriculum request failed");
      setDecision(payload.decision);
    } catch (cause) {
      setDecision(null);
      setError(cause instanceof Error ? cause.message : "Curriculum request failed");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    marginTop: 6,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "11px 12px",
  } as const;

  return (
    <section style={{ marginTop: 38, paddingTop: 30, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
      <h2 style={{ color: "#f7d98b", marginBottom: 8 }}>Country Curriculum Layer</h2>
      <p style={{ color: "#b9c9e8", lineHeight: 1.6, marginTop: 0 }}>
        Έλεγχος επίσημης κάλυψης ανά χώρα, σχολική χρονιά, τάξη, μάθημα και γλώσσα. Το Pantavion δεν παρουσιάζει υλικό ως επίσημο σχολικό περιεχόμενο αν δεν έχει επαληθευτεί η ακριβής πηγή και το δικαίωμα χρήσης.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, marginTop: 16 }}>
        <label style={{ color: "#dbe7ff", fontSize: 13 }}>Χώρα<input aria-label="Curriculum country" value={country} maxLength={2} onChange={(e) => setCountry(e.target.value.toUpperCase())} style={inputStyle} /></label>
        <label style={{ color: "#dbe7ff", fontSize: 13 }}>Σχολική χρονιά<input aria-label="Academic year" value={year} onChange={(e) => setYear(e.target.value)} style={inputStyle} /></label>
        <label style={{ color: "#dbe7ff", fontSize: 13 }}>Τάξη<input aria-label="Grade" value={grade} onChange={(e) => setGrade(e.target.value)} style={inputStyle} /></label>
        <label style={{ color: "#dbe7ff", fontSize: 13 }}>Μάθημα<input aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value.toUpperCase())} style={inputStyle} /></label>
        <label style={{ color: "#dbe7ff", fontSize: 13 }}>Γλώσσα<input aria-label="Curriculum language" value={language} onChange={(e) => setLanguage(e.target.value.toUpperCase())} style={inputStyle} /></label>
      </div>

      <button type="button" onClick={checkCoverage} disabled={loading} style={{ marginTop: 14, borderRadius: 999, border: "1px solid rgba(247,217,139,0.45)", background: "rgba(247,217,139,0.12)", color: "#f7d98b", padding: "10px 18px", fontWeight: 700, cursor: loading ? "wait" : "pointer" }}>
        {loading ? "Έλεγχος…" : "Έλεγχος curriculum"}
      </button>

      {error ? <p role="alert" style={{ color: "#fca5a5" }}>{error}</p> : null}

      {decision ? (
        <div style={{ marginTop: 18, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, background: "rgba(0,0,0,0.2)" }}>
          <strong style={{ color: decision.coverage === "verified_match" ? "#86efac" : "#fde68a" }}>Coverage: {decision.coverage}</strong>
          <p style={{ color: "#dbe7ff" }}>Official curriculum structure: {decision.canUseOfficialCurriculumStructure ? "YES" : "NOT YET"}</p>
          <p style={{ color: "#dbe7ff" }}>Original adaptive explanations/practice: {decision.canGenerateOriginalPractice ? "ALLOWED FROM VERIFIED OBJECTIVES" : "WAITING FOR EXACT VERIFIED MAPPING"}</p>
          <p style={{ color: "#dbe7ff" }}>Full textbook text: {decision.canShowFullBookText ? "LICENSED/OPEN" : "NOT EXPOSED"}</p>
          <p style={{ color: "#dbe7ff" }}>Licensed exercise bank: {decision.canShowLicensedExercises ? "AVAILABLE" : "NOT REGISTERED"}</p>
          {decision.resources.length ? (
            <details>
              <summary style={{ cursor: "pointer", color: "#b9c9e8" }}>Verified authority sources ({decision.resources.length})</summary>
              <ul style={{ color: "#b9c9e8", lineHeight: 1.6 }}>
                {decision.resources.map((resource) => <li key={resource.id}>{resource.title} — {resource.publisherOrAuthority || "authority"} ({resource.license})</li>)}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
