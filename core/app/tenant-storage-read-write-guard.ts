// core/app/tenant-storage-read-write-guard.ts

import type { PantavionAppRole } from './app-role-registry';
import type { PantavionStorageClass } from './tenant-storage-partition-registry';

export type PantavionStorageOperation =
  | 'read'
  | 'write'
  | 'export';

export interface PantavionTenantStorageAccessRequest {
  actorId: string;
  actorRole: PantavionAppRole;
  actorTenantId: string;
  targetTenantId: string;
  storageClass: PantavionStorageClass;
  operation: PantavionStorageOperation;
  founderOverride: boolean;
}

export interface PantavionTenantStorageAccessDecision {
  storageClass: PantavionStorageClass;
  operation: PantavionStorageOperation;
  allowed: boolean;
  reason: string;
}

export interface PantavionTenantStorageGuardSnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  founderOverrideCount: number;
  exportAllowedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateTenantStorageAccess(
  request: PantavionTenantStorageAccessRequest,
): PantavionTenantStorageAccessDecision {
  if (request.storageClass === 'governance-domain') {
    if (request.actorRole === 'founder' && request.founderOverride) {
      return {
        storageClass: request.storageClass,
        operation: request.operation,
        allowed: true,
        reason: 'Founder override is required and present for governance domain access.',
      };
    }

    return {
      storageClass: request.storageClass,
      operation: request.operation,
      allowed: false,
      reason: 'Governance domain is founder-only.',
    };
  }

  if (request.actorTenantId !== request.targetTenantId) {
    return {
      storageClass: request.storageClass,
      operation: request.operation,
      allowed: false,
      reason: 'Cross-tenant storage access is blocked by default.',
    };
  }

  if (request.operation === 'write' && request.actorRole === 'guest') {
    return {
      storageClass: request.storageClass,
      operation: request.operation,
      allowed: false,
      reason: 'Guest actors may not write tenant storage.',
    };
  }

  if (request.operation === 'export' && request.actorRole === 'service') {
    return {
      storageClass: request.storageClass,
      operation: request.operation,
      allowed: false,
      reason: 'Service actors may not directly export tenant data.',
    };
  }

  return {
    storageClass: request.storageClass,
    operation: request.operation,
    allowed: true,
    reason: 'Tenant storage access satisfies isolation rules.',
  };
}

export function getTenantStorageGuardSnapshot(
  decisions: PantavionTenantStorageAccessDecision[],
  requests: PantavionTenantStorageAccessRequest[],
): PantavionTenantStorageGuardSnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    allowedCount: decisions.filter((item) => item.allowed).length,
    blockedCount: decisions.filter((item) => !item.allowed).length,
    founderOverrideCount: requests.filter((item) => item.founderOverride).length,
    exportAllowedCount: decisions.filter((item) => item.allowed && item.operation === 'export').length,
  };
}

export default evaluateTenantStorageAccess;
