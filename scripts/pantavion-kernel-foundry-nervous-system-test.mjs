import assert from "node:assert/strict";
import {
  PANTAVION_NERVOUS_SYSTEM_DEPENDENCY_BLOCKER,
  pantavionFoundryDependencyRoles,
  planPantavionFoundryDependencyGate,
} from "../kernel/foundry-nervous-system.ts";

const snapshot = (role, status, blockers = [], nervousSystemBlocked = false, workOrderId = "pwo_test_12345678") => ({
  executionId: `${workOrderId}:${role}`,
  workOrderId,
  role,
  status,
  idempotencyKey: `${workOrderId}:agent:${role}`,
  internalCapabilities: [`capability:${role}`],
  blockers,
  nervousSystemBlocked,
});

assert.deepEqual(pantavionFoundryDependencyRoles("classifier"), ["orchestrator", "sentinel"]);
assert.deepEqual(pantavionFoundryDependencyRoles("repairer"), []);

const initial = [
  snapshot("orchestrator", "queued"),
  snapshot("sentinel", "queued"),
  snapshot("classifier", "queued"),
  snapshot("researcher", "planned"),
  snapshot("planner", "planned"),
  snapshot("builder", "paused", ["scoped_draft_patch_not_authorized"]),
  snapshot("auditor", "planned"),
  snapshot("verifier", "planned"),
  snapshot("repairer", "paused", ["awaiting_verified_failure_or_repair_instruction"]),
  snapshot("memory_guard", "planned"),
];

const initialPlan = planPantavionFoundryDependencyGate(initial);
assert.deepEqual(initialPlan.issues, []);
assert.deepEqual(initialPlan.readyQueuedTaskIds, [
  "pwo_test_12345678:sentinel",
  "pwo_test_12345678:orchestrator",
]);
assert.ok(initialPlan.waitingTaskIds.includes("pwo_test_12345678:classifier"));
assert.ok(initialPlan.waitingTaskIds.includes("pwo_test_12345678:planner"));
assert.ok(
  initialPlan.actions.some(
    (action) => action.executionId === "pwo_test_12345678:classifier" && action.action === "pause",
  ),
);
assert.ok(
  !initialPlan.actions.some((action) => action.executionId === "pwo_test_12345678:builder"),
  "foreign policy blockers must remain under their original control plane",
);
assert.ok(
  !initialPlan.actions.some((action) => action.executionId === "pwo_test_12345678:repairer"),
  "repair agent must stay blocked until the existing blocker-resolution runtime queues it",
);

const classifierReleased = [
  snapshot("orchestrator", "succeeded"),
  snapshot("sentinel", "succeeded"),
  snapshot(
    "classifier",
    "paused",
    [PANTAVION_NERVOUS_SYSTEM_DEPENDENCY_BLOCKER],
    true,
  ),
];
const releasePlan = planPantavionFoundryDependencyGate(classifierReleased);
assert.deepEqual(releasePlan.issues, []);
assert.deepEqual(releasePlan.actions, [
  {
    executionId: "pwo_test_12345678:classifier",
    action: "release",
    waitingOn: [],
    missingDependencies: [],
  },
]);

const missingDependencyPlan = planPantavionFoundryDependencyGate([
  snapshot("classifier", "queued"),
]);
assert.deepEqual(missingDependencyPlan.missingDependencies["pwo_test_12345678:classifier"], [
  "pwo_test_12345678:orchestrator",
  "pwo_test_12345678:sentinel",
]);
assert.deepEqual(missingDependencyPlan.readyQueuedTaskIds, []);
assert.equal(missingDependencyPlan.actions[0]?.action, "pause");

const repairReadyPlan = planPantavionFoundryDependencyGate([
  snapshot("repairer", "queued"),
]);
assert.deepEqual(repairReadyPlan.readyQueuedTaskIds, ["pwo_test_12345678:repairer"]);
assert.deepEqual(repairReadyPlan.actions, []);

const identityMismatch = planPantavionFoundryDependencyGate([
  {
    ...snapshot("orchestrator", "queued"),
    executionId: "wrong-id",
  },
]);
assert.ok(identityMismatch.issues.includes("execution_identity_mismatch:wrong-id"));

const duplicate = planPantavionFoundryDependencyGate([
  snapshot("sentinel", "queued"),
  snapshot("sentinel", "queued"),
]);
assert.ok(duplicate.issues.includes("duplicate_execution:pwo_test_12345678:sentinel"));

console.log("Pantavion Foundry nervous-system dependency gate: PASS");
