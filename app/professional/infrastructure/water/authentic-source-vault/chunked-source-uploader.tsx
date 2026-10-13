"use client";

import { useState } from "react";
import * as tus from "tus-js-client";

type CanonicalSource = {
  id: string;
  title: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
};

type PieceState = {
  index: number;
  present: boolean;
  sizeMatches: boolean;
};

type ChunkResponse = {
  ok?: boolean;
  error?: string;
  token?: string;
  bucket?: string;
  path?: string;
  chunks?: PieceState[];
  chunkIndex?: number;
  verified?: boolean;
  sha256?: string;
  sizeBytes?: number;
  header?: string;
  expectedChunkSizeBytes?: number;
};

const PROJECT = "cxhulvwkagzufbjsdwwu";
const TUS_ENDPOINT = `https://${PROJECT}.storage.supabase.co/storage/v1/upload/resumable`;
const CHUNK_BYTES = 32 * 1024 * 1024;
const TUS_CHUNK_BYTES = 6 * 1024 * 1024;
const API = "/api/professional/infrastructure/water/authentic-source-vault/chunked";

function fail(message: string): never {
  throw new Error(message);
}

export default function ChunkedSourceUploader({ source }: { source: CanonicalSource }) {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"idle" | "ready" | "uploading" | "verifying" | "verified" | "error">("idle");
  const [message, setMessage] = useState("Επίλεξε το ακριβές αυθεντικό DWG. Δεν μετατρέπεται ούτε κόβεται γεωγραφικά.");
  const [progress, setProgress] = useState(0);
  const [storedCount, setStoredCount] = useState<number | null>(null);
  const totalChunks = Math.ceil(source.sizeBytes / CHUNK_BYTES);
  const sourceKey = source.id === "map-b-canonical" ? "canonical-2026-andreaspap" : "legacy-george-85m";

  async function api(action: "chunk-status" | "sign-chunk-upload" | "verify-chunked", chunkIndex?: number) {
    const response = await fetch(API, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, sourceKey, ...(chunkIndex === undefined ? {} : { chunkIndex }) }),
    });
    const result = (await response.json().catch(() => ({}))) as ChunkResponse;
    if (!response.ok || !result.ok) {
      fail(result.error || `water_chunk_${action}_failed_${response.status}`);
    }
    return result;
  }

  async function selectFile(next: File | null) {
    setFile(null);
    setProgress(0);
    setStoredCount(null);
    if (!next) {
      setPhase("idle");
      return;
    }
    if (next.size !== source.sizeBytes) {
      setPhase("error");
      setMessage(`Λανθασμένο μέγεθος. Αναμενόταν ${source.sizeBytes} bytes.`);
      return;
    }
    const header = new TextDecoder("ascii").decode(await next.slice(0, 6).arrayBuffer());
    if (header !== "AC1032") {
      setPhase("error");
      setMessage("Το αρχείο δεν είναι το απαιτούμενο αυθεντικό AC1032 DWG.");
      return;
    }
    setFile(next);
    setPhase("ready");
    setMessage(`Το αρχείο αναγνωρίστηκε. ${totalChunks} τμήματα μεταφοράς των έως 32 MiB, χωρίς αλλαγή DWG.`);
  }

  async function checkStatus() {
    try {
      const result = await api("chunk-status");
      const ready = (result.chunks || []).filter((chunk) => chunk.present && chunk.sizeMatches).length;
      setStoredCount(ready);
      setMessage(result.verified
        ? `VERIFIED ORIGINAL ✓ · ${ready}/${totalChunks} · ${source.sha256}`
        : `Αποθηκευμένα σωστά: ${ready}/${totalChunks} τμήματα. ${ready === totalChunks ? "Απαιτείται πλήρης SHA-256 επαλήθευση." : "Η αποστολή δεν έχει ολοκληρωθεί."}`);
      if (result.verified) {
        setPhase("verified");
        setProgress(100);
      }
    } catch (error) {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "status_failed");
    }
  }

  function uploadPart(piece: Blob, token: string, bucket: string, path: string, index: number, onProgress: (bytes: number) => void) {
    return new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(piece, {
        endpoint: TUS_ENDPOINT,
        chunkSize: TUS_CHUNK_BYTES,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        fingerprint: async () => `pantavion-water-source-${source.sha256}-piece-${index}`,
        headers: { "x-signature": token, "x-upsert": "false" },
        metadata: {
          bucketName: bucket,
          objectName: path,
          contentType: "application/octet-stream",
          cacheControl: "0",
        },
        onError: (error) => reject(error),
        onProgress: (bytesUploaded) => onProgress(bytesUploaded),
        onSuccess: () => resolve(),
      });

      void upload.findPreviousUploads()
        .then((previous) => {
          if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
          upload.start();
        })
        .catch(reject);
    });
  }

  async function upload() {
    if (!file || phase !== "ready") return;
    setPhase("uploading");
    try {
      const initial = await api("chunk-status");
      const pieces = new Map((initial.chunks || []).map((p) => [p.index, p]));
      let completedBytes = 0;
      for (let index = 0; index < totalChunks; index += 1) {
        const start = index * CHUNK_BYTES;
        const length = Math.min(CHUNK_BYTES, file.size - start);
        const current = pieces.get(index);
        if (current?.present) {
          if (!current.sizeMatches) fail(`existing_chunk_size_mismatch_${index}`);
          completedBytes += length;
          setStoredCount(index + 1);
          setProgress((completedBytes / file.size) * 100);
          continue;
        }

        setMessage(`Μεταφορά πρωτοτύπου, τμήμα ${index + 1}/${totalChunks}…`);
        const signed = await api("sign-chunk-upload", index);
        if (!signed.token || !signed.bucket || !signed.path ||
            signed.expectedChunkSizeBytes !== length) {
          fail(`signed_chunk_authorization_mismatch_${index}`);
        }

        await uploadPart(
          file.slice(start, start + length), signed.token, signed.bucket, signed.path,
          index,
          (sent) => setProgress(((completedBytes + sent) / file.size) * 100),
        );
        completedBytes += length;
        setStoredCount(index + 1);
        setProgress((completedBytes / file.size) * 100);
      }

      setPhase("verifying");
      setMessage("Επαλήθευση ολόκληρου DWG στη μόνιμη αποθήκη — SHA-256, μέγεθος και AC1032…");
      const verified = await api("verify-chunked");
      if (verified.sha256 !== source.sha256 ||
          verified.sizeBytes !== source.sizeBytes ||
          verified.header !== "AC1032") {
        fail("original_not_verified");
      }
      setPhase("verified");
      setProgress(100);
      setMessage("VERIFIED ORIGINAL ✓ Το αυθεντικό DWG αποθηκεύτηκε και επαληθεύτηκε ολόκληρο. Η εμφάνιση GIS/tiles χρειάζεται ξεχωριστό έλεγχο LIVE.");
    } catch (error) {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "water_chunked_upload_failed");
    }
  }

  return (
    <article className="rounded-3xl border border-cyan-400/30 bg-cyan-950/20 p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
        Private canonical DWG · 32 MiB upload parts
      </p>
      <h2 className="mt-2 text-xl font-black text-white">{source.title}</h2>
      <p className="mt-2 break-all text-sm text-slate-200">{source.fileName}</p>
      <p className="mt-2 text-xs text-slate-400">
        {source.sizeBytes.toLocaleString("en-US")} bytes · {totalChunks} τμήματα · AC1032
      </p>
      <p className="mt-1 break-all text-[11px] text-slate-400">SHA-256: {source.sha256}</p>
      <p className="mt-3 text-sm leading-6 text-cyan-100">
        Τα τμήματα αφορούν μόνο τα bytes μεταφοράς, όχι τις γεωμετρικές περιοχές του δικτύου.
        Δεν γίνεται μετατροπή ή αλλοίωση του DWG.
      </p>

      <input
        className="mt-4 block w-full text-sm text-white"
        type="file"
        accept=".dwg,application/acad,image/vnd.dwg"
        disabled={phase === "uploading" || phase === "verifying"}
        onChange={(event) => void selectFile(event.target.files?.[0] || null)}
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => void checkStatus()}
          disabled={phase === "uploading" || phase === "verifying"}
          className="rounded-xl border border-cyan-400/50 px-4 py-3 text-sm font-black text-cyan-100 disabled:opacity-50">
          Έλεγχος αποθήκης
        </button>
        <button type="button" onClick={() => void upload()} disabled={phase !== "ready"}
          className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">
          Ασφαλής μεταφόρτωση DWG
        </button>
      </div>

      {storedCount !== null ? (
        <p className="mt-3 text-xs text-cyan-100">Αποθηκευμένα τμήματα: {storedCount}/{totalChunks}</p>
      ) : null}
      <progress className="mt-3 h-3 w-full" value={progress} max={100} />
      <p className={"mt-3 text-sm font-bold " + (phase === "verified" ? "text-emerald-300" : phase === "error" ? "text-rose-300" : "text-slate-200")}>
        {message}
      </p>
    </article>
  );
}
