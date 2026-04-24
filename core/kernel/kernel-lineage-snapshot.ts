// core/kernel/kernel-lineage-snapshot.ts

import { listConstitutionalKernels } from './kernel-constitution-registry';
import { listDerivativeKernels } from './derivative-kernel-registry';
import { listKernelRegenerationRules } from './kernel-regeneration-policy';
import type { PantavionKernelEvolutionProposalRecord } from './kernel-evolution-proposal-log';

export interface PantavionKernelLineageNode {
  kernelKey: string;
  title: string;
  kind: 'constitutional' | 'derivative';
  parentKernelKey?: string;
  status: string;
  generationDepth: number;
}

export interface PantavionKernelLineageSnapshot {
  generatedAt: string;
  constitutionalCount: number;
  derivativeCount: number;
  lineageNodeCount: number;
  policyRuleCount: number;
  proposalCount: number;
  nodes: PantavionKernelLineageNode[];
  notes: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

export function buildKernelLineageSnapshot(input: {
  proposals: PantavionKernelEvolutionProposalRecord[];
}): PantavionKernelLineageSnapshot {
  const constitutional = listConstitutionalKernels();
  const derivatives = listDerivativeKernels();
  const policyRules = listKernelRegenerationRules();

  const nodes: PantavionKernelLineageNode[] = [
    ...constitutional.map((item) => ({
      kernelKey: item.kernelKey,
      title: item.title,
      kind: 'constitutional' as const,
      parentKernelKey: undefined,
      status: item.status,
      generationDepth: 0,
    })),
    ...derivatives.map((item) => ({
      kernelKey: item.derivativeKey,
      title: item.title,
      kind: 'derivative' as const,
      parentKernelKey: item.parentKernelKey,
      status: item.status,
      generationDepth: 1,
    })),
  ];

  const notes = [
    constitutional.length === 5
      ? 'Five constitutional kernels are present as root authorities.'
      : 'Constitutional kernel count differs from the expected root seed.',
    derivatives.length > 0
      ? 'Derivative kernels are growing under constitutional authority.'
      : 'No derivative kernels are registered.',
    input.proposals.length > 0
      ? 'Kernel evolution proposals exist for future regenerative growth.'
      : 'No kernel evolution proposals are currently registered.',
    'Regeneration is governed through proposal, simulation, rollout, rollback and lineage rules.',
  ];

  return {
    generatedAt: nowIso(),
    constitutionalCount: constitutional.length,
    derivativeCount: derivatives.length,
    lineageNodeCount: nodes.length,
    policyRuleCount: policyRules.length,
    proposalCount: input.proposals.length,
    nodes,
    notes,
  };
}

export default buildKernelLineageSnapshot;
