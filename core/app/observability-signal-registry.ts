// core/app/observability-signal-registry.ts

export type PantavionObservabilitySignalClass =
  | 'auth'
  | 'routing'
  | 'memory'
  | 'billing'
  | 'security'
  | 'deployment';

export interface PantavionObservabilitySignalRecord {
  signalKey: string;
  signalClass: PantavionObservabilitySignalClass;
  severity: 'info' | 'warning' | 'high' | 'critical';
  environmentKey: 'development' | 'staging' | 'production';
  founderVisible: boolean;
  notes: string[];
}

export interface PantavionObservabilitySignalSnapshot {
  generatedAt: string;
  signalCount: number;
  productionSignalCount: number;
  founderVisibleCount: number;
  highOrCriticalCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const OBSERVABILITY_SIGNALS: PantavionObservabilitySignalRecord[] = [
  {
    signalKey: 'auth_step_up_detected',
    signalClass: 'auth',
    severity: 'warning',
    environmentKey: 'production',
    founderVisible: false,
    notes: ['Step-up auth events should be visible in production telemetry.'],
  },
  {
    signalKey: 'routing_truth_mismatch',
    signalClass: 'routing',
    severity: 'high',
    environmentKey: 'production',
    founderVisible: true,
    notes: ['Canonical routing mismatches are founder-visible.'],
  },
  {
    signalKey: 'memory_cross_tenant_block',
    signalClass: 'memory',
    severity: 'high',
    environmentKey: 'production',
    founderVisible: true,
    notes: ['Cross-tenant memory blocks indicate meaningful security events.'],
  },
  {
    signalKey: 'billing_secret_rotation_due',
    signalClass: 'billing',
    severity: 'warning',
    environmentKey: 'production',
    founderVisible: true,
    notes: ['Billing secret posture should remain visible before expiry.'],
  },
  {
    signalKey: 'incident_lockdown_triggered',
    signalClass: 'security',
    severity: 'critical',
    environmentKey: 'production',
    founderVisible: true,
    notes: ['Critical lockdown must be founder-visible immediately.'],
  },
  {
    signalKey: 'staging_deploy_validation',
    signalClass: 'deployment',
    severity: 'info',
    environmentKey: 'staging',
    founderVisible: false,
    notes: ['Staging deployment validations remain part of rollout telemetry.'],
  },
];

export function listObservabilitySignals(): PantavionObservabilitySignalRecord[] {
  return OBSERVABILITY_SIGNALS.map((item) => cloneValue(item));
}

export function getObservabilitySignalSnapshot(): PantavionObservabilitySignalSnapshot {
  const list = listObservabilitySignals();

  return {
    generatedAt: nowIso(),
    signalCount: list.length,
    productionSignalCount: list.filter((item) => item.environmentKey === 'production').length,
    founderVisibleCount: list.filter((item) => item.founderVisible).length,
    highOrCriticalCount: list.filter((item) => item.severity === 'high' || item.severity === 'critical').length,
  };
}

export default listObservabilitySignals;
