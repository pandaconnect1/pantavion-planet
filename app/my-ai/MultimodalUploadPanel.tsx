"use client";

import { FormEvent, useState } from "react";

type PreparedAttachment = {
  name: string;
  mediaType: string;
  size: number;
  dataBase64: string;
};

type ResultPayload = {
  threadId?: string;
  reply?: string;
  truthState?: string;
  providerAuth?: string;
  attachments?: Array<{ name: string; mediaType: string; size: number; sha256: string }>;
  multimodal?: {
    analyzedAttachmentCount?: number;
    rawAttachmentBytesPersisted?: boolean;
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

export default function MultimodalUploadPanel({ language }: { language: string | null }) {
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function prepareAttachments(): Promise<PreparedAttachment[]> {
    if (files.length > 3) throw new Error("Μέχρι 3 αρχεία ανά μήνυμα.");
    let total = 0;
    const prepared: PreparedAttachment[] = [];
    for (const file of files) {
      if (!ALLOWED.has(file.type)) throw new Error(`Μη υποστηριζόμενος τύπος: ${file.type || file.name}`);
      if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: μέγιστο 2 MB ανά αρχείο.`);
      total += file.size;
      if (total > MAX_TOTAL_BYTES) throw new Error("Μέγιστο συνολικό μέγεθος 4 MB ανά μήνυμα.");
      prepared.push({
        name: file.name.slice(0, 160),
        mediaType: file.type,
        size: file.size,
        dataBase64: await readAsDataUrl(file),
      });
    }
    return prepared;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (files.length === 0 && !prompt.trim())) return;
    setBusy(true);
    setError(null);
    try {
      const attachments = await prepareAttachments();
      const response = await fetch("/api/personal-ai/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: prompt.trim(),
          threadId,
          inputMode: attachments.length ? (prompt.trim() ? "mixed" : attachments[0]?.mediaType.startsWith("image/") ? "image" : "file") : "text",
          originalLanguage: language,
          attachments,
          metadata: { surface: "my-ai-multimodal-v3" },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 503) throw new Error(data?.detail || data?.error || `request_failed_${response.status}`);
      setResult(data);
      if (typeof data.threadId === "string") setThreadId(data.threadId);
      if (response.status === 503) setError(data?.reply || "Ο AI provider είναι προσωρινά BLOCKED.");
      setFiles([]);
      setPrompt("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "multimodal_request_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pv-panel">
      <p className="pv-kicker">Multimodal Personal AI · v3</p>
      <h2>Δώσε εικόνα ή PDF στο δικό σου AI</h2>
      <p className="pv-muted">
        Πραγματική ανάλυση μέσω του Personal AI runtime. Τα raw bytes στέλνονται μόνο για την τρέχουσα ανάλυση· στη μνήμη του turn αποθηκεύονται metadata και SHA-256, όχι το base64 περιεχόμενο.
      </p>

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 3))}
        />
        {files.length ? (
          <div className="pv-card">
            {files.map((file) => <p key={`${file.name}-${file.size}`} style={{ margin: 0 }}>{file.name} · {Math.ceil(file.size / 1024)} KB</p>)}
          </div>
        ) : null}
        <textarea
          rows={3}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="π.χ. Τι δείχνει αυτή η φωτογραφία; ή Περίληψε αυτό το PDF"
        />
        <button className="pv-button gold" type="submit" disabled={busy || (files.length === 0 && !prompt.trim())}>
          {busy ? "Ανάλυση..." : "Αποστολή στο Personal AI"}
        </button>
      </form>

      {result ? (
        <div className="pv-card" style={{ marginTop: 16 }}>
          <span className="pv-status gold">{result.truthState || "UNVERIFIED"} · auth {result.providerAuth || "unknown"}</span>
          <p style={{ whiteSpace: "pre-wrap" }}>{result.reply || "Χωρίς απάντηση."}</p>
          <small>
            analyzed attachments: {result.multimodal?.analyzedAttachmentCount ?? 0} · raw bytes persisted: {String(result.multimodal?.rawAttachmentBytesPersisted ?? false)}
          </small>
        </div>
      ) : null}

      {error ? <div className="pv-card" style={{ marginTop: 12 }}><span className="pv-status">BLOCKED / INPUT ERROR</span><p>{error}</p></div> : null}
    </div>
  );
}
