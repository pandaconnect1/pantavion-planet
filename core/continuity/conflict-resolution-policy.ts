// core/continuity/conflict-resolution-policy.ts

export interface PantavionConflictResolutionRecord {
  conflictKey: string;
  accountId: string;
  conflictType: 'thread-edit' | 'draft-edit' | 'settings-update' | 'offline-replay';
  resolutionMode: 'last-write-safe' | 'merge' | 'manual-review';
  severity: 'low' | 'medium' | 'high';
}

export interface PantavionConflictResolutionSnapshot {
  generatedAt: string;
  conflictCount: number;
  mergeCount: number;
  manualReviewCount: number;
  highSeverityCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const CONFLICT_POLICIES: PantavionConflictResolutionRecord[] = [
  {
    conflictKey: 'conflict_thread_001',
    accountId: 'acct_local_user_001',
    conflictType: 'thread-edit',
    resolutionMode: 'merge',
    severity: 'medium',
  },
  {
    conflictKey: 'conflict_draft_002',
    accountId: 'acct_pro_user_002',
    conflictType: 'draft-edit',
    resolutionMode: 'manual-review',
    severity: 'high',
  },
  {
    conflictKey: 'conflict_settings_003',
    accountId: 'acct_elite_user_003',
    conflictType: 'settings-update',
    resolutionMode: 'last-write-safe',
    severity: 'low',
  },
  {
    conflictKey: 'conflict_offline_004',
    accountId: 'acct_local_user_001',
    conflictType: 'offline-replay',
    resolutionMode: 'merge',
    severity: 'medium',
  },
];

export function listConflictResolutionPolicies(): PantavionConflictResolutionRecord[] {
  return CONFLICT_POLICIES.map((item) => cloneValue(item));
}

export function getConflictResolutionSnapshot(): PantavionConflictResolutionSnapshot {
  const list = listConflictResolutionPolicies();

  return {
    generatedAt: nowIso(),
    conflictCount: list.length,
    mergeCount: list.filter((item) => item.resolutionMode === 'merge').length,
    manualReviewCount: list.filter((item) => item.resolutionMode === 'manual-review').length,
    highSeverityCount: list.filter((item) => item.severity === 'high').length,
  };
}

export default listConflictResolutionPolicies;
