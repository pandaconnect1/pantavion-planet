// core/security/runtime-abuse-protection-policy.ts

export interface PantavionRuntimeAbuseProtectionRecord {
  policyKey: string;
  title: string;
  rateLimitRequired: boolean;
  anomalyDetectionRequired: boolean;
  bruteForceResistanceRequired: boolean;
  replayProtectionRequired: boolean;
  notes: string[];
}

export interface PantavionRuntimeAbuseProtectionSnapshot {
  generatedAt: string;
  policyCount: number;
  rateLimitRequiredCount: number;
  anomalyDetectionRequiredCount: number;
  bruteForceResistanceRequiredCount: number;
  replayProtectionRequiredCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const RUNTIME_ABUSE_POLICIES: PantavionRuntimeAbuseProtectionRecord[] = [
  {
    policyKey: 'auth-bruteforce-defense',
    title: 'Auth Brute Force Defense',
    rateLimitRequired: true,
    anomalyDetectionRequired: true,
    bruteForceResistanceRequired: true,
    replayProtectionRequired: true,
    notes: ['Authentication paths require aggressive abuse controls.'],
  },
  {
    policyKey: 'api-enumeration-defense',
    title: 'API Enumeration Defense',
    rateLimitRequired: true,
    anomalyDetectionRequired: true,
    bruteForceResistanceRequired: true,
    replayProtectionRequired: false,
    notes: ['Enumeration attempts should be slowed, scored and blocked.'],
  },
  {
    policyKey: 'billing-rail-abuse-defense',
    title: 'Billing Rail Abuse Defense',
    rateLimitRequired: true,
    anomalyDetectionRequired: true,
    bruteForceResistanceRequired: true,
    replayProtectionRequired: true,
    notes: ['Commercial flows require replay and abuse resistance.'],
  },
];

export function listRuntimeAbuseProtectionPolicies(): PantavionRuntimeAbuseProtectionRecord[] {
  return RUNTIME_ABUSE_POLICIES.map((item) => cloneValue(item));
}

export function getRuntimeAbuseProtectionSnapshot(): PantavionRuntimeAbuseProtectionSnapshot {
  const list = listRuntimeAbuseProtectionPolicies();

  return {
    generatedAt: nowIso(),
    policyCount: list.length,
    rateLimitRequiredCount: list.filter((item) => item.rateLimitRequired).length,
    anomalyDetectionRequiredCount: list.filter((item) => item.anomalyDetectionRequired).length,
    bruteForceResistanceRequiredCount: list.filter((item) => item.bruteForceResistanceRequired).length,
    replayProtectionRequiredCount: list.filter((item) => item.replayProtectionRequired).length,
  };
}

export default listRuntimeAbuseProtectionPolicies;
