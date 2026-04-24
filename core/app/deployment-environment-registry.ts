// core/app/deployment-environment-registry.ts

export type PantavionDeploymentEnvironment =
  | 'development'
  | 'staging'
  | 'production';

export interface PantavionDeploymentEnvironmentRecord {
  environmentKey: PantavionDeploymentEnvironment;
  publicSurfaceEnabled: boolean;
  secretsIsolated: boolean;
  observabilityRequired: boolean;
  founderDeployApprovalRequired: boolean;
  notes: string[];
}

export interface PantavionDeploymentEnvironmentSnapshot {
  generatedAt: string;
  environmentCount: number;
  publicSurfaceEnabledCount: number;
  secretsIsolatedCount: number;
  observabilityRequiredCount: number;
  founderDeployApprovalRequiredCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const DEPLOYMENT_ENVIRONMENTS: PantavionDeploymentEnvironmentRecord[] = [
  {
    environmentKey: 'development',
    publicSurfaceEnabled: false,
    secretsIsolated: true,
    observabilityRequired: false,
    founderDeployApprovalRequired: false,
    notes: ['Development remains non-public and isolated from production secrets.'],
  },
  {
    environmentKey: 'staging',
    publicSurfaceEnabled: false,
    secretsIsolated: true,
    observabilityRequired: true,
    founderDeployApprovalRequired: false,
    notes: ['Staging validates rollout posture before public exposure.'],
  },
  {
    environmentKey: 'production',
    publicSurfaceEnabled: true,
    secretsIsolated: true,
    observabilityRequired: true,
    founderDeployApprovalRequired: true,
    notes: ['Production requires highest readiness and founder-visible release posture.'],
  },
];

export function listDeploymentEnvironments(): PantavionDeploymentEnvironmentRecord[] {
  return DEPLOYMENT_ENVIRONMENTS.map((item) => cloneValue(item));
}

export function getDeploymentEnvironmentSnapshot(): PantavionDeploymentEnvironmentSnapshot {
  const list = listDeploymentEnvironments();

  return {
    generatedAt: nowIso(),
    environmentCount: list.length,
    publicSurfaceEnabledCount: list.filter((item) => item.publicSurfaceEnabled).length,
    secretsIsolatedCount: list.filter((item) => item.secretsIsolated).length,
    observabilityRequiredCount: list.filter((item) => item.observabilityRequired).length,
    founderDeployApprovalRequiredCount: list.filter((item) => item.founderDeployApprovalRequired).length,
  };
}

export default listDeploymentEnvironments;
