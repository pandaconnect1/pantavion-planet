// core/security/audit-integrity-policy.ts

export interface PantavionAuditIntegrityRecord {
  policyKey: string;
  title: string;
  appendOnlyRequired: boolean;
  tamperEvidenceRequired: boolean;
  lineageRequired: boolean;
  founderEmergencyLockSupported: boolean;
  notes: string[];
}

export interface PantavionAuditIntegritySnapshot {
  generatedAt: string;
  policyCount: number;
  appendOnlyRequiredCount: number;
  tamperEvidenceRequiredCount: number;
  lineageRequiredCount: number;
  founderEmergencyLockSupportedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const AUDIT_INTEGRITY_POLICIES: PantavionAuditIntegrityRecord[] = [
  {
    policyKey: 'append-only-audit-ledger',
    title: 'Append Only Audit Ledger',
    appendOnlyRequired: true,
    tamperEvidenceRequired: true,
    lineageRequired: true,
    founderEmergencyLockSupported: false,
    notes: ['Audit history must not be silently rewritten.'],
  },
  {
    policyKey: 'kernel-lineage-verification',
    title: 'Kernel Lineage Verification',
    appendOnlyRequired: true,
    tamperEvidenceRequired: true,
    lineageRequired: true,
    founderEmergencyLockSupported: false,
    notes: ['Kernel evolution requires verifiable lineage continuity.'],
  },
  {
    policyKey: 'founder-emergency-lock',
    title: 'Founder Emergency Lock',
    appendOnlyRequired: true,
    tamperEvidenceRequired: true,
    lineageRequired: true,
    founderEmergencyLockSupported: true,
    notes: ['Founder must be able to trigger emergency lock and preserve forensics.'],
  },
];

export function listAuditIntegrityPolicies(): PantavionAuditIntegrityRecord[] {
  return AUDIT_INTEGRITY_POLICIES.map((item) => cloneValue(item));
}

export function getAuditIntegritySnapshot(): PantavionAuditIntegritySnapshot {
  const list = listAuditIntegrityPolicies();

  return {
    generatedAt: nowIso(),
    policyCount: list.length,
    appendOnlyRequiredCount: list.filter((item) => item.appendOnlyRequired).length,
    tamperEvidenceRequiredCount: list.filter((item) => item.tamperEvidenceRequired).length,
    lineageRequiredCount: list.filter((item) => item.lineageRequired).length,
    founderEmergencyLockSupportedCount: list.filter((item) => item.founderEmergencyLockSupported).length,
  };
}

export default listAuditIntegrityPolicies;
