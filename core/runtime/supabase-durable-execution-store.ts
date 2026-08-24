import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PantavionDurableExecutionRecord,
  PantavionDurableExecutionStore,
  PantavionExecutionCheckpoint,
} from "./durable-execution";

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

export class PantavionSupabaseDurableExecutionStore implements PantavionDurableExecutionStore {
  /**
   * Atomically claims a queued execution through the server-only SQL function.
   * This prevents two scheduler ticks from starting the same internal agent.
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
