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

export function runPantavionSchedulerWorkPackageBridge(input: PantavionSchedulerWorkPackageBridgeInput) {
  seedPantavionAutonomousWorkPackages();

  if (!input.authorized || input.writeMode === "observe") {
    const queue = summarizePantavionWorkPackageQueue();

    appendPantavionRuntimeLedgerEvent({
      runId: input.sourceRunId,
      eventType: "work_package_planned",
      severity: "info",
      kernelFamily: "Pantavion Scheduler Work Package Bridge",
      message: "Scheduler inspected work package queue without claiming.",
      protectedDomains: [],
      metadata: {
        marker: "pantavion_scheduler_work_package_bridge_c9f_v1",
        trigger: input.trigger,
        writeMode: input.writeMode,
        authorized: input.authorized,
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

  const branchPrefix = process.env.PANTAVION_AUTONOMOUS_BRANCH_PREFIX ?? "pantavion/autonomous";
  const branch = `${branchPrefix}/work-package-${input.trigger}-${input.writeMode}`;

  const claim = claimNextPantavionWorkPackage({
    ownerId: `pantavion-scheduler-${input.trigger}-${input.writeMode}`,
    ownerKind: input.trigger === "cron" ? "cron" : "kernel",
    branch,
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
        reason: claim.reason,
      },
    });

    return {
      ok: false,
      marker: "pantavion_scheduler_work_package_bridge_c9f_v1",
      mode: "blocked",
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
