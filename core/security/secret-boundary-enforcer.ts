// core/security/secret-boundary-enforcer.ts

export interface PantavionSecretAccessRequest {
  secretKey: string;
  environment: 'development' | 'staging' | 'production';
  actorClass: 'server' | 'client' | 'worker' | 'founder-breakglass';
  rotationAgeDays: number;
}

export interface PantavionSecretAccessDecision {
  secretKey: string;
  allowed: boolean;
  requiresRotation: boolean;
  reason: string;
}

export interface PantavionSecretBoundarySnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  requiresRotationCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateSecretBoundary(
  request: PantavionSecretAccessRequest,
): PantavionSecretAccessDecision {
  if (request.actorClass === 'client') {
    return {
      secretKey: request.secretKey,
      allowed: false,
      requiresRotation: false,
      reason: 'Secrets may never be exposed to client-side actors.',
    };
  }

  if (request.environment === 'production' && request.actorClass === 'founder-breakglass') {
    return {
      secretKey: request.secretKey,
      allowed: true,
      requiresRotation: true,
      reason: 'Breakglass access is allowed only as emergency access and should trigger rotation.',
    };
  }

  if (request.rotationAgeDays >= 90) {
    return {
      secretKey: request.secretKey,
      allowed: true,
      requiresRotation: true,
      reason: 'Secret is usable but should rotate immediately.',
    };
  }

  return {
    secretKey: request.secretKey,
    allowed: true,
    requiresRotation: false,
    reason: 'Secret boundary conditions are satisfied.',
  };
}

export function getSecretBoundarySnapshot(
  decisions: PantavionSecretAccessDecision[],
): PantavionSecretBoundarySnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    allowedCount: decisions.filter((item) => item.allowed).length,
    blockedCount: decisions.filter((item) => !item.allowed).length,
    requiresRotationCount: decisions.filter((item) => item.requiresRotation).length,
  };
}

export default evaluateSecretBoundary;
