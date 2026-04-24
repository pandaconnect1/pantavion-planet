// core/protocol/canonical-routing-truth-wave.ts

import { runMultilingualVoicePolicy } from '../runtime/voice-multilingual-policy';
import { runExternalRoutingPromotionMiniWave } from './external-routing-promotion-mini-wave';
import { runRouteSelectorHardeningMiniWave } from './route-selector-hardening-mini-wave';
import { runDirectDispatchPromotionMiniWave } from './direct-dispatch-promotion-mini-wave';
import { runPrimaryLaneCutoverMiniWave } from './primary-lane-cutover-mini-wave';
import { runFallbackBypassEnforcementMiniWave } from './fallback-bypass-enforcement-mini-wave';
import {
  normalizeCanonicalRoutingTruth,
  renderCanonicalRoutingTruth,
  type PantavionCanonicalRoutingTruth,
} from './canonical-routing-truth';
import {
  getRouteAuthorityEntry,
  getRouteAuthorityRegistrySnapshot,
} from './route-authority-registry';
import {
  buildRouteDecisionTrace,
  renderRouteDecisionTraces,
  type PantavionRouteDecisionTrace,
} from './route-decision-trace';
import { saveKernelState } from '../storage/kernel-state-store';

type UnknownRecord = Record<string, unknown>;

export interface PantavionCanonicalRoutingTruthWaveOutput {
  generatedAt: string;
  selectedLocale: string;
  selectedSource: string;
  truths: PantavionCanonicalRoutingTruth[];
  traces: PantavionRouteDecisionTrace[];
  authorityRegistryCount: number;
  truthAlignedCount: number;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function findProbe(
  probes: unknown[],
  capabilityKey: string,
  operationKey: string,
): UnknownRecord | null {
  for (const probe of probes) {
    const record = asRecord(probe);
    if (
      readString(record.capabilityKey) === capabilityKey &&
      readString(record.operationKey) === operationKey
    ) {
      return record;
    }
  }
  return null;
}

function buildTruthForLane(input: {
  capabilityKey: string;
  operationKey: string;
  selectedLocale: string;
  selectedSource: string;
  externalRoutingPromotionProbes: unknown[];
  routeSelectorProbes: unknown[];
  directDispatchProbes: unknown[];
  primaryCutoverProbes: unknown[];
  fallbackBypassProbes: unknown[];
}): {
  truth: PantavionCanonicalRoutingTruth;
  trace: PantavionRouteDecisionTrace;
} | null {
  const promotionProbe = findProbe(
    input.externalRoutingPromotionProbes,
    input.capabilityKey,
    input.operationKey,
  );

  const selectorProbe = findProbe(
    input.routeSelectorProbes,
    input.capabilityKey,
    input.operationKey,
  );

  const directProbe = findProbe(
    input.directDispatchProbes,
    input.capabilityKey,
    input.operationKey,
  );

  const cutoverProbe = findProbe(
    input.primaryCutoverProbes,
    input.capabilityKey,
    input.operationKey,
  );

  const bypassProbe = findProbe(
    input.fallbackBypassProbes,
    input.capabilityKey,
    input.operationKey,
  );

  const adapterKey =
    readString(asRecord(bypassProbe).adapterKey) ||
    readString(asRecord(cutoverProbe).adapterKey) ||
    readString(asRecord(directProbe).adapterKey) ||
    readString(asRecord(selectorProbe).adapterKey) ||
    readString(asRecord(promotionProbe).adapterKey);

  const endpointKey =
    readString(asRecord(bypassProbe).endpointKey) ||
    readString(asRecord(cutoverProbe).endpointKey) ||
    readString(asRecord(directProbe).endpointKey) ||
    readString(asRecord(selectorProbe).endpointKey) ||
    readString(asRecord(promotionProbe).endpointKey);

  const rawDisposition =
    readString(asRecord(bypassProbe).disposition) ||
    readString(asRecord(cutoverProbe).disposition) ||
    readString(asRecord(directProbe).disposition) ||
    readString(asRecord(selectorProbe).disposition) ||
    readString(asRecord(promotionProbe).disposition);

  const bridgeMode =
    readString(asRecord(bypassProbe).bridgeMode) ||
    readString(asRecord(cutoverProbe).bridgeMode) ||
    readString(asRecord(directProbe).bridgeMode) ||
    readString(asRecord(selectorProbe).bridgeMode) ||
    readString(asRecord(promotionProbe).bridgeMode);

  if (!adapterKey || !endpointKey) {
    return null;
  }

  const truth = normalizeCanonicalRoutingTruth({
    capabilityKey: input.capabilityKey,
    operationKey: input.operationKey,
    adapterKey,
    endpointKey,
    rawDisposition,
    bridgeMode,
    routeSelectorOutcome: readString(asRecord(selectorProbe).selectorOutcome),
    directDispatchOutcome: readString(asRecord(directProbe).promotionOutcome),
    primaryCutoverOutcome: readString(asRecord(cutoverProbe).cutoverOutcome),
    bypassOutcome: readString(asRecord(bypassProbe).bypassOutcome),
  });

  const authority = getRouteAuthorityEntry(
    input.capabilityKey,
    input.operationKey,
  );

  if (!authority) {
    return null;
  }

  const trace = buildRouteDecisionTrace({
    truth,
    authority,
    selectedLocale: input.selectedLocale,
    selectedSource: input.selectedSource,
  });

  return {
    truth,
    trace,
  };
}

function renderWave(output: PantavionCanonicalRoutingTruthWaveOutput): string {
  return [
    'PANTAVION CANONICAL ROUTING TRUTH CLEANUP WAVE',
    `generatedAt=${output.generatedAt}`,
    `selectedLocale=${output.selectedLocale}`,
    `selectedSource=${output.selectedSource}`,
    `authorityRegistryCount=${output.authorityRegistryCount}`,
    `truthAlignedCount=${output.truthAlignedCount}`,
    '',
    renderCanonicalRoutingTruth(output.truths),
    '',
    renderRouteDecisionTraces(output.traces),
  ].join('\n');
}

export async function runCanonicalRoutingTruthWave(): Promise<PantavionCanonicalRoutingTruthWaveOutput> {
  const multilingual = runMultilingualVoicePolicy({
    explicitUserLocale: 'el-GR',
    conversationLocale: 'en-US',
    cityKey: 'athens-gr',
    countryCode: 'GR',
    globalFallbackLocale: 'en-US',
  });

  const externalRoutingPromotion = await runExternalRoutingPromotionMiniWave();
  const routeSelector = await runRouteSelectorHardeningMiniWave();
  const directDispatch = await runDirectDispatchPromotionMiniWave();
  const primaryCutover = await runPrimaryLaneCutoverMiniWave();
  const fallbackBypass = await runFallbackBypassEnforcementMiniWave();

  const lanes = [
    { capabilityKey: 'external-provider-routing', operationKey: 'dispatch-to-provider' },
    { capabilityKey: 'voice-turn-processing', operationKey: 'process-turn' },
    { capabilityKey: 'research-intake', operationKey: 'collect-sources' },
    { capabilityKey: 'report-export', operationKey: 'export' },
    { capabilityKey: 'kernel-decisioning', operationKey: 'decide' },
  ];

  const truths: PantavionCanonicalRoutingTruth[] = [];
  const traces: PantavionRouteDecisionTrace[] = [];

  for (const lane of lanes) {
    const built = buildTruthForLane({
      capabilityKey: lane.capabilityKey,
      operationKey: lane.operationKey,
      selectedLocale: multilingual.resolution.selectedLocale,
      selectedSource: multilingual.resolution.selectedSource,
      externalRoutingPromotionProbes: externalRoutingPromotion.probes,
      routeSelectorProbes: routeSelector.probes,
      directDispatchProbes: directDispatch.probes,
      primaryCutoverProbes: primaryCutover.probes,
      fallbackBypassProbes: fallbackBypass.probes,
    });

    if (built) {
      truths.push(built.truth);
      traces.push(built.trace);
    }
  }

  const authoritySnapshot = getRouteAuthorityRegistrySnapshot();
  const truthAlignedCount = traces.filter((item) => item.alignment.truthAligned).length;

  const output: PantavionCanonicalRoutingTruthWaveOutput = {
    generatedAt: nowIso(),
    selectedLocale: multilingual.resolution.selectedLocale,
    selectedSource: multilingual.resolution.selectedSource,
    truths,
    traces,
    authorityRegistryCount: authoritySnapshot.count,
    truthAlignedCount,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'protocol.canonical-routing-truth.latest',
    kind: 'report',
    payload: {
      selectedLocale: output.selectedLocale,
      selectedSource: output.selectedSource,
      truths,
      traces,
      authorityRegistryCount: output.authorityRegistryCount,
      truthAlignedCount: output.truthAlignedCount,
    },
    tags: ['protocol', 'canonical-truth', 'routing', 'latest'],
    metadata: {
      selectedLocale: output.selectedLocale,
      selectedSource: output.selectedSource,
      truthAlignedCount: output.truthAlignedCount,
      authorityRegistryCount: output.authorityRegistryCount,
    },
  });

  return output;
}

export default runCanonicalRoutingTruthWave;
