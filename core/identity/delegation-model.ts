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
  kind: string;
  principalId: string;
  delegateId: string;
  scope: string;
  reason: string;
  issuedAt?: string;
  expiresAt?: string;
}): PantavionDelegationGrant {
  const now = input.issuedAt || new Date().toISOString();

  return {
    id: `delegation_${input.kind}_${input.principalId}_${input.delegateId}_${Date.parse(now)}`,
    kind: input.kind,
    principalId: input.principalId,
    delegateId: input.delegateId,
    grantorId: input.principalId,
    granteeId: input.delegateId,
    scope: input.scope,
    scopes: [input.scope],
    reason: input.reason,
    issuedAt: now,
    expiresAt: input.expiresAt || null,
    status: "active",
    active: true,
  } as unknown as PantavionDelegationGrant;
}

export type PantavionDelegationRecord = PantavionDelegationGrant;

export const delegationModel = {
  createDelegation,
  evaluateDelegation,
  create: createDelegation,
  evaluate: evaluateDelegation,
};

