import assert from "node:assert/strict";

import {
  materializePantavionRecoveryExecutionPartitions,
  PANTAVION_RECOVERY_PARTITION_TASK_NAME,
} from "../core/recovery/pantavion-recovery-partition-scheduler.ts";
import { runPantavionRecoveryFencedExecutor } from "../core/recovery/pantavion-recovery-fenced-executor.ts";

class TestFencedStore {
  records = new Map();
  fences = new Map();

  async get(executionId) {
    return this.records.get(executionId) ?? null;
  }

  async findByIdempotencyKey(idempotencyKey) {
    for (const record of this.records.values()) {
      if (record.idempotencyKey === idempotencyKey) return record;
    }
    return null;
  }

  async put(record) {
    this.records.set(record.executionId, structuredClone(record));
  }

  async list(limit = 100) {
    return [...this.records.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit)
      .map((record) => structuredClone(record));
  }

  async claimFenced(executionId, ownerId, _leaseMs = 120000, expectedStatuses = ["queued", "planned"]) {
    const record = this.records.get(executionId);
    if (!record) return null;
    if (!expectedStatuses.includes(record.status) && record.status !== "running") return null;
    const current = this.fences.get(executionId);
    const token = (current?.fencingToken ?? 0) + 1;
    const fence = { executionId, ownerId, fencingToken: token };
    this.fences.set(executionId, fence);
    const running = {
      ...record,
      status: "running",
      attempt: record.attempt + 1,
      updatedAt: new Date().toISOString(),
      lastError: undefined,
    };
    this.records.set(executionId, running);
    return { record: structuredClone(running), fence };
  }

  requireFence(fence) {
    const current = this.fences.get(fence.executionId);
    if (
      !current ||
      current.ownerId !== fence.ownerId ||
      current.fencingToken !== fence.fencingToken
    ) {
      throw new Error("test_stale_fence");
    }
  }

  async checkpointFenced(fence, label, state = {}) {
    this.requireFence(fence);
    const record = this.records.get(fence.executionId);
    const checkpoint = {
      id: `${record.executionId}:${record.checkpoints.length + 1}`,
      at: new Date().toISOString(),
      label,
      state,
    };
    const updated = {
      ...record,
      updatedAt: checkpoint.at,
      checkpoints: [...record.checkpoints, checkpoint],
    };
    this.records.set(record.executionId, updated);
    return structuredClone(updated);
  }

  async finishFencedSuccess(fence, output) {
    this.requireFence(fence);
    const record = this.records.get(fence.executionId);
    const updated = {
      ...record,
      status: "succeeded",
      output,
      lastError: undefined,
      updatedAt: new Date().toISOString(),
    };
    this.records.set(record.executionId, updated);
    this.fences.delete(record.executionId);
    return structuredClone(updated);
  }

  async finishFencedFailure(fence, error) {
    this.requireFence(fence);
    const record = this.records.get(fence.executionId);
    const exhausted = record.attempt >= (record.maxAttempts ?? 3);
    const updated = {
      ...record,
      status: exhausted ? "failed" : "queued",
      output: undefined,
      lastError: error,
      updatedAt: new Date().toISOString(),
    };
    this.records.set(record.executionId, updated);
    this.fences.delete(record.executionId);
    return structuredClone(updated);
  }
}

const store = new TestFencedStore();
const scheduler = await materializePantavionRecoveryExecutionPartitions({ store, limit: 165 });
assert.equal(scheduler.createdPartitions, 165);
assert.equal(scheduler.remainingPartitions, 0);
assert.equal(store.records.size, 165);

const firstRun = await runPantavionRecoveryFencedExecutor({
  store,
  limit: 3,
  ownerId: "test-recovery-executor-1",
});
assert.equal(firstRun.status, "ran");
assert.equal(firstRun.claimedExecutions, 3);
assert.equal(firstRun.succeededExecutions, 3);
assert.equal(firstRun.retryOrFailedExecutions, 0);
assert.equal(firstRun.remainingEligibleExecutions, 162);

const firstThree = [...store.records.values()]
  .filter((record) => record.taskName === PANTAVION_RECOVERY_PARTITION_TASK_NAME)
  .sort((a, b) => a.input.partitionOrdinal - b.input.partitionOrdinal)
  .slice(0, 3);
for (const record of firstThree) {
  assert.equal(record.status, "succeeded");
  assert.equal(record.output.marker, "pantavion_recovery_inventory_execution_output_v1");
  assert.equal(record.output.rawRecoveredPayloadStored, false);
  assert.equal(record.output.authority.codeMutation, false);
  assert.equal(record.output.authority.productionWrite, false);
  assert.equal(record.output.authority.merge, false);
  assert.equal(record.output.authority.deployment, false);
  assert.equal(record.output.authority.publicExposure, false);
  assert.equal(record.output.authority.release, false);
  assert.match(record.output.partitionEvidenceSha256, /^[a-f0-9]{64}$/);
  assert.equal(
    record.checkpoints.some((checkpoint) => checkpoint.label === "pantavion_recovery_inventory_verified"),
    true,
  );
}

const secondRun = await runPantavionRecoveryFencedExecutor({
  store,
  limit: 2,
  ownerId: "test-recovery-executor-2",
});
assert.equal(secondRun.status, "ran");
assert.equal(secondRun.succeededExecutions, 2);
assert.equal(
  [...store.records.values()].filter((record) => record.status === "succeeded").length,
  5,
  "replay must advance to new partitions instead of duplicating completed work",
);

const sixth = [...store.records.values()]
  .filter((record) => record.taskName === PANTAVION_RECOVERY_PARTITION_TASK_NAME)
  .sort((a, b) => a.input.partitionOrdinal - b.input.partitionOrdinal)[5];
sixth.input = {
  ...sixth.input,
  authority: { ...sixth.input.authority, productionWrite: true },
};
store.records.set(sixth.executionId, sixth);

const failClosedRun = await runPantavionRecoveryFencedExecutor({
  store,
  limit: 1,
  ownerId: "test-recovery-executor-3",
});
assert.equal(failClosedRun.succeededExecutions, 0);
assert.equal(failClosedRun.retryOrFailedExecutions, 1);
assert.equal(store.records.get(sixth.executionId).status, "queued");
assert.match(store.records.get(sixth.executionId).lastError, /recovery_executor_partition_contract_invalid/);

console.log("Pantavion Recovery Fenced Executor contract: PASS");
console.log("Durable partitions seeded: 165");
console.log("Fenced successful executions: 5");
console.log("Replay duplicate execution: 0");
console.log("Authority escalation rejection: PASS");
console.log("Raw recovered payload persisted by executor: false");
