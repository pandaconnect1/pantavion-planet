// core/security/permission-gate.ts

export type PantavionPermissionScope =
  | 'self'
  | 'tenant'
  | 'governor'
  | 'founder';

export interface PantavionPermissionRequest {
  actorId: string;
  actorRole: 'user' | 'founder' | 'operator' | 'service';
  scope: PantavionPermissionScope;
  actionKey: string;
  humanApprovalPresent: boolean;
}

export interface PantavionPermissionDecision {
  actionKey: string;
  allowed: boolean;
  reason: string;
}

export interface PantavionPermissionGateSnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  founderScopedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluatePermissionGate(
  request: PantavionPermissionRequest,
): PantavionPermissionDecision {
  if (request.scope === 'founder' && request.actorRole !== 'founder') {
    return {
      actionKey: request.actionKey,
      allowed: false,
      reason: 'Founder-scoped actions are blocked for non-founder actors.',
    };
  }

  if (request.scope === 'founder' && !request.humanApprovalPresent) {
    return {
      actionKey: request.actionKey,
      allowed: false,
      reason: 'Founder-scoped actions require explicit human approval.',
    };
  }

  if (request.scope === 'governor' && request.actorRole === 'user') {
    return {
      actionKey: request.actionKey,
      allowed: false,
      reason: 'User role may not execute governor-scoped actions.',
    };
  }

  if (request.scope === 'tenant' && request.actorRole === 'service') {
    return {
      actionKey: request.actionKey,
      allowed: false,
      reason: 'Service role may not directly execute tenant-level actions without a tenant-bound delegate.',
    };
  }

  return {
    actionKey: request.actionKey,
    allowed: true,
    reason: 'Permission gate conditions are satisfied.',
  };
}

export function getPermissionGateSnapshot(
  decisions: PantavionPermissionDecision[],
  requests: PantavionPermissionRequest[],
): PantavionPermissionGateSnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    allowedCount: decisions.filter((item) => item.allowed).length,
    blockedCount: decisions.filter((item) => !item.allowed).length,
    founderScopedCount: requests.filter((item) => item.scope === 'founder').length,
  };
}

export default evaluatePermissionGate;
