import {
  appendCheckpoint,
  createExecutionRecord,
  type PantavionDurableExecutionRecord,
  type PantavionDurableExecutionStore,
} from "../runtime/durable-execution.ts";
import { PANTAVION_RECOVERY_CORPUS_CONTRACT } from "./pantavion-recovery-runtime-fabric.ts";

export const PANTAVION_RECOVERY_PARTITION_TASK_NAME = "pantavion:recovery_partition:v1";
export const PANTAVION_RECOVERY_PARTITIONS_PER_TICK = 25;

export interface PantavionRecoveryPartitionInput {
  marker: "pantavion_recovery_execution_partition_v1";
  intentId: string;
  sourceFingerprint: string;
  orderedIdFingerprint: string;
  sourceRecordCount: number;
  partitionOrdinal: number;
  partitionCount: number;
  batchSize: number;
  startUnit: number;
  endUnit: number;
  unitCount: number;
  sourceOrdinalBinding: "canonical_corpus_ordered_record_id";
  authority: {
    internalAnalysis: true;
    internalPlanning: true;
    codeMutation: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
  };
}

export interface PantavionRecoveryPartitionSchedulerReport {
  marker: "pantavion_recovery_partition_scheduler_v1";
  status: "ran" | "degraded" | "blocked";
  sourceRecordCount: number;
  partitionCount: number;
  existingPartitions: number;
  createdPartitions: number;
  remainingPartitions: number;
  conflictingPartitions: number;
  issues: string[];
  checkedAt: string;
}

function partitionExecutionId(ordinal: number): string {
  return `recovery:${PANTAVION_RECOVERY_CORPUS_CONTRACT.intentId}:partition:${String(ordinal).padStart(3, "0")}`;
}

function partitionIdempotencyKey(ordinal: number): string {
  return [
    "pantavion_recovery_partition_v1",
    PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint,
    String(ordinal),
  ].join(":");
}

export function createPantavionRecoveryPartitionInput(
  ordinal: number,
): PantavionRecoveryPartitionInput {
  const contract = PANTAVION_RECOVERY_CORPUS_CONTRACT;
  if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > contract.partitionCount) {
    throw new Error("recovery_partition_ordinal_out_of_range");
  }

  const startUnit = (ordinal - 1) * contract.batchSize + 1;
  const endUnit = Math.min(ordinal * contract.batchSize, contract.sourceRecordCount);

  return {
    marker: "pantavion_recovery_execution_partition_v1",
    intentId: contract.intentId,
    sourceFingerprint: contract.sourceFingerprint,
    orderedIdFingerprint: contract.orderedIdFingerprint,
    sourceRecordCount: contract.sourceRecordCount,
    partitionOrdinal: ordinal,
    partitionCount: contract.partitionCount,
    batchSize: contract.batchSize,
    startUnit,
    endUnit,
    unitCount: endUnit - startUnit + 1,
    sourceOrdinalBinding: "canonical_corpus_ordered_record_id",
    authority: {
      internalAnalysis: true,
      internalPlanning: true,
      codeMutation: false,
      productionWrite: false,
      merge: false,
      deployment: false,
      publicExposure: false,
      release: false,
    },
  };
}

function isExpectedExistingPartition(
  record: PantavionDurableExecutionRecord,
  ordinal: number,
): boolean {
  if (
    record.executionId !== partitionExecutionId(ordinal) ||
    record.idempotencyKey !== partitionIdempotencyKey(ordinal) ||
    record.taskName !== PANTAVION_RECOVERY_PARTITION_TASK_NAME
  ) {
    return false;
  }

  const input = record.input as Partial<PantavionRecoveryPartitionInput> | undefined;
  return Boolean(
    input &&
      input.marker === "pantavion_recovery_execution_partition_v1" &&
      input.intentId === PANTAVION_RECOVERY_CORPUS_CONTRACT.intentId &&
      input.sourceFingerprint === PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint &&
      input.orderedIdFingerprint === PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint &&
      input.partitionOrdinal === ordinal &&
      input.sourceRecordCount === PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount &&
      input.authority?.codeMutation === false &&
      input.authority?.productionWrite === false &&
      input.authority?.merge === false &&
      input.authority?.deployment === false &&
      input.authority?.publicExposure === false &&
      input.authority?.release === false,
  );
}

function createPlannedPartitionRecord(ordinal: number): PantavionDurableExecutionRecord {
  const input = createPantavionRecoveryPartitionInput(ordinal);
  const queued = createExecutionRecord(
    partitionExecutionId(ordinal),
    partitionIdempotencyKey(ordinal),
    PANTAVION_RECOVERY_PARTITION_TASK_NAME,
    input,
    5,
  );

  return appendCheckpoint(
    {
      ...queued,
      status: "planned",
    },
    "pantavion_recovery_partition_materialized",
    {
      marker: "pantavion_recovery_partition_materialized_v1",
      intentId: input.intentId,
      partitionOrdinal: input.partitionOrdinal,
      startUnit: input.startUnit,
      endUnit: input.endUnit,
      unitCount: input.unitCount,
      immutableCorpusBinding: true,
      readyFor: "pantavion_in_process_recovery_executor",
      externalWorkerAllowed: false,
      productionWriteAllowed: false,
      mergeAllowed: false,
      deploymentAllowed: false,
      publicExposureAllowed: false,
      releaseAllowed: false,
    },
  );
}

export async function materializePantavionRecoveryExecutionPartitions(input: {
  store: PantavionDurableExecutionStore;
  limit?: number;
}): Promise<PantavionRecoveryPartitionSchedulerReport> {
  const checkedAt = new Date().toISOString();
  const limit = Math.max(
    1,
    Math.min(
      PANTAVION_RECOVERY_CORPUS_CONTRACT.partitionCount,
      Math.trunc(input.limit ?? PANTAVION_RECOVERY_PARTITIONS_PER_TICK),
    ),
  );

  let existingPartitions = 0;
  let createdPartitions = 0;
  let conflictingPartitions = 0;
  const issues: string[] = [];

  for (let ordinal = 1; ordinal <= PANTAVION_RECOVERY_CORPUS_CONTRACT.partitionCount; ordinal += 1) {
    try {
      const existing = await input.store.findByIdempotencyKey(partitionIdempotencyKey(ordinal));
      if (existing) {
        if (isExpectedExistingPartition(existing, ordinal)) {
          existingPartitions += 1;
        } else {
          conflictingPartitions += 1;
          issues.push(`partition_identity_conflict:${ordinal}`);
        }
        continue;
      }

      if (createdPartitions >= limit) continue;
      await input.store.put(createPlannedPartitionRecord(ordinal));
      createdPartitions += 1;
    } catch {
      issues.push(`partition_store_failure:${ordinal}`);
    }
  }

  const accounted = existingPartitions + createdPartitions;
  const remainingPartitions = Math.max(
    0,
    PANTAVION_RECOVERY_CORPUS_CONTRACT.partitionCount - accounted - conflictingPartitions,
  );

  return {
    marker: "pantavion_recovery_partition_scheduler_v1",
    status:
      issues.length === 0
        ? "ran"
        : accounted === 0
          ? "blocked"
          : "degraded",
    sourceRecordCount: PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount,
    partitionCount: PANTAVION_RECOVERY_CORPUS_CONTRACT.partitionCount,
    existingPartitions,
    createdPartitions,
    remainingPartitions,
    conflictingPartitions,
    issues: issues.slice(0, 25),
    checkedAt,
  };
}
