import {
  resolvePantavionAdaptivePolicy,
  type PantavionAdaptiveFeature,
  type PantavionAdaptivePolicyDecision,
  type PantavionAgeProof,
  type PantavionCountryAdaptiveRule,
} from "./adaptive-ecosystem-policy";
import {
  resolvePantavionDevelopmentalContent,
  type PantavionDevelopmentalContentProfile,
} from "./developmental-content-policy";

export type PantavionExperiencePolicyDecision = {
  access: PantavionAdaptivePolicyDecision;
  content: PantavionDevelopmentalContentProfile | null;
  directUsePermitted: boolean;
  childFirstBaseline: true;
  legalOverrideRequired: boolean;
  rationale: readonly string[];
};

export function resolvePantavionExperiencePolicy(input: {
  countryCode: string;
  feature: PantavionAdaptiveFeature;
  age?: number | null;
  birthDate?: string | null;
  now?: Date;
  elderSupportOptIn?: boolean;
  guardianConsent?: boolean;
  ageProof?: PantavionAgeProof;
  countryRule?: PantavionCountryAdaptiveRule | null;
}): PantavionExperiencePolicyDecision {
  const access = resolvePantavionAdaptivePolicy(input);
  const content = typeof access.ageRole.age === "number"
    ? resolvePantavionDevelopmentalContent(access.ageRole.age)
    : null;
  const directUsePermitted = content?.directUseMode !== "caregiver_only";

  const rationale = [
    "experience-adapts-to-age-without-removing-the-user-from-the-ecosystem",
    "developmental-content-policy-is-separate-from-jurisdiction-enforcement",
    "effective-law-can-restrict-a-feature-without-erasing-legal-learning-or-support-surfaces",
  ];

  if (content?.directUseMode === "caregiver_only") {
    rationale.push("infant-stage-content-is-for-caregiver-guidance-not-infant-platform-use");
  } else if (content?.directUseMode === "guardian_co_use") {
    rationale.push("young-child-stage-is-guardian-mediated-not-independent-social-use");
  }

  return {
    access,
    content,
    directUsePermitted,
    childFirstBaseline: true,
    legalOverrideRequired: access.jurisdictionReviewRequired,
    rationale,
  };
}
