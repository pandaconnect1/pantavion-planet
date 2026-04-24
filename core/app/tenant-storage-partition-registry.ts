// core/app/tenant-storage-partition-registry.ts

export type PantavionStorageClass =
  | 'user-memory'
  | 'thread-state'
  | 'canonical-fact'
  | 'commitment-reminder'
  | 'export-artifact'
  | 'governance-domain';

export interface PantavionTenantStoragePartitionRecord {
  partitionKey: string;
  tenantId: string;
  storageClass: PantavionStorageClass;
  encryptedAtRest: boolean;
  backupScoped: boolean;
  founderOnly: boolean;
  notes: string[];
}

export interface PantavionTenantStoragePartitionSnapshot {
  generatedAt: string;
  partitionCount: number;
  encryptedAtRestCount: number;
  backupScopedCount: number;
  founderOnlyCount: number;
  governancePartitionCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const STORAGE_PARTITIONS: PantavionTenantStoragePartitionRecord[] = [
  {
    partitionKey: 'tenant_user_demo_primary_memory',
    tenantId: 'tenant_user_demo_primary',
    storageClass: 'user-memory',
    encryptedAtRest: true,
    backupScoped: true,
    founderOnly: false,
    notes: ['Personal memory must remain tenant-bounded and encrypted.'],
  },
  {
    partitionKey: 'tenant_user_demo_primary_threads',
    tenantId: 'tenant_user_demo_primary',
    storageClass: 'thread-state',
    encryptedAtRest: true,
    backupScoped: true,
    founderOnly: false,
    notes: ['Thread continuity remains inside the user tenant boundary.'],
  },
  {
    partitionKey: 'tenant_user_demo_primary_facts',
    tenantId: 'tenant_user_demo_primary',
    storageClass: 'canonical-fact',
    encryptedAtRest: true,
    backupScoped: true,
    founderOnly: false,
    notes: ['Canonical facts are still tenant-owned even when governance-reviewed.'],
  },
  {
    partitionKey: 'tenant_user_demo_primary_exports',
    tenantId: 'tenant_user_demo_primary',
    storageClass: 'export-artifact',
    encryptedAtRest: true,
    backupScoped: true,
    founderOnly: false,
    notes: ['Exports must remain tenant-bounded and access controlled.'],
  },
  {
    partitionKey: 'tenant_ops_runtime',
    tenantId: 'tenant_ops',
    storageClass: 'commitment-reminder',
    encryptedAtRest: true,
    backupScoped: true,
    founderOnly: false,
    notes: ['Operational reminder queues still remain partitioned.'],
  },
  {
    partitionKey: 'tenant_founder_governance',
    tenantId: 'tenant_founder',
    storageClass: 'governance-domain',
    encryptedAtRest: true,
    backupScoped: true,
    founderOnly: true,
    notes: ['Founder governance domain is maximally isolated.'],
  },
];

export function listTenantStoragePartitions(): PantavionTenantStoragePartitionRecord[] {
  return STORAGE_PARTITIONS.map((item) => cloneValue(item));
}

export function getTenantStoragePartitionSnapshot(): PantavionTenantStoragePartitionSnapshot {
  const list = listTenantStoragePartitions();

  return {
    generatedAt: nowIso(),
    partitionCount: list.length,
    encryptedAtRestCount: list.filter((item) => item.encryptedAtRest).length,
    backupScopedCount: list.filter((item) => item.backupScoped).length,
    founderOnlyCount: list.filter((item) => item.founderOnly).length,
    governancePartitionCount: list.filter((item) => item.storageClass === 'governance-domain').length,
  };
}

export default listTenantStoragePartitions;
