export const PANTAVION_RESEARCH_CONTINENTS = [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
] as const;

export type PantavionResearchContinent =
  (typeof PANTAVION_RESEARCH_CONTINENTS)[number];

export type PantavionHumanNeedDomain =
  | "communication"
  | "social_community"
  | "ai_personal_assistant"
  | "work_business"
  | "learning"
  | "creator_media"
  | "commerce_marketplace"
  | "maps_mobility"
  | "files_workspace"
  | "trust_privacy_identity"
  | "public_services"
  | "resilience_emergency"
  | "entertainment";

export type PantavionDemandSignalType =
  | "adoption"
  | "pain_point"
  | "fragmentation"
  | "unmet_need"
  | "connectivity_constraint"
  | "trust_risk"
  | "language_culture"
  | "accessibility"
  | "willingness_to_pay"
  | "behavior_shift";

export type PantavionResearchEvidenceTier =
  | "official"
  | "industry_primary"
  | "peer_reviewed"
  | "reputable_research"
  | "country_report"
  | "hypothesis";

export type PantavionConnectivityProfile =
  | "high_reliability"
  | "mixed"
  | "low_bandwidth"
  | "intermittent"
  | "satellite_or_radio_edge";

export type PantavionDeviceProfile =
  | "mobile_first"
  | "mobile_plus_desktop"
  | "desktop_specialist"
  | "field_device"
  | "mixed";

export type PantavionDemandDecision =
  | "NO_ACTION"
  | "MONITOR"
  | "VALIDATE_WITH_USERS"
  | "PROTOTYPE"
  | "SPEC_CANDIDATE";

export interface PantavionDemandEvidence {
  id: string;
  title: string;
  publisher: string;
  url: string;
  observedAt: string;
  tier: PantavionResearchEvidenceTier;
  claim: string;
  confidence: number;
}

export interface PantavionDemandSegment {
  continent: PantavionResearchContinent;
  countries?: string[];
  ageBands?: string[];
  languages?: string[];
  connectivity?: PantavionConnectivityProfile[];
  deviceProfiles?: PantavionDeviceProfile[];
  notes?: string[];
}

export interface PantavionHumanDemandSignal {
  id: string;
  title: string;
  domain: PantavionHumanNeedDomain;
  signalType: PantavionDemandSignalType;
  segment: PantavionDemandSegment;
  evidence: PantavionDemandEvidence[];
  prevalence: number;
  userFriction: number;
  pantavionFit: number;
  urgency: number;
  trustOrRegulatoryRisk: number;
  hypothesis?: string;
  proposedCapabilities?: string[];
}

export interface PantavionDemandAssessment {
  signalId: string;
  decision: PantavionDemandDecision;
  evidenceScore: number;
  opportunityScore: number;
  riskScore: number;
  productionMutationAllowed: false;
  requiresCountryValidation: boolean;
  requiresFounderApprovalForSpec: boolean;
  researchActions: string[];
  productHypotheses: string[];
  safeguards: string[];
}

const clamp = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const evidenceWeight: Record<PantavionResearchEvidenceTier, number> = {
  official: 40,
  industry_primary: 32,
  peer_reviewed: 32,
  reputable_research: 22,
  country_report: 18,
  hypothesis: 3,
};

function scoreEvidence(evidence: PantavionDemandEvidence[]): number {
  const publishers = new Set(
    evidence.map((item) => item.publisher.trim().toLowerCase()).filter(Boolean),
  );
  const weighted = evidence.reduce(
    (sum, item) => sum + evidenceWeight[item.tier] * (clamp(item.confidence) / 100),
    0,
  );
  const diversity = Math.min(20, Math.max(0, publishers.size - 1) * 6);
  return clamp(weighted + diversity);
}

function decisionFor(input: PantavionHumanDemandSignal, evidenceScore: number): PantavionDemandDecision {
  const opportunity = clamp(
    clamp(input.prevalence) * 0.25 +
      clamp(input.userFriction) * 0.25 +
      clamp(input.pantavionFit) * 0.35 +
      clamp(input.urgency) * 0.15,
  );
  const risk = clamp(input.trustOrRegulatoryRisk);

  if (evidenceScore < 20) return "MONITOR";
  if (opportunity < 25) return "NO_ACTION";
  if (risk >= 75) return "VALIDATE_WITH_USERS";
  if (evidenceScore >= 55 && opportunity >= 70) return "SPEC_CANDIDATE";
  if (evidenceScore >= 40 && opportunity >= 55) return "PROTOTYPE";
  return "VALIDATE_WITH_USERS";
}

export function assessPantavionHumanDemand(
  input: PantavionHumanDemandSignal,
): PantavionDemandAssessment {
  if (!PANTAVION_RESEARCH_CONTINENTS.includes(input.segment.continent)) {
    throw new Error("pantavion_demand_continent_invalid");
  }
  if (!input.id.trim() || !input.title.trim()) {
    throw new Error("pantavion_demand_identity_required");
  }
  if (input.evidence.length === 0) {
    throw new Error("pantavion_demand_evidence_required");
  }

  const evidenceScore = scoreEvidence(input.evidence);
  const opportunityScore = clamp(
    clamp(input.prevalence) * 0.25 +
      clamp(input.userFriction) * 0.25 +
      clamp(input.pantavionFit) * 0.35 +
      clamp(input.urgency) * 0.15,
  );
  const riskScore = clamp(input.trustOrRegulatoryRisk);
  const decision = decisionFor(input, evidenceScore);

  const productHypotheses = [
    ...(input.hypothesis ? [input.hypothesis] : []),
    ...(input.proposedCapabilities ?? []),
  ].slice(0, 20);

  return {
    signalId: input.id,
    decision,
    evidenceScore,
    opportunityScore,
    riskScore,
    productionMutationAllowed: false,
    requiresCountryValidation: true,
    requiresFounderApprovalForSpec: decision === "SPEC_CANDIDATE",
    researchActions: [
      "Validate the signal at country level before treating a continental pattern as a product rule.",
      "Segment by age, language, accessibility needs, device profile, connectivity and urban/rural context where evidence permits.",
      "Map the human need behind each external app or behavior instead of copying the external product.",
      "Measure trust, safety, privacy, legal and affordability constraints before proposing execution changes.",
      "Preserve conflicting evidence and uncertainty rather than forcing one global behavior model.",
    ],
    productHypotheses,
    safeguards: [
      "Research signals cannot mutate production directly.",
      "Continental averages cannot override country law or age policy.",
      "No demographic stereotype becomes a deterministic user rule.",
      "Personal data research must be consented, minimized and aggregated where possible.",
      "High-risk capabilities require the existing Pantavion security, jurisdiction, capability and founder approval gates.",
    ],
  };
}

export const pantavionGlobalHumanDemandRadar = {
  id: "pantavion_global_human_demand_radar_v1",
  continents: PANTAVION_RESEARCH_CONTINENTS,
  objective:
    "Continuously understand the human needs currently spread across many apps and services, then convert evidence-backed needs into Pantavion research, prototype and specification candidates without copying products or bypassing governance.",
  layers: [
    "global",
    "continent",
    "country",
    "region_or_city",
    "age_band",
    "language_and_culture",
    "connectivity_and_device",
    "accessibility",
    "human_need",
  ],
  cadence: {
    global: "monthly",
    continent: "monthly",
    countryPriorityMarkets: "weekly",
    fastMovingSignals: "daily",
  },
  doctrine: {
    evidenceBeforeConclusion: true,
    countryBeforeEnforcement: true,
    userNeedBeforeFeatureCopy: true,
    noDirectProductionMutation: true,
    uncertaintyPreserved: true,
    privacyByDesign: true,
    ageAndJurisdictionAware: true,
    founderApprovalForSpecPromotion: true,
  },
} as const;
