// core/continuity/local-secure-cache-registry.ts

export interface PantavionLocalSecureCacheRecord {
  deviceId: string;
  encrypted: boolean;
  recentThreadCacheCount: number;
  offlineQueuePendingCount: number;
  translatorPackCount: number;
  sensitiveModeLocked: boolean;
}

export interface PantavionLocalSecureCacheSnapshot {
  generatedAt: string;
  cacheCount: number;
  encryptedCount: number;
  offlineQueuePendingDeviceCount: number;
  totalTranslatorPackCount: number;
  sensitiveModeLockedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const LOCAL_SECURE_CACHES: PantavionLocalSecureCacheRecord[] = [
  {
    deviceId: 'device_phone_001',
    encrypted: true,
    recentThreadCacheCount: 12,
    offlineQueuePendingCount: 1,
    translatorPackCount: 3,
    sensitiveModeLocked: true,
  },
  {
    deviceId: 'device_tablet_002',
    encrypted: true,
    recentThreadCacheCount: 8,
    offlineQueuePendingCount: 0,
    translatorPackCount: 2,
    sensitiveModeLocked: false,
  },
  {
    deviceId: 'device_laptop_003',
    encrypted: true,
    recentThreadCacheCount: 18,
    offlineQueuePendingCount: 0,
    translatorPackCount: 1,
    sensitiveModeLocked: false,
  },
  {
    deviceId: 'device_desktop_004',
    encrypted: true,
    recentThreadCacheCount: 20,
    offlineQueuePendingCount: 0,
    translatorPackCount: 0,
    sensitiveModeLocked: true,
  },
];

export function listLocalSecureCaches(): PantavionLocalSecureCacheRecord[] {
  return LOCAL_SECURE_CACHES.map((item) => cloneValue(item));
}

export function getLocalSecureCacheSnapshot(): PantavionLocalSecureCacheSnapshot {
  const list = listLocalSecureCaches();

  return {
    generatedAt: nowIso(),
    cacheCount: list.length,
    encryptedCount: list.filter((item) => item.encrypted).length,
    offlineQueuePendingDeviceCount: list.filter((item) => item.offlineQueuePendingCount > 0).length,
    totalTranslatorPackCount: list.reduce((sum, item) => sum + item.translatorPackCount, 0),
    sensitiveModeLockedCount: list.filter((item) => item.sensitiveModeLocked).length,
  };
}

export default listLocalSecureCaches;
