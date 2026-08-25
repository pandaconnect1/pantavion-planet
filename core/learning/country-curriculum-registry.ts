import type { PantavionCurriculumResource } from "./country-curriculum-policy";

/**
 * Registry entries describe verified authoritative sources and their permitted use.
 * They do NOT grant Pantavion rights to reproduce copyrighted textbook content.
 */
export const pantavionCountryCurriculumRegistry = [
  {
    id: "gr-national-schoolbooks-2026-2027",
    countryCode: "GR",
    schoolSystem: "national",
    academicYear: "2026-2027",
    educationStage: "PRIMARY_SECONDARY",
    gradeCode: "*",
    subjectCode: "*",
    languageCode: "EL",
    title: "Greek Interactive School Books and curricula 2026-2027",
    sourceKind: "official_curriculum",
    license: "metadata_only",
    verificationStatus: "verified_current",
    officialSourceUrl: "https://www.ebooks.edu.gr/ebooks/",
    publisherOrAuthority: "Hellenic Ministry of Education / official school-books service",
    fullTextAvailable: false,
    exerciseContentAvailable: false,
    lastVerifiedAt: "2026-08-25",
  },
  {
    id: "cy-moec-books-2026-2027",
    countryCode: "CY",
    schoolSystem: "public",
    academicYear: "2026-2027",
    educationStage: "PRIMARY_SECONDARY",
    gradeCode: "*",
    subjectCode: "*",
    languageCode: "EL",
    title: "Cyprus Ministry school-book and educational-material sources 2026-2027",
    sourceKind: "official_curriculum",
    license: "metadata_only",
    verificationStatus: "verified_current",
    officialSourceUrl: "https://www.moec.gov.cy/",
    publisherOrAuthority: "Cyprus Ministry of Education, Sport and Youth",
    fullTextAvailable: false,
    exerciseContentAvailable: false,
    lastVerifiedAt: "2026-08-25",
  },
] as const satisfies readonly PantavionCurriculumResource[];
