import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  createPantavionArtifactEditingCapabilities,
  type PantavionArtifactOperationCapability,
} from "@/core/intake/pantavion-artifact-editing-capabilities";
import { PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES } from "@/core/intake/pantavion-artifact-storage-policy";
import {
  createPantavionArtifactIntakeRecord,
  type PantavionArtifactSourceKind,
} from "@/core/intake/pantavion-universal-artifact-intake";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "personal-media";
const TEXT_EXECUTION_MAX_BYTES = 16 * 1024 * 1024;
const MAX_SEARCH_QUERY = 240;
const MAX_SEARCH_MATCHES = 100;
const MAX_RETURN_TEXT_CHARS = 2_000_000;
const SIGNED_VIEW_SECONDS = 60;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TEXT_FAMILIES = new Set(["text", "structured_data", "source_code"]);
const SIGNED_VIEW_FAMILIES = new Set(["document", "image", "audio", "video"]);

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function denied() {
  return noStore(
    NextResponse.json(createPantavionKernelAccessDeniedReport(), { status: 404 }),
  );
}

function founderId(): string {
  const value = process.env.PANTAVION_FOUNDER_USER_ID?.trim();
  if (!value || !UUID_PATTERN.test(value)) throw new Error("artifact_founder_identity_unavailable");
  return value;
}

function safeStoragePath(value: unknown, ownerId: string): string {
  if (typeof value !== "string") throw new Error("artifact_execution_path_invalid");
  const path = value.trim();
  if (!path || path.includes("..") || path.includes("\\") || path.includes("\0")) {
    throw new Error("artifact_execution_path_invalid");
  }
  const prefix = `${ownerId}/artifact-vault/`;
  if (!path.startsWith(prefix)) throw new Error("artifact_execution_path_not_found");
  return path;
}

function safeFileName(value: unknown): string {
  if (typeof value !== "string") throw new Error("artifact_execution_file_name_invalid");
  const fileName = value.trim();
  if (!fileName || fileName.length > 240 || /[\\/\0\r\n]/.test(fileName)) {
    throw new Error("artifact_execution_file_name_invalid");
  }
  return fileName;
}

function safeMime(value: unknown): string {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase().slice(0, 160)
    : "application/octet-stream";
}

function safeExpectedSize(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error("artifact_execution_size_invalid");
  }
  return value;
}

function parseTotalBytes(contentRange: string | null, contentLength: string | null): number | null {
  const range = contentRange?.match(/\/([0-9]+)$/);
  if (range) return Number(range[1]);
  if (contentLength && /^[0-9]+$/.test(contentLength)) return Number(contentLength);
  return null;
}

async function createSignedReadUrl(path: string, expiresIn = SIGNED_VIEW_SECONDS) {
  const admin = createAdminClient();
  const signed = await admin.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (signed.error || !signed.data?.signedUrl) throw new Error("artifact_execution_signed_url_failed");
  return signed.data.signedUrl;
}

async function inspectStoredArtifact(path: string, expectedSizeBytes: number) {
  const signedUrl = await createSignedReadUrl(path);
  const response = await fetch(signedUrl, {
    headers: { Range: `bytes=0-${PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES - 1}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("artifact_execution_storage_read_failed");

  const totalBytes = parseTotalBytes(
    response.headers.get("content-range"),
    response.headers.get("content-length"),
  );
  const buffer = Buffer.from(await response.arrayBuffer());

  if (expectedSizeBytes > PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES && response.status !== 206) {
    throw new Error("artifact_execution_storage_range_required");
  }
  if (totalBytes !== null && totalBytes !== expectedSizeBytes) {
    throw new Error("artifact_execution_size_mismatch");
  }
  if (
    expectedSizeBytes > PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES &&
    buffer.byteLength > PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES
  ) {
    throw new Error("artifact_execution_storage_range_overflow");
  }

  return {
    firstBytesBase64: buffer.toString("base64"),
    observedBytes: buffer.byteLength,
    totalBytes,
  };
}

function classifyStoredArtifact(input: {
  path: string;
  fileName: string;
  expectedSizeBytes: number;
  mimeType: string;
  firstBytesBase64: string;
}) {
  return createPantavionArtifactIntakeRecord({
    sourceKind: "storage_reference" satisfies PantavionArtifactSourceKind,
    sourceId: `artifact-execute:${createHash("sha256").update(input.path).digest("hex").slice(0, 32)}`,
    fileName: input.fileName,
    sizeBytes: input.expectedSizeBytes,
    mimeType: input.mimeType,
    firstBytesBase64: input.firstBytesBase64,
    storageReference: input.path,
    domains: ["general"],
    notes: ["artifact_studio_executor_real_stored_bytes:true"],
  });
}

function operationCapability(
  capabilities: ReturnType<typeof createPantavionArtifactEditingCapabilities>,
  operation: string,
): PantavionArtifactOperationCapability {
  const capability = capabilities.operations.find((item) => item.operation === operation);
  if (!capability) throw new Error("artifact_execution_operation_unknown");
  return capability;
}

function requireReady(capability: PantavionArtifactOperationCapability, expectedAdapter: string) {
  if (capability.state !== "READY" || capability.adapter !== expectedAdapter) {
    throw new Error("artifact_execution_operation_not_ready");
  }
}

function decodeUtf8Text(buffer: Buffer): string {
  if (buffer.includes(0)) throw new Error("artifact_execution_binary_text_rejected");
  const text = buffer.toString("utf8");
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  if (replacementCount > Math.max(8, Math.floor(text.length * 0.005))) {
    throw new Error("artifact_execution_text_decode_failed");
  }
  return text;
}

async function readStoredText(path: string, expectedSizeBytes: number): Promise<Buffer> {
  if (expectedSizeBytes > TEXT_EXECUTION_MAX_BYTES) {
    throw new Error("artifact_execution_text_worker_required");
  }
  const signedUrl = await createSignedReadUrl(path);
  const response = await fetch(signedUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("artifact_execution_storage_read_failed");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength !== expectedSizeBytes) throw new Error("artifact_execution_size_mismatch");
  if (buffer.byteLength > TEXT_EXECUTION_MAX_BYTES) throw new Error("artifact_execution_text_worker_required");
  return buffer;
}

function boundedLiteralSearch(text: string, query: string) {
  const needle = query.toLocaleLowerCase();
  const matches: Array<{ line: number; start: number; snippet: string }> = [];
  const lines = text.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length && matches.length < MAX_SEARCH_MATCHES; lineIndex++) {
    const line = lines[lineIndex];
    const lower = line.toLocaleLowerCase();
    let cursor = 0;
    while (matches.length < MAX_SEARCH_MATCHES) {
      const found = lower.indexOf(needle, cursor);
      if (found < 0) break;
      matches.push({
        line: lineIndex + 1,
        start: found,
        snippet: line.slice(Math.max(0, found - 120), Math.min(line.length, found + query.length + 120)),
      });
      cursor = found + Math.max(1, needle.length);
    }
  }
  return matches;
}

function safeError(error: unknown) {
  const marker = error instanceof Error ? error.message : "artifact_execution_failed";
  const allowed = new Set([
    "artifact_founder_identity_unavailable",
    "artifact_execution_payload_invalid",
    "artifact_execution_operation_unknown",
    "artifact_execution_operation_not_ready",
    "artifact_execution_path_invalid",
    "artifact_execution_path_not_found",
    "artifact_execution_file_name_invalid",
    "artifact_execution_size_invalid",
    "artifact_execution_signed_url_failed",
    "artifact_execution_storage_read_failed",
    "artifact_execution_storage_range_required",
    "artifact_execution_storage_range_overflow",
    "artifact_execution_size_mismatch",
    "artifact_execution_family_not_allowed",
    "artifact_execution_text_worker_required",
    "artifact_execution_binary_text_rejected",
    "artifact_execution_text_decode_failed",
    "artifact_execution_search_query_invalid",
  ]);
  return allowed.has(marker) ? marker : "artifact_execution_failed";
}

export async function POST(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("artifact_execution_payload_invalid");
    }
    const input = body as Record<string, unknown>;
    const operation = typeof input.operation === "string" ? input.operation.trim() : "";
    if (!operation) throw new Error("artifact_execution_operation_unknown");

    const ownerId = founderId();
    const path = safeStoragePath(input.path, ownerId);
    const fileName = safeFileName(input.fileName);
    const expectedSizeBytes = safeExpectedSize(input.expectedSizeBytes);
    const mimeType = safeMime(input.mimeType);

    const inspected = await inspectStoredArtifact(path, expectedSizeBytes);
    const artifact = classifyStoredArtifact({
      path,
      fileName,
      expectedSizeBytes,
      mimeType,
      firstBytesBase64: inspected.firstBytesBase64,
    });
    const capabilities = createPantavionArtifactEditingCapabilities(artifact.detection);

    if (operation === "signed_view") {
      if (!SIGNED_VIEW_FAMILIES.has(artifact.detection.family)) {
        throw new Error("artifact_execution_family_not_allowed");
      }
      const capability = operationCapability(capabilities, "VIEW");
      requireReady(capability, "pantavion_artifact_executor:signed-view");
      const signedUrl = await createSignedReadUrl(path, SIGNED_VIEW_SECONDS);
      return noStore(
        NextResponse.json({
          ok: true,
          status: "artifact_signed_view_ready",
          operation,
          artifact,
          capability,
          result: { signedUrl, expiresInSeconds: SIGNED_VIEW_SECONDS },
          truth: "A short-lived founder-only signed read URL was created after re-detecting the real stored header bytes. No content was edited or executed.",
        }),
      );
    }

    if (operation === "text_read" || operation === "text_search") {
      if (!TEXT_FAMILIES.has(artifact.detection.family)) {
        throw new Error("artifact_execution_family_not_allowed");
      }
      const requestedOperation = operation === "text_read" ? "VIEW" : "SEARCH";
      const expectedAdapter = operation === "text_read"
        ? "pantavion_artifact_executor:text-read"
        : "pantavion_artifact_executor:text-search";
      const capability = operationCapability(capabilities, requestedOperation);
      requireReady(capability, expectedAdapter);

      const buffer = await readStoredText(path, expectedSizeBytes);
      const text = decodeUtf8Text(buffer);
      const sha256 = createHash("sha256").update(buffer).digest("hex");

      if (operation === "text_read") {
        return noStore(
          NextResponse.json({
            ok: true,
            status: "artifact_text_read_completed",
            operation,
            artifact,
            capability,
            verification: { sha256, bytesRead: buffer.byteLength, completeFileRead: true },
            result: {
              text: text.slice(0, MAX_RETURN_TEXT_CHARS),
              truncated: text.length > MAX_RETURN_TEXT_CHARS,
              totalCharacters: text.length,
            },
            truth: "The complete bounded stored artifact was read and SHA-256 verified before UTF-8 text was returned. The original remains unchanged.",
          }),
        );
      }

      const query = typeof input.query === "string" ? input.query.trim() : "";
      if (!query || query.length > MAX_SEARCH_QUERY) {
        throw new Error("artifact_execution_search_query_invalid");
      }
      const matches = boundedLiteralSearch(text, query);
      return noStore(
        NextResponse.json({
          ok: true,
          status: "artifact_text_search_completed",
          operation,
          artifact,
          capability,
          verification: { sha256, bytesRead: buffer.byteLength, completeFileRead: true },
          result: {
            query,
            matches,
            matchCount: matches.length,
            maxMatches: MAX_SEARCH_MATCHES,
          },
          truth: "Literal search ran only against the complete bounded stored text artifact. No code, macros, scripts or embedded instructions were executed.",
        }),
      );
    }

    throw new Error("artifact_execution_operation_unknown");
  } catch (error) {
    const reason = safeError(error);
    const status = reason === "artifact_execution_path_not_found" ? 404 : 400;
    return noStore(NextResponse.json({ ok: false, status: "blocked", reason }, { status }));
  }
}
