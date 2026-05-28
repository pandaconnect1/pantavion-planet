import type { PantavionScope } from '../../types/pantavion';
import type { PantavionAuthorityProof, PantavionIdentityProfile } from './identity-model';

export interface PantavionDelegationGrant {
  id: string;
  grantorId: string;
  granteeId: string;
  scopes: PantavionScope[];
  issuedAt: string;
  expiresAt?: string;
  active: boolean;
  reason?: string;
}

export interface PantavionDelegationEvaluation {
  valid: boolean;
  denialReasons: string[];
  effectiveScopes: PantavionScope[];
  proof: PantavionAuthorityProof;
}

export function evaluateDelegation(
  grant: PantavionDelegationGrant,
  grantor: PantavionIdentityProfile,
  grantee: PantavionIdentityProfile,
): PantavionDelegationEvaluation {
  const denialReasons: string[] = [];
  if (!grant.active) denialReasons.push('delegation_inactive');
  if (grant.grantorId !== grantor.id) denialReasons.push('delegation_grantor_mismatch');
  if (grant.granteeId !== grantee.id) denialReasons.push('delegation_grantee_mismatch');
  if (grant.expiresAt && new Date(grant.expiresAt).getTime() < Date.now()) denialReasons.push('delegation_expired');

  const effectiveScopes = grant.scopes.filter((scope) => grantor.scopes.includes(scope) && grantee.scopes.includes(scope));

  return {
    valid: denialReasons.length === 0,
    denialReasons,
    effectiveScopes,
    proof: {
      id: grant.id,
      kind: 'delegated',
      issuedAt: grant.issuedAt,
      expiresAt: grant.expiresAt,
      issuedBy: grantor.id,
      note: grant.reason,
    },
  };
}

export function createDelegation(input: {
  id?: string;
  kind: string;
  principalId: string;
  principalType?: string;
  delegateId: string;
  delegateType?: string;
  scope?: PantavionScope | string;
  scopes?: Array<PantavionScope | string>;
  delegatedScopes?: Array<string | { scopeId?: string; scopeLabel?: string; id?: string; label?: string }>;
  delegatedRoles?: string[];
  delegatedEntitlements?: string[];
  delegatedCapabilities?: unknown[];
  trustFloor?: string;
  approvalTier?: string;
  constraints?: string[];
  rationale?: string[];
  reason?: string;
  issuedAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}): PantavionDelegationGrant {
  const now = input.issuedAt || new Date().toISOString();

  const delegatedScopeValues = (input.delegatedScopes ?? []).map((scope) => {
    if (typeof scope === "string") return scope;
    return scope.scopeId || scope.id || scope.scopeLabel || scope.label || "global";
  });

  const scopes = [
    ...(input.scopes ?? []),
    ...(input.scope ? [input.scope] : []),
    ...delegatedScopeValues,
  ].map((scope) => String(scope)) as PantavionScope[];

  const finalScopes = scopes.length > 0 ? scopes : (["global"] as PantavionScope[]);

  return {
    id: input.id || `delegation_${input.kind}_${input.principalId}_${input.delegateId}_${Date.parse(now)}`,
    kind: input.kind,
    principalId: input.principalId,
    delegateId: input.delegateId,
    grantorId: input.principalId,
    granteeId: input.delegateId,
    scope: finalScopes[0],
    scopes: finalScopes,
    reason:
      input.reason ||
      input.rationale?.join(" ") ||
      "Pantavion delegated foundation grant.",
    issuedAt: now,
    expiresAt: input.expiresAt,
    status: "active",
    active: true,
  } as unknown as PantavionDelegationGrant;
}

export function activateDelegation(id: string): boolean {
  return Boolean(id && id.trim());
}

export type PantavionDelegationRecord = PantavionDelegationGrant;

export const delegationModel = {
  createDelegation,
  evaluateDelegation,
  create: createDelegation,
  evaluate: evaluateDelegation,
  activateDelegation,
};

