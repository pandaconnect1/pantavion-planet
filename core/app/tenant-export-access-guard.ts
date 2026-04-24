// core/app/tenant-export-access-guard.ts

import type { PantavionAppRole } from './app-role-registry';

export interface PantavionTenantExportRequest {
  requesterRole: PantavionAppRole;
  requesterTenantId: string;
  exportOwnerTenantId: string;
  containsSensitiveMemory: boolean;
  founderOverride: boolean;
}

export interface PantavionTenantExportDecision {
  allowed: boolean;
  exportScope: 'self-export' | 'founder-governance-export' | 'blocked';
  reason: string;
}

export interface PantavionTenantExportGuardSnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  sensitiveBlockedCount: number;
  founderGovernanceExportCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateTenantExportAccess(
  request: PantavionTenantExportRequest,
): PantavionTenantExportDecision {
  if (
    request.requesterRole === 'founder' &&
    request.founderOverride &&
    request.requesterTenantId === 'tenant_founder'
  ) {
    return {
      allowed: true,
      exportScope: 'founder-governance-export',
      reason: 'Founder governance export is explicitly approved.',
    };
  }

  if (request.requesterTenantId === request.exportOwnerTenantId) {
    return {
      allowed: true,
      exportScope: 'self-export',
      reason: 'Tenant may export its own data.',
    };
  }

  if (request.containsSensitiveMemory) {
    return {
      allowed: false,
      exportScope: 'blocked',
      reason: 'Sensitive tenant memory may not be exported cross-tenant.',
    };
  }

  return {
    allowed: false,
    exportScope: 'blocked',
    reason: 'Cross-tenant export is blocked by default.',
  };
}

export function getTenantExportGuardSnapshot(
  decisions: PantavionTenantExportDecision[],
  requests: PantavionTenantExportRequest[],
): PantavionTenantExportGuardSnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    allowedCount: decisions.filter((item) => item.allowed).length,
    blockedCount: decisions.filter((item) => !item.allowed).length,
    sensitiveBlockedCount: decisions.filter(
      (item, index) => !item.allowed && requests[index]?.containsSensitiveMemory,
    ).length,
    founderGovernanceExportCount: decisions.filter(
      (item) => item.exportScope === 'founder-governance-export',
    ).length,
  };
}

export default evaluateTenantExportAccess;
