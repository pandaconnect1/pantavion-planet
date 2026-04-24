// core/continuity/identity-registry.ts

export interface PantavionIdentityRecord {
  accountId: string;
  identityClass: 'guest' | 'user' | 'professional' | 'elite' | 'operator' | 'founder';
  primaryLocale: string;
  accessibilityMode: 'standard' | 'enhanced' | 'simplified';
  verified: boolean;
  recoveryMethods: string[];
}

export interface PantavionIdentitySnapshot {
  generatedAt: string;
  identityCount: number;
  verifiedCount: number;
  accessibilityEnhancedCount: number;
  eliteOrHigherCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const IDENTITIES: PantavionIdentityRecord[] = [
  {
    accountId: 'acct_local_user_001',
    identityClass: 'user',
    primaryLocale: 'el',
    accessibilityMode: 'standard',
    verified: true,
    recoveryMethods: ['email', 'phone'],
  },
  {
    accountId: 'acct_pro_user_002',
    identityClass: 'professional',
    primaryLocale: 'en',
    accessibilityMode: 'enhanced',
    verified: true,
    recoveryMethods: ['email', 'authenticator', 'phone'],
  },
  {
    accountId: 'acct_elite_user_003',
    identityClass: 'elite',
    primaryLocale: 'ru',
    accessibilityMode: 'standard',
    verified: true,
    recoveryMethods: ['email', 'authenticator'],
  },
  {
    accountId: 'acct_founder_004',
    identityClass: 'founder',
    primaryLocale: 'el',
    accessibilityMode: 'standard',
    verified: true,
    recoveryMethods: ['email', 'authenticator', 'hardware-key'],
  },
];

export function listIdentities(): PantavionIdentityRecord[] {
  return IDENTITIES.map((item) => cloneValue(item));
}

export function getIdentitySnapshot(): PantavionIdentitySnapshot {
  const list = listIdentities();

  return {
    generatedAt: nowIso(),
    identityCount: list.length,
    verifiedCount: list.filter((item) => item.verified).length,
    accessibilityEnhancedCount: list.filter((item) => item.accessibilityMode !== 'standard').length,
    eliteOrHigherCount: list.filter((item) => item.identityClass === 'elite' || item.identityClass === 'operator' || item.identityClass === 'founder').length,
  };
}

export default listIdentities;
