export type PantavionDevelopmentalStage =
  | "infant_care"
  | "pre_literate_early_literacy"
  | "core_primary"
  | "transition_years"
  | "early_teens"
  | "approaching_adulthood"
  | "adult";

export type PantavionDirectUseMode =
  | "caregiver_only"
  | "guardian_co_use"
  | "guardian_managed"
  | "protected_independent"
  | "independent";

export type PantavionDevelopmentalContentProfile = {
  age: number;
  stage: PantavionDevelopmentalStage;
  directUseMode: PantavionDirectUseMode;
  contentCeilingAge: number;
  yearlyProgressionLevel: number;
  learningPriority: "highest" | "high" | "balanced" | "optional";
  discoveryMode: "caregiver_curated" | "guardian_curated" | "curated" | "bounded" | "standard";
  communicationMode: "none" | "guardian_only" | "approved_contacts" | "protected_contacts" | "standard";
  publicProfile: "off" | "limited" | "standard";
  baselineProtections: readonly string[];
  recommendedContentDomains: readonly string[];
  recomputeOnBirthday: true;
};

function normalizeAge(age: number): number {
  if (!Number.isFinite(age)) throw new Error("age must be a finite number");
  if (age < 0) throw new Error("age cannot be negative");
  return Math.floor(age);
}

export function resolvePantavionDevelopmentalContent(ageInput: number): PantavionDevelopmentalContentProfile {
  const age = normalizeAge(ageInput);
  const cappedProgression = Math.min(age, 17);

  if (age === 0) {
    return {
      age,
      stage: "infant_care",
      directUseMode: "caregiver_only",
      contentCeilingAge: 0,
      yearlyProgressionLevel: 0,
      learningPriority: "highest",
      discoveryMode: "caregiver_curated",
      communicationMode: "none",
      publicProfile: "off",
      baselineProtections: [
        "no-infant-direct-account-use",
        "caregiver-mediated-only",
        "no-public-social",
        "no-direct-messaging",
        "no-targeted-ads",
        "no-behavioural-profiling-for-engagement",
        "minimal-dependent-data",
      ],
      recommendedContentDomains: [
        "newborn-and-infant-care-for-caregivers",
        "feeding-and-routines-general-guidance",
        "developmental-milestones-general-guidance",
        "safe-home-and-travel-guidance",
        "parent-learning-and-support",
        "when-to-seek-qualified-help",
      ],
      recomputeOnBirthday: true,
    };
  }

  if (age <= 5) {
    return {
      age,
      stage: "pre_literate_early_literacy",
      directUseMode: "guardian_co_use",
      contentCeilingAge: age,
      yearlyProgressionLevel: cappedProgression,
      learningPriority: "highest",
      discoveryMode: "guardian_curated",
      communicationMode: "guardian_only",
      publicProfile: "off",
      baselineProtections: [
        "guardian-present-or-mediated",
        "no-public-social",
        "no-direct-messaging",
        "no-targeted-ads",
        "no-behavioural-profiling-for-engagement",
        "no-infinite-scroll",
        "no-autoplay-by-default",
        "minimal-data-collection",
      ],
      recommendedContentDomains: [
        "early-learning",
        "language-and-communication",
        "stories-and-creativity",
        "movement-and-play",
        "family-guided-discovery",
      ],
      recomputeOnBirthday: true,
    };
  }

  if (age <= 9) {
    return {
      age,
      stage: "core_primary",
      directUseMode: "guardian_managed",
      contentCeilingAge: age,
      yearlyProgressionLevel: cappedProgression,
      learningPriority: "highest",
      discoveryMode: "curated",
      communicationMode: "approved_contacts",
      publicProfile: "off",
      baselineProtections: [
        "guardian-managed-account",
        "approved-contacts-only",
        "no-targeted-ads",
        "no-public-discoverability",
        "age-appropriate-recommendations",
        "no-addictive-ranking-loops",
        "minimal-data-collection",
      ],
      recommendedContentDomains: [
        "school-learning",
        "languages",
        "science-and-nature",
        "arts-and-creativity",
        "sports-and-events",
        "digital-literacy",
        "wellbeing-and-help-seeking",
      ],
      recomputeOnBirthday: true,
    };
  }

  if (age <= 12) {
    return {
      age,
      stage: "transition_years",
      directUseMode: "guardian_managed",
      contentCeilingAge: age,
      yearlyProgressionLevel: cappedProgression,
      learningPriority: "high",
      discoveryMode: "curated",
      communicationMode: "approved_contacts",
      publicProfile: "off",
      baselineProtections: [
        "guardian-managed-account",
        "approved-contacts-only",
        "no-targeted-ads",
        "age-appropriate-recommendations",
        "anti-bullying-escalation",
        "no-addictive-ranking-loops",
        "privacy-high-by-default",
      ],
      recommendedContentDomains: [
        "school-learning",
        "languages",
        "science-and-technology",
        "arts-and-creativity",
        "sports-and-events",
        "digital-literacy",
        "safe-social-skills",
        "wellbeing-and-help-seeking",
      ],
      recomputeOnBirthday: true,
    };
  }

  if (age <= 15) {
    return {
      age,
      stage: "early_teens",
      directUseMode: "protected_independent",
      contentCeilingAge: age,
      yearlyProgressionLevel: cappedProgression,
      learningPriority: "high",
      discoveryMode: "bounded",
      communicationMode: "protected_contacts",
      publicProfile: "limited",
      baselineProtections: [
        "no-targeted-ads",
        "restricted-untrusted-contact",
        "age-appropriate-recommendations",
        "anti-bullying-escalation",
        "adult-zone-separation",
        "no-addictive-ranking-loops",
        "privacy-high-by-default",
      ],
      recommendedContentDomains: [
        "learning-and-study",
        "languages",
        "science-and-technology",
        "arts-and-creativity",
        "sports-and-events",
        "career-exploration",
        "digital-citizenship",
        "safe-social-participation",
        "wellbeing-and-help-seeking",
      ],
      recomputeOnBirthday: true,
    };
  }

  if (age <= 17) {
    return {
      age,
      stage: "approaching_adulthood",
      directUseMode: "protected_independent",
      contentCeilingAge: age,
      yearlyProgressionLevel: cappedProgression,
      learningPriority: "balanced",
      discoveryMode: "bounded",
      communicationMode: "protected_contacts",
      publicProfile: "limited",
      baselineProtections: [
        "no-targeted-ads",
        "age-appropriate-recommendations",
        "anti-bullying-escalation",
        "adult-zone-separation",
        "privacy-high-by-default",
      ],
      recommendedContentDomains: [
        "education-and-skills",
        "languages",
        "science-and-technology",
        "arts-and-creativity",
        "sports-and-events",
        "career-and-future-planning",
        "digital-citizenship",
        "protected-social-participation",
        "wellbeing-and-help-seeking",
      ],
      recomputeOnBirthday: true,
    };
  }

  return {
    age,
    stage: "adult",
    directUseMode: "independent",
    contentCeilingAge: age,
    yearlyProgressionLevel: 18,
    learningPriority: "optional",
    discoveryMode: "standard",
    communicationMode: "standard",
    publicProfile: "standard",
    baselineProtections: [],
    recommendedContentDomains: ["user-selected"],
    recomputeOnBirthday: true,
  };
}
