// core/security/secrets-key-management-policy.ts

export interface PantavionSecretsKeyManagementRecord {
  controlKey: string;
  title: string;
  rotationRequired: boolean;
  environmentSeparated: boolean;
  serverOnlyExposure: boolean;
  breakglassRestricted: boolean;
  notes: string[];
}

export interface PantavionSecretsKeyManagementSnapshot {
  generatedAt: string;
  controlCount: number;
  rotationRequiredCount: number;
  environmentSeparatedCount: number;
  serverOnlyExposureCount: number;
  breakglassRestrictedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const SECRETS_POLICIES: PantavionSecretsKeyManagementRecord[] = [
  {
    controlKey: 'env-secret-separation',
    title: 'Environment Secret Separation',
    rotationRequired: true,
    environmentSeparated: true,
    serverOnlyExposure: true,
    breakglassRestricted: true,
    notes: ['Dev, staging and production secrets must remain separate.'],
  },
  {
    controlKey: 'provider-api-key-rotation',
    title: 'Provider API Key Rotation',
    rotationRequired: true,
    environmentSeparated: true,
    serverOnlyExposure: true,
    breakglassRestricted: true,
    notes: ['Provider keys must rotate and never be exposed client-side.'],
  },
  {
    controlKey: 'billing-secret-hardening',
    title: 'Billing Secret Hardening',
    rotationRequired: true,
    environmentSeparated: true,
    serverOnlyExposure: true,
    breakglassRestricted: true,
    notes: ['Commercial rails require especially strict secret handling.'],
  },
  {
    controlKey: 'founder-breakglass-control',
    title: 'Founder Breakglass Control',
    rotationRequired: true,
    environmentSeparated: true,
    serverOnlyExposure: true,
    breakglassRestricted: true,
    notes: ['Emergency access must be rare, auditable and founder-controlled.'],
  },
];

export function listSecretsKeyManagementPolicies(): PantavionSecretsKeyManagementRecord[] {
  return SECRETS_POLICIES.map((item) => cloneValue(item));
}

export function getSecretsKeyManagementSnapshot(): PantavionSecretsKeyManagementSnapshot {
  const list = listSecretsKeyManagementPolicies();

  return {
    generatedAt: nowIso(),
    controlCount: list.length,
    rotationRequiredCount: list.filter((item) => item.rotationRequired).length,
    environmentSeparatedCount: list.filter((item) => item.environmentSeparated).length,
    serverOnlyExposureCount: list.filter((item) => item.serverOnlyExposure).length,
    breakglassRestrictedCount: list.filter((item) => item.breakglassRestricted).length,
  };
}

export default listSecretsKeyManagementPolicies;
