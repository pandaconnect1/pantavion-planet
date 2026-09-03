import { compileOutcomePlan, getExecutableSteps, isOutcomeComplete } from "../core/sovereign/intent-to-outcome-fabric.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectThrows(operation, message) {
  let threw = false;
  try {
    operation();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

const policy = {
  ownerApprovalRisks: ["high", "critical"],
  requireApprovalForIrreversible: true,
  maximumAutomaticCost: 5,
};

const baseIntent = {
  id: "intent_boundary_test",
  userId: "founder_test",
  text: "verify a bounded outcome",
  desiredOutcome: "verified result",
};

const stepA = {
  id: "step_a",
  title: "Prepare evidence",
  kind: "deterministic",
  capability: "read",
  risk: "low",
  reversible: true,
  requiresOwnerApproval: false,
  dependsOn: [],
};
const stepB = {
  id: "step_b",
  title: "Verify evidence",
  kind: "workflow",
  capability: "verify",
  risk: "low",
  reversible: true,
  requiresOwnerApproval: false,
  dependsOn: ["step_a"],
};

const readyPlan = compileOutcomePlan(baseIntent, [stepA, stepB], 2, policy);
assert(readyPlan.state === "ready", "A valid acyclic plan must be ready.");
assert(getExecutableSteps(readyPlan, []).map((step) => step.id).join(",") === "step_a", "Only root steps may execute first.");
assert(getExecutableSteps(readyPlan, ["step_a"]).map((step) => step.id).join(",") === "step_b", "Dependent step must unlock after prerequisite completion.");
assert(isOutcomeComplete(readyPlan, ["step_a", "step_b"]), "All completed steps must mark the outcome complete.");
assert(!isOutcomeComplete(readyPlan, ["step_a"]), "Incomplete receipt set must not mark the outcome complete.");

const cyclicPlan = compileOutcomePlan(
  baseIntent,
  [
    { ...stepA, dependsOn: ["step_b"] },
    stepB,
  ],
  2,
  policy,
);
assert(cyclicPlan.state === "blocked", "Dependency cycles must fail closed.");
assert(cyclicPlan.blockers.includes("dependency_cycle_detected"), "Cycle blocker must be explicit.");

const overBudgetPlan = compileOutcomePlan(baseIntent, [stepA], 6, policy);
assert(overBudgetPlan.state === "ready", "Cost above the automatic threshold may remain structurally ready.");
assert(overBudgetPlan.requiresOwnerApproval, "Cost above the automatic threshold must require owner approval.");

const intentLimitPlan = compileOutcomePlan({ ...baseIntent, maxCost: 1 }, [stepA, stepB], 2, policy);
assert(intentLimitPlan.state === "blocked", "Intent-level cost limit must block the plan.");
assert(intentLimitPlan.blockers.includes("intent_cost_limit_exceeded"), "Intent cost blocker must be explicit.");

const invalidStepPlan = compileOutcomePlan(
  baseIntent,
  [{ ...stepA, id: "", title: "", capability: "" }],
  1,
  policy,
);
assert(invalidStepPlan.state === "blocked", "Invalid step identity must block the plan.");
assert(invalidStepPlan.blockers.some((blocker) => blocker.startsWith("invalid_step_identity:")), "Invalid step blocker must be explicit.");

expectThrows(
  () => compileOutcomePlan({ ...baseIntent, deadlineAt: "not-a-date" }, [stepA], 1, policy),
  "Invalid deadline must fail closed.",
);
expectThrows(
  () => compileOutcomePlan(baseIntent, [stepA], -1, policy),
  "Negative estimated cost must fail closed.",
);

console.log("intent-outcome-boundary-test: PASS");
