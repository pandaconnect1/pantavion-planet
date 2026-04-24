// core/intake/app-category-registry.ts

export interface PantavionAppCategoryRecord {
  categoryKey: string;
  title: string;
  domain: 'utility' | 'marketplace' | 'media' | 'safety' | 'premium' | 'operations';
  monetizable: boolean;
  requiresMultilingual: boolean;
  safetyCritical: boolean;
  defaultSurfaces: string[];
}

export interface PantavionAppCategorySnapshot {
  generatedAt: string;
  categoryCount: number;
  monetizableCount: number;
  safetyCriticalCount: number;
  multilingualCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const APP_CATEGORIES: PantavionAppCategoryRecord[] = [
  { categoryKey: 'classifieds-app', title: 'Classifieds App', domain: 'marketplace', monetizable: true, requiresMultilingual: true, safetyCritical: true, defaultSurfaces: ['classifieds', 'services'] },
  { categoryKey: 'radio-app', title: 'Internet Radio App', domain: 'media', monetizable: true, requiresMultilingual: true, safetyCritical: true, defaultSurfaces: ['radio'] },
  { categoryKey: 'sos-app', title: 'SOS and Emergency App', domain: 'safety', monetizable: false, requiresMultilingual: true, safetyCritical: true, defaultSurfaces: ['sos'] },
  { categoryKey: 'services-app', title: 'Local Services App', domain: 'utility', monetizable: true, requiresMultilingual: true, safetyCritical: false, defaultSurfaces: ['services'] },
  { categoryKey: 'elite-concierge-app', title: 'Elite Concierge App', domain: 'premium', monetizable: true, requiresMultilingual: true, safetyCritical: false, defaultSurfaces: ['elite'] },
  { categoryKey: 'dashboard-app', title: 'Business Dashboard App', domain: 'operations', monetizable: true, requiresMultilingual: false, safetyCritical: false, defaultSurfaces: ['inspector', 'commercial'] },
];

export function listAppCategories(): PantavionAppCategoryRecord[] {
  return APP_CATEGORIES.map((item) => cloneValue(item));
}

export function getAppCategorySnapshot(): PantavionAppCategorySnapshot {
  const list = listAppCategories();

  return {
    generatedAt: nowIso(),
    categoryCount: list.length,
    monetizableCount: list.filter((item) => item.monetizable).length,
    safetyCriticalCount: list.filter((item) => item.safetyCritical).length,
    multilingualCount: list.filter((item) => item.requiresMultilingual).length,
  };
}

export default listAppCategories;
