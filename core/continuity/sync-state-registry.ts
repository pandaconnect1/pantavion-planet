// core/continuity/sync-state-registry.ts

export interface PantavionSyncStateRecord {
  syncKey: string;
  accountId: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  syncMode: 'delta' | 'rehydrate' | 'handoff' | 'offline-replay';
  status: 'ready' | 'in-progress' | 'completed' | 'blocked';
  lastSyncedAt: string;
}

export interface PantavionSyncStateSnapshot {
  generatedAt: string;
  syncCount: number;
  readyCount: number;
  completedCount: number;
  handoffCount: number;
  offlineReplayCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const SYNC_STATES: PantavionSyncStateRecord[] = [
  {
    syncKey: 'sync_phone_to_tablet_001',
    accountId: 'acct_local_user_001',
    sourceDeviceId: 'device_phone_001',
    targetDeviceId: 'device_tablet_002',
    syncMode: 'handoff',
    status: 'completed',
    lastSyncedAt: '2026-04-22T18:05:00.000Z',
  },
  {
    syncKey: 'sync_laptop_to_phone_002',
    accountId: 'acct_pro_user_002',
    sourceDeviceId: 'device_laptop_003',
    targetDeviceId: 'device_phone_001',
    syncMode: 'delta',
    status: 'ready',
    lastSyncedAt: '2026-04-22T17:58:00.000Z',
  },
  {
    syncKey: 'sync_restore_desktop_003',
    accountId: 'acct_founder_004',
    sourceDeviceId: 'device_desktop_004',
    targetDeviceId: 'device_desktop_004',
    syncMode: 'rehydrate',
    status: 'completed',
    lastSyncedAt: '2026-04-22T18:16:00.000Z',
  },
  {
    syncKey: 'sync_offline_replay_004',
    accountId: 'acct_local_user_001',
    sourceDeviceId: 'device_phone_001',
    targetDeviceId: 'device_phone_001',
    syncMode: 'offline-replay',
    status: 'in-progress',
    lastSyncedAt: '2026-04-22T18:13:00.000Z',
  },
];

export function listSyncStates(): PantavionSyncStateRecord[] {
  return SYNC_STATES.map((item) => cloneValue(item));
}

export function getSyncStateSnapshot(): PantavionSyncStateSnapshot {
  const list = listSyncStates();

  return {
    generatedAt: nowIso(),
    syncCount: list.length,
    readyCount: list.filter((item) => item.status === 'ready').length,
    completedCount: list.filter((item) => item.status === 'completed').length,
    handoffCount: list.filter((item) => item.syncMode === 'handoff').length,
    offlineReplayCount: list.filter((item) => item.syncMode === 'offline-replay').length,
  };
}

export default listSyncStates;
