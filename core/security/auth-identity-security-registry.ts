// core/security/auth-identity-security-registry.ts

export type PantavionIdentityZone =
  | 'end-user'
  | 'founder-admin'
  | 'operator-admin'
  | 'service-runtime'
  | 'background-worker';

export type PantavionAuthStrength =
  | 'standard'
  | 'strong'
  | 'critical';

export interface PantavionAuthIdentitySecurityRecord {
  identityKey: string;
  zone: PantavionIdentityZone;
  authStrength: PantavionAuthStrength;
  mfaRequired: boolean;
  deviceTrustRequired: boolean;
  sessionRevalidationRequired: boolean;
  notes: string[];
}

export interface PantavionAuthIdentitySecuritySnapshot {
  generatedAt: string;
  identityCount: number;
  mfaRequiredCount: number;
  deviceTrustRequiredCount: number;
  sessionRevalidationRequiredCount: number;
  criticalStrengthCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const AUTH_IDENTITY_RECORDS: PantavionAuthIdentitySecurityRecord[] = [
  {
    identityKey: 'end-user-session',
    zone: 'end-user',
    authStrength: 'strong',
    mfaRequired: false,
    deviceTrustRequired: true,
    sessionRevalidationRequired: true,
    notes: [
      'End-user sessions should be continuously re-evaluated.',
    ],
  },
  {
    identityKey: 'founder-admin-session',
    zone: 'founder-admin',
    authStrength: 'critical',
    mfaRequired: true,
    deviceTrustRequired: true,
    sessionRevalidationRequired: true,
    notes: [
      'Founder authority requires the strongest identity posture.',
    ],
  },
  {
    identityKey: 'operator-admin-session',
    zone: 'operator-admin',
    authStrength: 'critical',
    mfaRequired: true,
    deviceTrustRequired: true,
    sessionRevalidationRequired: true,
    notes: [
      'Operators must never rely on weak access posture.',
    ],
  },
  {
    identityKey: 'service-runtime-identity',
    zone: 'service-runtime',
    authStrength: 'critical',
    mfaRequired: false,
    deviceTrustRequired: false,
    sessionRevalidationRequired: true,
    notes: [
      'Service-to-service identities must be scoped and continuously validated.',
    ],
  },
  {
    identityKey: 'background-worker-identity',
    zone: 'background-worker',
    authStrength: 'strong',
    mfaRequired: false,
    deviceTrustRequired: false,
    sessionRevalidationRequired: true,
    notes: [
      'Background workers require non-human but tightly scoped identity.',
    ],
  },
];

export function listAuthIdentitySecurityRecords(): PantavionAuthIdentitySecurityRecord[] {
  return AUTH_IDENTITY_RECORDS.map((item) => cloneValue(item));
}

export function getAuthIdentitySecuritySnapshot(): PantavionAuthIdentitySecuritySnapshot {
  const list = listAuthIdentitySecurityRecords();

  return {
    generatedAt: nowIso(),
    identityCount: list.length,
    mfaRequiredCount: list.filter((item) => item.mfaRequired).length,
    deviceTrustRequiredCount: list.filter((item) => item.deviceTrustRequired).length,
    sessionRevalidationRequiredCount: list.filter((item) => item.sessionRevalidationRequired).length,
    criticalStrengthCount: list.filter((item) => item.authStrength === 'critical').length,
  };
}

export default listAuthIdentitySecurityRecords;
