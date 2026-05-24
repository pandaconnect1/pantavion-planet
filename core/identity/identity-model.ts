import type {
  PantavionActorRef,
  PantavionPrincipalType,
  PantavionScope,
  PantavionSensitivity,
} from '../../types/pantavion';

export interface PantavionAuthorityProof {
  id: string;
  kind: 'direct' | 'delegated' | 'service' | 'system';
  issuedAt: string;
  expiresAt?: string;
  issuedBy?: string;
  note?: string;
}

export interface PantavionIdentityProfile {
  id: string;
  type: PantavionPrincipalType;
  displayName: string;
  region?: string;
  sensitivityCeiling: PantavionSensitivity;
  roles: string[];
  scopes: PantavionScope[];
  active: boolean;
  verified: boolean;
  metadata?: Record<string, unknown>;
}

export interface PantavionIdentityResolution {
  actor: PantavionIdentityProfile;
  proofs: PantavionAuthorityProof[];
  effectiveRoles: string[];
  effectiveScopes: PantavionScope[];
  approved: boolean;
  denialReasons: string[];
}

export const SYSTEM_KERNEL_IDENTITY: PantavionIdentityProfile = {
  id: 'pantavion.kernel0',
  type: 'system',
  displayName: 'Pantavion Kernel 0',
  sensitivityCeiling: 'critical',
  roles: ['kernel', 'governor', 'system'],
  scopes: ['read', 'write', 'execute', 'delegate', 'approve', 'admin', 'memory', 'policy', 'identity', 'ops', 'protocol'],
  active: true,
  verified: true,
};

export function buildIdentityProfile(actor: PantavionActorRef): PantavionIdentityProfile {
  return {
    id: actor.id,
    type: actor.type ?? 'human',
    displayName: actor.displayName ?? actor.id,
    region: actor.region,
    sensitivityCeiling: 'internal',
    roles: actor.roles ?? [],
    scopes: actor.scopes ?? ['read'],
    active: true,
    verified: actor.verified ?? false,
  };
}

export function resolveIdentity(
  actor: PantavionActorRef | undefined,
  proofs: PantavionAuthorityProof[] = [],
): PantavionIdentityResolution {
  const profile = buildIdentityProfile(actor ?? { id: 'unknown-actor', verified: false });

  const denialReasons: string[] = [];
  if (!profile.id.trim()) denialReasons.push('missing_actor_id');
  if (!profile.active) denialReasons.push('actor_inactive');
  if (!profile.verified) denialReasons.push('actor_unverified');

  return {
    actor: profile,
    proofs,
    effectiveRoles: [...new Set(profile.roles)],
    effectiveScopes: [...new Set(profile.scopes)],
    approved: denialReasons.length === 0,
    denialReasons,
  };
}

export function hasRequiredScopes(
  resolution: PantavionIdentityResolution,
  requiredScopes: PantavionScope[],
): boolean {
  return requiredScopes.every((scope) => resolution.effectiveScopes.includes(scope));
}