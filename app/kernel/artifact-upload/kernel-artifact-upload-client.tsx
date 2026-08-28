"use client";

import { ChangeEvent, useMemo, useState } from "react";
import * as tus from "tus-js-client";

type Domain =
  | "general"
  | "personal_ai"
  | "translation"
  | "people"
  | "chat"
  | "social"
  | "voice"
  | "learning"
  | "marketplace"
  | "sos"
  | "safety"
  | "security"
  | "kernel"
  | "recovery"
  | "water"
  | "governance"
  | "billing"
  | "experience";

type ArtifactClassification = {
  intakeId?: string;
  detection?: {
    formatId?: string;
    family?: string;
    supportState?: string;
    adapter?: string;
    risk?: string;
    confidence?: string;
  };
  security?: {
    quarantineRequired?: boolean;
    directExecutionAllowed?: boolean;
  };
};

type AuthorizeResponse = {
  ok?: boolean;
  status?: string;
  reason?: string;
  upload?: {
    uploadId?: string;
    bucket?: string;
    path?: string;
    token?: string;
    tusEndpoint?: string;
    chunkSizeBytes?: number;
    expectedSizeBytes?: number;
    expectedFileName?: string;
    mimeType?: string;
    declaredSha256?: string | null;
  };
  classification?: ArtifactClassification;
};

type CompleteResponse = {
  ok?: boolean;
  status?: string;
  reason?: string;
  artifact?: ArtifactClassification;
  verification?: {
    sizeVerified?: boolean;
    headerObservedFromStoredBytes?: boolean;
    fullHashVerification?: "verified" | "worker_required";
    computedSha256?: string | null;
    declaredSha256Matched?: boolean | null;
    largeFileHashWorkerRequired?: boolean;
  };
  storage?: {
    bucket?: string;
    path?: string;
    private?: boolean;
    preserved?: boolean;
    deleted?: boolean;
  };
  execution?: {
    executionId?: string;
    executionStatus?: string;
    workOrderId?: string;
    deduplicated?: boolean;
  };
  truth?: string;
};

const DOMAINS: Array<{ id: Domain; label: string }> = [
  { id: "general", label: "General / αυτόματη ταξινόμηση" },
  { id: "recovery", label: "Recovery / ανασκαφές" },
  { id: "water", label: "Maps / Water / Infrastructure" },
  { id: "personal_ai", label: "Personal AI" },
  { id: "translation", label: "Translation" },
  { id: "social", label: "Social" },
  { id: "people", label: "People" },
  { id: "chat", label: "Chat" },
  { id: "voice", label: "Voice" },
  { id: "learning", label: "PantaLearn" },
  { id: "marketplace", label: "Marketplace" },
  { id: "sos", label: "SOS" },
  { id: "security", label: "Security" },
  { id: "kernel", label: "Kernel" },
  { id: "governance", label: "Governance" },
];

const MAX_CURRENT_BYTES = 1_073_741_824;
const SAMPLE_BYTES = 2_048;

function bytesLabel(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} bytes`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function fileSampleBase64(file: File): Promise<string> {
  const sample = await file.slice(0, Math.min(SAMPLE_BYTES, file.size)).arrayBuffer();
  return arrayBufferToBase64(sample);
}

function classificationText(value?: ArtifactClassification): string {
  const detection = value?.detection;
  if (!detection) return "Δεν έχει ταξινομηθεί ακόμη.";
  return [
    detection.formatId || "unknown",
    detection.family || "unknown-family",
    detection.supportState || "unknown-support",
    detection.adapter || "unknown-adapter",
    `risk:${detection.risk || "unknown"}`,
  ].join(" · ");
}

export default function KernelArtifactUploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [domain, setDomain] = useState<Domain>("general");
  const [phase, setPhase] = useState<
    "idle" | "ready" | "authorizing" | "uploading" | "verifying" | "done" | "blocked"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(
    "Επίλεξε οποιοδήποτε αρχείο. Το Pantavion θα το ταξινομήσει πριν και μετά την πραγματική αποθήκευση.",
  );
  const [classification, setClassification] = useState<ArtifactClassification | null>(null);
  const [result, setResult] = useState<CompleteResponse | null>(null);

  const fileInfo = useMemo(
    () => (file ? `${file.name} · ${bytesLabel(file.size)} · ${file.type || "unknown MIME"}` : "Κανένα αρχείο"),
    [file],
  );

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    setFile(next);
    setClassification(null);
    setResult(null);
    setProgress(0);

    if (!next) {
      setPhase("idle");
      setMessage("Επίλεξε οποιοδήποτε αρχείο.");
      return;
    }

    if (next.size <= 0) {
      setPhase("blocked");
      setMessage("Το αρχείο είναι κενό και δεν μπορεί να σταλεί με το resumable artifact flow.");
      return;
    }
    if (next.size > MAX_CURRENT_BYTES) {
      setPhase("blocked");
      setMessage(
        `Το σημερινό private Pantavion bucket είναι κλειδωμένο στα ${bytesLabel(MAX_CURRENT_BYTES)}. Το αρχείο διατηρείται στη συσκευή — δεν θα προσποιηθούμε ότι ανέβηκε.`,
      );
      return;
    }

    setPhase("ready");
    setMessage("Έτοιμο για private resumable upload. Κανένα format filter δεν εφαρμόζεται στον chooser.");
  }

  async function startUpload() {
    if (!file || phase !== "ready") return;

    setPhase("authorizing");
    setProgress(0);
    setMessage("Αρχική ταξινόμηση και δημιουργία one-time private upload authorization…");

    try {
      const firstBytesBase64 = await fileSampleBase64(file);
      const authorization = await fetch("/api/kernel/artifact-upload/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          fileName: file.name,
          sizeBytes: file.size,
          mimeType: file.type || "application/octet-stream",
          firstBytesBase64,
          domains: [domain],
        }),
      });
      const authorizationBody = (await authorization.json()) as AuthorizeResponse;
      if (!authorization.ok || !authorizationBody.ok || !authorizationBody.upload) {
        throw new Error(authorizationBody.reason || authorizationBody.status || "artifact_upload_authorization_failed");
      }

      setClassification(authorizationBody.classification ?? null);
      const upload = authorizationBody.upload;
      if (
        !upload.uploadId ||
        !upload.bucket ||
        !upload.path ||
        !upload.token ||
        !upload.tusEndpoint ||
        !upload.chunkSizeBytes
      ) {
        throw new Error("artifact_upload_authorization_incomplete");
      }

      setPhase("uploading");
      setMessage(`Uploading privately · ${classificationText(authorizationBody.classification)}`);

      await new Promise<void>((resolve, reject) => {
        const resumable = new tus.Upload(file, {
          endpoint: upload.tusEndpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: upload.chunkSizeBytes,
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          headers: {
            "x-signature": upload.token as string,
            "x-upsert": "false",
          },
          metadata: {
            bucketName: upload.bucket as string,
            objectName: upload.path as string,
            contentType: file.type || "application/octet-stream",
            cacheControl: "0",
          },
          onError(error) {
            reject(error);
          },
          onProgress(bytesUploaded, bytesTotal) {
            const percentage = bytesTotal > 0 ? Math.min(100, (bytesUploaded / bytesTotal) * 100) : 0;
            setProgress(Math.round(percentage * 10) / 10);
          },
          onSuccess() {
            setProgress(100);
            resolve();
          },
        });

        void resumable
          .findPreviousUploads()
          .then((previous) => {
            if (previous.length > 0) resumable.resumeFromPreviousUpload(previous[0]);
            resumable.start();
          })
          .catch(reject);
      });

      setPhase("verifying");
      setMessage("Το upload τελείωσε. Το Pantavion ξαναδιαβάζει τώρα τα πραγματικά αποθηκευμένα bytes και ελέγχει μέγεθος/signature/hash…");

      const completion = await fetch("/api/kernel/artifact-upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          uploadId: upload.uploadId,
          path: upload.path,
          fileName: file.name,
          expectedSizeBytes: file.size,
          mimeType: file.type || "application/octet-stream",
          declaredSha256: upload.declaredSha256 ?? null,
          domains: [domain],
        }),
      });
      const completionBody = (await completion.json()) as CompleteResponse;
      setResult(completionBody);
      if (completionBody.artifact) setClassification(completionBody.artifact);

      if (!completion.ok || !completionBody.ok) {
        setPhase("blocked");
        setMessage(
          completionBody.truth ||
            `Το original διατηρήθηκε, αλλά το promotion μπλοκαρίστηκε: ${completionBody.reason || completionBody.status || "unknown"}.`,
        );
        return;
      }

      setPhase("done");
      setMessage(completionBody.truth || "Artifact stored and verified for its current truth level.");
    } catch (error) {
      setPhase("blocked");
      setMessage(error instanceof Error ? error.message : "artifact_upload_failed");
    }
  }

  const busy = phase === "authorizing" || phase === "uploading" || phase === "verifying";

  return (
    <main className="min-h-screen bg-[#05070d] px-5 py-8 text-white">
      <section className="mx-auto max-w-5xl rounded-[2rem] border border-cyan-300/25 bg-slate-950/90 p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.45em] text-cyan-300">Pantavion Universal Artifact Intake</p>
        <h1 className="mt-4 text-4xl font-black md:text-6xl">Any format. Preserve first. Verify truth.</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-200">
          Πραγματικό founder-only upload προς private Pantavion storage. CAD, maps, documents, media, archives,
          source code, legacy ή άγνωστα formats γίνονται δεκτά χωρίς να αποκτούν αυτόματα δικαίωμα εκτέλεσης.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <span className="text-sm font-bold text-cyan-100">Pantavion domain</span>
            <select
              value={domain}
              disabled={busy}
              onChange={(event) => setDomain(event.target.value as Domain)}
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
            >
              {DOMAINS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-5">
            <span className="text-sm font-bold text-cyan-100">File — χωρίς accept filter</span>
            <input
              className="mt-3 block w-full text-sm"
              type="file"
              disabled={busy}
              onChange={chooseFile}
            />
            <p className="mt-3 break-all text-xs text-slate-400">{fileInfo}</p>
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-sm font-bold text-slate-200">Current classification</p>
          <p className="mt-2 break-words text-sm text-cyan-200">{classificationText(classification ?? undefined)}</p>
          <p className="mt-3 text-xs text-slate-400">
            Current private bucket bound: {bytesLabel(MAX_CURRENT_BYTES)}. Bigger artifacts need a later verified storage tier; they are not falsely marked uploaded.
          </p>
        </div>

        {phase === "uploading" || progress > 0 ? (
          <div className="mt-6">
            <progress value={progress} max={100} className="h-4 w-full" />
            <p className="mt-2 text-sm font-black text-emerald-300">{progress.toFixed(1)}%</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startUpload}
            disabled={phase !== "ready"}
            className="rounded-2xl bg-cyan-300 px-6 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Processing…" : "Upload → verify → queue"}
          </button>
          <a href="/kernel" className="rounded-2xl border border-white/30 px-6 py-3 font-bold">Back to Kernel</a>
        </div>

        <div className={`mt-6 rounded-2xl border p-4 text-sm leading-7 ${phase === "blocked" ? "border-rose-400/40 bg-rose-950/30 text-rose-100" : "border-white/10 bg-white/5 text-slate-200"}`}>
          {message}
        </div>

        {result ? (
          <section className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-black text-cyan-200">Verification</h2>
              <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">
                {JSON.stringify(result.verification ?? {}, null, 2)}
              </pre>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-black text-cyan-200">Execution / storage truth</h2>
              <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">
                {JSON.stringify({ status: result.status, storage: result.storage, execution: result.execution }, null, 2)}
              </pre>
            </article>
          </section>
        ) : null}
      </section>
    </main>
  );
}
