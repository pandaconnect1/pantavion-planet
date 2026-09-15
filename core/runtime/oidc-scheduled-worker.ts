import "server-only";

import { randomUUID } from "node:crypto";
import {
  claimPantavionScheduledWorkerViaOidc,
  finishPantavionScheduledWorkerViaOidc,
} from "@/lib/supabase/oidc-scheduler-bridge";
import { createScheduledRunKey } from "./scheduled-run-key";

const WORKER_NAME = "pantavion-intelligence-5m";

function safeError(error: unknown) {
  const value = error instanceof Error ? error.message : String(error);
  return value.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 200) || "unknown_error";
}

export async function runOidcScheduledWorker(
  task: () => Promise<Record<string, unknown>>,
  options: { runKeyBucketMinutes?: number } = {},
) {
  const runId = randomUUID();
  const leaseToken = randomUUID();
  const runKey = createScheduledRunKey(
    WORKER_NAME,
    new Date(),
    options.runKeyBucketMinutes ?? 5,
  );

  const claim = await claimPantavionScheduledWorkerViaOidc({
    runId,
    runKey,
    leaseToken,
  });

  if (!claim.acquired) {
    return {
      ok: true,
      executed: false,
      workerName: WORKER_NAME,
      runKey,
      reason: claim.reason,
      runId: claim.existingRunId,
      transport: "vercel_oidc_to_supabase_edge",
      secretless: true,
    };
  }

  try {
    const output = await task();
    await finishPantavionScheduledWorkerViaOidc({
      runId,
      leaseToken,
      status: "succeeded",
      summary: {
        ok: output.ok === true,
        mode: "secretless_oidc_degraded",
        intelligenceTickExecuted: output.intelligenceTickExecuted === true,
        pendingCapabilities: output.pendingCapabilities ?? [],
      },
    });

    return {
      ok: true,
      executed: true,
      workerName: WORKER_NAME,
      runKey,
      runId,
      output,
      transport: "vercel_oidc_to_supabase_edge",
      secretless: true,
    };
  } catch (error) {
    const message = safeError(error);
    try {
      await finishPantavionScheduledWorkerViaOidc({
        runId,
        leaseToken,
        status: "failed",
        summary: {
          ok: false,
          mode: "secretless_oidc_degraded",
          failureRecorded: true,
        },
        error: message,
      });
    } catch {
      // Preserve the original failure. A failed audit write is surfaced by the caller's runtime error path.
    }
    throw error;
  }
}
