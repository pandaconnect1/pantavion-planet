// core/recovery/project-fragment-registry.ts

export interface PantavionProjectFragmentRecord {
  projectKey: string;
  role:
    | 'canonical-current'
    | 'candidate-ui'
    | 'candidate-clean'
    | 'candidate-legacy'
    | 'external-reference'
    | 'recovery-candidate';
  importance: 'critical' | 'high' | 'medium';
  likelyContains: string[];
  notes: string[];
}

export interface PantavionProjectFragmentSnapshot {
  generatedAt: string;
  projectCount: number;
  criticalCount: number;
  recoveryCandidateCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const PROJECT_FRAGMENTS: PantavionProjectFragmentRecord[] = [
  {
    projectKey: 'pantavion-planet',
    role: 'canonical-current',
    importance: 'critical',
    likelyContains: ['live-shell', 'current-routes', 'middleware', 'kernel-foundation'],
    notes: ['Current live project on Vercel.'],
  },
  {
    projectKey: 'pantavion-one-clean-ui',
    role: 'candidate-ui',
    importance: 'critical',
    likelyContains: ['ui-fragments', 'themes', 'home-surface', 'components'],
    notes: ['Likely source for cleaner Pantavion UI fragments.'],
  },
  {
    projectKey: 'pantavion-one-clean',
    role: 'candidate-clean',
    importance: 'high',
    likelyContains: ['cleaner-architecture', 'older-surface-ideas', 'layouts'],
    notes: ['Likely source for cleaner baseline product structure.'],
  },
  {
    projectKey: 'pantavion-one-clean-98it',
    role: 'candidate-clean',
    importance: 'medium',
    likelyContains: ['experimental-clean-fragment', 'forked-surface-variants'],
    notes: ['Potential derived fragment from clean branch family.'],
  },
  {
    projectKey: 'pantavion-one',
    role: 'candidate-legacy',
    importance: 'high',
    likelyContains: ['legacy-canonical-ideas', 'older-brand-assets', 'routing-history'],
    notes: ['Likely older Pantavion lineage project.'],
  },
  {
    projectKey: 'pantaai',
    role: 'candidate-legacy',
    importance: 'medium',
    likelyContains: ['naming-ancestor', 'older-product-identity', 'starter-fragments'],
    notes: ['Potential earlier naming lineage for Pantavion evolution.'],
  },
  {
    projectKey: 'pantaai-v1',
    role: 'candidate-legacy',
    importance: 'medium',
    likelyContains: ['v1-fragments', 'early-baselines'],
    notes: ['Potential early version fragment.'],
  },
  {
    projectKey: 'pantaai-v1-nf17',
    role: 'candidate-legacy',
    importance: 'medium',
    likelyContains: ['v1-derived-experiment'],
    notes: ['Potential experiment or branch-like snapshot.'],
  },
  {
    projectKey: 'pantaai-template',
    role: 'recovery-candidate',
    importance: 'medium',
    likelyContains: ['template-fragments', 'starter-structures'],
    notes: ['Template lineage may contain useful reusable shapes.'],
  },
  {
    projectKey: 'nextjs-ai-chatbot',
    role: 'external-reference',
    importance: 'medium',
    likelyContains: ['starter-scaffold', 'chat-ui-patterns'],
    notes: ['Reference scaffold, not Pantavion truth by itself.'],
  },
];

export function listProjectFragments(): PantavionProjectFragmentRecord[] {
  return PROJECT_FRAGMENTS.map((item) => cloneValue(item));
}

export function getProjectFragmentSnapshot(): PantavionProjectFragmentSnapshot {
  const list = listProjectFragments();

  return {
    generatedAt: nowIso(),
    projectCount: list.length,
    criticalCount: list.filter((item) => item.importance === 'critical').length,
    recoveryCandidateCount: list.filter((item) => item.role === 'recovery-candidate' || item.role === 'candidate-ui' || item.role === 'candidate-clean' || item.role === 'candidate-legacy').length,
  };
}

export default listProjectFragments;

