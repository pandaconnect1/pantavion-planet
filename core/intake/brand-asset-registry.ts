// core/intake/brand-asset-registry.ts

export interface PantavionBrandAssetRecord {
  assetKey: string;
  title: string;
  assetType: 'logo' | 'icon' | 'token' | 'template';
  canonical: boolean;
  revisionStatus: 'draft' | 'seeded' | 'active';
  needsRefinement: boolean;
}

export interface PantavionBrandAssetSnapshot {
  generatedAt: string;
  assetCount: number;
  canonicalCount: number;
  refinementNeededCount: number;
  activeCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const BRAND_ASSETS: PantavionBrandAssetRecord[] = [
  { assetKey: 'pantavion-logo-primary', title: 'Pantavion Primary Logo', assetType: 'logo', canonical: true, revisionStatus: 'seeded', needsRefinement: true },
  { assetKey: 'pantavion-icon-primary', title: 'Pantavion Primary Icon', assetType: 'icon', canonical: true, revisionStatus: 'seeded', needsRefinement: true },
  { assetKey: 'pantavion-color-tokens', title: 'Pantavion Color Tokens', assetType: 'token', canonical: true, revisionStatus: 'active', needsRefinement: false },
  { assetKey: 'pantavion-human-home-template', title: 'Pantavion Human Home Template', assetType: 'template', canonical: true, revisionStatus: 'draft', needsRefinement: true },
];

export function listBrandAssets(): PantavionBrandAssetRecord[] {
  return BRAND_ASSETS.map((item) => cloneValue(item));
}

export function getBrandAssetSnapshot(): PantavionBrandAssetSnapshot {
  const list = listBrandAssets();

  return {
    generatedAt: nowIso(),
    assetCount: list.length,
    canonicalCount: list.filter((item) => item.canonical).length,
    refinementNeededCount: list.filter((item) => item.needsRefinement).length,
    activeCount: list.filter((item) => item.revisionStatus === 'active').length,
  };
}

export default listBrandAssets;
