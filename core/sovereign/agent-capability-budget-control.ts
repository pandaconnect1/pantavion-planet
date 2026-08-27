export type CapabilityAccess = "read" | "write";
export type AgentGrantState = "active" | "revoked" | "expired";

export interface AgentCapabilityScope {
  capability: string;
  scope: string;
  access: CapabilityAccess;
}

export interface AgentBudgetGrant {
  id: string;
  agentId: string;
  intentId: string;
  state: AgentGrantState;
  capabilities: AgentCapabilityScope[];
  budgetLimit: number;
  spent: number;
  issuedAt: string;
  expiresAt: string;
}

export interface AgentCapabilityRequest {
  intentId: string;
  capability: string;
  scope: string;
  access: CapabilityAccess;
  cost: number;
  now: string;
}

export interface AgentAuthorizationDecision {
  allowed: boolean;
  reasons: string[];
  remainingBudget: number;
}

export function createAgentBudgetGrant(
  input: Omit<AgentBudgetGrant, "state" | "spent">,
): AgentBudgetGrant {
  if (!input.id.trim() || !input.agentId.trim() || !input.intentId.trim()) {
    throw new Error("grant, agent and intent identities are required");
  }
  if (!input.capabilities.length) throw new Error("at least one capability scope is required");
  if (!Number.isFinite(input.budgetLimit) || input.budgetLimit < 0) {
    throw new Error("budgetLimit must be non-negative");
  }
  if (Date.parse(input.expiresAt) <= Date.parse(input.issuedAt)) {
    throw new Error("expiresAt must be after issuedAt");
  }
  return { ...input, state: "active", spent: 0 };
}

export function authorizeAgentCapability(
  grant: AgentBudgetGrant,
  request: AgentCapabilityRequest,
): AgentAuthorizationDecision {
  const reasons: string[] = [];
  const now = Date.parse(request.now);

  if (grant.state !== "active") reasons.push(`grant_${grant.state}`);
  if (!Number.isFinite(now)) reasons.push("invalid_request_time");
  if (Date.parse(grant.expiresAt) <= now) reasons.push("grant_expired");
  if (request.intentId !== grant.intentId) reasons.push("intent_scope_mismatch");
  if (!Number.isFinite(request.cost) || request.cost < 0) reasons.push("invalid_cost");

  const scoped = grant.capabilities.find(
    (candidate) =>
      candidate.capability === request.capability &&
      candidate.scope === request.scope,
  );
  if (!scoped) reasons.push("capability_or_scope_not_granted");
  else if (request.access === "write" && scoped.access !== "write") reasons.push("write_not_granted");

  const remainingBudget = Math.max(0, grant.budgetLimit - grant.spent);
  if (Number.isFinite(request.cost) && request.cost > remainingBudget) {
    reasons.push("budget_exceeded");
  }

  return { allowed: reasons.length === 0, reasons, remainingBudget };
}

export function consumeAuthorizedBudget(
  grant: AgentBudgetGrant,
  request: AgentCapabilityRequest,
): AgentBudgetGrant {
  const decision = authorizeAgentCapability(grant, request);
  if (!decision.allowed) throw new Error(`agent authorization denied:${decision.reasons.join(",")}`);
  return { ...grant, spent: grant.spent + request.cost };
}

export function revokeAgentBudgetGrant(grant: AgentBudgetGrant): AgentBudgetGrant {
  return { ...grant, state: "revoked" };
}
