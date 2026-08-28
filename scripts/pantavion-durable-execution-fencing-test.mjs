import assert from "node:assert/strict";

import { createExecutionRecord } from "../core/runtime/durable-execution.ts";
import {
  PantavionMemoryFencedExecutionStore,
  PantavionStaleExecutionFenceError,
} from "../core/runtime/durable-execution-fencing.ts";

const T0 = "2026-08-28T06:30:00.000Z";
const T0_MS = Date.parse(T0);
const at = (offsetMs) => new Date(T0_MS + offsetMs).toISOString();

function createRecord(id, key, maxAttempts = 3) {
  const record = createExecutionRecord(id, key, "kernel:test", { marker: id }, maxAttempts);
  return {
    ...record,
    createdAt: T0,
    updatedAt: T0,
  };
}

async function expectStale(operation, label) {
  await assert.rejects(operation, (error) => {
    assert.ok(error instanceof PantavionStaleExecutionFenceError, label);
    return true;
  });
}

// Exactly one worker may claim the same queued execution.
{
  const store = new PantavionMemoryFencedExecutionStore();
  await store.seed(createRecord("exec-race", "idem-race"));

  const [alpha, beta] = await Promise.all([
    store.claim("exec-race", { ownerId: "worker-alpha", leaseMs: 10_000, now: T0 }),
    store.claim("exec-race", { ownerId: "worker-beta", leaseMs: 10_000, now: T0 }),
  ]);

  assert.equal([alpha, beta].filter(Boolean).length, 1, "exactly one worker must win the initial claim");
  const winner = alpha ?? beta;
  assert.ok(winner);
  assert.equal(winner.record.attempt, 1);
  assert.equal(winner.fence.fencingToken, 1);
}

// Heartbeat extends the lease and prevents early reclaim.
{
  const store = new PantavionMemoryFencedExecutionStore();
  await store.seed(createRecord("exec-heartbeat", "idem-heartbeat"));
  const first = await store.claim("exec-heartbeat", {
    ownerId: "worker-alpha",
    leaseMs: 10_000,
    now: T0,
  });
  assert.ok(first);

  const heartbeat = await store.heartbeat("exec-heartbeat", first.fence, at(5_000), 10_000);
  assert.equal(heartbeat.lease.leaseExpiresAt, at(15_000));

  const premature = await store.claim("exec-heartbeat", {
    ownerId: "worker-beta",
    leaseMs: 10_000,
    now: at(12_000),
  });
  assert.equal(premature, null, "heartbeat must prevent reclaim before the renewed expiry");
}

// Expiry permits deterministic reassignment and increments the fencing token.
{
  const store = new PantavionMemoryFencedExecutionStore();
  await store.seed(createRecord("exec-reclaim", "idem-reclaim"));
  const first = await store.claim("exec-reclaim", {
    ownerId: "worker-alpha",
    leaseMs: 10_000,
    now: T0,
  });
  assert.ok(first);

  const second = await store.claim("exec-reclaim", {
    ownerId: "worker-beta",
    leaseMs: 10_000,
    now: at(10_001),
  });
  assert.ok(second, "expired running work must be reclaimable");
  assert.equal(second.fence.fencingToken, 2);
  assert.equal(second.record.attempt, 2);
  assert.equal(second.record.idempotencyKey, "idem-reclaim", "reclaim must preserve idempotency identity");

  await expectStale(
    () => store.checkpoint("exec-reclaim", first.fence, "stale_checkpoint", {}, at(10_002)),
    "old worker checkpoint must be rejected after reassignment",
  );
  await expectStale(
    () => store.succeed("exec-reclaim", first.fence, { wrong: true }, at(10_002)),
    "old worker finalization must be rejected after reassignment",
  );

  const checkpointed = await store.checkpoint(
    "exec-reclaim",
    second.fence,
    "worker_beta_checkpoint",
    { safe: true },
    at(10_002),
  );
  assert.equal(checkpointed.checkpoints.at(-1)?.label, "worker_beta_checkpoint");

  const succeeded = await store.succeed(
    "exec-reclaim",
    second.fence,
    { ok: true },
    at(10_003),
  );
  assert.equal(succeeded.status, "succeeded");
  assert.equal(succeeded.lease.ownerId, null);
  assert.equal(succeeded.lease.fencingToken, 2, "terminal state must retain the last fencing token for audit");
}

// A retry releases the lease but preserves idempotency and advances the token on the next claim.
{
  const store = new PantavionMemoryFencedExecutionStore();
  await store.seed(createRecord("exec-retry", "idem-retry", 3));
  const first = await store.claim("exec-retry", {
    ownerId: "worker-alpha",
    leaseMs: 10_000,
    now: T0,
  });
  assert.ok(first);

  const retry = await store.fail("exec-retry", first.fence, "transient", at(1_000));
  assert.equal(retry.status, "queued");
  assert.equal(retry.lease.ownerId, null);
  assert.equal(retry.idempotencyKey, "idem-retry");

  const second = await store.claim("exec-retry", {
    ownerId: "worker-beta",
    leaseMs: 10_000,
    now: at(1_001),
  });
  assert.ok(second);
  assert.equal(second.fence.fencingToken, 2);
  assert.equal(second.record.attempt, 2);
  assert.equal(second.record.idempotencyKey, "idem-retry");
}

// An expired owner cannot mutate even before another worker has reclaimed the record.
{
  const store = new PantavionMemoryFencedExecutionStore();
  await store.seed(createRecord("exec-expired", "idem-expired"));
  const first = await store.claim("exec-expired", {
    ownerId: "worker-alpha",
    leaseMs: 1_000,
    now: T0,
  });
  assert.ok(first);

  await expectStale(
    () => store.checkpoint("exec-expired", first.fence, "late_write", {}, at(1_001)),
    "expired owner must fail closed before reclaim",
  );
}

console.log("pantavion_durable_execution_fencing_contract: PASS");
