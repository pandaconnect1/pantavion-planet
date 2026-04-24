// core/continuity/cloud-continuity-store.ts

export interface PantavionCloudContinuityRecord {
  accountId: string;
  activeThreadId: string;
  activeSurface: string;
  lastContinuityAt: string;
  localePreference: string;
  translatorMode: 'natural' | 'official' | 'travel' | 'business' | 'emergency';
  memoryTimelineReady: boolean;
  reminderCount: number;
}

export interface PantavionCloudContinuitySnapshot {
  generatedAt: string;
  continuityCount: number;
  memoryTimelineReadyCount: number;
  travelOrEmergencyModeCount: number;
  totalReminderCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const CLOUD_CONTINUITY: PantavionCloudContinuityRecord[] = [
  {
    accountId: 'acct_local_user_001',
    activeThreadId: 'thread_translate_athens_trip',
    activeSurface: 'translate',
    lastContinuityAt: '2026-04-22T18:11:00.000Z',
    localePreference: 'el',
    translatorMode: 'travel',
    memoryTimelineReady: true,
    reminderCount: 3,
  },
  {
    accountId: 'acct_pro_user_002',
    activeThreadId: 'thread_client_followup',
    activeSurface: 'work',
    lastContinuityAt: '2026-04-22T18:09:00.000Z',
    localePreference: 'en',
    translatorMode: 'business',
    memoryTimelineReady: true,
    reminderCount: 5,
  },
  {
    accountId: 'acct_elite_user_003',
    activeThreadId: 'thread_concierge_transport',
    activeSurface: 'elite',
    lastContinuityAt: '2026-04-22T18:00:00.000Z',
    localePreference: 'ru',
    translatorMode: 'official',
    memoryTimelineReady: true,
    reminderCount: 2,
  },
  {
    accountId: 'acct_founder_004',
    activeThreadId: 'thread_pantavion_rebuild',
    activeSurface: 'governance',
    lastContinuityAt: '2026-04-22T18:16:00.000Z',
    localePreference: 'el',
    translatorMode: 'business',
    memoryTimelineReady: true,
    reminderCount: 7,
  },
];

export function listCloudContinuityRecords(): PantavionCloudContinuityRecord[] {
  return CLOUD_CONTINUITY.map((item) => cloneValue(item));
}

export function getCloudContinuitySnapshot(): PantavionCloudContinuitySnapshot {
  const list = listCloudContinuityRecords();

  return {
    generatedAt: nowIso(),
    continuityCount: list.length,
    memoryTimelineReadyCount: list.filter((item) => item.memoryTimelineReady).length,
    travelOrEmergencyModeCount: list.filter((item) => item.translatorMode === 'travel' || item.translatorMode === 'emergency').length,
    totalReminderCount: list.reduce((sum, item) => sum + item.reminderCount, 0),
  };
}

export default listCloudContinuityRecords;
