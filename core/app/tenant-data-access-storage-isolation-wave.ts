// core/app/tenant-data-access-storage-isolation-wave.ts

import { listTenantStoragePartitions, getTenantStoragePartitionSnapshot } from './tenant-storage-partition-registry';
import {
  evaluateTenantStorageAccess,
  getTenantStorageGuardSnapshot,
  type PantavionTenantStorageAccessDecision,
  type PantavionTenantStorageAccessRequest,
} from './tenant-storage-read-write-guard';
import {
  evaluateTenantExportAccess,
  getTenantExportGuardSnapshot,
  type PantavionTenantExportDecision,
  type PantavionTenantExportRequest,
} from './tenant-export-access-guard';
import { evaluateTenantAccess, getTenantAccessEnforcementSnapshot, type PantavionTenantAccessDecision } from '../security/tenant-access-enforcer';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionTenantDataAccessStorageIsolationWaveOutput {
  generatedAt: string;
  partitionSnapshot: ReturnType<typeof getTenantStoragePartitionSnapshot>;
  storageGuardSnapshot: ReturnType<typeof getTenantStorageGuardSnapshot>;
  exportGuardSnapshot: ReturnType<typeof getTenantExportGuardSnapshot>;
  tenantAccessSnapshot: ReturnType<typeof getTenantAccessEnforcementSnapshot>;
  storageDecisions: PantavionTenantStorageAccessDecision[];
  exportDecisions: PantavionTenantExportDecision[];
  tenantAccessDecisions: PantavionTenantAccessDecision[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionTenantDataAccessStorageIsolationWaveOutput): string {
  const partitions = listTenantStoragePartitions();

  return [
    'PANTAVION TENANT DATA ACCESS STORAGE ISOLATION WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'STORAGE PARTITIONS',
    `partitionCount=${output.partitionSnapshot.partitionCount}`,
    `encryptedAtRestCount=${output.partitionSnapshot.encryptedAtRestCount}`,
    `backupScopedCount=${output.partitionSnapshot.backupScopedCount}`,
    `founderOnlyCount=${output.partitionSnapshot.founderOnlyCount}`,
    `governancePartitionCount=${output.partitionSnapshot.governancePartitionCount}`,
    '',
    ...partitions.flatMap((item) => [
      `${item.partitionKey}`,
      `tenantId=${item.tenantId}`,
      `storageClass=${item.storageClass}`,
      `founderOnly=${item.founderOnly ? 'yes' : 'no'}`,
      '',
    ]),
    'STORAGE READ WRITE GUARD',
    `evaluatedCount=${output.storageGuardSnapshot.evaluatedCount}`,
    `allowedCount=${output.storageGuardSnapshot.allowedCount}`,
    `blockedCount=${output.storageGuardSnapshot.blockedCount}`,
    `founderOverrideCount=${output.storageGuardSnapshot.founderOverrideCount}`,
    `exportAllowedCount=${output.storageGuardSnapshot.exportAllowedCount}`,
    '',
    ...output.storageDecisions.flatMap((item) => [
      `${item.storageClass}:${item.operation}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
    'EXPORT ACCESS GUARD',
    `evaluatedCount=${output.exportGuardSnapshot.evaluatedCount}`,
    `allowedCount=${output.exportGuardSnapshot.allowedCount}`,
    `blockedCount=${output.exportGuardSnapshot.blockedCount}`,
    `sensitiveBlockedCount=${output.exportGuardSnapshot.sensitiveBlockedCount}`,
    `founderGovernanceExportCount=${output.exportGuardSnapshot.founderGovernanceExportCount}`,
    '',
    ...output.exportDecisions.flatMap((item) => [
      `${item.exportScope}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
    'TENANT ACCESS ENFORCER',
    `evaluatedCount=${output.tenantAccessSnapshot.evaluatedCount}`,
    `isolatedAllowedCount=${output.tenantAccessSnapshot.isolatedAllowedCount}`,
    `crossTenantBlockedCount=${output.tenantAccessSnapshot.crossTenantBlockedCount}`,
    `founderOverrideCount=${output.tenantAccessSnapshot.founderOverrideCount}`,
    '',
    ...output.tenantAccessDecisions.flatMap((item) => [
      `${item.resourceType}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `isolationStatus=${item.isolationStatus}`,
      `reason=${item.reason}`,
      '',
    ]),
  ].join('\n');
}

export async function runTenantDataAccessStorageIsolationWave(): Promise<PantavionTenantDataAccessStorageIsolationWaveOutput> {
  const storageRequests: PantavionTenantStorageAccessRequest[] = [
    {
      actorId: 'user_demo_primary',
      actorRole: 'user',
      actorTenantId: 'tenant_user_demo_primary',
      targetTenantId: 'tenant_user_demo_primary',
      storageClass: 'user-memory',
      operation: 'read',
      founderOverride: false,
    },
    {
      actorId: 'service_memory_worker',
      actorRole: 'service',
      actorTenantId: 'tenant_runtime',
      targetTenantId: 'tenant_user_demo_primary',
      storageClass: 'export-artifact',
      operation: 'export',
      founderOverride: false,
    },
    {
      actorId: 'founder_primary',
      actorRole: 'founder',
      actorTenantId: 'tenant_founder',
      targetTenantId: 'tenant_founder',
      storageClass: 'governance-domain',
      operation: 'write',
      founderOverride: true,
    },
    {
      actorId: 'operator_alpha',
      actorRole: 'operator',
      actorTenantId: 'tenant_ops',
      targetTenantId: 'tenant_founder',
      storageClass: 'governance-domain',
      operation: 'read',
      founderOverride: false,
    },
  ];

  const exportRequests: PantavionTenantExportRequest[] = [
    {
      requesterRole: 'user',
      requesterTenantId: 'tenant_user_demo_primary',
      exportOwnerTenantId: 'tenant_user_demo_primary',
      containsSensitiveMemory: true,
      founderOverride: false,
    },
    {
      requesterRole: 'operator',
      requesterTenantId: 'tenant_ops',
      exportOwnerTenantId: 'tenant_user_demo_primary',
      containsSensitiveMemory: true,
      founderOverride: false,
    },
    {
      requesterRole: 'founder',
      requesterTenantId: 'tenant_founder',
      exportOwnerTenantId: 'tenant_user_demo_primary',
      containsSensitiveMemory: true,
      founderOverride: true,
    },
  ];

  const tenantAccessDecisions = [
    evaluateTenantAccess({
      actorTenantId: 'tenant_user_demo_primary',
      targetTenantId: 'tenant_user_demo_primary',
      resourceType: 'memory',
      founderOverride: false,
    }),
    evaluateTenantAccess({
      actorTenantId: 'tenant_ops',
      targetTenantId: 'tenant_user_demo_primary',
      resourceType: 'thread',
      founderOverride: false,
    }),
    evaluateTenantAccess({
      actorTenantId: 'tenant_founder',
      targetTenantId: 'tenant_user_demo_primary',
      resourceType: 'governance',
      founderOverride: true,
    }),
  ];

  const storageDecisions = storageRequests.map((item) => evaluateTenantStorageAccess(item));
  const exportDecisions = exportRequests.map((item) => evaluateTenantExportAccess(item));

  const output: PantavionTenantDataAccessStorageIsolationWaveOutput = {
    generatedAt: nowIso(),
    partitionSnapshot: getTenantStoragePartitionSnapshot(),
    storageGuardSnapshot: getTenantStorageGuardSnapshot(storageDecisions, storageRequests),
    exportGuardSnapshot: getTenantExportGuardSnapshot(exportDecisions, exportRequests),
    tenantAccessSnapshot: getTenantAccessEnforcementSnapshot(tenantAccessDecisions),
    storageDecisions,
    exportDecisions,
    tenantAccessDecisions,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'app.tenant-data-storage-isolation.latest',
    kind: 'report',
    payload: {
      partitionSnapshot: output.partitionSnapshot,
      storageGuardSnapshot: output.storageGuardSnapshot,
      exportGuardSnapshot: output.exportGuardSnapshot,
      tenantAccessSnapshot: output.tenantAccessSnapshot,
      partitions: listTenantStoragePartitions(),
      storageDecisions: output.storageDecisions,
      exportDecisions: output.exportDecisions,
      tenantAccessDecisions: output.tenantAccessDecisions,
    },
    tags: ['app', 'tenant', 'storage', 'isolation', 'latest'],
    metadata: {
      partitionCount: output.partitionSnapshot.partitionCount,
      storageAllowedCount: output.storageGuardSnapshot.allowedCount,
      storageBlockedCount: output.storageGuardSnapshot.blockedCount,
      exportBlockedCount: output.exportGuardSnapshot.blockedCount,
      tenantBlockedCount: output.tenantAccessSnapshot.crossTenantBlockedCount,
    },
  });

  return output;
}

export default runTenantDataAccessStorageIsolationWave;
