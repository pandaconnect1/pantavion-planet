// core/continuity/offline-pack-registry.ts

export interface PantavionOfflinePackRecord {
  packKey: string;
  packClass: 'translator-language' | 'voice-language' | 'emergency-phrases';
  localeCode: string;
  deviceId: string;
  downloaded: boolean;
  sizeClass: 'small' | 'medium' | 'large';
}

export interface PantavionOfflinePackSnapshot {
  generatedAt: string;
  packCount: number;
  downloadedCount: number;
  emergencyPackCount: number;
  translatorPackCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const OFFLINE_PACKS: PantavionOfflinePackRecord[] = [
  {
    packKey: 'pack_el_translate_phone',
    packClass: 'translator-language',
    localeCode: 'el',
    deviceId: 'device_phone_001',
    downloaded: true,
    sizeClass: 'medium',
  },
  {
    packKey: 'pack_en_translate_phone',
    packClass: 'translator-language',
    localeCode: 'en',
    deviceId: 'device_phone_001',
    downloaded: true,
    sizeClass: 'medium',
  },
  {
    packKey: 'pack_ar_emergency_phone',
    packClass: 'emergency-phrases',
    localeCode: 'ar',
    deviceId: 'device_phone_001',
    downloaded: true,
    sizeClass: 'small',
  },
  {
    packKey: 'pack_ru_voice_tablet',
    packClass: 'voice-language',
    localeCode: 'ru',
    deviceId: 'device_tablet_002',
    downloaded: true,
    sizeClass: 'large',
  },
];

export function listOfflinePacks(): PantavionOfflinePackRecord[] {
  return OFFLINE_PACKS.map((item) => cloneValue(item));
}

export function getOfflinePackSnapshot(): PantavionOfflinePackSnapshot {
  const list = listOfflinePacks();

  return {
    generatedAt: nowIso(),
    packCount: list.length,
    downloadedCount: list.filter((item) => item.downloaded).length,
    emergencyPackCount: list.filter((item) => item.packClass === 'emergency-phrases').length,
    translatorPackCount: list.filter((item) => item.packClass === 'translator-language').length,
  };
}

export default listOfflinePacks;
