import { createHash } from "node:crypto";

export const INNOVATION_REVIEW_PREFLIGHT_SCHEMA =
  "pantavion.innovation-review-preflight.v1" as const;
export const INNOVATION_REVIEW_PREFLIGHT_POLICY =
  "founder-evidence-review-fail-closed-v1" as const;
export const MATURITY_QUEUE_FINGERPRINT =
  "f9149725957a173c9dc02c16858503c766744165ddb6f9ebc92191f7182afcb7" as const;

const DECISIONS = new Set(["HOLD", "CONFIRM_DISTINCT", "CONFIRM_OVERLAP"]);
const REQUEST_KEYS = new Set(["batchId", "sourceQueueFingerprint", "items"]);
const ITEM_KEYS = new Set([
  "queueItemId",
  "atomId",
  "sourceCandidateId",
  "atomFingerprint",
  "decision",
  "targetAtomId",
  "targetAtomFingerprint",
  "rationale",
  "evidenceRefs",
  "sourcePreserved",
  "semanticMergeAuthorized",
  "noveltyClaimed",
  "executionAuthorized",
]);
const SHA256 = /^[a-f0-9]{64}$/;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;

type RecordValue = Record<string, unknown>;
type ReviewDecision = "HOLD" | "CONFIRM_DISTINCT" | "CONFIRM_OVERLAP";

export type InnovationReviewPreflightItem = {
  queueItemId: string;
  atomId: string;
  sourceCandidateId: string;
  atomFingerprint: string;
  decision: ReviewDecision;
  targetAtomId?: string;
  targetAtomFingerprint?: string;
  rationale: string;
  evidenceRefs: string[];
  sourcePreserved: true;
  semanticMergeAuthorized: false;
  noveltyClaimed: false;
  executionAuthorized: false;
};

export type InnovationReviewPreflightRequest = {
  batchId: string;
  sourceQueueFingerprint: typeof MATURITY_QUEUE_FINGERPRINT;
  items: InnovationReviewPreflightItem[];
};

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(value: RecordValue, allowed: Set<string>, location: string) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`invalid_innovation_review_preflight:unknown_${location}_field:${key}`);
    }
  }
}

function boundedString(value: unknown, field: string, max: number) {
  if (typeof value !== "string") {
    throw new Error(`invalid_innovation_review_preflight:${field}_must_be_string`);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > max) {
    throw new Error(`invalid_innovation_review_preflight:${field}_length`);
  }
  return normalized;
}

function identifier(value: unknown, field: string) {
  const normalized = boundedString(value, field, 160);
  if (!ID.test(normalized)) {
    throw new Error(`invalid_innovation_review_preflight:${field}_format`);
  }
  return normalized;
}

function fingerprint(value: unknown, field: string) {
  const normalized = boundedString(value, field, 64).toLowerCase();
  if (!SHA256.test(normalized)) {
    throw new Error(`invalid_innovation_review_preflight:${field}_format`);
  }
  return normalized;
}

function exactBoolean<T extends boolean>(value: unknown, field: string, expected: T): T {
  if (value !== expected) {
    throw new Error(`invalid_innovation_review_preflight:${field}_must_be_${expected}`);
  }
  return expected;
}

function parseItem(value: unknown, index: number): InnovationReviewPreflightItem {
  if (!isRecord(value)) {
    throw new Error(`invalid_innovation_review_preflight:item_${index}_object_required`);
  }
  rejectUnknownKeys(value, ITEM_KEYS, "item");

  const decision = boundedString(value.decision, `items[${index}].decision`, 32);
  if (!DECISIONS.has(decision)) {
    throw new Error(`invalid_innovation_review_preflight:items[${index}].decision`);
  }

  if (!Array.isArray(value.evidenceRefs) || value.evidenceRefs.length > 16) {
    throw new Error(`invalid_innovation_review_preflight:items[${index}].evidence_count`);
  }
  const evidenceRefs = value.evidenceRefs.map((entry, evidenceIndex) =>
    boundedString(entry, `items[${index}].evidenceRefs[${evidenceIndex}]`, 1024),
  );
  if (new Set(evidenceRefs).size !== evidenceRefs.length) {
    throw new Error(`invalid_innovation_review_preflight:items[${index}].duplicate_evidence`);
  }

  const item: InnovationReviewPreflightItem = {
    queueItemId: identifier(value.queueItemId, `items[${index}].queueItemId`),
    atomId: identifier(value.atomId, `items[${index}].atomId`),
    sourceCandidateId: identifier(value.sourceCandidateId, `items[${index}].sourceCandidateId`),
    atomFingerprint: fingerprint(value.atomFingerprint, `items[${index}].atomFingerprint`),
    decision: decision as ReviewDecision,
    rationale: boundedString(value.rationale, `items[${index}].rationale`, 4000),
    evidenceRefs,
    sourcePreserved: exactBoolean(value.sourcePreserved, `items[${index}].sourcePreserved`, true),
    semanticMergeAuthorized: exactBoolean(
      value.semanticMergeAuthorized,
      `items[${index}].semanticMergeAuthorized`,
      false,
    ),
    noveltyClaimed: exactBoolean(value.noveltyClaimed, `items[${index}].noveltyClaimed`, false),
    executionAuthorized: exactBoolean(
      value.executionAuthorized,
      `items[${index}].executionAuthorized`,
      false,
    ),
  };

  if (decision === "CONFIRM_OVERLAP") {
    item.targetAtomId = identifier(value.targetAtomId, `items[${index}].targetAtomId`);
    item.targetAtomFingerprint = fingerprint(
      value.targetAtomFingerprint,
      `items[${index}].targetAtomFingerprint`,
    );
    if (item.targetAtomId === item.atomId) {
      throw new Error(`invalid_innovation_review_preflight:items[${index}].self_overlap`);
    }
    if (evidenceRefs.length === 0 || item.rationale.length < 20) {
      throw new Error(`invalid_innovation_review_preflight:items[${index}].overlap_evidence_required`);
    }
  } else if (value.targetAtomId !== undefined || value.targetAtomFingerprint !== undefined) {
    throw new Error(`invalid_innovation_review_preflight:items[${index}].unexpected_target`);
  }

  if (decision === "CONFIRM_DISTINCT" && (evidenceRefs.length === 0 || item.rationale.length < 20)) {
    throw new Error(`invalid_innovation_review_preflight:items[${index}].distinct_evidence_required`);
  }

  return item;
}

export function parseInnovationReviewPreflightRequest(
  value: unknown,
): InnovationReviewPreflightRequest {
  if (!isRecord(value)) {
    throw new Error("invalid_innovation_review_preflight:object_required");
  }
  rejectUnknownKeys(value, REQUEST_KEYS, "request");

  const batchId = identifier(value.batchId, "batchId");
  const sourceQueueFingerprint = fingerprint(value.sourceQueueFingerprint, "sourceQueueFingerprint");
  if (sourceQueueFingerprint !== MATURITY_QUEUE_FINGERPRINT) {
    throw new Error("invalid_innovation_review_preflight:source_queue_fingerprint_mismatch");
  }
  if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 100) {
    throw new Error("invalid_innovation_review_preflight:items_count");
  }

  const items = value.items.map(parseItem);
  const queueIds = items.map((item) => item.queueItemId);
  const atomIds = items.map((item) => item.atomId);
  if (new Set(queueIds).size !== queueIds.length) {
    throw new Error("invalid_innovation_review_preflight:duplicate_queue_item");
  }
  if (new Set(atomIds).size !== atomIds.length) {
    throw new Error("invalid_innovation_review_preflight:duplicate_atom");
  }

  return {
    batchId,
    sourceQueueFingerprint: MATURITY_QUEUE_FINGERPRINT,
    items,
  };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function createInnovationReviewPreflight(value: unknown) {
  const request = parseInnovationReviewPreflightRequest(value);
  const results = request.items.map((item) => ({
    queueItemId: item.queueItemId,
    atomId: item.atomId,
    proposedDecision: item.decision,
    readiness: item.decision === "HOLD" ? "HOLD" : "READY_FOR_OWNER_RECORDING",
    evidenceCount: item.evidenceRefs.length,
    sourcePreserved: true,
    decisionRecorded: false,
    semanticMergePerformed: false,
    maturityClaimAllowed: false,
    noveltyClaimAllowed: false,
    executionAllowed: false,
    authorizationEffect: "none",
  }));

  const summary = {
    itemCount: results.length,
    holdCount: results.filter((item) => item.readiness === "HOLD").length,
    readyForOwnerRecordingCount: results.filter(
      (item) => item.readiness === "READY_FOR_OWNER_RECORDING",
    ).length,
    decisionsRecorded: 0,
    semanticMergesPerformed: 0,
    noveltyClaimsAllowed: 0,
    executionAuthorizations: 0,
  };

  const receiptPayload = {
    schema: INNOVATION_REVIEW_PREFLIGHT_SCHEMA,
    policyVersion: INNOVATION_REVIEW_PREFLIGHT_POLICY,
    request,
    results,
    summary,
  };

  return {
    ...receiptPayload,
    preflightOnly: true as const,
    ownerRecordingRequired: true as const,
    receiptSha256: createHash("sha256").update(stableJson(receiptPayload)).digest("hex"),
  };
}
