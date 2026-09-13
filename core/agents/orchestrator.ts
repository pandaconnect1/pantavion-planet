export type AgentRole =
  | "architect"
  | "code"
  | "review"
  | "security"
  | "deployment"
  | "monitoring"
  | "maps"
  | "translation"
  | "emergency"
  | "live-data";

export type AgentCapability =
  | "plan"
  | "implement"
  | "review-code"
  | "security-review"
  | "deploy"
  | "observe"
  | "geospatial"
  | "translate"
  | "continuity"
  | "verify-live-data";

export type AgentStatus = "available" | "configured" | "blocked";

export interface PantavionAgent {
  id: string;
  role: AgentRole;
  capabilities: AgentCapability[];
  provider: "internal" | "openai" | "anthropic" | "github" | "local" | "unassigned";
  status: AgentStatus;
  canWriteCode: boolean;
  canDeploy: boolean;
  requiresHumanApproval: boolean;
}

export interface OrchestratorTask {
  id: string;
  title: string;
  requiredCapabilities: AgentCapability[];
  criticality: "normal" | "sensitive" | "life-safety" | "production";
}

export interface OrchestrationPlan {
  taskId: string;
  assignedAgents: PantavionAgent[];
  missingCapabilities: AgentCapability[];
  approvals: Array<"review" | "security" | "human">;
  executable: boolean;
}

const providerConfigured = (name: string) => Boolean(process.env[name]);

export function getAgentRegistry(): PantavionAgent[] {
  return [
    { id: "architect-1", role: "architect", capabilities: ["plan"], provider: "internal", status: "available", canWriteCode: false, canDeploy: false, requiresHumanApproval: false },
    { id: "code-1", role: "code", capabilities: ["implement"], provider: providerConfigured("OPENAI_API_KEY") ? "openai" : "unassigned", status: providerConfigured("OPENAI_API_KEY") ? "configured" : "blocked", canWriteCode: true, canDeploy: false, requiresHumanApproval: false },
    { id: "review-1", role: "review", capabilities: ["review-code"], provider: providerConfigured("ANTHROPIC_API_KEY") ? "anthropic" : "internal", status: providerConfigured("ANTHROPIC_API_KEY") ? "configured" : "available", canWriteCode: false, canDeploy: false, requiresHumanApproval: false },
    { id: "security-1", role: "security", capabilities: ["security-review"], provider: "internal", status: "available", canWriteCode: false, canDeploy: false, requiresHumanApproval: false },
    { id: "deployment-1", role: "deployment", capabilities: ["deploy"], provider: providerConfigured("GITHUB_TOKEN") ? "github" : "unassigned", status: providerConfigured("GITHUB_TOKEN") ? "configured" : "blocked", canWriteCode: false, canDeploy: true, requiresHumanApproval: true },
    { id: "monitoring-1", role: "monitoring", capabilities: ["observe"], provider: "internal", status: "available", canWriteCode: false, canDeploy: false, requiresHumanApproval: false },
    { id: "maps-1", role: "maps", capabilities: ["geospatial"], provider: "internal", status: "available", canWriteCode: false, canDeploy: false, requiresHumanApproval: false },
    { id: "translation-1", role: "translation", capabilities: ["translate"], provider: "internal", status: "available", canWriteCode: false, canDeploy: false, requiresHumanApproval: false },
    { id: "emergency-1", role: "emergency", capabilities: ["continuity"], provider: "internal", status: "available", canWriteCode: false, canDeploy: false, requiresHumanApproval: true },
    { id: "live-data-1", role: "live-data", capabilities: ["verify-live-data"], provider: "internal", status: "available", canWriteCode: false, canDeploy: false, requiresHumanApproval: false }
  ];
}

export function planTask(task: OrchestratorTask): OrchestrationPlan {
  const registry = getAgentRegistry();
  const assignedAgents = registry.filter(
    (agent) => agent.status !== "blocked" && task.requiredCapabilities.some((capability) => agent.capabilities.includes(capability))
  );

  const covered = new Set(assignedAgents.flatMap((agent) => agent.capabilities));
  const missingCapabilities = task.requiredCapabilities.filter((capability) => !covered.has(capability));
  const approvals: OrchestrationPlan["approvals"] = [];

  if (task.requiredCapabilities.includes("implement")) approvals.push("review");
  if (task.criticality !== "normal") approvals.push("security");
  if (task.criticality === "life-safety" || task.criticality === "production") approvals.push("human");

  return {
    taskId: task.id,
    assignedAgents,
    missingCapabilities,
    approvals: [...new Set(approvals)],
    executable: missingCapabilities.length === 0
  };
}
