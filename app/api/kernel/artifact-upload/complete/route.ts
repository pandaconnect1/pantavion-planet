import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  createPantavionArtifactIntakeRecord,
  createPantavionArtifactWorkOrderCandidate,
  type PantavionArtifactFamily,
} from "@/core/intake/pantavion-universal-artifact-intake";
import type { PantavionConversationDomain } from "@/core/intake/pantavion-conversation-intake";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import { persistPantavionFounderWorkOrder } from "@/core/kernel/pantavion-work-order-runtime";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "personal-media";
const HEADER_SAMPLE_BYTES = 2_048;
const FULL_HASH_LIMIT_BYTES = 16 * 1024 * 1024;
const CURRENT_BUCKET_LIMIT_BYTES = 1_073_741_824;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;

const DOMAINS = [
  "personal_ai",
  "translation",
  "people",
  "chat",
  "social",
  "voice",
  "learning",
  "marketplace",
  "sos",
  "safety",
  "security",
  "kernel",
  "recovery",
  "water",
  "governance",
  "billing",
  "experience",
  "general",
] as const satisfies readonly PantavionConversationDomain[];

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

function stringList(value: unknown, max: number): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > max) return undefined;
  if (!value.every((item) => typeof item === "string")) return undefined;
  return value.map((item) => item.trim()).filter(Boolean);
}

function parseTotalBytes(contentRange: string | null, contentLength: string | null): number | null {
  if (contentRange) {
    const match = /\/([0-9]+)$/.exec(contentRange.trim());
    if (match) {
      const value = Number.parseInt(match[1], 10);
      if (Number.isSafeInteger(value)) return value;
    }
  }
  if (contentLength) {
    const value = Number.parseInt(contentLength, 10);
    if (Number.isSafeInteger(value)) return value;
  }
  return null;
}

async function signedReadUrl(path: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error || !data?.signedUrl) throw new Error("artifact_signed_read_failed");
  return data.signedUrl;
}

async function inspectStoredHeader(path: string, expectedSize: number) {
  const url = await signedReadUrl(path);
  const response = await fetch(url, {
    headers: { Range: `bytes=0-${HEADER_SAMPLE_BYTES - 1}` },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("artifact_storage_read_failed");

  const contentLength = response.headers.get("content-length");
  const contentRange = response.headers.get("content-range");
  const totalBytes = parseTotalBytes(contentRange, contentLength);

  if (response.status !== 206 && expectedSize > HEADER_SAMPLE_BYTES) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error("artifact_storage_range_not_supported");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > HEADER_SAMPLE_BYTES && expectedSize > HEADER_SAMPLE_BYTES) {
    throw new Error("artifact_storage_range_overflow");
  }

  return {
    totalBytes,
    sample: buffer,
    contentType: response.headers.get("content-type"),
    rangeStatus: response.status,
  };
}

async function computeStoredSha256(path: string, expectedSize: number): Promise<string> {
  if (expectedSize > FULL_HASH_LIMIT_BYTES) throw new Error("artifact_full_hash_worker_required");

  const url = await signedReadUrl(path);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("artifact_storage_full_read_failed");

  const lengthHeader = response.headers.get("content-length");
  if (lengthHeader) {
    const length = Number.parseInt(lengthHeader, 10);
    if (Number.isSafeInteger(length) && length !== expectedSize) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error("artifact_stored_size_mismatch");
    }
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength !== expectedSize) throw new Error("artifact_stored_size_mismatch");
  return createHash("sha256").update(bytes).digest("hex");
}

function mediaKindFor(family: PantavionArtifactFamily): "photo" | "video" | "audio" | "document" | "other" {
  if (family === "image") return "photo";
  if (family === "video") return "video";
  if (family === "audio") return "audio";
  if (
    family === "text" ||
    family === "document" ||
    family === "spreadsheet" ||
    family === "presentation" ||
    family === "structured_data" ||
    family === "email"
  ) {
    return "document";
  }
  return "other";
}

async function preserveLibraryRecord(input: {
  ownerId: string;
  path: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  family: PantavionArtifactFamily;
  caption: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("personal_media").upsert(
    {
      owner_id: input.ownerId,
      storage_path: input.path,
      original_name: input.fileName,
      mime_type: input.mimeType || "application/octet-stream",
      media_kind: mediaKindFor(input.family),
      size_bytes: input.sizeBytes,
      visibility: "private",
      caption: input.caption.slice(0, 2000),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,storage_path" },
  );
  if (error) throw new Error("artifact_library_record_failed");
}

function safeError(error: unknown): string {
  const marker = error instanceof Error ? error.message : "artifact_upload_completion_failed";
  const allowed = new Set([
    "artifact_payload_invalid",
    "artifact_upload_id_invalid",
    "artifact_storage_path_invalid",
    "artifact_expected_size_invalid",
    "artifact_declared_sha256_invalid",
    "artifact_domains_invalid",
    "artifact_domain_unknown",
    "artifact_founder_identity_unavailable",
    "artifact_signed_read_failed",
    "artifact_storage_read_failed",
    "artifact_storage_range_not_supported",
    "artifact_storage_range_overflow",
    "artifact_storage_full_read_failed",
    "artifact_stored_size_mismatch",
    "artifact_library_record_failed",
    "durable_execution_runtime_unavailable",
  ]);
  return allowed.has(marker) ? marker : "artifact_upload_completion_failed";
}

export async function POST(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("artifact_payload_invalid");
    }

    const input = body as Record<string, unknown>;
    const uploadId = typeof input.uploadId === "string" ? input.uploadId.trim() : "";
    const path = typeof input.path === "string" ? input.path.trim() : "";
    const fileName = typeof input.fileName === "string" ? input.fileName.trim() : "";
    const expectedSizeBytes = typeof input.expectedSizeBytes === "number" ? input.expectedSizeBytes : Number.NaN;
    const mimeType = typeof input.mimeType === "string" ? input.mimeType.trim() : "application/octet-stream";
    const declaredSha256 = typeof input.declaredSha256 === "string" && input.declaredSha256.trim()
      ? input.declaredSha256.trim().toLowerCase()
      : null;
    const domains = stringList(input.domains, 18);

    if (!UUID_PATTERN.test(uploadId)) throw new Error("artifact_upload_id_invalid");
    if (!fileName) throw new Error("artifact_payload_invalid");
    if (
      !Number.isSafeInteger(expectedSizeBytes) ||
      expectedSizeBytes <= 0 ||
      expectedSizeBytes > CURRENT_BUCKET_LIMIT_BYTES
    ) {
      throw new Error("artifact_expected_size_invalid");
    }
    if (declaredSha256 && !SHA256_PATTERN.test(declaredSha256)) {
      throw new Error("artifact_declared_sha256_invalid");
    }
    if (input.domains !== undefined && !domains) throw new Error("artifact_domains_invalid");
    if (domains && !domains.every((domain) => DOMAINS.includes(domain as PantavionConversationDomain))) {
      throw new Error("artifact_domain_unknown");
    }

    const ownerId = founderId();
    const allowedVaultPrefix = `${ownerId}/artifact-vault/${uploadId}-`;
    const allowedQuarantinePrefix = `${ownerId}/artifact-quarantine/${uploadId}-`;
    if (!path.startsWith(allowedVaultPrefix) && !path.startsWith(allowedQuarantinePrefix)) {
      throw new Error("artifact_storage_path_invalid");
    }

    const inspected = await inspectStoredHeader(path, expectedSizeBytes);
    if (inspected.totalBytes !== null && inspected.totalBytes !== expectedSizeBytes) {
      await preserveLibraryRecord({
        ownerId,
        path,
        fileName,
        mimeType,
        sizeBytes: inspected.totalBytes,
        family: "unknown",
        caption: `Pantavion artifact upload ${uploadId}: preserved but blocked because stored byte size does not match the authorized size.`,
      });
      return noStore(
        NextResponse.json(
          {
            ok: false,
            status: "artifact_preserved_blocked",
            reason: "artifact_stored_size_mismatch",
            expectedSizeBytes,
            observedSizeBytes: inspected.totalBytes,
            storage: { bucket: BUCKET, path, preserved: true, deleted: false },
          },
          { status: 409 },
        ),
      );
    }

    let computedSha256: string | null = null;
    let fullHashVerification: "verified" | "worker_required" = "worker_required";
    if (expectedSizeBytes <= FULL_HASH_LIMIT_BYTES) {
      computedSha256 = await computeStoredSha256(path, expectedSizeBytes);
      fullHashVerification = "verified";
    }

    const artifact = createPantavionArtifactIntakeRecord({
      sourceKind: "storage_reference",
      sourceId: `upload:${uploadId}`,
      fileName,
      sizeBytes: expectedSizeBytes,
      mimeType: inspected.contentType || mimeType,
      sha256: computedSha256,
      firstBytesBase64: inspected.sample.toString("base64"),
      storageReference: `${BUCKET}:${path}`,
      domains: (domains ?? ["general"]) as PantavionConversationDomain[],
      notes: [
        `server_storage_range_status:${inspected.rangeStatus}`,
        `full_hash_verification:${fullHashVerification}`,
        declaredSha256 ? "declared_sha256_received:true" : "declared_sha256_received:false",
      ],
    });

    const declaredHashMismatch = Boolean(
      declaredSha256 && computedSha256 && declaredSha256 !== computedSha256,
    );
    const pathIsQuarantine = path.startsWith(allowedQuarantinePrefix);
    const serverEscalatedToQuarantine = artifact.security.quarantineRequired && !pathIsQuarantine;

    const caption = [
      `Pantavion artifact ${artifact.intakeId}`,
      `format=${artifact.detection.formatId}`,
      `support=${artifact.detection.supportState}`,
      `risk=${artifact.detection.risk}`,
      `hash=${fullHashVerification}`,
      declaredHashMismatch ? "declared_hash_mismatch=true" : null,
      serverEscalatedToQuarantine ? "server_quarantine_escalation=true" : null,
    ]
      .filter(Boolean)
      .join(" · ");

    await preserveLibraryRecord({
      ownerId,
      path,
      fileName,
      mimeType: inspected.contentType || mimeType,
      sizeBytes: expectedSizeBytes,
      family: artifact.detection.family,
      caption,
    });

    if (declaredHashMismatch || serverEscalatedToQuarantine) {
      return noStore(
        NextResponse.json(
          {
            ok: false,
            status: "artifact_preserved_blocked",
            reason: declaredHashMismatch
              ? "artifact_declared_hash_mismatch"
              : "artifact_server_quarantine_escalation",
            artifact,
            verification: {
              fullHashVerification,
              computedSha256,
              declaredSha256,
              sizeVerified: true,
              headerObservedFromStoredBytes: true,
            },
            storage: { bucket: BUCKET, path, preserved: true, deleted: false, private: true },
            truth:
              "The original bytes remain privately preserved, but no execution/work-order promotion occurs after a hash mismatch or server-side risk escalation.",
          },
          { status: 409 },
        ),
      );
    }

    const workOrderCandidate = createPantavionArtifactWorkOrderCandidate(artifact);
    const persisted = await persistPantavionFounderWorkOrder(workOrderCandidate.submission);

    return noStore(
      NextResponse.json({
        ok: true,
        status: "artifact_stored_verified_and_queued",
        artifact,
        verification: {
          sizeVerified: true,
          headerObservedFromStoredBytes: true,
          fullHashVerification,
          computedSha256,
          declaredSha256,
          declaredSha256Matched:
            declaredSha256 && computedSha256 ? declaredSha256 === computedSha256 : null,
          largeFileHashWorkerRequired: fullHashVerification === "worker_required",
        },
        storage: {
          bucket: BUCKET,
          path,
          private: true,
          preserved: true,
          deleted: false,
        },
        execution: {
          executionId: persisted.execution.executionId,
          executionStatus: persisted.execution.status,
          workOrderId: persisted.workOrder.id,
          deduplicated: persisted.deduplicated,
        },
        truth:
          fullHashVerification === "verified"
            ? "The stored object size, real stored header bytes and complete SHA-256 were server-verified before work-order promotion. This still does not mean parsed, deployed or VERIFIED_LIVE."
            : "The stored object size and real stored header bytes were server-verified. Full SHA-256 remains a bounded worker task for this large artifact; the work order must not claim full hash verification until that completes.",
      }),
    );
  } catch (error) {
    const reason = safeError(error);
    return noStore(
      NextResponse.json(
        { ok: false, status: "blocked", reason },
        { status: reason === "durable_execution_runtime_unavailable" ? 503 : 400 },
      ),
    );
  }
}
