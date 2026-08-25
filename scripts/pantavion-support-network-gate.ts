import {
  routePantavionSupportNetwork,
  type PantavionSupportProvider,
} from "../core/governance/support-network-routing-policy";

function equal<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, received ${String(actual)}`);
}

const providers: PantavionSupportProvider[] = [
  {
    id: "cy-public-child-service",
    countryCode: "CY",
    providerType: "child_protection_service",
    verificationTier: "government_verified",
    domains: ["family_safety_support", "bullying_support"],
    supportsMinors: true,
    supervised: true,
    jurisdictionVerified: true,
    contactModes: ["phone", "in_person"],
    languages: ["el", "en"],
    available24x7: true,
    lastVerifiedAt: "2026-08-25",
    nextVerificationDueAt: "2026-09-25",
  },
  {
    id: "cy-licensed-professional",
    countryCode: "CY",
    providerType: "licensed_professional",
    verificationTier: "licensed_professional",
    domains: ["family_safety_support", "emotional_wellbeing_support"],
    supportsMinors: true,
    supervised: true,
    jurisdictionVerified: true,
    contactModes: ["in_app", "video"],
    languages: ["el", "en"],
    lastVerifiedAt: "2026-08-25",
    nextVerificationDueAt: "2026-09-25",
  },
  {
    id: "cy-supervised-volunteer-network",
    countryCode: "CY",
    providerType: "vetted_volunteer_network",
    verificationTier: "supervised_vetted_volunteer",
    domains: ["bullying_support", "education_support", "language_newcomer_support"],
    supportsMinors: true,
    supervised: true,
    jurisdictionVerified: true,
    contactModes: ["in_app"],
    languages: ["el", "en"],
    lastVerifiedAt: "2026-08-25",
    nextVerificationDueAt: "2026-09-25",
  },
  {
    id: "unverified-volunteer",
    countryCode: "CY",
    providerType: "vetted_volunteer_network",
    verificationTier: "supervised_vetted_volunteer",
    domains: ["bullying_support"],
    supportsMinors: true,
    supervised: false,
    jurisdictionVerified: false,
    contactModes: ["text_chat"],
    lastVerifiedAt: "2026-08-25",
    nextVerificationDueAt: "2026-09-25",
  },
];

const unsafeFamily = routePantavionSupportNetwork({
  countryCode: "CY",
  age: 11,
  domain: "family_safety_support",
  familyOrGuardianMayBeUnsafe: true,
  needsImmediateSafetyResponse: true,
  preferredLanguage: "el",
  providers,
});

equal(unsafeFamily.guardianIsRequiredAsSoleGateway, false, "guardian is never sole gateway");
equal(unsafeFamily.mustNotAutoNotifyPotentiallyUnsafeHouseholdMember, true, "unsafe household not auto-notified");
equal(unsafeFamily.professionalOrInstitutionalPathRequired, true, "high-risk case requires qualified path");
equal(unsafeFamily.eligibleProviderIds.includes("cy-public-child-service"), true, "public child service eligible");
equal(unsafeFamily.eligibleProviderIds.includes("cy-licensed-professional"), true, "licensed professional eligible");
equal(unsafeFamily.eligibleProviderIds.includes("cy-supervised-volunteer-network"), false, "volunteer not sole high-risk route");

const bullyingSupport = routePantavionSupportNetwork({
  countryCode: "CY",
  age: 13,
  domain: "bullying_support",
  preferredLanguage: "el",
  providers,
});

equal(bullyingSupport.eligibleProviderIds.includes("cy-supervised-volunteer-network"), true, "supervised vetted volunteer may support lower-risk minor case");
equal(bullyingSupport.eligibleProviderIds.includes("unverified-volunteer"), false, "unverified volunteer excluded");
equal(bullyingSupport.volunteerMayBeSoleHandler, false, "volunteer never sole minor handler");

const noVerifiedProvider = routePantavionSupportNetwork({
  countryCode: "ZZ",
  age: 15,
  domain: "bullying_support",
  providers,
});

equal(noVerifiedProvider.jurisdictionVerificationRequired, true, "missing country coverage is explicit");

console.log(JSON.stringify({
  status: "PASS",
  checks: 10,
  guardianNotSoleGateway: true,
  unsafeHouseholdNotAutoNotified: true,
  highRiskQualifiedPathRequired: true,
  volunteersStrictlyControlled: true,
  missingCountryCoverageIsNotInvented: true,
}, null, 2));
