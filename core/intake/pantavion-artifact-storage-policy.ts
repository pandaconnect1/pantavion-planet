export const PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES = 1_610_612_736 as const; // 1.5 GiB
export const PANTAVION_ARTIFACT_SYNC_SHA256_MAX_BYTES = 16 * 1024 * 1024;
export const PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES = 2_048 as const;
export const PANTAVION_ARTIFACT_TUS_CHUNK_BYTES = 6 * 1024 * 1024;

export const PANTAVION_ARTIFACT_STORAGE_POLICY_MARKER =
  "pantavion_artifact_storage_policy_v2" as const;

export function isPantavionArtifactUploadSizeAllowed(sizeBytes: number): boolean {
  return (
    Number.isSafeInteger(sizeBytes) &&
    sizeBytes > 0 &&
    sizeBytes <= PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES
  );
}

export function requiresPantavionArtifactHashWorker(sizeBytes: number): boolean {
  return sizeBytes > PANTAVION_ARTIFACT_SYNC_SHA256_MAX_BYTES;
}
