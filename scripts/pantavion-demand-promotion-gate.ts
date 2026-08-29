import assert from "node:assert/strict";

import { createPantavionDemandPromotionCandidate } from "../core/research/pantavion-demand-promotion";
import type {
  PantavionDemandAssessment,
  PantavionHumanDemandSignal,
} from "../core/research/pantavion-global-human-demand-radar";

const signal: PantavionHumanDemandSignal = {
  id: "global-fragmentation-test",
  title: "Users want fewer fragmented apps",
  domain: "ai_personal_assistant",
  signalType: "fragmentation",
  segment: {
    scope: "continent",
    continent: "Europe",
    countries: ["CY", "GR"],
  },
  evidence: [
    {
      id: "e1",
      title: "Country validation",
      publisher: "Test research source",
      url: "https://example.com/research",
      observedAt: "2026-08-29",
      tier: "country_report",
      claim: "Validated demand signal",
      confidence: 90,
    },
  ],
  prevalence: 90,
  userFriction: 85,
  pantavionFit: 95,
  urgency: 80,
  trustOrRegulatoryRisk: 40,
  hypothesis: "A unified Pantavion surface may reduce app switching.",
  proposedCapabilities: ["cross-module Personal AI continuity"],
};

const specAssessment: PantavionDemandAssessment = {
  signalId: signal.id,
  decision: "SPEC_CANDIDATE",
  evidenceScore: 70,
  opportunityScore: 88,
  riskScore: 40,
  productionMutationAllowed: false,
  requiresCountryValidation: true,
  requiresFounderApprovalForSpec: true,
  researchActions: [],
  productHypotheses: ["Unify intent routing across Pantavion modules"],
  safeguards: [],
};

const missingCountryValidation = createPantavionDemandPromotionCandidate({
  signal,
  assessment: specAssessment,
  countryValidationComplete: false,
  countryValidationRefs: [],
});
assert.equal(missingCountryValidation.eligibleForFounderProposal, false);
assert.equal(missingCountryValidation.submission, null);
assert.ok(missingCountryValidation.reasons.includes("country_validation_required"));
assert.ok(missingCountryValidation.reasons.includes("country_validation_evidence_required"));

const eligible = createPantavionDemandPromotionCandidate({
  signal,
  assessment: specAssessment,
  countryValidationComplete: true,
  countryValidationRefs: ["country-study-cy-2026", "country-study-gr-2026"],
});
assert.equal(eligible.eligibleForFounderProposal, true);
assert.ok(eligible.submission);
assert.equal(eligible.submission?.approvalScope, "proposal_only");
assert.deepEqual(eligible.submission?.targetFiles, []);
assert.equal(eligible.submission?.target, "pantaai_center");
assert.equal(eligible.submission?.workload?.kind, "single_work_order");
assert.equal(eligible.submission?.workload?.unitCount, 1);
assert.ok(eligible.safeguards.some((item) => item.includes("cannot mutate production directly")));
assert.ok(eligible.safeguards.some((item) => item.includes("does not authorize file writes")));

const highRisk = createPantavionDemandPromotionCandidate({
  signal,
  assessment: {
    ...specAssessment,
    riskScore: 80,
  },
  countryValidationComplete: true,
  countryValidationRefs: ["country-study-cy-2026"],
});
assert.equal(highRisk.eligibleForFounderProposal, false);
assert.ok(highRisk.reasons.includes("risk_requires_additional_validation"));

const prototypeOnly = createPantavionDemandPromotionCandidate({
  signal,
  assessment: {
    ...specAssessment,
    decision: "PROTOTYPE",
  },
  countryValidationComplete: true,
  countryValidationRefs: ["country-study-cy-2026"],
});
assert.equal(prototypeOnly.eligibleForFounderProposal, false);
assert.ok(prototypeOnly.reasons.includes("assessment_not_spec_candidate"));

console.log("Pantavion demand promotion gate: PASS");
