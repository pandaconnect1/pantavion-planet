export type SwarmRole = "planner" | "researcher" | "builder" | "verifier" | "security" | "translator" | "domain_specialist";
export type SwarmAgentState = "created" | "active" | "waiting" | "completed" | "revoked" | "expired";

export interface SwarmCapabilityGrant {
  capability: string;
  readOnly?: boolean;
  scope: string;
  expiresAt: string;
}

export interface EphemeralAgent {
  id: string;
  parentIntentId: string;
  role: SwarmRole;
  state: SwarmAgentState;
  capabilities: SwarmCapabilityGrant[];
  budget: number;
  createdAt: string;
  expiresAt: string;
}

function parseTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(label + " is invalid");
  return parsed;
}

export function createEphemeralAgent(input: Omit<EphemeralAgent, "state">): EphemeralAgent {
  if (!input.id.trim() || !input.parentIntentId.trim()) {
    throw new Error("agent and parent intent identities are required");
  }
  if (!Number.isFinite(input.budget) || input.budget < 0) {
    throw new Error("budget must be finite and non-negative");
  }
  if (!input.capabilities.length) throw new Error("at least one capability is required");

  const createdAt = parseTimestamp(input.createdAt, "createdAt");
  const expiresAt = parseTimestamp(input.expiresAt, "expiresAt");
  if (expiresAt <= createdAt) throw new Error("expiresAt must be after createdAt");

  const seenScopes = new Set<string>();
  for (const grant of input.capabilities) {
    if (!grant.capability.trim() || !grant.scope.trim()) {
      throw new Error("capability and scope are required");
    }
    const key = grant.capability + ":" + grant.scope;
    if (seenScopes.has(key)) throw new Error("duplicate capability scope:" + key);
    seenScopes.add(key);
    const grantExpiresAt = parseTimestamp(grant.expiresAt, "capability expiresAt");
    if (grantExpiresAt <= createdAt || grantExpiresAt > expiresAt) {
      throw new Error("capability expiry must be within the agent lifetime");
    }
  }

  return { ...input, state: "created" };
}

export function activateEphemeralAgent(agent: EphemeralAgent, now = new Date()): EphemeralAgent {
  if (agent.state !== "created" && agent.state !== "waiting") {
    throw new Error("agent cannot be activated from state:" + agent.state);
  }
  const currentTime = now.getTime();
  const createdAt = Date.parse(agent.createdAt);
  const expiresAt = Date.parse(agent.expiresAt);
  if (!Number.isFinite(currentTime) || !Number.isFinite(createdAt) || !Number.isFinite(expiresAt)) {
    throw new Error("agent activation time is invalid");
  }
  if (currentTime < createdAt || currentTime >= expiresAt) {
    throw new Error("agent is outside its authorized lifetime");
  }
  return { ...agent, state: "active" };
}

export function canAgentUseCapability(
  agent: EphemeralAgent,
  capability: string,
  scope: string,
  now = new Date(),
): boolean {
  if (agent.state !== "active" || !capability.trim() || !scope.trim()) return false;
  const currentTime = now.getTime();
  const agentExpiresAt = Date.parse(agent.expiresAt);
  if (!Number.isFinite(currentTime) || !Number.isFinite(agentExpiresAt) || agentExpiresAt <= currentTime) {
    return false;
  }
  return agent.capabilities.some((grant) => {
    const grantExpiresAt = Date.parse(grant.expiresAt);
    return (
      grant.capability === capability &&
      grant.scope === scope &&
      Number.isFinite(grantExpiresAt) &&
      grantExpiresAt > currentTime &&
      grantExpiresAt <= agentExpiresAt
    );
  });
}

export function revokeEphemeralAgent(agent: EphemeralAgent): EphemeralAgent {
  return { ...agent, state: "revoked" };
}
