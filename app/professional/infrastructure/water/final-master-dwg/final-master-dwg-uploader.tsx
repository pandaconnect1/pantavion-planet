"use client";

import { useMemo, useState } from "react";

type UploadUrlResponse = {
  ok?: boolean;
  signedUrl?: string;
  token?: string;
  path?: string;
  fileName?: string;
  expectedSizeBytes?: number;
  expectedSha256?: string;
  status?: string;
  message?: string;
};

type Props = {
  expectedFileName: string;
  expectedSizeBytes: number;
  expectedSha256: string;
};

export default function FinalMasterDwgUploader({
  expectedFileName,
  expectedSizeBytes,
  expectedSha256,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "ready" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("Select the exact original DWG master file.");

  const expectedSizeMB = useMemo(
    () => Math.round((expectedSizeBytes / 1024 / 1024) * 100) / 100,
    [expectedSizeBytes],
  );

  function chooseFile(nextFile: File | null) {
    setFile(nextFile);

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
    setMessage("Exact filename and byte size match. Ready for private upload.");
  }

  async function upload() {
    if (!file || file.name !== expectedFileName || file.size !== expectedSizeBytes) {
      setState("error");
      setMessage("The selected file does not match the locked master metadata.");
      return;
    }

    setState("uploading");
    setMessage("Creating protected upload authorization…");

    try {
      const authResponse = await fetch(
        "/api/professional/infrastructure/water/final-master-dwg/upload-url",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );

      const authBody = (await authResponse.json()) as UploadUrlResponse;

      if (!authResponse.ok || !authBody.ok || !authBody.signedUrl) {
        throw new Error(authBody.message || authBody.status || "Unable to create upload authorization.");
      }

      setMessage("Uploading directly into the private Pantavion storage vault… Keep this page open.");

      const form = new FormData();
      form.append("cacheControl", "0");
      form.append("", file);

      const uploadResponse = await fetch(authBody.signedUrl, {
        method: "PUT",
        headers: {
          "x-upsert": "true",
        },
        body: form,
      });

      if (!uploadResponse.ok) {
        const detail = await uploadResponse.text().catch(() => "");
        throw new Error(`Storage upload failed (${uploadResponse.status}). ${detail}`.trim());
      }

      setState("done");
      setMessage("Private upload completed. The protected download endpoint can now serve the original DWG.");
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
        Upload exact DWG to private vault
      </button>
    </section>
  );
}
