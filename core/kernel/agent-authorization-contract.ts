import type {
  PantavionApprovalMode,
  PantavionCapabilityStatus,
  PantavionIdentityScope,
  PantavionPermissionLevel,
  PantavionSensitivity,
} from "./capability-broker-contract";

export type PantavionAgentRuntimeMode =
  | "observe_only"
  | "draft_only"
  | "human_approved_execution"
  | "founder_approved_execution";

export interface PantavionResourceScope {
  readonly resourceType:
    | "repo"
    | "route"
    | "database"
    | "blob_storage"
    | "water_infrastructure"
    | "sos"
    | "user_access"
    | "legal"
    | "provider"
    | "workspace"
    | "unknown";
  readonly allowedPaths?: readonly string[];
  readonly deniedPaths?: readonly string[];
  readonly allowedOperations: readonly PantavionPermissionLevel[];
}

export interface PantavionAgentAuthorizationContract {
  readonly agentId: string;
  readonly title: string;
  readonly status: PantavionCapabilityStatus;
  readonly runtimeMode: PantavionAgentRuntimeMode;
  readonly actor: PantavionIdentityScope["role"];
  readonly allowedCapabilities: readonly string[];
  readonly forbiddenCapabilities: readonly string[];
  readonly resourceScopes: readonly PantavionResourceScope[];
  readonly approvalMode: PantavionApprovalMode;
  readonly sensitivity: PantavionSensitivity;
  readonly auditRequired: boolean;
  readonly expiresAtIso?: string;
  readonly notes: string;
}

export interface PantavionAgentAuthorizationDecision {
  readonly allowed: boolean;
  readonly reason: string;
  readonly founderActionRequired: boolean;
}

export const PANTAVION_GUARDIAN_AGENT_CONTRACT: PantavionAgentAuthorizationContract = {
  agentId: "guardian.kernel",
  title: "Pantavion Guardian Kernel",
  status: "internal",
  runtimeMode: "human_approved_execution",
  actor: "system",
  allowedCapabilities: [
    "repo.inspect",
    "repo.diff_summarize",
    "repo.propose_patch",
    "runtime.audit",
    "runtime.safety_gate",
  ],
  forbiddenCapabilities: [
    "production.deploy_without_founder_approval",
    "users.delete",
    "access.reset",
    "water.source_modify",
    "dwg.transform_original",
    "secrets.read_raw",
    "billing.execute",
  ],
  resourceScopes: [
    {
      resourceType: "repo",
      allowedPaths: ["core/", "scripts/", "docs/", "app/"],
      deniedPaths: [".env", "data/water-network-private/", "public/"],
      allowedOperations: ["read", "draft"],
    },
    {
      resourceType: "water_infrastructure",
      deniedPaths: ["data/water-network-private/", "public/"],
      allowedOperations: ["read"],
    },
    {
      resourceType: "user_access",
      allowedOperations: ["read"],
    },
  ],
  approvalMode: "founder_approval_required",
  sensitivity: "production_deploy",
  auditRequired: true,
  notes:
    "Guardian may observe, compare, propose and report. It must not alter sensitive data, users, access, water source files, production or legal state without explicit founder approval.",
};

export function evaluateAgentAuthorization(
  contract: PantavionAgentAuthorizationContract,
  capabilityId: string,
  permission: PantavionPermissionLevel,
): PantavionAgentAuthorizationDecision {
  if (contract.status === "disabled") {
    return {
      allowed: false,
      reason: "Agent contract is disabled.",
      founderActionRequired: false,
    };
  }

  if (contract.forbiddenCapabilities.includes(capabilityId)) {
    return {
      allowed: false,
      reason: "Capability is explicitly forbidden for this agent.",
      founderActionRequired: true,
    };
  }

  if (!contract.allowedCapabilities.includes(capabilityId)) {
    return {
      allowed: false,
      reason: "Capability is not in the agent allowlist.",
      founderActionRequired: true,
    };
  }

  const permissionAllowed = contract.resourceScopes.some((scope) =>
    scope.allowedOperations.includes(permission),
  );

  if (!permissionAllowed) {
    return {
      allowed: false,
      reason: "Requested permission is outside the agent resource scope.",
      founderActionRequired: true,
    };
  }

  if (
    contract.runtimeMode === "founder_approved_execution" ||
    contract.approvalMode === "founder_approval_required"
  ) {
    return {
      allowed: false,
      reason: "Founder approval is required before execution.",
      founderActionRequired: true,
    };
  }

  return {
    allowed: true,
    reason: "Agent authorization contract allows this request.",
    founderActionRequired: false,
  };
}
