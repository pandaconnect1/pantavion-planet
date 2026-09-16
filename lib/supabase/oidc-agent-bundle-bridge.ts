import "server-only";

import { getVercelOidcToken } from "@vercel/oidc";

const AGENT_BUNDLE_BRIDGE_URL =
  "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-vercel-agent-bundle-bridge";

export type PantavionRecoveryAgentBundleClaim = {
  ok: true;
  capability: "recovery_agent_bundle_claim";
  transport: "vercel_oidc_to_supabase_edge";
  claimed: boolean;
  executionId?: string;
  ownerId?: string;
  fencingToken?: number;
  leaseExpiresAt?: string | null;
  attempt?: number | null;
  input?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
  authority?: {
    productionWrite: false;
    merge: false;
    deployment: false;
    publicRelease: false;
    rawRecoveryPayloadExport: false;
  };
};

export type PantavionRecoveryAgentBundleFinish = {
  ok: true;
  capability: "recovery_agent_bundle_finish";
  recorded: true;
  executionId: string;
  status: string | null;
  attempt: number | null;
};

export type PantavionRecoveryAgentBundleStatus = {
  ok: true;
  capability: "recovery_agent_bundle_status";
  total: number;
  planned: number;
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
  other: number;
  privacy: string;
};

async function bridgeRequest<T extends { ok: true; capability: string }>(
  body: Record<string, unknown>,
): Promise<T> {
  const token = await getVercelOidcToken();
  if (!token) throw new Error("vercel_oidc_token_unavailable");

  const response = await fetch(AGENT_BUNDLE_BRIDGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | T
    | { ok?: false; code?: string }
    | null;

  if (!response.ok || !payload || payload.ok !== true) {
    const code = payload && "code" in payload && payload.code
      ? payload.code
      : `agent_bundle_bridge_http_${response.status}`;
    throw new Error(code);
  }

  return payload;
}

export async function claimPantavionRecoveryAgentBundleViaOidc(input: {
  ownerId: string;
  leaseSeconds?: number;
}): Promise<PantavionRecoveryAgentBundleClaim> {
  const payload = await bridgeRequest<PantavionRecoveryAgentBundleClaim>({
    action: "claim_bundle",
    ownerId: input.ownerId,
    leaseSeconds: input.leaseSeconds ?? 180,
  });
  if (
    payload.capability !== "recovery_agent_bundle_claim" ||
    payload.transport !== "vercel_oidc_to_supabase_edge"
  ) {
    throw new Error("recovery_agent_bundle_claim_invalid_response");
  }
  return payload;
}

export async function heartbeatPantavionRecoveryAgentBundleViaOidc(input: {
  executionId: string;
  ownerId: string;
  fencingToken: number;
}): Promise<void> {
  const payload = await bridgeRequest<{ ok: true; capability: "recovery_agent_bundle_heartbeat"; recorded: true }>({
    action: "heartbeat_bundle",
    executionId: input.executionId,
    ownerId: input.ownerId,
    fencingToken: input.fencingToken,
  });
  if (payload.capability !== "recovery_agent_bundle_heartbeat" || payload.recorded !== true) {
    throw new Error("recovery_agent_bundle_heartbeat_invalid_response");
  }
}

export async function finishPantavionRecoveryAgentBundleViaOidc(input: {
  executionId: string;
  ownerId: string;
  fencingToken: number;
  succeeded: boolean;
  output?: Record<string, unknown> | null;
  error?: string | null;
}): Promise<PantavionRecoveryAgentBundleFinish> {
  const payload = await bridgeRequest<PantavionRecoveryAgentBundleFinish>({
    action: "finish_bundle",
    executionId: input.executionId,
    ownerId: input.ownerId,
    fencingToken: input.fencingToken,
    succeeded: input.succeeded,
    output: input.output ?? null,
    error: input.error ?? null,
  });
  if (
    payload.capability !== "recovery_agent_bundle_finish" ||
    payload.recorded !== true ||
    payload.executionId !== input.executionId
  ) {
    throw new Error("recovery_agent_bundle_finish_invalid_response");
  }
  return payload;
}

export async function getPantavionRecoveryAgentBundleStatusViaOidc(): Promise<PantavionRecoveryAgentBundleStatus> {
  const payload = await bridgeRequest<PantavionRecoveryAgentBundleStatus>({
    action: "status_snapshot",
  });
  if (payload.capability !== "recovery_agent_bundle_status") {
    throw new Error("recovery_agent_bundle_status_invalid_response");
  }
  return payload;
}
