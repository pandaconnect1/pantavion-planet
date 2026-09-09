import { createHash } from "node:crypto";

import {
  createEphemeralAgent,
  type EphemeralAgent,
  type SwarmCapabilityGrant,
  type SwarmRole,
} from "./ephemeral-agent-swarm.ts";

export const SWARM_ADMISSION_SCHEMA = "pantavion.ephemeral-swarm.admission.v1" as const;
export const SWARM_ADMISSION_POLICY = "ephemeral-swarm-withheld-v1" as const;

const ROOT_KEYS = new Set(["intentId", "maxAgents", "maxTotalBudget", "maxLifetimeMinutes", "proposals"]);
const AGENT_KEYS = new Set(["id", "role", "budget", "createdAt", "expiresAt", "capabilities"]);
const CAPABILITY_KEYS = new Set(["capability", "scope", "readOnly", "expiresAt"]);
const ROLES = new Set<SwarmRole>(["planner", "researcher", "builder", "verifier", "security", "translator", "domain_specialist"]);
type RecordValue = Record<string, unknown>;

function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`invalid_swarm_admission:${label}_object_required`);
  return value as RecordValue;
}
function keys(value: RecordValue, allowed: Set<string>, label: string) {
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`invalid_swarm_admission:unknown_${label}_field:${key}`);
}
function text(value: unknown, label: string, max = 200): string {
  if (typeof value !== "string") throw new Error(`invalid_swarm_admission:${label}_string_required`);
  const normalized = value.trim();
  if (!normalized || normalized.length > max) throw new Error(`invalid_swarm_admission:${label}_length`);
  return normalized;
}
function finite(value: unknown, label: string, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) throw new Error(`invalid_swarm_admission:${label}`);
  return value;
}
function timestamp(value: unknown, label: string): string {
  const normalized = text(value, label, 64);
  if (!Number.isFinite(Date.parse(normalized))) throw new Error(`invalid_swarm_admission:${label}`);
  return normalized;
}
function capability(value: unknown, agentIndex: number, index: number): SwarmCapabilityGrant {
  const item = record(value, "capability");
  keys(item, CAPABILITY_KEYS, "capability");
  if (typeof item.readOnly !== "boolean") throw new Error("invalid_swarm_admission:readOnly_boolean_required");
  return {
    capability: text(item.capability, `capability_${agentIndex}_${index}`, 160),
    scope: text(item.scope, `scope_${agentIndex}_${index}`, 240),
    readOnly: item.readOnly,
    expiresAt: timestamp(item.expiresAt, `capability_expiresAt_${agentIndex}_${index}`),
  };
}

export type ParsedSwarmAdmission = {
  intentId: string;
  maxAgents: number;
  maxTotalBudget: number;
  maxLifetimeMinutes: number;
  proposals: EphemeralAgent[];
};

export function parseSwarmAdmission(input: unknown): ParsedSwarmAdmission {
  const root = record(input, "request");
  keys(root, ROOT_KEYS, "request");
  const intentId = text(root.intentId, "intentId", 160);
  const maxAgents = finite(root.maxAgents, "maxAgents", 32);
  const maxTotalBudget = finite(root.maxTotalBudget, "maxTotalBudget", 1_000_000);
  const maxLifetimeMinutes = finite(root.maxLifetimeMinutes, "maxLifetimeMinutes", 1_440);
  if (maxAgents < 1 || maxLifetimeMinutes < 1) throw new Error("invalid_swarm_admission:policy_floor");
  if (!Array.isArray(root.proposals) || root.proposals.length < 1 || root.proposals.length > 32) {
    throw new Error("invalid_swarm_admission:proposal_count");
  }

  const proposals = root.proposals.map((unknownAgent, agentIndex) => {
    const agent = record(unknownAgent, "agent");
    keys(agent, AGENT_KEYS, "agent");
    if (typeof agent.role !== "string" || !ROLES.has(agent.role as SwarmRole)) {
      throw new Error("invalid_swarm_admission:role");
    }
    if (!Array.isArray(agent.capabilities) || agent.capabilities.length < 1 || agent.capabilities.length > 20) {
      throw new Error("invalid_swarm_admission:capability_count");
    }
    const createdAt = timestamp(agent.createdAt, `createdAt_${agentIndex}`);
    const expiresAt = timestamp(agent.expiresAt, `expiresAt_${agentIndex}`);
    const capabilities = agent.capabilities.map((item, index) => capability(item, agentIndex, index));
    return createEphemeralAgent({
      id: text(agent.id, `agentId_${agentIndex}`, 160),
      parentIntentId: intentId,
      role: agent.role as SwarmRole,
      capabilities,
      budget: finite(agent.budget, `budget_${agentIndex}`, 1_000_000),
      createdAt,
      expiresAt,
    });
  });

  const ids = new Set(proposals.map((item) => item.id));
  if (ids.size !== proposals.length) throw new Error("invalid_swarm_admission:duplicate_agent_id");
  return { intentId, maxAgents, maxTotalBudget, maxLifetimeMinutes, proposals };
}

export function createFounderSwarmAdmissionAssessment(input: unknown) {
  const parsed = parseSwarmAdmission(input);
  const reasons: string[] = [];
  const totalBudget = parsed.proposals.reduce((sum, agent) => sum + agent.budget, 0);
  if (parsed.proposals.length > parsed.maxAgents) reasons.push("agent_count_exceeds_policy");
  if (totalBudget > parsed.maxTotalBudget) reasons.push("total_budget_exceeds_policy");

  for (const agent of parsed.proposals) {
    const lifetimeMinutes = (Date.parse(agent.expiresAt) - Date.parse(agent.createdAt)) / 60_000;
    if (lifetimeMinutes > parsed.maxLifetimeMinutes) reasons.push(`lifetime_exceeds_policy:${agent.id}`);
    if (agent.capabilities.some((grant) => grant.readOnly !== true)) reasons.push(`write_capability_requires_separate_owner_admission:${agent.id}`);
  }

  const canonical = {
    schema: SWARM_ADMISSION_SCHEMA,
    policyVersion: SWARM_ADMISSION_POLICY,
    intentId: parsed.intentId,
    proposalCount: parsed.proposals.length,
    totalBudget,
    proposedAgents: parsed.proposals,
    decision: { eligibleForOwnerReview: reasons.length === 0, reasons },
    swarmState: "withheld_pending_owner_admission" as const,
    assessmentOnly: true,
    agentsCreated: false,
    agentsActivated: false,
    executionAllowed: false,
    budgetConsumed: false,
    authorizationEffect: "none" as const,
  };
  return { ...canonical, receiptSha256: createHash("sha256").update(JSON.stringify(canonical)).digest("hex") };
}
