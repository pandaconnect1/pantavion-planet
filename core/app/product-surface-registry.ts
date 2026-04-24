// core/app/product-surface-registry.ts

export type PantavionSurfaceVisibility =
  | 'public'
  | 'authenticated'
  | 'operator'
  | 'founder';

export type PantavionSurfaceDomain =
  | 'core'
  | 'memory'
  | 'intelligence'
  | 'commercial'
  | 'governance'
  | 'security';

export interface PantavionProductSurfaceRecord {
  surfaceKey: string;
  title: string;
  routePath: string;
  visibility: PantavionSurfaceVisibility;
  domain: PantavionSurfaceDomain;
  navGroup: string;
  vercelEligible: boolean;
  notes: string[];
}

export interface PantavionProductSurfaceSnapshot {
  generatedAt: string;
  surfaceCount: number;
  publicCount: number;
  authenticatedCount: number;
  operatorCount: number;
  founderCount: number;
  vercelEligibleCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const PRODUCT_SURFACES: PantavionProductSurfaceRecord[] = [
  {
    surfaceKey: 'surface_home',
    title: 'Pantavion Home',
    routePath: '/',
    visibility: 'public',
    domain: 'core',
    navGroup: 'public',
    vercelEligible: true,
    notes: ['Public landing surface for Pantavion.'],
  },
  {
    surfaceKey: 'surface_memory_timeline',
    title: 'Memory Timeline',
    routePath: '/memory',
    visibility: 'authenticated',
    domain: 'memory',
    navGroup: 'workspace',
    vercelEligible: true,
    notes: ['Personal user continuity and memory view.'],
  },
  {
    surfaceKey: 'surface_visibility_inspector',
    title: 'Visibility Inspector',
    routePath: '/inspector',
    visibility: 'authenticated',
    domain: 'core',
    navGroup: 'workspace',
    vercelEligible: true,
    notes: ['Unified system visibility surface.'],
  },
  {
    surfaceKey: 'surface_ai_authority',
    title: 'AI Authority',
    routePath: '/intelligence',
    visibility: 'operator',
    domain: 'intelligence',
    navGroup: 'ops',
    vercelEligible: true,
    notes: ['Operational AI authority surface.'],
  },
  {
    surfaceKey: 'surface_security_ops',
    title: 'Security Ops',
    routePath: '/security',
    visibility: 'operator',
    domain: 'security',
    navGroup: 'ops',
    vercelEligible: true,
    notes: ['Security observability and response surface.'],
  },
  {
    surfaceKey: 'surface_commercial_console',
    title: 'Commercial Console',
    routePath: '/commercial',
    visibility: 'founder',
    domain: 'commercial',
    navGroup: 'founder',
    vercelEligible: true,
    notes: ['Founder commercial and revenue surface.'],
  },
  {
    surfaceKey: 'surface_governance_console',
    title: 'Governance Console',
    routePath: '/governance',
    visibility: 'founder',
    domain: 'governance',
    navGroup: 'founder',
    vercelEligible: true,
    notes: ['Founder constitutional and governance surface.'],
  },
];

export function listProductSurfaces(): PantavionProductSurfaceRecord[] {
  return PRODUCT_SURFACES.map((item) => cloneValue(item));
}

export function getProductSurfaceSnapshot(): PantavionProductSurfaceSnapshot {
  const list = listProductSurfaces();

  return {
    generatedAt: nowIso(),
    surfaceCount: list.length,
    publicCount: list.filter((item) => item.visibility === 'public').length,
    authenticatedCount: list.filter((item) => item.visibility === 'authenticated').length,
    operatorCount: list.filter((item) => item.visibility === 'operator').length,
    founderCount: list.filter((item) => item.visibility === 'founder').length,
    vercelEligibleCount: list.filter((item) => item.vercelEligible).length,
  };
}

export default listProductSurfaces;
