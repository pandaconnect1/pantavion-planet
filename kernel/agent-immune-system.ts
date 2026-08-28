import type {
  KernelPrincipal,
  KernelProtectedResource,
  KernelZeroTrustDecision,
} from "./zero-trust";

export type AgentContainmentAction =
  | "none"
  | "require_human_approval"
  | "reduce_privileges"
  | "quarantine"
  | "rollback_and_quarantine";

export interface AgentDelegatedAuthorityEnvelope {
  envelopeId: string;
  agentPrincipalId: string;
  issuerPrincipalId: string;
  purpose: string;
  validFrom: string;
  expiresAt: string;
  allowedActions: string[];
  allowedResourceIds: string[];
  allowedToolIds: string[];
  allowedEnvironments: string[];
  maxOperations: number;
  maxWriteOperations: number;
  maxExternalEffects: number;
  maxFinancialMinorUnits: number;
  requiresHumanApprovalFor: string[];
  rollbackPlanRequiredFor: string[];
  provenanceRequired: boolean;
}

export interface AgentExecutionIntent {
  requestId: string;
  principal: KernelPrincipal;
  resource: KernelProtectedResource;
  authority: AgentDelegatedAuthorityEnvelope;
  action: string;
  toolId: string;
  purpose: string;
  operationCount: number;
  writeOperationCount: number;
  externalEffectCount: number;
  financialMinorUnits: number;
  irreversible: boolean;
  provenanceVerified: boolean;
  humanApprovalPresent: boolean;
  rollbackPlanVerified: boolean;
  behaviourRiskScore: number;
}

export interface AgentImmuneSystemDecision {
  requestId: string;
  allowed: boolean;
  reasons: string[];
  requiresHumanApproval: boolean;
  containment: AgentContainmentAction;
  rollbackPlanRequired: boolean;
  matchedAuthorityEnvelopeId: string | null;
  zeroTrust: KernelZeroTrustDecision;
}

const parseMillis = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const includesValue = (values: string[], value: string) =>
  values.includes(value) || values.includes("*");

const boundedNonNegative = (value: number) => Number.isFinite(value) && value >= 0;

const isAgentWorkload = (principal: KernelPrincipal) =>
  principal.type === "kernel" || principal.type === "service" || principal.type === "worker";

function containmentForRisk(risk: number, rollbackPlanRequired: boolean): AgentContainmentAction {
  if (risk >= 85) return rollbackPlanRequired ? "rollback_and_quarantine" : "quarantine";
  if (risk >= 70) return "quarantine";
  if (risk >= 50) return "reduce_privileges";
  return "none";
}

/**
 * Agent Immune System foundation.
 *
 * The caller must first produce a Kernel zero-trust decision. This policy is a
 * second, monotonic gate: delegated authority may only narrow an already valid
 * zero-trust decision and can never turn a zero-trust deny into an allow.
 */
export function evaluateAgentExecutionAuthority(
  intent: AgentExecutionIntent,
  zeroTrust: KernelZeroTrustDecision,
  nowMs = Date.now(),
): AgentImmuneSystemDecision {
  const reasons: string[] = [];
  const authority = intent.authority;
  const risk = Math.max(0, Math.min(100, Math.round(intent.behaviourRiskScore)));

  if (zeroTrust.requestId !== intent.requestId) reasons.push("zero_trust_request_mismatch");
  if (!zeroTrust.allowed) reasons.push("zero_trust_denied");
  if (!isAgentWorkload(intent.principal)) reasons.push("agent_workload_principal_required");
  if (!authority.envelopeId.trim()) reasons.push("authority_envelope_id_required");
  if (!authority.issuerPrincipalId.trim()) reasons.push("authority_issuer_required");
  if (authority.agentPrincipalId !== intent.principal.id) reasons.push("authority_subject_mismatch");
  if (!intent.purpose.trim() || authority.purpose !== intent.purpose) reasons.push("authority_purpose_mismatch");

  const validFrom = parseMillis(authority.validFrom);
  const expiresAt = parseMillis(authority.expiresAt);
  if (validFrom <= 0 || validFrom > nowMs) reasons.push("authority_not_yet_valid");
  if (expiresAt <= nowMs || expiresAt <= validFrom) reasons.push("authority_expired_or_invalid");

  if (!includesValue(authority.allowedActions, intent.action)) reasons.push("authority_action_denied");
  if (!includesValue(authority.allowedResourceIds, intent.resource.id)) reasons.push("authority_resource_denied");
  if (!includesValue(authority.allowedToolIds, intent.toolId)) reasons.push("authority_tool_denied");
  if (!includesValue(authority.allowedEnvironments, intent.resource.environment)) reasons.push("authority_environment_denied");

  const counters = [
    intent.operationCount,
    intent.writeOperationCount,
    intent.externalEffectCount,
    intent.financialMinorUnits,
    authority.maxOperations,
    authority.maxWriteOperations,
    authority.maxExternalEffects,
    authority.maxFinancialMinorUnits,
  ];
  if (!counters.every(boundedNonNegative)) reasons.push("authority_budget_invalid");

  if (intent.operationCount > authority.maxOperations) reasons.push("operation_budget_exhausted");
  if (intent.writeOperationCount > authority.maxWriteOperations) reasons.push("write_budget_exhausted");
  if (intent.externalEffectCount > authority.maxExternalEffects) reasons.push("external_effect_budget_exhausted");
  if (intent.financialMinorUnits > authority.maxFinancialMinorUnits) reasons.push("financial_budget_exceeded");

  if (authority.provenanceRequired && !intent.provenanceVerified) reasons.push("provenance_not_verified");

  const rollbackPlanRequired =
    includesValue(authority.rollbackPlanRequiredFor, intent.action)
    || (intent.externalEffectCount > 0 && !intent.irreversible);
  if (rollbackPlanRequired && !intent.rollbackPlanVerified) reasons.push("rollback_plan_not_verified");

  const actionRequiresApproval = includesValue(authority.requiresHumanApprovalFor, intent.action);
  const requiresHumanApproval = actionRequiresApproval || intent.irreversible || risk >= 50;
  if (requiresHumanApproval && !intent.humanApprovalPresent) reasons.push("human_approval_required");

  const riskContainment = containmentForRisk(risk, rollbackPlanRequired);
  if (risk >= 50) reasons.push(`behaviour_risk_${risk >= 85 ? "critical" : risk >= 70 ? "high" : "elevated"}`);

  let containment: AgentContainmentAction = riskContainment;
  if (containment === "none" && requiresHumanApproval && !intent.humanApprovalPresent) {
    containment = "require_human_approval";
  }

  return {
    requestId: intent.requestId,
    allowed: reasons.length === 0,
    reasons,
    requiresHumanApproval,
    containment,
    rollbackPlanRequired,
    matchedAuthorityEnvelopeId: reasons.length === 0 ? authority.envelopeId : null,
    zeroTrust,
  };
}
