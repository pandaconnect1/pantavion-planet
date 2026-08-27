export type KernelPrincipalType = "owner" | "user" | "kernel" | "service" | "worker";

export interface KernelAccessGrant {
  grantId: string;
  actions: string[];
  resourceIds: string[];
  environments: string[];
  expiresAt?: string;
}

export interface KernelPrincipal {
  id: string;
  type: KernelPrincipalType;
  authenticated: boolean;
  credentialExpiresAt: string;
  tenantId?: string;
  workloadIdentityVerified?: boolean;
  grants: KernelAccessGrant[];
}

export interface KernelProtectedResource {
  id: string;
  tenantId?: string;
  environment: string;
  sensitivity: "public" | "internal" | "confidential" | "restricted";
}

export interface KernelZeroTrustRequest {
  requestId: string;
  principal: KernelPrincipal;
  resource: KernelProtectedResource;
  action: string;
  transportAuthenticated: boolean;
  jurisdictionAllowed: boolean;
  agePolicyAllowed: boolean;
  explicitlyDenied?: boolean;
}

export interface KernelZeroTrustDecision {
  requestId: string;
  allowed: boolean;
  reasons: string[];
  matchedGrantId: string | null;
}

const parseMillis = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isInternalWorkload = (principal: KernelPrincipal) =>
  principal.type === "kernel" || principal.type === "service" || principal.type === "worker";

const matchesValue = (values: string[], value: string) =>
  values.includes(value) || values.includes("*");

const grantActive = (grant: KernelAccessGrant, nowMs: number) =>
  !grant.expiresAt || parseMillis(grant.expiresAt) > nowMs;

/**
 * Zero-trust authorization decision with default-deny semantics.
 *
 * Being an owner or being inside the Pantavion network is never sufficient by
 * itself. The caller still needs a valid identity, an unexpired credential,
 * policy approval and an explicit scoped grant.
 */
export const evaluateKernelZeroTrustAccess = (
  request: KernelZeroTrustRequest,
  nowMs = Date.now(),
): KernelZeroTrustDecision => {
  const reasons: string[] = [];
  const { principal, resource } = request;

  if (!request.requestId.trim()) reasons.push("request_id_required");
  if (!principal.id.trim()) reasons.push("principal_id_required");
  if (!request.action.trim()) reasons.push("action_required");
  if (request.explicitlyDenied) reasons.push("explicit_deny");
  if (!principal.authenticated) reasons.push("principal_not_authenticated");
  if (parseMillis(principal.credentialExpiresAt) <= nowMs) reasons.push("credential_expired");
  if (!request.transportAuthenticated) reasons.push("transport_not_authenticated");
  if (!request.jurisdictionAllowed) reasons.push("jurisdiction_denied");
  if (!request.agePolicyAllowed) reasons.push("age_policy_denied");

  if (isInternalWorkload(principal) && principal.workloadIdentityVerified !== true) {
    reasons.push("workload_identity_not_verified");
  }

  if (resource.tenantId && principal.tenantId !== resource.tenantId) {
    reasons.push("tenant_isolation_denied");
  }

  const matchedGrant = principal.grants.find((grant) =>
    grantActive(grant, nowMs)
    && matchesValue(grant.actions, request.action)
    && matchesValue(grant.resourceIds, resource.id)
    && matchesValue(grant.environments, resource.environment)
  );

  if (!matchedGrant) reasons.push("scoped_grant_missing");

  return {
    requestId: request.requestId,
    allowed: reasons.length === 0,
    reasons,
    matchedGrantId: reasons.length === 0 ? matchedGrant?.grantId ?? null : null,
  };
};
