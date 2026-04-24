// core/intake/user-category-registry.ts

export interface PantavionUserCategoryRecord {
  categoryKey: string;
  title: string;
  priorityTier: 'core' | 'expanded' | 'specialized';
  residentType: 'local' | 'resident-foreign' | 'visitor' | 'operational' | 'founder';
  languageNeeds: string[];
  safetyNeeds: string[];
  defaultSurfaces: string[];
  defaultAIModes: string[];
}

export interface PantavionUserCategorySnapshot {
  generatedAt: string;
  categoryCount: number;
  coreCount: number;
  residentForeignCount: number;
  visitorCount: number;
  safetySensitiveCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const USER_CATEGORIES: PantavionUserCategoryRecord[] = [
  {
    categoryKey: 'local-resident',
    title: 'Local Resident',
    priorityTier: 'core',
    residentType: 'local',
    languageNeeds: ['el', 'en'],
    safetyNeeds: ['community', 'daily-services'],
    defaultSurfaces: ['assistant', 'today', 'memory', 'services'],
    defaultAIModes: ['assistant-ai', 'memory-ai', 'services-ai'],
  },
  {
    categoryKey: 'foreign-resident',
    title: 'Foreign Resident',
    priorityTier: 'core',
    residentType: 'resident-foreign',
    languageNeeds: ['en', 'ru', 'ro', 'bg', 'ar', 'tr', 'hi', 'ne', 'tl'],
    safetyNeeds: ['translation', 'services', 'trust'],
    defaultSurfaces: ['assistant', 'translate', 'services', 'memory'],
    defaultAIModes: ['assistant-ai', 'translation-ai', 'services-ai'],
  },
  {
    categoryKey: 'tourist',
    title: 'Tourist',
    priorityTier: 'core',
    residentType: 'visitor',
    languageNeeds: ['en', 'ar', 'ru', 'tr', 'ro', 'bg', 'zh', 'ja'],
    safetyNeeds: ['navigation', 'sos', 'local-help'],
    defaultSurfaces: ['assistant', 'today', 'sos', 'services'],
    defaultAIModes: ['assistant-ai', 'translation-ai', 'sos-ai'],
  },
  {
    categoryKey: 'worker-community',
    title: 'Worker Community',
    priorityTier: 'core',
    residentType: 'resident-foreign',
    languageNeeds: ['hi', 'ne', 'tl', 'en', 'ar'],
    safetyNeeds: ['translation', 'emergency', 'services'],
    defaultSurfaces: ['assistant', 'services', 'radio', 'sos'],
    defaultAIModes: ['assistant-ai', 'translation-ai', 'radio-ai', 'sos-ai'],
  },
  {
    categoryKey: 'family-household',
    title: 'Family and Household',
    priorityTier: 'expanded',
    residentType: 'local',
    languageNeeds: ['el', 'en', 'ar', 'ru'],
    safetyNeeds: ['reminders', 'children', 'household'],
    defaultSurfaces: ['assistant', 'today', 'memory', 'services'],
    defaultAIModes: ['assistant-ai', 'memory-ai', 'services-ai'],
  },
  {
    categoryKey: 'elderly-sensitive',
    title: 'Elderly and Sensitive User',
    priorityTier: 'expanded',
    residentType: 'local',
    languageNeeds: ['el', 'en', 'ru'],
    safetyNeeds: ['voice', 'sos', 'simplified-ui'],
    defaultSurfaces: ['voice', 'sos', 'assistant'],
    defaultAIModes: ['voice-ai', 'sos-ai', 'assistant-ai'],
  },
  {
    categoryKey: 'crisis-sensitive',
    title: 'Crisis Sensitive User',
    priorityTier: 'core',
    residentType: 'visitor',
    languageNeeds: ['ar', 'en', 'el', 'tr', 'ru'],
    safetyNeeds: ['sos', 'alerts', 'legal-help'],
    defaultSurfaces: ['sos', 'radio', 'assistant'],
    defaultAIModes: ['sos-ai', 'radio-ai', 'assistant-ai'],
  },
  {
    categoryKey: 'elite-vip',
    title: 'Elite and VIP User',
    priorityTier: 'specialized',
    residentType: 'visitor',
    languageNeeds: ['en', 'ru', 'ar', 'zh', 'ja', 'fr'],
    safetyNeeds: ['privacy', 'priority-services'],
    defaultSurfaces: ['elite', 'assistant', 'today'],
    defaultAIModes: ['elite-concierge-ai', 'assistant-ai'],
  },
  {
    categoryKey: 'operator',
    title: 'Operator',
    priorityTier: 'specialized',
    residentType: 'operational',
    languageNeeds: ['en', 'el'],
    safetyNeeds: ['security', 'observability'],
    defaultSurfaces: ['security', 'intelligence', 'inspector'],
    defaultAIModes: ['operator-ai', 'governance-ai'],
  },
  {
    categoryKey: 'founder',
    title: 'Founder',
    priorityTier: 'specialized',
    residentType: 'founder',
    languageNeeds: ['el', 'en'],
    safetyNeeds: ['governance', 'global-control'],
    defaultSurfaces: ['governance', 'commercial', 'inspector'],
    defaultAIModes: ['governance-ai', 'operator-ai', 'app-builder-ai'],
  },
];

export function listUserCategories(): PantavionUserCategoryRecord[] {
  return USER_CATEGORIES.map((item) => cloneValue(item));
}

export function getUserCategorySnapshot(): PantavionUserCategorySnapshot {
  const list = listUserCategories();

  return {
    generatedAt: nowIso(),
    categoryCount: list.length,
    coreCount: list.filter((item) => item.priorityTier === 'core').length,
    residentForeignCount: list.filter((item) => item.residentType === 'resident-foreign').length,
    visitorCount: list.filter((item) => item.residentType === 'visitor').length,
    safetySensitiveCount: list.filter((item) => item.safetyNeeds.includes('sos') || item.safetyNeeds.includes('emergency')).length,
  };
}

export default listUserCategories;
