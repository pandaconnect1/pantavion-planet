"use client";

import { FormEvent, useMemo, useState } from "react";

type PreparedAttachment = {
  name: string;
  mediaType: string;
  size: number;
  dataBase64: string;
};

type ScanResult = {
  threadId?: string;
  reply?: string;
  truthState?: string;
  providerAuth?: string;
  learningContract?: string;
  masteryMode?: boolean;
  executionStatus?: string;
  multimodal?: {
    analyzedAttachmentCount?: number;
    rawAttachmentBytesPersisted?: boolean;
  };
};

type CurriculumResult = {
  decision?: {
    coverage?: "verified_match" | "verified_partial" | "coverage_missing";
  };
};

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  });
}

export default function ScanToLearnClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [learnerRequest, setLearnerRequest] = useState("Βοήθησέ με να το καταλάβω βήμα-βήμα χωρίς να μου δώσεις απλώς την απάντηση.");
  const [country, setCountry] = useState("CY");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [coverage, setCoverage] = useState<string>("not_checked");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const source = useMemo(() => {
    const first = files[0];
    if (!first) return "typed_text";
    return first.type === "application/pdf" ? "uploaded_pdf" : "uploaded_image";
  }, [files]);

  async function prepareAttachments(): Promise<PreparedAttachment[]> {
    if (files.length > 3) throw new Error("Μέχρι 3 αρχεία ανά μάθημα.");
    let total = 0;
    const prepared: PreparedAttachment[] = [];
    for (const file of files) {
      if (!ALLOWED.has(file.type)) throw new Error(`Μη υποστηριζόμενος τύπος: ${file.type || file.name}`);
      if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: μέγιστο 2 MB ανά αρχείο.`);
      total += file.size;
      if (total > MAX_TOTAL_BYTES) throw new Error("Μέγιστο συνολικό μέγεθος 4 MB.");
      prepared.push({
        name: file.name.slice(0, 160),
        mediaType: file.type,
        size: file.size,
        dataBase64: await readAsDataUrl(file),
      });
    }
    return prepared;
  }

  async function resolveCurriculumCoverage() {
    const params = new URLSearchParams({ country: country.trim().toUpperCase() || "CY" });
    if (grade.trim()) params.set("grade", grade.trim());
    if (subject.trim()) params.set("subject", subject.trim());
    const response = await fetch(`/api/pantavion/curriculum?${params.toString()}`, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as CurriculumResult;
    return data.decision?.coverage || "coverage_missing";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (!learnerRequest.trim() && files.length === 0)) return;
    setBusy(true);
    setError(null);
    try {
      const attachments = await prepareAttachments();
      const curriculumCoverage = await resolveCurriculumCoverage();
      setCoverage(curriculumCoverage);
      const response = await fetch("/api/pantavion/learn/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          learnerRequest: learnerRequest.trim(),
          source,
          countryCode: country.trim().toUpperCase(),
          gradeCode: grade.trim() || undefined,
          subjectCode: subject.trim() || undefined,
          curriculumCoverage,
          threadId,
          attachments,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as ScanResult & { error?: string; detail?: string };
      if (!response.ok && response.status !== 503) throw new Error(data.detail || data.error || `request_failed_${response.status}`);
      setResult(data);
      if (typeof data.threadId === "string") setThreadId(data.threadId);
      if (response.status === 503) setError(data.reply || "Ο AI provider είναι προσωρινά μη διαθέσιμος.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "scan_to_learn_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ marginTop: 28, display: "grid", gap: 16 }}>
      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 18, background: "rgba(255,255,255,0.035)" }}>
        <h2 style={{ marginTop: 0, color: "#f7d98b" }}>Scan‑to‑Learn</h2>
        <p style={{ color: "#c7d5ef", lineHeight: 1.65 }}>
          Φωτογράφισε άσκηση, σελίδα, σημειώσεις ή πίνακα, ή ανέβασε εικόνα/PDF. Το PantaLearn διδάσκει τη μέθοδο και ελέγχει αν την κατάλαβες — δεν λειτουργεί ως μηχανή αντιγραφής απαντήσεων.
        </p>

        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 6, color: "#b9c9e8" }}>
              Χώρα
              <input value={country} maxLength={2} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="CY" />
            </label>
            <label style={{ display: "grid", gap: 6, color: "#b9c9e8" }}>
              Τάξη
              <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="π.χ. GRADE5" />
            </label>
            <label style={{ display: "grid", gap: 6, color: "#b9c9e8" }}>
              Μάθημα
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="π.χ. MATH" />
            </label>
          </div>

          <label style={{ display: "grid", gap: 6, color: "#b9c9e8" }}>
            Φωτογραφία / σκανάρισμα / PDF
            <input
              type="file"
              multiple
              capture="environment"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 3))}
            />
          </label>

          {files.length ? (
            <div style={{ color: "#dbe7ff", fontSize: 13 }}>
              {files.map((file) => <div key={`${file.name}-${file.size}`}>{file.name} · {Math.ceil(file.size / 1024)} KB</div>)}
            </div>
          ) : null}

          <label style={{ display: "grid", gap: 6, color: "#b9c9e8" }}>
            Τι θέλεις να μάθεις;
            <textarea rows={4} value={learnerRequest} onChange={(e) => setLearnerRequest(e.target.value)} />
          </label>

          <button type="submit" disabled={busy || (!learnerRequest.trim() && files.length === 0)} style={{ border: 0, borderRadius: 12, padding: "12px 16px", fontWeight: 700, cursor: "pointer" }}>
            {busy ? "Ανάλυση και διδασκαλία..." : "Μάθε το μαζί μου"}
          </button>
        </form>
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, background: "rgba(0,0,0,0.18)" }}>
        <div style={{ color: "#9fb6df", fontSize: 13 }}>Curriculum coverage: {coverage}</div>
        <p style={{ color: "#9fb6df", fontSize: 13, lineHeight: 1.55 }}>
          Αν η κάλυψη δεν είναι verified, το PantaLearn δεν ισχυρίζεται ότι η απάντηση ακολουθεί ακριβώς την επίσημη σχολική ύλη. Το υλικό του μαθητή χρησιμοποιείται για προσωπική μελέτη και όχι για μαζική αναπαραγωγή βιβλίων.
        </p>
      </div>

      {result ? (
        <div style={{ border: "1px solid rgba(74,222,128,0.25)", borderRadius: 18, padding: 18, background: "rgba(74,222,128,0.04)" }}>
          <div style={{ color: "#4ade80", fontSize: 13 }}>
            {result.learningContract || "learning"} · mastery={String(result.masteryMode)} · {result.truthState || "UNVERIFIED"}
          </div>
          <p style={{ whiteSpace: "pre-wrap", color: "#eef5ff", lineHeight: 1.7 }}>{result.reply || "Χωρίς απάντηση."}</p>
          <small style={{ color: "#9fb6df" }}>
            analyzed attachments: {result.multimodal?.analyzedAttachmentCount ?? 0} · raw bytes persisted: {String(result.multimodal?.rawAttachmentBytesPersisted ?? false)}
          </small>
        </div>
      ) : null}

      {error ? (
        <div style={{ border: "1px solid rgba(248,113,113,0.35)", borderRadius: 16, padding: 14, color: "#fecaca" }}>{error}</div>
      ) : null}
    </section>
  );
}
