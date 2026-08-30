import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const WORKER_NAME = "pantavion-intelligence-5m";
const RECOVERY_TASK_NAME = "pantavion:recovery_partition:v1";
const INTERNAL_SCHEDULER_NAME = "pantavion-internal-scheduler-5m";
const SCHEDULE = "*/5 * * * *";

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET() {
  const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null;

  try {
    const admin = createAdminClient();
    const [runCountResult, latestRunResult, dispatchCountResult, latestDispatchResult, recoveryResult] =
      await Promise.all([
        admin
          .from("pantavion_scheduled_worker_runs")
          .select("run_id", { head: true, count: "exact" })
          .eq("worker_name", WORKER_NAME),
        admin
          .from("pantavion_scheduled_worker_runs")
          .select("run_key,status,started_at,finished_at")
          .eq("worker_name", WORKER_NAME)
          .order("started_at", { ascending: false })
          .limit(1),
        admin
          .from("pantavion_internal_scheduler_dispatches")
          .select("dispatch_id", { head: true, count: "exact" })
          .eq("scheduler_name", INTERNAL_SCHEDULER_NAME),
        admin
          .from("pantavion_internal_scheduler_dispatches")
          .select("bucket_start,request_id,dispatched_at,dispatch_error")
          .eq("scheduler_name", INTERNAL_SCHEDULER_NAME)
          .order("dispatched_at", { ascending: false })
          .limit(1),
        admin
          .from("durable_executions")
          .select("status")
          .eq("task_name", RECOVERY_TASK_NAME)
          .limit(500),
      ]);

    const diagnostics: string[] = [];
    if (runCountResult.error) diagnostics.push("scheduled_run_count_query_failed");
    if (latestRunResult.error) diagnostics.push("scheduled_latest_run_query_failed");
    if (dispatchCountResult.error) diagnostics.push("internal_dispatch_count_query_failed");
    if (latestDispatchResult.error) diagnostics.push("internal_latest_dispatch_query_failed");
    if (recoveryResult.error) diagnostics.push("recovery_partition_query_failed");

    if (diagnostics.length > 0) {
      return json(
        {
          ok: false,
          route: "/api/pantavion/intelligence/scheduler-health",
          revision,
          schedule: SCHEDULE,
          diagnostics,
        },
        503,
      );
    }

    const latestRun = latestRunResult.data?.[0] ?? null;
    const latestDispatch = latestDispatchResult.data?.[0] ?? null;
    const recoveryRows = recoveryResult.data ?? [];
    const recoveryCounts = recoveryRows.reduce(
      (counts, row) => {
        const status = row.status;
        if (status === "succeeded") counts.succeeded += 1;
        else if (status === "failed") counts.failed += 1;
        else if (status === "queued" || status === "planned" || status === "running") counts.active += 1;
        else counts.other += 1;
        return counts;
      },
      { succeeded: 0, failed: 0, active: 0, other: 0 },
    );

    const workerRunCount = runCountResult.count ?? 0;
    const recoveryPartitionCount = recoveryRows.length;
    const executionVerified =
      workerRunCount > 0 &&
      latestRun?.status === "succeeded" &&
      recoveryPartitionCount > 0;

    return json(
      {
        ok: true,
        route: "/api/pantavion/intelligence/scheduler-health",
        revision,
        schedule: SCHEDULE,
        executionVerified,
        worker: {
          name: WORKER_NAME,
          totalRuns: workerRunCount,
          lastRunKey: latestRun?.run_key ?? null,
          lastStatus: latestRun?.status ?? null,
          lastStartedAt: latestRun?.started_at ?? null,
          lastFinishedAt: latestRun?.finished_at ?? null,
        },
        internalScheduler: {
          name: INTERNAL_SCHEDULER_NAME,
          dispatchCount: dispatchCountResult.count ?? 0,
          lastBucketStart: latestDispatch?.bucket_start ?? null,
          lastDispatchedAt: latestDispatch?.dispatched_at ?? null,
          lastRequestQueued: latestDispatch?.request_id != null,
          lastDispatchFailed: Boolean(latestDispatch?.dispatch_error),
        },
        recovery: {
          taskName: RECOVERY_TASK_NAME,
          totalPartitions: recoveryPartitionCount,
          ...recoveryCounts,
        },
        privacy:
          "Sanitized operational evidence only. No user data, recovered payload, secret, lease token, request token or error detail is exposed.",
      },
      200,
    );
  } catch {
    return json(
      {
        ok: false,
        route: "/api/pantavion/intelligence/scheduler-health",
        revision,
        schedule: SCHEDULE,
        diagnostics: ["scheduler_health_unavailable"],
      },
      503,
    );
  }
}
