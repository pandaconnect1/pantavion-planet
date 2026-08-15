export type CountryPackStatus = "draft" | "reviewed" | "approved" | "suspended";

export type TextDirection = "ltr" | "rtl" | "mixed";

export type ProvenanceEntry = {
  source: string;
  reviewedBy?: string;
  reviewedAt?: string;
  note?: string;
};

export type AgeBandRule = {
  id: string;
  minAgeInclusive: number;
  maxAgeInclusive?: number;
  discoveryDefault: "off" | "limited" | "standard";
  directMessagingDefault: "blocked" | "requests" | "standard";
  targetedAdvertisingAllowed: boolean;
  adultDiscoveryAllowed: boolean;
};

export type ConsentRule = {
  id: string;
  legalBasis: string;
  minimumAge?: number;
  guardianRequiredBelowAge?: number;
  scope: string[];
  note?: string;
};

export type CountryPack = {
  countryCode: string;
  subdivisionCodes: string[];
  effectiveFrom: string;
  version: string;

  officialAndSupportedLanguages: string[];
  scripts: string[];
  direction: TextDirection;
  localDateTimeRules: string[];
  transliterationRules: string[];

  connectivityProfile: "standard" | "constrained" | "remote" | "intermittent" | "extreme";
  lowDataDefaults: {
    textFirst: boolean;
    mediaAutoplay: boolean;
    imageQuality: "low" | "adaptive" | "full";
    videoQuality: "off" | "low" | "adaptive" | "full";
    compactAudio: boolean;
  };
  offlinePolicy: {
    drafts: boolean;
    storeAndForward: boolean;
    resumableUploads: boolean;
    deduplicateByIdempotencyKey: boolean;
  };

  ageBands: AgeBandRule[];
  consentRules: ConsentRule[];
  guardianRules: string[];

  privacyAndResidencyRules: string[];
  retentionOverrides: string[];
  illegalContentCategories: string[];
  noticeAndAppealRoutes: string[];

  emergencyAuthorities: string[];
  verifiedInstitutionTypes: string[];

  rankingConstraints: string[];
  civicContentGuarantees: string[];
  advertisingConstraints: string[];
  politicalAdRules: string[];
  accessibilityRequirements: string[];

  sourceAndReviewerProvenance: ProvenanceEntry[];
  status: CountryPackStatus;
};

export const GLOBAL_SOCIAL_SECURITY_INVARIANTS = Object.freeze([
  "country packs cannot disable audit",
  "country packs cannot weaken authentication or authorization invariants",
  "country packs cannot convert payment into verification truth",
  "country packs cannot override lawful age/safety boundaries with community rules",
  "private chat content cannot enter social ranking without explicit permitted sharing",
  "verified emergency/correction signals cannot be suppressed by engagement ranking",
]);

export function validateCountryPack(pack: CountryPack): string[] {
  const errors: string[] = [];

  if (!/^[A-Z]{2}$/.test(pack.countryCode)) errors.push("countryCode must be ISO alpha-2 style uppercase");
  if (!pack.version.trim()) errors.push("version is required");
  if (!pack.effectiveFrom.trim()) errors.push("effectiveFrom is required");
  if (!pack.officialAndSupportedLanguages.length) errors.push("at least one supported language is required");
  if (!pack.scripts.length) errors.push("at least one script is required");
  if (!pack.sourceAndReviewerProvenance.length) errors.push("provenance is required");

  for (const band of pack.ageBands) {
    if (band.minAgeInclusive < 0) errors.push(`age band ${band.id} has invalid minAgeInclusive`);
    if (band.maxAgeInclusive != null && band.maxAgeInclusive < band.minAgeInclusive) {
      errors.push(`age band ${band.id} has maxAgeInclusive below minAgeInclusive`);
    }
    if (band.targetedAdvertisingAllowed && band.maxAgeInclusive != null && band.maxAgeInclusive < 18) {
      errors.push(`age band ${band.id} cannot enable targeted advertising for minors`);
    }
    if (band.adultDiscoveryAllowed && band.maxAgeInclusive != null && band.maxAgeInclusive < 18) {
      errors.push(`age band ${band.id} cannot enable adult discovery for minors`);
    }
  }

  if (!pack.lowDataDefaults.textFirst && pack.connectivityProfile !== "standard") {
    errors.push("non-standard connectivity profiles must keep text-first mode available by default");
  }

  if (!pack.offlinePolicy.deduplicateByIdempotencyKey && pack.offlinePolicy.storeAndForward) {
    errors.push("store-and-forward requires idempotency-key deduplication");
  }

  return errors;
}

export function countryPackIsRuntimeEligible(pack: CountryPack): boolean {
  return (pack.status === "reviewed" || pack.status === "approved") && validateCountryPack(pack).length === 0;
}
