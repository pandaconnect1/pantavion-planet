import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PantavionDurableExecutionRecord,
  PantavionDurableExecutionStore,
  PantavionExecutionCheckpoint,
} from "./durable-execution";
import {
  PantavionStaleExecutionFenceError,
  type PantavionExecutionFence,
} from "./durable-execution-fencing";

type ExecutionRow = {
  execution_id: string;
  idempotency_key: string;
  task_name: string | null;
  status: PantavionDurableExecutionRecord["status"];
  attempt: number;
  max_attempts: number;
  input: unknown;
  output: unknown;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type CheckpointRow = {
  checkpoint_id: string;
  execution_id: string;
  sequence: number;
  label: string;
  state: Record<string, unknown> | null;
  created_at: string;
};

type FencedClaimRpcData = {
  executionId?: unknown;
  ownerId?: unknown;
  fencingToken?: unknown;
  leaseExpiresAt?: unknown;
  heartbeatAt?: unknown;
  attempt?: unknown;
};

const MIN_LEASE_MS = 5_000;
const MAX_LEASE_MS = 300_000;

function checkpointFromRow(row: CheckpointRow): PantavionExecutionCheckpoint {
  return {
    id: row.checkpoint_id,
    at: row.created_at,
    label: row.label,
    state: row.state ?? {},
  };
}

function recordFromRow(row: ExecutionRow, checkpoints: CheckpointRow[]): PantavionDurableExecutionRecord {
  return {
    executionId: row.execution_id,
    idempotencyKey: row.idempotency_key,
    taskName: row.task_name ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attempt: row.attempt,
    maxAttempts: row.max_attempts,
    input: row.input ?? undefined,
    output: row.output ?? undefined,
    checkpoints: checkpoints
      .filter((checkpoint) => checkpoint.execution_id === row.execution_id)
      .sort((a, b) => a.sequence - b.sequence)
      .map(checkpointFromRow),
    lastError: row.last_error ?? undefined,
  };
}

function leaseSeconds(leaseMs: number) {
  if (!Number.isFinite(leaseMs)) throw new Error("lease_duration_invalid");
  const bounded = Math.max(MIN_LEASE_MS, Math.min(MAX_LEASE_MS, Math.floor(leaseMs)));
  return Math.ceil(bounded / 1000);
}

function parseFence(executionId: string, ownerId: string, data: unknown): PantavionExecutionFence | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const payload = data as FencedClaimRpcData;
  const token = Number(payload.fencingToken);
  if (
    payload.executionId !== executionId ||
    payload.ownerId !== ownerId ||
    !Number.isSafeInteger(token) ||
    token < 1
  ) {
    throw new Error("durable_fenced_claim_invalid_response");
  }
  return { executionId, ownerId, fencingToken: token };
}

function requireFence(fence: PantavionExecutionFence) {
  const ownerId = fence.ownerId.trim();
  if (!fence.executionId.trim()) throw new Error("execution_id_required");
  if (!ownerId) throw new Error("lease_owner_required");
  if (!Number.isSafeInteger(fence.fencingToken) || fence.fencingToken < 1) {
    throw new Error("fencing_token_invalid");
  }
  return { executionId: fence.executionId, ownerId, fencingToken: fence.fencingToken };
}

export class PantavionSupabaseDurableExecutionStore implements PantavionDurableExecutionStore {
  /**
   * Legacy atomic claim retained for deployment compatibility.
   * Worker runtimes must use claimFenced() so every later mutation is tied to a lease owner/token.
   */
  async claim(
    executionId: string,
    expectedStatuses: PantavionDurableExecutionRecord["status"][] = ["queued"],
  ) {
    const admin = createAdminClient();
    const claimed = await admin.rpc("pantavion_claim_durable_execution", {
      p_execution_id: executionId,
      p_expected_statuses: expectedStatuses,
    });

    if (claimed.error) throw claimed.error;
    if (claimed.data !== true) return null;

    return this.get(executionId);
  }

  async claimFenced(
    executionId: string,
    ownerId: string,
    leaseMs = 120_000,
    expectedStatuses: PantavionDurableExecutionRecord["status"][] = ["queued", "planned"],
  ) {
    const cleanExecutionId = executionId.trim();
    const cleanOwnerId = ownerId.trim();
    if (!cleanExecutionId) throw new Error("execution_id_required");
    if (!cleanOwnerId) throw new Error("lease_owner_required");

    const admin = createAdminClient();
    const claimed = await admin.rpc("pantavion_claim_durable_execution_fenced", {
      p_execution_id: cleanExecutionId,
      p_lease_owner: cleanOwnerId,
      p_lease_seconds: leaseSeconds(leaseMs),
      p_expected_statuses: expectedStatuses,
    });

    if (claimed.error) throw claimed.error;
    const fence = parseFence(cleanExecutionId, cleanOwnerId, claimed.data);
    if (!fence) return null;

    const record = await this.get(cleanExecutionId);
    if (!record) throw new Error("claimed_execution_not_found");
    return { record, fence };
  }

  async heartbeatFenced(fence: PantavionExecutionFence, leaseMs = 120_000) {
    const checked = requireFence(fence);
    const admin = createAdminClient();
    const result = await admin.rpc("pantavion_heartbeat_durable_execution_fenced", {
      p_execution_id: checked.executionId,
      p_lease_owner: checked.ownerId,
      p_fencing_token: checked.fencingToken,
      p_lease_seconds: leaseSeconds(leaseMs),
    });

    if (result.error) throw result.error;
    if (result.data !== true) throw new PantavionStaleExecutionFenceError();
    return true;
  }

  async checkpointFenced(
    fence: PantavionExecutionFence,
    label: string,
    state: Record<string, unknown> = {},
  ) {
    const checked = requireFence(fence);
    const admin = createAdminClient();
    const result = await admin.rpc("pantavion_append_durable_checkpoint_fenced", {
      p_execution_id: checked.executionId,
      p_lease_owner: checked.ownerId,
      p_fencing_token: checked.fencingToken,
      p_label: label,
      p_state: state,
    });

    if (result.error) throw result.error;
    if (typeof result.data !== "string" || !result.data) {
      throw new PantavionStaleExecutionFenceError();
    }

    const record = await this.get(checked.executionId);
    if (!record) throw new Error("checkpointed_execution_not_found");
    return record;
  }

  async finishFencedSuccess(fence: PantavionExecutionFence, output: unknown) {
    return this.finishFenced(fence, true, output, null);
  }

  async finishFencedFailure(fence: PantavionExecutionFence, error: string) {
    const message = error.trim();
    if (!message) throw new Error("finish_error_required");
    return this.finishFenced(fence, false, null, message);
  }

  private async finishFenced(
    fence: PantavionExecutionFence,
    succeeded: boolean,
    output: unknown,
    error: string | null,
  ) {
    const checked = requireFence(fence);
    const admin = createAdminClient();
    const result = await admin.rpc("pantavion_finish_durable_execution_fenced", {
      p_execution_id: checked.executionId,
      p_lease_owner: checked.ownerId,
      p_fencing_token: checked.fencingToken,
      p_succeeded: succeeded,
      p_output: output ?? null,
      p_error: error,
    });

    if (result.error) throw result.error;
    if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) {
      throw new PantavionStaleExecutionFenceError();
    }

    const record = await this.get(checked.executionId);
    if (!record) throw new Error("finished_execution_not_found");
    return record;
  }

  async get(executionId: string) {
    const admin = createAdminClient();
    const execution = await admin
      .from("durable_executions")
      .select("execution_id,idempotency_key,task_name,status,attempt,max_attempts,input,output,last_error,created_at,updated_at")
      .eq("execution_id", executionId)
      .maybeSingle();

    if (execution.error) throw execution.error;
    if (!execution.data) return null;

    const checkpoints = await admin
      .from("durable_execution_checkpoints")
      .select("checkpoint_id,execution_id,sequence,label,state,created_at")
      .eq("execution_id", executionId)
      .order("sequence", { ascending: true });
    if (checkpoints.error) throw checkpoints.error;

    return recordFromRow(execution.data as ExecutionRow, (checkpoints.data ?? []) as CheckpointRow[]);
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    const admin = createAdminClient();
    const execution = await admin
      .from("durable_executions")
      .select("execution_id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (execution.error) throw execution.error;
    if (!execution.data) return null;
    return this.get(String(execution.data.execution_id));
  }

  async put(record: PantavionDurableExecutionRecord) {
    const admin = createAdminClient();
    const upsert = await admin.from("durable_executions").upsert(
      {
        execution_id: record.executionId,
        idempotency_key: record.idempotencyKey,
        task_name: record.taskName ?? null,
        status: record.status,
        attempt: record.attempt,
        max_attempts: record.maxAttempts ?? 3,
        input: record.input ?? null,
        output: record.output ?? null,
        last_error: record.lastError ?? null,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      },
      { onConflict: "execution_id" },
    );
    if (upsert.error) throw upsert.error;

    if (record.checkpoints.length === 0) return;
    const checkpointRows = record.checkpoints.map((checkpoint, index) => ({
      checkpoint_id: checkpoint.id,
      execution_id: record.executionId,
      sequence: index + 1,
      label: checkpoint.label,
      state: checkpoint.state,
      created_at: checkpoint.at,
    }));
    const checkpoints = await admin
      .from("durable_execution_checkpoints")
      .upsert(checkpointRows, { onConflict: "checkpoint_id" });
    if (checkpoints.error) throw checkpoints.error;
  }

  async list(limit = 100) {
    const admin = createAdminClient();
    const executions = await admin
      .from("durable_executions")
      .select("execution_id,idempotency_key,task_name,status,attempt,max_attempts,input,output,last_error,created_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(Math.max(1, Math.min(limit, 500)));
    if (executions.error) throw executions.error;

    const rows = (executions.data ?? []) as ExecutionRow[];
    const ids = rows.map((row) => row.execution_id);
    if (ids.length === 0) return [];

    const checkpoints = await admin
      .from("durable_execution_checkpoints")
      .select("checkpoint_id,execution_id,sequence,label,state,created_at")
      .in("execution_id", ids)
      .order("sequence", { ascending: true });
    if (checkpoints.error) throw checkpoints.error;

    const checkpointRows = (checkpoints.data ?? []) as CheckpointRow[];
    return rows.map((row) => recordFromRow(row, checkpointRows));
  }
}

export function createSupabaseDurableExecutionStore() {
  return new PantavionSupabaseDurableExecutionStore();
}
