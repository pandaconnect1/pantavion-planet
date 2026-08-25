export type PantavionSupportDomain =
  | "education_support"
  | "bullying_support"
  | "family_safety_support"
  | "emotional_wellbeing_support"
  | "disability_access_support"
  | "language_newcomer_support"
  | "refugee_displacement_support"
  | "conflict_disruption_support"
  | "caregiver_support"
  | "elder_support"
  | "legal_social_support";

export type PantavionSupportProviderType =
  | "public_authority"
  | "child_protection_service"
  | "school_safeguarding_service"
  | "licensed_professional"
  | "regulated_health_or_social_service"
  | "verified_ngo"
  | "verified_helpline"
  | "institutional_support_service"
  | "vetted_volunteer_network";

export type PantavionSupportVerificationTier =
  | "government_verified"
  | "licensed_professional"
  | "institution_verified"
  | "ngo_verified"
  | "supervised_vetted_volunteer";

export type PantavionSupportContactMode =
  | "in_app"
  | "phone"
  | "text_chat"
  | "email"
  | "video"
  | "in_person";

export type PantavionSupportProvider = {
  id: string;
  countryCode: string;
  providerType: PantavionSupportProviderType;
  verificationTier: PantavionSupportVerificationTier;
  domains: readonly PantavionSupportDomain[];
  minimumAge?: number;
  maximumAge?: number;
  supportsMinors: boolean;
  supervised: boolean;
  jurisdictionVerified: boolean;
  contactModes: readonly PantavionSupportContactMode[];
  languages?: readonly string[];
  available24x7?: boolean;
  lastVerifiedAt: string;
  nextVerificationDueAt: string;
};

export type PantavionSupportRoutingInput = {
  countryCode: string;
  age: number | null;
  domain: PantavionSupportDomain;
  familyOrGuardianMayBeUnsafe?: boolean;
  needsImmediateSafetyResponse?: boolean;
  preferredLanguage?: string | null;
  providers: readonly PantavionSupportProvider[];
};

export type PantavionSupportRoutingDecision = {
  eligibleProviderIds: readonly string[];
  preferredProviderIds: readonly string[];
  guardianIsRequiredAsSoleGateway: false;
  mustNotAutoNotifyPotentiallyUnsafeHouseholdMember: boolean;
  jurisdictionVerificationRequired: boolean;
  professionalOrInstitutionalPathRequired: boolean;
  volunteerMayBeSoleHandler: boolean;
  safeguards: readonly string[];
};

function supportsAge(provider: PantavionSupportProvider, age: number | null): boolean {
  if (age === null) return provider.minimumAge === undefined && provider.maximumAge === undefined;
  if (provider.minimumAge !== undefined && age < provider.minimumAge) return false;
  if (provider.maximumAge !== undefined && age > provider.maximumAge) return false;
  if (age < 18 && !provider.supportsMinors) return false;
  return true;
}

function isHighTrust(provider: PantavionSupportProvider): boolean {
  return [
    "government_verified",
    "licensed_professional",
    "institution_verified",
    "ngo_verified",
  ].includes(provider.verificationTier);
}

function isVolunteer(provider: PantavionSupportProvider): boolean {
  return provider.providerType === "vetted_volunteer_network";
}

export function routePantavionSupportNetwork(
  input: PantavionSupportRoutingInput,
): PantavionSupportRoutingDecision {
  const countryCode = input.countryCode.trim().toUpperCase();
  const isMinor = typeof input.age === "number" && input.age < 18;
  const sensitiveFamilyCase = input.domain === "family_safety_support";
  const highRisk = Boolean(input.needsImmediateSafetyResponse || sensitiveFamilyCase);

  const safeguards = new Set<string>([
    "country-and-law-specific-routing",
    "provider-identity-and-status-must-be-currently-verified",
    "minimum-necessary-data-sharing",
    "no-payments-gifts-or-private-financial-arrangements-with-support-volunteers",
    "no-romantic-or-personal-relationship-channel-between-support-volunteer-and-minor",
    "no-off-platform-private-contact-for-vetted-volunteer-minor-support",
    "audit-support-routing-without-storing-unnecessary-sensitive-narrative",
    "translation-and-accessibility-available-where-supported",
  ]);

  if (isMinor) {
    safeguards.add("minor-safeguarding-rules-apply");
    safeguards.add("minor-support-provider-must-be-authorized-for-minors");
  }

  if (input.familyOrGuardianMayBeUnsafe) {
    safeguards.add("do-not-require-family-or-guardian-as-only-help-channel");
    safeguards.add("do-not-auto-notify-implicated-or-potentially-unsafe-household-member");
  }

  if (highRisk) {
    safeguards.add("prioritize-qualified-public-professional-or-institutional-support");
    safeguards.add("vetted-volunteer-may-support-but-not-be-sole-high-risk-handler");
  }

  const eligible = input.providers.filter((provider) => {
    if (provider.countryCode.trim().toUpperCase() !== countryCode) return false;
    if (!provider.jurisdictionVerified) return false;
    if (!provider.domains.includes(input.domain)) return false;
    if (!supportsAge(provider, input.age)) return false;
    if (isMinor && isVolunteer(provider) && !provider.supervised) return false;
    if (highRisk && isVolunteer(provider)) return false;
    return true;
  });

  const preferred = [...eligible].sort((a, b) => {
    const aScore =
      (isHighTrust(a) ? 100 : 0) +
      (a.available24x7 ? 20 : 0) +
      (input.preferredLanguage && a.languages?.includes(input.preferredLanguage) ? 10 : 0) +
      (a.contactModes.includes("in_app") ? 5 : 0);
    const bScore =
      (isHighTrust(b) ? 100 : 0) +
      (b.available24x7 ? 20 : 0) +
      (input.preferredLanguage && b.languages?.includes(input.preferredLanguage) ? 10 : 0) +
      (b.contactModes.includes("in_app") ? 5 : 0);
    return bScore - aScore || a.id.localeCompare(b.id);
  });

  return {
    eligibleProviderIds: eligible.map((provider) => provider.id),
    preferredProviderIds: preferred.map((provider) => provider.id),
    guardianIsRequiredAsSoleGateway: false,
    mustNotAutoNotifyPotentiallyUnsafeHouseholdMember: Boolean(input.familyOrGuardianMayBeUnsafe),
    jurisdictionVerificationRequired: eligible.length === 0,
    professionalOrInstitutionalPathRequired: highRisk,
    volunteerMayBeSoleHandler: !highRisk && !isMinor,
    safeguards: [...safeguards],
  };
}
