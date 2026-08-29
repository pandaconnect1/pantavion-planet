import type {
  PantavionDurableExecutionRecord,
  PantavionExecutionCheckpoint,
} from "./durable-execution";

export interface PantavionExecutionLeaseState {
  ownerId: string | null;
  fencingToken: number;
  leaseExpiresAt: string | null;
  heartbeatAt: string | null;
}

export interface PantavionFencedExecutionRecord extends PantavionDurableExecutionRecord {
  lease: PantavionExecutionLeaseState;
}

export interface PantavionExecutionFence {
  executionId: string;
  ownerId: string;
  fencingToken: number;
}

export interface PantavionExecutionLeaseClaim {
  record: PantavionFencedExecutionRecord;
  fence: PantavionExecutionFence;
}

export class PantavionStaleExecutionFenceError extends Error {
  constructor(reason = "stale_execution_fence") {
    super(reason);
    this.name = "PantavionStaleExecutionFenceError";
  }
}

function requireFiniteTime(value: string, label: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label}_invalid`);
  return parsed;
}

function requirePositiveLeaseMs(value: number) {
  if (!Number.isFinite(value) || value <= 0) throw new Error("lease_duration_invalid");
  return Math.floor(value);
}

function leaseExpiry(now: string, leaseMs: number) {
  return new Date(requireFiniteTime(now, "lease_now") + requirePositiveLeaseMs(leaseMs)).toISOString();
}

export function createFencedExecutionRecord(
  record: PantavionDurableExecutionRecord,
): PantavionFencedExecutionRecord {
  return {
    ...record,
    checkpoints: [...record.checkpoints],
    lease: {
      ownerId: null,
      fencingToken: 0,
      leaseExpiresAt: null,
      heartbeatAt: null,
    },
  };
}

export function isExecutionLeaseExpired(
  record: PantavionFencedExecutionRecord,
  now: string,
) {
  if (!record.lease.leaseExpiresAt) return true;
  return requireFiniteTime(record.lease.leaseExpiresAt, "lease_expiry") <= requireFiniteTime(now, "lease_now");
}

export function claimExecutionLease(
  record: PantavionFencedExecutionRecord,
  input: {
    ownerId: string;
    leaseMs: number;
    now: string;
    expectedStatuses?: PantavionDurableExecutionRecord["status"][];
  },
): PantavionExecutionLeaseClaim | null {
  const ownerId = input.ownerId.trim();
  if (!ownerId) throw new Error("lease_owner_required");

  const expectedStatuses = input.expectedStatuses ?? ["queued", "planned"];
  const maxAttempts = record.maxAttempts ?? 3;
  if (record.attempt >= maxAttempts) return null;
  if (["succeeded", "failed", "cancelled", "paused"].includes(record.status)) return null;

  const normalClaim = expectedStatuses.includes(record.status);
  const expiredReclaim = record.status === "running" && isExecutionLeaseExpired(record, input.now);
  if (!normalClaim && !expiredReclaim) return null;

  const fencingToken = record.lease.fencingToken + 1;
  const updated: PantavionFencedExecutionRecord = {
    ...record,
    status: "running",
    attempt: record.attempt + 1,
    lastError: undefined,
    updatedAt: input.now,
    lease: {
      ownerId,
      fencingToken,
      leaseExpiresAt: leaseExpiry(input.now, input.leaseMs),
      heartbeatAt: input.now,
    },
  };

  return {
    record: updated,
    fence: {
      executionId: record.executionId,
      ownerId,
      fencingToken,
    },
  };
}

export function assertExecutionFence(
  record: PantavionFencedExecutionRecord,
  fence: PantavionExecutionFence,
  now: string,
) {
  if (fence.executionId !== record.executionId) {
    throw new PantavionStaleExecutionFenceError("execution_fence_id_mismatch");
  }
  if (record.status !== "running") {
    throw new PantavionStaleExecutionFenceError("execution_fence_not_running");
  }
  if (record.lease.ownerId !== fence.ownerId) {
    throw new PantavionStaleExecutionFenceError("execution_fence_owner_mismatch");
  }
  if (record.lease.fencingToken !== fence.fencingToken) {
    throw new PantavionStaleExecutionFenceError("execution_fence_token_mismatch");
  }
  if (isExecutionLeaseExpired(record, now)) {
    throw new PantavionStaleExecutionFenceError("execution_lease_expired");
  }
}

export function heartbeatExecutionLease(
  record: PantavionFencedExecutionRecord,
  fence: PantavionExecutionFence,
  input: { now: string; leaseMs: number },
): PantavionFencedExecutionRecord {
  assertExecutionFence(record, fence, input.now);
  return {
    ...record,
    updatedAt: input.now,
    lease: {
      ...record.lease,
      heartbeatAt: input.now,
      leaseExpiresAt: leaseExpiry(input.now, input.leaseMs),
    },
  };
}

function nextCheckpoint(
  record: PantavionFencedExecutionRecord,
  label: string,
  state: Record<string, unknown>,
  now: string,
): PantavionExecutionCheckpoint {
  return {
    id: `${record.executionId}:${record.checkpoints.length + 1}`,
    at: now,
    label,
    state,
  };
}

export function appendFencedExecutionCheckpoint(
  record: PantavionFencedExecutionRecord,
  fence: PantavionExecutionFence,
  input: { label: string; state?: Record<string, unknown>; now: string },
): PantavionFencedExecutionRecord {
  assertExecutionFence(record, fence, input.now);
  const checkpoint = nextCheckpoint(record, input.label, input.state ?? {}, input.now);
  return {
    ...record,
    updatedAt: input.now,
    checkpoints: [...record.checkpoints, checkpoint],
  };
}

export function completeFencedExecution(
  record: PantavionFencedExecutionRecord,
  fence: PantavionExecutionFence,
  input: { output: unknown; now: string },
): PantavionFencedExecutionRecord {
  assertExecutionFence(record, fence, input.now);
  const checkpoint = nextCheckpoint(record, "succeeded", {}, input.now);
  return {
    ...record,
    status: "succeeded",
    output: input.output,
    lastError: undefined,
    updatedAt: input.now,
    checkpoints: [...record.checkpoints, checkpoint],
    lease: {
      ...record.lease,
      ownerId: null,
      leaseExpiresAt: null,
      heartbeatAt: input.now,
    },
  };
}

export function failFencedExecution(
  record: PantavionFencedExecutionRecord,
  fence: PantavionExecutionFence,
  input: { error: string; now: string },
): PantavionFencedExecutionRecord {
  assertExecutionFence(record, fence, input.now);
  const maxAttempts = record.maxAttempts ?? 3;
  const exhausted = record.attempt >= maxAttempts;
  const checkpoint = nextCheckpoint(
    record,
    exhausted ? "failed" : "retry_scheduled",
    { error: input.error, attempt: record.attempt, maxAttempts },
    input.now,
  );

  return {
    ...record,
    status: exhausted ? "failed" : "queued",
    lastError: input.error,
    updatedAt: input.now,
    checkpoints: [...record.checkpoints, checkpoint],
    lease: {
      ...record.lease,
      ownerId: null,
      leaseExpiresAt: null,
      heartbeatAt: input.now,
    },
  };
}

export class PantavionMemoryFencedExecutionStore {
  private readonly records = new Map<string, PantavionFencedExecutionRecord>();

  async seed(record: PantavionDurableExecutionRecord | PantavionFencedExecutionRecord) {
    const fenced = "lease" in record ? record : createFencedExecutionRecord(record);
    this.records.set(record.executionId, fenced);
    return fenced;
  }

  async get(executionId: string) {
    return this.records.get(executionId) ?? null;
  }

  async claim(
    executionId: string,
    input: {
      ownerId: string;
      leaseMs: number;
      now: string;
      expectedStatuses?: PantavionDurableExecutionRecord["status"][];
    },
  ) {
    const current = this.records.get(executionId);
    if (!current) return null;
    const claim = claimExecutionLease(current, input);
    if (!claim) return null;
    this.records.set(executionId, claim.record);
    return claim;
  }

  async heartbeat(executionId: string, fence: PantavionExecutionFence, now: string, leaseMs: number) {
    const current = this.requireRecord(executionId);
    const updated = heartbeatExecutionLease(current, fence, { now, leaseMs });
    this.records.set(executionId, updated);
    return updated;
  }

  async checkpoint(
    executionId: string,
    fence: PantavionExecutionFence,
    label: string,
    state: Record<string, unknown>,
    now: string,
  ) {
    const current = this.requireRecord(executionId);
    const updated = appendFencedExecutionCheckpoint(current, fence, { label, state, now });
    this.records.set(executionId, updated);
    return updated;
  }

  async succeed(executionId: string, fence: PantavionExecutionFence, output: unknown, now: string) {
    const current = this.requireRecord(executionId);
    const updated = completeFencedExecution(current, fence, { output, now });
    this.records.set(executionId, updated);
    return updated;
  }

  async fail(executionId: string, fence: PantavionExecutionFence, error: string, now: string) {
    const current = this.requireRecord(executionId);
    const updated = failFencedExecution(current, fence, { error, now });
    this.records.set(executionId, updated);
    return updated;
  }

  private requireRecord(executionId: string) {
    const record = this.records.get(executionId);
    if (!record) throw new Error(`execution_not_found:${executionId}`);
    return record;
  }
}
