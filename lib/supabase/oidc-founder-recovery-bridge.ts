import "server-only";

import { getVercelOidcToken } from "@vercel/oidc";

const FOUNDER_RECOVERY_BRIDGE_URL =
  "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-vercel-founder-recovery-bridge";

export interface PantavionRecoveryStageCounts {
  planned: number;
  queued: number;
  running: number;
  paused: number;
  succeeded: number;
  failed: number;
}

export interface PantavionRecoveryFounderSnapshot {
  ok: true;
  marker: "pantavion_recovery_founder_snapshot_v1";
  expectedRecords: number;
  expectedPartitions: number;
  catalogRecords: number;
  stages: Record<string, PantavionRecoveryStageCounts>;
  reviewStatus: Record<string, number>;
  runtimeLanes: Record<string, number>;
  modules: Array<{
    module: string;
    total: number;
    classifiedCandidates: number;
    governedHold: number;
    recursiveQuarantine: number;
  }>;
  gaps: {
    missingModule: number;
    missingSubsystem: number;
    missingCapability: number;
    missingCanonicalTarget: number;
    reviewRequired: number;
  };
  generatedAt: string;
}

export async function getPantavionRecoveryFounderSnapshot(): Promise<PantavionRecoveryFounderSnapshot> {
  const token = await getVercelOidcToken();
  if (!token) throw new Error("vercel_oidc_token_unavailable");

  const response = await fetch(FOUNDER_RECOVERY_BRIDGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "snapshot" }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        capability?: string;
        transport?: string;
        snapshot?: PantavionRecoveryFounderSnapshot;
        code?: string;
      }
    | null;

  if (
    !response.ok ||
    !payload ||
    payload.ok !== true ||
    payload.capability !== "founder_recovery_snapshot" ||
    payload.transport !== "vercel_oidc_to_supabase_edge" ||
    !payload.snapshot ||
    payload.snapshot.ok !== true ||
    payload.snapshot.marker !== "pantavion_recovery_founder_snapshot_v1"
  ) {
    throw new Error(payload?.code ?? `founder_recovery_bridge_http_${response.status}`);
  }

  return payload.snapshot;
}
