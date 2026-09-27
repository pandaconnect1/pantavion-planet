"use client";

import { useMemo, useState } from "react";
import * as tus from "tus-js-client";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";

type UploadUrlResponse = {
  ok?: boolean;
  status?: string;
  bucket?: string;
  path?: string;
  signedUrl?: string;
  token?: string;
  expectedSizeBytes?: number;
  expectedSha256?: string;
  message?: string;
};

type Props = {
  expectedFileName: string;
  expectedSizeBytes: number;
  expectedSha256: string;
};

const SUPABASE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co";
const SUPABASE_PROJECT_ID = "cxhulvwkagzufbjsdwwu";
const MAP_B_OWNER_FUNCTION = `${SUPABASE_URL}/functions/v1/pantavion-map-b-owner-dwg`;
const TUS_ENDPOINT = `https://${SUPABASE_PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable`;
const TUS_CHUNK_SIZE = 6 * 1024 * 1024;

async function callMapBOwner(action: "sign" | "verify") {
  const supabase = createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("FOUNDER_SESSION_REQUIRED");
  }

  const { publishableKey } = getSupabasePublicConfig();

  const response = await fetch(MAP_B_OWNER_FUNCTION, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action }),
  });

  const body = (await response.json().catch(() => ({}))) as UploadUrlResponse & {
    error?: string;
    quarantined?: boolean;
  };

  if (!response.ok || !body.ok) {
    const suffix = body.quarantined ? "_QUARANTINED" : "";
    throw new Error(body.error || body.message || body.status || `MAP_B_OWNER_${response.status}${suffix}`);
  }

  return body;
}

export default function FinalMasterDwgUploader({
  expectedFileName,
  expectedSizeBytes,
  expectedSha256,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "ready" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("Select the exact original DWG master file.");
  const [progress, setProgress] = useState(0);

  const expectedSizeMB = useMemo(
    () => Math.round((expectedSizeBytes / 1024 / 1024) * 100) / 100,
    [expectedSizeBytes],
  );

  function chooseFile(nextFile: File | null) {
    setFile(nextFile);
    setProgress(0);

    if (!nextFile) {
      setState("idle");
      setMessage("Select the exact original DWG master file.");
      return;
    }

    if (nextFile.name !== expectedFileName) {
      setState("error");
      setMessage(`Wrong file name. Expected: ${expectedFileName}`);
      return;
    }

    if (nextFile.size !== expectedSizeBytes) {
      setState("error");
      setMessage(`Wrong file size. Expected exactly ${expectedSizeBytes} bytes.`);
      return;
    }

    setState("ready");
    setMessage("Exact filename and byte size match. Ready for resumable private upload.");
  }

  async function upload() {
    if (!file || file.name !== expectedFileName || file.size !== expectedSizeBytes) {
      setState("error");
      setMessage("The selected file does not match the locked master metadata.");
      return;
    }

    setState("uploading");
    setProgress(0);
    setMessage("Creating one-time private upload authorization…");

    try {
      const authBody = await callMapBOwner("sign");

      if (authBody.status === "already_present") {
        setMessage("Map B object already exists. Verifying exact binary identity…");
        await callMapBOwner("verify");
        setProgress(100);
        setState("done");
        setMessage("Existing Map B binary verified and registered.");
        return;
      }

      if (!authBody.bucket || !authBody.path || !authBody.token) {
        throw new Error("Upload authorization is incomplete.");
      }

      setMessage("Starting resumable upload in 6 MB chunks. Keep this page open; temporary network drops will retry automatically.");

      await new Promise<void>((resolve, reject) => {
        const resumable = new tus.Upload(file, {
          endpoint: TUS_ENDPOINT,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: TUS_CHUNK_SIZE,
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          headers: {
            "x-signature": authBody.token as string,
            "x-upsert": "false",
          },
          metadata: {
            bucketName: authBody.bucket as string,
            objectName: authBody.path as string,
            contentType: "application/acad",
            cacheControl: "0",
          },
          onError(error) {
            reject(error);
          },
          onProgress(bytesUploaded, bytesTotal) {
            const percentage = bytesTotal > 0 ? Math.min(100, (bytesUploaded / bytesTotal) * 100) : 0;
            const rounded = Math.round(percentage * 10) / 10;
            setProgress(rounded);
            setMessage(`Uploading exact DWG… ${rounded.toFixed(1)}% · resumable 6 MB chunks`);
          },
          onSuccess() {
            setProgress(100);
            resolve();
          },
        });

        void resumable.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length > 0) {
            resumable.resumeFromPreviousUpload(previousUploads[0]);
            setMessage("Previous partial upload found. Resuming from the last confirmed chunk…");
          }
          resumable.start();
        }).catch(reject);
      });

      setMessage("Upload complete. Performing server-side SHA-256, size and DWG-header verification…");
      await callMapBOwner("verify");

      setState("done");
      setMessage("Verified exact Map B master: private, immutable and registered.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  return (
    <section
      style={{
        marginTop: 24,
        padding: 18,
        borderRadius: 16,
        border: "1px solid rgba(94,234,212,0.35)",
        background: "rgba(13,148,136,0.08)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 22 }}>Private master upload</h2>
      <p style={{ color: "#d7d7d7", lineHeight: 1.6 }}>
        Expected: {expectedFileName} · {expectedSizeMB} MB. Locked SHA-256: {expectedSha256}
      </p>

      <input
        type="file"
        accept=".dwg,image/vnd.dwg,application/acad"
        disabled={state === "uploading"}
        onChange={(event) => chooseFile(event.target.files?.[0] || null)}
        style={{ display: "block", marginTop: 14, maxWidth: "100%" }}
      />

      {state === "uploading" || progress > 0 ? (
        <div style={{ marginTop: 14 }}>
          <progress value={progress} max={100} style={{ width: "100%", height: 16 }} />
          <div style={{ marginTop: 4, color: "#a7f3d0", fontWeight: 800 }}>{progress.toFixed(1)}%</div>
        </div>
      ) : null}

      <p style={{ color: state === "error" ? "#fecaca" : state === "done" ? "#a7f3d0" : "#d7d7d7" }}>
        {message}
      </p>

      <button
        type="button"
        onClick={upload}
        disabled={state !== "ready"}
        style={{
          marginTop: 6,
          padding: "12px 18px",
          borderRadius: 12,
          border: 0,
          background: state === "ready" ? "#5eead4" : "#334155",
          color: state === "ready" ? "#042f2e" : "#94a3b8",
          fontWeight: 900,
          cursor: state === "ready" ? "pointer" : "not-allowed",
        }}
      >
        Upload exact DWG with resume
      </button>
    </section>
  );
}
