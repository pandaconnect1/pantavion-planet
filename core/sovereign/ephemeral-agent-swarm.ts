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

export function createEphemeralAgent(input: Omit<EphemeralAgent, "state">): EphemeralAgent {
  if (input.budget < 0) throw new Error("budget must be non-negative");
  if (!input.capabilities.length) throw new Error("at least one capability is required");
  if (new Date(input.expiresAt).getTime() <= new Date(input.createdAt).getTime()) {
    throw new Error("expiresAt must be after createdAt");
  }
  return { ...input, state: "created" };
}

export function canAgentUseCapability(agent: EphemeralAgent, capability: string, scope: string, now = new Date()): boolean {
  if (["revoked", "expired", "completed"].includes(agent.state)) return false;
  if (new Date(agent.expiresAt).getTime() <= now.getTime()) return false;
  return agent.capabilities.some((grant) =>
    grant.capability === capability &&
    grant.scope === scope &&
    new Date(grant.expiresAt).getTime() > now.getTime()
  );
}

export function revokeEphemeralAgent(agent: EphemeralAgent): EphemeralAgent {
  return { ...agent, state: "revoked" };
}
