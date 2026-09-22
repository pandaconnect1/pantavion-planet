import assert from "node:assert/strict";

const elasticModule = await import("../core/kernel/pantavion-elastic-capability-factory.ts");
const agentModule = await import("../core/intelligence/pantavion-personal-agent-mesh.ts");
const repairModule = await import("../core/kernel/pantavion-self-repair-loop.ts");
const languageModule = await import("../core/translation/pantavion-natural-language-universe.ts");
const coverageModule = await import("../core/translation/pantavion-language-coverage-matrix.ts");

const elastic = elasticModule.createPantavionElasticCapabilityPlan({
  requestId: "audit-future-need",
  userIntent: "Create a completely new future capability for a user that does not exist in the fixed module catalog",
  userOutcome: "future adaptive capability",
  domain: "future_unknown",
  risk: "medium",
  requestedBy: "user",
  requiresRealtime: true,
  requiresPrivateData: false,
  requiresExternalProvider: false,
  requiresPhysicalWorldAction: false,
  requiresRegulatedDecisionSupport: false,
});

assert.equal(elastic.marker, "pantavion_elastic_capability_plan_v1");
assert.equal(elastic.namespace, "pantavion_dynamic");
assert.equal(elastic.authority.mayDeployAutomatically, false);
assert.equal(elastic.authority.mayPerformIrreversibleActionAutomatically, false);
assert(elastic.requiredServices.includes("workflow_agent_fabric"));
assert(elastic.requiredServices.includes("observability_evidence"));
assert(elastic.lifecycle.includes("VERIFIED_LIVE"));

const mesh = agentModule.createPantavionPersonalAgentMesh({
  ownerUserId: "audit-user",
  agents: [
    { kind: "memory", purpose: "Preserve owner-approved continuity" },
    { kind: "language", purpose: "Coordinate multilingual assistance" },
    { kind: "research", purpose: "Research owner-requested topics" },
  ],
});

assert.equal(mesh.marker, "pantavion_personal_agent_mesh_v1");
assert.equal(mesh.noFixedAgentLimitAtArchitectureLevel, true);
assert.equal(mesh.practicalRuntimeLimitsAreQuotaAndSafetyControlled, true);
assert.equal(mesh.coordinator.authority.mayCoordinateOtherOwnerAgents, true);
for (const agent of [mesh.coordinator, ...mesh.agents]) {
  assert.equal(agent.authority.maySpendMoney, false);
  assert.equal(agent.authority.maySendExternalMessageWithoutApproval, false);
  assert.equal(agent.authority.mayChangeLegalMedicalFinancialState, false);
  assert.equal(agent.authority.mayPerformIrreversiblePhysicalAction, false);
  assert.equal(agent.continuity.checkpointed, true);
  assert.equal(agent.continuity.resumable, true);
  assert.equal(agent.continuity.providerPortable, true);
  assert.equal(agent.continuity.modelPortable, true);
}

const transient = repairModule.decidePantavionSelfRepair({
  incidentId: "transient",
  severity: "medium",
  userImpact: true,
  trustedRollbackAvailable: true,
  safeFallbackAvailable: true,
  transientFailure: true,
});
assert.equal(transient.safeAutomaticAction, "retry_bounded");
assert.equal(transient.maxAutomaticAttempts, 2);
assert.equal(transient.requiresPostRepairVerification, true);
assert.equal(transient.mayHideFailureFromUser, false);

const critical = repairModule.decidePantavionSelfRepair({
  incidentId: "critical",
  severity: "critical",
  userImpact: true,
  trustedRollbackAvailable: false,
  safeFallbackAvailable: false,
  transientFailure: false,
});
assert.equal(critical.safeAutomaticAction, "isolate_component");
assert.equal(critical.mayRewriteCanonicalTruthWithoutVerification, false);

assert.equal(languageModule.pantavionNaturalLanguageUniverse.targetNaturalLanguageCount, 7000);
const coverage = coverageModule.createPantavionLanguageCoverageMatrix();
assert.equal(coverage.targetNaturalLanguageCount, 7000);
assert.equal(coverage.verified.fullInterpreterPass, 0);
assert.match(coverage.truthBoundary, /target, not a live-support claim/i);

console.log(JSON.stringify({
  marker: "pantavion_elastic_ecosystem_audit_v1",
  ok: true,
  elasticCapability: {
    unknownFutureDomainsAllowed: elasticModule.PANTAVION_ELASTIC_CAPABILITY_FACTORY.unknownFutureDomainsAllowed,
    generatedCapabilitiesMaySelfDeploy: elasticModule.PANTAVION_ELASTIC_CAPABILITY_FACTORY.generatedCapabilitiesMaySelfDeploy,
    lifecycle: elastic.lifecycle,
  },
  personalAgentMesh: {
    logicalAgentsTested: mesh.agents.length + 1,
    noFixedAgentLimitAtArchitectureLevel: mesh.noFixedAgentLimitAtArchitectureLevel,
    quotaAndSafetyControlled: mesh.practicalRuntimeLimitsAreQuotaAndSafetyControlled,
  },
  selfRepair: {
    transientAction: transient.safeAutomaticAction,
    criticalAction: critical.safeAutomaticAction,
    loop: repairModule.PANTAVION_SELF_REPAIR_LOOP,
  },
  language: {
    targetNaturalLanguageCount: coverage.targetNaturalLanguageCount,
    registeredLanguageCount: coverage.registeredLanguageCount,
    verifiedFullInterpreterPass: coverage.verified.fullInterpreterPass,
  },
}, null, 2));
