// core/governance/founder-human-final-authority-wave.ts

import {
  listFounderAuthorityRecords,
  getFounderAuthorityRegistrySnapshot,
} from './founder-human-final-authority-registry';
import {
  evaluateFounderAuthorityDecision,
  getFounderAuthorityPolicySnapshot,
  type PantavionFounderAuthorityDecisionOutput,
} from './founder-human-final-authority-policy';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionFounderHumanFinalAuthorityWaveOutput {
  generatedAt: string;
  registrySnapshot: ReturnType<typeof getFounderAuthorityRegistrySnapshot>;
  policySnapshot: ReturnType<typeof getFounderAuthorityPolicySnapshot>;
  evaluations: PantavionFounderAuthorityDecisionOutput[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionFounderHumanFinalAuthorityWaveOutput): string {
  const records = listFounderAuthorityRecords();

  return [
    'PANTAVION FOUNDER HUMAN FINAL AUTHORITY WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'REGISTRY',
    `domainCount=${output.registrySnapshot.domainCount}`,
    `founderFinalCount=${output.registrySnapshot.founderFinalCount}`,
    `governorGatedCount=${output.registrySnapshot.governorGatedCount}`,
    `autoExecutableCount=${output.registrySnapshot.autoExecutableCount}`,
    `forbiddenWithoutFounderCount=${output.registrySnapshot.forbiddenWithoutFounderCount}`,
    `criticalCount=${output.registrySnapshot.criticalCount}`,
    '',
    ...records.flatMap((item) => [
      `${item.domainKey}`,
      `authorityMode=${item.authorityMode}`,
      `riskTier=${item.riskTier}`,
      `founderApprovalRequired=${item.founderApprovalRequired ? 'yes' : 'no'}`,
      `governorReviewRequired=${item.governorReviewRequired ? 'yes' : 'no'}`,
      '',
    ]),
    'POLICY EVALUATIONS',
    `evaluatedCount=${output.policySnapshot.evaluatedCount}`,
    `allowedCount=${output.policySnapshot.allowedCount}`,
    `blockedCount=${output.policySnapshot.blockedCount}`,
    `founderRequiredCount=${output.policySnapshot.founderRequiredCount}`,
    `governorRequiredCount=${output.policySnapshot.governorRequiredCount}`,
    '',
    ...output.evaluations.flatMap((item) => [
      `${item.domainKey}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `authorityMode=${item.authorityMode}`,
      `riskTier=${item.riskTier}`,
      `requiredHumanFinalAuthority=${item.requiredHumanFinalAuthority ? 'yes' : 'no'}`,
      `requiredGovernorReview=${item.requiredGovernorReview ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
  ].join('\n');
}

export async function runFounderHumanFinalAuthorityWave(): Promise<PantavionFounderHumanFinalAuthorityWaveOutput> {
  const evaluations: PantavionFounderAuthorityDecisionOutput[] = [
    evaluateFounderAuthorityDecision({
      domainKey: 'constitutional-mutation',
      requestedBy: 'kernel-governor',
      requestedAction: 'mutate-root-constitution',
      founderApproved: false,
      governorApproved: true,
    }),
    evaluateFounderAuthorityDecision({
      domainKey: 'derivative-kernel-promotion',
      requestedBy: 'kernel-governor',
      requestedAction: 'promote-dormant-thread-reactivation',
      founderApproved: false,
      governorApproved: true,
    }),
    evaluateFounderAuthorityDecision({
      domainKey: 'thread-reminder-continuity',
      requestedBy: 'memory-thread-kernel',
      requestedAction: 'schedule-reminder-follow-up',
      founderApproved: false,
      governorApproved: false,
    }),
    evaluateFounderAuthorityDecision({
      domainKey: 'global-commercial-policy',
      requestedBy: 'commercial-billing-rail',
      requestedAction: 'change-global-pricing-policy',
      founderApproved: true,
      governorApproved: true,
    }),
    evaluateFounderAuthorityDecision({
      domainKey: 'canonical-fact-finalization',
      requestedBy: 'truth-identity-kernel',
      requestedAction: 'finalize-user-canonical-fact',
      founderApproved: false,
      governorApproved: true,
    }),
  ];

  const output: PantavionFounderHumanFinalAuthorityWaveOutput = {
    generatedAt: nowIso(),
    registrySnapshot: getFounderAuthorityRegistrySnapshot(),
    policySnapshot: getFounderAuthorityPolicySnapshot(evaluations),
    evaluations,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'governance.founder-human-final-authority.latest',
    kind: 'report',
    payload: {
      registrySnapshot: output.registrySnapshot,
      policySnapshot: output.policySnapshot,
      evaluations: output.evaluations,
      records: listFounderAuthorityRecords(),
    },
    tags: ['governance', 'founder-authority', 'human-final-authority', 'latest'],
    metadata: {
      domainCount: output.registrySnapshot.domainCount,
      founderFinalCount: output.registrySnapshot.founderFinalCount,
      blockedCount: output.policySnapshot.blockedCount,
      allowedCount: output.policySnapshot.allowedCount,
    },
  });

  return output;
}

export default runFounderHumanFinalAuthorityWave;
