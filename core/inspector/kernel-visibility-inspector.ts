// core/inspector/kernel-visibility-inspector.ts

import { listConstitutionalKernels } from '../kernel/kernel-constitution-registry';
import { listDerivativeKernels } from '../kernel/derivative-kernel-registry';
import { listKernelRegenerationRules } from '../kernel/kernel-regeneration-policy';

export interface PantavionKernelVisibilitySnapshot {
  generatedAt: string;
  constitutionalCount: number;
  derivativeCount: number;
  activeDerivativeCount: number;
  seededDerivativeCount: number;
  plannedDerivativeCount: number;
  regenerativeConstitutionalCount: number;
  policyRuleCount: number;
  requiredRuleCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function buildKernelVisibilitySnapshot(): PantavionKernelVisibilitySnapshot {
  const constitutional = listConstitutionalKernels();
  const derivatives = listDerivativeKernels();
  const rules = listKernelRegenerationRules();

  return {
    generatedAt: nowIso(),
    constitutionalCount: constitutional.length,
    derivativeCount: derivatives.length,
    activeDerivativeCount: derivatives.filter((item) => item.status === 'active').length,
    seededDerivativeCount: derivatives.filter((item) => item.status === 'seeded').length,
    plannedDerivativeCount: derivatives.filter((item) => item.status === 'planned').length,
    regenerativeConstitutionalCount: constitutional.filter((item) => item.regenerative).length,
    policyRuleCount: rules.length,
    requiredRuleCount: rules.filter((item) => item.enforcement === 'required').length,
  };
}

export default buildKernelVisibilitySnapshot;
