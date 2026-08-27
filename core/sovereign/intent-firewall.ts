export type IntentRisk = "low" | "medium" | "high" | "critical";
export type IntentDataClass = "public" | "private" | "sensitive" | "regulated";
export type IntentFirewallDisposition = "allow" | "owner_approval" | "deny";

export interface IntentFirewallRequest {
  intentId: string;
  actorId: string;
  actorKind: "founder" | "authenticated_user" | "system_agent";
  jurisdiction?: string;
  capabilities: string[];
  dataClasses: IntentDataClass[];
  estimatedCost: number;
  risk: IntentRisk;
  reversible: boolean;
  legalConsentRecorded: boolean;
  writesProduction: boolean;
  publishesToUsers: boolean;
  sendsExternalMessage: boolean;
  changesIdentityOrAccess: boolean;
}

export interface IntentFirewallPolicy {
  allowedJurisdictions: string[];
  automaticCapabilities: string[];
  maximumAutomaticCost: number;
  ownerApprovalRisks: IntentRisk[];
  requireConsentForSensitiveData: boolean;
  productionMutationMode: "deny" | "owner_approval";
  publicExposureMode: "deny" | "owner_approval";
}

export interface IntentFirewallDecision {
  intentId: string;
  disposition: IntentFirewallDisposition;
  reasons: string[];
  auditRequired: boolean;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function evaluateIntentFirewall(
  request: IntentFirewallRequest,
  policy: IntentFirewallPolicy,
): IntentFirewallDecision {
  const denyReasons: string[] = [];
  const approvalReasons: string[] = [];

  if (!request.intentId.trim()) denyReasons.push("intent_id_missing");
  if (!request.actorId.trim()) denyReasons.push("actor_identity_missing");
  if (!request.capabilities.length) denyReasons.push("capability_missing");
  if (!Number.isFinite(request.estimatedCost) || request.estimatedCost < 0) {
    denyReasons.push("invalid_cost");
  }

  if (policy.allowedJurisdictions.length) {
    if (!request.jurisdiction) denyReasons.push("jurisdiction_missing");
    else if (!policy.allowedJurisdictions.includes(request.jurisdiction)) {
      denyReasons.push("jurisdiction_not_allowed");
    }
  }

  const carriesSensitiveData = request.dataClasses.some(
    (value) => value === "sensitive" || value === "regulated",
  );
  if (
    carriesSensitiveData &&
    policy.requireConsentForSensitiveData &&
    !request.legalConsentRecorded
  ) {
    denyReasons.push("sensitive_data_without_consent");
  }

  const unknownCapabilities = request.capabilities.filter(
    (capability) => !policy.automaticCapabilities.includes(capability),
  );
  if (unknownCapabilities.length) approvalReasons.push("capability_requires_owner_scope");
  if (policy.ownerApprovalRisks.includes(request.risk)) approvalReasons.push("risk_requires_owner_approval");
  if (!request.reversible) approvalReasons.push("irreversible_action");
  if (request.estimatedCost > policy.maximumAutomaticCost) approvalReasons.push("automatic_cost_limit_exceeded");
  if (request.sendsExternalMessage) approvalReasons.push("external_message");
  if (request.changesIdentityOrAccess) approvalReasons.push("identity_or_access_change");

  if (request.writesProduction) {
    if (policy.productionMutationMode === "deny") denyReasons.push("production_mutation_denied");
    else approvalReasons.push("production_mutation_requires_owner");
  }
  if (request.publishesToUsers) {
    if (policy.publicExposureMode === "deny") denyReasons.push("public_exposure_denied");
    else approvalReasons.push("public_exposure_requires_owner");
  }

  if (denyReasons.length) {
    return {
      intentId: request.intentId,
      disposition: "deny",
      reasons: unique(denyReasons),
      auditRequired: true,
    };
  }

  if (approvalReasons.length) {
    return {
      intentId: request.intentId,
      disposition: "owner_approval",
      reasons: unique(approvalReasons),
      auditRequired: true,
    };
  }

  return {
    intentId: request.intentId,
    disposition: "allow",
    reasons: ["policy_satisfied"],
    auditRequired: true,
  };
}
