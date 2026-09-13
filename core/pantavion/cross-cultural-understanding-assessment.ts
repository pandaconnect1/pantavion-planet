import { createHash } from "node:crypto";

export type UnderstandingSignal = "UNDERSTOOD" | "PARTIAL" | "NOT_UNDERSTOOD" | "DECLINED";
export type JurisdictionDecision = "ADMIT" | "OWNER_REVIEW" | "DENY";
export type SafetySignal = "NONE" | "POTENTIAL_HARM" | "IMMINENT_HARM";
export type UnderstandingDecision = "DENY" | "OWNER_APPROVAL_REQUIRED" | "UNDERSTOOD" | "REPAIR_REQUIRED";

export type CrossCulturalUnderstandingInput = {
  messageId: string;
  originalMessageDigest: string;
  translationReceipt: string;
  senderIntent: string;
  sourceLanguage: string;
  targetLanguage: string;
  culturalContext: string;
  recipientAgeBand: "CHILD" | "TEEN" | "ADULT" | "VERIFIED_ADULT";
  jurisdiction: string;
  jurisdictionDecision: JurisdictionDecision;
  consentToUnderstandingCheck: boolean;
  understandingSignal: UnderstandingSignal;
  recipientMeaningSummary: string;
  meaningDeviationScore: number;
  safetySignal: SafetySignal;
};

export type CrossCulturalUnderstandingPolicy = {
  policyVersion: string;
  maximumDeviationForUnderstanding: number;
  requireOwnerReviewForMinors: boolean;
  maximumTextLength: number;
};

export type CrossCulturalUnderstandingAssessment = {
  decision: UnderstandingDecision;
  reasons: string[];
  repairDirective: null | {
    preserveOriginalIntent: true;
    maximumAttempts: 1;
    mode: "CLARIFY_WITHOUT_AUTHORITY_EXPANSION";
  };
  evidenceReceipt: string;
  assessmentOnly: true;
  understandingVerified: boolean;
  messageDelivered: false;
  repairExecuted: false;
  executionAllowed: false;
  productionWriteAllowed: false;
  authorizationEffect: "none";
};

export const DEFAULT_CROSS_CULTURAL_UNDERSTANDING_POLICY: CrossCulturalUnderstandingPolicy = {
  policyVersion: "pantavion-understanding-v1",
  maximumDeviationForUnderstanding: 0.2,
  requireOwnerReviewForMinors: true,
  maximumTextLength: 2048,
};

const INPUT_FIELDS = [
  "messageId", "originalMessageDigest", "translationReceipt", "senderIntent",
  "sourceLanguage", "targetLanguage", "culturalContext", "recipientAgeBand",
  "jurisdiction", "jurisdictionDecision", "consentToUnderstandingCheck",
  "understandingSignal", "recipientMeaningSummary", "meaningDeviationScore", "safetySignal",
] as const;
const POLICY_FIELDS = [
  "policyVersion", "maximumDeviationForUnderstanding", "requireOwnerReviewForMinors", "maximumTextLength",
] as const;
const AGE_BANDS = ["CHILD", "TEEN", "ADULT", "VERIFIED_ADULT"] as const;
const JURISDICTION_DECISIONS = ["ADMIT", "OWNER_REVIEW", "DENY"] as const;
const UNDERSTANDING_SIGNALS = ["UNDERSTOOD", "PARTIAL", "NOT_UNDERSTOOD", "DECLINED"] as const;
const SAFETY_SIGNALS = ["NONE", "POTENTIAL_HARM", "IMMINENT_HARM"] as const;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const digestPattern = /^[a-f0-9]{64}$/;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return "{" + Object.keys(record).sort().map(key => JSON.stringify(key) + ":" + canonical(record[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(name + "_object_required");
  return value as Record<string, unknown>;
}

function rejectUnknownFields(value: Record<string, unknown>, allowed: readonly string[], name: string) {
  const unknown = Object.keys(value).filter(key => !allowed.includes(key));
  if (unknown.length) throw new Error(name + "_unknown_field:" + unknown.sort().join(","));
}

function text(value: unknown, name: string): string {
  if (typeof value !== "string") throw new Error(name + "_string_required");
  return value;
}

function bool(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") throw new Error(name + "_boolean_required");
  return value;
}

function number(value: unknown, name: string): number {
  if (typeof value !== "number") throw new Error(name + "_number_required");
  return value;
}

function oneOf<T extends string>(value: unknown, choices: readonly T[], name: string): T {
  if (typeof value !== "string" || !choices.includes(value as T)) throw new Error("invalid_" + name);
  return value as T;
}

export function normalizeCrossCulturalUnderstandingInput(value: unknown): CrossCulturalUnderstandingInput {
  const input = record(value, "input");
  rejectUnknownFields(input, INPUT_FIELDS, "input");
  return {
    messageId: text(input.messageId, "message_id"),
    originalMessageDigest: text(input.originalMessageDigest, "original_message_digest"),
    translationReceipt: text(input.translationReceipt, "translation_receipt"),
    senderIntent: text(input.senderIntent, "sender_intent"),
    sourceLanguage: text(input.sourceLanguage, "source_language"),
    targetLanguage: text(input.targetLanguage, "target_language"),
    culturalContext: text(input.culturalContext, "cultural_context"),
    recipientAgeBand: oneOf(input.recipientAgeBand, AGE_BANDS, "recipient_age_band"),
    jurisdiction: text(input.jurisdiction, "jurisdiction"),
    jurisdictionDecision: oneOf(input.jurisdictionDecision, JURISDICTION_DECISIONS, "jurisdiction_decision"),
    consentToUnderstandingCheck: bool(input.consentToUnderstandingCheck, "consent"),
    understandingSignal: oneOf(input.understandingSignal, UNDERSTANDING_SIGNALS, "understanding_signal"),
    recipientMeaningSummary: text(input.recipientMeaningSummary, "recipient_meaning_summary"),
    meaningDeviationScore: number(input.meaningDeviationScore, "meaning_deviation"),
    safetySignal: oneOf(input.safetySignal, SAFETY_SIGNALS, "safety_signal"),
  };
}

export function normalizeCrossCulturalUnderstandingPolicy(value: unknown): CrossCulturalUnderstandingPolicy {
  const policy = record(value, "policy");
  rejectUnknownFields(policy, POLICY_FIELDS, "policy");
  return {
    policyVersion: text(policy.policyVersion, "policy_version"),
    maximumDeviationForUnderstanding: number(policy.maximumDeviationForUnderstanding, "deviation_threshold"),
    requireOwnerReviewForMinors: bool(policy.requireOwnerReviewForMinors, "minor_review"),
    maximumTextLength: number(policy.maximumTextLength, "text_bound"),
  };
}

function requireBoundedText(name: string, value: string, maximum: number) {
  if (!value.trim()) throw new Error(name + "_required");
  if (value.length > maximum) throw new Error(name + "_too_long");
}

export function assessCrossCulturalUnderstanding(
  rawInput: unknown,
  rawPolicy: unknown = DEFAULT_CROSS_CULTURAL_UNDERSTANDING_POLICY,
): CrossCulturalUnderstandingAssessment {
  const input = normalizeCrossCulturalUnderstandingInput(rawInput);
  const policy = normalizeCrossCulturalUnderstandingPolicy(rawPolicy);
  if (!Number.isFinite(policy.maximumDeviationForUnderstanding) || policy.maximumDeviationForUnderstanding < 0 || policy.maximumDeviationForUnderstanding > 1) {
    throw new Error("invalid_deviation_threshold");
  }
  if (!Number.isInteger(policy.maximumTextLength) || policy.maximumTextLength < 64 || policy.maximumTextLength > 16_384) {
    throw new Error("invalid_text_bound");
  }
  requireBoundedText("policy_version", policy.policyVersion, 128);
  requireBoundedText("message_id", input.messageId, 256);
  for (const [name, value] of [
    ["sender_intent", input.senderIntent],
    ["source_language", input.sourceLanguage],
    ["target_language", input.targetLanguage],
    ["cultural_context", input.culturalContext],
    ["jurisdiction", input.jurisdiction],
  ] as const) requireBoundedText(name, value, policy.maximumTextLength);
  if (!digestPattern.test(input.originalMessageDigest)) throw new Error("invalid_original_digest");
  if (!digestPattern.test(input.translationReceipt)) throw new Error("invalid_translation_receipt");
  if (!Number.isFinite(input.meaningDeviationScore) || input.meaningDeviationScore < 0 || input.meaningDeviationScore > 1) {
    throw new Error("invalid_meaning_deviation");
  }
  if (input.understandingSignal !== "DECLINED") {
    requireBoundedText("recipient_meaning_summary", input.recipientMeaningSummary, policy.maximumTextLength);
  } else if (input.recipientMeaningSummary.length > policy.maximumTextLength) {
    throw new Error("recipient_meaning_summary_too_long");
  }

  const reasons: string[] = [];
  let decision: UnderstandingDecision;
  const isMinor = input.recipientAgeBand === "CHILD" || input.recipientAgeBand === "TEEN";

  if (!input.consentToUnderstandingCheck || input.understandingSignal === "DECLINED") {
    decision = "DENY";
    reasons.push("recipient_consent_absent");
  } else if (input.jurisdictionDecision === "DENY") {
    decision = "DENY";
    reasons.push("jurisdiction_denied");
  } else if (input.safetySignal === "IMMINENT_HARM") {
    decision = "DENY";
    reasons.push("imminent_harm_escalation_required");
  } else if (
    input.jurisdictionDecision === "OWNER_REVIEW" ||
    input.safetySignal === "POTENTIAL_HARM" ||
    (isMinor && policy.requireOwnerReviewForMinors)
  ) {
    decision = "OWNER_APPROVAL_REQUIRED";
    if (input.jurisdictionDecision === "OWNER_REVIEW") reasons.push("jurisdiction_owner_review");
    if (input.safetySignal === "POTENTIAL_HARM") reasons.push("potential_harm_owner_review");
    if (isMinor && policy.requireOwnerReviewForMinors) reasons.push("minor_owner_review");
  } else if (
    input.understandingSignal === "UNDERSTOOD" &&
    input.meaningDeviationScore <= policy.maximumDeviationForUnderstanding
  ) {
    decision = "UNDERSTOOD";
    reasons.push("recipient_understanding_within_threshold");
  } else {
    decision = "REPAIR_REQUIRED";
    if (input.understandingSignal !== "UNDERSTOOD") reasons.push("recipient_reports_incomplete_understanding");
    if (input.meaningDeviationScore > policy.maximumDeviationForUnderstanding) reasons.push("meaning_deviation_above_threshold");
  }

  const understandingVerified = decision === "UNDERSTOOD";
  const repairDirective = decision === "REPAIR_REQUIRED" ? {
    preserveOriginalIntent: true as const,
    maximumAttempts: 1 as const,
    mode: "CLARIFY_WITHOUT_AUTHORITY_EXPANSION" as const,
  } : null;
  const evidenceReceipt = sha256(canonical({ input, policy, decision, reasons, repairDirective, understandingVerified }));

  return {
    decision,
    reasons,
    repairDirective,
    evidenceReceipt,
    assessmentOnly: true,
    understandingVerified,
    messageDelivered: false,
    repairExecuted: false,
    executionAllowed: false,
    productionWriteAllowed: false,
    authorizationEffect: "none",
  };
}
