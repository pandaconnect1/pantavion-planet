export const pantavionEvolutionEngineV1 = {
  id: "pantavion_evolution_engine_v1",
  cadence: ["daily", "every_9_hours"],
  continents: ["Africa", "Antarctica", "Asia", "Europe", "North America", "Oceania", "South America"],
  domains: ["AI", "Cloud", "Databases", "Security", "Infrastructure", "Hardware", "Robotics", "Education", "Health", "Science", "Communication", "Commerce", "Global similar ecosystems"],
  doctrine: {
    founderSovereignty: true,
    lawfulOriginalAdaptation: true,
    noUnauthorizedAccess: true,
    noProprietaryCopying: true,
    noBlindProductionRewrite: true,
    buildAuditTypecheckRequired: true,
  },
} as const;

export const pantavionEvolutionEngineV2 = {
  id: "pantavion_evolution_engine_v2",
  horizons: ["NOW", "NEXT", "AHEAD"],
  decisions: ["MONITOR", "VERIFY_LAW", "SPEC_UPDATE", "CODE_CANDIDATE", "NO_ACTION"],
  maxForesightSteps: 10,
  doctrine: {
    ...pantavionEvolutionEngineV1.doctrine,
    verifiedSourcesBeforeAction: true,
    predictionsAreHypothesesNotFacts: true,
    sourceSignalCannotMutateProductionDirectly: true,
    reversibleExperimentsBeforeIrreversibleChange: true,
    jurisdictionAware: true,
    humanBenefitRequired: true,
    securityCannotBeRelaxedByInnovationSignal: true,
  },
} as const;

export type PantavionEvolutionHorizon = (typeof pantavionEvolutionEngineV2.horizons)[number];
export type PantavionEvolutionDecision = (typeof pantavionEvolutionEngineV2.decisions)[number];

export type PantavionTechnologySignalDomain =
  | "ai_capability"
  | "agentic_ai"
  | "cybersecurity"
  | "identity_age_assurance"
  | "privacy_data"
  | "regulation_law"
  | "social_platforms"
  | "translation_communication"
  | "education_learning"
  | "infrastructure_compute"
  | "hardware_devices"
  | "market_business"
  | "science_research";

export type PantavionTechnologySignalEventType =
  | "law_or_regulation"
  | "security_incident"
  | "research_result"
  | "product_capability"
  | "platform_policy"
  | "market_shift"
  | "infrastructure_shift";

export type PantavionSignalSourceTier =
  | "official_regulator"
  | "primary_vendor"
  | "peer_reviewed"
  | "reputable_wire"
  | "reputable_secondary"
  | "unverified_secondary";

export interface PantavionSignalEvidence {
  title: string;
  publisher: string;
  url: string;
  publishedAt?: string;
  tier: PantavionSignalSourceTier;
}

export interface PantavionForesightHypothesisInput {
  hypothesis: string;
  confidence: number;
  evidenceRefs?: string[];
}

export interface PantavionTechnologySignalInput {
  id: string;
  title: string;
  summary: string;
  domain: PantavionTechnologySignalDomain;
  eventType: PantavionTechnologySignalEventType;
  observedAt: string;
  jurisdictions?: string[];
  productionRelevance: number;
  humanBenefitPotential: number;
  noveltyPotential: number;
  riskIfIgnored: number;
  reversibility: number;
  evidence: PantavionSignalEvidence[];
  foresightHypotheses?: PantavionForesightHypothesisInput[];
}

export interface PantavionForesightStep {
  step: number;
  hypothesis: string;
  confidence: number;
  truthStatus: "hypothesis_not_fact";
  evidenceRefs: string[];
}

export interface PantavionTechnologySignalDecision {
  signalId: string;
  engine: typeof pantavionEvolutionEngineV2.id;
  horizon: PantavionEvolutionHorizon;
  decision: PantavionEvolutionDecision;
  evidenceScore: number;
  strategicLeadScore: number;
  sourceDiversity: number;
  officialOrPrimaryEvidencePresent: boolean;
  productionMutationAllowed: false;
  requiresFounderApproval: boolean;
  experimentLane: "none" | "research" | "sandbox" | "feature_flag" | "staging";
  foresight: PantavionForesightStep[];
  foresightCoverage: string;
  safeguards: string[];
  rationale: string[];
}

const clampScore = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const sourceWeight: Record<PantavionSignalSourceTier, number> = {
  official_regulator: 40,
  primary_vendor: 32,
  peer_reviewed: 32,
  reputable_wire: 24,
  reputable_secondary: 15,
  unverified_secondary: 5,
};

function evidenceScore(evidence: PantavionSignalEvidence[]): number {
  const uniquePublishers = new Set(evidence.map((item) => item.publisher.trim().toLowerCase()).filter(Boolean));
  const weighted = evidence.reduce((sum, item) => sum + sourceWeight[item.tier], 0);
  const diversityBonus = Math.min(20, Math.max(0, uniquePublishers.size - 1) * 7);
  return clampScore(weighted + diversityBonus);
}

function hasOfficialOrPrimaryEvidence(evidence: PantavionSignalEvidence[]): boolean {
  return evidence.some((item) =>
    item.tier === "official_regulator" || item.tier === "primary_vendor" || item.tier === "peer_reviewed"
  );
}

function determineHorizon(input: PantavionTechnologySignalInput, evidence: number): PantavionEvolutionHorizon {
  const productionRelevance = clampScore(input.productionRelevance);
  const riskIfIgnored = clampScore(input.riskIfIgnored);
  const novelty = clampScore(input.noveltyPotential);

  if (productionRelevance >= 70 || riskIfIgnored >= 80) return "NOW";
  if (evidence >= 55 && (productionRelevance >= 40 || novelty >= 65)) return "NEXT";
  return "AHEAD";
}

function determineDecision(
  input: PantavionTechnologySignalInput,
  evidence: number,
  officialOrPrimary: boolean,
): PantavionEvolutionDecision {
  const productionRelevance = clampScore(input.productionRelevance);
  const humanBenefit = clampScore(input.humanBenefitPotential);
  const novelty = clampScore(input.noveltyPotential);
  const riskIfIgnored = clampScore(input.riskIfIgnored);
  const reversibility = clampScore(input.reversibility);

  if (evidence < 30) return "MONITOR";

  if (input.eventType === "law_or_regulation" && !input.evidence.some((item) => item.tier === "official_regulator")) {
    return "VERIFY_LAW";
  }

  if (input.eventType === "law_or_regulation" && productionRelevance >= 50) return "SPEC_UPDATE";
  if (input.eventType === "security_incident" && riskIfIgnored >= 60) return "SPEC_UPDATE";
  if (riskIfIgnored >= 80 || reversibility < 35) return "SPEC_UPDATE";

  if (
    officialOrPrimary &&
    evidence >= 55 &&
    humanBenefit >= 60 &&
    novelty >= 55 &&
    reversibility >= 60
  ) {
    return "CODE_CANDIDATE";
  }

  if (productionRelevance < 20 && novelty < 25 && riskIfIgnored < 25) return "NO_ACTION";
  return "MONITOR";
}

function experimentLane(decision: PantavionEvolutionDecision, horizon: PantavionEvolutionHorizon) {
  if (decision === "NO_ACTION") return "none" as const;
  if (decision === "MONITOR" || decision === "VERIFY_LAW") return "research" as const;
  if (decision === "SPEC_UPDATE") return horizon === "NOW" ? "staging" as const : "sandbox" as const;
  return horizon === "NOW" ? "feature_flag" as const : "sandbox" as const;
}

function normalizeForesight(input: PantavionForesightHypothesisInput[] = []): PantavionForesightStep[] {
  return input
    .filter((item) => item && item.hypothesis.trim().length > 0)
    .slice(0, pantavionEvolutionEngineV2.maxForesightSteps)
    .map((item, index) => ({
      step: index + 1,
      hypothesis: item.hypothesis.trim(),
      confidence: clampScore(item.confidence),
      truthStatus: "hypothesis_not_fact" as const,
      evidenceRefs: Array.isArray(item.evidenceRefs) ? item.evidenceRefs.slice(0, 8) : [],
    }));
}

export function analyzePantavionTechnologySignal(
  input: PantavionTechnologySignalInput,
): PantavionTechnologySignalDecision {
  const evidence = evidenceScore(input.evidence);
  const officialOrPrimary = hasOfficialOrPrimaryEvidence(input.evidence);
  const horizon = determineHorizon(input, evidence);
  const decision = determineDecision(input, evidence, officialOrPrimary);
  const foresight = normalizeForesight(input.foresightHypotheses);

  const strategicLeadScore = clampScore(
    clampScore(input.noveltyPotential) * 0.3 +
      clampScore(input.humanBenefitPotential) * 0.25 +
      clampScore(input.riskIfIgnored) * 0.2 +
      clampScore(input.reversibility) * 0.15 +
      evidence * 0.1,
  );

  const sourceDiversity = new Set(input.evidence.map((item) => item.publisher.trim().toLowerCase()).filter(Boolean)).size;
  const requiresFounderApproval = decision === "SPEC_UPDATE" || decision === "CODE_CANDIDATE";

  const rationale = [
    `Evidence score ${evidence}/100 across ${sourceDiversity} distinct publisher(s).`,
    `Horizon ${horizon} based on production relevance, risk if ignored, novelty and evidence maturity.`,
    `Decision ${decision}; a technology/news signal cannot directly mutate production.`,
  ];

  if (foresight.length < pantavionEvolutionEngineV2.maxForesightSteps) {
    rationale.push(
      `Foresight coverage is ${foresight.length}/${pantavionEvolutionEngineV2.maxForesightSteps}; missing future steps remain unknown rather than invented.`,
    );
  }

  return {
    signalId: input.id,
    engine: pantavionEvolutionEngineV2.id,
    horizon,
    decision,
    evidenceScore: evidence,
    strategicLeadScore,
    sourceDiversity,
    officialOrPrimaryEvidencePresent: officialOrPrimary,
    productionMutationAllowed: false,
    requiresFounderApproval,
    experimentLane: experimentLane(decision, horizon),
    foresight,
    foresightCoverage: `${foresight.length}/${pantavionEvolutionEngineV2.maxForesightSteps}`,
    safeguards: [
      "signal-does-not-directly-change-production",
      "predictions-remain-labelled-hypotheses-until-verified",
      "security-and-jurisdiction-controls-cannot-be-relaxed-by-signal-analysis",
      "irreversible-or-high-risk-changes-require-specification-and-review-first",
      "code-candidates-enter-controlled-experiment-lane-before-production",
      "founder-approval-required-for-spec-or-code-promotion",
    ],
    rationale,
  };
}

export function createPantavionEvolutionReport() {
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    engine: pantavionEvolutionEngineV2.id,
    legacyEngine: pantavionEvolutionEngineV1.id,
    cadence: pantavionEvolutionEngineV1.cadence,
    continents: pantavionEvolutionEngineV1.continents,
    domains: pantavionEvolutionEngineV1.domains,
    horizons: pantavionEvolutionEngineV2.horizons,
    decisions: pantavionEvolutionEngineV2.decisions,
    governance: pantavionEvolutionEngineV2.doctrine,
    founderBrief: {
      summary: "Evolution Engine V2 converts verified external signals into governed NOW/NEXT/AHEAD decisions and explicitly-labelled foresight hypotheses.",
      rule: "Observe -> verify -> forecast -> design Pantavion-native response -> controlled experiment -> tests -> production verification.",
      nextActions: [
        "Feed verified technology signals through the V2 analysis contract.",
        "Require ten-step foresight coverage where evidence supports it; never invent missing steps.",
        "Promote only SPEC_UPDATE or CODE_CANDIDATE items through controlled review and CI.",
      ],
    },
  };
}
