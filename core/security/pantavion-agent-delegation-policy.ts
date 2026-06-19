import type { PantavionAgentProtocolId } from "@/core/ai/pantavion-agent-protocol-registry";

export type PantavionSensitiveChangeCategory =
  | "user_access"
  | "private_infrastructure"
  | "production_deploy"
  | "legal_policy"
  | "payment_billing"
  | "identity_memory"
  | "sos_emergency"
  | "public_geodata"
  | "provider_credentials"
  | "data_changing_execution";

export interface PantavionAgentDelegationRequest {
  actorId: string;
  protocolId: PantavionAgentProtocolId;
  action: string;
  categories: PantavionSensitiveChangeCategory[];
  auditGreen: boolean;
  buildGreen: boolean;
  typecheckGreen: boolean;
  founderApprovalRecorded: boolean;
  rollbackPlanPresent: boolean;
  scopedDiffReviewed: boolean;
}

export interface PantavionAgentDelegationDecision {
  id: "pantavion_agent_delegation_policy_v1";
  allowed: boolean;
  requiresFounderApproval: boolean;
  blockingReasons: string[];
  requiredBeforeExecution: string[];
}

const alwaysSensitiveCategories: PantavionSensitiveChangeCategory[] = [
  "user_access",
  "private_infrastructure",
  "production_deploy",
  "legal_policy",
  "payment_billing",
  "identity_memory",
  "sos_emergency",
  "public_geodata",
  "provider_credentials",
  "data_changing_execution",
];

export function requiresPantavionFounderApproval(
  categories: PantavionSensitiveChangeCategory[],
) {
  return categories.some((category) => alwaysSensitiveCategories.includes(category));
}

export function createPantavionAgentDelegationDecision(
  request: PantavionAgentDelegationRequest,
): PantavionAgentDelegationDecision {
  const blockingReasons: string[] = [];
  const requiresFounderApproval = requiresPantavionFounderApproval(request.categories);

  if (!request.actorId.trim()) {
    blockingReasons.push("Actor id is required.");
  }

  if (!request.action.trim()) {
    blockingReasons.push("Action is required.");
  }

  if (!request.auditGreen) {
    blockingReasons.push("Audit gate must be green before execution.");
  }

  if (!request.typecheckGreen) {
    blockingReasons.push("TypeScript gate must be green before execution.");
  }

  if (!request.buildGreen) {
    blockingReasons.push("Build gate must be green before execution.");
  }

  if (!request.scopedDiffReviewed) {
    blockingReasons.push("Scoped diff review is required; git add . is not allowed.");
  }

  if (requiresFounderApproval && !request.founderApprovalRecorded) {
    blockingReasons.push("Founder approval is required for sensitive changes.");
  }

  if (requiresFounderApproval && !request.rollbackPlanPresent) {
    blockingReasons.push("Rollback plan is required for sensitive changes.");
  }

  return {
    id: "pantavion_agent_delegation_policy_v1",
    allowed: blockingReasons.length === 0,
    requiresFounderApproval,
    blockingReasons,
    requiredBeforeExecution: [
      "auditGreen",
      "typecheckGreen",
      "buildGreen",
      "scopedDiffReviewed",
      "founderApprovalRecorded when sensitive",
      "rollbackPlanPresent when sensitive",
    ],
  };
}
