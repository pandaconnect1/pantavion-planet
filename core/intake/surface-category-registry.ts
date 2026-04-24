// core/intake/surface-category-registry.ts

export interface PantavionSurfaceCategoryRecord {
  surfaceKey: string;
  title: string;
  layer: 'human-first' | 'deep-role';
  publicFacing: boolean;
  roleProtected: boolean;
  coreToHome: boolean;
}

export interface PantavionSurfaceCategorySnapshot {
  generatedAt: string;
  categoryCount: number;
  humanFirstCount: number;
  deepRoleCount: number;
  publicFacingCount: number;
  coreToHomeCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const SURFACE_CATEGORIES: PantavionSurfaceCategoryRecord[] = [
  { surfaceKey: 'assistant', title: 'Assistant', layer: 'human-first', publicFacing: true, roleProtected: false, coreToHome: true },
  { surfaceKey: 'today', title: 'Today', layer: 'human-first', publicFacing: true, roleProtected: false, coreToHome: true },
  { surfaceKey: 'memory', title: 'Memory', layer: 'human-first', publicFacing: false, roleProtected: true, coreToHome: true },
  { surfaceKey: 'voice', title: 'Voice', layer: 'human-first', publicFacing: true, roleProtected: false, coreToHome: true },
  { surfaceKey: 'sos', title: 'SOS', layer: 'human-first', publicFacing: true, roleProtected: false, coreToHome: true },
  { surfaceKey: 'radio', title: 'Radio', layer: 'human-first', publicFacing: true, roleProtected: false, coreToHome: true },
  { surfaceKey: 'classifieds', title: 'Classifieds', layer: 'human-first', publicFacing: true, roleProtected: false, coreToHome: true },
  { surfaceKey: 'services', title: 'Services', layer: 'human-first', publicFacing: true, roleProtected: false, coreToHome: true },
  { surfaceKey: 'elite', title: 'Elite', layer: 'human-first', publicFacing: false, roleProtected: true, coreToHome: true },
  { surfaceKey: 'translate', title: 'Translate', layer: 'human-first', publicFacing: true, roleProtected: false, coreToHome: false },
  { surfaceKey: 'documents', title: 'Documents', layer: 'human-first', publicFacing: false, roleProtected: true, coreToHome: false },
  { surfaceKey: 'intelligence', title: 'Intelligence', layer: 'deep-role', publicFacing: false, roleProtected: true, coreToHome: false },
  { surfaceKey: 'security', title: 'Security', layer: 'deep-role', publicFacing: false, roleProtected: true, coreToHome: false },
  { surfaceKey: 'governance', title: 'Governance', layer: 'deep-role', publicFacing: false, roleProtected: true, coreToHome: false },
  { surfaceKey: 'commercial', title: 'Commercial', layer: 'deep-role', publicFacing: false, roleProtected: true, coreToHome: false },
  { surfaceKey: 'inspector', title: 'Inspector', layer: 'deep-role', publicFacing: false, roleProtected: true, coreToHome: false },
];

export function listSurfaceCategories(): PantavionSurfaceCategoryRecord[] {
  return SURFACE_CATEGORIES.map((item) => cloneValue(item));
}

export function getSurfaceCategorySnapshot(): PantavionSurfaceCategorySnapshot {
  const list = listSurfaceCategories();

  return {
    generatedAt: nowIso(),
    categoryCount: list.length,
    humanFirstCount: list.filter((item) => item.layer === 'human-first').length,
    deepRoleCount: list.filter((item) => item.layer === 'deep-role').length,
    publicFacingCount: list.filter((item) => item.publicFacing).length,
    coreToHomeCount: list.filter((item) => item.coreToHome).length,
  };
}

export default listSurfaceCategories;
