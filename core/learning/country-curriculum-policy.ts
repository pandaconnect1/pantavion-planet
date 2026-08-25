export type PantavionCurriculumSourceKind =
  | "official_curriculum"
  | "official_open_textbook"
  | "public_domain"
  | "licensed_textbook"
  | "licensed_exercise_bank"
  | "metadata_only";

export type PantavionCurriculumLicense =
  | "official_open"
  | "public_domain"
  | "licensed"
  | "metadata_only";

export type PantavionCurriculumVerificationStatus =
  | "unverified"
  | "reviewed"
  | "verified_current"
  | "superseded";

export type PantavionCurriculumResource = {
  id: string;
  countryCode: string;
  regionCode?: string;
  schoolSystem?: string;
  academicYear?: string;
  educationStage: string;
  gradeCode: string;
  subjectCode: string;
  languageCode: string;
  title: string;
  sourceKind: PantavionCurriculumSourceKind;
  license: PantavionCurriculumLicense;
  verificationStatus: PantavionCurriculumVerificationStatus;
  officialSourceUrl?: string;
  publisherOrAuthority?: string;
  curriculumVersion?: string;
  validFrom?: string;
  validTo?: string;
  topics?: readonly string[];
  fullTextAvailable?: boolean;
  exerciseContentAvailable?: boolean;
  lastVerifiedAt?: string;
};

export type PantavionCurriculumQuery = {
  countryCode: string;
  regionCode?: string;
  schoolSystem?: string;
  academicYear?: string;
  gradeCode?: string;
  subjectCode?: string;
  languageCode?: string;
};

export type PantavionCurriculumCoverage =
  | "verified_match"
  | "verified_partial"
  | "coverage_missing";

export type PantavionCurriculumDecision = {
  coverage: PantavionCurriculumCoverage;
  resources: readonly PantavionCurriculumResource[];
  canUseOfficialCurriculumStructure: boolean;
  canShowFullBookText: boolean;
  canShowLicensedExercises: boolean;
  canGenerateOriginalPractice: boolean;
  canGenerateOriginalExplanations: boolean;
  mustNotReproduceCopyrightedBook: boolean;
  sourceVerificationRequired: boolean;
  notes: readonly string[];
};

function normalize(value: string | undefined): string | undefined {
  return value?.trim().toUpperCase() || undefined;
}

function wildcardMatch(resourceValue: string | undefined, queryValue: string | undefined): boolean {
  if (!queryValue) return true;
  const normalizedResource = normalize(resourceValue);
  return normalizedResource === "*" || normalizedResource === normalize(queryValue);
}

function resourceMatches(resource: PantavionCurriculumResource, query: PantavionCurriculumQuery): boolean {
  if (normalize(resource.countryCode) !== normalize(query.countryCode)) return false;
  if (query.regionCode && !wildcardMatch(resource.regionCode, query.regionCode)) return false;
  if (query.schoolSystem && resource.schoolSystem !== "*" && resource.schoolSystem !== query.schoolSystem) return false;
  if (query.academicYear && resource.academicYear !== "*" && resource.academicYear !== query.academicYear) return false;
  if (!wildcardMatch(resource.gradeCode, query.gradeCode)) return false;
  if (!wildcardMatch(resource.subjectCode, query.subjectCode)) return false;
  if (!wildcardMatch(resource.languageCode, query.languageCode)) return false;
  return true;
}

function isVerified(resource: PantavionCurriculumResource): boolean {
  return resource.verificationStatus === "verified_current";
}

function isExactForQuery(resource: PantavionCurriculumResource, query: PantavionCurriculumQuery): boolean {
  if (query.gradeCode && normalize(resource.gradeCode) !== normalize(query.gradeCode)) return false;
  if (query.subjectCode && normalize(resource.subjectCode) !== normalize(query.subjectCode)) return false;
  if (query.languageCode && normalize(resource.languageCode) !== normalize(query.languageCode)) return false;
  if (query.academicYear && resource.academicYear !== query.academicYear) return false;
  return true;
}

function permitsFullText(resource: PantavionCurriculumResource): boolean {
  return Boolean(
    resource.fullTextAvailable &&
      isVerified(resource) &&
      (resource.license === "official_open" || resource.license === "public_domain" || resource.license === "licensed"),
  );
}

function permitsExerciseContent(resource: PantavionCurriculumResource): boolean {
  return Boolean(
    resource.exerciseContentAvailable &&
      isVerified(resource) &&
      (resource.license === "official_open" || resource.license === "public_domain" || resource.license === "licensed"),
  );
}

export function resolvePantavionCurriculum(
  query: PantavionCurriculumQuery,
  registry: readonly PantavionCurriculumResource[],
): PantavionCurriculumDecision {
  const matches = registry.filter((resource) => resourceMatches(resource, query));
  const verified = matches.filter(isVerified);
  const exactVerified = verified.filter((resource) => isExactForQuery(resource, query));

  const wantsSpecificCurriculum = Boolean(query.gradeCode || query.subjectCode || query.languageCode || query.academicYear);
  const coverage: PantavionCurriculumCoverage = exactVerified.length > 0
    ? "verified_match"
    : verified.length > 0
      ? "verified_partial"
      : "coverage_missing";

  const usableForInstruction = wantsSpecificCurriculum ? exactVerified : verified;
  const canUseOfficialCurriculumStructure = usableForInstruction.some((resource) =>
    resource.sourceKind === "official_curriculum" || resource.sourceKind === "official_open_textbook",
  );

  const notes: string[] = [];
  if (coverage === "coverage_missing") {
    notes.push("No verified current curriculum source is registered for this query.");
    notes.push("Pantavion must not claim alignment to a school curriculum until an official or licensed source is verified.");
  }
  if (coverage === "verified_partial") {
    notes.push("An authoritative country-level source is known, but exact grade/subject alignment is not yet verified.");
    notes.push("Pantavion must not claim exact curriculum alignment for this query until the exact source mapping is registered.");
  }

  if (matches.some((resource) => resource.license === "metadata_only")) {
    notes.push("Metadata-only resources may identify a book or curriculum but must not expose copyrighted full text.");
  }

  notes.push("Original explanations and practice may be generated only from verified curriculum objectives, without copying protected textbook expression.");

  return {
    coverage,
    resources: verified,
    canUseOfficialCurriculumStructure,
    canShowFullBookText: exactVerified.some(permitsFullText),
    canShowLicensedExercises: exactVerified.some(permitsExerciseContent),
    canGenerateOriginalPractice: canUseOfficialCurriculumStructure,
    canGenerateOriginalExplanations: canUseOfficialCurriculumStructure,
    mustNotReproduceCopyrightedBook: true,
    sourceVerificationRequired: coverage !== "verified_match",
    notes,
  };
}
