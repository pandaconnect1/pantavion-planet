// core/recovery/repository-triage-registry.ts

export type PantavionRepositoryDisposition =
  | 'canonical-keep'
  | 'migrate-donor'
  | 'reference-only'
  | 'archive-after-recovery';

export interface PantavionRepositoryTriagePolicyRecord {
  projectKey: string;
  disposition: PantavionRepositoryDisposition;
  urgency: 'critical' | 'high' | 'medium';
  extractionFocus: string[];
  freezeAfterMigration: boolean;
  notes: string[];
}

export interface PantavionRepositoryTriagePolicySnapshot {
  generatedAt: string;
  policyCount: number;
  canonicalCount: number;
  migrateDonorCount: number;
  referenceOnlyCount: number;
  archiveAfterRecoveryCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const TRIAGE_POLICIES: PantavionRepositoryTriagePolicyRecord[] = [
  {
    projectKey: 'pantavion-planet',
    disposition: 'canonical-keep',
    urgency: 'critical',
    extractionFocus: ['live-runtime', 'kernel-base', 'current-routes', 'deployment-target'],
    freezeAfterMigration: false,
    notes: ['Canonical repo from now on.', 'All future integration lands here.'],
  },
  {
    projectKey: 'pantavion-one-clean-ui',
    disposition: 'migrate-donor',
    urgency: 'critical',
    extractionFocus: ['ui-fragments', 'surface-patterns', 'theme-candidates', 'components'],
    freezeAfterMigration: true,
    notes: ['Highest-value likely UI donor.'],
  },
  {
    projectKey: 'pantavion-one-clean',
    disposition: 'migrate-donor',
    urgency: 'high',
    extractionFocus: ['clean-architecture', 'layouts', 'surface-structure', 'older-product-ideas'],
    freezeAfterMigration: true,
    notes: ['High-value clean donor.'],
  },
  {
    projectKey: 'pantavion-one-clean-98it',
    disposition: 'archive-after-recovery',
    urgency: 'medium',
    extractionFocus: ['variant-fragments', 'experimental-clean-ui'],
    freezeAfterMigration: true,
    notes: ['Review only after core donors.'],
  },
  {
    projectKey: 'pantavion-one',
    disposition: 'migrate-donor',
    urgency: 'high',
    extractionFocus: ['legacy-brand', 'older-pages', 'routing-history', 'copy'],
    freezeAfterMigration: true,
    notes: ['Likely major lineage donor.'],
  },
  {
    projectKey: 'pantaai',
    disposition: 'reference-only',
    urgency: 'medium',
    extractionFocus: ['older-naming-lineage', 'concept-history'],
    freezeAfterMigration: true,
    notes: ['Reference lineage, not primary donor.'],
  },
  {
    projectKey: 'pantaai-v1',
    disposition: 'reference-only',
    urgency: 'medium',
    extractionFocus: ['v1-history', 'starter-patterns'],
    freezeAfterMigration: true,
    notes: ['Reference only unless something unique is found.'],
  },
  {
    projectKey: 'pantaai-v1-nf17',
    disposition: 'archive-after-recovery',
    urgency: 'low' as 'medium',
    extractionFocus: ['minor-experiment-review'],
    freezeAfterMigration: true,
    notes: ['Low-confidence fragment.'],
  },
  {
    projectKey: 'pantaai-template',
    disposition: 'migrate-donor',
    urgency: 'medium',
    extractionFocus: ['template-shapes', 'starter-structure', 'reusable-scaffold'],
    freezeAfterMigration: true,
    notes: ['Template donor candidate.'],
  },
  {
    projectKey: 'nextjs-ai-chatbot',
    disposition: 'reference-only',
    urgency: 'medium',
    extractionFocus: ['technical-reference', 'starter-patterns'],
    freezeAfterMigration: true,
    notes: ['Technical scaffold reference, not Pantavion truth.'],
  },
];

export function listRepositoryTriagePolicies(): PantavionRepositoryTriagePolicyRecord[] {
  return TRIAGE_POLICIES.map((item) => cloneValue(item));
}

export function getRepositoryTriagePolicySnapshot(): PantavionRepositoryTriagePolicySnapshot {
  const list = listRepositoryTriagePolicies();

  return {
    generatedAt: nowIso(),
    policyCount: list.length,
    canonicalCount: list.filter((item) => item.disposition === 'canonical-keep').length,
    migrateDonorCount: list.filter((item) => item.disposition === 'migrate-donor').length,
    referenceOnlyCount: list.filter((item) => item.disposition === 'reference-only').length,
    archiveAfterRecoveryCount: list.filter((item) => item.disposition === 'archive-after-recovery').length,
  };
}

export default listRepositoryTriagePolicies;
