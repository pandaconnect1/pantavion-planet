import assert from "node:assert/strict";
import { planAdaptiveCapability } from "../core/sovereign/adaptive-capability-fabric.ts";

const nowIso = "2026-09-22T21:10:00.000Z";

const existing = planAdaptiveCapability({
  intentId: "intent_existing_runtime",
  userId: "user_test",
  text: "Run durable execution with checkpoint and retry",
  desiredOutcome: "Execute a durable runtime task",
  actorScopes: ["read", "execute"],
  locale: "en",
  targetLocale: "en",
  nowIso,
});

assert.equal(existing.disposition, "route_existing");
assert.ok(existing.matchedCapabilityIds.includes("runtime.durable"));
assert.equal(existing.blueprint, null);
assert.equal(existing.truth.buildMustUseDurableExecution, true);
assert.equal(existing.truth.verifiedLiveRequiredBeforeUserReadyClaim, true);

const novel = planAdaptiveCapability({
  intentId: "intent_novel_space_greenhouse",
  userId: "user_test",
  text: "Create an orbital greenhouse nutrient simulation workspace for a future space research mission",
  desiredOutcome: "A safe research and simulation module for orbital greenhouse planning",
  actorScopes: ["read"],
  locale: "el",
  targetLocale: "en",
  nowIso,
});

assert.equal(novel.disposition, "synthesize_capability");
assert.ok(novel.blueprint);
assert.equal(novel.blueprint?.productionState, "proposal_only");
assert.equal(novel.risk, "medium");
assert.equal(novel.translation.bidirectional, true);
assert.equal(novel.translation.targetNaturalLanguageCount, 7000);
assert.equal(novel.translation.providerCoverageMustBeVerified, true);
assert.equal(novel.personalSwarm.persistentUserCore.activeWorkerCount, 0);
assert.ok(novel.personalSwarm.agents.length >= 5);
assert.ok(novel.personalSwarm.agents.every((agent) => agent.parentIntentId === novel.intentId));
assert.equal(novel.latencyBudget.actualBuildTimeGuarantee, false);
assert.ok(novel.outcomePlan.steps.some((step) => step.id === "research_gap"));
assert.ok(novel.outcomePlan.steps.some((step) => step.id === "build_candidate"));
assert.ok(novel.outcomePlan.steps.some((step) => step.id === "test_candidate"));
assert.ok(novel.outcomePlan.steps.some((step) => step.id === "verify_truth"));

const restricted = planAdaptiveCapability({
  intentId: "intent_restricted",
  userId: "user_test",
  text: "Build an offensive military malware capability",
  desiredOutcome: "Automate offensive intrusion",
  actorScopes: ["read", "execute"],
  nowIso,
});

assert.equal(restricted.risk, "restricted");
assert.equal(restricted.disposition, "review_required");
assert.equal(restricted.outcomePlan.requiresOwnerApproval, true);
assert.equal(restricted.blueprint, null);
assert.ok(!restricted.outcomePlan.steps.some((step) => step.id === "build_candidate"));

const ids = novel.personalSwarm.agents.map((agent) => agent.id);
assert.equal(new Set(ids).size, ids.length);

console.log(
  JSON.stringify(
    {
      marker: "pantavion_adaptive_capability_fabric_test_v1",
      ok: true,
      existingDisposition: existing.disposition,
      novelDisposition: novel.disposition,
      restrictedDisposition: restricted.disposition,
      novelAgentCount: novel.personalSwarm.agents.length,
      translationTargetNaturalLanguages: novel.translation.targetNaturalLanguageCount,
      existingPlanSteps: existing.outcomePlan.steps.length,
      novelPlanSteps: novel.outcomePlan.steps.length,
      latencyBudget: novel.latencyBudget,
    },
    null,
    2,
  ),
);
