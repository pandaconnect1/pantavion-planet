/**
 * Pantavion agent work routing contract.
 * Pure, deterministic, read-only. No model calls, secrets or deployment actions.
 * An actual AI executor must be connected separately and independently verified.
 */
export const PANTAVION_AGENT_DOMAINS = [
  "kernel", "multicore", "ai-chat", "knowledge-excavation",
  "recovery", "guardian", "translation", "water", "gis",
  "telemetry", "security", "operations"
] as const;

export type PantavionAgentDomain = (typeof PANTAVION_AGENT_DOMAINS)[number];
export type AgentRisk = "read_only" | "code_proposal" | "protected_change";
export type AgentWork = Readonly<{
  id: string;
  domain: PantavionAgentDomain;
  objective: string;
  risk: AgentRisk;
  evidenceUrls: readonly string[];
}>;
export type AgentAssignment = Readonly<{
  agentId: string;
  domain: PantavionAgentDomain;
  objective: string;
  executionAllowed: false;
  requiresHumanApproval: boolean;
  requiredVerification: readonly string[];
}>;

const VERIFICATION: Record<PantavionAgentDomain, readonly string[]> = {
  kernel: ["test:sovereign-kernel-integration"],
  multicore: ["test:internal-scheduler-redundancy"],
  "ai-chat": ["audit:intelligence"],
  "knowledge-excavation": ["knowledge:excavate:v2"],
  recovery: ["test:recovery-runtime-fabric"],
  guardian: ["audit:guardian:365"],
  translation: ["audit:translation-runtime"],
  water: ["audit:water:network-lock", "test:water-engineering"],
  gis: ["audit:water:network-lock", "test:water-authentic-source-truth"],
  telemetry: ["test:water-engineering"],
  security: ["audit:protected-change", "verify:runtime-safety"],
  operations: ["audit:continuity-runtime"],
};

export function routePantavionAgentWork(work: AgentWork): AgentAssignment {
  if (!work.id.trim() || !work.objective.trim()) {
    throw new Error("Agent work requires a nonempty ID and objective");
  }
  if (!PANTAVION_AGENT_DOMAINS.includes(work.domain)) {
    throw new Error("Unknown agent domain");
  }
  if (!["read_only", "code_proposal", "protected_change"].includes(work.risk)) {
    throw new Error("Unknown risk level");
  }
  return {
    agentId: `pantavion-agent-${work.domain}`,
    domain: work.domain,
    objective: work.objective,
    executionAllowed: false,
    requiresHumanApproval: work.risk === "protected_change",
    requiredVerification: VERIFICATION[work.domain],
  };
}
