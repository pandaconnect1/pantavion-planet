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
  agentId: string;
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

function parseTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(label + " is invalid");
  return parsed;
}

export function createAgentBudgetGrant(
  input: Omit<AgentBudgetGrant, "state" | "spent">,
): AgentBudgetGrant {
  if (!input.id.trim() || !input.agentId.trim() || !input.intentId.trim()) {
    throw new Error("grant, agent and intent identities are required");
  }
  if (!input.capabilities.length) throw new Error("at least one capability scope is required");
  if (!Number.isFinite(input.budgetLimit) || input.budgetLimit < 0) {
    throw new Error("budgetLimit must be finite and non-negative");
  }

  const issuedAt = parseTimestamp(input.issuedAt, "issuedAt");
  const expiresAt = parseTimestamp(input.expiresAt, "expiresAt");
  if (expiresAt <= issuedAt) throw new Error("expiresAt must be after issuedAt");

  const seenScopes = new Set<string>();
  for (const capability of input.capabilities) {
    if (!capability.capability.trim() || !capability.scope.trim()) {
      throw new Error("capability and scope are required");
    }
    const key = capability.capability + ":" + capability.scope;
    if (seenScopes.has(key)) throw new Error("duplicate capability scope:" + key);
    seenScopes.add(key);
  }

  return { ...input, state: "active", spent: 0 };
}

export function authorizeAgentCapability(
  grant: AgentBudgetGrant,
  request: AgentCapabilityRequest,
): AgentAuthorizationDecision {
  const reasons: string[] = [];
  const now = Date.parse(request.now);
  const issuedAt = Date.parse(grant.issuedAt);
  const expiresAt = Date.parse(grant.expiresAt);
  const validBudget = Number.isFinite(grant.budgetLimit) && grant.budgetLimit >= 0;
  const validSpend =
    Number.isFinite(grant.spent) &&
    grant.spent >= 0 &&
    validBudget &&
    grant.spent <= grant.budgetLimit;
  const remainingBudget = validBudget && validSpend
    ? Math.max(0, grant.budgetLimit - grant.spent)
    : 0;

  if (!grant.id.trim() || !grant.agentId.trim() || !grant.intentId.trim()) reasons.push("grant_identity_invalid");
  if (grant.state !== "active") reasons.push("grant_" + grant.state);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt) {
    reasons.push("grant_time_invalid");
  }
  if (!Number.isFinite(now)) reasons.push("invalid_request_time");
  else {
    if (Number.isFinite(issuedAt) && now < issuedAt) reasons.push("grant_not_yet_active");
    if (Number.isFinite(expiresAt) && expiresAt <= now) reasons.push("grant_expired");
  }
  if (!validBudget) reasons.push("grant_budget_invalid");
  if (!validSpend) reasons.push("grant_spend_invalid");
  if (!request.agentId.trim() || request.agentId !== grant.agentId) reasons.push("agent_scope_mismatch");
  if (!request.intentId.trim() || request.intentId !== grant.intentId) reasons.push("intent_scope_mismatch");
  if (!request.capability.trim() || !request.scope.trim()) reasons.push("capability_request_invalid");
  if (!Number.isFinite(request.cost) || request.cost < 0) reasons.push("invalid_cost");

  const scoped = grant.capabilities.find(
    (candidate) =>
      candidate.capability === request.capability &&
      candidate.scope === request.scope,
  );
  if (!scoped) reasons.push("capability_or_scope_not_granted");
  else if (request.access === "write" && scoped.access !== "write") reasons.push("write_not_granted");

  if (Number.isFinite(request.cost) && request.cost >= 0 && request.cost > remainingBudget) {
    reasons.push("budget_exceeded");
  }

  return { allowed: reasons.length === 0, reasons: [...new Set(reasons)], remainingBudget };
}

export function consumeAuthorizedBudget(
  grant: AgentBudgetGrant,
  request: AgentCapabilityRequest,
): AgentBudgetGrant {
  const decision = authorizeAgentCapability(grant, request);
  if (!decision.allowed) throw new Error("agent authorization denied:" + decision.reasons.join(","));
  return { ...grant, spent: grant.spent + request.cost };
}

export function revokeAgentBudgetGrant(grant: AgentBudgetGrant): AgentBudgetGrant {
  return { ...grant, state: "revoked" };
}
