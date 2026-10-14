"use client";

import * as tus from "tus-js-client";

const ENDPOINT = "https://cxhulvwkagzufbjsdwwu.storage.supabase.co/storage/v1/upload/resumable";
export const PIECE_BYTES = 32 * 1024 * 1024;
export const MAX_FILE_BYTES = 512 * 1024 * 1024;

export type IntakeResult = {
  ok?: boolean;
  error?: string;
  requestId?: string;
  targetMap?: "B" | "C";
  fileName?: string;
  fileSize?: number;
  header?: string;
  chunks?: Array<{ index: number; present: boolean; sizeMatches: boolean; expectedBytes: number }>;
  expectedChunkSha256?: string[];
  bucket?: string;
  path?: string;
  token?: string;
  expectedChunkSizeBytes?: number;
  sha256?: string;
  sizeBytes?: number;
  reviewState?: string;
  verified?: boolean;
  totalChunks?: number;
};

const API = "/api/professional/infrastructure/water/authentic-source-vault/owner-selected";
export async function intake(action: string, args: Record<string, unknown> = {}): Promise<IntakeResult> {
  const response = await fetch(API, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...args }),
  });
  const body = await response.json().catch(() => ({})) as IntakeResult;
  if (!response.ok || !body.ok) throw new Error(body.error || `water_intake_http_${response.status}`);
  return body;
}

const HEADERS = new Set(["AC1009", "AC1012", "AC1014", "AC1015", "AC1018", "AC1021", "AC1024", "AC1027", "AC1032"]);
export async function readDwgHeader(file: File): Promise<string> {
  if (!/\.dwg$/i.test(file.name) || file.size < 6 || file.size > MAX_FILE_BYTES)
    throw new Error("Επίλεξε έγκυρο DWG έως 512 MiB.");
  const header = new TextDecoder("ascii").decode(await file.slice(0, 6).arrayBuffer());
  if (!HEADERS.has(header)) throw new Error("Μη υποστηριζόμενη επικεφαλίδα DWG.");
  return header;
}

export async function hashDwgPieces(file: File, onProgress: (done: number, total: number) => void) {
  if (!globalThis.crypto?.subtle) throw new Error("Απαιτείται ασφαλής HTTPS σύνδεση.");
  const total = Math.ceil(file.size / PIECE_BYTES);
  const hashes: string[] = [];
  for (let index = 0; index < total; index++) {
    const blob = file.slice(index * PIECE_BYTES, Math.min((index + 1) * PIECE_BYTES, file.size));
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    hashes.push(Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join(""));
    onProgress(index + 1, total);
  }
  return hashes;
}

export async function uploadSignedDwgPiece(
  blob: Blob, requestId: string, index: number, signed: IntakeResult,
  onProgress: (bytes: number) => void,
) {
  if (!signed.bucket || !signed.path || !signed.token) throw new Error("water_signed_piece_incomplete");
  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(blob, {
      endpoint: ENDPOINT,
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      fingerprint: async () => `pantavion-owner-dwg-${requestId}-${index}`,
      headers: { "x-signature": signed.token!, "x-upsert": "false" },
      metadata: {
        bucketName: signed.bucket!,
        objectName: signed.path!,
        contentType: "application/octet-stream",
        cacheControl: "0",
      },
      onProgress: sent => onProgress(sent),
      onError: reject,
      onSuccess: () => resolve(),
    });
    void upload.findPreviousUploads().then(previous => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    }).catch(reject);
  });
}
