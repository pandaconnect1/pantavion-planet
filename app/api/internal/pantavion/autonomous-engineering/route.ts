import { randomUUID } from "crypto";
import { runAutonomousEngineeringKernel } from "@/core/kernel/autonomous-engineering-kernel";
import {
  decidePantavionSchedulerRun,
  isPantavionSchedulerAuthorized,
} from "@/core/pantaai/runtime/scheduler-guard";
import { runPantavionSchedulerWorkPackageBridge } from "@/core/pantaai/runtime/scheduler-work-package-bridge";
import { executeClaimedPantavionWorkPackageAsPr } from "@/core/pantaai/runtime/work-package-pr-executor";
import { appendPantavionRuntimeLedgerEvent } from "@/core/pantaai/runtime/runtime-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function recordSchedulerEvent(input: {
  readonly runId?: string;
  readonly eventType:
    | "kernel_wake"
    | "founder_gate_required"
    | "protected_gate_required"
    | "error_recorded";
  readonly severity?: "info" | "warning" | "error" | "critical";
  readonly message: string;
  readonly protectedDomains?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}): void {
  try {
    appendPantavionRuntimeLedgerEvent({
      runId: input.runId,
      eventType: input.eventType,
      severity: input.severity ?? "info",
      kernelFamily: "Pantavion Autonomous Scheduler Kernel",
      message: input.message,
      protectedDomains: input.protectedDomains ?? [],
      metadata: input.metadata,
    });
  } catch {
    // Scheduler must not fail because ledger storage is unavailable.
  }
}

async function maybeExecuteWorkPackagePr(input: {
  readonly runId: string;
  readonly writeMode: "observe" | "draft" | "local_scaffold" | "github_pr";
  readonly workPackageBridge: ReturnType<typeof runPantavionSchedulerWorkPackageBridge>;
}) {
  if (!input.workPackageBridge.claimed) {
    return {
      ok: true,
      marker: "pantavion_scheduler_auto_pr_flow_c9h_v1",
      executed: false,
      reason: "No claimed work package was available for PR execution.",
    };
  }

  const packageId = input.workPackageBridge.workPackage.package.id;
  const mode = input.writeMode === "github_pr" ? "github_pr" : "dry_run";

  const result = await executeClaimedPantavionWorkPackageAsPr({
    packageId,
    mode,
    sourceRunId: input.runId,
  });

  return {
    ok: result.ok,
    marker: "pantavion_scheduler_auto_pr_flow_c9h_v1",
    executed: mode === "github_pr",
    mode,
    packageId,
    result,
  };
}

export async function GET(request: Request) {
  const runId = `scheduler-${randomUUID()}`;
  const decision = decidePantavionSchedulerRun(request);
  const authorized = isPantavionSchedulerAuthorized(request);

  recordSchedulerEvent({
    runId,
    eventType: "kernel_wake",
    message: "Autonomous engineering scheduler wake requested.",
    protectedDomains: decision.protectedDomains,
    metadata: decision,
  });

  if (!decision.ok) {
    recordSchedulerEvent({
      runId,
      eventType: "founder_gate_required",
      severity: "warning",
      message: decision.blockedReason ?? "Autonomous scheduler request blocked by protected gate.",
      protectedDomains: decision.protectedDomains,
      metadata: decision,
    });

    return Response.json(
      {
        ok: false,
        marker: "pantavion_autonomous_scheduler_hardened_route_c8a_v1",
        bridgeMarker: "pantavion_scheduler_work_package_bridge_c9f_v1",
        autoPrMarker: "pantavion_scheduler_auto_pr_flow_c9h_v1",
        runId,
        decision,
      },
      { status: 403 },
    );
  }

  const workPackageBridge = runPantavionSchedulerWorkPackageBridge({
    trigger: decision.trigger,
    writeMode: decision.effectiveMode,
    maxJobs: decision.maxJobs,
    authorized,
    sourceRunId: runId,
  });

  const workPackagePrExecution = await maybeExecuteWorkPackagePr({
    runId,
    writeMode: decision.effectiveMode,
    workPackageBridge,
  });

  const result = await runAutonomousEngineeringKernel({
    trigger: decision.trigger,
    writeMode: decision.effectiveMode,
    maxJobs: decision.maxJobs,
  });

  return Response.json({
    ok: true,
    marker: "pantavion_autonomous_engineering_route_c1_v1",
    schedulerMarker: "pantavion_autonomous_scheduler_hardened_route_c8a_v1",
    bridgeMarker: "pantavion_scheduler_work_package_bridge_c9f_v1",
    autoPrMarker: "pantavion_scheduler_auto_pr_flow_c9h_v1",
    runId,
    decision,
    workPackageBridge,
    workPackagePrExecution,
    result,
  });
}

export async function POST(request: Request) {
  if (!isPantavionSchedulerAuthorized(request)) {
    recordSchedulerEvent({
      eventType: "founder_gate_required",
      severity: "warning",
      message: "Unauthorized POST request blocked by autonomous scheduler gate.",
      protectedDomains: [
        "production",
        "water",
        "users",
        "payments",
        "identity",
        "sos",
        "legal",
        "private_data",
      ],
    });

    return Response.json(
      {
        ok: false,
        error: "Unauthorized autonomous engineering request.",
      },
      { status: 401 },
    );
  }

  const runId = `scheduler-${randomUUID()}`;
  const body = await request.json().catch(() => ({}));
  const writeMode =
    body.writeMode === "observe" ||
    body.writeMode === "draft" ||
    body.writeMode === "local_scaffold" ||
    body.writeMode === "github_pr"
      ? body.writeMode
      : undefined;

  const maxJobs =
    typeof body.maxJobs === "number"
      ? Math.max(1, Math.min(Math.floor(body.maxJobs), 10))
      : 3;

  const effectiveWriteMode = writeMode ?? "observe";

  recordSchedulerEvent({
    runId,
    eventType: "kernel_wake",
    message: "Authorized autonomous engineering POST wake requested.",
    protectedDomains:
      effectiveWriteMode === "local_scaffold" || effectiveWriteMode === "github_pr"
        ? ["production", "protected_domain", "founder_gate"]
        : [],
    metadata: {
      writeMode: effectiveWriteMode,
      maxJobs,
      trigger: "api",
    },
  });

  try {
    const workPackageBridge = runPantavionSchedulerWorkPackageBridge({
      trigger: "api",
      writeMode: effectiveWriteMode,
      maxJobs,
      authorized: true,
      sourceRunId: runId,
    });

    const workPackagePrExecution = await maybeExecuteWorkPackagePr({
      runId,
      writeMode: effectiveWriteMode,
      workPackageBridge,
    });

    const result = await runAutonomousEngineeringKernel({
      trigger: "api",
      writeMode,
      maxJobs,
    });

    return Response.json({
      ok: true,
      marker: "pantavion_autonomous_scheduler_hardened_route_c8a_v1",
      bridgeMarker: "pantavion_scheduler_work_package_bridge_c9f_v1",
      autoPrMarker: "pantavion_scheduler_auto_pr_flow_c9h_v1",
      runId,
      workPackageBridge,
      workPackagePrExecution,
      result,
    });
  } catch (error) {
    recordSchedulerEvent({
      runId,
      eventType: "error_recorded",
      severity: "error",
      message: "Autonomous engineering POST run failed.",
      protectedDomains: ["autonomous_engineering"],
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

const pantavion_autonomous_engineering_route_marker_v1 =
  "pantavion_autonomous_engineering_route_c1_v1";

const pantavion_autonomous_scheduler_hardened_route_marker_v1 =
  "pantavion_autonomous_scheduler_hardened_route_c8a_v1";

const pantavion_scheduler_work_package_bridge_route_marker_v1 =
  "pantavion_scheduler_work_package_bridge_c9f_v1";

const pantavion_scheduler_auto_pr_flow_route_marker_v1 =
  "pantavion_scheduler_auto_pr_flow_c9h_v1";
