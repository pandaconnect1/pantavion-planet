// core/kernel/kernel-constitution-regeneration-wave.ts

import { listConstitutionalKernels, getKernelConstitutionSnapshot } from './kernel-constitution-registry';
import { listDerivativeKernels, getDerivativeKernelSnapshot } from './derivative-kernel-registry';
import { listKernelRegenerationRules, getKernelRegenerationPolicySnapshot } from './kernel-regeneration-policy';
import { createKernelEvolutionProposalLog } from './kernel-evolution-proposal-log';
import { buildKernelLineageSnapshot } from './kernel-lineage-snapshot';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionKernelConstitutionRegenerationWaveOutput {
  generatedAt: string;
  constitutionSnapshot: ReturnType<typeof getKernelConstitutionSnapshot>;
  derivativeSnapshot: ReturnType<typeof getDerivativeKernelSnapshot>;
  regenerationPolicySnapshot: ReturnType<typeof getKernelRegenerationPolicySnapshot>;
  proposalSnapshot: ReturnType<ReturnType<typeof createKernelEvolutionProposalLog>['getSnapshot']>;
  lineageSnapshot: ReturnType<typeof buildKernelLineageSnapshot>;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionKernelConstitutionRegenerationWaveOutput): string {
  const constitutional = listConstitutionalKernels();
  const derivatives = listDerivativeKernels();
  const rules = listKernelRegenerationRules();

  return [
    'PANTAVION KERNEL CONSTITUTION AND REGENERATION WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'CONSTITUTION',
    `constitutionalKernelCount=${output.constitutionSnapshot.constitutionalKernelCount}`,
    `regenerativeKernelCount=${output.constitutionSnapshot.regenerativeKernelCount}`,
    `lightweightKernelCount=${output.constitutionSnapshot.lightweightKernelCount}`,
    '',
    ...constitutional.flatMap((item) => [
      `${item.kernelKey}`,
      `title=${item.title}`,
      `domain=${item.domain}`,
      `status=${item.status}`,
      `canGenerateDerivativeKernels=${item.canGenerateDerivativeKernels ? 'yes' : 'no'}`,
      '',
    ]),
    'DERIVATIVE KERNELS',
    `derivativeKernelCount=${output.derivativeSnapshot.derivativeKernelCount}`,
    `activeCount=${output.derivativeSnapshot.activeCount}`,
    `seededCount=${output.derivativeSnapshot.seededCount}`,
    `plannedCount=${output.derivativeSnapshot.plannedCount}`,
    '',
    ...derivatives.flatMap((item) => [
      `${item.derivativeKey}`,
      `parentKernelKey=${item.parentKernelKey}`,
      `status=${item.status}`,
      `rolloutStage=${item.rolloutStage}`,
      '',
    ]),
    'REGENERATION POLICY',
    `ruleCount=${output.regenerationPolicySnapshot.ruleCount}`,
    `requiredCount=${output.regenerationPolicySnapshot.requiredCount}`,
    `recommendedCount=${output.regenerationPolicySnapshot.recommendedCount}`,
    '',
    ...rules.flatMap((item) => [
      `${item.ruleKey}`,
      `category=${item.category}`,
      `enforcement=${item.enforcement}`,
      '',
    ]),
    'PROPOSALS',
    `proposalCount=${output.proposalSnapshot.proposalCount}`,
    `simulatedCount=${output.proposalSnapshot.simulatedCount}`,
    `approvedCount=${output.proposalSnapshot.approvedCount}`,
    `rolledOutCount=${output.proposalSnapshot.rolledOutCount}`,
    '',
    'LINEAGE',
    `lineageNodeCount=${output.lineageSnapshot.lineageNodeCount}`,
    `constitutionalCount=${output.lineageSnapshot.constitutionalCount}`,
    `derivativeCount=${output.lineageSnapshot.derivativeCount}`,
    `policyRuleCount=${output.lineageSnapshot.policyRuleCount}`,
    `proposalCount=${output.lineageSnapshot.proposalCount}`,
    '',
    'NOTES',
    ...output.lineageSnapshot.notes.map((item) => `- ${item}`),
  ].join('\n');
}

export async function runKernelConstitutionRegenerationWave(): Promise<PantavionKernelConstitutionRegenerationWaveOutput> {
  const proposalLog = createKernelEvolutionProposalLog();

  proposalLog.appendProposal({
    targetKernelKey: 'dormant-thread-reactivation',
    targetType: 'derivative',
    proposedBy: 'kernel-governor',
    title: 'Promote dormant thread reactivation to active operational derivative',
    rationale:
      'Dormant thread wake-up is essential for long-term continuity and should move beyond seed status.',
    status: 'simulated',
    parentKernelKey: 'memory-thread',
    notes: [
      'Simulation required before operational rollout.',
      'Must preserve thread lineage and reminder continuity.',
    ],
  });

  proposalLog.appendProposal({
    targetKernelKey: 'intelligence-locale-authority',
    targetType: 'derivative',
    proposedBy: 'kernel-governor',
    title: 'Seed locale-aware intelligence authority as a constitutional derivative',
    rationale:
      'Global scale requires governed intelligence authority by locale, dialect and support level.',
    status: 'proposed',
    parentKernelKey: 'intelligence-authority',
    notes: [
      'Must inherit constitutional locale sovereignty rules.',
      'Promotion depends on provider registry readiness.',
    ],
  });

  proposalLog.appendProposal({
    targetKernelKey: 'commercial-billing-rail',
    targetType: 'derivative',
    proposedBy: 'kernel-governor',
    title: 'Prepare commercial billing rail as revenue infrastructure derivative',
    rationale:
      'The platform requires revenue infrastructure to support durable deployment and scaling.',
    status: 'approved',
    parentKernelKey: 'execution-runtime',
    notes: [
      'Billing rail must preserve audit lineage.',
      'Rollout must remain reversible.',
    ],
  });

  const constitutionSnapshot = getKernelConstitutionSnapshot();
  const derivativeSnapshot = getDerivativeKernelSnapshot();
  const regenerationPolicySnapshot = getKernelRegenerationPolicySnapshot();
  const proposalSnapshot = proposalLog.getSnapshot();
  const lineageSnapshot = buildKernelLineageSnapshot({
    proposals: proposalLog.listProposals(),
  });

  const output: PantavionKernelConstitutionRegenerationWaveOutput = {
    generatedAt: nowIso(),
    constitutionSnapshot,
    derivativeSnapshot,
    regenerationPolicySnapshot,
    proposalSnapshot,
    lineageSnapshot,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'kernel.constitution-regeneration.latest',
    kind: 'report',
    payload: {
      constitutionSnapshot: output.constitutionSnapshot,
      derivativeSnapshot: output.derivativeSnapshot,
      regenerationPolicySnapshot: output.regenerationPolicySnapshot,
      proposalSnapshot: output.proposalSnapshot,
      lineageSnapshot: output.lineageSnapshot,
    },
    tags: ['kernel', 'constitution', 'regeneration', 'latest'],
    metadata: {
      constitutionalKernelCount: output.constitutionSnapshot.constitutionalKernelCount,
      derivativeKernelCount: output.derivativeSnapshot.derivativeKernelCount,
      proposalCount: output.proposalSnapshot.proposalCount,
      lineageNodeCount: output.lineageSnapshot.lineageNodeCount,
    },
  });

  return output;
}

export default runKernelConstitutionRegenerationWave;
