// core/security/incident-lockdown-hooks.ts

export interface PantavionIncidentSignal {
  signalKey: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

export interface PantavionIncidentLockdownDecision {
  signalKey: string;
  lockdownTriggered: boolean;
  founderAlertRequired: boolean;
  sessionRevocationRequired: boolean;
  keyRotationRequired: boolean;
  reason: string;
}

export interface PantavionIncidentLockdownSnapshot {
  generatedAt: string;
  evaluatedCount: number;
  lockdownTriggeredCount: number;
  founderAlertRequiredCount: number;
  sessionRevocationRequiredCount: number;
  keyRotationRequiredCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateIncidentLockdown(
  signal: PantavionIncidentSignal,
): PantavionIncidentLockdownDecision {
  if (signal.severity === 'critical') {
    return {
      signalKey: signal.signalKey,
      lockdownTriggered: true,
      founderAlertRequired: true,
      sessionRevocationRequired: true,
      keyRotationRequired: true,
      reason: 'Critical signal triggers full founder-visible lockdown.',
    };
  }

  if (signal.severity === 'high') {
    return {
      signalKey: signal.signalKey,
      lockdownTriggered: true,
      founderAlertRequired: true,
      sessionRevocationRequired: true,
      keyRotationRequired: false,
      reason: 'High severity triggers lockdown and session revocation.',
    };
  }

  if (signal.severity === 'medium') {
    return {
      signalKey: signal.signalKey,
      lockdownTriggered: false,
      founderAlertRequired: false,
      sessionRevocationRequired: false,
      keyRotationRequired: false,
      reason: 'Medium severity is monitored without lockdown.',
    };
  }

  return {
    signalKey: signal.signalKey,
    lockdownTriggered: false,
    founderAlertRequired: false,
    sessionRevocationRequired: false,
    keyRotationRequired: false,
    reason: 'Low severity is observed only.',
  };
}

export function getIncidentLockdownSnapshot(
  decisions: PantavionIncidentLockdownDecision[],
): PantavionIncidentLockdownSnapshot {
  return {
    generatedAt: nowIso(),
    evaluatedCount: decisions.length,
    lockdownTriggeredCount: decisions.filter((item) => item.lockdownTriggered).length,
    founderAlertRequiredCount: decisions.filter((item) => item.founderAlertRequired).length,
    sessionRevocationRequiredCount: decisions.filter((item) => item.sessionRevocationRequired).length,
    keyRotationRequiredCount: decisions.filter((item) => item.keyRotationRequired).length,
  };
}

export default evaluateIncidentLockdown;
