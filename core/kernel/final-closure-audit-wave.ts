// core/kernel/final-closure-audit-wave.ts

import { runMultilingualVoicePolicy } from '../runtime/voice-multilingual-policy';
import { runExternalRoutingPromotionMiniWave } from '../protocol/external-routing-promotion-mini-wave';
import { runRouteSelectorHardeningMiniWave } from '../protocol/route-selector-hardening-mini-wave';
import { runDirectDispatchPromotionMiniWave } from '../protocol/direct-dispatch-promotion-mini-wave';
import { runPrimaryLaneCutoverMiniWave } from '../protocol/primary-lane-cutover-mini-wave';
import { runFallbackBypassEnforcementMiniWave } from '../protocol/fallback-bypass-enforcement-mini-wave';
import {
  evaluateFinalClosureAudit,
  type PantavionFinalClosureAuditDecision,
  type PantavionFinalClosureAuditInput,
} from './final-closure-audit-policy';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionFinalClosureAuditWaveOutput {
  generatedAt: string;
  multilingual: PantavionFinalClosureAuditInput['multilingual'];
  externalRoutingPromotion: PantavionFinalClosureAuditInput['externalRoutingPromotion'];
  routeSelector: PantavionFinalClosureAuditInput['routeSelector'];
  directDispatch: PantavionFinalClosureAuditInput['directDispatch'];
  primaryCutover: PantavionFinalClosureAuditInput['primaryCutover'];
  fallbackBypass: PantavionFinalClosureAuditInput['fallbackBypass'];
  decision: PantavionFinalClosureAuditDecision;
  lockWritten: boolean;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionFinalClosureAuditWaveOutput): string {
  return [
    'PANTAVION FINAL CLOSURE AND AUDIT WAVE',
    `generatedAt=${output.generatedAt}`,
    `closureStatus=${output.decision.status}`,
    `closureScore=${output.decision.closureScore}`,
    `aggregateBlockedCount=${output.decision.aggregateBlockedCount}`,
    `lockWritten=${output.lockWritten ? 'yes' : 'no'}`,
    '',
    'VOICE',
    `selectedLocale=${output.multilingual.selectedLocale}`,
    `selectedSource=${output.multilingual.selectedSource}`,
    `candidateCount=${output.multilingual.candidateCount}`,
    '',
    'ROUTING PROMOTION',
    `status=${output.externalRoutingPromotion.status}`,
    `promotedCount=${output.externalRoutingPromotion.promotedCount}`,
    `bridgeReadyCount=${output.externalRoutingPromotion.bridgeReadyCount}`,
    `watchCount=${output.externalRoutingPromotion.watchCount}`,
    `blockedCount=${output.externalRoutingPromotion.blockedCount}`,
    '',
    'ROUTE SELECTOR',
    `status=${output.routeSelector.status}`,
    `directSelectedCount=${output.routeSelector.directSelectedCount}`,
    `fallbackSelectedCount=${output.routeSelector.fallbackSelectedCount}`,
    `watchCount=${output.routeSelector.watchCount}`,
    `blockedCount=${output.routeSelector.blockedCount}`,
    '',
    'DIRECT DISPATCH',
    `status=${output.directDispatch.status}`,
    `promotedCount=${output.directDispatch.promotedCount}`,
    `fallbackPromotedCount=${output.directDispatch.fallbackPromotedCount}`,
    `watchCount=${output.directDispatch.watchCount}`,
    `blockedCount=${output.directDispatch.blockedCount}`,
    '',
    'PRIMARY CUTOVER',
    `status=${output.primaryCutover.status}`,
    `primaryActiveCount=${output.primaryCutover.primaryActiveCount}`,
    `cutoverPendingCount=${output.primaryCutover.cutoverPendingCount}`,
    `watchCount=${output.primaryCutover.watchCount}`,
    `blockedCount=${output.primaryCutover.blockedCount}`,
    '',
    'FALLBACK BYPASS',
    `status=${output.fallbackBypass.status}`,
    `bypassActiveCount=${output.fallbackBypass.bypassActiveCount}`,
    `cutoverPendingCount=${output.fallbackBypass.cutoverPendingCount}`,
    `watchCount=${output.fallbackBypass.watchCount}`,
    `blockedCount=${output.fallbackBypass.blockedCount}`,
    '',
    'ACTIONS',
    ...output.decision.actions.map((item) => `- ${item}`),
  ].join('\n');
}

export async function runFinalClosureAuditWave(): Promise<PantavionFinalClosureAuditWaveOutput> {
  const multilingualOutput = runMultilingualVoicePolicy({
    explicitUserLocale: 'el-GR',
    conversationLocale: 'en-US',
    cityKey: 'athens-gr',
    countryCode: 'GR',
    globalFallbackLocale: 'en-US',
  });

  const externalRoutingPromotionOutput = await runExternalRoutingPromotionMiniWave();
  const routeSelectorOutput = await runRouteSelectorHardeningMiniWave();
  const directDispatchOutput = await runDirectDispatchPromotionMiniWave();
  const primaryCutoverOutput = await runPrimaryLaneCutoverMiniWave();
  const fallbackBypassOutput = await runFallbackBypassEnforcementMiniWave();

  const auditInput: PantavionFinalClosureAuditInput = {
    multilingual: {
      selectedLocale: multilingualOutput.resolution.selectedLocale,
      selectedSource: multilingualOutput.resolution.selectedSource,
      candidateCount: multilingualOutput.resolution.candidates.length,
    },
    externalRoutingPromotion: {
      status: externalRoutingPromotionOutput.decision.status,
      promotedCount: externalRoutingPromotionOutput.decision.promotedCount,
      bridgeReadyCount: externalRoutingPromotionOutput.decision.bridgeReadyCount,
      watchCount: externalRoutingPromotionOutput.decision.watchCount,
      blockedCount: externalRoutingPromotionOutput.decision.blockedCount,
    },
    routeSelector: {
      status: routeSelectorOutput.decision.status,
      directSelectedCount: routeSelectorOutput.decision.directSelectedCount,
      fallbackSelectedCount: routeSelectorOutput.decision.fallbackSelectedCount,
      watchCount: routeSelectorOutput.decision.watchCount,
      blockedCount: routeSelectorOutput.decision.blockedCount,
    },
    directDispatch: {
      status: directDispatchOutput.decision.status,
      promotedCount: directDispatchOutput.decision.promotedCount,
      fallbackPromotedCount: directDispatchOutput.decision.fallbackPromotedCount,
      watchCount: directDispatchOutput.decision.watchCount,
      blockedCount: directDispatchOutput.decision.blockedCount,
    },
    primaryCutover: {
      status: primaryCutoverOutput.decision.status,
      primaryActiveCount: primaryCutoverOutput.decision.primaryActiveCount,
      cutoverPendingCount: primaryCutoverOutput.decision.cutoverPendingCount,
      watchCount: primaryCutoverOutput.decision.watchCount,
      blockedCount: primaryCutoverOutput.decision.blockedCount,
    },
    fallbackBypass: {
      status: fallbackBypassOutput.decision.status,
      bypassActiveCount: fallbackBypassOutput.decision.bypassActiveCount,
      cutoverPendingCount: fallbackBypassOutput.decision.cutoverPendingCount,
      watchCount: fallbackBypassOutput.decision.watchCount,
      blockedCount: fallbackBypassOutput.decision.blockedCount,
    },
  };

  const decision = evaluateFinalClosureAudit(auditInput);

  let lockWritten = false;

  saveKernelState({
    key: 'kernel.final-closure-audit.latest',
    kind: 'report',
    payload: {
      multilingual: auditInput.multilingual,
      externalRoutingPromotion: auditInput.externalRoutingPromotion,
      routeSelector: auditInput.routeSelector,
      directDispatch: auditInput.directDispatch,
      primaryCutover: auditInput.primaryCutover,
      fallbackBypass: auditInput.fallbackBypass,
      decision,
    },
    tags: ['kernel', 'final-closure', 'audit', 'latest'],
    metadata: {
      closureStatus: decision.status,
      closureScore: decision.closureScore,
      aggregateBlockedCount: decision.aggregateBlockedCount,
      bypassActiveCount: auditInput.fallbackBypass.bypassActiveCount,
    },
  });

  if (decision.status === 'closed-primary-ready') {
    saveKernelState({
      key: 'kernel.primary-ready-lock.latest',
      kind: 'report',
      payload: {
        lockedAt: nowIso(),
        closureStatus: decision.status,
        closureScore: decision.closureScore,
        selectedLocale: auditInput.multilingual.selectedLocale,
        selectorStatus: auditInput.routeSelector.status,
        bypassStatus: auditInput.fallbackBypass.status,
        bypassActiveCount: auditInput.fallbackBypass.bypassActiveCount,
      },
      tags: ['kernel', 'primary-ready', 'lock', 'latest'],
      metadata: {
        closureStatus: decision.status,
        closureScore: decision.closureScore,
        selectedLocale: auditInput.multilingual.selectedLocale,
        bypassActiveCount: auditInput.fallbackBypass.bypassActiveCount,
      },
    });

    lockWritten = true;
  }

  const output: PantavionFinalClosureAuditWaveOutput = {
    generatedAt: nowIso(),
    multilingual: auditInput.multilingual,
    externalRoutingPromotion: auditInput.externalRoutingPromotion,
    routeSelector: auditInput.routeSelector,
    directDispatch: auditInput.directDispatch,
    primaryCutover: auditInput.primaryCutover,
    fallbackBypass: auditInput.fallbackBypass,
    decision,
    lockWritten,
    rendered: '',
  };

  output.rendered = renderWave(output);
  return output;
}

export default runFinalClosureAuditWave;
