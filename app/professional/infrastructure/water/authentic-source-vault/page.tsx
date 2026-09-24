"use client";

import { useMemo, useState } from "react";
import * as tus from "tus-js-client";

const SUPABASE_PROJECT_ID = "cxhulvwkagzufbjsdwwu";
const TUS_ENDPOINT =
  `https://${SUPABASE_PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable`;
const TUS_CHUNK_SIZE = 6 * 1024 * 1024;

const SOURCES = [
  {
    id: "map-b-canonical",
    title: "Canonical Map B",
    fileName: "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
    sizeBytes: 205565159,
    sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
  },
  {
    id: "map-a-original",
    title: "Map A — authentic original (owner-confirmed)",
    fileName: "GEORGE_MAP_MASTER_B_C_FINAL.dwg",
    sizeBytes: 205877448,
    sha256: "0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9",
  },
  {
    id: "older-2025-master",
    title: "Older 2025 master",
    fileName: "MASTER 2025_Μ_15.1.2025_ANDREASPAP.dwg 22-9-2025",
    sizeBytes: 218850248,
    sha256: "9555d17904ceae39a14482db228c5d5fe3e0a961e7bb78b89418896d68eb3ebb",
  },
] as const;

type Source = (typeof SOURCES)[number];
type Phase = "idle" | "ready" | "authorizing" | "uploading" | "verifying" | "verified" | "error";

type VaultResponse = {
  ok?: boolean;
  status?: string;
  error?: string;
  bucket?: string;
  path?: string;
  token?: string;
  expectedSizeBytes?: number;
  expectedSha256?: string;
  actualSizeBytes?: number;
  actualSha256?: string;
  sha256?: string;
  header?: string;
};


function KmzNetworkUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(
    "Επίλεξε το KMZ του δικτύου ύδρευσης. Δεν χρειάζεται να ταιριάζει με τα DWG bytes.",
  );

  function chooseKmz(next: File | null) {
    setFile(next);
    setProgress(0);

    if (!next) {
      setPhase("idle");
      setMessage("Επίλεξε το KMZ του δικτύου ύδρευσης.");
      return;
    }

    if (!next.name.toLowerCase().endsWith(".kmz")) {
      setPhase("error");
      setMessage("Χρειάζεται αρχείο .kmz.");
      return;
    }

    setPhase("ready");
    setMessage(
      `Έτοιμο για upload: ${next.name} · ${next.size.toLocaleString("en-US")} bytes.`,
    );
  }

  async function uploadKmz() {
    if (!file || phase !== "ready") return;

    setPhase("authorizing");
    setMessage("Δημιουργία ασφαλούς upload για το KMZ…");

    try {
      const signResponse = await fetch(
        "/api/professional/infrastructure/water/network-kmz",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sign",
            fileName: file.name,
            sizeBytes: file.size,
          }),
        },
      );

      const signBody = (await signResponse.json()) as VaultResponse;
      if (!signResponse.ok || !signBody.ok) {
        throw new Error(signBody.error || signBody.status || "kmz_upload_authorization_failed");
      }
      if (!signBody.bucket || !signBody.path || !signBody.token) {
        throw new Error("kmz_upload_authorization_incomplete");
      }

      setPhase("uploading");
      setMessage("Ανέβασμα KMZ χωρίς μετατροπή…");

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: TUS_ENDPOINT,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: TUS_CHUNK_SIZE,
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          headers: {
            "x-signature": signBody.token as string,
            "x-upsert": "false",
          },
          metadata: {
            bucketName: signBody.bucket as string,
            objectName: signBody.path as string,
            contentType: "application/vnd.google-earth.kmz",
            cacheControl: "0",
          },
          onError: reject,
          onProgress(bytesUploaded, bytesTotal) {
            const pct =
              bytesTotal > 0
                ? Math.min(100, (bytesUploaded / bytesTotal) * 100)
                : 0;
            const rounded = Math.round(pct * 10) / 10;
            setProgress(rounded);
            setMessage(`Ανέβασμα KMZ… ${rounded.toFixed(1)}%`);
          },
          onSuccess: () => resolve(),
        });

        void upload
          .findPreviousUploads()
          .then((previous) => {
            if (previous.length > 0) upload.resumeFromPreviousUpload(previous[0]);
            upload.start();
          })
          .catch(reject);
      });

      setPhase("verifying");
      setMessage("Έλεγχος ότι το KMZ αποθηκεύτηκε ολόκληρο…");

      const verifyResponse = await fetch(
        "/api/professional/infrastructure/water/network-kmz",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify",
            path: signBody.path,
            sizeBytes: file.size,
          }),
        },
      );

      const verifyBody = (await verifyResponse.json()) as VaultResponse;
      if (!verifyResponse.ok || !verifyBody.ok) {
        throw new Error(
          verifyBody.error || verifyBody.status || "kmz_verification_failed",
        );
      }

      setProgress(100);
      setPhase("verified");
      setMessage(
        `KMZ STORED ✓ · ${verifyBody.actualSizeBytes?.toLocaleString("en-US")} bytes · SHA-256 ${verifyBody.sha256 || ""}`,
      );
    } catch (error) {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "kmz_upload_failed");
    }
  }

  return (
    <article className="rounded-3xl border border-cyan-400/30 bg-cyan-950/20 p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
        Water Network Import
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">
        KMZ δικτύου ύδρευσης
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
        Αυτό είναι ξεχωριστό από τα κλειδωμένα DWG originals. Δέχεται το KMZ όπως είναι,
        χωρίς έλεγχο του DWG byte-size, και το κρατά ιδιωτικά για το επόμενο import στον χάρτη.
      </p>

      <input
        className="mt-4 block w-full text-sm text-slate-200"
        type="file"
        accept=".kmz,application/vnd.google-earth.kmz"
        disabled={phase === "uploading" || phase === "verifying"}
        onChange={(event) => chooseKmz(event.target.files?.[0] || null)}
      />

      {progress > 0 ? (
        <div className="mt-4">
          <progress className="h-3 w-full" value={progress} max={100} />
          <div className="mt-1 text-xs font-black text-cyan-200">
            {progress.toFixed(1)}%
          </div>
        </div>
      ) : null}

      <p
        className={
          "mt-4 text-sm font-bold " +
          (phase === "verified"
            ? "text-emerald-300"
            : phase === "error"
              ? "text-rose-300"
              : "text-slate-300")
        }
      >
        {message}
      </p>

      <button
        type="button"
        onClick={() => void uploadKmz()}
        disabled={phase !== "ready"}
        className="mt-3 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
      >
        Upload network KMZ
      </button>
    </article>
  );
}

function SourceUploader({ source }: { source: Source }) {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Select the exact original DWG.");

  const mb = useMemo(
    () => Math.round((source.sizeBytes / 1024 / 1024) * 100) / 100,
    [source.sizeBytes],
  );

  async function chooseFile(next: File | null) {
    setFile(next);
    setProgress(0);
    if (!next) {
      setPhase("idle");
      setMessage("Select the exact original DWG.");
      return;
    }
    if (next.size !== source.sizeBytes) {
      setPhase("error");
      setMessage(`Wrong byte size. Expected exactly ${source.sizeBytes} bytes.`);
      return;
    }
    const header = new TextDecoder("ascii").decode(
      await next.slice(0, 6).arrayBuffer(),
    );
    if (header !== "AC1032") {
      setPhase("error");
      setMessage("This file is not the locked AC1032 DWG source.");
      return;
    }
    setPhase("ready");
    setMessage("Exact byte size + AC1032 header match. No conversion will occur.");
  }

  async function verify() {
    setPhase("verifying");
    setMessage("Reading the stored bytes and checking SHA-256…");
    const response = await fetch(
      "/api/professional/infrastructure/water/authentic-source-vault",
      {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: source.id, action: "verify" }),
      },
    );
    const body = (await response.json()) as VaultResponse;
    if (!response.ok || !body.ok) {
      throw new Error(body.error || body.status || "verification_failed");
    }
    if (
      body.actualSizeBytes !== source.sizeBytes ||
      body.actualSha256 !== source.sha256 ||
      body.header !== "AC1032"
    ) {
      throw new Error("stored_bytes_do_not_match_locked_original");
    }
    setProgress(100);
    setPhase("verified");
    setMessage("VERIFIED EXACT ORIGINAL · same bytes · same SHA-256 · AC1032.");
  }

  async function upload() {
    if (!file || phase !== "ready") return;
    setPhase("authorizing");
    setMessage("Creating private, no-overwrite upload authorization…");

    try {
      const response = await fetch(
        "/api/professional/infrastructure/water/authentic-source-vault",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceId: source.id, action: "sign" }),
        },
      );
      const body = (await response.json()) as VaultResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error || body.status || "upload_authorization_failed");
      }

      if (body.status === "already_present") {
        await verify();
        return;
      }

      if (!body.bucket || !body.path || !body.token) {
        throw new Error("upload_authorization_incomplete");
      }

      setPhase("uploading");
      setMessage("Uploading exact original bytes in resumable 6 MB chunks…");

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: TUS_ENDPOINT,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: TUS_CHUNK_SIZE,
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          headers: {
            "x-signature": body.token as string,
            "x-upsert": "false",
          },
          metadata: {
            bucketName: body.bucket as string,
            objectName: body.path as string,
            contentType: "application/acad",
            cacheControl: "0",
          },
          onError: reject,
          onProgress(bytesUploaded, bytesTotal) {
            const pct =
              bytesTotal > 0
                ? Math.min(100, (bytesUploaded / bytesTotal) * 100)
                : 0;
            const rounded = Math.round(pct * 10) / 10;
            setProgress(rounded);
            setMessage(`Uploading exact original… ${rounded.toFixed(1)}%`);
          },
          onSuccess: () => resolve(),
        });

        void upload
          .findPreviousUploads()
          .then((previous) => {
            if (previous.length > 0) upload.resumeFromPreviousUpload(previous[0]);
            upload.start();
          })
          .catch(reject);
      });

      await verify();
    } catch (error) {
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "upload_failed");
    }
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <h2 className="text-xl font-black text-white">{source.title}</h2>
      {source.id === "map-a-original" ? (
        <p className="mt-2 text-sm font-black text-emerald-300">
          OWNER-CONFIRMED MAP A · historical filename retained unchanged · raw bytes unchanged.
        </p>
      ) : null}
      <p className="mt-2 break-all text-sm font-bold text-slate-200">
        {source.fileName}
      </p>
      <p className="mt-2 text-xs text-slate-400">
        {source.sizeBytes.toLocaleString("en-US")} bytes · {mb} MiB · AC1032
      </p>
      <p className="mt-1 break-all text-[11px] text-slate-500">
        SHA-256: {source.sha256}
      </p>

      <input
        className="mt-4 block w-full text-sm text-slate-200"
        type="file"
        accept=".dwg,image/vnd.dwg,application/acad"
        disabled={phase === "uploading" || phase === "verifying"}
        onChange={(event) => void chooseFile(event.target.files?.[0] || null)}
      />

      {progress > 0 ? (
        <div className="mt-4">
          <progress className="h-3 w-full" value={progress} max={100} />
          <div className="mt-1 text-xs font-black text-cyan-200">
            {progress.toFixed(1)}%
          </div>
        </div>
      ) : null}

      <p
        className={
          "mt-4 text-sm font-bold " +
          (phase === "verified"
            ? "text-emerald-300"
            : phase === "error"
              ? "text-rose-300"
              : "text-slate-300")
        }
      >
        {message}
      </p>

      <button
        type="button"
        onClick={() => void upload()}
        disabled={phase !== "ready"}
        className="mt-3 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
      >
        Upload exact original
      </button>
    </article>
  );
}

export default function AuthenticSourceVaultPage() {
  return (
    <main className="min-h-screen bg-[#020812] px-4 py-6 text-white sm:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-950/20 p-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
            Pantavion Water · Authentic Source Vault
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            Raw originals only
          </h1>
          <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-200">
            NO CONVERSION · NO MERGE · NO GEOMETRY EDIT · NO OVERWRITE.
            The selected DWG bytes are uploaded unchanged into private storage,
            then read back and SHA-256 verified against the locked original.
          </p>
        </div>

        <div className="mt-6 grid gap-5">
          <KmzNetworkUploader />
          {SOURCES.map((source) => (
            <SourceUploader key={source.id} source={source} />
          ))}
        </div>
      </section>
    </main>
  );
}
