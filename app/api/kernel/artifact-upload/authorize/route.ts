import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createPantavionArtifactEditingCapabilities } from "@/core/intake/pantavion-artifact-editing-capabilities";
import {
  isPantavionArtifactUploadSizeAllowed,
  PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES,
  PANTAVION_ARTIFACT_TUS_CHUNK_BYTES,
  PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES,
} from "@/core/intake/pantavion-artifact-storage-policy";
import {
  createPantavionArtifactIntakeRecord,
  type PantavionArtifactSourceKind,
} from "@/core/intake/pantavion-universal-artifact-intake";
import type { PantavionConversationDomain } from "@/core/intake/pantavion-conversation-intake";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "personal-media";
const CANONICAL_SUPABASE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co";

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

function safeFileName(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .replace(/[\\/\0\r\n]+/g, "-")
    .replace(/[^\p{L}\p{N}._()\- ]+/gu, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(-180);
  return normalized || "artifact.bin";
}

function stringList(value: unknown, max: number): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > max) return undefined;
  if (!value.every((item) => typeof item === "string")) return undefined;
  return value.map((item) => item.trim()).filter(Boolean);
}

function configuredSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    CANONICAL_SUPABASE_URL
  );
}

function tusEndpointFor(url: string): string {
  const parsed = new URL(url);
  const projectRef = parsed.hostname.split(".")[0];
  if (!/^[a-z0-9-]{8,80}$/i.test(projectRef)) {
    throw new Error("artifact_supabase_project_ref_invalid");
  }
  return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
}

function founderId(): string {
  const value = process.env.PANTAVION_FOUNDER_USER_ID?.trim();
  if (!value || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new Error("artifact_founder_identity_unavailable");
  }
  return value;
}

function safeError(error: unknown): string {
  const marker = error instanceof Error ? error.message : "artifact_upload_authorize_failed";
  const allowed = new Set([
    "artifact_payload_invalid",
    "artifact_size_exceeds_current_private_bucket_limit",
    "artifact_sample_too_large",
    "artifact_sample_invalid",
    "artifact_source_id_invalid",
    "artifact_file_name_invalid",
    "artifact_size_invalid",
    "artifact_domain_unknown",
    "artifact_domains_invalid",
    "artifact_sha256_invalid",
    "artifact_supabase_project_ref_invalid",
    "artifact_founder_identity_unavailable",
    "artifact_signed_upload_failed",
  ]);
  return allowed.has(marker) ? marker : "artifact_upload_authorize_failed";
}

export async function POST(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("artifact_payload_invalid");
    }

    const input = body as Record<string, unknown>;
    const fileName = typeof input.fileName === "string" ? input.fileName.trim() : "";
    const sizeBytes = typeof input.sizeBytes === "number" ? input.sizeBytes : Number.NaN;
    const mimeType = typeof input.mimeType === "string" ? input.mimeType.trim() : "application/octet-stream";
    const firstBytesBase64 = typeof input.firstBytesBase64 === "string" ? input.firstBytesBase64 : undefined;
    const declaredSha256 = typeof input.sha256 === "string" ? input.sha256.trim() : undefined;
    const domains = stringList(input.domains, 18);

    if (!fileName || !Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
      throw new Error("artifact_payload_invalid");
    }
    if (!isPantavionArtifactUploadSizeAllowed(sizeBytes)) {
      throw new Error("artifact_size_exceeds_current_private_bucket_limit");
    }
    if (input.domains !== undefined && !domains) throw new Error("artifact_domains_invalid");
    if (domains && !domains.every((domain) => DOMAINS.includes(domain as PantavionConversationDomain))) {
      throw new Error("artifact_domain_unknown");
    }
    if (firstBytesBase64) {
      const decoded = Buffer.from(firstBytesBase64, "base64");
      if (decoded.byteLength > PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES) {
        throw new Error("artifact_sample_too_large");
      }
    }

    const ownerId = founderId();
    const uploadId = randomUUID();
    const sourceId = `upload:${uploadId}`;
    const classification = createPantavionArtifactIntakeRecord({
      sourceKind: "device_upload" satisfies PantavionArtifactSourceKind,
      sourceId,
      fileName,
      sizeBytes,
      mimeType,
      sha256: declaredSha256,
      firstBytesBase64,
      domains: (domains ?? ["general"]) as PantavionConversationDomain[],
    });
    const capabilities = createPantavionArtifactEditingCapabilities(classification.detection);

    const area = classification.security.quarantineRequired
      ? "artifact-quarantine"
      : "artifact-vault";
    const storagePath = `${ownerId}/${area}/${uploadId}-${safeFileName(fileName)}`;

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data?.token) {
      throw new Error("artifact_signed_upload_failed");
    }

    const supabaseUrl = configuredSupabaseUrl();

    return noStore(
      NextResponse.json({
        ok: true,
        status: "artifact_upload_authorized",
        upload: {
          uploadId,
          bucket: BUCKET,
          path: data.path || storagePath,
          token: data.token,
          tusEndpoint: tusEndpointFor(supabaseUrl),
          chunkSizeBytes: PANTAVION_ARTIFACT_TUS_CHUNK_BYTES,
          expectedSizeBytes: sizeBytes,
          expectedFileName: fileName,
          mimeType: mimeType || "application/octet-stream",
          declaredSha256: declaredSha256 ?? null,
          ownerId,
        },
        classification,
        capabilities,
        truth: {
          authorizationOnly: true,
          bytesUploaded: false,
          storedObjectVerified: false,
          currentBucketLimitBytes: PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES,
          directExecutionAllowed: false,
          originalImmutable: true,
          byteChangingEditsCreateDerivatives: true,
        },
      }),
    );
  } catch (error) {
    const reason = safeError(error);
    const status = reason === "artifact_size_exceeds_current_private_bucket_limit" ? 413 : 400;
    return noStore(
      NextResponse.json({ ok: false, status: "blocked", reason }, { status }),
    );
  }
}
