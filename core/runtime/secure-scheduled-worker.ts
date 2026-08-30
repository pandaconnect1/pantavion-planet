import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createScheduledRunKey } from "./scheduled-run-key";

export { createScheduledRunKey } from "./scheduled-run-key";

type ClaimResult = {
  acquired: boolean;
  reason: "lease_acquired" | "duplicate_run_key" | "active_lease";
  runId?: string;
  leaseToken?: string;
};

type ScheduledWorkerTaskResult = Record<string, unknown>;

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function runSecureScheduledWorker(
  workerName: string,
  task: () => Promise<ScheduledWorkerTaskResult>,
  options: { runKeyBucketMinutes?: number } = {},
) {
  const admin = createAdminClient();
  const runId = randomUUID();
  const leaseToken = randomUUID();
  const runKey = createScheduledRunKey(
    workerName,
    new Date(),
    options.runKeyBucketMinutes ?? 60,
  );

  const claim = await admin.rpc("pantavion_claim_scheduled_worker", {
    p_worker_name: workerName,
    p_run_id: runId,
    p_run_key: runKey,
    p_lease_token: leaseToken,
    p_lease_seconds: 240,
  });

  if (claim.error) throw claim.error;

  const result = claim.data as ClaimResult;
  if (!result?.acquired) {
    return {
      ok: true,
      executed: false,
      workerName,
      runKey,
      reason: result?.reason ?? "claim_rejected",
      runId: result?.runId ?? null,
    };
  }

  try {
    const output = await task();
    const finish = await admin.rpc("pantavion_finish_scheduled_worker", {
      p_worker_name: workerName,
      p_run_id: runId,
      p_lease_token: leaseToken,
      p_status: "succeeded",
      p_summary: output,
      p_error: null,
    });
    if (finish.error) throw finish.error;
    if (finish.data !== true) throw new Error("scheduled_worker_finish_not_recorded");

    return {
      ok: true,
      executed: true,
      workerName,
      runKey,
      runId,
      output,
    };
  } catch (error) {
    const failure = await admin.rpc("pantavion_finish_scheduled_worker", {
      p_worker_name: workerName,
      p_run_id: runId,
      p_lease_token: leaseToken,
      p_status: "failed",
      p_summary: { failed: true },
      p_error: messageFor(error),
    });

    if (failure.error) {
      console.error("scheduled_worker_failure_audit_failed", {
        workerName,
        runId,
        auditError: messageFor(failure.error),
      });
    }

    throw error;
  }
}
