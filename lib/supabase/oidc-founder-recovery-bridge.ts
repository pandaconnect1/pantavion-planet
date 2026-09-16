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

export interface PantavionRecoveryAgentBundleCounts extends PantavionRecoveryStageCounts {
  total: number;
}

export interface PantavionRecoveryFounderSnapshot {
  ok: true;
  marker: "pantavion_recovery_founder_snapshot_v1";
  expectedRecords: number;
  expectedPartitions: number;
  catalogRecords: number;
  stages: Record<string, PantavionRecoveryStageCounts>;
  agentBundles: PantavionRecoveryAgentBundleCounts;
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

export type PantavionRecoveryFounderAction =
  | "pause_stage"
  | "resume_stage"
  | "retry_failed"
  | "pause_all"
  | "resume_all";

async function founderBridgeRequest(body: Record<string, unknown>) {
  const token = await getVercelOidcToken();
  if (!token) throw new Error("vercel_oidc_token_unavailable");

  const response = await fetch(FOUNDER_RECOVERY_BRIDGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !payload || payload.ok !== true) {
    throw new Error(
      typeof payload?.code === "string"
        ? payload.code
        : `founder_recovery_bridge_http_${response.status}`,
    );
  }
  return payload;
}

export async function getPantavionRecoveryFounderSnapshot(): Promise<PantavionRecoveryFounderSnapshot> {
  const payload = await founderBridgeRequest({ action: "snapshot" });
  if (
    payload.capability !== "founder_recovery_snapshot" ||
    payload.transport !== "vercel_oidc_to_supabase_edge" ||
    !payload.snapshot ||
    typeof payload.snapshot !== "object" ||
    (payload.snapshot as PantavionRecoveryFounderSnapshot).ok !== true ||
    (payload.snapshot as PantavionRecoveryFounderSnapshot).marker !== "pantavion_recovery_founder_snapshot_v1"
  ) {
    throw new Error("founder_recovery_snapshot_invalid_response");
  }
  return payload.snapshot as PantavionRecoveryFounderSnapshot;
}

export async function runPantavionRecoveryFounderControl(input: {
  action: PantavionRecoveryFounderAction;
  stage?: "classify" | "canonicalize" | "route" | "audit" | "work_unit_generation";
}) {
  const payload = await founderBridgeRequest({
    action: "control",
    actionName: input.action,
    stage: input.stage ?? null,
  });
  if (
    payload.capability !== "founder_recovery_control" ||
    payload.transport !== "vercel_oidc_to_supabase_edge" ||
    !payload.result ||
    typeof payload.result !== "object"
  ) {
    throw new Error("founder_recovery_control_invalid_response");
  }
  return {
    result: payload.result as Record<string, unknown>,
    snapshot:
      payload.snapshot && typeof payload.snapshot === "object"
        ? (payload.snapshot as PantavionRecoveryFounderSnapshot)
        : null,
  };
}
