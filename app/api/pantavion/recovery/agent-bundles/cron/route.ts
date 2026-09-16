import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { runPantavionRecoveryAgentBundleTick } from "@/core/recovery/pantavion-recovery-agent-bundle-runtime";
import { runPantavionRecoveryBuilderFileTick } from "@/core/recovery/pantavion-recovery-builder-file-runtime";
import { getPantavionRecoveryAgentBundleStatusViaOidc } from "@/lib/supabase/oidc-agent-bundle-bridge";
import { getPantavionRecoveryBuilderFileStatusViaOidc } from "@/lib/supabase/oidc-recovery-builder-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 240;

function secretsMatch(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length
    && timingSafeEqual(actualBytes, expectedBytes);
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  return secretsMatch(authorization, `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        route: "/api/pantavion/recovery/agent-bundles/cron",
        error: "Unauthorized recovery-agent scheduled request.",
      },
      { status: 401 },
    );
  }

  try {
    const [plannerTick, builderTick] = await Promise.all([
      runPantavionRecoveryAgentBundleTick({ limit: 6 }),
      runPantavionRecoveryBuilderFileTick({ limit: 1 }),
    ]);
    const [plannerSnapshot, builderSnapshot] = await Promise.all([
      getPantavionRecoveryAgentBundleStatusViaOidc(),
      getPantavionRecoveryBuilderFileStatusViaOidc(),
    ]);

    return NextResponse.json({
      ok: plannerTick.status !== "degraded" && builderTick.status !== "degraded",
      route: "/api/pantavion/recovery/agent-bundles/cron",
      plannerTick,
      builderTick,
      plannerSnapshot,
      builderSnapshot,
      runtimeSafety: {
        transport: "Vercel OIDC -> scoped Supabase Edge capabilities",
        ai: "Vercel AI Gateway with deployment OIDC authentication",
        durableStore: "existing Supabase durable_executions",
        executionClaim: "monotonic fenced lease",
        repositoryRead: "public Pantavion source pinned to exact repository commit SHA",
        patchMode: "proposal only; separate GitHub CI must apply and test",
        rawRecoveryPayloadExternalExport: false,
        productionWriteAuthority: false,
        mainBranchWriteAuthority: false,
        mergeAuthority: false,
        deploymentAuthority: false,
        publicReleaseAuthority: false,
        retryPolicy: "bounded by durable execution max_attempts",
      },
    });
  } catch (error) {
    console.error("pantavion_recovery_agent_bundle_cron_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        ok: false,
        route: "/api/pantavion/recovery/agent-bundles/cron",
        error: "Recovery planner/builder tick failed; durable state is preserved for retry.",
      },
      { status: 500 },
    );
  }
}
