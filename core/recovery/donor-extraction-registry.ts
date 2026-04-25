// core/recovery/donor-extraction-registry.ts

export interface PantavionDonorRepositoryRecord {
  projectKey: string;
  urgency: 'critical' | 'high' | 'medium';
  extractionFocus: string[];
  notes: string[];
}

export interface PantavionDonorRepositorySnapshot {
  generatedAt: string;
  donorCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const DONOR_REPOSITORIES: PantavionDonorRepositoryRecord[] = [
  {
    projectKey: 'pantavion-planet-ui',
    urgency: 'critical',
    extractionFocus: ['ui-fragments', 'surface-patterns', 'theme-candidates', 'components', 'brand-candidates'],
    notes: ['Primary UI donor.'],
  },
  {
    projectKey: 'pantavion-planet',
    urgency: 'high',
    extractionFocus: ['clean-layouts', 'surface-structure', 'routing-shapes', 'product-copy'],
    notes: ['Primary clean structure donor.'],
  },
  {
    projectKey: 'pantavion-one',
    urgency: 'high',
    extractionFocus: ['legacy-brand', 'older-pages', 'routing-history', 'copy'],
    notes: ['Primary lineage and brand donor.'],
  },
  {
    projectKey: 'pantaai-template',
    urgency: 'medium',
    extractionFocus: ['template-shapes', 'starter-structures', 'reusable-scaffold'],
    notes: ['Template donor candidate.'],
  },
];

export function listDonorRepositories(): PantavionDonorRepositoryRecord[] {
  return DONOR_REPOSITORIES.map((item) => cloneValue(item));
}

export function getDonorRepositorySnapshot(): PantavionDonorRepositorySnapshot {
  const list = listDonorRepositories();

  return {
    generatedAt: nowIso(),
    donorCount: list.length,
    criticalCount: list.filter((item) => item.urgency === 'critical').length,
    highCount: list.filter((item) => item.urgency === 'high').length,
    mediumCount: list.filter((item) => item.urgency === 'medium').length,
  };
}

export default listDonorRepositories;

