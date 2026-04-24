// core/app/public-surface-access-gate.ts

import type { PantavionAppRole } from './app-role-registry';
import type { PantavionSurfaceVisibility } from './product-surface-registry';

export interface PantavionSurfaceAccessRequest {
  surfaceKey: string;
  roleKey: PantavionAppRole;
  visibility: PantavionSurfaceVisibility;
  isAuthenticated: boolean;
}

export interface PantavionSurfaceAccessDecision {
  surfaceKey: string;
  allowed: boolean;
  authRequired: boolean;
  reason: string;
}

export interface PantavionSurfaceAccessSnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  authRequiredCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateSurfaceAccess(
  request: PantavionSurfaceAccessRequest,
): PantavionSurfaceAccessDecision {
  if (request.visibility === 'public') {
    return {
      surfaceKey: request.surfaceKey,
      allowed: true,
      authRequired: false,
      reason: 'Public surface is readable by everyone.',
    };
  }

  if (!request.isAuthenticated) {
    return {
      surfaceKey: request.surfaceKey,
      allowed: false,
      authRequired: true,
      reason: 'Authentication is required for this surface.',
    };
  }

  if (request.visibility === 'authenticated') {
    return {
      surfaceKey: request.surfaceKey,
      allowed: request.roleKey !== 'guest',
      authRequired: true,
      reason:
        request.roleKey !== 'guest'
          ? 'Authenticated user may access this surface.'
          : 'Guest may not access authenticated surface.',
    };
  }

  if (request.visibility === 'operator') {
    return {
      surfaceKey: request.surfaceKey,
      allowed: request.roleKey === 'operator' || request.roleKey === 'founder',
      authRequired: true,
      reason:
        request.roleKey === 'operator' || request.roleKey === 'founder'
          ? 'Operator or founder access granted.'
          : 'Only operator/founder may access this surface.',
    };
  }

  return {
    surfaceKey: request.surfaceKey,
    allowed: request.roleKey === 'founder',
    authRequired: true,
    reason:
      request.roleKey === 'founder'
        ? 'Founder access granted.'
        : 'Only founder may access this surface.',
  };
}

export function getSurfaceAccessSnapshot(
  decisions: PantavionSurfaceAccessDecision[],
): PantavionSurfaceAccessSnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    allowedCount: decisions.filter((item) => item.allowed).length,
    blockedCount: decisions.filter((item) => !item.allowed).length,
    authRequiredCount: decisions.filter((item) => item.authRequired).length,
  };
}

export default evaluateSurfaceAccess;
