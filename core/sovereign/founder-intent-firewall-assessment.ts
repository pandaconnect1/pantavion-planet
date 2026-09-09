import { createHash } from "node:crypto";
import {
  evaluateIntentFirewall,
  type IntentDataClass,
  type IntentFirewallDecision,
  type IntentFirewallPolicy,
  type IntentFirewallRequest,
  type IntentRisk,
} from "./intent-firewall.ts";

export const FOUNDER_INTENT_FIREWALL_SCHEMA = "pantavion.founder-intent-firewall-assessment.v1";
export const FOUNDER_INTENT_FIREWALL_POLICY_VERSION = "founder-read-only-v1";

const actorKinds = new Set<IntentFirewallRequest["actorKind"]>([
  "founder",
  "authenticated_user",
  "system_agent",
]);
const dataClasses = new Set<IntentDataClass>(["public", "private", "sensitive", "regulated"]);
const risks = new Set<IntentRisk>(["low", "medium", "high", "critical"]);
const requestKeys = new Set([
  "intentId",
  "actorId",
  "actorKind",
  "jurisdiction",
  "capabilities",
  "dataClasses",
  "estimatedCost",
  "risk",
  "reversible",
  "legalConsentRecorded",
  "writesProduction",
  "publishesToUsers",
  "sendsExternalMessage",
  "changesIdentityOrAccess",
]);

export type FounderIntentFirewallAssessment = {
  schema: typeof FOUNDER_INTENT_FIREWALL_SCHEMA;
  policyVersion: typeof FOUNDER_INTENT_FIREWALL_POLICY_VERSION;
  assessmentOnly: true;
  executionAllowed: false;
  request: IntentFirewallRequest;
  decision: IntentFirewallDecision;
  receiptSha256: string;
};

function fail(field: string): never {
  throw new Error(`invalid_intent_firewall_request:${field}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value: unknown, field: string, maximumLength: number) {
  if (typeof value !== "string") fail(field);
  const normalized = value.trim();
  if (!normalized || normalized.length > maximumLength) fail(field);
  return normalized;
}

function boundedStringList(value: unknown, field: string) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 32) fail(field);
  const normalized = value.map((entry) => boundedString(entry, field, 120));
  if (new Set(normalized).size !== normalized.length) fail(field);
  return normalized;
}

function requiredBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") fail(field);
  return value;
}

export function normalizeFounderIntentFirewallRequest(input: unknown): IntentFirewallRequest {
  if (!isRecord(input)) fail("body");
  if (Object.keys(input).some((key) => !requestKeys.has(key))) fail("unknown_field");

  const actorKind = boundedString(input.actorKind, "actorKind", 40);
  if (!actorKinds.has(actorKind as IntentFirewallRequest["actorKind"])) fail("actorKind");

  const normalizedDataClasses = boundedStringList(input.dataClasses, "dataClasses");
  if (normalizedDataClasses.some((value) => !dataClasses.has(value as IntentDataClass))) {
    fail("dataClasses");
  }

  const risk = boundedString(input.risk, "risk", 20);
  if (!risks.has(risk as IntentRisk)) fail("risk");

  if (
    typeof input.estimatedCost !== "number" ||
    !Number.isFinite(input.estimatedCost) ||
    input.estimatedCost < 0 ||
    input.estimatedCost > 1_000_000_000
  ) {
    fail("estimatedCost");
  }

  const jurisdiction =
    input.jurisdiction === undefined
      ? undefined
      : boundedString(input.jurisdiction, "jurisdiction", 80).toUpperCase();

  return {
    intentId: boundedString(input.intentId, "intentId", 160),
    actorId: boundedString(input.actorId, "actorId", 160),
    actorKind: actorKind as IntentFirewallRequest["actorKind"],
    ...(jurisdiction ? { jurisdiction } : {}),
    capabilities: boundedStringList(input.capabilities, "capabilities"),
    dataClasses: normalizedDataClasses as IntentDataClass[],
    estimatedCost: input.estimatedCost,
    risk: risk as IntentRisk,
    reversible: requiredBoolean(input.reversible, "reversible"),
    legalConsentRecorded: requiredBoolean(input.legalConsentRecorded, "legalConsentRecorded"),
    writesProduction: requiredBoolean(input.writesProduction, "writesProduction"),
    publishesToUsers: requiredBoolean(input.publishesToUsers, "publishesToUsers"),
    sendsExternalMessage: requiredBoolean(input.sendsExternalMessage, "sendsExternalMessage"),
    changesIdentityOrAccess: requiredBoolean(
      input.changesIdentityOrAccess,
      "changesIdentityOrAccess",
    ),
  };
}

function founderReadOnlyPolicy(): IntentFirewallPolicy {
  return {
    allowedJurisdictions: [],
    automaticCapabilities: [
      "read_repository",
      "read_status",
      "verify_evidence",
      "generate_plan",
      "classify_recovered_material",
    ],
    maximumAutomaticCost: 0,
    ownerApprovalRisks: ["medium", "high", "critical"],
    requireConsentForSensitiveData: true,
    productionMutationMode: "deny",
    publicExposureMode: "deny",
  };
}

export function createFounderIntentFirewallAssessment(
  input: unknown,
): FounderIntentFirewallAssessment {
  const request = normalizeFounderIntentFirewallRequest(input);
  const decision = evaluateIntentFirewall(request, founderReadOnlyPolicy());
  const receiptPayload = {
    schema: FOUNDER_INTENT_FIREWALL_SCHEMA,
    policyVersion: FOUNDER_INTENT_FIREWALL_POLICY_VERSION,
    request,
    decision,
    assessmentOnly: true,
    executionAllowed: false,
  };
  const receiptSha256 = createHash("sha256")
    .update(JSON.stringify(receiptPayload), "utf8")
    .digest("hex");

  return {
    schema: FOUNDER_INTENT_FIREWALL_SCHEMA,
    policyVersion: FOUNDER_INTENT_FIREWALL_POLICY_VERSION,
    assessmentOnly: true,
    executionAllowed: false,
    request,
    decision,
    receiptSha256,
  };
}
