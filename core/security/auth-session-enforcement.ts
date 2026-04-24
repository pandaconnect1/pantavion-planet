// core/security/auth-session-enforcement.ts

export type PantavionSessionZone =
  | 'end-user'
  | 'founder-admin'
  | 'operator-admin'
  | 'service-runtime'
  | 'background-worker';

export interface PantavionAuthSessionContext {
  sessionId: string;
  actorId: string;
  zone: PantavionSessionZone;
  mfaPresent: boolean;
  deviceTrusted: boolean;
  sessionAgeMinutes: number;
  riskScore: number;
}

export interface PantavionAuthSessionDecision {
  sessionId: string;
  allowed: boolean;
  requiresStepUp: boolean;
  requiresRevalidation: boolean;
  reason: string;
}

export interface PantavionAuthSessionEnforcementSnapshot {
  generatedAt: string;
  evaluatedCount: number;
  allowedCount: number;
  blockedCount: number;
  stepUpCount: number;
  revalidationCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateAuthSession(
  context: PantavionAuthSessionContext,
): PantavionAuthSessionDecision {
  if ((context.zone === 'founder-admin' || context.zone === 'operator-admin') && !context.mfaPresent) {
    return {
      sessionId: context.sessionId,
      allowed: false,
      requiresStepUp: true,
      requiresRevalidation: true,
      reason: 'Privileged zones require MFA.',
    };
  }

  if ((context.zone === 'founder-admin' || context.zone === 'end-user') && !context.deviceTrusted) {
    return {
      sessionId: context.sessionId,
      allowed: false,
      requiresStepUp: true,
      requiresRevalidation: true,
      reason: 'Untrusted device is blocked for this session zone.',
    };
  }

  if (context.sessionAgeMinutes >= 240) {
    return {
      sessionId: context.sessionId,
      allowed: false,
      requiresStepUp: false,
      requiresRevalidation: true,
      reason: 'Session exceeded maximum trusted age.',
    };
  }

  if (context.riskScore >= 80) {
    return {
      sessionId: context.sessionId,
      allowed: false,
      requiresStepUp: true,
      requiresRevalidation: true,
      reason: 'Session risk score is too high.',
    };
  }

  if (context.riskScore >= 50) {
    return {
      sessionId: context.sessionId,
      allowed: true,
      requiresStepUp: true,
      requiresRevalidation: false,
      reason: 'Session is allowed only with step-up controls.',
    };
  }

  return {
    sessionId: context.sessionId,
    allowed: true,
    requiresStepUp: false,
    requiresRevalidation: false,
    reason: 'Session satisfies enforcement requirements.',
  };
}

export function getAuthSessionEnforcementSnapshot(
  decisions: PantavionAuthSessionDecision[],
): PantavionAuthSessionEnforcementSnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    allowedCount: decisions.filter((item) => item.allowed).length,
    blockedCount: decisions.filter((item) => !item.allowed).length,
    stepUpCount: decisions.filter((item) => item.requiresStepUp).length,
    revalidationCount: decisions.filter((item) => item.requiresRevalidation).length,
  };
}

export default evaluateAuthSession;
