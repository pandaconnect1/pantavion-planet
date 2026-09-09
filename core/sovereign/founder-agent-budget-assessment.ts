import { createHash } from "node:crypto";

import {
  authorizeAgentCapability,
  type AgentBudgetGrant,
  type AgentCapabilityRequest,
  type AgentCapabilityScope,
} from "./agent-capability-budget-control.ts";

export const AGENT_BUDGET_ASSESSMENT_SCHEMA = "pantavion.agent-budget.assessment.v1" as const;
export const AGENT_BUDGET_ASSESSMENT_POLICY = "agent-capability-budget-withheld-v1" as const;

const ROOT_KEYS = new Set([
  "grantId", "agentId", "intentId", "capabilities", "budgetLimit", "spent",
  "issuedAt", "expiresAt", "requestCapability", "requestScope", "requestAccess",
  "requestCost", "requestAt",
]);
const CAPABILITY_KEYS = new Set(["capability", "scope", "access"]);
const ACCESS = new Set(["read", "write"]);

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(value: UnknownRecord, allowed: Set<string>, location: string) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`invalid_agent_budget_assessment:unknown_${location}_field:${key}`);
    }
  }
}

function textValue(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") {
    throw new Error(`invalid_agent_budget_assessment:${field}_must_be_string`);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > max) {
    throw new Error(`invalid_agent_budget_assessment:${field}_length`);
  }
  return normalized;
}

function moneyValue(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1_000_000_000) {
    throw new Error(`invalid_agent_budget_assessment:${field}`);
  }
  return value;
}

function timestampValue(value: unknown, field: string): string {
  const normalized = textValue(value, field, 64);
  if (!Number.isFinite(Date.parse(normalized))) {
    throw new Error(`invalid_agent_budget_assessment:${field}`);
  }
  return normalized;
}

function accessValue(value: unknown, field: string): AgentCapabilityScope["access"] {
  if (typeof value !== "string" || !ACCESS.has(value)) {
    throw new Error(`invalid_agent_budget_assessment:${field}`);
  }
  return value as AgentCapabilityScope["access"];
}

function capabilityValue(value: unknown, index: number): AgentCapabilityScope {
  if (!isRecord(value)) throw new Error("invalid_agent_budget_assessment:capability_item");
  rejectUnknownKeys(value, CAPABILITY_KEYS, "capability");
  return {
    capability: textValue(value.capability, `capability_${index}`, 160),
    scope: textValue(value.scope, `scope_${index}`, 240),
    access: accessValue(value.access, `access_${index}`),
  };
}

export type ParsedAgentBudgetAssessment = {
  grant: AgentBudgetGrant;
  request: AgentCapabilityRequest;
};

export function parseAgentBudgetAssessment(input: unknown): ParsedAgentBudgetAssessment {
  if (!isRecord(input)) throw new Error("invalid_agent_budget_assessment:object_required");
  rejectUnknownKeys(input, ROOT_KEYS, "request");
  if (!Array.isArray(input.capabilities) || input.capabilities.length < 1 || input.capabilities.length > 20) {
    throw new Error("invalid_agent_budget_assessment:capability_count");
  }

  const issuedAt = timestampValue(input.issuedAt, "issuedAt");
  const expiresAt = timestampValue(input.expiresAt, "expiresAt");
  if (Date.parse(expiresAt) <= Date.parse(issuedAt)) {
    throw new Error("invalid_agent_budget_assessment:expiry_order");
  }

  const budgetLimit = moneyValue(input.budgetLimit, "budgetLimit");
  const spent = moneyValue(input.spent, "spent");
  const capabilities = input.capabilities.map(capabilityValue);
  const unique = new Set(capabilities.map((item) => `${item.capability}:${item.scope}`));
  if (unique.size !== capabilities.length) {
    throw new Error("invalid_agent_budget_assessment:duplicate_capability_scope");
  }

  const agentId = textValue(input.agentId, "agentId", 160);
  const intentId = textValue(input.intentId, "intentId", 160);
  return {
    grant: {
      id: textValue(input.grantId, "grantId", 160),
      agentId,
      intentId,
      state: "active",
      capabilities,
      budgetLimit,
      spent,
      issuedAt,
      expiresAt,
    },
    request: {
      agentId,
      intentId,
      capability: textValue(input.requestCapability, "requestCapability", 160),
      scope: textValue(input.requestScope, "requestScope", 240),
      access: accessValue(input.requestAccess, "requestAccess"),
      cost: moneyValue(input.requestCost, "requestCost"),
      now: timestampValue(input.requestAt, "requestAt"),
    },
  };
}

export function createFounderAgentBudgetAssessment(input: unknown) {
  const parsed = parseAgentBudgetAssessment(input);
  const decision = authorizeAgentCapability(parsed.grant, parsed.request);
  const canonical = {
    schema: AGENT_BUDGET_ASSESSMENT_SCHEMA,
    policyVersion: AGENT_BUDGET_ASSESSMENT_POLICY,
    proposedGrant: {
      id: parsed.grant.id,
      agentId: parsed.grant.agentId,
      intentId: parsed.grant.intentId,
      capabilities: parsed.grant.capabilities,
      budgetLimit: parsed.grant.budgetLimit,
      spent: parsed.grant.spent,
      issuedAt: parsed.grant.issuedAt,
      expiresAt: parsed.grant.expiresAt,
    },
    request: parsed.request,
    decision: {
      eligible: decision.allowed,
      reasons: decision.reasons,
      remainingBudget: decision.remainingBudget,
    },
    grantState: "withheld_pending_owner_admission" as const,
    assessmentOnly: true,
    executionAllowed: false,
    budgetConsumed: false,
    authorizationEffect: "none" as const,
  };
  const receiptSha256 = createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
  return { ...canonical, receiptSha256 };
}
