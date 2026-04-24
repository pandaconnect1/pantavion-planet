// core/governance/legal-safe-adaptation-governance-registry.ts

export type PantavionLegalSafeControlCategory =
  | 'copyright-boundary'
  | 'trade-secret-boundary'
  | 'patent-screen'
  | 'trademark-boundary'
  | 'jurisdiction-gate'
  | 'independent-development'
  | 'human-approval';

export type PantavionLegalSafeEnforcement =
  | 'required'
  | 'recommended';

export type PantavionLegalSafeExecutionMode =
  | 'block'
  | 'review'
  | 'record'
  | 'advisory';

export interface PantavionLegalSafeControlRecord {
  controlKey: string;
  title: string;
  category: PantavionLegalSafeControlCategory;
  enforcement: PantavionLegalSafeEnforcement;
  executionMode: PantavionLegalSafeExecutionMode;
  description: string;
}

export interface PantavionLegalSafeGovernanceSnapshot {
  generatedAt: string;
  controlCount: number;
  requiredCount: number;
  recommendedCount: number;
  blockingControlCount: number;
  reviewControlCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const LEGAL_SAFE_CONTROLS: PantavionLegalSafeControlRecord[] = [
  {
    controlKey: 'principle-only-intake',
    title: 'Principle Only Intake',
    category: 'copyright-boundary',
    enforcement: 'required',
    executionMode: 'block',
    description: 'Only public principles and capability lessons may be absorbed. Protected expression must not be copied.',
  },
  {
    controlKey: 'no-leaked-internals',
    title: 'No Leaked Internals',
    category: 'trade-secret-boundary',
    enforcement: 'required',
    executionMode: 'block',
    description: 'Leaked docs, private repos and secret internals are never allowed into Pantavion design intake.',
  },
  {
    controlKey: 'clean-spec-required',
    title: 'Clean Spec Required',
    category: 'independent-development',
    enforcement: 'required',
    executionMode: 'record',
    description: 'Every inspired feature must be rewritten as an independent Pantavion specification.',
  },
  {
    controlKey: 'patent-screen-major-waves',
    title: 'Patent Screen Major Waves',
    category: 'patent-screen',
    enforcement: 'recommended',
    executionMode: 'review',
    description: 'Major technical/commercial rollout waves should be screened for patent risk by market.',
  },
  {
    controlKey: 'no-brand-confusion',
    title: 'No Brand Confusion',
    category: 'trademark-boundary',
    enforcement: 'required',
    executionMode: 'block',
    description: 'Pantavion naming and surface identity must never create confusion with other brands.',
  },
  {
    controlKey: 'jurisdiction-before-rollout',
    title: 'Jurisdiction Before Rollout',
    category: 'jurisdiction-gate',
    enforcement: 'required',
    executionMode: 'review',
    description: 'Sensitive countries or sovereign overlays require jurisdiction review before production rollout.',
  },
  {
    controlKey: 'founder-approval-high-risk',
    title: 'Founder Approval High Risk',
    category: 'human-approval',
    enforcement: 'required',
    executionMode: 'review',
    description: 'High-risk global adaptation changes require founder final authority.',
  },
];

export function listLegalSafeControlRecords(): PantavionLegalSafeControlRecord[] {
  return LEGAL_SAFE_CONTROLS.map((item) => cloneValue(item));
}

export function getLegalSafeGovernanceSnapshot(): PantavionLegalSafeGovernanceSnapshot {
  const list = listLegalSafeControlRecords();

  return {
    generatedAt: nowIso(),
    controlCount: list.length,
    requiredCount: list.filter((item) => item.enforcement === 'required').length,
    recommendedCount: list.filter((item) => item.enforcement === 'recommended').length,
    blockingControlCount: list.filter((item) => item.executionMode === 'block').length,
    reviewControlCount: list.filter((item) => item.executionMode === 'review').length,
  };
}

export default listLegalSafeControlRecords;
