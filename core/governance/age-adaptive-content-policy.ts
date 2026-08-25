import { resolvePantavionAgeRole } from "../identity/age-role-engine";
import {
  resolvePantavionAdaptivePolicy,
  type PantavionAdaptiveFeature,
  type PantavionCountryAdaptiveRule,
  type PantavionAgeProof,
} from "./adaptive-ecosystem-policy";

export type PantavionContentCategory =
  | "learning"
  | "culture"
  | "news"
  | "social"
  | "creator"
  | "health_information"
  | "commerce"
  | "adult_restricted";

export type PantavionContentRiskTag =
  | "adult-only"
  | "commercial-persuasion"
  | "public-social-exposure"
  | "mature-theme"
  | "high-arousal-loop"
  | "unverified-user-generated";

export type PantavionContentDeliveryMode =
  | "blocked"
  | "guardian_review"
  | "guided"
  | "age_appropriate"
  | "standard";

export type PantavionContentDepth =
  | "foundational"
  | "developing"
  | "intermediate"
  | "advanced_teen"
  | "transition_to_adult"
  | "adult";

export type PantavionContentDescriptor = {
  contentId: string;
  category: PantavionContentCategory;
  minimumRecommendedAge: number;
  maximumRecommendedAge?: number;
  educationalValue?: "low" | "medium" | "high";
  riskTags?: readonly PantavionContentRiskTag[];
};

export type PantavionAgeAdaptiveContentDecision = {
  contentId: string;
  age: number | null;
  yearlyMaturityStep: number | null;
  deliveryMode: PantavionContentDeliveryMode;
  depth: PantavionContentDepth;
  recommendationWeight: number;
  allowed: boolean;
  protections: string[];
  reasons: string[];
  recomputeOnBirthday: true;
  nextBirthdayAge: number | null;
  featureAccess: ReturnType<typeof resolvePantavionAdaptivePolicy>["access"];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function depthForAge(age: number | null): PantavionContentDepth {
  if (age === null || age <= 9) return "foundational";
  if (age <= 12) return "developing";
  if (age <= 15) return "intermediate";
  if (age === 16) return "advanced_teen";
  if (age === 17) return "transition_to_adult";
  return "adult";
}

function featureForCategory(category: PantavionContentCategory): PantavionAdaptiveFeature {
  if (category === "learning" || category === "culture") return "panta_learn";
  if (category === "social" || category === "creator") return "social_feed";
  if (category === "commerce") return "marketplace";
  if (category === "adult_restricted") return "adult_restricted";
  return "ai_assistant";
}

function hasRisk(content: PantavionContentDescriptor, tag: PantavionContentRiskTag): boolean {
  return Boolean(content.riskTags?.includes(tag));
}

export function resolvePantavionAgeAdaptiveContent(input: {
  countryCode: string;
  content: PantavionContentDescriptor;
  age?: number | null;
  birthDate?: string | null;
  now?: Date;
  guardianConsent?: boolean;
  ageProof?: PantavionAgeProof;
  countryRule?: PantavionCountryAdaptiveRule | null;
}): PantavionAgeAdaptiveContentDecision {
  const ageRole = resolvePantavionAgeRole({
    age: input.age,
    birthDate: input.birthDate,
    now: input.now,
  });
  const age = ageRole.age;
  const featureDecision = resolvePantavionAdaptivePolicy({
    countryCode: input.countryCode,
    feature: featureForCategory(input.content.category),
    age,
    guardianConsent: input.guardianConsent,
    ageProof: input.ageProof,
    countryRule: input.countryRule,
  });

  const protections = [...featureDecision.protections];
  const reasons = [...featureDecision.reasons];
  let deliveryMode: PantavionContentDeliveryMode = age !== null && age >= 18 ? "standard" : "age_appropriate";
  let allowed = featureDecision.access !== "blocked";

  if (featureDecision.access === "requires_guardian") {
    deliveryMode = "guardian_review";
    allowed = Boolean(input.guardianConsent);
    reasons.push("feature-requires-guardian-control");
  }

  if (featureDecision.access === "requires_age_proof") {
    deliveryMode = "blocked";
    allowed = false;
    reasons.push("feature-requires-age-proof");
  }

  if (age === null) {
    deliveryMode = "guided";
    allowed = input.content.category === "learning" || input.content.category === "culture";
    protections.push("unknown-age-conservative-content-mode");
    reasons.push("age-unverified-content-ceiling");
  }

  if (typeof age === "number") {
    if (age < input.content.minimumRecommendedAge) {
      allowed = false;
      deliveryMode = ageRole.requiresGuardian ? "guardian_review" : "blocked";
      reasons.push("below-content-minimum-recommended-age");
    }

    if (
      typeof input.content.maximumRecommendedAge === "number" &&
      age > input.content.maximumRecommendedAge
    ) {
      reasons.push("content-below-current-maturity-target");
    }

    if (age < 18 && (input.content.category === "adult_restricted" || hasRisk(input.content, "adult-only"))) {
      allowed = false;
      deliveryMode = "blocked";
      reasons.push("adult-content-separated-from-minors");
    }

    if (age < 18 && hasRisk(input.content, "commercial-persuasion")) {
      protections.push("commercial-persuasion-suppressed-for-minors");
      reasons.push("minor-commercial-content-protection");
    }

    if (age < 18 && hasRisk(input.content, "high-arousal-loop")) {
      protections.push("no-repetitive-high-arousal-recommendation-loop");
      reasons.push("minor-attention-safety");
    }

    if (age < 16 && hasRisk(input.content, "public-social-exposure")) {
      protections.push("public-social-exposure-restricted");
      deliveryMode = allowed ? "guided" : deliveryMode;
      reasons.push("younger-teen-public-social-protection");
    }

    if (age === 16) {
      protections.push("older-teen-guided-expansion");
      reasons.push("age-16-progressive-access-step");
    }

    if (age === 17) {
      protections.push("adult-transition-literacy");
      reasons.push("age-17-transition-step-without-adult-unlock");
    }
  }

  const ageDistance = typeof age === "number"
    ? Math.abs(age - input.content.minimumRecommendedAge)
    : 10;
  let recommendationWeight = clamp(100 - ageDistance * 8, 0, 100);

  if (input.content.educationalValue === "high" && typeof age === "number" && age < 18) {
    recommendationWeight = clamp(recommendationWeight + 10, 0, 100);
  }

  if (typeof age === "number" && age < 18 && hasRisk(input.content, "commercial-persuasion")) {
    recommendationWeight = 0;
  }

  if (!allowed) recommendationWeight = 0;

  return {
    contentId: input.content.contentId,
    age,
    yearlyMaturityStep: typeof age === "number" && age < 18 ? age : null,
    deliveryMode,
    depth: depthForAge(age),
    recommendationWeight,
    allowed,
    protections: [...new Set(protections)],
    reasons: [...new Set(reasons)],
    recomputeOnBirthday: true,
    nextBirthdayAge: typeof age === "number" && age < 130 ? age + 1 : null,
    featureAccess: featureDecision.access,
  };
}
