// core/governance/global-governance-closure-wave.ts

import {
  listJurisdictionComplianceRecords,
  getJurisdictionComplianceSnapshot,
} from './global-jurisdiction-compliance-registry';
import {
  listCulturalAdaptationOverlays,
  getCulturalAdaptationOverlaySnapshot,
} from './cultural-adaptation-overlay-registry';
import {
  listLegalSafeControlRecords,
  getLegalSafeGovernanceSnapshot,
} from './legal-safe-adaptation-governance-registry';
import {
  evaluateLegalSafeAction,
  getLegalSafePolicySnapshot,
  type PantavionLegalSafeEvaluationRecord,
} from './legal-safe-adaptation-policy';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionGlobalGovernanceClosureWaveOutput {
  generatedAt: string;
  jurisdictionSnapshot: ReturnType<typeof getJurisdictionComplianceSnapshot>;
  culturalSnapshot: ReturnType<typeof getCulturalAdaptationOverlaySnapshot>;
  legalSafeSnapshot: ReturnType<typeof getLegalSafeGovernanceSnapshot>;
  policySnapshot: ReturnType<typeof getLegalSafePolicySnapshot>;
  evaluations: PantavionLegalSafeEvaluationRecord[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionGlobalGovernanceClosureWaveOutput): string {
  const jurisdictions = listJurisdictionComplianceRecords();
  const overlays = listCulturalAdaptationOverlays();
  const controls = listLegalSafeControlRecords();

  return [
    'PANTAVION GLOBAL GOVERNANCE CLOSURE WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'JURISDICTIONS',
    `jurisdictionCount=${output.jurisdictionSnapshot.jurisdictionCount}`,
    `activeCount=${output.jurisdictionSnapshot.activeCount}`,
    `seededCount=${output.jurisdictionSnapshot.seededCount}`,
    `sovereignOverlayCount=${output.jurisdictionSnapshot.sovereignOverlayCount}`,
    `founderReviewCount=${output.jurisdictionSnapshot.founderReviewCount}`,
    '',
    ...jurisdictions.flatMap((item) => [
      `${item.jurisdictionKey}`,
      `deploymentMode=${item.deploymentMode}`,
      `privacyPosture=${item.privacyPosture}`,
      `aiGovernancePosture=${item.aiGovernancePosture}`,
      `paymentPosture=${item.paymentPosture}`,
      `founderReviewRequired=${item.founderReviewRequired ? 'yes' : 'no'}`,
      '',
    ]),
    'CULTURAL ADAPTATION',
    `overlayCount=${output.culturalSnapshot.overlayCount}`,
    `criticalReligiousSensitivityCount=${output.culturalSnapshot.criticalReligiousSensitivityCount}`,
    `criticalInstitutionalSensitivityCount=${output.culturalSnapshot.criticalInstitutionalSensitivityCount}`,
    `highHumanEscalationCount=${output.culturalSnapshot.highHumanEscalationCount}`,
    '',
    ...overlays.flatMap((item) => [
      `${item.overlayKey}`,
      `localeKey=${item.localeKey}`,
      `religiousSensitivity=${item.religiousSensitivity}`,
      `institutionalSensitivity=${item.institutionalSensitivity}`,
      `familyContextSensitivity=${item.familyContextSensitivity}`,
      `escalationPreference=${item.escalationPreference}`,
      '',
    ]),
    'LEGAL SAFE CONTROLS',
    `controlCount=${output.legalSafeSnapshot.controlCount}`,
    `requiredCount=${output.legalSafeSnapshot.requiredCount}`,
    `recommendedCount=${output.legalSafeSnapshot.recommendedCount}`,
    `blockingControlCount=${output.legalSafeSnapshot.blockingControlCount}`,
    `reviewControlCount=${output.legalSafeSnapshot.reviewControlCount}`,
    '',
    ...controls.flatMap((item) => [
      `${item.controlKey}`,
      `category=${item.category}`,
      `enforcement=${item.enforcement}`,
      `executionMode=${item.executionMode}`,
      '',
    ]),
    'LEGAL SAFE POLICY EVALUATIONS',
    `evaluationCount=${output.policySnapshot.evaluationCount}`,
    `allowedCount=${output.policySnapshot.allowedCount}`,
    `blockedCount=${output.policySnapshot.blockedCount}`,
    `criticalBlockedCount=${output.policySnapshot.criticalBlockedCount}`,
    '',
    ...output.evaluations.flatMap((item) => [
      `${item.actionType}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `riskTier=${item.riskTier}`,
      `reason=${item.reason}`,
      '',
    ]),
  ].join('\n');
}

export async function runGlobalGovernanceClosureWave(): Promise<PantavionGlobalGovernanceClosureWaveOutput> {
  const evaluations: PantavionLegalSafeEvaluationRecord[] = [
    evaluateLegalSafeAction('extract-public-principles'),
    evaluateLegalSafeAction('rewrite-clean-spec'),
    evaluateLegalSafeAction('copy-foreign-source-code'),
    evaluateLegalSafeAction('use-leaked-internal-doc'),
    evaluateLegalSafeAction('ship-sensitive-jurisdiction-without-review'),
    evaluateLegalSafeAction('promote-global-policy-with-founder-approval'),
  ];

  const output: PantavionGlobalGovernanceClosureWaveOutput = {
    generatedAt: nowIso(),
    jurisdictionSnapshot: getJurisdictionComplianceSnapshot(),
    culturalSnapshot: getCulturalAdaptationOverlaySnapshot(),
    legalSafeSnapshot: getLegalSafeGovernanceSnapshot(),
    policySnapshot: getLegalSafePolicySnapshot(evaluations),
    evaluations,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'governance.global-closure.latest',
    kind: 'report',
    payload: {
      jurisdictionSnapshot: output.jurisdictionSnapshot,
      culturalSnapshot: output.culturalSnapshot,
      legalSafeSnapshot: output.legalSafeSnapshot,
      policySnapshot: output.policySnapshot,
      evaluations: output.evaluations,
      jurisdictions: listJurisdictionComplianceRecords(),
      overlays: listCulturalAdaptationOverlays(),
      controls: listLegalSafeControlRecords(),
    },
    tags: ['governance', 'global', 'legal-safe', 'closure', 'latest'],
    metadata: {
      jurisdictionCount: output.jurisdictionSnapshot.jurisdictionCount,
      overlayCount: output.culturalSnapshot.overlayCount,
      controlCount: output.legalSafeSnapshot.controlCount,
      blockedCount: output.policySnapshot.blockedCount,
    },
  });

  return output;
}

export default runGlobalGovernanceClosureWave;
