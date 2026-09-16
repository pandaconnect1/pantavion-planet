import "server-only";

import { getVercelOidcToken } from "@vercel/oidc";

const BUILDER_BRIDGE_URL =
  "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-vercel-recovery-builder-bridge";

export type PantavionRecoveryBuilderFileClaim = {
  ok: true;
  capability: "recovery_builder_file_claim";
  transport: "vercel_oidc_to_supabase_edge";
  claimed: boolean;
  executionId?: string;
  ownerId?: string;
  fencingToken?: number;
  leaseExpiresAt?: string | null;
  attempt?: number | null;
  input?: Record<string, unknown>;
  authority?: {
    productionWrite: false;
    mainBranchWrite: false;
    merge: false;
    deployment: false;
    publicRelease: false;
  };
};

export type PantavionRecoveryBuilderFileStatus = {
  ok: true;
  capability: "recovery_builder_file_status";
  total: number;
  planned: number;
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
  paused: number;
  other: number;
  privacy: string;
};

async function bridgeRequest<T extends { ok: true; capability: string }>(
  body: Record<string, unknown>,
): Promise<T> {
  const token = await getVercelOidcToken();
  if (!token) throw new Error("vercel_oidc_token_unavailable");

  const response = await fetch(BUILDER_BRIDGE_URL, {
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
      : `recovery_builder_bridge_http_${response.status}`;
    throw new Error(code);
  }
  return payload;
}

export async function claimPantavionRecoveryBuilderFileViaOidc(input: {
  ownerId: string;
  leaseSeconds?: number;
}): Promise<PantavionRecoveryBuilderFileClaim> {
  const payload = await bridgeRequest<PantavionRecoveryBuilderFileClaim>({
    action: "claim_file",
    ownerId: input.ownerId,
    leaseSeconds: input.leaseSeconds ?? 180,
  });
  if (
    payload.capability !== "recovery_builder_file_claim" ||
    payload.transport !== "vercel_oidc_to_supabase_edge"
  ) {
    throw new Error("recovery_builder_file_claim_invalid_response");
  }
  return payload;
}

export async function heartbeatPantavionRecoveryBuilderFileViaOidc(input: {
  executionId: string;
  ownerId: string;
  fencingToken: number;
}): Promise<void> {
  const payload = await bridgeRequest<{
    ok: true;
    capability: "recovery_builder_file_heartbeat";
    recorded: true;
  }>({
    action: "heartbeat_file",
    executionId: input.executionId,
    ownerId: input.ownerId,
    fencingToken: input.fencingToken,
  });
  if (payload.capability !== "recovery_builder_file_heartbeat" || payload.recorded !== true) {
    throw new Error("recovery_builder_file_heartbeat_invalid_response");
  }
}

export async function finishPantavionRecoveryBuilderFileViaOidc(input: {
  executionId: string;
  ownerId: string;
  fencingToken: number;
  succeeded: boolean;
  output?: Record<string, unknown> | null;
  error?: string | null;
}): Promise<void> {
  const payload = await bridgeRequest<{
    ok: true;
    capability: "recovery_builder_file_finish";
    recorded: true;
    executionId: string;
  }>({
    action: "finish_file",
    executionId: input.executionId,
    ownerId: input.ownerId,
    fencingToken: input.fencingToken,
    succeeded: input.succeeded,
    output: input.output ?? null,
    error: input.error ?? null,
  });
  if (
    payload.capability !== "recovery_builder_file_finish" ||
    payload.recorded !== true ||
    payload.executionId !== input.executionId
  ) {
    throw new Error("recovery_builder_file_finish_invalid_response");
  }
}

export async function getPantavionRecoveryBuilderFileStatusViaOidc(): Promise<PantavionRecoveryBuilderFileStatus> {
  const payload = await bridgeRequest<PantavionRecoveryBuilderFileStatus>({
    action: "status_snapshot",
  });
  if (payload.capability !== "recovery_builder_file_status") {
    throw new Error("recovery_builder_file_status_invalid_response");
  }
  return payload;
}
