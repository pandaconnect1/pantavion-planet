import { createHash } from "node:crypto";

export const PANTAVION_RECOVERY_CORPUS_CONTRACT = {
  version: "pantavion_recovery_corpus_contract_v1",
  intentId: "total_ingest_004",
  intakeReference: "total-ingestion:recovery-corpus",
  corpusRoot: "data/recovery/imported-pr248/canonical-ledger/corpus",
  semanticLedgerPath: "data/recovery/canonical-semantic-v3/semantic-ledger.ndjson",
  governedHoldPath: "data/recovery/governed-hold-resolution-v4.json",
  sourceRecordCount: 82_413,
  sourceBatchCount: 55,
  sourceFingerprint: "99ff942f154e3dac6298488923e15436c9ebf652b64bc14bcfb72efc82b22d2d",
  orderedIdFingerprint: "d796a55c548655fda8b1014f4db810a7cf7b5f1aef8c7441b985faa8baa00b51",
  classifiedCount: 31_779,
  recursiveQuarantineCount: 50_279,
  governedHoldCount: 355,
  batchSize: 500,
  partitionCount: 165,
  executionAuthority: false,
  releaseAuthority: false,
  productionWriteAuthority: false,
} as const;

export type PantavionRecoveryReviewStatus =
  | "SEMANTICALLY_CLASSIFIED"
  | "PRESERVED_RECURSIVE_ARTIFACT"
  | "REVIEW_REQUIRED";

export type PantavionRecoveryRuntimeLane =
  | "CLASSIFIED_CANDIDATE"
  | "GOVERNED_HOLD"
  | "QUARANTINED_RECURSIVE";

export type PantavionRecoveryNextAction =
  | "PLAN_SCOPED_INTERNAL_DRAFT"
  | "PRESERVE_GOVERNED_HOLD"
  | "PRESERVE_RECURSIVE_PROVENANCE";

export interface PantavionRecoverySemanticRecord {
  id: string;
  reviewStatus: PantavionRecoveryReviewStatus;
  semanticDecision?: string;
  semanticReviewReasons?: unknown;
  provenance?: {
    sourceFile?: unknown;
    sourceFamily?: unknown;
  };
  classification?: {
    module?: unknown;
    subsystem?: unknown;
    capability?: unknown;
    feature?: unknown;
    artifactType?: unknown;
    canonicalTarget?: unknown;
    classificationMethod?: unknown;
  };
  [key: string]: unknown;
}

export interface PantavionGovernedHoldDisposition {
  sourceFile: string;
  expectedRecords: number;
  disposition: string;
  canonicalOwner: string;
  sharedWith?: string[];
  subsystem: string;
  capability: string;
  canonicalTarget: string;
  executionAuthority: false;
  reason: string;
}

export interface PantavionRecoverySourceLocator {
  batchFile: string;
  batchRecordIndex: number;
  globalOrdinal: number;
  sourceRecordSha256: string;
}

export interface PantavionRecoveryWorkUnit {
  version: "pantavion_recovery_work_unit_v1";
  workUnitId: string;
  idempotencyKey: string;
  recordId: string;
  corpus: {
    sourceFingerprint: string;
    orderedIdFingerprint: string;
    sourceRecordCount: number;
  };
  source: PantavionRecoverySourceLocator & {
    semanticRecordSha256: string;
  };
  route: {
    module: string | null;
    subsystem: string | null;
    capability: string | null;
    feature: string | null;
    artifactType: string | null;
    canonicalTarget: string | null;
    classificationMethod: string | null;
  };
  runtimeLane: PantavionRecoveryRuntimeLane;
  implementationState: "idea" | "blocked";
  nextAction: PantavionRecoveryNextAction;
  reviewReasons: string[];
  governance: {
    disposition: string | null;
    canonicalOwner: string | null;
    sharedWith: string[];
    reason: string | null;
    executionAuthority: false;
    releaseAuthority: false;
    productionWriteAuthority: false;
  };
  previousWorkUnitDigest: string | null;
  workUnitDigest: string;
}

export interface PantavionRecoveryRuntimeCounts {
  CLASSIFIED_CANDIDATE: number;
  GOVERNED_HOLD: number;
  QUARANTINED_RECURSIVE: number;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("recovery_runtime_non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  }
  throw new Error("recovery_runtime_unsupported_digest_value");
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim())
    : [];
}

function assertSha256(label: string, value: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label}_must_be_sha256`);
}

function classifyLane(record: PantavionRecoverySemanticRecord): {
  lane: PantavionRecoveryRuntimeLane;
  implementationState: "idea" | "blocked";
  nextAction: PantavionRecoveryNextAction;
} {
  if (record.reviewStatus === "SEMANTICALLY_CLASSIFIED") {
    if (record.semanticDecision !== "ROUTE_CANDIDATE") {
      throw new Error("classified_record_missing_route_candidate_decision");
    }
    return {
      lane: "CLASSIFIED_CANDIDATE",
      implementationState: "idea",
      nextAction: "PLAN_SCOPED_INTERNAL_DRAFT",
    };
  }
  if (record.reviewStatus === "PRESERVED_RECURSIVE_ARTIFACT") {
    if (record.semanticDecision !== "PRESERVE_QUARANTINE") {
      throw new Error("recursive_record_missing_quarantine_decision");
    }
    return {
      lane: "QUARANTINED_RECURSIVE",
      implementationState: "blocked",
      nextAction: "PRESERVE_RECURSIVE_PROVENANCE",
    };
  }
  if (record.reviewStatus === "REVIEW_REQUIRED") {
    if (record.semanticDecision !== "HOLD") throw new Error("hold_record_missing_hold_decision");
    return {
      lane: "GOVERNED_HOLD",
      implementationState: "blocked",
      nextAction: "PRESERVE_GOVERNED_HOLD",
    };
  }
  throw new Error("recovery_runtime_unknown_review_status");
}

export function digestPantavionRecoverySourceRecord(record: unknown): string {
  return sha256(canonicalJson(record));
}

export function materializePantavionRecoveryWorkUnit(input: {
  record: PantavionRecoverySemanticRecord;
  locator: PantavionRecoverySourceLocator;
  governedDisposition?: PantavionGovernedHoldDisposition;
  previousWorkUnitDigest?: string | null;
}): PantavionRecoveryWorkUnit {
  const recordId = text(input.record.id);
  if (!recordId) throw new Error("recovery_runtime_record_id_required");
  if (!Number.isInteger(input.locator.batchRecordIndex) || input.locator.batchRecordIndex < 0) {
    throw new Error("recovery_runtime_batch_record_index_invalid");
  }
  if (!Number.isInteger(input.locator.globalOrdinal) || input.locator.globalOrdinal < 1) {
    throw new Error("recovery_runtime_global_ordinal_invalid");
  }
  if (!text(input.locator.batchFile)) throw new Error("recovery_runtime_batch_file_required");
  assertSha256("recovery_runtime_source_record_digest", input.locator.sourceRecordSha256);
  if (input.previousWorkUnitDigest) {
    assertSha256("recovery_runtime_previous_work_unit_digest", input.previousWorkUnitDigest);
  }

  const lane = classifyLane(input.record);
  const sourceFile = text(input.record.provenance?.sourceFile);
  const classification = input.record.classification ?? {};
  const moduleName = text(classification.module);
  const subsystem = text(classification.subsystem);
  const capability = text(classification.capability);
  const canonicalTarget = text(classification.canonicalTarget);

  if (lane.lane === "CLASSIFIED_CANDIDATE" && (!moduleName || !subsystem || !capability || !canonicalTarget)) {
    throw new Error("classified_candidate_missing_canonical_route");
  }

  const disposition = input.governedDisposition;
  if (lane.lane === "GOVERNED_HOLD") {
    if (!disposition) throw new Error("governed_hold_disposition_required");
    if (!sourceFile || disposition.sourceFile !== sourceFile) {
      throw new Error("governed_hold_source_mismatch");
    }
    if (disposition.executionAuthority !== false) {
      throw new Error("governed_hold_execution_authority_forbidden");
    }
  } else if (disposition) {
    throw new Error("governed_disposition_only_allowed_for_hold");
  }

  const workUnitId = `recovery_work_unit_${sha256(`${PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint}:${recordId}`)}`;
  const idempotencyKey = sha256([
    PANTAVION_RECOVERY_CORPUS_CONTRACT.version,
    PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint,
    PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint,
    recordId,
    lane.lane,
    canonicalTarget ?? "",
  ].join(":"));

  const unsigned = {
    version: "pantavion_recovery_work_unit_v1" as const,
    workUnitId,
    idempotencyKey,
    recordId,
    corpus: {
      sourceFingerprint: PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint,
      orderedIdFingerprint: PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint,
      sourceRecordCount: PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount,
    },
    source: {
      ...input.locator,
      batchFile: input.locator.batchFile.trim(),
      semanticRecordSha256: digestPantavionRecoverySourceRecord(input.record),
    },
    route: {
      module: moduleName,
      subsystem,
      capability,
      feature: text(classification.feature),
      artifactType: text(classification.artifactType),
      canonicalTarget,
      classificationMethod: text(classification.classificationMethod),
    },
    runtimeLane: lane.lane,
    implementationState: lane.implementationState,
    nextAction: lane.nextAction,
    reviewReasons: stringList(input.record.semanticReviewReasons),
    governance: {
      disposition: disposition?.disposition ?? null,
      canonicalOwner: disposition?.canonicalOwner ?? null,
      sharedWith: disposition?.sharedWith ?? [],
      reason: disposition?.reason ?? null,
      executionAuthority: false as const,
      releaseAuthority: false as const,
      productionWriteAuthority: false as const,
    },
    previousWorkUnitDigest: input.previousWorkUnitDigest ?? null,
  };

  return {
    ...unsigned,
    workUnitDigest: sha256(canonicalJson(unsigned)),
  };
}

export function assertPantavionRecoveryRuntimeCounts(counts: PantavionRecoveryRuntimeCounts): void {
  const contract = PANTAVION_RECOVERY_CORPUS_CONTRACT;
  if (counts.CLASSIFIED_CANDIDATE !== contract.classifiedCount) {
    throw new Error("recovery_runtime_classified_count_mismatch");
  }
  if (counts.QUARANTINED_RECURSIVE !== contract.recursiveQuarantineCount) {
    throw new Error("recovery_runtime_recursive_count_mismatch");
  }
  if (counts.GOVERNED_HOLD !== contract.governedHoldCount) {
    throw new Error("recovery_runtime_governed_hold_count_mismatch");
  }
  const total = counts.CLASSIFIED_CANDIDATE + counts.QUARANTINED_RECURSIVE + counts.GOVERNED_HOLD;
  if (total !== contract.sourceRecordCount) throw new Error("recovery_runtime_total_count_mismatch");
}

export const pantavionRecoveryRuntimeDoctrine = {
  rule: "Every recovered record becomes exactly one immutable Pantavion work unit or an explicit fail-closed preservation unit; classification never grants execution, merge, deployment, public exposure, or release authority.",
  truthChain: ["source_record", "semantic_classification", "governed_disposition", "work_unit", "scoped_plan", "tested_evidence"] as const,
  publicReleaseRequiresFounderGreenLight: true,
  rawPayloadDuplicatedIntoControlPlane: false,
} as const;
