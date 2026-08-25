import { resolvePantavionAdaptivePolicy, type PantavionCountryAdaptiveRule } from "../core/governance/adaptive-ecosystem-policy";

function equal<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, received ${String(actual)}`);
}

const rule: PantavionCountryAdaptiveRule = {
  countryCode: "XX",
  status: "effective",
  enforcementEnabled: true,
  minimumSocialAge: 16,
  minimumDatingAge: 18,
  minimumPaymentAge: 18,
  guardianConsentBelow: 16,
  requireAgeAssuranceForSocial: true,
  minorTargetedAdsProhibited: true,
};

const minorPayment = resolvePantavionAdaptivePolicy({
  countryCode: "XX",
  feature: "payments",
  age: 15,
  guardianConsent: true,
  ageProof: { verified: false },
  countryRule: rule,
});
equal(minorPayment.access, "blocked", "minor payment block remains blocked");

const minorDating = resolvePantavionAdaptivePolicy({
  countryCode: "XX",
  feature: "dating",
  age: 15,
  guardianConsent: true,
  ageProof: { verified: false },
  countryRule: rule,
});
equal(minorDating.access, "blocked", "minor dating block remains blocked");

const belowThresholdPublish = resolvePantavionAdaptivePolicy({
  countryCode: "XX",
  feature: "social_publish",
  age: 15,
  guardianConsent: true,
  ageProof: { verified: false },
  countryRule: rule,
});
equal(belowThresholdPublish.access, "blocked", "public social publish remains blocked below threshold");

const minorAds = resolvePantavionAdaptivePolicy({
  countryCode: "XX",
  feature: "personalized_ads",
  age: 15,
  guardianConsent: true,
  countryRule: rule,
});
equal(minorAds.access, "blocked", "minor personalized ads remain blocked");

console.log(JSON.stringify({ status: "PASS", monotonicAccess: true, blockedNeverWeakened: true }, null, 2));
