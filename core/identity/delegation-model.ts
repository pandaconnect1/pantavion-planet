// core/identity/delegation-model.ts

import {
  type PantavionActorType,
  type PantavionApprovalTier,
  type PantavionResolvedIdentityPosture,
  type PantavionTrustTier,
} from './identity-model';

export type PantavionDelegationStatus =
  | 'draft'
  | 'active'
  | 'revoked'
  | 'expired'
  | 'rejected';

export type PantavionDelegationKind =
  | 'task'
  | 'workspace'
  | 'operational'
  | 'administrative'
  | 'security'
  | 'institutional'
  | 'emergency';

export type PantavionDelegationConstraint =
  | 'no-destructive-actions'
  | 'no-privilege-escalation'
  | 'approval-required'
  | 'time-bounded'
  | 'scope-bounded'
  | 'audit-required'
  | 'human-review-before-execution';

export interface PantavionDelegationMetadata {
  [key: string]: unknown;
}

export interface PantavionDelegationScope {
  scopeId: string;
  scopeLabel?: string;
}

export interface PantavionDelegationCapabilityGrant {
  capabilityKey: string;
  allowed: boolean;
}

export interface PantavionDelegationApprovalRequirement {
  tier: PantavionApprovalTier;
  reason: string;
}

export interface PantavionDelegationRecord {
  id: string;
  kind: PantavionDelegationKind;
  status: PantavionDelegationStatus;
  principalId: string;
  principalType: PantavionActorType;
  delegateId: string;
  delegateType: PantavionActorType;
  delegatedRoles: string[];
  delegatedEntitlements: string[];
  delegatedScopes: PantavionDelegationScope[];
  delegatedCapabilities: PantavionDelegationCapabilityGrant[];
  trustFloor: PantavionTrustTier;
  approvalTier: PantavionApprovalTier;
  constraints: PantavionDelegationConstraint[];
  rationale: string[];
  approvalRequirements: PantavionDelegationApprovalRequirement[];
  issuedAt: string;
  activatedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
  metadata: PantavionDelegationMetadata;
}

export interface PantavionDelegationCreateInput {
  kind?: PantavionDelegationKind;
  principalId: string;
  principalType?: PantavionActorType;
  delegateId: string;
  delegateType?: PantavionActorType;
  delegatedRoles?: string[];
  delegatedEntitlements?: string[];
  delegatedScopes?: PantavionDelegationScope[];
  delegatedCapabilities?: PantavionDelegationCapabilityGrant[];
  trustFloor?: PantavionTrustTier;
  approvalTier?: PantavionApprovalTier;
  constraints?: PantavionDelegationConstraint[];
  rationale?: string[];
  expiresAt?: string;
  metadata?: PantavionDelegationMetadata;
}

export interface PantavionDelegationRevokeInput {
  delegationId: string;
  revokedBy: string;
  reason?: string;
}

export interface PantavionDelegationResolutionInput {
  principal?: PantavionResolvedIdentityPosture | null;
  delegate?: PantavionResolvedIdentityPosture | null;
  delegateId?: string;
  scopeIds?: string[];
  capabilityKeys?: string[];
  requestedApprovalTier?: PantavionApprovalTier;
  currentTimeIso?: string;
}

export interface PantavionDelegationResolution {
  active: boolean;
  matchedDelegations: PantavionDelegationRecord[];
  effectiveRoles: string[];
  effectiveEntitlements: string[];
  effectiveScopes: string[];
  allowedCapabilities: string[];
  deniedReasons: string[];
  requiredApprovals: PantavionDelegationApprovalRequirement[];
  rationale: string[];
}

export interface PantavionDelegationModelConfig {
  requireExplicitExpiryForHighRisk: boolean;
  defaultExpiryHours: number;
  enforceAuditConstraintByDefault: boolean;
}

const DEFAULT_DELEGATION_CONFIG: PantavionDelegationModelConfig = {
  requireExplicitExpiryForHighRisk: true,
  defaultExpiryHours: 24,
  enforceAuditConstraintByDefault: true,
};

function nowIso(): string {
  return new Date().toISOString();
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
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

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function addHoursToIso(baseIso: string, hours: number): string {
  const date = new Date(baseIso);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function compareTrustTier(
  left: PantavionTrustTier,
  right: PantavionTrustTier,
): number {
  const order: PantavionTrustTier[] = [
    'untrusted',
    'basic',
    'trusted',
    'high-trust',
    'system',
  ];
  return order.indexOf(left) - order.indexOf(right);
}

function compareApprovalTier(
  left: PantavionApprovalTier,
  right: PantavionApprovalTier,
): number {
  const order: PantavionApprovalTier[] = [
    'none',
    'review',
    'admin',
    'security',
    'executive',
  ];
  return order.indexOf(left) - order.indexOf(right);
}

function dedupeScopes(scopes: PantavionDelegationScope[]): PantavionDelegationScope[] {
  const seen = new Set<string>();
  const out: PantavionDelegationScope[] = [];

  for (const scope of scopes) {
    const key = safeText(scope.scopeId);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({
      scopeId: key,
      scopeLabel: safeText(scope.scopeLabel) || undefined,
    });
  }

  return out;
}

function dedupeCapabilities(
  capabilities: PantavionDelegationCapabilityGrant[],
): PantavionDelegationCapabilityGrant[] {
  const map = new Map<string, PantavionDelegationCapabilityGrant>();

  for (const capability of capabilities) {
    const key = safeText(capability.capabilityKey);
    if (!key) {
      continue;
    }
    map.set(key, {
      capabilityKey: key,
      allowed: capability.allowed !== false,
    });
  }

  return [...map.values()];
}

function normalizeConstraints(
  constraints: PantavionDelegationConstraint[],
  enforceAudit: boolean,
): PantavionDelegationConstraint[] {
  const normalized = uniqStrings(constraints as string[]) as PantavionDelegationConstraint[];

  if (enforceAudit && !normalized.includes('audit-required')) {
    normalized.push('audit-required');
  }

  if (
    (normalized.includes('time-bounded') || normalized.includes('approval-required')) &&
    !normalized.includes('scope-bounded')
  ) {
    normalized.push('scope-bounded');
  }

  return normalized;
}

function requiresHighRiskControls(kind: PantavionDelegationKind): boolean {
  return (
    kind === 'administrative' ||
    kind === 'security' ||
    kind === 'institutional' ||
    kind === 'emergency'
  );
}

export class PantavionDelegationModel {
  private readonly config: PantavionDelegationModelConfig;
  private readonly delegations = new Map<string, PantavionDelegationRecord>();

  constructor(config: Partial<PantavionDelegationModelConfig> = {}) {
    this.config = {
      ...DEFAULT_DELEGATION_CONFIG,
      ...config,
    };
  }

  createDelegation(input: PantavionDelegationCreateInput): PantavionDelegationRecord {
    const issuedAt = nowIso();
    const kind = input.kind ?? 'task';
    const approvalTier = normalizeApprovalTier(
      input.approvalTier ?? (requiresHighRiskControls(kind) ? 'admin' : 'review'),
    );
    const trustFloor = normalizeTrustTier(
      input.trustFloor ?? (requiresHighRiskControls(kind) ? 'trusted' : 'basic'),
    );

    const constraints = normalizeConstraints(
      (input.constraints ?? []) as PantavionDelegationConstraint[],
      this.config.enforceAuditConstraintByDefault,
    );

    if (requiresHighRiskControls(kind) && !constraints.includes('approval-required')) {
      constraints.push('approval-required');
    }

    if (this.config.requireExplicitExpiryForHighRisk && requiresHighRiskControls(kind)) {
      if (!constraints.includes('time-bounded')) {
        constraints.push('time-bounded');
      }
    }

    const expiresAt =
      safeText(input.expiresAt) ||
      (constraints.includes('time-bounded')
        ? addHoursToIso(issuedAt, this.config.defaultExpiryHours)
        : undefined);

    const approvalRequirements: PantavionDelegationApprovalRequirement[] = [];
    if (approvalTier !== 'none') {
      approvalRequirements.push({
        tier: approvalTier,
        reason: `Delegation kind "${kind}" requires ${approvalTier} approval tier.`,
      });
    }

    const record: PantavionDelegationRecord = {
      id: createId('dlg'),
      kind,
      status: approvalTier === 'none' ? 'active' : 'draft',
      principalId: safeText(input.principalId),
      principalType: normalizeActorType(input.principalType),
      delegateId: safeText(input.delegateId),
      delegateType: normalizeActorType(input.delegateType),
      delegatedRoles: uniqStrings((input.delegatedRoles ?? []).map(String)),
      delegatedEntitlements: uniqStrings((input.delegatedEntitlements ?? []).map(String)),
      delegatedScopes: dedupeScopes(input.delegatedScopes ?? []),
      delegatedCapabilities: dedupeCapabilities(input.delegatedCapabilities ?? []),
      trustFloor,
      approvalTier,
      constraints,
      rationale: uniqStrings((input.rationale ?? []).map(String)),
      approvalRequirements,
      issuedAt,
      activatedAt: approvalTier === 'none' ? issuedAt : undefined,
      expiresAt: expiresAt || undefined,
      metadata: input.metadata ?? {},
    };

    if (record.rationale.length === 0) {
      record.rationale.push('Delegation created through canonical delegation model.');
    }

    this.delegations.set(record.id, record);
    return record;
  }

  activateDelegation(delegationId: string): PantavionDelegationRecord | null {
    const record = this.delegations.get(delegationId);
    if (!record) {
      return null;
    }

    if (record.status === 'revoked' || record.status === 'expired' || record.status === 'rejected') {
      return record;
    }

    record.status = 'active';
    record.activatedAt = nowIso();
    return record;
  }

  revokeDelegation(input: PantavionDelegationRevokeInput): PantavionDelegationRecord | null {
    const record = this.delegations.get(input.delegationId);
    if (!record) {
      return null;
    }

    record.status = 'revoked';
    record.revokedAt = nowIso();
    record.revokedBy = safeText(input.revokedBy);
    record.revokeReason = safeText(input.reason) || undefined;
    return record;
  }

  getDelegation(delegationId: string): PantavionDelegationRecord | null {
    return this.delegations.get(delegationId) ?? null;
  }

  listDelegations(): PantavionDelegationRecord[] {
    return [...this.delegations.values()];
  }

  listDelegationsForDelegate(delegateId: string): PantavionDelegationRecord[] {
    return [...this.delegations.values()].filter(
      (record) => record.delegateId === delegateId,
    );
  }

  resolveDelegation(
    input: PantavionDelegationResolutionInput,
  ): PantavionDelegationResolution {
    const currentTime = safeText(input.currentTimeIso, nowIso());
    const delegateId = safeText(input.delegateId, input.delegate?.actorId ?? '');
    const requestedScopeIds = uniqStrings((input.scopeIds ?? []).map(String));
    const requestedCapabilities = uniqStrings((input.capabilityKeys ?? []).map(String));
    const requestedApprovalTier = normalizeApprovalTier(input.requestedApprovalTier ?? 'none');

    const matchedDelegations = [...this.delegations.values()].filter((record) => {
      if (record.delegateId !== delegateId) {
        return false;
      }

      if (record.status !== 'active') {
        return false;
      }

      if (record.expiresAt && record.expiresAt < currentTime) {
        record.status = 'expired';
        return false;
      }

      if (input.principal?.actorId && record.principalId !== input.principal.actorId) {
        return false;
      }

      if (requestedScopeIds.length > 0) {
        const delegationScopeIds = record.delegatedScopes.map((scope) => scope.scopeId);
        const overlaps = requestedScopeIds.every((scopeId) =>
          delegationScopeIds.includes(scopeId),
        );
        if (!overlaps) {
          return false;
        }
      }

      if (requestedCapabilities.length > 0) {
        const allowedCapabilityKeys = record.delegatedCapabilities
          .filter((item) => item.allowed)
          .map((item) => item.capabilityKey);

        const missingRequestedCapability = requestedCapabilities.some(
          (capabilityKey) => !allowedCapabilityKeys.includes(capabilityKey),
        );

        if (missingRequestedCapability) {
          return false;
        }
      }

      return true;
    });

    const effectiveRoles = uniqStrings(
      matchedDelegations.flatMap((record) => record.delegatedRoles),
    );

    const effectiveEntitlements = uniqStrings(
      matchedDelegations.flatMap((record) => record.delegatedEntitlements),
    );

    const effectiveScopes = uniqStrings(
      matchedDelegations.flatMap((record) =>
        record.delegatedScopes.map((scope) => scope.scopeId),
      ),
    );

    const allowedCapabilities = uniqStrings(
      matchedDelegations.flatMap((record) =>
        record.delegatedCapabilities
          .filter((capability) => capability.allowed)
          .map((capability) => capability.capabilityKey),
      ),
    );

    const requiredApprovals: PantavionDelegationApprovalRequirement[] = [];
    const deniedReasons: string[] = [];
    const rationale: string[] = [];

    for (const delegation of matchedDelegations) {
      if (
        input.delegate &&
        compareTrustTier(input.delegate.trustTier, delegation.trustFloor) < 0
      ) {
        deniedReasons.push(
          `Delegate trust tier below delegation trust floor for ${delegation.id}.`,
        );
      }

      if (compareApprovalTier(requestedApprovalTier, delegation.approvalTier) < 0) {
        requiredApprovals.push({
          tier: delegation.approvalTier,
          reason: `Delegation ${delegation.id} requires ${delegation.approvalTier} approval tier.`,
        });
      }

      if (delegation.constraints.includes('no-destructive-actions')) {
        rationale.push(`Delegation ${delegation.id} excludes destructive actions.`);
      }

      if (delegation.constraints.includes('human-review-before-execution')) {
        requiredApprovals.push({
          tier: 'review',
          reason: `Delegation ${delegation.id} requires human review before execution.`,
        });
      }

      rationale.push(
        `Delegation ${delegation.id} matched for delegate ${delegation.delegateId}.`,
      );
    }

    if (matchedDelegations.length === 0) {
      deniedReasons.push('No active delegation matched the current request.');
    }

    return {
      active: matchedDelegations.length > 0 && deniedReasons.length === 0,
      matchedDelegations,
      effectiveRoles,
      effectiveEntitlements,
      effectiveScopes,
      allowedCapabilities,
      deniedReasons: uniqStrings(deniedReasons),
      requiredApprovals: dedupeApprovalRequirements(requiredApprovals),
      rationale: uniqStrings(rationale),
    };
  }
}

function dedupeApprovalRequirements(
  requirements: PantavionDelegationApprovalRequirement[],
): PantavionDelegationApprovalRequirement[] {
  const seen = new Set<string>();
  const out: PantavionDelegationApprovalRequirement[] = [];

  for (const requirement of requirements) {
    const key = `${requirement.tier}:${requirement.reason}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(requirement);
  }

  return out;
}

export function createDelegationModel(
  config: Partial<PantavionDelegationModelConfig> = {},
): PantavionDelegationModel {
  return new PantavionDelegationModel(config);
}

export const delegationModel = createDelegationModel();

export function createDelegation(
  input: PantavionDelegationCreateInput,
): PantavionDelegationRecord {
  return delegationModel.createDelegation(input);
}

export function activateDelegation(
  delegationId: string,
): PantavionDelegationRecord | null {
  return delegationModel.activateDelegation(delegationId);
}

export function revokeDelegation(
  input: PantavionDelegationRevokeInput,
): PantavionDelegationRecord | null {
  return delegationModel.revokeDelegation(input);
}

export function resolveDelegation(
  input: PantavionDelegationResolutionInput,
): PantavionDelegationResolution {
  return delegationModel.resolveDelegation(input);
}
