import "server-only";

import { getVercelOidcToken } from "@vercel/oidc";

const SCHEDULER_BRIDGE_URL =
  "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-vercel-scheduler-bridge";

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

export async function getPantavionSchedulerBridgeSnapshot(): Promise<PantavionSchedulerBridgeSnapshot> {
  const token = await getVercelOidcToken();
  if (!token) throw new Error("vercel_oidc_token_unavailable");

  const response = await fetch(SCHEDULER_BRIDGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "health_snapshot" }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | PantavionSchedulerBridgeSnapshot
    | { ok?: false; code?: string }
    | null;

  if (!response.ok || !payload || payload.ok !== true) {
    const code = payload && "code" in payload && payload.code
      ? payload.code
      : `scheduler_bridge_http_${response.status}`;
    throw new Error(code);
  }

  if (
    payload.capability !== "scheduler_health_snapshot" ||
    payload.transport !== "vercel_oidc_to_supabase_edge"
  ) {
    throw new Error("scheduler_bridge_invalid_response");
  }

  return payload;
}
