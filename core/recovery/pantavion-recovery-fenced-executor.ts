import "server-only";

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { PantavionDurableExecutionRecord } from "../runtime/durable-execution";
import type { PantavionExecutionFence } from "../runtime/durable-execution-fencing";
import {
  PANTAVION_RECOVERY_PARTITION_TASK_NAME,
  type PantavionRecoveryPartitionInput,
} from "./pantavion-recovery-partition-scheduler";
import { analyzePantavionRecoveryPartitionInventory } from "./pantavion-recovery-partition-inventory";
import {
  materializeVerifiedPantavionRecoveryPartition,
  verifyPantavionRecoveryBatchPayload,
  type PantavionRecoverySourceBatchIndex,
  type PantavionVerifiedRecoveryBatch,
} from "./pantavion-recovery-source-reader";
import { PANTAVION_RECOVERY_CORPUS_CONTRACT } from "./pantavion-recovery-runtime-fabric";

export const PANTAVION_RECOVERY_EXECUTIONS_PER_TICK = 5;
const PANTAVION_RECOVERY_EXECUTION_LEASE_MS = 120_000;

export interface PantavionRecoveryFencedExecutionStore {
  list(limit?: number): Promise<PantavionDurableExecutionRecord[]>;
  claimFenced(
    executionId: string,
    ownerId: string,
    leaseMs?: number,
    expectedStatuses?: PantavionDurableExecutionRecord["status"][],
  ): Promise<{ record: PantavionDurableExecutionRecord; fence: PantavionExecutionFence } | null>;
  checkpointFenced(
    fence: PantavionExecutionFence,
    label: string,
    state?: Record<string, unknown>,
  ): Promise<PantavionDurableExecutionRecord>;
  finishFencedSuccess(
    fence: PantavionExecutionFence,
    output: unknown,
  ): Promise<PantavionDurableExecutionRecord>;
  finishFencedFailure(
    fence: PantavionExecutionFence,
    error: string,
  ): Promise<PantavionDurableExecutionRecord>;
}

export interface PantavionRecoveryFencedExecutorReport {
  marker: "pantavion_recovery_fenced_executor_v1";
  status: "ran" | "degraded" | "blocked";
  scannedExecutions: number;
  eligibleExecutions: number;
  claimedExecutions: number;
  succeededExecutions: number;
  retryOrFailedExecutions: number;
  remainingEligibleExecutions: number;
  issues: string[];
  checkedAt: string;
}

function messageFor(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[\r\n\t]+/g, " ").slice(0, 500) || "recovery_executor_unknown_error";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parsePartitionInput(record: PantavionDurableExecutionRecord): PantavionRecoveryPartitionInput {
  if (record.taskName !== PANTAVION_RECOVERY_PARTITION_TASK_NAME || !isObject(record.input)) {
    throw new Error("recovery_executor_partition_input_missing");
  }

  const value = record.input as Partial<PantavionRecoveryPartitionInput>;
  const authority = value.authority;
  if (
    value.marker !== "pantavion_recovery_execution_partition_v1" ||
    value.intentId !== PANTAVION_RECOVERY_CORPUS_CONTRACT.intentId ||
    value.sourceFingerprint !== PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint ||
    value.orderedIdFingerprint !== PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint ||
    value.sourceRecordCount !== PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount ||
    value.partitionCount !== PANTAVION_RECOVERY_CORPUS_CONTRACT.partitionCount ||
    value.batchSize !== PANTAVION_RECOVERY_CORPUS_CONTRACT.batchSize ||
    value.sourceOrdinalBinding !== "canonical_corpus_ordered_record_id" ||
    !Number.isInteger(value.partitionOrdinal) ||
    (value.partitionOrdinal ?? 0) < 1 ||
    (value.partitionOrdinal ?? 0) > PANTAVION_RECOVERY_CORPUS_CONTRACT.partitionCount ||
    authority?.internalAnalysis !== true ||
    authority?.internalPlanning !== true ||
    authority?.codeMutation !== false ||
    authority?.productionWrite !== false ||
    authority?.merge !== false ||
    authority?.deployment !== false ||
    authority?.publicExposure !== false ||
    authority?.release !== false
  ) {
    throw new Error("recovery_executor_partition_contract_invalid");
  }

  const ordinal = value.partitionOrdinal as number;
  const expectedStart = (ordinal - 1) * PANTAVION_RECOVERY_CORPUS_CONTRACT.batchSize + 1;
  const expectedEnd = Math.min(
    ordinal * PANTAVION_RECOVERY_CORPUS_CONTRACT.batchSize,
    PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount,
  );
  if (
    value.startUnit !== expectedStart ||
    value.endUnit !== expectedEnd ||
    value.unitCount !== expectedEnd - expectedStart + 1
  ) {
    throw new Error("recovery_executor_partition_range_invalid");
  }

  return value as PantavionRecoveryPartitionInput;
}

function loadSourceIndex(rootDir: string): PantavionRecoverySourceBatchIndex {
  const indexPath = path.join(rootDir, "data/recovery/source-batch-index-v1.json");
  const parsed = JSON.parse(fs.readFileSync(indexPath, "utf8")) as PantavionRecoverySourceBatchIndex;
  if (
    parsed.id !== "pantavion_recovery_source_batch_index_v1" ||
    parsed.corpus.recordCount !== PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount ||
    parsed.corpus.batchCount !== PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceBatchCount ||
    parsed.corpus.sourceFingerprint !== PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint ||
    parsed.corpus.orderedIdFingerprint !== PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint ||
    parsed.partitionPlan.batchSize !== PANTAVION_RECOVERY_CORPUS_CONTRACT.batchSize ||
    parsed.partitionPlan.partitionCount !== PANTAVION_RECOVERY_CORPUS_CONTRACT.partitionCount ||
    Object.values(parsed.authority).some(Boolean)
  ) {
    throw new Error("recovery_executor_source_index_invalid");
  }
  return parsed;
}

function loadVerifiedPartition(input: {
  rootDir: string;
  index: PantavionRecoverySourceBatchIndex;
  partitionOrdinal: number;
  cache: Map<string, PantavionVerifiedRecoveryBatch>;
}) {
  const partition = input.index.partitions[input.partitionOrdinal - 1];
  if (!partition || partition.ordinal !== input.partitionOrdinal) {
    throw new Error("recovery_executor_partition_index_missing");
  }

  for (const segment of partition.segments) {
    if (input.cache.has(segment.file)) continue;
    const entry = input.index.batches.find((batch) => batch.file === segment.file);
    if (!entry) throw new Error(`recovery_executor_batch_index_missing:${segment.file}`);
    const payload = fs.readFileSync(path.join(input.rootDir, entry.relativePath));
    input.cache.set(entry.file, verifyPantavionRecoveryBatchPayload({ entry, payload }));
  }

  return materializeVerifiedPantavionRecoveryPartition({
    index: input.index,
    partitionOrdinal: input.partitionOrdinal,
    verifiedBatches: input.cache,
  });
}

function ordinalFor(record: PantavionDurableExecutionRecord): number {
  try {
    return parsePartitionInput(record).partitionOrdinal;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

export async function runPantavionRecoveryFencedExecutor(input: {
  store: PantavionRecoveryFencedExecutionStore;
  limit?: number;
  rootDir?: string;
  ownerId?: string;
}): Promise<PantavionRecoveryFencedExecutorReport> {
  const checkedAt = new Date().toISOString();
  const limit = Math.max(1, Math.min(10, Math.trunc(input.limit ?? PANTAVION_RECOVERY_EXECUTIONS_PER_TICK)));
  const ownerId = (input.ownerId?.trim() || `pantavion-recovery-in-process:${randomUUID()}`).slice(0, 180);
  const issues: string[] = [];
  let records: PantavionDurableExecutionRecord[];

  try {
    records = await input.store.list(500);
  } catch (error) {
    return {
      marker: "pantavion_recovery_fenced_executor_v1",
      status: "blocked",
      scannedExecutions: 0,
      eligibleExecutions: 0,
      claimedExecutions: 0,
      succeededExecutions: 0,
      retryOrFailedExecutions: 0,
      remainingEligibleExecutions: 0,
      issues: [`recovery_executor_store_list_failed:${messageFor(error)}`],
      checkedAt,
    };
  }

  const eligible = records
    .filter((record) =>
      record.taskName === PANTAVION_RECOVERY_PARTITION_TASK_NAME &&
      ["queued", "planned", "running"].includes(record.status),
    )
    .sort((a, b) => ordinalFor(a) - ordinalFor(b));

  if (eligible.length === 0) {
    return {
      marker: "pantavion_recovery_fenced_executor_v1",
      status: "ran",
      scannedExecutions: records.length,
      eligibleExecutions: 0,
      claimedExecutions: 0,
      succeededExecutions: 0,
      retryOrFailedExecutions: 0,
      remainingEligibleExecutions: 0,
      issues: [],
      checkedAt,
    };
  }

  let index: PantavionRecoverySourceBatchIndex;
  try {
    index = loadSourceIndex(input.rootDir ?? process.cwd());
  } catch (error) {
    return {
      marker: "pantavion_recovery_fenced_executor_v1",
      status: "blocked",
      scannedExecutions: records.length,
      eligibleExecutions: eligible.length,
      claimedExecutions: 0,
      succeededExecutions: 0,
      retryOrFailedExecutions: 0,
      remainingEligibleExecutions: eligible.length,
      issues: [`recovery_executor_source_index_failed:${messageFor(error)}`],
      checkedAt,
    };
  }

  const rootDir = input.rootDir ?? process.cwd();
  const cache = new Map<string, PantavionVerifiedRecoveryBatch>();
  let claimedExecutions = 0;
  let succeededExecutions = 0;
  let retryOrFailedExecutions = 0;

  for (const candidate of eligible) {
    if (claimedExecutions >= limit) break;
    let claimed: { record: PantavionDurableExecutionRecord; fence: PantavionExecutionFence } | null = null;
    try {
      claimed = await input.store.claimFenced(
        candidate.executionId,
        ownerId,
        PANTAVION_RECOVERY_EXECUTION_LEASE_MS,
        ["queued", "planned"],
      );
      if (!claimed) continue;
      claimedExecutions += 1;

      const partitionInput = parsePartitionInput(claimed.record);
      const verifiedPartition = loadVerifiedPartition({
        rootDir,
        index,
        partitionOrdinal: partitionInput.partitionOrdinal,
        cache,
      });
      const inventory = analyzePantavionRecoveryPartitionInventory(verifiedPartition);

      await input.store.checkpointFenced(claimed.fence, "pantavion_recovery_inventory_verified", {
        marker: inventory.marker,
        partitionOrdinal: inventory.partitionOrdinal,
        startOrdinal: inventory.startOrdinal,
        endOrdinal: inventory.endOrdinal,
        recordCount: inventory.recordCount,
        uniqueRecordCount: inventory.uniqueRecordCount,
        partitionEvidenceSha256: inventory.partitionEvidenceSha256,
        nextStage: inventory.nextStage,
        rawRecoveredPayloadStored: false,
        codeMutationAllowed: false,
        productionWriteAllowed: false,
        mergeAllowed: false,
        deploymentAllowed: false,
        publicExposureAllowed: false,
        releaseAllowed: false,
      });

      const finished = await input.store.finishFencedSuccess(claimed.fence, {
        marker: "pantavion_recovery_inventory_execution_output_v1",
        partitionOrdinal: inventory.partitionOrdinal,
        startOrdinal: inventory.startOrdinal,
        endOrdinal: inventory.endOrdinal,
        recordCount: inventory.recordCount,
        uniqueRecordCount: inventory.uniqueRecordCount,
        partitionEvidenceSha256: inventory.partitionEvidenceSha256,
        recordsMissingSourceFile: inventory.recordsMissingSourceFile,
        recordsMissingSeedModule: inventory.recordsMissingSeedModule,
        recordsWithText: inventory.recordsWithText,
        recordsWithContext: inventory.recordsWithContext,
        nextStage: inventory.nextStage,
        rawRecoveredPayloadStored: false,
        authority: inventory.authority,
      });
      if (finished.status !== "succeeded") {
        throw new Error(`recovery_executor_finish_status_invalid:${finished.status}`);
      }
      succeededExecutions += 1;
    } catch (error) {
      const safeMessage = messageFor(error);
      issues.push(`recovery_executor_partition_failed:${candidate.executionId}:${safeMessage}`);
      if (claimed) {
        try {
          await input.store.finishFencedFailure(claimed.fence, safeMessage);
          retryOrFailedExecutions += 1;
        } catch (finishError) {
          issues.push(
            `recovery_executor_failure_record_failed:${candidate.executionId}:${messageFor(finishError)}`,
          );
        }
      }
    }
  }

  const remainingEligibleExecutions = Math.max(0, eligible.length - claimedExecutions);
  return {
    marker: "pantavion_recovery_fenced_executor_v1",
    status:
      issues.length === 0
        ? "ran"
        : succeededExecutions === 0 && retryOrFailedExecutions === 0
          ? "blocked"
          : "degraded",
    scannedExecutions: records.length,
    eligibleExecutions: eligible.length,
    claimedExecutions,
    succeededExecutions,
    retryOrFailedExecutions,
    remainingEligibleExecutions,
    issues: issues.slice(0, 25),
    checkedAt,
  };
}
