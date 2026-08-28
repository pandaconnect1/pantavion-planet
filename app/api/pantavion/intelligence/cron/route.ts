import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runPantavionCloudCronTick } from "@/core/intelligence/pantavion-intelligence-ledger";
import { runPantavionNervousSystemFoundryTick } from "@/core/kernel/pantavion-foundry-nervous-system-runtime";
import { runSecureScheduledWorker } from "@/core/runtime/secure-scheduled-worker";

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
      "pantavion-intelligence-hourly",
      async () => {
        const tick = await runPantavionCloudCronTick(source);
        const foundry = await runPantavionNervousSystemFoundryTick();

        return {
          ok: tick.ok,
          route: tick.route,
          executedAt: tick.cron.executedAt,
          opportunityCount: tick.ledgerEvent.opportunityCount,
          buildQueueCount: tick.ledgerEvent.buildQueueCount,
          ledgerStatus: tick.ledgerEvent.status,
          ledgerStorageMode: tick.ledgerEvent.storageMode,
          foundry,
        };
      },
    );

    return NextResponse.json({
      ...worker,
      authMode,
      runtimeSafety: {
        authorization: "exact CRON_SECRET bearer token",
        concurrency: "Supabase atomic lease prevents overlapping executions",
        idempotency: "one run key per worker per UTC hour",
        audit: "durable run status and bounded summary stored in Supabase",
        foundry:
          "dependency-gated Nervous System reconciles durable Pantavion-owned agents before the existing Foundry performs its atomic SQL claim and internal runtime execution",
        destructiveActions: "disabled",
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
