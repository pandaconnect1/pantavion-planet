// core/security/incident-recovery-policy.ts

export interface PantavionIncidentRecoveryRecord {
  policyKey: string;
  title: string;
  keyRotationPlaybookRequired: boolean;
  sessionRevocationRequired: boolean;
  backupRestoreValidationRequired: boolean;
  founderEmergencyModeSupported: boolean;
  notes: string[];
}

export interface PantavionIncidentRecoverySnapshot {
  generatedAt: string;
  policyCount: number;
  keyRotationPlaybookRequiredCount: number;
  sessionRevocationRequiredCount: number;
  backupRestoreValidationRequiredCount: number;
  founderEmergencyModeSupportedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const INCIDENT_RECOVERY_POLICIES: PantavionIncidentRecoveryRecord[] = [
  {
    policyKey: 'compromised-key-rotation',
    title: 'Compromised Key Rotation',
    keyRotationPlaybookRequired: true,
    sessionRevocationRequired: true,
    backupRestoreValidationRequired: false,
    founderEmergencyModeSupported: true,
    notes: ['Compromised keys require fast rotation and revocation.'],
  },
  {
    policyKey: 'memory-restore-validation',
    title: 'Memory Restore Validation',
    keyRotationPlaybookRequired: false,
    sessionRevocationRequired: false,
    backupRestoreValidationRequired: true,
    founderEmergencyModeSupported: false,
    notes: ['Memory recovery must be validated, not assumed.'],
  },
  {
    policyKey: 'platform-incident-lockdown',
    title: 'Platform Incident Lockdown',
    keyRotationPlaybookRequired: true,
    sessionRevocationRequired: true,
    backupRestoreValidationRequired: true,
    founderEmergencyModeSupported: true,
    notes: ['High-severity incidents require founder-visible lockdown capability.'],
  },
];

export function listIncidentRecoveryPolicies(): PantavionIncidentRecoveryRecord[] {
  return INCIDENT_RECOVERY_POLICIES.map((item) => cloneValue(item));
}

export function getIncidentRecoverySnapshot(): PantavionIncidentRecoverySnapshot {
  const list = listIncidentRecoveryPolicies();

  return {
    generatedAt: nowIso(),
    policyCount: list.length,
    keyRotationPlaybookRequiredCount: list.filter((item) => item.keyRotationPlaybookRequired).length,
    sessionRevocationRequiredCount: list.filter((item) => item.sessionRevocationRequired).length,
    backupRestoreValidationRequiredCount: list.filter((item) => item.backupRestoreValidationRequired).length,
    founderEmergencyModeSupportedCount: list.filter((item) => item.founderEmergencyModeSupported).length,
  };
}

export function listIncidentRecoveryPoliciesSummary(): PantavionIncidentRecoveryRecord[] {
  return listIncidentRecoveryPolicies();
}

export default listIncidentRecoveryPolicies;
