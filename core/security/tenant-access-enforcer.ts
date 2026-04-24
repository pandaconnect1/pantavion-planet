// core/security/tenant-access-enforcer.ts

export interface PantavionTenantAccessRequest {
  actorTenantId: string;
  targetTenantId: string;
  resourceType: 'memory' | 'thread' | 'export' | 'billing' | 'governance';
  founderOverride: boolean;
}

export interface PantavionTenantAccessDecision {
  resourceType: string;
  allowed: boolean;
  isolationStatus: 'isolated' | 'cross-tenant-blocked' | 'founder-override';
  reason: string;
}

export interface PantavionTenantAccessEnforcementSnapshot {
  generatedAt: string;
  evaluatedCount: number;
  isolatedAllowedCount: number;
  crossTenantBlockedCount: number;
  founderOverrideCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateTenantAccess(
  request: PantavionTenantAccessRequest,
): PantavionTenantAccessDecision {
  if (request.actorTenantId === request.targetTenantId) {
    return {
      resourceType: request.resourceType,
      allowed: true,
      isolationStatus: 'isolated',
      reason: 'Tenant boundary is preserved.',
    };
  }

  if (request.founderOverride && request.resourceType === 'governance') {
    return {
      resourceType: request.resourceType,
      allowed: true,
      isolationStatus: 'founder-override',
      reason: 'Founder override is permitted only for governance-class access.',
    };
  }

  return {
    resourceType: request.resourceType,
    allowed: false,
    isolationStatus: 'cross-tenant-blocked',
    reason: 'Cross-tenant access is blocked by default.',
  };
}

export function getTenantAccessEnforcementSnapshot(
  decisions: PantavionTenantAccessDecision[],
): PantavionTenantAccessEnforcementSnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    isolatedAllowedCount: decisions.filter((item) => item.isolationStatus === 'isolated').length,
    crossTenantBlockedCount: decisions.filter((item) => item.isolationStatus === 'cross-tenant-blocked').length,
    founderOverrideCount: decisions.filter((item) => item.isolationStatus === 'founder-override').length,
  };
}

export default evaluateTenantAccess;
