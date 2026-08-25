import { resolvePantavionAdaptivePolicy, type PantavionCountryAdaptiveRule } from "../core/governance/adaptive-ecosystem-policy";
import { resolvePantavionDevelopmentalContent } from "../core/governance/developmental-content-policy";
import { resolvePantavionExperiencePolicy } from "../core/governance/experience-policy";
import { resolvePantavionSupportAdaptation } from "../core/governance/human-support-adaptation-policy";
import { buildPantavionBillingTruth } from "../core/commerce/billing-truth-engine";
import { selectPantavionAIProvider, type PantavionProviderCandidate } from "../core/intelligence/provider-neutral-routing-policy";

function equal<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, received ${String(actual)}`);
}

function notEqual<T>(actual: T, unexpected: T, label: string): void {
  if (actual === unexpected) throw new Error(`${label}: did not expect ${String(unexpected)}`);
}

function throws(fn: () => unknown, contains: string, label: string): void {
  try {
    fn();
  } catch (error) {
    if (error instanceof Error && error.message.includes(contains)) return;
    throw new Error(`${label}: unexpected error`);
  }
  throw new Error(`${label}: expected error containing ${contains}`);
}

const infantContent = resolvePantavionDevelopmentalContent(0);
equal(infantContent.stage, "infant_care", "age-zero content stage");
equal(infantContent.directUseMode, "caregiver_only", "age-zero caregiver-only mode");
equal(infantContent.communicationMode, "none", "age-zero no direct communication");
equal(infantContent.publicProfile, "off", "age-zero no public profile");

const infantExperience = resolvePantavionExperiencePolicy({ countryCode: "CY", feature: "panta_learn", age: 0, guardianConsent: true });
equal(infantExperience.directUsePermitted, false, "infant direct use disabled");

const age16Content = resolvePantavionDevelopmentalContent(16);
const age17Content = resolvePantavionDevelopmentalContent(17);
equal(age16Content.contentCeilingAge, 16, "16-year content ceiling");
equal(age17Content.contentCeilingAge, 17, "17-year content ceiling");
notEqual(age16Content.contentCeilingAge, age17Content.contentCeilingAge, "yearly content progression remains distinct");

const primaryLearning = resolvePantavionExperiencePolicy({
  countryCode: "CY",
  feature: "panta_learn",
  age: 9,
  guardianConsent: true,
  supportContext: {
    source: "guardian_selected",
    needs: ["reading_support", "attention_and_structure", "language_newcomer_support"],
    readingLevelPreference: "simpler",
    prefersStepByStep: true,
    prefersVoice: true,
  },
});
equal(primaryLearning.support.enabled, true, "primary learning support enabled");
equal(primaryLearning.support.allowedAIRoles.includes("adaptive_tutor"), true, "adaptive tutor available");
equal(primaryLearning.support.accommodations.includes("step-by-step-instructions"), true, "step-by-step learning available");
equal(primaryLearning.support.accommodations.includes("bilingual-explanations"), true, "bilingual newcomer support available");
equal(primaryLearning.support.neverDiagnose, true, "learning support never diagnoses");
equal(primaryLearning.support.neverStigmatize, true, "learning support never stigmatizes");

const accessibilitySupport = resolvePantavionSupportAdaptation({
  age: 14,
  context: {
    source: "self_selected",
    needs: ["speech_and_communication_support", "hearing_accessibility", "sensory_accessibility"],
    prefersCaptions: true,
    prefersReducedSensoryLoad: true,
  },
});
equal(accessibilitySupport.allowedAIRoles.includes("accessibility_assistant"), true, "accessibility assistant available");
equal(accessibilitySupport.accommodations.includes("captions-by-default-option"), true, "caption support available");
equal(accessibilitySupport.accommodations.includes("reduced-motion-and-stimulation-option"), true, "reduced sensory load available");

const minorFamilySafety = resolvePantavionExperiencePolicy({
  countryCode: "CY",
  feature: "panta_learn",
  age: 11,
  guardianConsent: true,
  supportContext: {
    source: "self_selected",
    needs: ["family_safety_support", "emotional_wellbeing_support"],
  },
});
equal(minorFamilySafety.support.humanSupportRecommended, true, "sensitive support keeps human path");
equal(minorFamilySafety.support.urgentHumanEscalationPathRequired, true, "minor family safety requires escalation path");
equal(minorFamilySafety.support.safeguards.includes("no-clinical-or-psychological-diagnosis"), true, "no psychological diagnosis");
equal(minorFamilySafety.support.safeguards.includes("no-secret-keeping-or-concealment-instructions"), true, "no concealment instructions");

const displacedLearner = resolvePantavionSupportAdaptation({
  age: 13,
  context: {
    source: "self_selected",
    needs: ["displacement_refugee_support", "conflict_disruption_support", "language_newcomer_support"],
    preferredLanguage: "el",
  },
});
equal(displacedLearner.accommodations.includes("interrupted-learning-recovery-path"), true, "interrupted education recovery available");
equal(displacedLearner.safeguards.includes("do-not-expose-sensitive-location-by-default"), true, "sensitive location protected");
equal(displacedLearner.safeguards.includes("avoid-assuming-legal-or-residency-status"), true, "no residency assumption");

const monitoringNzRule: PantavionCountryAdaptiveRule = {
  countryCode: "NZ",
  status: "monitoring",
  enforcementEnabled: false,
  minimumSocialAge: 16,
  guardianConsentBelow: 16,
  requireAgeAssuranceForSocial: true,
  minorTargetedAdsProhibited: true,
};

const effectiveNzRule: PantavionCountryAdaptiveRule = {
  ...monitoringNzRule,
  status: "effective",
  enforcementEnabled: true,
};

const age15Monitored = resolvePantavionAdaptivePolicy({ countryCode: "NZ", feature: "social_feed", age: 15, countryRule: monitoringNzRule });
equal(age15Monitored.maturityLevel, "young_teen", "15-year maturity");
equal(age15Monitored.jurisdictionRuleApplied, false, "monitoring law not enforced");
equal(age15Monitored.socialMode, "protected_social", "15-year protected social");

const age15Effective = resolvePantavionAdaptivePolicy({ countryCode: "NZ", feature: "social_feed", age: 15, guardianConsent: true, countryRule: effectiveNzRule });
equal(age15Effective.socialMode, "education_only", "below-threshold social becomes education mode");
equal(age15Effective.publicDiscoverability, "off", "below-threshold discoverability");
equal(age15Effective.access, "restricted", "below-threshold ecosystem preserved");

const age15Publish = resolvePantavionAdaptivePolicy({ countryCode: "NZ", feature: "social_publish", age: 15, guardianConsent: true, countryRule: effectiveNzRule });
equal(age15Publish.access, "blocked", "below-threshold public publishing");

const age16 = resolvePantavionAdaptivePolicy({ countryCode: "NZ", feature: "social_feed", age: 16, ageProof: { verified: true, minimumAgeProven: 16 }, countryRule: effectiveNzRule });
equal(age16.maturityLevel, "older_teen", "16-year maturity");
equal(age16.socialMode, "protected_social", "16-year protected social");
notEqual(age16.socialMode, "standard_social", "16-year does not jump to adult social");

const age17Ads = resolvePantavionAdaptivePolicy({ countryCode: "CY", feature: "personalized_ads", age: 17 });
equal(age17Ads.access, "blocked", "minor personalized ads");

const age18 = resolvePantavionAdaptivePolicy({ countryCode: "CY", feature: "social_feed", age: 18 });
equal(age18.maturityLevel, "adult", "18-year maturity");
equal(age18.socialMode, "standard_social", "adult social mode");

const learningAge10 = resolvePantavionAdaptivePolicy({ countryCode: "CY", feature: "panta_learn", age: 10, guardianConsent: true });
equal(learningAge10.access, "restricted", "learning remains available");
equal(learningAge10.educationPriority, "highest", "child education priority");

throws(() => buildPantavionBillingTruth({
  planKey: "pro",
  planName: "Pro",
  currency: "EUR",
  amountMinor: 14900,
  billingPeriod: "yearly",
  autoRenew: true,
  taxIncluded: true,
}), "nextRenewalAt", "renewal disclosure required");

const billingTruth = buildPantavionBillingTruth({
  planKey: "pro",
  planName: "Pro",
  currency: "EUR",
  amountMinor: 14900,
  billingPeriod: "yearly",
  autoRenew: true,
  nextRenewalAt: "2027-08-25T00:00:00.000Z",
  cancellationCutoffAt: "2027-08-24T23:59:59.000Z",
  taxIncluded: true,
});
equal(billingTruth.amountMajor, "149.00", "billing amount display");
equal(billingTruth.commitmentMinor, 14900, "billing commitment");

const candidates: PantavionProviderCandidate[] = [
  { adapterKey: "a", availability: "ready", capabilities: ["translation"], dataRegions: ["EU"], supportsSensitiveData: true, qualityScore: 0.91, estimatedCostPerMillion: 10, estimatedLatencyMs: 300 },
  { adapterKey: "b", availability: "ready", capabilities: ["translation"], dataRegions: ["EU"], supportsSensitiveData: true, qualityScore: 0.88, estimatedCostPerMillion: 2, estimatedLatencyMs: 150 },
];
const route = selectPantavionAIProvider({ requiredCapabilities: ["translation"], riskZone: "green", containsSensitiveData: true, preferredRegion: "EU" }, candidates);
equal(route.selectedAdapterKey, "b", "deterministic provider ranking");

const red = selectPantavionAIProvider({ requiredCapabilities: ["translation"], riskZone: "red", containsSensitiveData: true }, candidates);
equal(red.selectedAdapterKey, null, "red-zone no provider auto-selection");
equal(red.requiresHumanControl, true, "red-zone human control");

console.log(JSON.stringify({
  status: "PASS",
  checks: 45,
  infantCaregiverOnly: true,
  yearlyContentProgression: true,
  inclusiveLearningSupport: true,
  accessibilityAdaptation: true,
  safeguardingHumanPath: true,
  displacementContinuitySupport: true,
  ageProgression: [15, 16, 17, 18],
  protectedMinorSocial: true,
  ecosystemPreserved: true,
  monitoredLawNotAutoEnforced: true,
  billingTruth: true,
  providerNeutralRouting: true,
  redZoneHumanControl: true,
}, null, 2));
