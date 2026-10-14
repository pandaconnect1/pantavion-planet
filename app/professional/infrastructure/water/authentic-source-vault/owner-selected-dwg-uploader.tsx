"use client";

import { useState } from "react";
import { hashDwgPieces, intake, PIECE_BYTES, readDwgHeader, uploadSignedDwgPiece } from "./owner-dwg-transfer";

type MapId = "B" | "C";
type Phase = "idle" | "ready" | "hashing" | "uploading" | "verifying" | "verified" | "error";

export default function OwnerSelectedDwgUploader({ targetMap }: { targetMap: MapId }) {
  const [file, setFile] = useState<File | null>(null);
  const [header, setHeader] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("Εσύ επιλέγεις το DWG για αυτόν τον χάρτη.");
  const [progress, setProgress] = useState(0);
  const [stored, setStored] = useState(0);
  const [hash, setHash] = useState("");
  const [requestId, setRequestId] = useState("");

  async function select(selected: File | null) {
    setFile(null);
    setHeader("");
    setStored(0);
    setProgress(0);
    setHash("");
    setRequestId("");
    if (!selected) { setPhase("idle"); return; }
    try {
      const value = await readDwgHeader(selected);
      setFile(selected);
      setHeader(value);
      setPhase("ready");
      setMessage(`Το ${selected.name} επιλέχθηκε από εσένα για τον Map ${targetMap}.`);
    } catch (error) {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "Μη έγκυρο DWG");
    }
  }

  async function transfer() {
    if (!file || !header || (phase !== "ready" && phase !== "error")) return;
    setPhase("hashing");
    setProgress(0);
    try {
      const total = Math.ceil(file.size / PIECE_BYTES);
      const hashes = await hashDwgPieces(file, (done, count) =>
        setMessage(`Έλεγχος αρχείου ${done}/${count}…`));
      // Local request ID is only a resume pointer; server checks target,
      // filename, byte size AND every original piece hash before reuse.
      const key = `pantavion-owner-dwg:${targetMap}:${file.name}:${file.size}`;
      let id = window.localStorage.getItem(key) || "";
      let status = null as Awaited<ReturnType<typeof intake>> | null;
      if (id) {
        try {
          const previous = await intake("status", { requestId: id });
          if (previous.fileName !== file.name || previous.fileSize !== file.size ||
              previous.targetMap !== targetMap || previous.header !== header ||
              previous.expectedChunkSha256?.length !== hashes.length ||
              !previous.expectedChunkSha256.every((v, i) => v === hashes[i])) {
            throw new Error("Το προηγούμενο αίτημα αφορά διαφορετικό αρχείο. Επίλεξε νέα υποβολή.");
          }
          if (previous.reviewState === "review_required") status = previous;
          else { id = ""; window.localStorage.removeItem(key); }
        } catch (error) {
          if (error instanceof Error && error.message.startsWith("Το προηγούμενο")) throw error;
          id = ""; window.localStorage.removeItem(key);
        }
      }
      if (!id) {
        const started = await intake("begin", {
          targetMap, fileName: file.name, fileSize: file.size, header, chunkSha256: hashes,
        });
        if (!started.requestId) throw new Error("Δεν δημιουργήθηκε αίτημα υποβολής.");
        id = started.requestId;
        window.localStorage.setItem(key, id);
      }
      setRequestId(id);
      status ??= await intake("status", { requestId: id });
      if (!status.chunks || status.chunks.length !== total) throw new Error("Δεν επιβεβαιώθηκαν τα τμήματα.");
      setPhase("uploading");
      let finishedBytes = 0;
      for (let i = 0; i < total; i++) {
        const start = i * PIECE_BYTES;
        const size = Math.min(PIECE_BYTES, file.size - start);
        const item = status.chunks.find(c => c.index === i);
        if (!item || item.expectedBytes !== size)
          throw new Error(`Ασυμφωνία τμήματος ${i + 1}.`);
        if (item.present && !item.sizeMatches)
          throw new Error(`Το αποθηκευμένο τμήμα ${i + 1} έχει λάθος μέγεθος.`);
        if (!item.present) {
          setMessage(`Μεταφορά Map ${targetMap}, τμήμα ${i + 1}/${total}…`);
          const signed = await intake("sign-part", { requestId: id, chunkIndex: i });
          if (signed.expectedChunkSizeBytes !== size)
            throw new Error("Δεν επαληθεύτηκε το επιτρεπόμενο μέγεθος τμήματος.");
          await uploadSignedDwgPiece(file.slice(start, start + size), id, i, signed, sent =>
            setProgress(Math.min(100, (finishedBytes + sent) / file.size * 100)));
        }
        finishedBytes += size;
        setStored(i + 1);
        setProgress(finishedBytes / file.size * 100);
      }
      setPhase("verifying");
      setMessage("Έλεγχος SHA-256 των πραγματικών δεδομένων από την αποθήκη…");
      const verified = await intake("verify", { requestId: id });
      if (!verified.verified || verified.sizeBytes !== file.size || !verified.sha256)
        throw new Error("Το αρχείο δεν επαληθεύτηκε.");
      setHash(verified.sha256);
      setPhase("verified");
      setMessage("VERIFIED PRIVATE ORIGINAL ✓ Αποθηκεύτηκε αυτούσιο. Απαιτείται δική σου έγκριση και GIS έλεγχος για να εμφανιστεί στον χάρτη.");
    } catch (error) {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "Αποτυχία μεταφοράς");
    }
  }

  const busy = phase === "hashing" || phase === "uploading" || phase === "verifying";
  return (
    <article className="rounded-3xl border border-amber-400/40 bg-[#08172b] p-5">
      <p className="text-xs font-black uppercase tracking-widest text-amber-300">Founder Choice · Private DWG</p>
      <h2 className="mt-2 text-2xl font-black">Map {targetMap} — δικό σου DWG</h2>
      <p className="mt-3 text-sm leading-6 text-slate-200">
        Δέχεται όποιο έγκυρο DWG επιλέξεις από κινητό ή USB (έως 512 MiB).
        Κανένα αρχείο δεν γίνεται αυτόματα ενεργός χάρτης. Ο Map A παραμένει ανέπαφος.
      </p>
      <input type="file" accept=".dwg,application/acad,image/vnd.dwg"
        disabled={busy} onChange={e => void select(e.target.files?.[0] || null)}
        className="mt-4 block w-full text-sm text-white" />
      {file ? <p className="mt-3 break-all text-xs text-slate-300">
        {file.name} · {file.size.toLocaleString("el-GR")} bytes · {Math.ceil(file.size / PIECE_BYTES)} τμήματα · {header}
      </p> : null}
      <button type="button" onClick={() => void transfer()}
        disabled={!file || busy || phase === "verified"}
        className="mt-4 rounded-xl bg-amber-300 px-4 py-3 font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">
        {busy ? "Ασφαλής επεξεργασία…" : "Ασφαλής μεταφόρτωση επιλεγμένου DWG"}
      </button>
      <progress className="mt-4 block h-3 w-full" value={progress} max={100} />
      <p className="mt-2 text-xs text-slate-300">
        {stored}/{file ? Math.ceil(file.size / PIECE_BYTES) : 0} τμήματα · {progress.toFixed(1)}%
      </p>
      <p role="status" className={`mt-3 break-words text-sm font-bold ${phase === "error" ? "text-rose-300" : phase === "verified" ? "text-emerald-300" : "text-slate-200"}`}>
        {message}
      </p>
      {requestId ? <p className="mt-2 break-all text-xs text-slate-400">Αίτηση: {requestId}</p> : null}
      {hash ? <p className="mt-2 break-all text-xs text-emerald-300">SHA-256: {hash}</p> : null}
      {phase === "verified" ? (
        <a href="/professional/infrastructure/water/admin/map-sources"
          className="mt-4 inline-block rounded-xl border border-emerald-400 p-3 font-bold text-emerald-200">
          Άνοιγμα εγκρίσεων DWG →
        </a>
      ) : null}
    </article>
  );
}
