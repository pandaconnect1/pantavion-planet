import { createHash } from "node:crypto";

export interface PantavionRecoverySourceBatchIndexEntry {
  ordinal: number;
  file: string;
  relativePath: string;
  fileBytes: number;
  fileSha256: string;
  recordCount: number;
  startOrdinal: number;
  endOrdinal: number;
  firstRecordId: string;
  lastRecordId: string;
  orderedRecordIdFingerprint: string;
}

export interface PantavionRecoveryPartitionSegment {
  file: string;
  fileSha256: string;
  batchStartOrdinal: number;
  batchEndOrdinal: number;
  segmentStartOrdinal: number;
  segmentEndOrdinal: number;
  startRecordIndex: number;
  endRecordIndex: number;
  recordCount: number;
}

export interface PantavionRecoverySourceBatchIndex {
  id: "pantavion_recovery_source_batch_index_v1";
  corpus: {
    recordCount: number;
    batchCount: number;
    sourceFingerprint: string;
    orderedIdFingerprint: string;
  };
  partitionPlan: {
    batchSize: number;
    partitionCount: number;
  };
  sourceMode: "committed_pinned_batches_with_sha256_verification";
  authority: {
    codeMutation: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
  };
  batches: PantavionRecoverySourceBatchIndexEntry[];
  partitions: Array<{
    ordinal: number;
    startOrdinal: number;
    endOrdinal: number;
    recordCount: number;
    segments: PantavionRecoveryPartitionSegment[];
  }>;
}

export type PantavionRecoverySourceRecord = Record<string, unknown> & { id: string };

export interface PantavionVerifiedRecoveryBatch {
  file: string;
  fileSha256: string;
  records: PantavionRecoverySourceRecord[];
}

export interface PantavionVerifiedRecoveryPartition {
  marker: "pantavion_verified_recovery_partition_v1";
  ordinal: number;
  startOrdinal: number;
  endOrdinal: number;
  recordCount: number;
  records: PantavionRecoverySourceRecord[];
  sourceEvidence: Array<{
    file: string;
    fileSha256: string;
    segmentStartOrdinal: number;
    segmentEndOrdinal: number;
    recordCount: number;
  }>;
  authority: {
    analysis: true;
    planning: true;
    codeMutation: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
  };
}

function sha256(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function recordId(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("recovery_source_record_invalid");
  }
  const id = (value as Record<string, unknown>).id;
  if (typeof id !== "string" || !id.trim()) throw new Error("recovery_source_record_id_required");
  return id.trim();
}

export function fingerprintPantavionRecoveryRecordIds(records: readonly PantavionRecoverySourceRecord[]): string {
  const hash = createHash("sha256");
  records.forEach((record, index) => {
    if (index > 0) hash.update("\n");
    hash.update(recordId(record));
  });
  return hash.digest("hex");
}

export function verifyPantavionRecoveryBatchPayload(input: {
  entry: PantavionRecoverySourceBatchIndexEntry;
  payload: Uint8Array | string;
}): PantavionVerifiedRecoveryBatch {
  const raw = typeof input.payload === "string"
    ? Buffer.from(input.payload, "utf8")
    : Buffer.from(input.payload);

  if (raw.length !== input.entry.fileBytes) {
    throw new Error(`recovery_batch_byte_length_mismatch:${input.entry.file}`);
  }
  if (sha256(raw) !== input.entry.fileSha256) {
    throw new Error(`recovery_batch_sha256_mismatch:${input.entry.file}`);
  }

  const parsed = JSON.parse(raw.toString("utf8")) as Record<string, unknown>;
  if (!Array.isArray(parsed.records)) {
    throw new Error(`recovery_batch_records_missing:${input.entry.file}`);
  }
  if (parsed.records.length !== input.entry.recordCount) {
    throw new Error(`recovery_batch_record_count_mismatch:${input.entry.file}`);
  }

  const records = parsed.records.map((value) => {
    const id = recordId(value);
    return { ...(value as Record<string, unknown>), id } as PantavionRecoverySourceRecord;
  });
  if (records[0]?.id !== input.entry.firstRecordId) {
    throw new Error(`recovery_batch_first_record_mismatch:${input.entry.file}`);
  }
  if (records.at(-1)?.id !== input.entry.lastRecordId) {
    throw new Error(`recovery_batch_last_record_mismatch:${input.entry.file}`);
  }
  if (fingerprintPantavionRecoveryRecordIds(records) !== input.entry.orderedRecordIdFingerprint) {
    throw new Error(`recovery_batch_ordered_id_fingerprint_mismatch:${input.entry.file}`);
  }

  return {
    file: input.entry.file,
    fileSha256: input.entry.fileSha256,
    records,
  };
}

export function materializeVerifiedPantavionRecoveryPartition(input: {
  index: PantavionRecoverySourceBatchIndex;
  partitionOrdinal: number;
  verifiedBatches: ReadonlyMap<string, PantavionVerifiedRecoveryBatch>;
}): PantavionVerifiedRecoveryPartition {
  if (input.index.id !== "pantavion_recovery_source_batch_index_v1") {
    throw new Error("recovery_source_batch_index_invalid");
  }
  if (Object.values(input.index.authority).some(Boolean)) {
    throw new Error("recovery_source_batch_index_authority_must_remain_false");
  }

  const partition = input.index.partitions[input.partitionOrdinal - 1];
  if (!partition || partition.ordinal !== input.partitionOrdinal) {
    throw new Error("recovery_partition_not_found");
  }

  const records: PantavionRecoverySourceRecord[] = [];
  const sourceEvidence: PantavionVerifiedRecoveryPartition["sourceEvidence"] = [];

  for (const segment of partition.segments) {
    const verifiedBatch = input.verifiedBatches.get(segment.file);
    if (!verifiedBatch) throw new Error(`recovery_verified_batch_missing:${segment.file}`);
    if (verifiedBatch.fileSha256 !== segment.fileSha256) {
      throw new Error(`recovery_partition_segment_sha256_mismatch:${segment.file}`);
    }

    const sliced = verifiedBatch.records.slice(segment.startRecordIndex, segment.endRecordIndex + 1);
    if (sliced.length !== segment.recordCount) {
      throw new Error(`recovery_partition_segment_count_mismatch:${segment.file}`);
    }
    records.push(...sliced);
    sourceEvidence.push({
      file: segment.file,
      fileSha256: segment.fileSha256,
      segmentStartOrdinal: segment.segmentStartOrdinal,
      segmentEndOrdinal: segment.segmentEndOrdinal,
      recordCount: segment.recordCount,
    });
  }

  if (records.length !== partition.recordCount) {
    throw new Error(`recovery_partition_record_count_mismatch:${partition.ordinal}`);
  }

  return {
    marker: "pantavion_verified_recovery_partition_v1",
    ordinal: partition.ordinal,
    startOrdinal: partition.startOrdinal,
    endOrdinal: partition.endOrdinal,
    recordCount: records.length,
    records,
    sourceEvidence,
    authority: {
      analysis: true,
      planning: true,
      codeMutation: false,
      productionWrite: false,
      merge: false,
      deployment: false,
      publicExposure: false,
      release: false,
    },
  };
}
