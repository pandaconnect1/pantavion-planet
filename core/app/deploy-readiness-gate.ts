// core/app/deploy-readiness-gate.ts

import { evaluateSecretBoundary } from '../security/secret-boundary-enforcer';
import { evaluateIncidentLockdown } from '../security/incident-lockdown-hooks';

export interface PantavionDeployReadinessRequest {
  environmentKey: 'development' | 'staging' | 'production';
  founderApprovalPresent: boolean;
  observabilityReady: boolean;
  secretsRotationAgeDays: number;
  activeCriticalIncident: boolean;
}

export interface PantavionDeployReadinessDecision {
  environmentKey: string;
  allowed: boolean;
  blockedByIncident: boolean;
  requiresFounderApproval: boolean;
  requiresSecretRotation: boolean;
  reason: string;
}

export interface PantavionDeployReadinessSnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  incidentBlockedCount: number;
  founderApprovalRequiredCount: number;
  secretRotationRequiredCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateDeployReadiness(
  request: PantavionDeployReadinessRequest,
): PantavionDeployReadinessDecision {
  const secretDecision = evaluateSecretBoundary({
    secretKey: `${request.environmentKey}_deploy_secret`,
    environment: request.environmentKey,
    actorClass: 'server',
    rotationAgeDays: request.secretsRotationAgeDays,
  });

  const incidentDecision = evaluateIncidentLockdown({
    signalKey: `${request.environmentKey}_deploy_signal`,
    severity: request.activeCriticalIncident ? 'critical' : 'low',
    source: 'deploy-readiness-gate',
  });

  if (incidentDecision.lockdownTriggered) {
    return {
      environmentKey: request.environmentKey,
      allowed: false,
      blockedByIncident: true,
      requiresFounderApproval: request.environmentKey === 'production',
      requiresSecretRotation: secretDecision.requiresRotation,
      reason: 'Deployment blocked due to active critical incident posture.',
    };
  }

  if (request.environmentKey === 'production' && !request.founderApprovalPresent) {
    return {
      environmentKey: request.environmentKey,
      allowed: false,
      blockedByIncident: false,
      requiresFounderApproval: true,
      requiresSecretRotation: secretDecision.requiresRotation,
      reason: 'Production deploy requires founder approval.',
    };
  }

  if (!request.observabilityReady) {
    return {
      environmentKey: request.environmentKey,
      allowed: false,
      blockedByIncident: false,
      requiresFounderApproval: request.environmentKey === 'production',
      requiresSecretRotation: secretDecision.requiresRotation,
      reason: 'Deployment blocked until observability readiness is present.',
    };
  }

  if (secretDecision.requiresRotation && request.environmentKey === 'production') {
    return {
      environmentKey: request.environmentKey,
      allowed: false,
      blockedByIncident: false,
      requiresFounderApproval: true,
      requiresSecretRotation: true,
      reason: 'Production deploy blocked until secret rotation is completed.',
    };
  }

  return {
    environmentKey: request.environmentKey,
    allowed: true,
    blockedByIncident: false,
    requiresFounderApproval: request.environmentKey === 'production',
    requiresSecretRotation: secretDecision.requiresRotation,
    reason: 'Deployment readiness conditions are satisfied.',
  };
}

export function getDeployReadinessSnapshot(
  decisions: PantavionDeployReadinessDecision[],
): PantavionDeployReadinessSnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    allowedCount: decisions.filter((item) => item.allowed).length,
    blockedCount: decisions.filter((item) => !item.allowed).length,
    incidentBlockedCount: decisions.filter((item) => item.blockedByIncident).length,
    founderApprovalRequiredCount: decisions.filter((item) => item.requiresFounderApproval).length,
    secretRotationRequiredCount: decisions.filter((item) => item.requiresSecretRotation).length,
  };
}

export default evaluateDeployReadiness;
