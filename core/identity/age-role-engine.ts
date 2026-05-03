
export type PantavionAgeBand =
  | "guardianManagedChild"
  | "child"
  | "youngTeen"
  | "olderTeen"
  | "adult"
  | "elderOptional";

export type PantavionSafetyRole =
  | "guardianManaged"
  | "minorProtected"
  | "teenProtected"
  | "independentAdult"
  | "elderSupportOptional";

export type PantavionAgeRole = {
  age: number | null;
  ageBand: PantavionAgeBand;
  safetyRole: PantavionSafetyRole;
  requiresGuardian: boolean;
  yearlyReviewRequired: boolean;
  nextReviewReason: string;
  uiMode: "simple" | "protected" | "standard" | "elder-simple";
};

export function calculateAgeFromBirthDate(birthDate: string, now = new Date()): number | null {
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return null;

  let age = now.getFullYear() - parsed.getFullYear();
  const monthDelta = now.getMonth() - parsed.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < parsed.getDate())) {
    age -= 1;
  }

  return Math.max(0, age);
}

export function resolvePantavionAgeRole(input: {
  age?: number | null;
  birthDate?: string | null;
  elderSupportOptIn?: boolean;
  now?: Date;
}): PantavionAgeRole {
  const age = typeof input.age === "number"
    ? input.age
    : input.birthDate
      ? calculateAgeFromBirthDate(input.birthDate, input.now)
      : null;

  if (age === null) {
    return {
      age,
      ageBand: "adult",
      safetyRole: "independentAdult",
      requiresGuardian: false,
      yearlyReviewRequired: true,
      nextReviewReason: "Age not yet verified. Ask for age band during onboarding.",
      uiMode: "standard",
    };
  }

  if (age <= 6) {
    return {
      age,
      ageBand: "guardianManagedChild",
      safetyRole: "guardianManaged",
      requiresGuardian: true,
      yearlyReviewRequired: true,
      nextReviewReason: "Child account must remain guardian-managed.",
      uiMode: "simple",
    };
  }

  if (age <= 12) {
    return {
      age,
      ageBand: "child",
      safetyRole: "minorProtected",
      requiresGuardian: true,
      yearlyReviewRequired: true,
      nextReviewReason: "Child Safety Mode should be reviewed every birthday.",
      uiMode: "simple",
    };
  }

  if (age <= 15) {
    return {
      age,
      ageBand: "youngTeen",
      safetyRole: "teenProtected",
      requiresGuardian: true,
      yearlyReviewRequired: true,
      nextReviewReason: "Teen protection, bullying and silent SOS settings must be reviewed yearly.",
      uiMode: "protected",
    };
  }

  if (age <= 17) {
    return {
      age,
      ageBand: "olderTeen",
      safetyRole: "teenProtected",
      requiresGuardian: true,
      yearlyReviewRequired: true,
      nextReviewReason: "Older minor status must transition to adult control at 18.",
      uiMode: "protected",
    };
  }

  if (age >= 65 && input.elderSupportOptIn) {
    return {
      age,
      ageBand: "elderOptional",
      safetyRole: "elderSupportOptional",
      requiresGuardian: false,
      yearlyReviewRequired: true,
      nextReviewReason: "Elder support is optional and must never remove adult autonomy.",
      uiMode: "elder-simple",
    };
  }

  return {
    age,
    ageBand: "adult",
    safetyRole: "independentAdult",
    requiresGuardian: false,
    yearlyReviewRequired: age === 18,
    nextReviewReason: age === 18
      ? "Adult transition review: confirm whether guardian links remain by consent."
      : "Standard adult account.",
    uiMode: "standard",
  };
}
