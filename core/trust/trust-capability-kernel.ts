import {
  resolvePantavionAdaptivePolicy,
  type PantavionAdaptiveFeature,
  type PantavionAgeProof,
  type PantavionCountryAdaptiveRule,
} from "@/core/governance/adaptive-ecosystem-policy";

export type PantavionActorKind = "human" | "agent" | "service";
export type PantavionRisk = "low" | "medium" | "high" | "critical";
export type PantavionTrustDecision = "allow" | "restrict" | "require_owner_approval" | "deny";

export type PantavionCapabilityGrant = {
  capability: string;
  actorId: string;
  actorKind: PantavionActorKind;
  issuedAt: string;
  expiresAt: string;
  allowedDataClasses: readonly string[];
  maxRisk: PantavionRisk;
  reversibleOnly: boolean;
};

export type PantavionAiProvenance = {
  origin: "human" | "ai" | "mixed";
  provider?: string;
  model?: string;
  operation: string;
  generatedAt: string;
};

export type PantavionTrustRequest = {
  actorId: string;
  actorKind: PantavionActorKind;
  capability: string;
  feature: PantavionAdaptiveFeature;
  countryCode: string;
  risk: PantavionRisk;
  reversible: boolean;
  requestedDataClasses?: readonly string[];
  age?: number | null;
  birthDate?: string | null;
  guardianConsent?: boolean;
  ageProof?: PantavionAgeProof;
  countryRule?: PantavionCountryAdaptiveRule | null;
  grant?: PantavionCapabilityGrant | null;
  provenance?: PantavionAiProvenance | null;
  now?: Date;
};

export type PantavionTrustResult = {
  decision: PantavionTrustDecision;
  reasons: string[];
  policyAccess: ReturnType<typeof resolvePantavionAdaptivePolicy>["access"];
  auditRequired: true;
  provenanceRequired: boolean;
};

const riskRank: Record<PantavionRisk, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function validDate(value: string) {
  return Number.isFinite(Date.parse(value));
}

function validateGrant(request: PantavionTrustRequest, now: Date) {
  const reasons: string[] = [];
  const grant = request.grant;
  if (!grant) return ["capability_grant_missing"];
  if (grant.actorId !== request.actorId || grant.actorKind !== request.actorKind) reasons.push("capability_grant_actor_mismatch");
  if (grant.capability !== request.capability) reasons.push("capability_grant_scope_mismatch");
  if (!validDate(grant.issuedAt) || !validDate(grant.expiresAt)) reasons.push("capability_grant_time_invalid");
  else if (Date.parse(grant.expiresAt) <= now.getTime()) reasons.push("capability_grant_expired");
  if (riskRank[request.risk] > riskRank[grant.maxRisk]) reasons.push("capability_grant_risk_exceeded");
  if (grant.reversibleOnly && !request.reversible) reasons.push("capability_grant_requires_reversible_action");
  for (const dataClass of request.requestedDataClasses ?? []) {
    if (!grant.allowedDataClasses.includes(dataClass)) reasons.push(`capability_grant_data_denied:${dataClass}`);
  }
  return reasons;
}

export function evaluatePantavionTrustCapability(request: PantavionTrustRequest): PantavionTrustResult {
  const now = request.now ?? new Date();
  const policy = resolvePantavionAdaptivePolicy({
    countryCode: request.countryCode,
    feature: request.feature,
    age: request.age,
    birthDate: request.birthDate,
    guardianConsent: request.guardianConsent,
    ageProof: request.ageProof,
    countryRule: request.countryRule,
    now,
  });

  const reasons = [...policy.reasons];
  const grantReasons = request.actorKind === "human" ? [] : validateGrant(request, now);
  reasons.push(...grantReasons);

  const provenanceRequired = request.actorKind !== "human";
  if (provenanceRequired && !request.provenance) reasons.push("ai_provenance_missing");
  if (request.provenance && !validDate(request.provenance.generatedAt)) reasons.push("ai_provenance_time_invalid");

  if (policy.access === "blocked") return { decision: "deny", reasons, policyAccess: policy.access, auditRequired: true, provenanceRequired };
  if (grantReasons.length > 0 || (provenanceRequired && !request.provenance)) {
    return { decision: "deny", reasons, policyAccess: policy.access, auditRequired: true, provenanceRequired };
  }
  if (request.risk === "critical" || !request.reversible) {
    reasons.push("owner_authority_required_for_critical_or_irreversible_action");
    return { decision: "require_owner_approval", reasons, policyAccess: policy.access, auditRequired: true, provenanceRequired };
  }
  if (policy.access !== "allowed" || request.risk === "high") {
    reasons.push("bounded_execution_required");
    return { decision: "restrict", reasons, policyAccess: policy.access, auditRequired: true, provenanceRequired };
  }
  return { decision: "allow", reasons, policyAccess: policy.access, auditRequired: true, provenanceRequired };
}

export const pantavionTrustCapabilityDoctrine = {
  failClosed: true,
  leastPrivilege: true,
  jurisdictionAware: true,
  ageAware: true,
  provenanceForNonHumanActors: true,
  auditAlways: true,
  ownerApprovalForCriticalOrIrreversible: true,
} as const;
