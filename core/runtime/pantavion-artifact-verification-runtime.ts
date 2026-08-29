import "server-only";

import {
  PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES,
  PANTAVION_ARTIFACT_SYNC_SHA256_MAX_BYTES,
  isPantavionArtifactUploadSizeAllowed,
} from "@/core/intake/pantavion-artifact-storage-policy";
import type { PantavionConversationDomain } from "@/core/intake/pantavion-conversation-intake";
import {
  appendCheckpoint,
  createExecutionRecord,
  type PantavionDurableExecutionRecord,
} from "./durable-execution";
import { createSupabaseDurableExecutionStore } from "./supabase-durable-execution-store";

export const PANTAVION_ARTIFACT_HASH_VERIFICATION_TASK =
  "artifact:verify_sha256_v1" as const;
export const PANTAVION_ARTIFACT_HASH_VERIFICATION_INPUT_MARKER =
  "pantavion_artifact_hash_verification_input_v1" as const;
export const PANTAVION_ARTIFACT_HASH_VERIFICATION_OUTPUT_MARKER =
  "pantavion_artifact_hash_verification_output_v1" as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;
const SAFE_BUCKET = "personal-media" as const;

export interface PantavionArtifactHashVerificationInput {
  marker: typeof PANTAVION_ARTIFACT_HASH_VERIFICATION_INPUT_MARKER;
  uploadId: string;
  provisionalIntakeId: string;
  ownerId: string;
  bucket: typeof SAFE_BUCKET;
  path: string;
  fileName: string;
  expectedSizeBytes: number;
  mimeType: string;
  declaredSha256: string | null;
  firstBytesBase64: string;
  domains: PantavionConversationDomain[];
}

export interface PantavionArtifactHashVerificationOutput {
  marker: typeof PANTAVION_ARTIFACT_HASH_VERIFICATION_OUTPUT_MARKER;
  uploadId: string;
  provisionalIntakeId: string;
  verifiedIntakeId: string;
  bucket: typeof SAFE_BUCKET;
  path: string;
  fileName: string;
  expectedSizeBytes: number;
  observedSizeBytes: number;
  computedSha256: string;
  declaredSha256: string | null;
  declaredSha256Matched: boolean | null;
  artifact: unknown;
}

function cleanDomains(values: PantavionConversationDomain[]): PantavionConversationDomain[] {
  return Array.from(new Set(values)).slice(0, 18);
}

function validateInput(input: PantavionArtifactHashVerificationInput) {
  if (input.marker !== PANTAVION_ARTIFACT_HASH_VERIFICATION_INPUT_MARKER) {
    throw new Error("artifact_verification_marker_invalid");
  }
  if (!UUID_PATTERN.test(input.uploadId) || !UUID_PATTERN.test(input.ownerId)) {
    throw new Error("artifact_verification_identity_invalid");
  }
  if (input.bucket !== SAFE_BUCKET) throw new Error("artifact_verification_bucket_invalid");
  if (!isPantavionArtifactUploadSizeAllowed(input.expectedSizeBytes)) {
    throw new Error("artifact_verification_size_invalid");
  }
  if (input.expectedSizeBytes <= PANTAVION_ARTIFACT_SYNC_SHA256_MAX_BYTES) {
    throw new Error("artifact_verification_worker_not_required");
  }
  if (!input.fileName.trim() || input.fileName.length > 500) {
    throw new Error("artifact_verification_file_name_invalid");
  }
  if (!input.provisionalIntakeId.startsWith("pai_") || input.provisionalIntakeId.length > 80) {
    throw new Error("artifact_verification_intake_id_invalid");
  }
  const vaultPrefix = `${input.ownerId}/artifact-vault/${input.uploadId}-`;
  const quarantinePrefix = `${input.ownerId}/artifact-quarantine/${input.uploadId}-`;
  if (!input.path.startsWith(vaultPrefix) && !input.path.startsWith(quarantinePrefix)) {
    throw new Error("artifact_verification_storage_path_invalid");
  }
  if (input.declaredSha256 && !SHA256_PATTERN.test(input.declaredSha256)) {
    throw new Error("artifact_verification_declared_sha256_invalid");
  }
  const sample = Buffer.from(input.firstBytesBase64 || "", "base64");
  if (sample.byteLength > PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES) {
    throw new Error("artifact_verification_header_sample_invalid");
  }
}

export function requirePantavionArtifactHashVerificationInput(
  value: unknown,
): PantavionArtifactHashVerificationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("artifact_verification_input_invalid");
  }
  const input = value as PantavionArtifactHashVerificationInput;
  validateInput(input);
  return {
    ...input,
    fileName: input.fileName.trim(),
    mimeType: input.mimeType.trim() || "application/octet-stream",
    declaredSha256: input.declaredSha256?.toLowerCase() || null,
    domains: cleanDomains(input.domains),
  };
}

export async function enqueuePantavionArtifactHashVerification(
  value: Omit<PantavionArtifactHashVerificationInput, "marker">,
): Promise<{ execution: PantavionDurableExecutionRecord; deduplicated: boolean }> {
  const input = requirePantavionArtifactHashVerificationInput({
    ...value,
    marker: PANTAVION_ARTIFACT_HASH_VERIFICATION_INPUT_MARKER,
  });
  const durable = createSupabaseDurableExecutionStore();
  const idempotencyKey = `artifact-hash:${input.uploadId}:${input.expectedSizeBytes}`;
  const existing = await durable.findByIdempotencyKey(idempotencyKey);
  if (existing) {
    if (existing.taskName !== PANTAVION_ARTIFACT_HASH_VERIFICATION_TASK) {
      throw new Error("artifact_verification_idempotency_conflict");
    }
    return { execution: existing, deduplicated: true };
  }

  const executionId = `artifact_verify_${input.uploadId}`;
  let execution = createExecutionRecord(
    executionId,
    idempotencyKey,
    PANTAVION_ARTIFACT_HASH_VERIFICATION_TASK,
    input,
    3,
  );
  execution = appendCheckpoint(execution, "artifact_hash_verification_queued", {
    marker: PANTAVION_ARTIFACT_HASH_VERIFICATION_INPUT_MARKER,
    uploadId: input.uploadId,
    provisionalIntakeId: input.provisionalIntakeId,
    expectedSizeBytes: input.expectedSizeBytes,
    originalPreserved: true,
    fullHashVerified: false,
    downstreamWorkOrderAllowed: false,
  });
  await durable.put(execution);
  return { execution, deduplicated: false };
}

export function isSucceededPantavionArtifactVerification(
  execution: PantavionDurableExecutionRecord,
): execution is PantavionDurableExecutionRecord & { output: PantavionArtifactHashVerificationOutput } {
  if (
    execution.taskName !== PANTAVION_ARTIFACT_HASH_VERIFICATION_TASK ||
    execution.status !== "succeeded" ||
    !execution.output ||
    typeof execution.output !== "object" ||
    Array.isArray(execution.output)
  ) {
    return false;
  }
  const output = execution.output as Partial<PantavionArtifactHashVerificationOutput>;
  return (
    output.marker === PANTAVION_ARTIFACT_HASH_VERIFICATION_OUTPUT_MARKER &&
    typeof output.computedSha256 === "string" &&
    SHA256_PATTERN.test(output.computedSha256) &&
    typeof output.verifiedIntakeId === "string" &&
    output.verifiedIntakeId.startsWith("pai_")
  );
}
