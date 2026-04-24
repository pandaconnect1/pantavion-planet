// core/intake/locale-priority-matrix.ts

export interface PantavionLocalePriorityRecord {
  localeCode: string;
  displayName: string;
  script: string;
  direction: 'ltr' | 'rtl';
  priorityRing: 'ring-0' | 'ring-1' | 'ring-2';
  cyprusWeight: number;
  residentWeight: number;
  tourismWeight: number;
  eliteWeight: number;
  sosWeight: number;
  translationStatus: 'seeded' | 'core-ready' | 'expanded-ready';
  voiceStatus: 'seeded' | 'core-ready' | 'expanded-ready';
}

export interface PantavionLocalePrioritySnapshot {
  generatedAt: string;
  localeCount: number;
  ring0Count: number;
  rtlCount: number;
  coreReadyTranslationCount: number;
  coreReadyVoiceCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const LOCALE_PRIORITY_MATRIX: PantavionLocalePriorityRecord[] = [
  { localeCode: 'el', displayName: 'Ελληνικά', script: 'Greek', direction: 'ltr', priorityRing: 'ring-0', cyprusWeight: 10, residentWeight: 10, tourismWeight: 6, eliteWeight: 4, sosWeight: 9, translationStatus: 'core-ready', voiceStatus: 'core-ready' },
  { localeCode: 'en', displayName: 'English', script: 'Latin', direction: 'ltr', priorityRing: 'ring-0', cyprusWeight: 10, residentWeight: 10, tourismWeight: 10, eliteWeight: 10, sosWeight: 10, translationStatus: 'core-ready', voiceStatus: 'core-ready' },
  { localeCode: 'ar', displayName: 'العربية', script: 'Arabic', direction: 'rtl', priorityRing: 'ring-0', cyprusWeight: 9, residentWeight: 8, tourismWeight: 8, eliteWeight: 8, sosWeight: 10, translationStatus: 'core-ready', voiceStatus: 'core-ready' },
  { localeCode: 'tr', displayName: 'Türkçe', script: 'Latin', direction: 'ltr', priorityRing: 'ring-0', cyprusWeight: 9, residentWeight: 8, tourismWeight: 7, eliteWeight: 5, sosWeight: 8, translationStatus: 'core-ready', voiceStatus: 'core-ready' },
  { localeCode: 'ru', displayName: 'Русский', script: 'Cyrillic', direction: 'ltr', priorityRing: 'ring-0', cyprusWeight: 9, residentWeight: 9, tourismWeight: 7, eliteWeight: 9, sosWeight: 7, translationStatus: 'core-ready', voiceStatus: 'seeded' },
  { localeCode: 'ro', displayName: 'Română', script: 'Latin', direction: 'ltr', priorityRing: 'ring-0', cyprusWeight: 8, residentWeight: 8, tourismWeight: 4, eliteWeight: 2, sosWeight: 6, translationStatus: 'expanded-ready', voiceStatus: 'seeded' },
  { localeCode: 'bg', displayName: 'Български', script: 'Cyrillic', direction: 'ltr', priorityRing: 'ring-0', cyprusWeight: 8, residentWeight: 8, tourismWeight: 4, eliteWeight: 2, sosWeight: 6, translationStatus: 'expanded-ready', voiceStatus: 'seeded' },
  { localeCode: 'hi', displayName: 'हिंदी', script: 'Devanagari', direction: 'ltr', priorityRing: 'ring-1', cyprusWeight: 7, residentWeight: 8, tourismWeight: 2, eliteWeight: 2, sosWeight: 7, translationStatus: 'expanded-ready', voiceStatus: 'seeded' },
  { localeCode: 'ne', displayName: 'नेपाली', script: 'Devanagari', direction: 'ltr', priorityRing: 'ring-1', cyprusWeight: 7, residentWeight: 8, tourismWeight: 1, eliteWeight: 1, sosWeight: 7, translationStatus: 'expanded-ready', voiceStatus: 'seeded' },
  { localeCode: 'tl', displayName: 'Tagalog', script: 'Latin', direction: 'ltr', priorityRing: 'ring-1', cyprusWeight: 7, residentWeight: 8, tourismWeight: 1, eliteWeight: 1, sosWeight: 6, translationStatus: 'expanded-ready', voiceStatus: 'seeded' },
  { localeCode: 'zh', displayName: '中文', script: 'Han', direction: 'ltr', priorityRing: 'ring-2', cyprusWeight: 4, residentWeight: 3, tourismWeight: 4, eliteWeight: 8, sosWeight: 4, translationStatus: 'expanded-ready', voiceStatus: 'seeded' },
  { localeCode: 'ja', displayName: '日本語', script: 'Japanese', direction: 'ltr', priorityRing: 'ring-2', cyprusWeight: 3, residentWeight: 2, tourismWeight: 4, eliteWeight: 7, sosWeight: 3, translationStatus: 'expanded-ready', voiceStatus: 'seeded' },
];

export function listLocalePriorityRecords(): PantavionLocalePriorityRecord[] {
  return LOCALE_PRIORITY_MATRIX.map((item) => cloneValue(item));
}

export function getLocalePrioritySnapshot(): PantavionLocalePrioritySnapshot {
  const list = listLocalePriorityRecords();

  return {
    generatedAt: nowIso(),
    localeCount: list.length,
    ring0Count: list.filter((item) => item.priorityRing === 'ring-0').length,
    rtlCount: list.filter((item) => item.direction === 'rtl').length,
    coreReadyTranslationCount: list.filter((item) => item.translationStatus === 'core-ready').length,
    coreReadyVoiceCount: list.filter((item) => item.voiceStatus === 'core-ready').length,
  };
}

export default listLocalePriorityRecords;
