import { CountryPack, countryPackIsRuntimeEligible } from "./social-country-pack-contract";

const sharedAccessibility = [
  "WCAG 2.2 AA baseline",
  "captions and transcripts where media is present",
  "keyboard and screen-reader operability",
  "scalable text and reduced-motion support",
];

const sharedRanking = [
  "chronological/neutral public default",
  "optional explainable personalization",
  "critical safety notices and corrections cannot be suppressed by engagement ranking",
  "no payment multiplier for verification or civic importance",
];

const sharedLowData = {
  textFirst: true,
  mediaAutoplay: false,
  imageQuality: "adaptive" as const,
  videoQuality: "adaptive" as const,
  compactAudio: true,
};

const sharedOffline = {
  drafts: true,
  storeAndForward: true,
  resumableUploads: true,
  deduplicateByIdempotencyKey: true,
};

export const CYPRUS_SOCIAL_COUNTRY_PACK: CountryPack = {
  countryCode: "CY",
  subdivisionCodes: [],
  effectiveFrom: "2026-07-17",
  version: "SOCIAL-GLOBAL-001-CY-2026-07-17",
  officialAndSupportedLanguages: ["el", "tr", "en"],
  scripts: ["Grek", "Latn"],
  direction: "ltr",
  localDateTimeRules: ["Europe/Nicosia", "locale-aware date/time formatting"],
  transliterationRules: ["preserve original script", "transliteration is assistive and never replaces canonical text"],
  connectivityProfile: "standard",
  lowDataDefaults: sharedLowData,
  offlinePolicy: sharedOffline,
  ageBands: [
    { id: "child", minAgeInclusive: 0, maxAgeInclusive: 12, discoveryDefault: "off", directMessagingDefault: "blocked", targetedAdvertisingAllowed: false, adultDiscoveryAllowed: false },
    { id: "teen", minAgeInclusive: 13, maxAgeInclusive: 17, discoveryDefault: "limited", directMessagingDefault: "requests", targetedAdvertisingAllowed: false, adultDiscoveryAllowed: false },
    { id: "adult", minAgeInclusive: 18, discoveryDefault: "standard", directMessagingDefault: "standard", targetedAdvertisingAllowed: true, adultDiscoveryAllowed: true },
  ],
  consentRules: [
    { id: "gdpr-digital-consent", legalBasis: "consent where applicable for covered child-facing information-society service", minimumAge: 14, guardianRequiredBelowAge: 14, scope: ["covered child-facing information-society service"], note: "Source pack specifies 14 for Cyprus only when consent is the applicable legal basis." },
  ],
  guardianRules: ["age-adaptive defaults", "guardian support must preserve appropriate autonomy", "safety escalation and appeals remain available"],
  privacyAndResidencyRules: ["GDPR/DSA-oriented privacy controls", "private Chat and public Social remain separate scopes"],
  retentionOverrides: [],
  illegalContentCategories: ["child sexual abuse material", "fraud/scam abuse", "illegal content under applicable law"],
  noticeAndAppealRoutes: ["moderation notice", "reason code", "appeal trail"],
  emergencyAuthorities: [],
  verifiedInstitutionTypes: ["government", "emergency service", "municipality", "regulated institution"],
  rankingConstraints: sharedRanking,
  civicContentGuarantees: ["corrections and verified emergency items propagate independently of preference"],
  advertisingConstraints: ["no inferred sensitive-trait targeting", "no targeted advertising to minors"],
  politicalAdRules: ["country-specific political advertising rules require separate approved evidence before activation"],
  accessibilityRequirements: sharedAccessibility,
  sourceAndReviewerProvenance: [
    { source: "Pantavion One — Global Social Research & Unification Pack / SOCIAL-GLOBAL-001", reviewedAt: "2026-07-17", note: "Recovered implementation basis; legal cells beyond the supplied source remain evidence-gated." },
  ],
  status: "reviewed",
};

export const GREECE_SOCIAL_COUNTRY_PACK: CountryPack = {
  ...CYPRUS_SOCIAL_COUNTRY_PACK,
  countryCode: "GR",
  effectiveFrom: "2026-07-17",
  version: "SOCIAL-GLOBAL-001-GR-2026-07-17",
  officialAndSupportedLanguages: ["el", "en"],
  localDateTimeRules: ["Europe/Athens", "locale-aware date/time formatting"],
  consentRules: [
    { id: "gdpr-digital-consent", legalBasis: "consent where applicable for covered child-facing information-society service", minimumAge: 15, guardianRequiredBelowAge: 15, scope: ["covered child-facing information-society service"], note: "Source pack specifies 15 for Greece only when consent is the applicable legal basis." },
  ],
  sourceAndReviewerProvenance: [
    { source: "Pantavion One — Global Social Research & Unification Pack / SOCIAL-GLOBAL-001", reviewedAt: "2026-07-17", note: "Recovered implementation basis; legal cells beyond the supplied source remain evidence-gated." },
  ],
};

export const SOCIAL_COUNTRY_PACKS: Record<string, CountryPack> = {
  CY: CYPRUS_SOCIAL_COUNTRY_PACK,
  GR: GREECE_SOCIAL_COUNTRY_PACK,
};

export function normalizeSocialCountryCode(value: string | null | undefined): string | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (["cy", "cyp", "cyprus", "κύπρος", "κυπρος"].includes(normalized)) return "CY";
  if (["gr", "grc", "greece", "hellas", "ελλάδα", "ελλαδα"].includes(normalized)) return "GR";
  if (/^[a-z]{2}$/i.test(normalized)) return normalized.toUpperCase();
  return null;
}

export function getSocialCountryPack(country: string | null | undefined): CountryPack | null {
  const code = normalizeSocialCountryCode(country);
  return code ? SOCIAL_COUNTRY_PACKS[code] ?? null : null;
}

export function getSocialCountryPackRuntimeState(country: string | null | undefined) {
  const code = normalizeSocialCountryCode(country);
  const pack = getSocialCountryPack(country);
  return {
    countryCode: code,
    pack,
    runtimeEligible: pack ? countryPackIsRuntimeEligible(pack) : false,
    state: pack ? (countryPackIsRuntimeEligible(pack) ? "reviewed-runtime-ready" : "blocked") : "research-pending",
  } as const;
}
