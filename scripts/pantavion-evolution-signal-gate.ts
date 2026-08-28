import {
  analyzePantavionTechnologySignal,
  pantavionEvolutionEngineV2,
} from "../core/kernel/pantavion-evolution-engine";
import { pantavionCurrentTechnologySignals } from "../core/kernel/pantavion-evolution-current-signals";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const decisions = pantavionCurrentTechnologySignals.map((signal) => ({
  signal,
  decision: analyzePantavionTechnologySignal(signal),
}));

assert(decisions.length >= 3, "expected at least three current technology signals");

for (const { signal, decision } of decisions) {
  assert(signal.evidence.length > 0, `${signal.id}: evidence is required`);
  assert(decision.productionMutationAllowed === false, `${signal.id}: signal must never directly mutate production`);
  assert(decision.foresight.length <= pantavionEvolutionEngineV2.maxForesightSteps, `${signal.id}: foresight exceeds maximum depth`);
  assert(decision.foresight.length === 10, `${signal.id}: current seed signal must carry full ten-step foresight coverage`);
  assert(decision.foresightCoverage === "10/10", `${signal.id}: foresight coverage must be explicit`);
  assert(
    decision.foresight.every((step) => step.truthStatus === "hypothesis_not_fact"),
    `${signal.id}: predictions must remain labelled hypotheses`,
  );
  assert(
    decision.safeguards.includes("signal-does-not-directly-change-production"),
    `${signal.id}: production safety safeguard missing`,
  );
}

const agentic = decisions.find(({ signal }) => signal.id === "signal-agentic-cyber-2026-08-27");
assert(agentic, "agentic cyber signal missing");
assert(agentic.decision.horizon === "NOW", "agentic cyber signal should be NOW");
assert(agentic.decision.decision === "SPEC_UPDATE", "agentic cyber incident should require spec/security update before code promotion");
assert(agentic.decision.officialOrPrimaryEvidencePresent, "agentic cyber signal should include primary or peer-reviewed evidence");

const youth = decisions.find(({ signal }) => signal.id === "signal-youth-age-assurance-2026-08-27");
assert(youth, "youth age assurance signal missing");
assert(youth.decision.horizon === "NOW", "youth safety signal should be NOW");
assert(youth.decision.decision === "MONITOR", "single reputable reporting source should remain monitor until stronger primary evidence is attached");
assert(youth.decision.productionMutationAllowed === false, "youth signal cannot directly rewrite production policy");

const eu = decisions.find(({ signal }) => signal.id === "signal-eu-ai-act-enforcement-2026-08-27");
assert(eu, "EU AI Act signal missing");
assert(eu.decision.horizon === "NOW", "EU AI Act enforcement should be NOW");
assert(eu.decision.decision === "SPEC_UPDATE", "verified effective regulation should require specification/compliance update");
assert(eu.decision.officialOrPrimaryEvidencePresent, "EU AI Act signal must include official regulator evidence");
assert(eu.decision.requiresFounderApproval, "spec update promotion requires founder approval");

const unverifiedLaw = analyzePantavionTechnologySignal({
  id: "test-unverified-law",
  title: "Unverified legal claim",
  summary: "Synthetic gate fixture.",
  domain: "regulation_law",
  eventType: "law_or_regulation",
  observedAt: "2026-08-28T00:00:00Z",
  productionRelevance: 99,
  humanBenefitPotential: 90,
  noveltyPotential: 90,
  riskIfIgnored: 90,
  reversibility: 90,
  evidence: [
    {
      title: "Unverified post",
      publisher: "Synthetic Secondary",
      url: "https://example.invalid/unverified",
      tier: "unverified_secondary",
    },
  ],
  foresightHypotheses: [],
});

assert(unverifiedLaw.decision === "MONITOR", "very weak legal evidence must not be promoted");
assert(unverifiedLaw.productionMutationAllowed === false, "weak evidence must never mutate production");

const reputableButNotOfficialLaw = analyzePantavionTechnologySignal({
  id: "test-reputable-law-report",
  title: "Reported legal change without official source",
  summary: "Synthetic gate fixture.",
  domain: "regulation_law",
  eventType: "law_or_regulation",
  observedAt: "2026-08-28T00:00:00Z",
  productionRelevance: 90,
  humanBenefitPotential: 80,
  noveltyPotential: 70,
  riskIfIgnored: 85,
  reversibility: 80,
  evidence: [
    {
      title: "Wire report",
      publisher: "Synthetic Wire",
      url: "https://example.invalid/wire",
      tier: "reputable_wire",
    },
    {
      title: "Secondary analysis",
      publisher: "Synthetic Analysis",
      url: "https://example.invalid/analysis",
      tier: "reputable_secondary",
    },
  ],
  foresightHypotheses: [],
});

assert(reputableButNotOfficialLaw.decision === "VERIFY_LAW", "legal claims without official evidence must enter VERIFY_LAW");
assert(reputableButNotOfficialLaw.experimentLane === "research", "unverified law remains in research lane");

console.log(
  JSON.stringify(
    {
      status: "PASS",
      engine: pantavionEvolutionEngineV2.id,
      signals: decisions.length,
      invariants: {
        tenStepForesight: true,
        hypothesesNotFacts: true,
        noBlindProductionMutation: true,
        legalClaimsNeedOfficialVerification: true,
        highRiskSecurityGoesThroughSpecFirst: true,
      },
      current: decisions.map(({ signal, decision }) => ({
        id: signal.id,
        horizon: decision.horizon,
        decision: decision.decision,
        evidenceScore: decision.evidenceScore,
        strategicLeadScore: decision.strategicLeadScore,
      })),
    },
    null,
    2,
  ),
);
