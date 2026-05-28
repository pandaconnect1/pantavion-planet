import type {
  PantavionPrincipalType,
  PantavionSensitivity,
} from "../../types/pantavion";

export type PantavionTrustTier =
  | "untrusted"
  | "basic"
  | "trusted"
  | "high-trust"
  | "system";

export type PantavionApprovalTier =
  | "none"
  | "review"
  | "admin"
  | "security"
  | "executive";

export interface PantavionAuthorityProof {
  id: string;
  kind: "direct" | "delegated" | "service" | "system";
  issuedAt: string;
  expiresAt?: string;
  issuedBy?: string;
  note?: string;
}

export interface PantavionIdentityRegistrationInput {
  id?: string;
  actorId?: string;
  type?: PantavionPrincipalType;
  actorType?: PantavionPrincipalType;
  displayName?: string;
  region?: string;
  verified?: boolean;
  roles?: string[];
  role?: string;
  scopes?: string[];
  primaryRole?: string;
  trustTier?: PantavionTrustTier;
  approvalTier?: PantavionApprovalTier;
  status?: "active" | "inactive" | "suspended";
  defaultScopes?: Array<string | { id?: string; label?: string; kind?: string }>;
  requestedOperation?: string;
  requestedSensitivity?: PantavionSensitivity;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PantavionIdentityProfile {
  id: string;
  type: PantavionPrincipalType;
  displayName: string;
  region?: string;
  sensitivityCeiling: PantavionSensitivity;
  roles: string[];
  scopes: string[];
  active: boolean;
  verified: boolean;
  trustTier: PantavionTrustTier;
  approvalTier: PantavionApprovalTier;
  metadata?: Record<string, unknown>;
}

export interface PantavionIdentityResolution {
  actor: PantavionIdentityProfile;
  actorId: string;
  actorType: PantavionPrincipalType;
  effectiveRoles: string[];
  effectiveScopes: string[];
  trustTier: PantavionTrustTier;
  approvalTier: PantavionApprovalTier;
  proofs: PantavionAuthorityProof[];
  approved: boolean;
  denialReasons: string[];
}

export type PantavionIdentityRecord = PantavionIdentityProfile;
export type PantavionResolvedIdentityPosture = PantavionIdentityResolution;

export const SYSTEM_KERNEL_IDENTITY: PantavionIdentityProfile = {
  id: "pantavion.kernel0",
  type: "system",
  displayName: "Pantavion Kernel 0",
  sensitivityCeiling: "critical",
  roles: ["kernel", "governor", "system"],
  scopes: ["read", "write", "execute", "delegate", "approve", "admin", "memory", "policy", "identity", "ops", "protocol", "global"],
  active: true,
  verified: true,
  trustTier: "system",
  approvalTier: "security",
};

function uniq(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeScope(value: string | { id?: string; label?: string; kind?: string }): string {
  if (typeof value === "string") return value;
  return value.id || value.label || value.kind || "global";
}

export function buildIdentityProfile(actor: PantavionIdentityRegistrationInput): PantavionIdentityProfile {
  const type = actor.type || actor.actorType || "human";
  const roles = uniq([
    ...(actor.roles ?? []),
    ...(actor.primaryRole ? [actor.primaryRole] : []),
    ...(actor.role ? [actor.role] : []),
  ]);

  const scopes = uniq(
    actor.scopes?.length
      ? actor.scopes.map(String)
      : (actor.defaultScopes ?? ["read"]).map(normalizeScope)
  );

  return {
    id: String(actor.id || actor.actorId || "unknown-actor"),
    type,
    displayName: String(actor.displayName ?? actor.id ?? actor.actorId ?? "unknown-actor"),
    region: actor.region,
    sensitivityCeiling: "internal",
    roles,
    scopes,
    active: actor.status ? actor.status === "active" : true,
    verified: actor.verified ?? (type === "system" || type === "service"),
    trustTier: actor.trustTier ?? (type === "system" ? "system" : "trusted"),
    approvalTier: actor.approvalTier ?? "review",
    metadata: actor.metadata,
  };
}

export function registerIdentity(actor: PantavionIdentityRegistrationInput): PantavionIdentityProfile {
  return buildIdentityProfile(actor);
}

export function resolveIdentity(
  actor: PantavionIdentityRegistrationInput | undefined,
  proofs: PantavionAuthorityProof[] = [],
): PantavionIdentityResolution {
  const profile = buildIdentityProfile(actor ?? { id: "unknown-actor", verified: false });
  const denialReasons: string[] = [];

  if (!profile.id.trim()) denialReasons.push("missing_actor_id");
  if (!profile.active) denialReasons.push("actor_inactive");
  if (!profile.verified) denialReasons.push("actor_unverified");

  return {
    actor: profile,
    actorId: profile.id,
    actorType: profile.type,
    proofs,
    effectiveRoles: uniq(profile.roles),
    effectiveScopes: uniq(profile.scopes),
    trustTier: profile.trustTier,
    approvalTier: profile.approvalTier,
    approved: denialReasons.length === 0,
    denialReasons,
  };
}

export function resolveIdentityPosture(
  actor: PantavionIdentityRegistrationInput | undefined,
  proofs: PantavionAuthorityProof[] = [],
): PantavionIdentityResolution {
  return resolveIdentity(actor, proofs);
}

export function hasRequiredScopes(
  resolution: PantavionIdentityResolution,
  requiredScopes: string[],
): boolean {
  return requiredScopes.every((scope) => resolution.effectiveScopes.includes(scope));
}

export const identityModel = {
  id: "pantavion_identity_model_v1",
  systemIdentity: SYSTEM_KERNEL_IDENTITY,
  buildIdentityProfile,
  registerIdentity,
  resolveIdentity,
  resolveIdentityPosture,
  hasRequiredScopes,
} as const;
