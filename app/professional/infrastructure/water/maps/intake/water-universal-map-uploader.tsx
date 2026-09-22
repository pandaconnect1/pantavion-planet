"use client";

import { ChangeEvent, useMemo, useState } from "react";
import * as tus from "tus-js-client";

import {
  PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES,
  PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES,
} from "@/core/intake/pantavion-artifact-storage-policy";

type Classification = {
  intakeId?: string;
  formatId?: string;
  family?: string;
  supportState?: string;
  adapter?: string;
  risk?: string;
  confidence?: string;
  adapterState?: string;
  waterRelevant?: boolean;
  truth?: string;
};

type AuthorizeResponse = {
  ok?: boolean;
  error?: string;
  requestId?: string;
  upload?: {
    bucket?: string;
    path?: string;
    token?: string;
    tusEndpoint?: string;
    chunkSizeBytes?: number;
    expectedSizeBytes?: number;
    maxBytes?: number;
  };
  classification?: Classification;
  reviewState?: string;
};

type CompleteResponse = {
  ok?: boolean;
  status?: string;
  error?: string;
  requestId?: string;
  classification?: Classification;
  verification?: {
    sizeVerified?: boolean;
    headerObservedFromStoredBytes?: boolean;
    fullHashVerification?: string;
    computedSha256?: string | null;
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
    status?: string;
    workOrderId?: string;
  } | null;
  reviewState?: string;
  ingestState?: string;
  truth?: string;
};

type Phase =
  | "idle"
  | "ready"
  | "authorizing"
  | "uploading"
  | "verifying"
  | "done"
  | "blocked";

function bytesLabel(bytes: number) {
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(2) + " GB";
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return String(bytes) + " bytes";
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function sampleBase64(file: File) {
  const buffer = await file
    .slice(0, Math.min(file.size, PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES))
    .arrayBuffer();
  return arrayBufferToBase64(buffer);
}

function readDeviceClaim() {
  if (typeof window === "undefined") {
    return { deviceId: "", deviceToken: "" };
  }

  const deviceId =
    window.localStorage.getItem("pantavion_water_device_id") ||
    window.localStorage.getItem("pantavion-water-device-id") ||
    window.localStorage.getItem("pantavion:water:device-id:v1") ||
    window.localStorage.getItem("waterDeviceId") ||
    "";

  const deviceToken =
    window.localStorage.getItem("pantavion_water_device_token") ||
    window.localStorage.getItem("pantavion-water-device-token") ||
    window.localStorage.getItem("pantavion:water:device-token:v1") ||
    window.localStorage.getItem("waterDeviceToken") ||
    "";

  if (deviceId && deviceToken) return { deviceId, deviceToken };

  const packed =
    window.localStorage.getItem("pantavion_water_access_device") || "";
  if (packed) {
    try {
      const parsed = JSON.parse(packed) as {
        deviceId?: string;
        deviceToken?: string;
      };
      return {
        deviceId: parsed.deviceId || deviceId,
        deviceToken: parsed.deviceToken || deviceToken,
      };
    } catch {
      return { deviceId, deviceToken };
    }
  }

  return { deviceId, deviceToken };
}

function accessHeaders() {
  const claim = readDeviceClaim();
  return {
    "Content-Type": "application/json",
    "x-pantavion-water-device-id": claim.deviceId,
    "x-pantavion-water-device-token": claim.deviceToken,
  };
}

function classificationLabel(value: Classification | null) {
  if (!value) return "Δεν έχει γίνει ακόμη server classification.";
  return [
    value.formatId || "unknown",
    value.family || "unknown-family",
    value.supportState || "unknown-support",
    value.adapterState || "unknown-adapter-state",
    "risk:" + (value.risk || "unknown"),
  ].join(" · ");
}

export default function WaterUniversalMapUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [crs, setCrs] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(
    "Επίλεξε οποιοδήποτε map/CAD/GIS/BIM/document format. Το original θα μείνει private και immutable.",
  );
  const [classification, setClassification] =
    useState<Classification | null>(null);
  const [result, setResult] = useState<CompleteResponse | null>(null);

  const fileInfo = useMemo(
    () =>
      file
        ? file.name + " · " + bytesLabel(file.size) + " · " + (file.type || "unknown MIME")
        : "Κανένα αρχείο",
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
      setMessage("Το αρχείο είναι κενό.");
      return;
    }

    if (next.size > PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES) {
      setPhase("blocked");
      setMessage(
        "Το σημερινό verified private ceiling είναι " +
          bytesLabel(PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES) +
          ". Το αρχείο δεν στάλθηκε.",
      );
      return;
    }

    setPhase("ready");
    setMessage(
      "Έτοιμο για private resumable upload. Δεν εφαρμόζεται format filter — άγνωστα/future formats διατηρούνται αυτούσια.",
    );
  }

  async function startUpload() {
    if (!file || phase !== "ready") return;

    setPhase("authorizing");
    setProgress(0);
    setMessage("Έλεγχος Water access + πραγματική ταξινόμηση format…");

    try {
      const firstBytesBase64 = await sampleBase64(file);
      const authorizationResponse = await fetch(
        "/api/professional/infrastructure/water/maps/intake/authorize",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: accessHeaders(),
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
            firstBytesBase64,
            coordinateReferenceSystem: crs.trim() || null,
          }),
        },
      );

      const authorization =
        (await authorizationResponse.json()) as AuthorizeResponse;

      if (
        !authorizationResponse.ok ||
        !authorization.ok ||
        !authorization.requestId ||
        !authorization.upload
      ) {
        throw new Error(
          authorization.error || "water_map_upload_authorization_failed",
        );
      }

      setClassification(authorization.classification || null);

      const upload = authorization.upload;
      if (
        !upload.bucket ||
        !upload.path ||
        !upload.token ||
        !upload.tusEndpoint ||
        !upload.chunkSizeBytes
      ) {
        throw new Error("water_map_upload_authorization_incomplete");
      }

      setPhase("uploading");
      setMessage(
        "Private upload σε εξέλιξη · " +
          classificationLabel(authorization.classification || null),
      );

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
            const percent =
              bytesTotal > 0
                ? Math.min(100, (bytesUploaded / bytesTotal) * 100)
                : 0;
            setProgress(Math.round(percent * 10) / 10);
          },
          onSuccess() {
            setProgress(100);
            resolve();
          },
        });

        void resumable
          .findPreviousUploads()
          .then((previous) => {
            if (previous.length > 0) {
              resumable.resumeFromPreviousUpload(previous[0]);
            }
            resumable.start();
          })
          .catch(reject);
      });

      setPhase("verifying");
      setMessage(
        "Upload complete. Το server ξαναδιαβάζει τα stored bytes, signature/size και δημιουργεί bounded processing work order…",
      );

      const completeResponse = await fetch(
        "/api/professional/infrastructure/water/maps/intake/complete",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: accessHeaders(),
          body: JSON.stringify({
            requestId: authorization.requestId,
          }),
        },
      );

      const completion =
        (await completeResponse.json()) as CompleteResponse;
      setResult(completion);
      if (completion.classification) {
        setClassification(completion.classification);
      }

      if (!completeResponse.ok || !completion.ok) {
        setPhase("blocked");
        setMessage(
          completion.truth ||
            completion.error ||
            "Το raw original μπορεί να έχει διατηρηθεί, αλλά η επαλήθευση/queue μπλοκαρίστηκε.",
        );
        return;
      }

      setPhase("done");
      setMessage(
        completion.truth ||
          "Το raw original διατηρήθηκε και καταγράφηκε στο Water intake.",
      );
    } catch (error) {
      setPhase("blocked");
      setMessage(
        error instanceof Error ? error.message : "water_map_upload_failed",
      );
    }
  }

  const busy =
    phase === "authorizing" ||
    phase === "uploading" ||
    phase === "verifying";

  const stateClass =
    phase === "blocked"
      ? "border-rose-400/40 bg-rose-950/30 text-rose-100"
      : phase === "done"
        ? "border-emerald-400/40 bg-emerald-950/20 text-emerald-100"
        : "border-white/10 bg-white/5 text-slate-200";

  return (
    <section className="rounded-3xl border border-cyan-400/25 bg-[#07111f] p-4 shadow-2xl sm:p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
          Universal Water Map Intake
        </p>
        <h1 className="text-3xl font-black text-white sm:text-5xl">
          Οποιοδήποτε format → private preservation → verified processing
        </h1>
        <p className="max-w-5xl text-sm leading-7 text-slate-300 sm:text-base">
          DWG, DXF, DGN, KML/KMZ, GeoJSON, GeoPackage, Shapefile bundles,
          GeoTIFF, GPX/GML, CSV, PDF, BIM/IFC, point-cloud, tiles, εικόνες,
          archives και άγνωστα μελλοντικά formats. Άγνωστο format δεν σημαίνει
          απόρριψη: αποθηκεύεται αυτούσιο και δημιουργείται adapter path.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-sm font-black text-cyan-100">
            Αρχείο — χωρίς format filter
          </span>
          <input
            type="file"
            disabled={busy}
            onChange={chooseFile}
            className="mt-3 block w-full text-sm text-slate-200"
          />
          <p className="mt-3 break-all text-xs text-slate-400">{fileInfo}</p>
        </label>

        <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-sm font-black text-cyan-100">
            CRS / coordinate system (αν το γνωρίζεις)
          </span>
          <input
            value={crs}
            disabled={busy}
            onChange={(event) => setCrs(event.target.value)}
            placeholder="π.χ. EPSG:4326, EPSG:3857, local grid"
            className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            Αν λείπει, δεν θα μαντέψουμε γεωαναφορά· θα μείνει explicit
            review/adapter requirement.
          </p>
        </label>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Classification truth
        </p>
        <p className="mt-2 break-words text-sm font-bold text-cyan-200">
          {classificationLabel(classification)}
        </p>
        {classification?.truth ? (
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {classification.truth}
          </p>
        ) : null}
      </div>

      {phase === "uploading" || progress > 0 ? (
        <div className="mt-5">
          <progress value={progress} max={100} className="h-4 w-full" />
          <p className="mt-2 text-sm font-black text-emerald-300">
            {progress.toFixed(1)}%
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={phase !== "ready"}
          onClick={() => void startUpload()}
          className="rounded-2xl bg-cyan-300 px-6 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Processing…" : "Upload → verify → queue"}
        </button>
        <a
          href="/professional/infrastructure/water/live"
          className="rounded-2xl border border-emerald-500/60 px-6 py-3 font-black text-emerald-100"
        >
          Live Network / Βρες με
        </a>
        <a
          href="/professional/infrastructure/water"
          className="rounded-2xl border border-white/20 px-6 py-3 font-black text-white"
        >
          Water Control Center
        </a>
      </div>

      <div className={"mt-5 rounded-2xl border p-4 text-sm leading-7 " + stateClass}>
        {message}
      </div>

      {result ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-black text-cyan-200">Stored-byte verification</h2>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">
              {JSON.stringify(result.verification || {}, null, 2)}
            </pre>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-black text-cyan-200">Processing truth</h2>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">
              {JSON.stringify(
                {
                  status: result.status,
                  ingestState: result.ingestState,
                  reviewState: result.reviewState,
                  execution: result.execution,
                },
                null,
                2,
              )}
            </pre>
          </article>
        </div>
      ) : null}
    </section>
  );
}
