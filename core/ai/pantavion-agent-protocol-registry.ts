export type PantavionAgentProtocolId =
  | "mcp"
  | "a2a"
  | "agent_identity_capability_tokens"
  | "pantavion_internal_capability_contract";

export type PantavionAgentProtocolStatus =
  | "internal"
  | "beta"
  | "provider_required"
  | "disabled";

export interface PantavionAgentProtocolRegistryEntry {
  id: PantavionAgentProtocolId;
  label: string;
  externalName: string;
  purpose: string;
  status: PantavionAgentProtocolStatus;
  toolScope: string[];
  identityRequired: boolean;
  delegationAllowed: boolean;
  auditRequired: boolean;
  timeoutBudgetMs: number;
  errorContract: string;
  founderApprovalRequired: boolean;
  providerRequired: boolean;
  productionActionAllowed: boolean;
}

export interface PantavionAgentInvocationRequest {
  protocolId: PantavionAgentProtocolId;
  requestedAction: string;
  permissions: string[];
  mutatesUserData: boolean;
  mutatesInfrastructure: boolean;
  mutatesProduction: boolean;
  providerConfigured: boolean;
  auditLogTarget: string | null;
  founderApprovalRecorded: boolean;
}

export interface PantavionAgentInvocationDecision {
  protocolId: PantavionAgentProtocolId;
  canExecute: boolean;
  status: "allowed_internal" | "blocked";
  blockingReasons: string[];
  requiredRuntimeControls: string[];
}

export const pantavionAgentProtocolRegistryV1 = {
  id: "pantavion_agent_protocol_registry_v1",
  rule:
    "No MCP, A2A, Agent Identity, or capability token integration may execute production actions without scoped permissions, identity, audit, provider configuration, timeout, error contract, and founder approval for sensitive changes.",
  protocols: [
    {
      id: "mcp",
      label: "Pantavion MCP Connector Boundary",
      externalName: "MCP",
      purpose:
        "Connect Pantavion agents to tools through a scoped capability registry instead of exposing raw tools directly to users.",
      status: "provider_required",
      toolScope: ["read", "search", "draft", "non_destructive_execution"],
      identityRequired: true,
      delegationAllowed: true,
      auditRequired: true,
      timeoutBudgetMs: 30000,
      errorContract: "Return typed failure, provider status, and rollback requirements; never silently continue.",
      founderApprovalRequired: true,
      providerRequired: true,
      productionActionAllowed: false,
    },
    {
      id: "a2a",
      label: "Pantavion Agent-to-Agent Boundary",
      externalName: "A2A",
      purpose:
        "Allow future Pantavion agents to coordinate with other agents only through identity, delegation, and audit contracts.",
      status: "internal",
      toolScope: ["negotiate", "delegate", "status_exchange", "result_handoff"],
      identityRequired: true,
      delegationAllowed: true,
      auditRequired: true,
      timeoutBudgetMs: 45000,
      errorContract: "Return sender, receiver, delegated scope, refusal reason, and audit id.",
      founderApprovalRequired: true,
      providerRequired: true,
      productionActionAllowed: false,
    },
    {
      id: "agent_identity_capability_tokens",
      label: "Pantavion Agent Identity and Capability Token Boundary",
      externalName: "Agent Identity / capability token",
      purpose:
        "Represent invocation-bound authority for agent actions without granting broad standing permissions.",
      status: "internal",
      toolScope: ["identity_assertion", "capability_token", "delegation_provenance"],
      identityRequired: true,
      delegationAllowed: true,
      auditRequired: true,
      timeoutBudgetMs: 15000,
      errorContract: "Deny by default when token, actor, action, route, or expiry is missing.",
      founderApprovalRequired: true,
      providerRequired: false,
      productionActionAllowed: false,
    },
    {
      id: "pantavion_internal_capability_contract",
      label: "Pantavion Internal Capability Contract",
      externalName: "Pantavion Capability Contract",
      purpose:
        "Force every visible capability to declare route, logic, state/data flow, provider/data source, status, and audit gates.",
      status: "internal",
      toolScope: ["classify", "audit", "build_readiness", "founder_approval_request"],
      identityRequired: true,
      delegationAllowed: false,
      auditRequired: true,
      timeoutBudgetMs: 10000,
      errorContract: "Block fake/static/dead capabilities and return missing implementation requirements.",
      founderApprovalRequired: false,
      providerRequired: false,
      productionActionAllowed: false,
    },
  ] as PantavionAgentProtocolRegistryEntry[],
} as const;

export function getPantavionAgentProtocolById(protocolId: PantavionAgentProtocolId) {
  return pantavionAgentProtocolRegistryV1.protocols.find(
    (protocol) => protocol.id === protocolId,
  );
}

export function evaluatePantavionAgentProtocolInvocation(
  request: PantavionAgentInvocationRequest,
): PantavionAgentInvocationDecision {
  const protocol = getPantavionAgentProtocolById(request.protocolId);
  const blockingReasons: string[] = [];

  if (!protocol) {
    blockingReasons.push("Unknown agent protocol.");
  }

  if (protocol?.status === "disabled") {
    blockingReasons.push("Protocol is disabled.");
  }

  if (protocol?.providerRequired && !request.providerConfigured) {
    blockingReasons.push("Protocol provider is not configured.");
  }

  if ((protocol?.identityRequired || protocol?.delegationAllowed) && request.permissions.length === 0) {
    blockingReasons.push("Scoped permissions are required before invocation.");
  }

  if (protocol?.auditRequired && !request.auditLogTarget) {
    blockingReasons.push("Audit log target is required before invocation.");
  }

  const sensitiveMutation =
    request.mutatesUserData || request.mutatesInfrastructure || request.mutatesProduction;

  if (sensitiveMutation && !request.founderApprovalRecorded) {
    blockingReasons.push("Founder approval is required for user, infrastructure, or production mutation.");
  }

  if (request.mutatesProduction && !protocol?.productionActionAllowed) {
    blockingReasons.push("This protocol is not allowed to mutate production.");
  }

  return {
    protocolId: request.protocolId,
    canExecute: blockingReasons.length === 0,
    status: blockingReasons.length === 0 ? "allowed_internal" : "blocked",
    blockingReasons,
    requiredRuntimeControls: [
      "identity verification",
      "scoped permission check",
      "provider status check",
      "timeout budget",
      "typed error contract",
      "audit log write",
      "founder approval for sensitive changes",
    ],
  };
}
