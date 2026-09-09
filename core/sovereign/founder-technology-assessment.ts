import { createHash } from "node:crypto";

import {
  assessTechnologyLibraryEntry,
  type TechnologyEvidence,
  type TechnologyLibraryEntry,
} from "./technology-library.ts";

export const TECHNOLOGY_ASSESSMENT_SCHEMA = "pantavion.technology-library.assessment.v1" as const;
export const TECHNOLOGY_ASSESSMENT_POLICY = "technology-library-fail-closed-v1" as const;

const SOURCES = new Set(["pantavion_native", "open_source", "open_standard", "external_provider"]);
const MATURITIES = new Set(["research", "prototype", "production_proven"]);
const EVIDENCE_KINDS = new Set(["source", "benchmark", "security", "privacy", "license"]);
const ENTRY_KEYS = new Set([
  "id", "name", "capability", "source", "maturity", "licenseId",
  "commercialUseAllowed", "sourceAvailable", "reversibleIntegration",
  "securityReviewed", "privacyReviewed", "evidence",
]);
const EVIDENCE_KEYS = new Set(["kind", "reference", "digest", "observedAt"]);

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(value: RecordValue, allowed: Set<string>, location: string) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`invalid_technology_assessment_request:unknown_${location}_field:${key}`);
  }
}

function boundedString(value: unknown, field: string, max: number, optional?: false): string;\nfunction boundedString(value: unknown, field: string, max: number, optional: true): string | undefined;\nfunction boundedString(value: unknown, field: string, max: number, optional = false): string | undefined {
  if (optional && value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`invalid_technology_assessment_request:${field}_must_be_string`);
  const normalized = value.trim();
  if (!normalized || normalized.length > max) {
    throw new Error(`invalid_technology_assessment_request:${field}_length`);
  }
  return normalized;
}

function requiredBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw new Error(`invalid_technology_assessment_request:${field}_must_be_boolean`);
  }
  return value;
}

function evidenceItem(value: unknown, index: number): TechnologyEvidence {
  if (!isRecord(value)) throw new Error("invalid_technology_assessment_request:evidence_item");
  rejectUnknownKeys(value, EVIDENCE_KEYS, "evidence");
  if (typeof value.kind !== "string" || !EVIDENCE_KINDS.has(value.kind)) {
    throw new Error("invalid_technology_assessment_request:evidence_kind");
  }
  const observedAt = boundedString(value.observedAt, `evidence_${index}_observedAt`, 64);
  if (!Number.isFinite(Date.parse(observedAt))) {
    throw new Error("invalid_technology_assessment_request:evidence_timestamp");
  }
  const digest = boundedString(value.digest, `evidence_${index}_digest`, 256, true);
  return {
    kind: value.kind as TechnologyEvidence["kind"],
    reference: boundedString(value.reference, `evidence_${index}_reference`, 1_024),
    ...(digest ? { digest } : {}),
    observedAt,
  };
}

export function parseTechnologyAssessmentRequest(input: unknown): TechnologyLibraryEntry {
  if (!isRecord(input)) throw new Error("invalid_technology_assessment_request:object_required");
  rejectUnknownKeys(input, ENTRY_KEYS, "entry");

  if (typeof input.source !== "string" || !SOURCES.has(input.source)) {
    throw new Error("invalid_technology_assessment_request:source");
  }
  if (typeof input.maturity !== "string" || !MATURITIES.has(input.maturity)) {
    throw new Error("invalid_technology_assessment_request:maturity");
  }
  if (!Array.isArray(input.evidence) || input.evidence.length < 1 || input.evidence.length > 20) {
    throw new Error("invalid_technology_assessment_request:evidence_count");
  }

  const licenseId = boundedString(input.licenseId, "licenseId", 160, true);
  return {
    id: boundedString(input.id, "id", 160),
    name: boundedString(input.name, "name", 240),
    capability: boundedString(input.capability, "capability", 2_000),
    source: input.source as TechnologyLibraryEntry["source"],
    maturity: input.maturity as TechnologyLibraryEntry["maturity"],
    ...(licenseId ? { licenseId } : {}),
    commercialUseAllowed: requiredBoolean(input.commercialUseAllowed, "commercialUseAllowed"),
    sourceAvailable: requiredBoolean(input.sourceAvailable, "sourceAvailable"),
    reversibleIntegration: requiredBoolean(input.reversibleIntegration, "reversibleIntegration"),
    securityReviewed: requiredBoolean(input.securityReviewed, "securityReviewed"),
    privacyReviewed: requiredBoolean(input.privacyReviewed, "privacyReviewed"),
    evidence: input.evidence.map(evidenceItem),
  };
}

function canonicalEntry(entry: TechnologyLibraryEntry) {
  return {
    id: entry.id,
    name: entry.name,
    capability: entry.capability,
    source: entry.source,
    maturity: entry.maturity,
    licenseId: entry.licenseId ?? null,
    commercialUseAllowed: entry.commercialUseAllowed,
    sourceAvailable: entry.sourceAvailable,
    reversibleIntegration: entry.reversibleIntegration,
    securityReviewed: entry.securityReviewed,
    privacyReviewed: entry.privacyReviewed,
    evidence: entry.evidence.map((item) => ({
      kind: item.kind,
      reference: item.reference,
      digest: item.digest ?? null,
      observedAt: item.observedAt,
    })),
  };
}

export function createFounderTechnologyAssessment(input: unknown) {
  const entry = parseTechnologyAssessmentRequest(input);
  const assessment = assessTechnologyLibraryEntry(entry);
  const receiptPayload = {
    schema: TECHNOLOGY_ASSESSMENT_SCHEMA,
    policyVersion: TECHNOLOGY_ASSESSMENT_POLICY,
    entry: canonicalEntry(entry),
    assessment,
    assessmentOnly: true,
    installationAuthorized: false,
    deploymentAuthorized: false,
    authorizationEffect: "none" as const,
  };
  const receiptSha256 = createHash("sha256")
    .update(JSON.stringify(receiptPayload))
    .digest("hex");

  return {
    ...receiptPayload,
    receiptSha256,
  };
}
