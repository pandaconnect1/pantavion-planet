export type PantavionCapabilityStatus =
  | "enabled"
  | "disabled"
  | "beta"
  | "internal";

export type PantavionPermissionLevel =
  | "read"
  | "draft"
  | "execute"
  | "write"
  | "delete"
  | "admin";

export type PantavionSensitivity =
  | "normal"
  | "personal_data"
  | "minor_or_vulnerable_user"
  | "sos_or_safety"
  | "legal_or_privacy"
  | "water_or_private_infrastructure"
  | "provider_credentials"
  | "billing_or_compliance"
  | "production_deploy"
  | "data_migration_or_deletion";

export type PantavionApprovalMode =
  | "none"
  | "user_confirm"
  | "guardian_confirm"
  | "founder_approval_required";

export type PantavionRollbackPolicy =
  | "not_applicable"
  | "manual"
  | "automatic_if_supported"
  | "backup_required_before_execution"
  | "forbidden_without_restore_plan";

export interface PantavionIdentityScope {
  readonly userId?: string;
  readonly globalUserId?: string;
  readonly deviceId?: string;
  readonly sessionId?: string;
  readonly role:
    | "anonymous"
    | "user"
    | "guardian"
    | "field_user"
    | "admin"
    | "founder"
    | "system";
}

export interface PantavionExecutionBudget {
  readonly timeoutMs: number;
  readonly maxProviderCostEur?: number;
  readonly maxTokens?: number;
  readonly maxToolCalls?: number;
  readonly maxRetries: number;
}

export interface PantavionCapabilityAuditEvent {
  readonly eventId: string;
  readonly timestampIso: string;
  readonly capabilityId: string;
  readonly actorRole: PantavionIdentityScope["role"];
  readonly action: string;
  readonly sensitivity: PantavionSensitivity;
  readonly status:
    | "requested"
    | "blocked"
    | "approved"
    | "executed"
    | "failed"
    | "rolled_back";
  readonly reason?: string;
}

export interface PantavionStructuredError {
  readonly code:
    | "CAPABILITY_DISABLED"
    | "CAPABILITY_BETA_INTERNAL_ONLY"
    | "MISSING_PROVIDER"
    | "MISSING_ROUTE"
    | "MISSING_STATE_FLOW"
    | "PERMISSION_DENIED"
    | "FOUNDER_APPROVAL_REQUIRED"
    | "TIMEOUT_BUDGET_EXCEEDED"
    | "COST_BUDGET_EXCEEDED"
    | "UNSAFE_SENSITIVITY"
    | "ROLLBACK_REQUIRED"
    | "UNKNOWN_ERROR";
  readonly message: string;
  readonly retryable: boolean;
  readonly founderActionRequired: boolean;
}

export interface PantavionCapabilityContract {
  readonly id: string;
  readonly title: string;
  readonly status: PantavionCapabilityStatus;
  readonly route?: string;
  readonly providerAdapterId?: string;
  readonly requiredStateFlow:
    | "none"
    | "local_state"
    | "server_session"
    | "database_record"
    | "provider_session"
    | "offline_queue";
  readonly permissions: readonly PantavionPermissionLevel[];
  readonly sensitivity: PantavionSensitivity;
  readonly approvalMode: PantavionApprovalMode;
  readonly rollbackPolicy: PantavionRollbackPolicy;
  readonly budget: PantavionExecutionBudget;
  readonly auditRequired: boolean;
  readonly visibleInUi: boolean;
  readonly implementationNotes: string;
}

export interface PantavionCapabilityRequest {
  readonly capabilityId: string;
  readonly identity: PantavionIdentityScope;
  readonly requestedPermission: PantavionPermissionLevel;
  readonly inputSummary: string;
  readonly founderApprovalToken?: string;
}

export interface PantavionCapabilityDecision {
  readonly allowed: boolean;
  readonly capabilityId: string;
  readonly approvalMode: PantavionApprovalMode;
  readonly auditEvent: PantavionCapabilityAuditEvent;
  readonly error?: PantavionStructuredError;
}

export const PANTAVION_FOUNDER_APPROVAL_SENSITIVITIES: readonly PantavionSensitivity[] = [
  "minor_or_vulnerable_user",
  "sos_or_safety",
  "legal_or_privacy",
  "water_or_private_infrastructure",
  "provider_credentials",
  "billing_or_compliance",
  "production_deploy",
  "data_migration_or_deletion",
] as const;

export const PANTAVION_DEFAULT_EXECUTION_BUDGET: PantavionExecutionBudget = {
  timeoutMs: 30000,
  maxProviderCostEur: 0,
  maxTokens: 0,
  maxToolCalls: 0,
  maxRetries: 0,
};

export const PANTAVION_CORE_CAPABILITY_CONTRACTS: readonly PantavionCapabilityContract[] = [
  {
    id: "runtime.safety_gate",
    title: "Pantavion Runtime Safety Gate",
    status: "enabled",
    requiredStateFlow: "none",
    permissions: ["read"],
    sensitivity: "production_deploy",
    approvalMode: "founder_approval_required",
    rollbackPolicy: "backup_required_before_execution",
    budget: PANTAVION_DEFAULT_EXECUTION_BUDGET,
    auditRequired: true,
    visibleInUi: false,
    implementationNotes:
      "Executable local/CI safety gate. Must pass before merge/deploy for sensitive changes.",
  },
  {
    id: "agent.capability_broker",
    title: "Pantavion Capability Broker",
    status: "internal",
    requiredStateFlow: "server_session",
    permissions: ["read", "draft", "execute"],
    sensitivity: "normal",
    approvalMode: "user_confirm",
    rollbackPolicy: "manual",
    budget: PANTAVION_DEFAULT_EXECUTION_BUDGET,
    auditRequired: true,
    visibleInUi: false,
    implementationNotes:
      "Internal broker contract. No direct external tool/API execution may bypass broker policy.",
  },
  {
    id: "voice.realtime_interpreter_beta",
    title: "Realtime Voice Interpreter Beta",
    status: "beta",
    requiredStateFlow: "provider_session",
    permissions: ["read", "execute"],
    sensitivity: "sos_or_safety",
    approvalMode: "founder_approval_required",
    rollbackPolicy: "not_applicable",
    budget: {
      timeoutMs: 15000,
      maxProviderCostEur: 0,
      maxTokens: 0,
      maxToolCalls: 0,
      maxRetries: 0,
    },
    auditRequired: true,
    visibleInUi: false,
    implementationNotes:
      "Must stay hidden/internal until provider adapter, ephemeral token endpoint, consent policy, text fallback, session state, latency/error UI, and audit path exist.",
  },
  {
    id: "sos.offgrid_identity_pack",
    title: "Off-grid Emergency Identity Pack",
    status: "internal",
    requiredStateFlow: "offline_queue",
    permissions: ["read", "write"],
    sensitivity: "sos_or_safety",
    approvalMode: "founder_approval_required",
    rollbackPolicy: "backup_required_before_execution",
    budget: PANTAVION_DEFAULT_EXECUTION_BUDGET,
    auditRequired: true,
    visibleInUi: false,
    implementationNotes:
      "Offline identity pack and local queue only. No guaranteed satellite rescue claim without certified provider/hardware/legal contract.",
  },
];

export function requiresFounderApproval(
  sensitivity: PantavionSensitivity,
  permission: PantavionPermissionLevel,
): boolean {
  if (PANTAVION_FOUNDER_APPROVAL_SENSITIVITIES.includes(sensitivity)) {
    return true;
  }

  return permission === "delete" || permission === "admin";
}

export function evaluateCapabilityRequest(
  contract: PantavionCapabilityContract,
  request: PantavionCapabilityRequest,
  nowIso = new Date().toISOString(),
): PantavionCapabilityDecision {
  const auditBase: PantavionCapabilityAuditEvent = {
    eventId: `audit_${contract.id}_${Date.now()}`,
    timestampIso: nowIso,
    capabilityId: contract.id,
    actorRole: request.identity.role,
    action: request.requestedPermission,
    sensitivity: contract.sensitivity,
    status: "requested",
    reason: request.inputSummary,
  };

  if (contract.status === "disabled") {
    return {
      allowed: false,
      capabilityId: contract.id,
      approvalMode: contract.approvalMode,
      auditEvent: { ...auditBase, status: "blocked" },
      error: {
        code: "CAPABILITY_DISABLED",
        message: "Capability is disabled.",
        retryable: false,
        founderActionRequired: false,
      },
    };
  }

  if (contract.status === "beta" && request.identity.role !== "founder") {
    return {
      allowed: false,
      capabilityId: contract.id,
      approvalMode: contract.approvalMode,
      auditEvent: { ...auditBase, status: "blocked" },
      error: {
        code: "CAPABILITY_BETA_INTERNAL_ONLY",
        message: "Capability is beta/internal and not available for this actor.",
        retryable: false,
        founderActionRequired: true,
      },
    };
  }

  if (!contract.permissions.includes(request.requestedPermission)) {
    return {
      allowed: false,
      capabilityId: contract.id,
      approvalMode: contract.approvalMode,
      auditEvent: { ...auditBase, status: "blocked" },
      error: {
        code: "PERMISSION_DENIED",
        message: "Requested permission is outside the capability contract.",
        retryable: false,
        founderActionRequired: false,
      },
    };
  }

  const founderApprovalRequired = requiresFounderApproval(
    contract.sensitivity,
    request.requestedPermission,
  );

  if (founderApprovalRequired && !request.founderApprovalToken) {
    return {
      allowed: false,
      capabilityId: contract.id,
      approvalMode: "founder_approval_required",
      auditEvent: { ...auditBase, status: "blocked" },
      error: {
        code: "FOUNDER_APPROVAL_REQUIRED",
        message: "Founder approval is required before execution.",
        retryable: false,
        founderActionRequired: true,
      },
    };
  }

  return {
    allowed: true,
    capabilityId: contract.id,
    approvalMode: contract.approvalMode,
    auditEvent: { ...auditBase, status: "approved" },
  };
}
