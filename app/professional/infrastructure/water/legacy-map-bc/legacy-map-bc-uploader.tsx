"use client";

import { useState } from "react";
import * as tus from "tus-js-client";

type UploadUrlResponse = {
  ok?: boolean;
  status?: string;
  bucket?: string;
  path?: string;
  token?: string;
  message?: string;
};

const SUPABASE_PROJECT_ID = "cxhulvwkagzufbjsdwwu";
const TUS_ENDPOINT = `https://${SUPABASE_PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable`;
const TUS_CHUNK_SIZE = 6 * 1024 * 1024;

export default function LegacyMapBcUploader({
  expectedFileName,
  expectedSizeBytes,
}: {
  expectedFileName: string;
  expectedSizeBytes: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "ready" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("Select the verified legacy B/C DWG.");
  const [progress, setProgress] = useState(0);

  function chooseFile(nextFile: File | null) {
    setFile(nextFile);
    setProgress(0);
    if (!nextFile) {
      setState("idle");
      setMessage("Select the verified legacy B/C DWG.");
      return;
    }
    if (nextFile.name !== expectedFileName) {
      setState("error");
      setMessage(`Wrong filename. Expected exactly: ${expectedFileName}`);
      return;
    }
    if (nextFile.size !== expectedSizeBytes) {
      setState("error");
      setMessage(`Wrong file size. Expected exactly ${expectedSizeBytes} bytes.`);
      return;
    }
    setState("ready");
    setMessage("Filename and exact byte size match the verified legacy B/C source.");
  }

  async function upload() {
    if (!file || file.name !== expectedFileName || file.size !== expectedSizeBytes) return;
    setState("uploading");
    setProgress(0);
    setMessage("Creating protected upload authorization…");

    try {
      const authResponse = await fetch("/api/professional/infrastructure/water/legacy-map-bc/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const authBody = (await authResponse.json()) as UploadUrlResponse;
      if (!authResponse.ok || !authBody.ok) {
        throw new Error(authBody.message || authBody.status || "Upload authorization failed.");
      }
      if (authBody.status === "already_present") {
        setProgress(100);
        setState("done");
        setMessage("The verified legacy B/C master is already present in private storage.");
        return;
      }
      if (!authBody.bucket || !authBody.path || !authBody.token) {
        throw new Error("Upload authorization is incomplete.");
      }

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
          onError: reject,
          onProgress(bytesUploaded, bytesTotal) {
            const pct = bytesTotal > 0 ? Math.min(100, (bytesUploaded / bytesTotal) * 100) : 0;
            const rounded = Math.round(pct * 10) / 10;
            setProgress(rounded);
            setMessage(`Uploading verified legacy B/C master… ${rounded.toFixed(1)}%`);
          },
          onSuccess() {
            setProgress(100);
            resolve();
          },
        });

        void resumable.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length > 0) resumable.resumeFromPreviousUpload(previousUploads[0]);
          resumable.start();
        }).catch(reject);
      });

      setState("done");
      setMessage("Upload completed. Legacy B/C is preserved separately from canonical Map B.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  return (
    <section style={{ marginTop: 24, padding: 18, borderRadius: 16, border: "1px solid rgba(94,234,212,0.35)", background: "rgba(13,148,136,0.08)" }}>
      <input
        type="file"
        accept=".dwg,image/vnd.dwg,application/acad"
        disabled={state === "uploading"}
        onChange={(event) => chooseFile(event.target.files?.[0] || null)}
      />
      {state === "uploading" || progress > 0 ? (
        <div style={{ marginTop: 14 }}>
          <progress value={progress} max={100} style={{ width: "100%", height: 16 }} />
          <div style={{ marginTop: 4, fontWeight: 800 }}>{progress.toFixed(1)}%</div>
        </div>
      ) : null}
      <p>{message}</p>
      <button
        type="button"
        onClick={upload}
        disabled={state !== "ready"}
        style={{ padding: "12px 18px", borderRadius: 12, border: 0, fontWeight: 900 }}
      >
        Upload legacy B/C separately
      </button>
    </section>
  );
}
