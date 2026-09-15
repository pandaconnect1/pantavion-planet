import "server-only";

import { getVercelOidcToken } from "@vercel/oidc";

const SCHEDULER_BRIDGE_URL =
  "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-vercel-scheduler-bridge";
const WORKER_NAME = "pantavion-intelligence-5m";

export type PantavionSchedulerBridgeSnapshot = {
  ok: true;
  capability: "scheduler_health_snapshot";
  transport: "vercel_oidc_to_supabase_edge";
  worker: {
    name: string;
    totalRuns: number;
    lastRunKey: string | null;
    lastStatus: string | null;
    lastStartedAt: string | null;
    lastFinishedAt: string | null;
  };
  internalScheduler: {
    name: string;
    dispatchCount: number;
    lastBucketStart: string | null;
    lastDispatchedAt: string | null;
    lastRequestQueued: boolean;
    lastDispatchFailed: boolean;
  };
  recovery: {
    taskName: string;
    totalPartitions: number;
    succeeded: number;
    failed: number;
    active: number;
    other: number;
  };
  privacy: string;
};

export type PantavionRecoveryMaterializationReport = {
  ok: true;
  marker: "pantavion_recovery_partition_atomic_materialization_v1";
  sourceRecordCount: 82413;
  partitionCount: 165;
  existingPartitions: number;
  createdPartitions: number;
  repairedCheckpoints: number;
  remainingPartitions: number;
  limit: number;
  productionWriteAuthority: false;
  releaseAuthority: false;
};

type PantavionRecoveryMaterializationBridgeResponse = {
  ok: true;
  capability: "recovery_partition_materialization";
  transport: "vercel_oidc_to_supabase_edge";
  report: PantavionRecoveryMaterializationReport;
};

export type PantavionSchedulerBridgeClaim = {
  ok: true;
  capability: "scheduled_worker_claim";
  acquired: boolean;
  reason: string;
  existingRunId: string | null;
};

type PantavionSchedulerBridgeFinish = {
  ok: true;
  capability: "scheduled_worker_finish";
  recorded: true;
  status: "succeeded" | "failed";
};

async function bridgeRequest<T extends { ok: true; capability: string }>(
  body: Record<string, unknown>,
): Promise<T> {
  const token = await getVercelOidcToken();
  if (!token) throw new Error("vercel_oidc_token_unavailable");

  const response = await fetch(SCHEDULER_BRIDGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | T
    | { ok?: false; code?: string }
    | null;

  if (!response.ok || !payload || payload.ok !== true) {
    const code = payload && "code" in payload && payload.code
      ? payload.code
      : `scheduler_bridge_http_${response.status}`;
    throw new Error(code);
  }

  return payload;
}

export async function getPantavionSchedulerBridgeSnapshot(): Promise<PantavionSchedulerBridgeSnapshot> {
  const payload = await bridgeRequest<PantavionSchedulerBridgeSnapshot>({
    action: "health_snapshot",
  });
  if (
    payload.capability !== "scheduler_health_snapshot" ||
    payload.transport !== "vercel_oidc_to_supabase_edge"
  ) {
    throw new Error("scheduler_bridge_invalid_response");
  }
  return payload;
}

export async function materializePantavionRecoveryPartitionsViaOidc(
  limit = 25,
): Promise<PantavionRecoveryMaterializationReport> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) {
    throw new Error("recovery_partition_materialization_limit_invalid");
  }

  const payload = await bridgeRequest<PantavionRecoveryMaterializationBridgeResponse>({
    action: "materialize_recovery_partitions",
    limit,
  });
  if (
    payload.capability !== "recovery_partition_materialization" ||
    payload.transport !== "vercel_oidc_to_supabase_edge" ||
    payload.report.ok !== true ||
    payload.report.marker !== "pantavion_recovery_partition_atomic_materialization_v1" ||
    payload.report.partitionCount !== 165 ||
    payload.report.sourceRecordCount !== 82413 ||
    payload.report.productionWriteAuthority !== false ||
    payload.report.releaseAuthority !== false
  ) {
    throw new Error("recovery_partition_materialization_invalid_response");
  }

  return payload.report;
}

export async function claimPantavionScheduledWorkerViaOidc(input: {
  runId: string;
  runKey: string;
  leaseToken: string;
}): Promise<PantavionSchedulerBridgeClaim> {
  const payload = await bridgeRequest<PantavionSchedulerBridgeClaim>({
    action: "scheduled_claim",
    workerName: WORKER_NAME,
    runId: input.runId,
    runKey: input.runKey,
    leaseToken: input.leaseToken,
  });
  if (payload.capability !== "scheduled_worker_claim") {
    throw new Error("scheduler_bridge_claim_invalid_response");
  }
  return payload;
}

export async function finishPantavionScheduledWorkerViaOidc(input: {
  runId: string;
  leaseToken: string;
  status: "succeeded" | "failed";
  summary: Record<string, unknown>;
  error?: string | null;
}): Promise<void> {
  const payload = await bridgeRequest<PantavionSchedulerBridgeFinish>({
    action: "scheduled_finish",
    workerName: WORKER_NAME,
    runId: input.runId,
    leaseToken: input.leaseToken,
    status: input.status,
    summary: input.summary,
    error: input.error ?? null,
  });
  if (
    payload.capability !== "scheduled_worker_finish" ||
    payload.recorded !== true ||
    payload.status !== input.status
  ) {
    throw new Error("scheduler_bridge_finish_invalid_response");
  }
}
