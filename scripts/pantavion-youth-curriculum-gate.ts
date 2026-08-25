import { resolvePantavionAdaptivePolicy, type PantavionCountryAdaptiveRule } from "../core/governance/adaptive-ecosystem-policy";
import { resolvePantavionYouthCapability } from "../core/governance/youth-capability-benefit-engine";
import { resolvePantavionCurriculum, type PantavionCurriculumResource } from "../core/learning/country-curriculum-policy";
import { pantavionCountryCurriculumRegistry } from "../core/learning/country-curriculum-registry";

function equal<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, received ${String(actual)}`);
}

const monitoringNzLearning = resolvePantavionYouthCapability({
  countryCode: "NZ",
  age: 13,
  capability: "learning",
});
equal(monitoringNzLearning.regulatoryClass, "education_or_support", "learning regulatory separation");
equal(monitoringNzLearning.socialFunctionSeparatedFromEducationAndSupport, true, "learning/social separation");
equal(monitoringNzLearning.optimizeForChildBenefitNotEngagement, true, "minor benefit-first optimization");
equal(monitoringNzLearning.jurisdictionStatus, "monitoring", "NZ remains monitoring");

const monitoringNzSocial = resolvePantavionYouthCapability({
  countryCode: "NZ",
  age: 15,
  capability: "public_social_feed",
});
equal(monitoringNzSocial.regulatoryClass, "social_media", "public social classified separately");
equal(monitoringNzSocial.jurisdictionReviewRequired, true, "proposal does not auto-enforce");

const blockedThenThresholdRule: PantavionCountryAdaptiveRule = {
  countryCode: "XZ",
  status: "effective",
  enforcementEnabled: true,
  blockedFeatures: ["payments"],
  minimumPaymentAge: 18,
};
const monotonicBlock = resolvePantavionAdaptivePolicy({
  countryCode: "XZ",
  feature: "payments",
  age: 30,
  countryRule: blockedThenThresholdRule,
});
equal(monotonicBlock.access, "blocked", "blocked decision cannot be weakened by later age-proof sub-check");

const grCatalogOnly = resolvePantavionCurriculum({
  countryCode: "GR",
  academicYear: "2026-2027",
  gradeCode: "A",
  subjectCode: "MATH",
  languageCode: "EL",
}, pantavionCountryCurriculumRegistry);
equal(grCatalogOnly.coverage, "verified_partial", "country catalog is not exact grade/subject alignment");
equal(grCatalogOnly.canShowFullBookText, false, "metadata catalog does not expose full textbook");
equal(grCatalogOnly.canGenerateOriginalPractice, false, "exact curriculum mapping required before aligned practice");

const cyCatalogOnly = resolvePantavionCurriculum({
  countryCode: "CY",
  academicYear: "2026-2027",
  gradeCode: "D",
  subjectCode: "SCIENCE",
  languageCode: "EL",
}, pantavionCountryCurriculumRegistry);
equal(cyCatalogOnly.coverage, "verified_partial", "Cyprus authority source is only partial until exact mapping");
equal(cyCatalogOnly.sourceVerificationRequired, true, "exact Cyprus mapping still required");

const licensedExact: PantavionCurriculumResource[] = [{
  id: "test-licensed-math-a",
  countryCode: "XZ",
  schoolSystem: "public",
  academicYear: "2026-2027",
  educationStage: "PRIMARY",
  gradeCode: "A",
  subjectCode: "MATH",
  languageCode: "EL",
  title: "Licensed test resource",
  sourceKind: "licensed_textbook",
  license: "licensed",
  verificationStatus: "verified_current",
  curriculumVersion: "v1",
  topics: ["counting"],
  fullTextAvailable: true,
  exerciseContentAvailable: true,
  lastVerifiedAt: "2026-08-25",
}];

const licensedDecision = resolvePantavionCurriculum({
  countryCode: "XZ",
  schoolSystem: "public",
  academicYear: "2026-2027",
  gradeCode: "A",
  subjectCode: "MATH",
  languageCode: "EL",
}, licensedExact);
equal(licensedDecision.coverage, "verified_match", "exact licensed mapping");
equal(licensedDecision.canShowFullBookText, true, "licensed full text can be exposed");
equal(licensedDecision.canShowLicensedExercises, true, "licensed exercises can be exposed");
equal(licensedDecision.mustNotReproduceCopyrightedBook, true, "copyright reproduction rule remains explicit");

const openCurriculumExact: PantavionCurriculumResource[] = [{
  id: "test-open-curriculum",
  countryCode: "XZ",
  academicYear: "2026-2027",
  educationStage: "PRIMARY",
  gradeCode: "B",
  subjectCode: "SCIENCE",
  languageCode: "EN",
  title: "Open curriculum objectives",
  sourceKind: "official_curriculum",
  license: "official_open",
  verificationStatus: "verified_current",
  topics: ["plants", "weather"],
  fullTextAvailable: false,
  exerciseContentAvailable: false,
  lastVerifiedAt: "2026-08-25",
}];
const openCurriculumDecision = resolvePantavionCurriculum({
  countryCode: "XZ",
  academicYear: "2026-2027",
  gradeCode: "B",
  subjectCode: "SCIENCE",
  languageCode: "EN",
}, openCurriculumExact);
equal(openCurriculumDecision.canUseOfficialCurriculumStructure, true, "verified open curriculum structure usable");
equal(openCurriculumDecision.canGenerateOriginalPractice, true, "original practice can follow verified objectives");
equal(openCurriculumDecision.canGenerateOriginalExplanations, true, "original explanations can follow verified objectives");
equal(openCurriculumDecision.canShowFullBookText, false, "curriculum objectives do not imply textbook full-text rights");

console.log(JSON.stringify({
  status: "PASS",
  checks: 20,
  youthCapabilitySeparation: true,
  proposalNotAutoEnforced: true,
  monotonicSecurity: true,
  curriculumExactnessTruth: true,
  copyrightLicenseGate: true,
  originalPracticeFromVerifiedObjectives: true,
}, null, 2));
