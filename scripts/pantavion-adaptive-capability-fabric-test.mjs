import assert from "node:assert/strict";
import fs from "node:fs";
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
  personalAiCore: {
    userId: "user_test",
    personalAiId: "11111111-2222-3333-4444-555555555555",
    memoryEnabled: true,
    crossThreadEnabled: true,
    voiceEnabled: true,
    preferredLocale: "el",
    assistanceLevel: "proactive",
  },
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
assert.equal(novel.truth.personalAiProfileBound, true);
assert.equal(novel.personalSwarm.core.personalAiId, "11111111-2222-3333-4444-555555555555");
assert.equal(novel.personalSwarm.logicalCapacity, "unbounded");
assert.ok(novel.personalSwarm.activeAgents.length >= 5);
assert.ok(novel.personalSwarm.activeAgents.every((agent) => agent.parentIntentId === novel.intentId));
assert.ok(novel.dynamicDomain.domainKey.startsWith("domain:"));
assert.equal(novel.dynamicDomain.authority.productionMutationAllowed, false);
assert.equal(novel.blueprint?.domainKey, novel.dynamicDomain.domainKey);
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

const ids = novel.personalSwarm.activeAgents.map((agent) => agent.id);
assert.equal(new Set(ids).size, ids.length);

console.log(
  JSON.stringify(
    {
      marker: "pantavion_adaptive_capability_fabric_test_v1",
      ok: true,
      existingDisposition: existing.disposition,
      novelDisposition: novel.disposition,
      restrictedDisposition: restricted.disposition,
      novelAgentCount: novel.personalSwarm.activeAgents.length,
      dynamicDomainKey: novel.dynamicDomain.domainKey,
      personalAiProfileBound: novel.truth.personalAiProfileBound,
      translationTargetNaturalLanguages: novel.translation.targetNaturalLanguageCount,
      existingPlanSteps: existing.outcomePlan.steps.length,
      novelPlanSteps: novel.outcomePlan.steps.length,
      latencyBudget: novel.latencyBudget,
    },
    null,
    2,
  ),
);


const route = fs.readFileSync("app/api/pantai/execute/route.ts", "utf8");
assert.ok(route.includes("supabase.auth.getUser()"));
assert.ok(route.includes("getPersonalAIState"));
assert.ok(route.includes("personalAiId: personalAI.profile.personal_ai_id"));
assert.ok(route.includes('"Cache-Control": "private, no-store"'));
assert.ok(route.includes('actorScopes: ["read"]'));
assert.ok(route.includes('productionMutation: false'));
assert.ok(route.includes('mode: "adaptive_capability_planning"'));
assert.ok(!route.includes("foundation_stub"));
assert.ok(!route.includes("body.actorScopes"));
