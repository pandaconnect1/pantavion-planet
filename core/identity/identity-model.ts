// core/identity/identity-model.ts

export type PantavionActorType = 'human' | 'agent' | 'service';

export type PantavionTrustTier =
  | 'untrusted'
  | 'basic'
  | 'trusted'
  | 'high-trust'
  | 'system';

export type PantavionApprovalTier =
  | 'none'
  | 'review'
  | 'admin'
  | 'security'
  | 'executive';

export type PantavionIdentityStatus =
  | 'active'
  | 'pending'
  | 'suspended'
  | 'restricted'
  | 'archived';

export type PantavionIdentityScopeKind =
  | 'global'
  | 'personal'
  | 'workspace'
  | 'organization'
  | 'project'
  | 'institutional'
  | 'restricted';

export interface PantavionIdentityMetadata {
  [key: string]: unknown;
}

export interface PantavionScopeRef {
  kind: PantavionIdentityScopeKind;
  id: string;
  label?: string;
}

export interface PantavionRoleGrant {
  roleKey: string;
  scopeIds: string[];
  grantedBy?: string;
  grantedAt: string;
  expiresAt?: string;
  active: boolean;
  metadata?: PantavionIdentityMetadata;
}

export interface PantavionEntitlementGrant {
  entitlementKey: string;
  scopeIds: string[];
  grantedBy?: string;
  grantedAt: string;
  expiresAt?: string;
  active: boolean;
  metadata?: PantavionIdentityMetadata;
}

export interface PantavionIdentityRecord {
  id: string;
  actorType: PantavionActorType;
  displayName: string;
  handle?: string;
  primaryRole?: string;
  trustTier: PantavionTrustTier;
  approvalTier: PantavionApprovalTier;
  status: PantavionIdentityStatus;
  defaultScopes: PantavionScopeRef[];
  roleGrants: PantavionRoleGrant[];
  entitlementGrants: PantavionEntitlementGrant[];
  metadata: PantavionIdentityMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface PantavionIdentityResolutionInput {
  actorId?: string;
  actorType?: PantavionActorType;
  role?: string;
  scopes?: string[];
  delegatedBy?: string;
  sessionId?: string;
  workspaceId?: string;
  orgId?: string;
  projectId?: string;
  planKey?: string;
  trustTierHint?: PantavionTrustTier;
  requestedOperation?: string;
  requestedSensitivity?: 'public' | 'internal' | 'confidential' | 'restricted';
  metadata?: PantavionIdentityMetadata;
}

export interface PantavionResolvedIdentityPosture {
  resolved: boolean;
  provisional: boolean;
  actorId?: string;
  actorType: PantavionActorType;
  effectiveRoles: string[];
  effectiveScopes: string[];
  trustTier: PantavionTrustTier;
  approvalTier: PantavionApprovalTier;
  entitlements: string[];
  deniedRestrictions: string[];
  delegatedBy?: string;
  rationale: string[];
  identityRecord?: PantavionIdentityRecord;
}

export interface PantavionRolePolicy {
  roleKey: string;
  actorTypes: PantavionActorType[];
  defaultTrustTier: PantavionTrustTier;
  defaultApprovalTier: PantavionApprovalTier;
  defaultEntitlements: string[];
  defaultRestrictions: string[];
}

export interface PantavionIdentityModelConfig {
  enableProvisionalFallback: boolean;
  includeGlobalScopeByDefault: boolean;
  strictRestrictedSensitivity: boolean;
}

const DEFAULT_IDENTITY_MODEL_CONFIG: PantavionIdentityModelConfig = {
  enableProvisionalFallback: true,
  includeGlobalScopeByDefault: true,
  strictRestrictedSensitivity: true,
};

const ROLE_POLICIES: PantavionRolePolicy[] = [
  {
    roleKey: 'human-user',
    actorTypes: ['human'],
    defaultTrustTier: 'basic',
    defaultApprovalTier: 'review',
    defaultEntitlements: ['workspace:enter', 'session:participate', 'profile:read'],
    defaultRestrictions: [],
  },
  {
    roleKey: 'professional-user',
    actorTypes: ['human'],
    defaultTrustTier: 'trusted',
    defaultApprovalTier: 'review',
    defaultEntitlements: [
      'workspace:enter',
      'session:participate',
      'profile:read',
      'build:propose',
      'business:access',
    ],
    defaultRestrictions: [],
  },
  {
    roleKey: 'admin-operator',
    actorTypes: ['human'],
    defaultTrustTier: 'high-trust',
    defaultApprovalTier: 'admin',
    defaultEntitlements: [
      'workspace:enter',
      'session:participate',
      'profile:read',
      'admin:review',
      'admin:operate',
      'alerts:read',
    ],
    defaultRestrictions: ['blind-destructive-mutation'],
  },
  {
    roleKey: 'security-operator',
    actorTypes: ['human'],
    defaultTrustTier: 'high-trust',
    defaultApprovalTier: 'security',
    defaultEntitlements: [
      'workspace:enter',
      'session:participate',
      'profile:read',
      'security:review',
      'security:operate',
      'audit:read',
    ],
    defaultRestrictions: ['blind-destructive-mutation'],
  },
  {
    roleKey: 'service-runtime',
    actorTypes: ['service'],
    defaultTrustTier: 'system',
    defaultApprovalTier: 'security',
    defaultEntitlements: ['runtime:execute', 'audit:write', 'registry:read'],
    defaultRestrictions: ['human-only-surface-access'],
  },
  {
    roleKey: 'agent-runtime',
    actorTypes: ['agent'],
    defaultTrustTier: 'trusted',
    defaultApprovalTier: 'review',
    defaultEntitlements: ['task:execute', 'tool:request', 'session:participate'],
    defaultRestrictions: ['unapproved-restricted-execution'],
  },
];

function nowIso(): string {
  return new Date().toISOString();
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [String(value)];
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function normalizeActorType(value: unknown): PantavionActorType {
  return value === 'agent' || value === 'service' ? value : 'human';
}

function normalizeTrustTier(value: unknown): PantavionTrustTier {
  switch (value) {
    case 'untrusted':
    case 'basic':
    case 'trusted':
    case 'high-trust':
    case 'system':
      return value;
    default:
      return 'basic';
  }
}

function normalizeApprovalTier(value: unknown): PantavionApprovalTier {
  switch (value) {
    case 'none':
    case 'review':
    case 'admin':
    case 'security':
    case 'executive':
      return value;
    default:
      return 'review';
  }
}

function rolePolicyFor(roleKey: string, actorType: PantavionActorType): PantavionRolePolicy {
  const explicit = ROLE_POLICIES.find(
    (policy) => policy.roleKey === roleKey && policy.actorTypes.includes(actorType),
  );

  if (explicit) {
    return explicit;
  }

  const fallback =
    ROLE_POLICIES.find(
      (policy) => policy.roleKey === defaultRoleForActorType(actorType),
    ) ?? ROLE_POLICIES[0];

  return fallback;
}

function defaultRoleForActorType(actorType: PantavionActorType): string {
  switch (actorType) {
    case 'service':
      return 'service-runtime';
    case 'agent':
      return 'agent-runtime';
    default:
      return 'human-user';
  }
}

function deriveDefaultScopes(
  input: PantavionIdentityResolutionInput,
  includeGlobalScopeByDefault: boolean,
): PantavionScopeRef[] {
  const scopes: PantavionScopeRef[] = [];

  if (includeGlobalScopeByDefault) {
    scopes.push({ kind: 'global', id: 'global', label: 'Global' });
  }

  if (input.workspaceId) {
    scopes.push({
      kind: 'workspace',
      id: input.workspaceId,
      label: input.workspaceId,
    });
  }

  if (input.orgId) {
    scopes.push({
      kind: 'organization',
      id: input.orgId,
      label: input.orgId,
    });
  }

  if (input.projectId) {
    scopes.push({
      kind: 'project',
      id: input.projectId,
      label: input.projectId,
    });
  }

  for (const scopeId of ensureStringArray(input.scopes)) {
    scopes.push({
      kind: 'personal',
      id: scopeId,
      label: scopeId,
    });
  }

  return dedupeScopeRefs(scopes);
}

function dedupeScopeRefs(scopes: PantavionScopeRef[]): PantavionScopeRef[] {
  const seen = new Set<string>();
  const out: PantavionScopeRef[] = [];

  for (const scope of scopes) {
    const key = `${scope.kind}:${scope.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(scope);
  }

  return out;
}

function flattenScopeIds(scopes: PantavionScopeRef[]): string[] {
  return uniqStrings(scopes.map((scope) => scope.id));
}

export class PantavionIdentityModel {
  private readonly config: PantavionIdentityModelConfig;
  private readonly identities = new Map<string, PantavionIdentityRecord>();

  constructor(config: Partial<PantavionIdentityModelConfig> = {}) {
    this.config = {
      ...DEFAULT_IDENTITY_MODEL_CONFIG,
      ...config,
    };
  }

  registerIdentity(
    partial: Omit<
      PantavionIdentityRecord,
      'createdAt' | 'updatedAt' | 'roleGrants' | 'entitlementGrants' | 'defaultScopes'
    > & {
      defaultScopes?: PantavionScopeRef[];
      roleGrants?: PantavionRoleGrant[];
      entitlementGrants?: PantavionEntitlementGrant[];
    },
  ): PantavionIdentityRecord {
    const actorType = normalizeActorType(partial.actorType);
    const primaryRole = safeText(partial.primaryRole, defaultRoleForActorType(actorType));
    const rolePolicy = rolePolicyFor(primaryRole, actorType);
    const timestamp = nowIso();

    const record: PantavionIdentityRecord = {
      id: safeText(partial.id, createId('pid')),
      actorType,
      displayName: safeText(partial.displayName, primaryRole),
      handle: safeText(partial.handle) || undefined,
      primaryRole,
      trustTier: normalizeTrustTier(partial.trustTier ?? rolePolicy.defaultTrustTier),
      approvalTier: normalizeApprovalTier(
        partial.approvalTier ?? rolePolicy.defaultApprovalTier,
      ),
      status: partial.status ?? 'active',
      defaultScopes: dedupeScopeRefs(partial.defaultScopes ?? []),
      roleGrants: partial.roleGrants ?? [
        {
          roleKey: primaryRole,
          scopeIds: flattenScopeIds(partial.defaultScopes ?? []),
          grantedAt: timestamp,
          active: true,
        },
      ],
      entitlementGrants: partial.entitlementGrants ?? rolePolicy.defaultEntitlements.map((key) => ({
        entitlementKey: key,
        scopeIds: flattenScopeIds(partial.defaultScopes ?? []),
        grantedAt: timestamp,
        active: true,
      })),
      metadata: asRecord(partial.metadata),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.identities.set(record.id, record);
    return record;
  }

  getIdentity(identityId: string): PantavionIdentityRecord | null {
    return this.identities.get(identityId) ?? null;
  }

  listIdentities(): PantavionIdentityRecord[] {
    return [...this.identities.values()];
  }

  resolveIdentityPosture(
    input: PantavionIdentityResolutionInput,
  ): PantavionResolvedIdentityPosture {
    const actorType = normalizeActorType(input.actorType);
    const requestedRole = safeText(input.role, defaultRoleForActorType(actorType));
    const basePolicy = rolePolicyFor(requestedRole, actorType);
    const existing =
      input.actorId && this.identities.has(input.actorId)
        ? this.identities.get(input.actorId) ?? null
        : null;

    if (existing) {
      return this.resolveFromExisting(existing, input, basePolicy);
    }

    if (!this.config.enableProvisionalFallback) {
      return {
        resolved: false,
        provisional: false,
        actorId: input.actorId,
        actorType,
        effectiveRoles: [],
        effectiveScopes: [],
        trustTier: normalizeTrustTier(input.trustTierHint),
        approvalTier: 'review',
        entitlements: [],
        deniedRestrictions: ['identity-missing'],
        delegatedBy: input.delegatedBy,
        rationale: ['Identity not found and provisional fallback is disabled.'],
      };
    }

    return this.resolveProvisionally(input, basePolicy);
  }

  private resolveFromExisting(
    identity: PantavionIdentityRecord,
    input: PantavionIdentityResolutionInput,
    policy: PantavionRolePolicy,
  ): PantavionResolvedIdentityPosture {
    const activeRoleGrants = identity.roleGrants.filter((grant) => grant.active);
    const activeEntitlementGrants = identity.entitlementGrants.filter((grant) => grant.active);

    const effectiveRoles = uniqStrings([
      identity.primaryRole ?? policy.roleKey,
      ...activeRoleGrants.map((grant) => grant.roleKey),
      ...ensureStringArray(input.role),
    ]);

    const effectiveScopes = uniqStrings([
      ...flattenScopeIds(identity.defaultScopes),
      ...activeRoleGrants.flatMap((grant) => grant.scopeIds),
      ...activeEntitlementGrants.flatMap((grant) => grant.scopeIds),
      ...ensureStringArray(input.scopes),
      ...(input.workspaceId ? [input.workspaceId] : []),
      ...(input.orgId ? [input.orgId] : []),
      ...(input.projectId ? [input.projectId] : []),
      ...(this.config.includeGlobalScopeByDefault ? ['global'] : []),
    ]);

    const entitlements = uniqStrings([
      ...activeEntitlementGrants.map((grant) => grant.entitlementKey),
      ...policy.defaultEntitlements,
      ...(input.requestedSensitivity === 'restricted' ? ['review:required'] : []),
    ]);

    const deniedRestrictions = uniqStrings([
      ...policy.defaultRestrictions,
      ...(identity.status === 'restricted' ? ['identity-status-restricted'] : []),
      ...(identity.status === 'suspended' ? ['identity-status-suspended'] : []),
      ...(this.config.strictRestrictedSensitivity &&
      input.requestedSensitivity === 'restricted' &&
      identity.approvalTier === 'none'
        ? ['restricted-operation-without-approval']
        : []),
    ]);

    return {
      resolved: true,
      provisional: false,
      actorId: identity.id,
      actorType: identity.actorType,
      effectiveRoles,
      effectiveScopes,
      trustTier: identity.trustTier,
      approvalTier: identity.approvalTier,
      entitlements,
      deniedRestrictions,
      delegatedBy: input.delegatedBy,
      rationale: [
        'Resolved from canonical identity record.',
        `Primary role: ${identity.primaryRole ?? policy.roleKey}.`,
        `Trust tier: ${identity.trustTier}.`,
      ],
      identityRecord: identity,
    };
  }

  private resolveProvisionally(
    input: PantavionIdentityResolutionInput,
    policy: PantavionRolePolicy,
  ): PantavionResolvedIdentityPosture {
    const actorType = normalizeActorType(input.actorType);
    const trustTier =
      input.trustTierHint ??
      (actorType === 'service'
        ? 'system'
        : actorType === 'agent'
          ? 'trusted'
          : policy.defaultTrustTier);

    const approvalTier =
      input.requestedSensitivity === 'restricted'
        ? 'security'
        : policy.defaultApprovalTier;

    const effectiveScopes = uniqStrings([
      ...ensureStringArray(input.scopes),
      ...(input.workspaceId ? [input.workspaceId] : []),
      ...(input.orgId ? [input.orgId] : []),
      ...(input.projectId ? [input.projectId] : []),
      ...(this.config.includeGlobalScopeByDefault ? ['global'] : []),
    ]);

    const deniedRestrictions = uniqStrings([
      ...policy.defaultRestrictions,
      ...(this.config.strictRestrictedSensitivity &&
      input.requestedSensitivity === 'restricted'
        ? ['restricted-operation-requires-review']
        : []),
    ]);

    return {
      resolved: Boolean(input.actorId),
      provisional: true,
      actorId: input.actorId,
      actorType,
      effectiveRoles: uniqStrings([safeText(input.role, policy.roleKey)]),
      effectiveScopes,
      trustTier,
      approvalTier,
      entitlements: uniqStrings([
        ...policy.defaultEntitlements,
        ...(safeText(input.planKey) ? [`plan:${safeText(input.planKey)}`] : []),
      ]),
      deniedRestrictions,
      delegatedBy: input.delegatedBy,
      rationale: [
        'Resolved via provisional identity fallback.',
        'Canonical identity record not yet registered in identity model.',
      ],
    };
  }
}

export function createIdentityModel(
  config: Partial<PantavionIdentityModelConfig> = {},
): PantavionIdentityModel {
  return new PantavionIdentityModel(config);
}

export const identityModel = createIdentityModel();

export function resolveIdentityPosture(
  input: PantavionIdentityResolutionInput,
): PantavionResolvedIdentityPosture {
  return identityModel.resolveIdentityPosture(input);
}

export function registerIdentity(
  partial: Omit<
    PantavionIdentityRecord,
    'createdAt' | 'updatedAt' | 'roleGrants' | 'entitlementGrants' | 'defaultScopes'
  > & {
    defaultScopes?: PantavionScopeRef[];
    roleGrants?: PantavionRoleGrant[];
    entitlementGrants?: PantavionEntitlementGrant[];
  },
): PantavionIdentityRecord {
  return identityModel.registerIdentity(partial);
}
