import type {
  PantavionDemandAssessment,
  PantavionHumanDemandSignal,
  PantavionHumanNeedDomain,
} from "./pantavion-global-human-demand-radar";

export const PANTAVION_DEMAND_PROMOTION_MARKER = "pantavion_demand_promotion_candidate_v1" as const;
export const PANTAVION_FOUNDER_WORK_ORDER_ROUTE = "/api/kernel/work-orders" as const;

export type PantavionDemandProposalTarget =
  | "pantavion_internal"
  | "external_app"
  | "api_integration"
  | "admin_tool"
  | "safety_system"
  | "water_infrastructure"
  | "sos_elder"
  | "translation"
  | "marketplace"
  | "social_universe"
  | "pantaai_center";

export type PantavionDemandProposalCapability =
  | "repo_truth"
  | "code_audit"
  | "error_repair"
  | "scoped_patch"
  | "internal_feature_build"
  | "external_app_build"
  | "provider_integration"
  | "deployment_plan"
  | "founder_approval_gate"
  | "verification";

export interface PantavionDemandWorkOrderProposal {
  idempotencyKey: string;
  founderIntent: string;
  target: PantavionDemandProposalTarget;
  capabilities: PantavionDemandProposalCapability[];
  targetFiles: string[];
  approvalScope: "proposal_only";
  workload: {
    kind: "single_work_order";
    unitCount: 1;
    intakeReference: string;
  };
}

export interface PantavionDemandPromotionInput {
  signal: PantavionHumanDemandSignal;
  assessment: PantavionDemandAssessment;
  countryValidationComplete: boolean;
  countryValidationRefs?: string[];
}

export interface PantavionDemandPromotionCandidate {
  marker: typeof PANTAVION_DEMAND_PROMOTION_MARKER;
  signalId: string;
  eligibleForFounderProposal: boolean;
  persistenceRoute: typeof PANTAVION_FOUNDER_WORK_ORDER_ROUTE;
  reasons: string[];
  safeguards: string[];
  submission: PantavionDemandWorkOrderProposal | null;
}

function safeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "signal";
}

function targetForDomain(domain: PantavionHumanNeedDomain): PantavionDemandProposalTarget {
  switch (domain) {
    case "communication":
    case "social_community":
      return "social_universe";
    case "ai_personal_assistant":
    case "learning":
      return "pantaai_center";
    case "commerce_marketplace":
      return "marketplace";
    case "trust_privacy_identity":
    case "resilience_emergency":
      return "safety_system";
    default:
      return "pantavion_internal";
  }
}

function normalizedValidationRefs(values: string[] = []): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 20);
}

export function createPantavionDemandPromotionCandidate(
  input: PantavionDemandPromotionInput,
): PantavionDemandPromotionCandidate {
  const reasons: string[] = [];
  const validationRefs = normalizedValidationRefs(input.countryValidationRefs);

  if (input.assessment.signalId !== input.signal.id) {
    reasons.push("assessment_signal_mismatch");
  }
  if (input.assessment.productionMutationAllowed !== false) {
    reasons.push("research_signal_must_not_have_production_authority");
  }
  if (input.assessment.decision !== "SPEC_CANDIDATE") {
    reasons.push("assessment_not_spec_candidate");
  }
  if (input.assessment.evidenceScore < 55) {
    reasons.push("evidence_score_below_promotion_threshold");
  }
  if (input.assessment.opportunityScore < 70) {
    reasons.push("opportunity_score_below_promotion_threshold");
  }
  if (input.assessment.riskScore >= 75) {
    reasons.push("risk_requires_additional_validation");
  }
  if (input.assessment.requiresCountryValidation && !input.countryValidationComplete) {
    reasons.push("country_validation_required");
  }
  if (input.assessment.requiresCountryValidation && validationRefs.length === 0) {
    reasons.push("country_validation_evidence_required");
  }

  const eligibleForFounderProposal = reasons.length === 0;
  const safeguards = [
    "This candidate cannot mutate production directly.",
    "Founder review is required before any work order is persisted.",
    "Persisting a proposal-only work order does not authorize file writes or production deployment.",
    "Security, jurisdiction, age, capability, audit, build and live-verification gates remain mandatory.",
    "Research evidence and product hypotheses remain distinguishable in the work-order intent.",
  ];

  if (!eligibleForFounderProposal) {
    return {
      marker: PANTAVION_DEMAND_PROMOTION_MARKER,
      signalId: input.signal.id,
      eligibleForFounderProposal: false,
      persistenceRoute: PANTAVION_FOUNDER_WORK_ORDER_ROUTE,
      reasons,
      safeguards,
      submission: null,
    };
  }

  const hypothesisSummary = input.assessment.productHypotheses.slice(0, 8).join(" | ");
  const validationSummary = validationRefs.join(", ");
  const founderIntent = [
    `Evaluate Pantavion demand signal ${input.signal.id}: ${input.signal.title}.`,
    `Domain: ${input.signal.domain}; scope: ${input.signal.segment.scope}.`,
    `Evidence score ${input.assessment.evidenceScore}/100; opportunity ${input.assessment.opportunityScore}/100; risk ${input.assessment.riskScore}/100.`,
    `Country validation evidence: ${validationSummary}.`,
    hypothesisSummary ? `Product hypotheses: ${hypothesisSummary}.` : "No product hypothesis supplied.",
    "Produce only a bounded, evidence-backed Pantavion implementation proposal. Do not copy third-party products and do not deploy to production from this research promotion.",
  ].join(" ").slice(0, 5900);

  return {
    marker: PANTAVION_DEMAND_PROMOTION_MARKER,
    signalId: input.signal.id,
    eligibleForFounderProposal: true,
    persistenceRoute: PANTAVION_FOUNDER_WORK_ORDER_ROUTE,
    reasons: ["spec_candidate_with_country_validation_and_bounded_risk"],
    safeguards,
    submission: {
      idempotencyKey: `demand:${safeToken(input.signal.id)}:v1`,
      founderIntent,
      target: targetForDomain(input.signal.domain),
      capabilities: [
        "repo_truth",
        "code_audit",
        "verification",
        "founder_approval_gate",
      ],
      targetFiles: [],
      approvalScope: "proposal_only",
      workload: {
        kind: "single_work_order",
        unitCount: 1,
        intakeReference: `demand:${safeToken(input.signal.id)}`,
      },
    },
  };
}
