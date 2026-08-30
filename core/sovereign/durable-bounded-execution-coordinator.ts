import { createHash } from "node:crypto";

import type {
  PantavionDurableExecutionRecord,
  PantavionExecutionCheckpoint,
} from "../runtime/durable-execution";
import type { PantavionExecutionFence } from "../runtime/durable-execution-fencing";
import {
  createBoundedExecutionCheckpoint,
  restoreBoundedExecutionSession,
  verifyBoundedExecutionCheckpoint,
  verifyBoundedExecutionSession,
  type BoundedExecutionCheckpoint,
  type BoundedExecutionSession,
} from "./bounded-execution-runtime";

export const durableBoundedCheckpointLabel =
  "pantavion_bounded_execution_checkpoint_v1";

export interface DurableBoundedExecutionBinding {
  executionId: string;
  idempotencyKey: string;
  sessionId: string;
  intentId: string;
  agentId: string;
  planFingerprint: string;
}

export interface DurableBoundedExecutionCheckpointEnvelope {
  version: "pantavion_durable_bounded_checkpoint_v1";
  executionId: string;
  idempotencyKey: string;
  operationId: string;
  checkpointDigest: string;
  checkpoint: BoundedExecutionCheckpoint;
  executionAuthority: false;
  releaseAuthority: false;
}

export interface DurableBoundedExecutionCheckpointStore {
  get(executionId: string): Promise<PantavionDurableExecutionRecord | null>;
  heartbeatFenced(
    fence: PantavionExecutionFence,
    leaseMs?: number,
  ): Promise<unknown>;
  checkpointFenced(
    fence: PantavionExecutionFence,
    label: string,
    state?: Record<string, unknown>,
  ): Promise<PantavionDurableExecutionRecord>;
}

export interface PersistFencedBoundedExecutionCheckpointInput {
  binding: DurableBoundedExecutionBinding;
  fence: PantavionExecutionFence;
  operationId: string;
  session: BoundedExecutionSession;
  observedAt: string;
  leaseMs?: number;
}

export interface PersistedFencedBoundedExecutionCheckpoint {
  record: PantavionDurableExecutionRecord;
  checkpoint: BoundedExecutionCheckpoint;
  deduplicated: boolean;
}

export interface TakeoverFencedBoundedExecutionInput {
  binding: DurableBoundedExecutionBinding;
  fence: PantavionExecutionFence;
  operationId: string;
  observedAt: string;
  leaseMs?: number;
}

export interface TakenOverFencedBoundedExecution
  extends PersistedFencedBoundedExecutionCheckpoint {
  session: BoundedExecutionSession;
}

interface ParsedDurableCheckpoint {
  durableCheckpoint: PantavionExecutionCheckpoint;
  envelope: DurableBoundedExecutionCheckpointEnvelope;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function digestSession(session: BoundedExecutionSession): string {
  return sha256(JSON.stringify(session));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireIdentity(value: string, reason: string): string {
  const clean = value.trim();
  if (!clean) throw new Error(reason);
  return clean;
}

function requireFiniteTime(value: string, reason: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(reason);
  return parsed;
}

function verifyCheckpointSafely(
  checkpoint: BoundedExecutionCheckpoint,
  previous?: BoundedExecutionCheckpoint,
): { valid: boolean; reasons: string[] } {
  try {
    return verifyBoundedExecutionCheckpoint(checkpoint, previous);
  } catch (error) {
    return {
      valid: false,
      reasons: [
        "checkpoint_shape_invalid:" +
          (error instanceof Error ? error.message : String(error)),
      ],
    };
  }
}

function parseEnvelope(
  durableCheckpoint: PantavionExecutionCheckpoint,
): DurableBoundedExecutionCheckpointEnvelope {
  if (!durableCheckpoint.id.trim()) {
    throw new Error("durable_checkpoint_id_invalid");
  }
  requireFiniteTime(durableCheckpoint.at, "durable_checkpoint_time_invalid");
  const state = durableCheckpoint.state;
  if (!isRecord(state)) throw new Error("durable_checkpoint_state_invalid");
  if (state.version !== "pantavion_durable_bounded_checkpoint_v1") {
    throw new Error("durable_checkpoint_version_invalid");
  }
  if (state.releaseAuthority !== false) {
    throw new Error("durable_checkpoint_release_authority_present");
  }
  if (state.executionAuthority !== false) {
    throw new Error("durable_checkpoint_execution_authority_present");
  }
  if (
    typeof state.executionId !== "string" ||
    typeof state.idempotencyKey !== "string" ||
    typeof state.operationId !== "string" ||
    typeof state.checkpointDigest !== "string" ||
    !isRecord(state.checkpoint)
  ) {
    throw new Error("durable_checkpoint_envelope_invalid");
  }

  const checkpoint = state.checkpoint as unknown as BoundedExecutionCheckpoint;
  const verification = verifyCheckpointSafely(checkpoint);
  if (!verification.valid) {
    throw new Error(
      "durable_checkpoint_payload_invalid:" + verification.reasons.join(","),
    );
  }
  if (state.checkpointDigest !== checkpoint.checkpointDigest) {
    throw new Error("durable_checkpoint_digest_mismatch");
  }

  return {
    version: "pantavion_durable_bounded_checkpoint_v1",
    executionId: requireIdentity(
      state.executionId,
      "durable_checkpoint_execution_id_invalid",
    ),
    idempotencyKey: requireIdentity(
      state.idempotencyKey,
      "durable_checkpoint_idempotency_key_invalid",
    ),
    operationId: requireIdentity(
      state.operationId,
      "durable_checkpoint_operation_id_invalid",
    ),
    checkpointDigest: state.checkpointDigest,
    checkpoint,
    executionAuthority: false,
    releaseAuthority: false,
  };
}

function readPersistedCheckpointChain(
  record: PantavionDurableExecutionRecord,
): ParsedDurableCheckpoint[] {
  const parsed: ParsedDurableCheckpoint[] = [];
  const operationIds = new Set<string>();
  let previous: BoundedExecutionCheckpoint | undefined;
  let previousDurableTime = Number.NEGATIVE_INFINITY;

  for (const durableCheckpoint of record.checkpoints) {
    if (durableCheckpoint.label !== durableBoundedCheckpointLabel) continue;
    const envelope = parseEnvelope(durableCheckpoint);
    if (
      envelope.executionId !== record.executionId ||
      envelope.idempotencyKey !== record.idempotencyKey
    ) {
      throw new Error("durable_checkpoint_record_binding_mismatch");
    }
    if (operationIds.has(envelope.operationId)) {
      throw new Error("durable_checkpoint_operation_replayed");
    }
    const verification = verifyCheckpointSafely(envelope.checkpoint, previous);
    if (!verification.valid) {
      throw new Error(
        "durable_checkpoint_chain_invalid:" + verification.reasons.join(","),
      );
    }
    const durableTime = requireFiniteTime(
      durableCheckpoint.at,
      "durable_checkpoint_time_invalid",
    );
    if (durableTime < previousDurableTime) {
      throw new Error("durable_checkpoint_time_regressed");
    }

    operationIds.add(envelope.operationId);
    parsed.push({ durableCheckpoint, envelope });
    previous = envelope.checkpoint;
    previousDurableTime = durableTime;
  }
  return parsed;
}

function assertFence(fence: PantavionExecutionFence): void {
  requireIdentity(fence.executionId, "execution_id_required");
  requireIdentity(fence.ownerId, "lease_owner_required");
  if (!Number.isSafeInteger(fence.fencingToken) || fence.fencingToken < 1) {
    throw new Error("fencing_token_invalid");
  }
}

function assertBinding(
  binding: DurableBoundedExecutionBinding,
  record: PantavionDurableExecutionRecord,
  fence: PantavionExecutionFence,
  session: BoundedExecutionSession,
): void {
  requireIdentity(binding.executionId, "binding_execution_id_required");
  requireIdentity(binding.idempotencyKey, "binding_idempotency_key_required");
  requireIdentity(binding.sessionId, "binding_session_id_required");
  requireIdentity(binding.intentId, "binding_intent_id_required");
  requireIdentity(binding.agentId, "binding_agent_id_required");
  requireIdentity(binding.planFingerprint, "binding_plan_fingerprint_required");
  assertFence(fence);

  if (
    binding.executionId !== record.executionId ||
    binding.idempotencyKey !== record.idempotencyKey ||
    binding.executionId !== fence.executionId
  ) {
    throw new Error("durable_execution_binding_mismatch");
  }
  if (
    record.status !== "running" ||
    !Number.isSafeInteger(record.attempt) ||
    record.attempt < 1 ||
    (record.maxAttempts !== undefined &&
      (!Number.isSafeInteger(record.maxAttempts) ||
        record.maxAttempts < record.attempt))
  ) {
    throw new Error("durable_execution_not_claimed");
  }
  if (
    session.id !== binding.sessionId ||
    session.intentId !== binding.intentId ||
    session.agent.id !== binding.agentId ||
    session.planFingerprint !== binding.planFingerprint
  ) {
    throw new Error("bounded_session_binding_mismatch");
  }
  const verification = verifyBoundedExecutionSession(session);
  if (!verification.valid) {
    throw new Error(
      "bounded_session_invalid:" + verification.reasons.join(","),
    );
  }
}

function createEnvelope(
  binding: DurableBoundedExecutionBinding,
  operationId: string,
  checkpoint: BoundedExecutionCheckpoint,
): DurableBoundedExecutionCheckpointEnvelope {
  return {
    version: "pantavion_durable_bounded_checkpoint_v1",
    executionId: binding.executionId,
    idempotencyKey: binding.idempotencyKey,
    operationId,
    checkpointDigest: checkpoint.checkpointDigest,
    checkpoint,
    executionAuthority: false,
    releaseAuthority: false,
  };
}

function confirmPersistedOperation(
  record: PantavionDurableExecutionRecord,
  operationId: string,
  expectedDigest: string,
): BoundedExecutionCheckpoint {
  const chain = readPersistedCheckpointChain(record);
  const persisted = chain.find(
    (candidate) => candidate.envelope.operationId === operationId,
  );
  if (!persisted) throw new Error("durable_checkpoint_not_persisted");
  if (persisted.envelope.checkpointDigest !== expectedDigest) {
    throw new Error("durable_checkpoint_persisted_digest_mismatch");
  }
  return persisted.envelope.checkpoint;
}

export async function persistFencedBoundedExecutionCheckpoint(
  store: DurableBoundedExecutionCheckpointStore,
  input: PersistFencedBoundedExecutionCheckpointInput,
): Promise<PersistedFencedBoundedExecutionCheckpoint> {
  const operationId = requireIdentity(
    input.operationId,
    "durable_checkpoint_operation_id_required",
  );
  requireFiniteTime(input.observedAt, "durable_checkpoint_observed_at_invalid");
  assertFence(input.fence);
  await store.heartbeatFenced(input.fence, input.leaseMs);

  const record = await store.get(input.binding.executionId);
  if (!record) throw new Error("durable_execution_not_found");
  assertBinding(input.binding, record, input.fence, input.session);
  const chain = readPersistedCheckpointChain(record);
  const existing = chain.find(
    (candidate) => candidate.envelope.operationId === operationId,
  );
  if (existing) {
    const checkpoint = existing.envelope.checkpoint;
    if (
      checkpoint.sessionDigest !== digestSession(input.session) ||
      checkpoint.workerId !== input.fence.ownerId ||
      checkpoint.fencingToken !== input.fence.fencingToken
    ) {
      throw new Error("durable_checkpoint_idempotency_conflict");
    }
    return { record, checkpoint, deduplicated: true };
  }

  const previous = chain.at(-1)?.envelope.checkpoint;
  const checkpoint = createBoundedExecutionCheckpoint({
    session: input.session,
    sequence: previous ? previous.sequence + 1 : 1,
    fencingToken: input.fence.fencingToken,
    workerId: input.fence.ownerId,
    observedAt: input.observedAt,
    previous,
  });
  const envelope = createEnvelope(input.binding, operationId, checkpoint);
  const updated = await store.checkpointFenced(
    input.fence,
    durableBoundedCheckpointLabel,
    envelope as unknown as Record<string, unknown>,
  );
  const confirmed = confirmPersistedOperation(
    updated,
    operationId,
    checkpoint.checkpointDigest,
  );
  return { record: updated, checkpoint: confirmed, deduplicated: false };
}

export async function takeoverFencedBoundedExecutionSession(
  store: DurableBoundedExecutionCheckpointStore,
  input: TakeoverFencedBoundedExecutionInput,
): Promise<TakenOverFencedBoundedExecution> {
  assertFence(input.fence);
  await store.heartbeatFenced(input.fence, input.leaseMs);
  const record = await store.get(input.binding.executionId);
  if (!record) throw new Error("durable_execution_not_found");
  const chain = readPersistedCheckpointChain(record);
  const previous = chain.at(-1)?.envelope.checkpoint;
  if (!previous) throw new Error("durable_bounded_checkpoint_missing");
  assertBinding(input.binding, record, input.fence, previous.session);

  const persisted = await persistFencedBoundedExecutionCheckpoint(store, {
    binding: input.binding,
    fence: input.fence,
    operationId: input.operationId,
    session: previous.session,
    observedAt: input.observedAt,
    leaseMs: input.leaseMs,
  });
  const session = restoreBoundedExecutionSession(persisted.checkpoint, {
    sessionId: input.binding.sessionId,
    intentId: input.binding.intentId,
    agentId: input.binding.agentId,
    planFingerprint: input.binding.planFingerprint,
    trustedCheckpointDigest: persisted.checkpoint.checkpointDigest,
    minimumSequence: persisted.checkpoint.sequence,
    minimumFencingToken: input.fence.fencingToken,
  });
  return { ...persisted, session };
}
