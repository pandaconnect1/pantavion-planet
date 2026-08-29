import assert from "node:assert/strict";

import {
  PANTAVION_SOVEREIGNTY_LOOP_V1,
  createPantavionSovereigntySnapshot,
  evaluatePantavionCapabilitySovereignty,
} from "../core/kernel/pantavion-sovereignty-loop.ts";

assert.equal(PANTAVION_SOVEREIGNTY_LOOP_V1.doctrine.noFakeIndependenceClaims, true);
assert.equal(PANTAVION_SOVEREIGNTY_LOOP_V1.doctrine.rollbackRequiredForProviderReplacement, true);
assert.equal(PANTAVION_SOVEREIGNTY_LOOP_V1.doctrine.verifiedEvidenceRequiredBeforePromotion, true);
assert.equal(
  PANTAVION_SOVEREIGNTY_LOOP_V1.loop.includes("VERIFY_LIVE"),
  true,
);

const gateway = evaluatePantavionCapabilitySovereignty({
  capabilityId: "ai.gateway",
  capabilityName: "AI Gateway",
  currentLevel: "THIRD_PARTY_WITH_FALLBACK",
  criticality: "CRITICAL",
  provider: "external-gateway",
  selfHostableCandidate: true,
  pantavionNativeCandidate: false,
  fallbackAvailable: true,
  currentHealth: "degraded",
  switchingCost: 60,
  operationalCost: 70,
  privacyExposure: 55,
  lockInRisk: 80,
  outageImpact: 90,
});

assert.equal(gateway.targetLevel, "SELF_HOSTABLE");
assert.equal(gateway.productionMutationAllowed, false);
assert.equal(gateway.requiresFounderApproval, true);
assert.equal(gateway.requiresRollbackPlan, true);
assert.equal(gateway.externalDependencyStillRequired, true);
assert.ok(gateway.sovereigntyPriority >= 70);

const owned = evaluatePantavionCapabilitySovereignty({
  capabilityId: "kernel.truth",
  capabilityName: "Pantavion Truth Kernel",
  currentLevel: "PANTAVION_OWNED",
  criticality: "CRITICAL",
  currentHealth: "ok",
  lockInRisk: 0,
  privacyExposure: 0,
  outageImpact: 90,
});

assert.equal(owned.targetLevel, "PANTAVION_OWNED");
assert.equal(owned.replacementState, "NO_ACTION");
assert.equal(owned.externalDependencyStillRequired, false);

const unavoidable = evaluatePantavionCapabilitySovereignty({
  capabilityId: "external.required",
  capabilityName: "Currently unavoidable external capability",
  currentLevel: "EXTERNAL_REQUIRED",
  criticality: "HIGH",
  fallbackAvailable: false,
  currentHealth: "ok",
  lockInRisk: 90,
  privacyExposure: 40,
  outageImpact: 80,
});

assert.equal(unavoidable.targetLevel, "EXTERNAL_REQUIRED");
assert.equal(unavoidable.externalDependencyStillRequired, true);
assert.equal(unavoidable.replacementState, "MONITOR");

const snapshot = createPantavionSovereigntySnapshot([
  {
    capabilityId: "owned.one",
    capabilityName: "Owned one",
    currentLevel: "PANTAVION_OWNED",
    criticality: "HIGH",
  },
  {
    capabilityId: "selfhostable.one",
    capabilityName: "Self-hostable one",
    currentLevel: "SELF_HOSTABLE",
    criticality: "MEDIUM",
  },
  {
    capabilityId: "external.one",
    capabilityName: "External one",
    currentLevel: "EXTERNAL_REQUIRED",
    criticality: "CRITICAL",
  },
]);

assert.equal(snapshot.totalCapabilities, 3);
assert.equal(snapshot.currentLevelCounts.PANTAVION_OWNED, 1);
assert.equal(snapshot.currentLevelCounts.SELF_HOSTABLE, 1);
assert.equal(snapshot.currentLevelCounts.EXTERNAL_REQUIRED, 1);
assert.equal(snapshot.sovereigntyCoverage, 67);
assert.match(snapshot.truth, /does not claim independence/);

console.log("PANTAVION SOVEREIGNTY LOOP CONTRACT: PASSED");
console.log("- self-maintaining/self-evolving doctrine: locked");
console.log("- hidden dependency claims: forbidden");
console.log("- direct production self-modification: forbidden");
console.log("- rollback + verified-live before provider retirement: required");
