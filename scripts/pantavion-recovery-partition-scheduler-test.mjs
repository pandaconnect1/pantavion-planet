import assert from "node:assert/strict";

import { PantavionMemoryExecutionStore } from "../core/runtime/durable-execution.ts";
import {
  PANTAVION_RECOVERY_PARTITION_TASK_NAME,
  createPantavionRecoveryPartitionInput,
  materializePantavionRecoveryExecutionPartitions,
} from "../core/recovery/pantavion-recovery-partition-scheduler.ts";
import { PANTAVION_RECOVERY_CORPUS_CONTRACT } from "../core/recovery/pantavion-recovery-runtime-fabric.ts";

const store = new PantavionMemoryExecutionStore();

const first = createPantavionRecoveryPartitionInput(1);
assert.equal(first.startUnit, 1);
assert.equal(first.endUnit, 500);
assert.equal(first.unitCount, 500);
assert.equal(first.authority.internalAnalysis, true);
assert.equal(first.authority.internalPlanning, true);
assert.equal(first.authority.codeMutation, false);
assert.equal(first.authority.productionWrite, false);
assert.equal(first.authority.merge, false);
assert.equal(first.authority.deployment, false);
assert.equal(first.authority.publicExposure, false);
assert.equal(first.authority.release, false);

const last = createPantavionRecoveryPartitionInput(PANTAVION_RECOVERY_CORPUS_CONTRACT.partitionCount);
assert.equal(last.startUnit, 82_001);
assert.equal(last.endUnit, 82_413);
assert.equal(last.unitCount, 413);

let totalCreated = 0;
for (let tick = 0; tick < 7; tick += 1) {
  const report = await materializePantavionRecoveryExecutionPartitions({ store, limit: 25 });
  assert.notEqual(report.status, "blocked");
  assert.equal(report.conflictingPartitions, 0);
  totalCreated += report.createdPartitions;
}
assert.equal(totalCreated, PANTAVION_RECOVERY_CORPUS_CONTRACT.partitionCount);

const records = await store.list(500);
const partitions = records.filter((record) => record.taskName === PANTAVION_RECOVERY_PARTITION_TASK_NAME);
assert.equal(partitions.length, 165);
assert.equal(new Set(partitions.map((record) => record.executionId)).size, 165);
assert.equal(new Set(partitions.map((record) => record.idempotencyKey)).size, 165);
assert.equal(partitions.every((record) => record.status === "planned"), true);
assert.equal(partitions.every((record) => record.checkpoints.length === 1), true);
assert.equal(
  partitions.every((record) => record.checkpoints[0]?.label === "pantavion_recovery_partition_materialized"),
  true,
);

for (const record of partitions) {
  const input = record.input;
  assert.equal(input?.marker, "pantavion_recovery_execution_partition_v1");
  assert.equal(input?.sourceFingerprint, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint);
  assert.equal(input?.orderedIdFingerprint, PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint);
  assert.equal(input?.authority?.codeMutation, false);
  assert.equal(input?.authority?.productionWrite, false);
  assert.equal(input?.authority?.merge, false);
  assert.equal(input?.authority?.deployment, false);
  assert.equal(input?.authority?.publicExposure, false);
  assert.equal(input?.authority?.release, false);
}

const idempotent = await materializePantavionRecoveryExecutionPartitions({ store, limit: 25 });
assert.equal(idempotent.status, "ran");
assert.equal(idempotent.createdPartitions, 0);
assert.equal(idempotent.existingPartitions, 165);
assert.equal(idempotent.remainingPartitions, 0);
assert.equal(idempotent.conflictingPartitions, 0);
assert.equal((await store.list(500)).length, 165);

console.log("Pantavion Recovery Partition Scheduler contract: PASS");
console.log(`Durable partitions: ${partitions.length}`);
console.log(`Bound source records: ${PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount}`);
console.log("Duplicate creation on replay: 0");
