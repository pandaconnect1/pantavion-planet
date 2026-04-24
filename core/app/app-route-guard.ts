// core/app/app-route-guard.ts

import { getAppRole, type PantavionAppRole } from './app-role-registry';
import { evaluateAuthSession } from '../security/auth-session-enforcement';
import { evaluatePermissionGate } from '../security/permission-gate';

export type PantavionAppRouteScope =
  | 'public'
  | 'self'
  | 'operator'
  | 'founder';

export interface PantavionAppRouteRequest {
  routeKey: string;
  actorId: string;
  actorRole: PantavionAppRole;
  tenantId: string;
  scope: PantavionAppRouteScope;
  deviceTrusted: boolean;
  mfaPresent: boolean;
  riskScore: number;
  sessionAgeMinutes: number;
}

export interface PantavionAppRouteDecision {
  routeKey: string;
  allowed: boolean;
  reason: string;
  permissionReason: string;
  sessionReason: string;
}

export interface PantavionAppRouteGuardSnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  founderRouteCount: number;
  operatorRouteCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapScopeToPermission(scope: PantavionAppRouteScope): 'self' | 'tenant' | 'governor' | 'founder' {
  switch (scope) {
    case 'public':
      return 'self';
    case 'self':
      return 'self';
    case 'operator':
      return 'governor';
    case 'founder':
      return 'founder';
  }
}

export function evaluateAppRoute(
  request: PantavionAppRouteRequest,
): PantavionAppRouteDecision {
  if (request.scope === 'public') {
    return {
      routeKey: request.routeKey,
      allowed: true,
      reason: 'Public route is readable without privileged access.',
      permissionReason: 'Public route bypassed permission gate.',
      sessionReason: 'Public route bypassed session gate.',
    };
  }

  const role = getAppRole(request.actorRole);

  if (!role) {
    return {
      routeKey: request.routeKey,
      allowed: false,
      reason: 'Unknown actor role.',
      permissionReason: 'Role lookup failed.',
      sessionReason: 'Role lookup failed.',
    };
  }

  const sessionDecision = evaluateAuthSession({
    sessionId: `${request.actorId}_${request.routeKey}`,
    actorId: request.actorId,
    zone: role.sessionZone,
    mfaPresent: request.mfaPresent,
    deviceTrusted: request.deviceTrusted,
    sessionAgeMinutes: request.sessionAgeMinutes,
    riskScore: request.riskScore,
  });

  const permissionDecision = evaluatePermissionGate({
    actorId: request.actorId,
    actorRole:
      request.actorRole === 'founder'
        ? 'founder'
        : request.actorRole === 'operator'
        ? 'operator'
        : request.actorRole === 'service'
        ? 'service'
        : 'user',
    scope: mapScopeToPermission(request.scope),
    actionKey: request.routeKey,
    humanApprovalPresent: request.actorRole === 'founder',
  });

  const allowed = sessionDecision.allowed && permissionDecision.allowed;

  return {
    routeKey: request.routeKey,
    allowed,
    reason: allowed
      ? 'Route access granted.'
      : 'Route access blocked by security integration.',
    permissionReason: permissionDecision.reason,
    sessionReason: sessionDecision.reason,
  };
}

export function getAppRouteGuardSnapshot(
  decisions: PantavionAppRouteDecision[],
  requests: PantavionAppRouteRequest[],
): PantavionAppRouteGuardSnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    allowedCount: decisions.filter((item) => item.allowed).length,
    blockedCount: decisions.filter((item) => !item.allowed).length,
    founderRouteCount: requests.filter((item) => item.scope === 'founder').length,
    operatorRouteCount: requests.filter((item) => item.scope === 'operator').length,
  };
}

export default evaluateAppRoute;
