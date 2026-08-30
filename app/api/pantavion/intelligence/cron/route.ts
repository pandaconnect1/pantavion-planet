import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runPantavionCloudCronTick } from "@/core/intelligence/pantavion-intelligence-ledger";
import { materializePantavionFounderExecutionIntents } from "@/core/kernel/pantavion-founder-canonical-state-runtime";
import { runPantavionNervousSystemFoundryTick } from "@/core/kernel/pantavion-foundry-nervous-system-runtime";
import { runPantavionRecoveryFencedExecutor } from "@/core/recovery/pantavion-recovery-fenced-executor";
import { materializePantavionRecoveryExecutionPartitions } from "@/core/recovery/pantavion-recovery-partition-scheduler";
import { runSecureScheduledWorker } from "@/core/runtime/secure-scheduled-worker";
import { PantavionSupabaseDurableExecutionStore } from "@/core/runtime/supabase-durable-execution-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 240;

type PantavionCronAuthMode =
  | "cron_secret_verified"
  | "local_development_explicitly_allowed"
  | "blocked_missing_cron_secret"
  | "blocked_invalid_cron_secret";

function secretsMatch(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length
    && timingSafeEqual(actualBytes, expectedBytes);
}

function authorizeCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  const authorization = request.headers.get("authorization") ?? "";
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (!isProduction && process.env.PANTAVION_ALLOW_LOCAL_CRON === "true") {
      return { ok: true, mode: "local_development_explicitly_allowed" as const };
    }
    return { ok: false, mode: "blocked_missing_cron_secret" as const };
  }

  const expected = "Bearer " + secret;
  if (!secretsMatch(authorization, expected)) {
    return { ok: false, mode: "blocked_invalid_cron_secret" as const };
  }

  return { ok: true, mode: "cron_secret_verified" as const };
}

function unauthorizedCronResponse(mode: PantavionCronAuthMode) {
  return NextResponse.json(
    {
      ok: false,
      route: "/api/pantavion/intelligence/cron",
      error: "Unauthorized scheduled-worker request.",
      mode,
      runtimeSafety:
        "Execution is fail-closed. Production requires an exact CRON_SECRET bearer token.",
    },
    { status: 401 },
  );
}

async function executeScheduledTick(
  source: "vercel_cron" | "external_scheduler",
  authMode: PantavionCronAuthMode,
) {
  try {
    const worker = await runSecureScheduledWorker(
      "pantavion-intelligence-5m",
      async () => {
        const durableStore = new PantavionSupabaseDurableExecutionStore();
        const canonicalExecutionIntake = await materializePantavionFounderExecutionIntents(20);
        const recoveryPartitions = await materializePantavionRecoveryExecutionPartitions({
          store: durableStore,
          limit: 25,
        });
        const recoveryExecutor = await runPantavionRecoveryFencedExecutor({
          store: durableStore,
          limit: 5,
        });
        const tick = await runPantavionCloudCronTick(source);
        const foundry = await runPantavionNervousSystemFoundryTick();

        return {
          ok:
            tick.ok &&
            canonicalExecutionIntake.status !== "blocked" &&
            recoveryPartitions.status !== "blocked" &&
            recoveryExecutor.status !== "blocked",
          route: tick.route,
          executedAt: tick.cron.executedAt,
          opportunityCount: tick.ledgerEvent.opportunityCount,
          buildQueueCount: tick.ledgerEvent.buildQueueCount,
          ledgerStatus: tick.ledgerEvent.status,
          ledgerStorageMode: tick.ledgerEvent.storageMode,
          canonicalExecutionIntake,
          recoveryPartitions,
          recoveryExecutor,
          foundry,
        };
      },
      { runKeyBucketMinutes: 5 },
    );

    return NextResponse.json({
      ...worker,
      authMode,
      runtimeSafety: {
        authorization: "exact CRON_SECRET bearer token",
        concurrency: "Supabase scheduled-worker lease plus per-partition monotonic fencing prevents overlapping or stale execution writes",
        idempotency: "one run key per five-minute UTC bucket plus durable founder-intent/work-order/recovery-partition idempotency keys",
        audit: "durable run status, recovery partition claims, fenced checkpoints, terminal states and bounded summaries are stored in Supabase",
        canonicalIntake:
          "founder-only canonical execution intents are materialized through the Pantavion work-order constructor before Nervous System and Foundry execution",
        recoveryPartitions:
          "the exact 82,413-record recovery corpus is materialized idempotently into 165 bounded durable partitions",
        recoveryExecutor:
          "each claimed recovery partition is SHA-256 verified from pinned source batches, analyzed in-process, checkpointed and finished through the Supabase fencing boundary; no raw recovered payload is copied into durable output",
        authority:
          "recovery execution remains analysis/planning-only; code mutation, production business-data writes, merge, deployment, public exposure and release remain false",
        foundry:
          "dependency-gated Nervous System reconciles durable Pantavion-owned agents before the existing Foundry performs its separately authorized runtime execution",
        destructiveActions: "disabled unless separately authorized through recorded capability and owner-release boundaries",
      },
    });
  } catch (error) {
    console.error("pantavion_secure_scheduled_worker_failed", {
      source,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        ok: false,
        route: "/api/pantavion/intelligence/cron",
        error: "Scheduled worker failed. See protected server logs and Supabase audit state.",
        authMode,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return unauthorizedCronResponse(auth.mode);
  return executeScheduledTick("vercel_cron", auth.mode);
}

export async function POST(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return unauthorizedCronResponse(auth.mode);
  return executeScheduledTick("external_scheduler", auth.mode);
}
