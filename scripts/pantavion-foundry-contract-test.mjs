import {
  createPantavionFoundryWorkloadPlan,
  describePantavionFoundryPartition,
} from "../core/kernel/pantavion-foundry-workload-planner.ts";
import { createPantavionOwnedAgentFleet } from "../core/kernel/pantavion-agent-factory.ts";
import {
  createPantavionAgentModuleDeliveryAssignment,
  createPantavionModuleDeliveryCells,
} from "../core/kernel/pantavion-module-delivery-factory.ts";
import { createPantavionFoundryBlockerResolution } from "../core/kernel/pantavion-blocker-resolution.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const workOrderId = "pwo_foundry_contract_test";
const plan = createPantavionFoundryWorkloadPlan({
  workOrderId,
  workload: {
    kind: "recovery_excavation",
    unitCount: 28_000,
    batchSize: 100,
    intakeReference: "recovery-contract-test",
  },
});

assert(plan.partitionContract.batchCount === 280, "28k recovery units must become 280 bounded partitions.");
const finalPartition = describePantavionFoundryPartition(plan, 280);
assert(finalPartition.startUnit === 27_901, "Final partition start is wrong.");
assert(finalPartition.endUnit === 28_000, "Final partition end is wrong.");
assert(plan.externalWorkerDependency === false, "Recovery plan cannot require external workers.");

const cells = createPantavionModuleDeliveryCells({
  workOrderId,
  target: "pantaai_center",
});
assert(cells.length >= 3, "PantaAI must receive multiple module delivery cells.");
assert(
  cells.every(
    (cell) =>
      cell.externalWorkerDependency === false &&
      cell.promotionBoundary.maySendExternalMessages === false &&
      cell.promotionBoundary.mayPublishPublicCampaign === false,
  ),
  "Module delivery cells cannot authorize external promotion or workers.",
);

const fleet = createPantavionOwnedAgentFleet({
  workOrderId,
  target: "pantaai_center",
  security: {
    marker: "pantavion_agent_security_profile_v1",
    workOrderId,
    target: "pantaai_center",
    mode: "isolated_branch_draft",
    allowedAuthorities: ["observe", "classify", "propose", "draft_patch", "audit"],
    forbiddenAuthorities: [],
    allowedTargetFiles: ["core/kernel/pantavion-foundry-runtime.ts"],
    dataBoundary: {
      mayReadPrivateUserData: false,
      mayExportPrivateData: false,
      maySendRawPrivateDataToExternalAI: false,
      externalNetworkEgress: "denied",
      internalRuntimeEgress: "pantavion_owned_runtime_only",
      secretsAccess: "brokered_server_only_never_returned_to_agent",
    },
    executionBoundary: {
      mayMerge: false,
      mayDeployProduction: false,
      mayChangeBillingOrPayments: false,
      mayChangeIdentityOrAuth: false,
      mayChangeSOSWaterOrCriticalInfrastructure: false,
      mayRunUnboundedShell: false,
      mayWriteOnlyInIsolatedBranch: true,
    },
    auditRequirements: [],
    stopConditions: [],
    blockers: [],
    generatedAt: "2026-08-22T00:00:00.000Z",
  },
  internalRuntimeConfigured: false,
});

assert(fleet.agents.length === 10, "Foundry must have ten bounded internal specialist roles.");
const repairer = fleet.agents.find((agent) => agent.role === "repairer");
assert(
  repairer?.blockers.includes("awaiting_verified_failure_or_repair_instruction"),
  "Repairer must wait for a verified blocker rather than run without cause.",
);

const assignment = createPantavionAgentModuleDeliveryAssignment({
  workOrderId,
  role: "orchestrator",
  cells,
});
assert(assignment.moduleIds.length === cells.length, "Every target module must have an owner assignment.");
assert(assignment.externalWorkerAllowed === false, "Assignments cannot authorize external workers.");

const recoverable = createPantavionFoundryBlockerResolution({
  workOrderId,
  sourceAgentRole: "builder",
  blockerId: "runtime-timeout",
  kind: "runtime_failure",
  summary: "Controlled runtime timeout.",
});
assert(recoverable.disposition === "repair_queued", "Runtime failures must route to repair.");
assert(recoverable.mayRetryInternalRuntime === true, "Runtime failures should retain a bounded retry path.");

const protectedBoundary = createPantavionFoundryBlockerResolution({
  workOrderId,
  sourceAgentRole: "sentinel",
  blockerId: "protected-action",
  kind: "founder_approval",
  summary: "An external or protected action needs a founder decision.",
});
assert(
  protectedBoundary.disposition === "awaiting_founder_approval" &&
    protectedBoundary.founderDecisionRequired === true,
  "Protected actions must escalate explicitly instead of auto-executing.",
);

console.log("PANTAVION FOUNDRY CONTRACT TEST: PASSED");
console.log("- 28,000 recovery units become 280 internal partitions");
console.log("- module delivery stays internal and promotion-safe");
console.log("- verified blockers route to repair or founder approval, never silent abandonment");
