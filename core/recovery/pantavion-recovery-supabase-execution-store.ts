import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { PantavionSupabaseDurableExecutionStore } from "../runtime/supabase-durable-execution-store";
import type { PantavionDurableExecutionRecord } from "../runtime/durable-execution";

type RecoveryExecutionRow = {
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

function recordFromRow(row: RecoveryExecutionRow): PantavionDurableExecutionRecord {
  return {
    executionId: row.execution_id,
    idempotencyKey: row.idempotency_key,
    taskName: row.task_name ?? undefined,
    status: row.status,
    attempt: row.attempt,
    maxAttempts: row.max_attempts,
    input: row.input ?? undefined,
    output: row.output ?? undefined,
    lastError: row.last_error ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    checkpoints: [],
  };
}

export class PantavionRecoverySupabaseExecutionStore extends PantavionSupabaseDurableExecutionStore {
  async listByTaskName(taskName: string, _limit = 500) {
    const cleanTaskName = taskName.trim();
    if (!cleanTaskName) throw new Error("recovery_store_task_name_required");

    const admin = createAdminClient();
    const result = await admin
      .from("durable_executions")
      .select("execution_id,idempotency_key,task_name,status,attempt,max_attempts,input,output,last_error,created_at,updated_at")
      .eq("task_name", cleanTaskName)
      .order("execution_id", { ascending: true })
      .limit(500);

    if (result.error) throw result.error;
    return ((result.data ?? []) as RecoveryExecutionRow[]).map(recordFromRow);
  }
}
