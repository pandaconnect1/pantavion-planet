import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { runPantavionRecoveryBuilderFileTick } from "@/core/recovery/pantavion-recovery-builder-file-runtime";
import { getPantavionRecoveryBuilderFileStatusViaOidc } from "@/lib/supabase/oidc-recovery-builder-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

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
        route: "/api/pantavion/recovery/builder-files/cron",
        error: "Unauthorized recovery-builder scheduled request.",
      },
      { status: 401 },
    );
  }

  try {
    const builderTick = await runPantavionRecoveryBuilderFileTick({ limit: 1 });
    let builderSnapshot: Awaited<ReturnType<typeof getPantavionRecoveryBuilderFileStatusViaOidc>> | null = null;
    try {
      builderSnapshot = await getPantavionRecoveryBuilderFileStatusViaOidc();
    } catch (error) {
      console.warn("pantavion_recovery_builder_snapshot_degraded", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json({
      ok: builderTick.status !== "degraded",
      route: "/api/pantavion/recovery/builder-files/cron",
      builderTick,
      builderSnapshot,
      runtimeSafety: {
        transport: "Vercel OIDC -> scoped Supabase Edge capability",
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
    console.error("pantavion_recovery_builder_file_cron_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        ok: false,
        route: "/api/pantavion/recovery/builder-files/cron",
        error: "Recovery builder tick failed; durable state is preserved for retry.",
      },
      { status: 500 },
    );
  }
}
