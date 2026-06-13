import type { AutonomousEngineeringWriteMode } from "@/core/kernel/autonomous-engineering-kernel";
import {
  claimNextPantavionWorkPackage,
  seedPantavionAutonomousWorkPackages,
  summarizePantavionWorkPackageQueue,
} from "./autonomous-work-package-coordinator";
import { appendPantavionRuntimeLedgerEvent } from "./runtime-ledger";

export type PantavionSchedulerWorkPackageBridgeInput = {
  readonly trigger: "cron" | "api" | "manual" | "unknown";
  readonly writeMode: AutonomousEngineeringWriteMode;
  readonly maxJobs: number;
  readonly authorized: boolean;
  readonly sourceRunId?: string;
};

export type PantavionSchedulerWorkPackageBridgeResult =
  | {
      readonly ok: true;
      readonly marker: "pantavion_scheduler_work_package_bridge_c9f_v1";
      readonly mode: "observe";
      readonly claimed: false;
      readonly queue: ReturnType<typeof summarizePantavionWorkPackageQueue>;
    }
  | {
      readonly ok: true;
      readonly marker: "pantavion_scheduler_work_package_bridge_c9f_v1";
      readonly mode: "claim";
      readonly claimed: true;
      readonly workPackage: ReturnType<typeof claimNextPantavionWorkPackage>;
      readonly queue: ReturnType<typeof summarizePantavionWorkPackageQueue>;
    }
  | {
      readonly ok: false;
      readonly marker: "pantavion_scheduler_work_package_bridge_c9f_v1";
      readonly mode: "blocked" | "empty";
      readonly claimed: false;
      readonly reason: string;
      readonly queue: ReturnType<typeof summarizePantavionWorkPackageQueue>;
    };

function ownerIdForBridge(input: PantavionSchedulerWorkPackageBridgeInput): string {
  return `pantavion-scheduler-${input.trigger}-${input.writeMode}`;
}

function branchForBridge(input: PantavionSchedulerWorkPackageBridgeInput): string {
  const prefix = process.env.PANTAVION_AUTONOMOUS_BRANCH_PREFIX ?? "pantavion/autonomous";
  const safeTrigger = input.trigger.replace(/[^a-zA-Z0-9_-]/g, "-");
  const safeMode = input.writeMode.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `${prefix}/work-package-${safeTrigger}-${safeMode}`;
}

function shouldClaimWorkPackage(input: PantavionSchedulerWorkPackageBridgeInput): boolean {
  if (!input.authorized) return false;
  return input.writeMode === "draft" || input.writeMode === "local_scaffold" || input.writeMode === "github_pr";
}

export function runPantavionSchedulerWorkPackageBridge(
  input: PantavionSchedulerWorkPackageBridgeInput,
): PantavionSchedulerWorkPackageBridgeResult {
  seedPantavionAutonomousWorkPackages();

  if (!shouldClaimWorkPackage(input)) {
    const queue = summarizePantavionWorkPackageQueue();

    appendPantavionRuntimeLedgerEvent({
      runId: input.sourceRunId,
      eventType: "work_package_planned",
      severity: "info",
      kernelFamily: "Pantavion Scheduler Work Package Bridge",
      message: "Scheduler inspected work package queue without claiming because current mode is observe or unauthorized.",
      protectedDomains: [],
      metadata: {
        marker: "pantavion_scheduler_work_package_bridge_c9f_v1",
        trigger: input.trigger,
        writeMode: input.writeMode,
        authorized: input.authorized,
        maxJobs: input.maxJobs,
        claimablePackages: queue.claimablePackages,
      },
    });

    return {
      ok: true,
      marker: "pantavion_scheduler_work_package_bridge_c9f_v1",
      mode: "observe",
      claimed: false,
      queue,
    };
  }

  const claim = claimNextPantavionWorkPackage({
    ownerId: ownerIdForBridge(input),
    ownerKind: input.trigger === "cron" ? "cron" : "kernel",
    branch: branchForBridge(input),
    sourceRunId: input.sourceRunId,
  });

  if (!claim.ok) {
    appendPantavionRuntimeLedgerEvent({
      runId: input.sourceRunId,
      eventType: "protected_gate_required",
      severity: "warning",
      kernelFamily: "Pantavion Scheduler Work Package Bridge",
      message: "Scheduler could not claim next work package.",
      protectedDomains: [],
      metadata: {
        marker: "pantavion_scheduler_work_package_bridge_c9f_v1",
        trigger: input.trigger,
        writeMode: input.writeMode,
        authorized: input.authorized,
        reason: claim.reason,
      },
    });

    return {
      ok: false,
      marker: "pantavion_scheduler_work_package_bridge_c9f_v1",
      mode: claim.reason.includes("No claimable") ? "empty" : "blocked",
      claimed: false,
      reason: claim.reason,
      queue: summarizePantavionWorkPackageQueue(),
    };
  }

  appendPantavionRuntimeLedgerEvent({
    runId: input.sourceRunId,
    eventType: "job_claimed",
    severity: claim.package.protectedDomains.length > 0 ? "warning" : "info",
    kernelFamily: "Pantavion Scheduler Work Package Bridge",
    message: "Scheduler claimed next autonomous work package.",
    protectedDomains: claim.package.protectedDomains,
    metadata: {
      marker: "pantavion_scheduler_work_package_bridge_c9f_v1",
      trigger: input.trigger,
      writeMode: input.writeMode,
      authorized: input.authorized,
      packageId: claim.package.id,
      title: claim.package.title,
      capabilityFamily: claim.package.capabilityFamily,
      branch: claim.package.branch,
      lockId: claim.package.lockId,
      targetFiles: claim.package.targetFiles,
      requiredGates: claim.package.requiredGates,
    },
  });

  return {
    ok: true,
    marker: "pantavion_scheduler_work_package_bridge_c9f_v1",
    mode: "claim",
    claimed: true,
    workPackage: claim,
    queue: summarizePantavionWorkPackageQueue(),
  };
}

export const pantavion_scheduler_work_package_bridge_marker_v1 =
  "pantavion_scheduler_work_package_bridge_c9f_v1";
