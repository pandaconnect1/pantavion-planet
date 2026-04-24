// core/app/vercel-public-deploy-gate.ts

import type { PantavionSurfaceVisibility } from './product-surface-registry';
import { evaluateDeployReadiness } from './deploy-readiness-gate';

export interface PantavionVercelDeployRequest {
  requestKey: string;
  surfaceKey: string;
  environmentKey: 'development' | 'staging' | 'production';
  visibility: PantavionSurfaceVisibility;
  founderApprovalPresent: boolean;
  observabilityReady: boolean;
  secretsRotationAgeDays: number;
  activeCriticalIncident: boolean;
}

export interface PantavionVercelDeployDecision {
  requestKey: string;
  surfaceKey: string;
  deployAllowed: boolean;
  publicExposureAllowed: boolean;
  authGatedDeployAllowed: boolean;
  reason: string;
}

export interface PantavionVercelDeploySnapshot {
  generatedAt: string;
  evaluatedCount: number;
  deployAllowedCount: number;
  blockedCount: number;
  publicExposureAllowedCount: number;
  authGatedDeployAllowedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateVercelPublicDeploy(
  request: PantavionVercelDeployRequest,
): PantavionVercelDeployDecision {
  const readiness = evaluateDeployReadiness({
    environmentKey: request.environmentKey,
    founderApprovalPresent: request.founderApprovalPresent,
    observabilityReady: request.observabilityReady,
    secretsRotationAgeDays: request.secretsRotationAgeDays,
    activeCriticalIncident: request.activeCriticalIncident,
  });

  if (!readiness.allowed) {
    return {
      requestKey: request.requestKey,
      surfaceKey: request.surfaceKey,
      deployAllowed: false,
      publicExposureAllowed: false,
      authGatedDeployAllowed: false,
      reason: readiness.reason,
    };
  }

  if (request.environmentKey !== 'production') {
    return {
      requestKey: request.requestKey,
      surfaceKey: request.surfaceKey,
      deployAllowed: true,
      publicExposureAllowed: false,
      authGatedDeployAllowed: true,
      reason: 'Non-production deploy is allowed but not publicly exposed.',
    };
  }

  if (request.visibility === 'public') {
    return {
      requestKey: request.requestKey,
      surfaceKey: request.surfaceKey,
      deployAllowed: true,
      publicExposureAllowed: true,
      authGatedDeployAllowed: true,
      reason: 'Public production surface may be exposed on Vercel.',
    };
  }

  return {
    requestKey: request.requestKey,
    surfaceKey: request.surfaceKey,
    deployAllowed: true,
    publicExposureAllowed: false,
    authGatedDeployAllowed: true,
    reason: 'Protected production surface may deploy behind auth gates.',
  };
}

export function getVercelDeploySnapshot(
  decisions: PantavionVercelDeployDecision[],
): PantavionVercelDeploySnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    deployAllowedCount: decisions.filter((item) => item.deployAllowed).length,
    blockedCount: decisions.filter((item) => !item.deployAllowed).length,
    publicExposureAllowedCount: decisions.filter((item) => item.publicExposureAllowed).length,
    authGatedDeployAllowedCount: decisions.filter((item) => item.authGatedDeployAllowed).length,
  };
}

export default evaluateVercelPublicDeploy;
