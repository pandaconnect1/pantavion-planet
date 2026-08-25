import {
  resolvePantavionAdaptivePolicy,
  type PantavionAccessDecision,
  type PantavionAdaptiveFeature,
  type PantavionAgeProof,
  type PantavionCountryAdaptiveRule,
} from "./adaptive-ecosystem-policy";
import { getPantavionCountryAdaptiveRule } from "./country-adaptive-policy-registry";

export type PantavionYouthCapability =
  | "learning"
  | "support"
  | "interpreter"
  | "protected_communication"
  | "community_participation"
  | "public_social_feed"
  | "public_social_publish"
  | "marketplace"
  | "dating"
  | "payments"
  | "adult_restricted"
  | "ai_assistant";

export type PantavionYouthPurpose =
  | "education"
  | "human_support"
  | "language_access"
  | "protected_communication"
  | "community_participation"
  | "public_social"
  | "commerce"
  | "adult_only"
  | "general_assistance";

export type PantavionChildBenefit =
  | "learning"
  | "creativity"
  | "safe_connection"
  | "safety_support"
  | "accessibility"
  | "language_bridge"
  | "community_participation"
  | "digital_literacy";

export type PantavionYouthRiskLevel = "low" | "moderate" | "high" | "adult_only";
export type PantavionRegulatoryClass =
  | "education_or_support"
  | "protected_communication"
  | "social_media"
  | "commercial"
  | "adult_only"
  | "general_ai";

export type PantavionYouthCapabilityDecision = {
  countryCode: string;
  age: number | null;
  capability: PantavionYouthCapability;
  mappedFeature: PantavionAdaptiveFeature;
  purpose: PantavionYouthPurpose;
  regulatoryClass: PantavionRegulatoryClass;
  access: PantavionAccessDecision;
  riskLevel: PantavionYouthRiskLevel;
  childBenefits: readonly PantavionChildBenefit[];
  safetyControls: readonly string[];
  evidenceRequired: readonly string[];
  jurisdictionStatus: "missing" | "monitoring" | "reviewed" | "effective";
  jurisdictionReviewRequired: boolean;
  socialFunctionSeparatedFromEducationAndSupport: true;
  optimizeForChildBenefitNotEngagement: boolean;
  reasons: readonly string[];
};

type CapabilityDefinition = {
  feature: PantavionAdaptiveFeature;
  purpose: PantavionYouthPurpose;
  regulatoryClass: PantavionRegulatoryClass;
  riskLevel: PantavionYouthRiskLevel;
  benefits: readonly PantavionChildBenefit[];
};

export const pantavionYouthCapabilityDefinitions: Record<PantavionYouthCapability, CapabilityDefinition> = {
  learning: {
    feature: "panta_learn",
    purpose: "education",
    regulatoryClass: "education_or_support",
    riskLevel: "low",
    benefits: ["learning", "creativity", "digital_literacy", "accessibility"],
  },
  support: {
    feature: "ai_assistant",
    purpose: "human_support",
    regulatoryClass: "education_or_support",
    riskLevel: "moderate",
    benefits: ["safety_support", "accessibility", "language_bridge"],
  },
  interpreter: {
    feature: "interpreter",
    purpose: "language_access",
    regulatoryClass: "education_or_support",
    riskLevel: "low",
    benefits: ["language_bridge", "learning", "accessibility"],
  },
  protected_communication: {
    feature: "direct_message",
    purpose: "protected_communication",
    regulatoryClass: "protected_communication",
    riskLevel: "moderate",
    benefits: ["safe_connection", "language_bridge"],
  },
  community_participation: {
    feature: "communities",
    purpose: "community_participation",
    regulatoryClass: "social_media",
    riskLevel: "moderate",
    benefits: ["community_participation", "safe_connection", "learning"],
  },
  public_social_feed: {
    feature: "social_feed",
    purpose: "public_social",
    regulatoryClass: "social_media",
    riskLevel: "high",
    benefits: ["community_participation", "digital_literacy"],
  },
  public_social_publish: {
    feature: "social_publish",
    purpose: "public_social",
    regulatoryClass: "social_media",
    riskLevel: "high",
    benefits: ["creativity", "community_participation", "digital_literacy"],
  },
  marketplace: {
    feature: "marketplace",
    purpose: "commerce",
    regulatoryClass: "commercial",
    riskLevel: "high",
    benefits: ["digital_literacy"],
  },
  dating: {
    feature: "dating",
    purpose: "adult_only",
    regulatoryClass: "adult_only",
    riskLevel: "adult_only",
    benefits: [],
  },
  payments: {
    feature: "payments",
    purpose: "commerce",
    regulatoryClass: "commercial",
    riskLevel: "high",
    benefits: ["digital_literacy"],
  },
  adult_restricted: {
    feature: "adult_restricted",
    purpose: "adult_only",
    regulatoryClass: "adult_only",
    riskLevel: "adult_only",
    benefits: [],
  },
  ai_assistant: {
    feature: "ai_assistant",
    purpose: "general_assistance",
    regulatoryClass: "general_ai",
    riskLevel: "moderate",
    benefits: ["learning", "creativity", "accessibility", "language_bridge", "digital_literacy"],
  },
};

const ACCESS_RANK: Record<PantavionAccessDecision, number> = {
  allowed: 0,
  restricted: 1,
  requires_guardian: 2,
  requires_age_proof: 2,
  blocked: 3,
};

function stricterAccess(current: PantavionAccessDecision, next: PantavionAccessDecision): PantavionAccessDecision {
  return ACCESS_RANK[next] > ACCESS_RANK[current] ? next : current;
}

export function resolvePantavionYouthCapability(input: {
  countryCode: string;
  capability: PantavionYouthCapability;
  age?: number | null;
  birthDate?: string | null;
  guardianConsent?: boolean;
  ageProof?: PantavionAgeProof;
  countryRule?: PantavionCountryAdaptiveRule | null;
}): PantavionYouthCapabilityDecision {
  const definition = pantavionYouthCapabilityDefinitions[input.capability];
  const countryCode = input.countryCode.trim().toUpperCase();
  const countryRule = input.countryRule === undefined
    ? getPantavionCountryAdaptiveRule(countryCode)
    : input.countryRule;

  const base = resolvePantavionAdaptivePolicy({
    countryCode,
    feature: definition.feature,
    age: input.age,
    birthDate: input.birthDate,
    guardianConsent: input.guardianConsent,
    ageProof: input.ageProof,
    countryRule,
  });

  const age = base.ageRole.age;
  const minor = typeof age === "number" && age < 18;
  let access = base.access;
  const controls = new Set<string>(base.protections);
  const reasons = new Set<string>(base.reasons);

  controls.add("purpose-bound-capability-separation");
  controls.add("data-minimization");
  controls.add("age-appropriate-content-ceiling");
  controls.add("transparent-user-controls");

  if (minor) {
    controls.add("no-targeted-ads");
    controls.add("no-engagement-maximization-for-minors");
    controls.add("no-infinite-scroll-by-default");
    controls.add("no-autoplay-by-default");
    controls.add("adult-zone-separation");

    if (definition.regulatoryClass === "general_ai" || definition.purpose === "human_support") {
      access = stricterAccess(access, "restricted");
      controls.add("bounded-ai-for-minors");
      controls.add("no-sensitive-trait-diagnosis");
      controls.add("no-autonomous-high-impact-decisions");
      reasons.add("minor-ai-bounded-mode");
    }

    if (definition.regulatoryClass === "adult_only") {
      access = "blocked";
      reasons.add("adult-only-capability-separated-from-youth-experience");
    }
  }

  if (definition.regulatoryClass === "social_media") {
    controls.add("recommendation-explainability");
    controls.add("chronological-or-bounded-recommendation-mode-for-minors");
    controls.add("anti-bullying-and-contact-safety-controls");
  }

  if (definition.purpose === "education" || definition.purpose === "human_support" || definition.purpose === "language_access") {
    controls.add("benefit-first-ranking");
    controls.add("do-not-convert-support-or-learning-into-public-social");
  }

  const evidenceRequired = [
    "versioned-policy-decision",
    "country-law-source-and-effective-date",
    "age-safety-risk-assessment",
    "capability-purpose-declaration",
    "recommendation-logic-declaration",
    "minor-data-minimization-evidence",
    "safety-control-test-evidence",
    "audit-trace-without-unnecessary-sensitive-content",
  ];

  if (definition.regulatoryClass === "social_media") {
    evidenceRequired.push("social-risk-assessment", "age-assurance-design-where-legally-required");
  }
  if (definition.regulatoryClass === "general_ai") {
    evidenceRequired.push("ai-risk-and-human-control-evidence");
  }

  const jurisdictionStatus = countryRule?.status ?? "missing";

  return {
    countryCode,
    age,
    capability: input.capability,
    mappedFeature: definition.feature,
    purpose: definition.purpose,
    regulatoryClass: definition.regulatoryClass,
    access,
    riskLevel: definition.riskLevel,
    childBenefits: definition.benefits,
    safetyControls: [...controls],
    evidenceRequired,
    jurisdictionStatus,
    jurisdictionReviewRequired: base.jurisdictionReviewRequired,
    socialFunctionSeparatedFromEducationAndSupport: true,
    optimizeForChildBenefitNotEngagement: minor && definition.regulatoryClass !== "adult_only",
    reasons: [...reasons],
  };
}
