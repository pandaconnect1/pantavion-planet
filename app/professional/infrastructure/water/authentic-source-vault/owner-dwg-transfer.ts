"use client";

// Each 32 MiB piece is a separate private object. Upload it with Supabase's
// official signed-object PUT endpoint, not TUS: the latter rejected a valid
// signed token with "Invalid Compact JWS" before creating a TUS session.
const SUPABASE_SIGNED_OBJECT_ROOT =
  "https://cxhulvwkagzufbjsdwwu.supabase.co/storage/v1/object/upload/sign";
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

/**
 * PUT one independently signed private object, following Supabase's
 * uploadToSignedUrl wire format: multipart form-data, cacheControl field,
 * PUT /storage/v1/object/upload/sign/<bucket>/<path>?token=<signed token>.
 *
 * No privileged server credentials, new storage policy, browser bearer token,
 * canonical-map mutation, or raw master disclosure is involved.
 */
export async function uploadSignedDwgPiece(
  blob: Blob, requestId: string, index: number, signed: IntakeResult,
  onProgress: (bytes: number) => void,
): Promise<void> {
  const chunkName = String(index).padStart(3, "0") + ".part";
  const expectedPathSuffix = `/${requestId}/chunks/${chunkName}`;
  if (
    !signed.bucket || signed.bucket !== "personal-media" ||
    !signed.path ||
    !signed.path.startsWith("water-network-private/owner-intake/map-") ||
    !signed.path.endsWith(expectedPathSuffix) ||
    !signed.token ||
    signed.expectedChunkSizeBytes !== blob.size
  ) {
    throw new Error("water_signed_piece_authorization_mismatch");
  }

  const target = new URL(
    `${SUPABASE_SIGNED_OBJECT_ROOT}/${signed.bucket}/${signed.path}`,
  );
  target.searchParams.set("token", signed.token);

  const payload = new FormData();
  payload.append("cacheControl", "0");
  payload.append("", blob, chunkName);

  // Use XHR here to keep *real* upload-byte progress on mobile. Every 32MiB
  // piece can be retried/resumed as a whole without re-uploading prior pieces.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", target.toString());
    xhr.timeout = 10 * 60 * 1000;
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(blob.size, Math.round(blob.size * event.loaded / event.total)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(blob.size);
        resolve();
      } else {
        // Never show or log the signed URL / bearer token in diagnostic text.
        const text = xhr.responseText?.slice(0, 240) || "storage_rejected";
        reject(new Error(`water_signed_put_failed_${xhr.status}: ${text}`));
      }
    };
    xhr.onerror = () => reject(new Error("water_signed_put_network_error"));
    xhr.ontimeout = () => reject(new Error("water_signed_put_timeout"));
    xhr.onabort = () => reject(new Error("water_signed_put_aborted"));
    xhr.send(payload);
  });
}
