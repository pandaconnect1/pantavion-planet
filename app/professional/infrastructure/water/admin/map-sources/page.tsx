"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Candidate = {
  requestId: string;
  fileName: string;
  fileSize: number;
  sha256: string | null;
  targetMap: "B" | "C";
  ingestState: string;
  reviewState: string;
  verified: boolean;
  createdAt: string;
};

const API = "/api/professional/infrastructure/water/authentic-source-vault/owner-selected";

async function invoke(action: "list" | "review", payload: Record<string, unknown> = {}) {
  const r = await fetch(API, {
    method: "POST", credentials: "include", cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.ok) throw new Error(data.error || `http_${r.status}`);
  return data as { ok: boolean; candidates?: Candidate[]; reviewState?: string };
}

export default function FounderMapSourceApprovals() {
  const [rows, setRows] = useState<Candidate[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    setBusy(true);
    setMessage("Φόρτωση ιδιωτικών υποβολών DWG…");
    try {
      const data = await invoke("list");
      setRows(data.candidates || []);
      setMessage(`Βρέθηκαν ${data.candidates?.length || 0} υποβολές.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Αποτυχία ελέγχου.");
    } finally { setBusy(false); }
  }

  async function review(row: Candidate, decision: "approve" | "reject") {
    const message = decision === "approve"
      ? `Να εγκριθεί το "${row.fileName}" για GIS έλεγχο του Map ${row.targetMap}; Δεν δημοσιεύεται LIVE.`
      : `Να απορριφθεί η υποβολή "${row.fileName}"; Το πρωτότυπο διατηρείται.`;
    if (!window.confirm(message)) return;
    setBusy(true);
    try {
      await invoke("review", { requestId: row.requestId, decision });
      setMessage(decision === "approve"
        ? "Εγκρίθηκε για ξεχωριστό GIS έλεγχο. Ο ενεργός χάρτης ΔΕΝ άλλαξε."
        : "Απορρίφθηκε. Τα δεδομένα διατηρούνται στην ιδιωτική αποθήκη.");
      const next = await invoke("list");
      setRows(next.candidates || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Η απόφαση απέτυχε.");
    } finally { setBusy(false); }
  }

  useEffect(() => { void reload(); }, []);

  return (
    <main className="min-h-screen bg-[#06111f] p-5 text-white">
      <section className="mx-auto max-w-5xl">
        <Link href="/professional/infrastructure/water/admin/approvals" className="text-amber-300">← Κέντρο εγκρίσεων</Link>
        <h1 className="mt-5 text-3xl font-black">Founder · Έγκριση αρχείων DWG</h1>
        <p className="mt-3 text-sm leading-7 text-slate-200">
          Εσύ αποφασίζεις ποιο DWG προορίζεται για τον Map B ή C.
          Η έγκριση αυτή επιτρέπει μόνο τον επόμενο GIS έλεγχο.
          Δεν αντικαθιστά τους ενεργούς χάρτες B/C/D/E και δεν αλλάζει τον Map A.
        </p>
        <button onClick={() => void reload()} disabled={busy}
          className="mt-4 rounded-xl bg-amber-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50">
          Ανανέωση υποβολών
        </button>
        <p role="status" className="mt-4 text-cyan-200">{message}</p>
        <div className="mt-6 grid gap-4">
          {rows.length === 0 ? (
            <p className="rounded-xl border border-slate-600 p-5 text-slate-200">Δεν υπάρχουν ακόμη υποβολές στη νέα αποθήκη.</p>
          ) : rows.map(row => (
            <article key={row.requestId} className="rounded-2xl border border-slate-600 bg-slate-900 p-5">
              <h2 className="text-xl font-black text-amber-300">Map {row.targetMap}</h2>
              <p className="mt-2 break-all font-bold">{row.fileName}</p>
              <p className="mt-2 text-sm text-slate-300">
                {row.fileSize.toLocaleString("el-GR")} bytes · Κατάσταση: {row.ingestState} · Έγκριση: {row.reviewState}
              </p>
              <p className="mt-2 break-all text-xs text-slate-300">
                {row.verified && row.sha256 ? `VERIFIED PRIVATE SHA-256: ${row.sha256}` : "Δεν έχει ολοκληρωθεί η επαλήθευση των bytes."}
              </p>
              <p className="mt-2 break-all text-xs text-slate-400">Αίτηση: {row.requestId}</p>
              {row.reviewState === "review_required" ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button disabled={busy || !row.verified || row.ingestState !== "uploaded"}
                    onClick={() => void review(row, "approve")}
                    className="rounded-xl bg-emerald-400 px-4 py-3 font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">
                    Έγκριση για GIS έλεγχο
                  </button>
                  <button disabled={busy} onClick={() => void review(row, "reject")}
                    className="rounded-xl border border-rose-400 px-4 py-3 font-bold text-rose-200 disabled:opacity-50">
                    Απόρριψη (διατήρηση αρχείου)
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
