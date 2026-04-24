// core/security/tenant-isolation-policy.ts

export type PantavionIsolationStrength =
  | 'soft'
  | 'hard'
  | 'critical-hard';

export interface PantavionTenantIsolationPolicyRecord {
  isolationKey: string;
  title: string;
  isolationStrength: PantavionIsolationStrength;
  storagePartitioned: boolean;
  memoryPartitioned: boolean;
  exportPartitioned: boolean;
  keyMaterialSeparated: boolean;
  notes: string[];
}

export interface PantavionTenantIsolationPolicySnapshot {
  generatedAt: string;
  isolationCount: number;
  hardCount: number;
  criticalHardCount: number;
  keyMaterialSeparatedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const TENANT_ISOLATION_POLICIES: PantavionTenantIsolationPolicyRecord[] = [
  {
    isolationKey: 'user-memory-partition',
    title: 'User Memory Partition',
    isolationStrength: 'critical-hard',
    storagePartitioned: true,
    memoryPartitioned: true,
    exportPartitioned: true,
    keyMaterialSeparated: true,
    notes: ['Per-user memory must not bleed across tenants.'],
  },
  {
    isolationKey: 'thread-boundary-isolation',
    title: 'Thread Boundary Isolation',
    isolationStrength: 'hard',
    storagePartitioned: true,
    memoryPartitioned: true,
    exportPartitioned: true,
    keyMaterialSeparated: false,
    notes: ['Thread continuity must remain tenant-bounded.'],
  },
  {
    isolationKey: 'background-job-tenant-binding',
    title: 'Background Job Tenant Binding',
    isolationStrength: 'hard',
    storagePartitioned: true,
    memoryPartitioned: true,
    exportPartitioned: false,
    keyMaterialSeparated: false,
    notes: ['Queued jobs must retain tenant ownership.'],
  },
  {
    isolationKey: 'founder-governance-domain',
    title: 'Founder Governance Domain',
    isolationStrength: 'critical-hard',
    storagePartitioned: true,
    memoryPartitioned: true,
    exportPartitioned: true,
    keyMaterialSeparated: true,
    notes: ['Founder and global governance state must remain maximally isolated.'],
  },
];

export function listTenantIsolationPolicies(): PantavionTenantIsolationPolicyRecord[] {
  return TENANT_ISOLATION_POLICIES.map((item) => cloneValue(item));
}

export function getTenantIsolationPolicySnapshot(): PantavionTenantIsolationPolicySnapshot {
  const list = listTenantIsolationPolicies();

  return {
    generatedAt: nowIso(),
    isolationCount: list.length,
    hardCount: list.filter((item) => item.isolationStrength === 'hard').length,
    criticalHardCount: list.filter((item) => item.isolationStrength === 'critical-hard').length,
    keyMaterialSeparatedCount: list.filter((item) => item.keyMaterialSeparated).length,
  };
}

export default listTenantIsolationPolicies;
