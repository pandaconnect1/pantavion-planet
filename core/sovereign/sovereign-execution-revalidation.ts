import { createHash } from "node:crypto";

export const SOVEREIGN_EXECUTION_REVALIDATION_SCHEMA =
  "pantavion.sovereign-execution-revalidation.v1" as const;
export const SOVEREIGN_EXECUTION_REVALIDATION_POLICY =
  "fail-closed-non-expanding-pre-execution-v1" as const;

export type SovereignExecutionRevalidationDecision =
  | "DENY"
  | "REVALIDATION_PASSED";

export type SovereignExecutionRevalidationRequest = {
  admissionId: string;
  intentId: string;
  admissionBundleReceipt: string;
  currentBundleReceipt: string;
  ownerAdmissionReceipt: string;
  admissionRecorded: boolean;
  admittedAt: string;
  expiresAt: string;
  evaluationTime: string;
  revoked: boolean;
  admittedCapabilities: string[];
  requestedCapabilities: string[];
  budgetCeiling: number;
  budgetConsumed: number;
  requestedCost: number;
  admittedChainFingerprint: string;
  currentChainFingerprint: string;
  disconnected: boolean;
  lastAcceptedSequence: number;
  requestedSequence: number;
  replayNonce: string;
  previousReplayNonces: string[];
};

const REQUEST_KEYS = new Set([
  "admissionId", "intentId", "admissionBundleReceipt", "currentBundleReceipt",
  "ownerAdmissionReceipt", "admissionRecorded", "admittedAt", "expiresAt",
  "evaluationTime", "revoked", "admittedCapabilities", "requestedCapabilities",
  "budgetCeiling", "budgetConsumed", "requestedCost", "admittedChainFingerprint",
  "currentChainFingerprint", "disconnected", "lastAcceptedSequence",
  "requestedSequence", "replayNonce", "previousReplayNonces",
]);
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const CAPABILITY = /^[a-z][a-z0-9._:-]{0,127}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function identifier(value: unknown, name: string, pattern = ID) {
  if (typeof value !== "string" || !pattern.test(value.trim())) {
    throw new Error("invalid_execution_revalidation:" + name);
  }
  return value.trim();
}

function hash(value: unknown, name: string) {
  return identifier(value, name, SHA256).toLowerCase();
}

function boolean(value: unknown, name: string) {
  if (typeof value !== "boolean") throw new Error("invalid_execution_revalidation:" + name);
  return value;
}

function finiteNonNegative(value: unknown, name: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("invalid_execution_revalidation:" + name);
  }
  return value;
}

function integer(value: unknown, name: string) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("invalid_execution_revalidation:" + name);
  }
  return value;
}

function timestamp(value: unknown, name: string) {
  if (typeof value !== "string" || !value.trim() || !Number.isFinite(Date.parse(value))) {
    throw new Error("invalid_execution_revalidation:" + name);
  }
  return new Date(value).toISOString();
}

function capabilities(value: unknown, name: string, maximum = 64) {
  if (!Array.isArray(value) || value.length > maximum) {
    throw new Error("invalid_execution_revalidation:" + name);
  }
  const normalized = value.map((item, index) =>
    identifier(item, name + "_" + index, CAPABILITY).toLowerCase(),
  );
  if (new Set(normalized).size !== normalized.length) {
    throw new Error("invalid_execution_revalidation:" + name + "_duplicate");
  }
  return normalized.sort();
}

function nonceHistory(value: unknown) {
  if (!Array.isArray(value) || value.length > 128) {
    throw new Error("invalid_execution_revalidation:previousReplayNonces");
  }
  const normalized = value.map((item, index) => hash(item, "previousReplayNonces_" + index));
  if (new Set(normalized).size !== normalized.length) {
    throw new Error("invalid_execution_revalidation:previousReplayNonces_duplicate");
  }
  return normalized.sort();
}

export function parseSovereignExecutionRevalidation(
  value: unknown,
): SovereignExecutionRevalidationRequest {
  if (!isRecord(value)) throw new Error("invalid_execution_revalidation:object_required");
  for (const key of Object.keys(value)) {
    if (!REQUEST_KEYS.has(key)) throw new Error("invalid_execution_revalidation:unknown_field:" + key);
  }

  const parsed = {
    admissionId: identifier(value.admissionId, "admissionId"),
    intentId: identifier(value.intentId, "intentId"),
    admissionBundleReceipt: hash(value.admissionBundleReceipt, "admissionBundleReceipt"),
    currentBundleReceipt: hash(value.currentBundleReceipt, "currentBundleReceipt"),
    ownerAdmissionReceipt: hash(value.ownerAdmissionReceipt, "ownerAdmissionReceipt"),
    admissionRecorded: boolean(value.admissionRecorded, "admissionRecorded"),
    admittedAt: timestamp(value.admittedAt, "admittedAt"),
    expiresAt: timestamp(value.expiresAt, "expiresAt"),
    evaluationTime: timestamp(value.evaluationTime, "evaluationTime"),
    revoked: boolean(value.revoked, "revoked"),
    admittedCapabilities: capabilities(value.admittedCapabilities, "admittedCapabilities"),
    requestedCapabilities: capabilities(value.requestedCapabilities, "requestedCapabilities"),
    budgetCeiling: finiteNonNegative(value.budgetCeiling, "budgetCeiling"),
    budgetConsumed: finiteNonNegative(value.budgetConsumed, "budgetConsumed"),
    requestedCost: finiteNonNegative(value.requestedCost, "requestedCost"),
    admittedChainFingerprint: hash(value.admittedChainFingerprint, "admittedChainFingerprint"),
    currentChainFingerprint: hash(value.currentChainFingerprint, "currentChainFingerprint"),
    disconnected: boolean(value.disconnected, "disconnected"),
    lastAcceptedSequence: integer(value.lastAcceptedSequence, "lastAcceptedSequence"),
    requestedSequence: integer(value.requestedSequence, "requestedSequence"),
    replayNonce: hash(value.replayNonce, "replayNonce"),
    previousReplayNonces: nonceHistory(value.previousReplayNonces),
  };

  if (Date.parse(parsed.expiresAt) <= Date.parse(parsed.admittedAt)) {
    throw new Error("invalid_execution_revalidation:expiry_not_after_admission");
  }
  return parsed;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  if (isRecord(value)) {
    return "{" + Object.keys(value).sort().map(key =>
      JSON.stringify(key) + ":" + stableJson(value[key]),
    ).join(",") + "}";
  }
  return JSON.stringify(value) ?? "null";
}

export function revalidateSovereignExecution(value: unknown) {
  const request = parseSovereignExecutionRevalidation(value);
  const reasons: string[] = [];
  const admitted = new Set(request.admittedCapabilities);
  const projectedBudget = request.budgetConsumed + request.requestedCost;

  if (!request.admissionRecorded) reasons.push("owner_admission_not_recorded");
  if (request.revoked) reasons.push("owner_admission_revoked");
  if (Date.parse(request.evaluationTime) < Date.parse(request.admittedAt)) {
    reasons.push("evaluation_precedes_admission");
  }
  if (Date.parse(request.evaluationTime) >= Date.parse(request.expiresAt)) {
    reasons.push("owner_admission_expired");
  }
  if (request.currentBundleReceipt !== request.admissionBundleReceipt) {
    reasons.push("admission_bundle_receipt_drift");
  }
  if (request.currentChainFingerprint !== request.admittedChainFingerprint) {
    reasons.push("component_chain_fingerprint_drift");
  }
  if (request.requestedCapabilities.some(capability => !admitted.has(capability))) {
    reasons.push("capability_scope_expansion");
  }
  if (request.budgetConsumed > request.budgetCeiling) {
    reasons.push("existing_budget_overrun");
  } else if (projectedBudget > request.budgetCeiling) {
    reasons.push("projected_budget_overrun");
  }
  if (request.previousReplayNonces.includes(request.replayNonce)) {
    reasons.push("replay_nonce_reused");
  }
  if (request.disconnected && request.requestedSequence <= request.lastAcceptedSequence) {
    reasons.push("offline_sequence_not_monotonic");
  }

  const decision: SovereignExecutionRevalidationDecision =
    reasons.length ? "DENY" : "REVALIDATION_PASSED";
  const evidencePayload = {
    schema: SOVEREIGN_EXECUTION_REVALIDATION_SCHEMA,
    policyVersion: SOVEREIGN_EXECUTION_REVALIDATION_POLICY,
    request,
    decision,
    reasons,
    projectedBudget,
    capabilityScopePreserved: !reasons.includes("capability_scope_expansion"),
    bundleContinuityVerified: !reasons.includes("admission_bundle_receipt_drift"),
    chainContinuityVerified: !reasons.includes("component_chain_fingerprint_drift"),
    replayBoundaryVerified:
      !reasons.includes("replay_nonce_reused") &&
      !reasons.includes("offline_sequence_not_monotonic"),
    executionAllowed: false,
    executionStarted: false,
    budgetConsumedNow: false,
    agentActivated: false,
    edgeHandoffIssued: false,
    productionWriteAllowed: false,
    authorizationEffect: "none",
  };

  return {
    ...evidencePayload,
    revalidationOnly: true as const,
    executionReviewRequired: true as const,
    evidenceReceipt: createHash("sha256").update(stableJson(evidencePayload)).digest("hex"),
  };
}
