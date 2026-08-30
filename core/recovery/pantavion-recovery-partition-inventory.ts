import { createHash } from "node:crypto";

import { digestPantavionRecoverySourceRecord } from "./pantavion-recovery-runtime-fabric.ts";
import type {
  PantavionRecoverySourceRecord,
  PantavionVerifiedRecoveryPartition,
} from "./pantavion-recovery-source-reader.ts";

export interface PantavionRecoveryInventoryRecordEvidence {
  recordId: string;
  sourceRecordSha256: string;
  sourceFile: string | null;
  sourceFamily: string | null;
  seedModule: string | null;
  hasText: boolean;
  hasContext: boolean;
}

export interface PantavionRecoveryPartitionInventory {
  marker: "pantavion_recovery_partition_inventory_v1";
  partitionOrdinal: number;
  startOrdinal: number;
  endOrdinal: number;
  recordCount: number;
  uniqueRecordCount: number;
  partitionEvidenceSha256: string;
  sourceFamilies: Record<string, number>;
  seedModules: Record<string, number>;
  recordsMissingSourceFile: number;
  recordsMissingSeedModule: number;
  recordsWithText: number;
  recordsWithContext: number;
  recordEvidence: PantavionRecoveryInventoryRecordEvidence[];
  nextStage: "semantic_classification_v3";
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

function nonEmptyText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function recordObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function emptyCounter(): Record<string, number> {
  return Object.create(null) as Record<string, number>;
}

function increment(target: Record<string, number>, key: string | null): void {
  if (!key) return;
  const current = Object.prototype.hasOwnProperty.call(target, key) ? target[key] : 0;
  target[key] = current + 1;
}

function assertPartitionHeader(partition: PantavionVerifiedRecoveryPartition): void {
  if (partition.marker !== "pantavion_verified_recovery_partition_v1") {
    throw new Error("recovery_inventory_partition_marker_invalid");
  }
  if (
    partition.authority.analysis !== true ||
    partition.authority.planning !== true ||
    partition.authority.codeMutation !== false ||
    partition.authority.productionWrite !== false ||
    partition.authority.merge !== false ||
    partition.authority.deployment !== false ||
    partition.authority.publicExposure !== false ||
    partition.authority.release !== false
  ) {
    throw new Error("recovery_inventory_partition_authority_invalid");
  }
  if (
    !Number.isInteger(partition.ordinal) ||
    partition.ordinal < 1 ||
    !Number.isInteger(partition.startOrdinal) ||
    partition.startOrdinal < 1 ||
    !Number.isInteger(partition.endOrdinal) ||
    partition.endOrdinal < partition.startOrdinal ||
    !Number.isInteger(partition.recordCount) ||
    partition.recordCount < 1 ||
    partition.recordCount !== partition.endOrdinal - partition.startOrdinal + 1 ||
    partition.records.length !== partition.recordCount
  ) {
    throw new Error("recovery_inventory_partition_range_invalid");
  }
}

function assertSourceEvidenceCoverage(partition: PantavionVerifiedRecoveryPartition): void {
  if (!Array.isArray(partition.sourceEvidence) || partition.sourceEvidence.length === 0) {
    throw new Error("recovery_inventory_source_evidence_required");
  }

  let expectedStart = partition.startOrdinal;
  let coveredRecords = 0;
  for (const evidence of partition.sourceEvidence) {
    if (
      typeof evidence.file !== "string" ||
      !evidence.file.trim() ||
      !/^[a-f0-9]{64}$/.test(evidence.fileSha256) ||
      !Number.isInteger(evidence.segmentStartOrdinal) ||
      !Number.isInteger(evidence.segmentEndOrdinal) ||
      !Number.isInteger(evidence.recordCount) ||
      evidence.segmentStartOrdinal !== expectedStart ||
      evidence.segmentEndOrdinal < evidence.segmentStartOrdinal ||
      evidence.recordCount !== evidence.segmentEndOrdinal - evidence.segmentStartOrdinal + 1
    ) {
      throw new Error("recovery_inventory_source_evidence_invalid");
    }
    expectedStart = evidence.segmentEndOrdinal + 1;
    coveredRecords += evidence.recordCount;
  }

  if (expectedStart !== partition.endOrdinal + 1 || coveredRecords !== partition.recordCount) {
    throw new Error("recovery_inventory_source_evidence_coverage_mismatch");
  }
}

function evidenceForRecord(record: PantavionRecoverySourceRecord): PantavionRecoveryInventoryRecordEvidence {
  const id = nonEmptyText(record.id);
  if (!id) throw new Error("recovery_inventory_record_id_required");
  const provenance = recordObject(record.provenance);
  const classification = recordObject(record.classification);
  return {
    recordId: id,
    sourceRecordSha256: digestPantavionRecoverySourceRecord(record),
    sourceFile: nonEmptyText(provenance?.sourceFile),
    sourceFamily: nonEmptyText(provenance?.sourceFamily),
    seedModule: nonEmptyText(classification?.module),
    hasText: Boolean(nonEmptyText(record.text)),
    hasContext: Boolean(nonEmptyText(record.context)),
  };
}

function partitionEvidenceDigest(records: readonly PantavionRecoveryInventoryRecordEvidence[]): string {
  const hash = createHash("sha256");
  records.forEach((record, index) => {
    if (index > 0) hash.update("\n");
    hash.update(JSON.stringify([record.recordId, record.sourceRecordSha256]));
  });
  return hash.digest("hex");
}

export function analyzePantavionRecoveryPartitionInventory(
  partition: PantavionVerifiedRecoveryPartition,
): PantavionRecoveryPartitionInventory {
  assertPartitionHeader(partition);

  const ids = partition.records.map((record) => record.id);
  const uniqueRecordCount = new Set(ids).size;
  if (uniqueRecordCount !== partition.recordCount) {
    throw new Error("recovery_inventory_duplicate_record_id");
  }
  assertSourceEvidenceCoverage(partition);

  const recordEvidence = partition.records.map(evidenceForRecord);
  const sourceFamilies = emptyCounter();
  const seedModules = emptyCounter();
  let recordsMissingSourceFile = 0;
  let recordsMissingSeedModule = 0;
  let recordsWithText = 0;
  let recordsWithContext = 0;

  for (const evidence of recordEvidence) {
    increment(sourceFamilies, evidence.sourceFamily);
    increment(seedModules, evidence.seedModule);
    if (!evidence.sourceFile) recordsMissingSourceFile += 1;
    if (!evidence.seedModule) recordsMissingSeedModule += 1;
    if (evidence.hasText) recordsWithText += 1;
    if (evidence.hasContext) recordsWithContext += 1;
  }

  return {
    marker: "pantavion_recovery_partition_inventory_v1",
    partitionOrdinal: partition.ordinal,
    startOrdinal: partition.startOrdinal,
    endOrdinal: partition.endOrdinal,
    recordCount: partition.recordCount,
    uniqueRecordCount,
    partitionEvidenceSha256: partitionEvidenceDigest(recordEvidence),
    sourceFamilies,
    seedModules,
    recordsMissingSourceFile,
    recordsMissingSeedModule,
    recordsWithText,
    recordsWithContext,
    recordEvidence,
    nextStage: "semantic_classification_v3",
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
