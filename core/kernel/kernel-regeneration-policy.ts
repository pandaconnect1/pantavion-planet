// core/kernel/kernel-regeneration-policy.ts

export type PantavionRegenerationPolicyCategory =
  | 'proposal'
  | 'simulation'
  | 'rollout'
  | 'rollback'
  | 'retirement'
  | 'lineage';

export interface PantavionKernelRegenerationRule {
  ruleKey: string;
  title: string;
  category: PantavionRegenerationPolicyCategory;
  enforcement: 'required' | 'recommended';
  description: string;
}

export interface PantavionKernelRegenerationPolicySnapshot {
  generatedAt: string;
  ruleCount: number;
  requiredCount: number;
  recommendedCount: number;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

const REGENERATION_RULES: PantavionKernelRegenerationRule[] = [
  {
    ruleKey: 'constitution-first',
    title: 'Constitution First',
    category: 'proposal',
    enforcement: 'required',
    description:
      'No derivative kernel may be promoted if it violates the constitutional root kernel boundaries.',
  },
  {
    ruleKey: 'proposal-before-mutation',
    title: 'Proposal Before Mutation',
    category: 'proposal',
    enforcement: 'required',
    description:
      'No self-improving mutation may alter kernel structure without an explicit tracked proposal.',
  },
  {
    ruleKey: 'simulation-before-rollout',
    title: 'Simulation Before Rollout',
    category: 'simulation',
    enforcement: 'required',
    description:
      'Each major kernel evolution must be simulated before it reaches rollout or cutover.',
  },
  {
    ruleKey: 'reversible-rollout',
    title: 'Reversible Rollout',
    category: 'rollback',
    enforcement: 'required',
    description:
      'Every rollout must preserve a rollback path so regeneration never becomes irreversible chaos.',
  },
  {
    ruleKey: 'retire-with-migration',
    title: 'Retire Only With Migration',
    category: 'retirement',
    enforcement: 'required',
    description:
      'A kernel may retire only when its truth, memory and obligations have a migration path.',
  },
  {
    ruleKey: 'lineage-must-survive',
    title: 'Lineage Must Survive',
    category: 'lineage',
    enforcement: 'required',
    description:
      'Every generation change must preserve lineage so the system can explain where it came from.',
  },
  {
    ruleKey: 'lightweight-regeneration',
    title: 'Lightweight Regeneration',
    category: 'rollout',
    enforcement: 'recommended',
    description:
      'Derivative kernels should be as lightweight as possible so multiplication improves the system rather than bloating it.',
  },
  {
    ruleKey: 'bounded-self-improvement',
    title: 'Bounded Self Improvement',
    category: 'proposal',
    enforcement: 'recommended',
    description:
      'Self-improvement should create bounded proposals, not unrestricted autonomous structural drift.',
  },
];

export function listKernelRegenerationRules(): PantavionKernelRegenerationRule[] {
  return REGENERATION_RULES.map((item) => cloneValue(item));
}

export function getKernelRegenerationPolicySnapshot(): PantavionKernelRegenerationPolicySnapshot {
  const list = listKernelRegenerationRules();

  return {
    generatedAt: nowIso(),
    ruleCount: list.length,
    requiredCount: list.filter((item) => item.enforcement === 'required').length,
    recommendedCount: list.filter((item) => item.enforcement === 'recommended').length,
  };
}

export default listKernelRegenerationRules;
