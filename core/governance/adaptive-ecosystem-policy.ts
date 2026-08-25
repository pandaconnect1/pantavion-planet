import { resolvePantavionAgeRole, type PantavionAgeBand, type PantavionAgeRole } from "../identity/age-role-engine";

export type PantavionAdaptiveFeature =
  | "people"
  | "social_feed"
  | "social_publish"
  | "direct_message"
  | "voice"
  | "video"
  | "communities"
  | "panta_learn"
  | "interpreter"
  | "marketplace"
  | "dating"
  | "personalized_ads"
  | "payments"
  | "adult_restricted"
  | "ai_assistant";

export type PantavionCountryPolicyStatus = "monitoring" | "reviewed" | "effective";
export type PantavionAccessDecision = "allowed" | "restricted" | "requires_guardian" | "requires_age_proof" | "blocked";
export type PantavionMaturityLevel = "early_childhood" | "child" | "young_teen" | "older_teen" | "adult";
export type PantavionSocialMode = "education_only" | "protected_social" | "standard_social";

export type PantavionCountryAdaptiveRule = {
  countryCode: string;
  status: PantavionCountryPolicyStatus;
  enforcementEnabled: boolean;
  minimumSocialAge?: number;
  minimumIndependentAccountAge?: number;
  minimumDatingAge?: number;
  minimumPaymentAge?: number;
  guardianConsentBelow?: number;
  requireAgeAssuranceForSocial?: boolean;
  minorTargetedAdsProhibited?: boolean;
  blockedFeatures?: readonly PantavionAdaptiveFeature[];
  effectiveFrom?: string;
  sourceRefs?: readonly string[];
  notes?: readonly string[];
};

export type PantavionAgeProof = {
  verified: boolean;
  minimumAgeProven?: number;
};

export type PantavionAdaptivePolicyDecision = {
  countryCode: string;
  feature: PantavionAdaptiveFeature;
  access: PantavionAccessDecision;
  ageRole: PantavionAgeRole;
  maturityLevel: PantavionMaturityLevel;
  socialMode: PantavionSocialMode;
  recommendationMode: "none" | "chronological" | "bounded_personalization" | "standard";
  publicDiscoverability: "off" | "guardian_bounded" | "limited" | "standard";
  educationPriority: "highest" | "high" | "balanced" | "optional";
  protections: string[];
  reasons: string[];
  nextBirthdayAge: number | null;
  recomputeOnBirthday: true;
  jurisdictionRuleApplied: boolean;
  jurisdictionReviewRequired: boolean;
};

const SOCIAL_FEATURES = new Set<PantavionAdaptiveFeature>([
  "social_feed",
  "social_publish",
  "direct_message",
  "communities",
]);

const HIGH_RISK_FEATURES = new Set<PantavionAdaptiveFeature>([
  "dating",
  "payments",
  "adult_restricted",
]);

const ACCESS_RANK: Record<PantavionAccessDecision, number> = {
  allowed: 0,
  restricted: 1,
  requires_guardian: 2,
  requires_age_proof: 2,
  blocked: 3,
};

/**
 * Access decisions are monotonic: later policy layers may make access stricter,
 * but must never weaken an earlier restriction or block.
 */
function stricterAccess(
  current: PantavionAccessDecision,
  next: PantavionAccessDecision,
): PantavionAccessDecision {
  return ACCESS_RANK[next] > ACCESS_RANK[current] ? next : current;
}

function resolveMaturityLevel(ageBand: PantavionAgeBand): PantavionMaturityLevel {
  if (ageBand === "guardianManagedChild") return "early_childhood";
  if (ageBand === "child") return "child";
  if (ageBand === "youngTeen") return "young_teen";
  if (ageBand === "olderTeen") return "older_teen";
  return "adult";
}

function socialProfile(ageBand: PantavionAgeBand) {
  if (ageBand === "guardianManagedChild" || ageBand === "child") {
    return {
      socialMode: "education_only" as const,
      recommendationMode: "chronological" as const,
      publicDiscoverability: "off" as const,
      educationPriority: "highest" as const,
      protections: [
        "no-targeted-ads",
        "no-public-profile-by-default",
        "approved-contacts-only",
        "curated-educational-content",
        "no-infinite-scroll",
        "no-autoplay-by-default",
      ],
    };
  }

  if (ageBand === "youngTeen") {
    return {
      socialMode: "protected_social" as const,
      recommendationMode: "bounded_personalization" as const,
      publicDiscoverability: "guardian_bounded" as const,
      educationPriority: "high" as const,
      protections: [
        "no-targeted-ads",
        "restricted-untrusted-contact",
        "age-appropriate-recommendations",
        "anti-bullying-escalation",
        "no-addictive-ranking-loops",
      ],
    };
  }

  if (ageBand === "olderTeen") {
    return {
      socialMode: "protected_social" as const,
      recommendationMode: "bounded_personalization" as const,
      publicDiscoverability: "limited" as const,
      educationPriority: "balanced" as const,
      protections: [
        "no-targeted-ads",
        "age-appropriate-recommendations",
        "anti-bullying-escalation",
        "adult-zone-separation",
      ],
    };
  }

  return {
    socialMode: "standard_social" as const,
    recommendationMode: "standard" as const,
    publicDiscoverability: "standard" as const,
    educationPriority: "optional" as const,
    protections: [] as string[],
  };
}

function ageProofSatisfies(proof: PantavionAgeProof | undefined, minimumAge: number): boolean {
  return Boolean(proof?.verified && typeof proof.minimumAgeProven === "number" && proof.minimumAgeProven >= minimumAge);
}

function isMinor(age: number | null): boolean {
  return age !== null && age < 18;
}

export function resolvePantavionAdaptivePolicy(input: {
  countryCode: string;
  feature: PantavionAdaptiveFeature;
  age?: number | null;
  birthDate?: string | null;
  now?: Date;
  elderSupportOptIn?: boolean;
  guardianConsent?: boolean;
  ageProof?: PantavionAgeProof;
  countryRule?: PantavionCountryAdaptiveRule | null;
}): PantavionAdaptivePolicyDecision {
  const ageRole = resolvePantavionAgeRole({
    age: input.age,
    birthDate: input.birthDate,
    now: input.now,
    elderSupportOptIn: input.elderSupportOptIn,
  });
  const age = ageRole.age;
  const maturityLevel = resolveMaturityLevel(ageRole.ageBand);
  const profile = socialProfile(ageRole.ageBand);
  const countryCode = input.countryCode.trim().toUpperCase();
  const rule = input.countryRule ?? null;
  const ruleCanEnforce = Boolean(rule && rule.enforcementEnabled && rule.status === "effective");
  const protections = [...profile.protections];
  const reasons: string[] = [];
  let access: PantavionAccessDecision = "allowed";

  const tighten = (next: PantavionAccessDecision) => {
    access = stricterAccess(access, next);
  };

  if (age === null) {
    reasons.push("age-unverified");
    protections.push("age-assurance-required-for-risky-surfaces");
    if (HIGH_RISK_FEATURES.has(input.feature) || input.feature === "personalized_ads") {
      tighten("requires_age_proof");
    } else if (SOCIAL_FEATURES.has(input.feature)) {
      tighten("restricted");
    }
  }

  if (isMinor(age)) {
    if (input.feature === "personalized_ads") {
      tighten("blocked");
      reasons.push("minor-targeted-ads-disabled");
    }
    if (input.feature === "dating" || input.feature === "adult_restricted") {
      tighten("blocked");
      reasons.push("adult-only-surface");
    }
    if (input.feature === "payments") {
      tighten("blocked");
      reasons.push("minor-payment-surface-disabled-by-safe-baseline");
    }
    if (ageRole.requiresGuardian && ["social_publish", "direct_message", "video"].includes(input.feature)) {
      tighten(input.guardianConsent ? "restricted" : "requires_guardian");
      reasons.push("guardian-control-required");
    }
    if (SOCIAL_FEATURES.has(input.feature) && access === "allowed") {
      tighten("restricted");
      reasons.push("minor-social-protection-mode");
    }
  }

  if (rule) {
    if (rule.countryCode.trim().toUpperCase() !== countryCode) {
      throw new Error(`country rule mismatch: expected ${countryCode}, received ${rule.countryCode}`);
    }

    if (!ruleCanEnforce) {
      reasons.push("jurisdiction-rule-not-effective-no-automatic-enforcement");
    } else {
      if (rule.blockedFeatures?.includes(input.feature)) {
        tighten("blocked");
        reasons.push("jurisdiction-feature-block");
      }

      if (typeof age === "number" && rule.guardianConsentBelow && age < rule.guardianConsentBelow && !input.guardianConsent) {
        tighten("requires_guardian");
        reasons.push("jurisdiction-guardian-consent-threshold");
      }

      if (SOCIAL_FEATURES.has(input.feature) && typeof age === "number" && rule.minimumSocialAge && age < rule.minimumSocialAge) {
        protections.push("country-social-age-threshold");
        if (input.feature === "social_publish") {
          tighten("blocked");
          reasons.push("public-social-publishing-below-country-threshold");
        } else if (input.feature === "direct_message") {
          tighten(input.guardianConsent ? "restricted" : "requires_guardian");
          reasons.push("messaging-limited-to-approved-contacts-below-country-threshold");
        } else {
          tighten("restricted");
          reasons.push("social-surface-transformed-to-education-mode-below-country-threshold");
        }
      }

      if (input.feature === "dating" && rule.minimumDatingAge) {
        if (!ageProofSatisfies(input.ageProof, rule.minimumDatingAge)) {
          tighten(typeof age === "number" && age < rule.minimumDatingAge ? "blocked" : "requires_age_proof");
          reasons.push("dating-age-threshold");
        }
      }

      if (input.feature === "payments" && rule.minimumPaymentAge) {
        if (!ageProofSatisfies(input.ageProof, rule.minimumPaymentAge)) {
          tighten(typeof age === "number" && age < rule.minimumPaymentAge ? "blocked" : "requires_age_proof");
          reasons.push("payment-age-threshold");
        }
      }

      if (rule.requireAgeAssuranceForSocial && SOCIAL_FEATURES.has(input.feature) && rule.minimumSocialAge) {
        if (!ageProofSatisfies(input.ageProof, rule.minimumSocialAge) && typeof age === "number" && age >= rule.minimumSocialAge) {
          tighten("requires_age_proof");
          reasons.push("country-social-age-assurance-required");
        }
      }

      if (rule.minorTargetedAdsProhibited && isMinor(age) && input.feature === "personalized_ads") {
        tighten("blocked");
        reasons.push("jurisdiction-minor-targeted-ads-prohibited");
      }
    }
  }

  if (input.feature === "panta_learn" || input.feature === "interpreter") {
    tighten(ageRole.requiresGuardian ? "restricted" : "allowed");
    reasons.push("ecosystem-access-preserved-with-age-appropriate-mode");
  }

  const nextBirthdayAge = typeof age === "number" && age < 130 ? age + 1 : null;
  const forceEducationMode = Boolean(
    ruleCanEnforce &&
    SOCIAL_FEATURES.has(input.feature) &&
    typeof age === "number" &&
    rule?.minimumSocialAge &&
    age < rule.minimumSocialAge,
  );

  return {
    countryCode,
    feature: input.feature,
    access,
    ageRole,
    maturityLevel,
    socialMode: forceEducationMode ? "education_only" : profile.socialMode,
    recommendationMode: forceEducationMode ? "chronological" : profile.recommendationMode,
    publicDiscoverability: forceEducationMode ? "off" : profile.publicDiscoverability,
    educationPriority: forceEducationMode ? "highest" : profile.educationPriority,
    protections: [...new Set(protections)],
    reasons: [...new Set(reasons)],
    nextBirthdayAge,
    recomputeOnBirthday: true,
    jurisdictionRuleApplied: ruleCanEnforce,
    jurisdictionReviewRequired: !rule || !ruleCanEnforce,
  };
}
