// core/protocol/direct-dispatch-promotion-mini-wave.ts

import { bootstrapInternalProviderAdapterLayer } from './internal-provider-adapters';
import { executeRealExternalProviderBridge } from './real-external-provider-bridge';
import {
  evaluateDirectDispatchPromotion,
  type PantavionDirectDispatchPromotionDecision,
  type PantavionDirectDispatchPromotionProbeResult,
} from './direct-dispatch-promotion-policy';
import { saveKernelState } from '../storage/kernel-state-store';

type UnknownRecord = Record<string, unknown>;

export interface PantavionDirectDispatchPromotionDirective {
  preferenceKey: string;
  preferredAdapterKey: string;
  preferredEndpointKey: string;
  dispatchPreference: 'force-direct';
  notes: string[];
}

export interface PantavionDirectDispatchPromotionWaveOutput {
  generatedAt: string;
  bootstrapRegistryCount: number;
  directives: PantavionDirectDispatchPromotionDirective[];
  probes: PantavionDirectDispatchPromotionProbeResult[];
  decision: PantavionDirectDispatchPromotionDecision;
  rendered: string;
}

interface DirectDispatchProbeSpec {
  capabilityKey: string;
  operationKey: string;
  preferredAdapterKey: string;
  preferredEndpointKey: string;
  payload: UnknownRecord;
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

function toPromotionOutcome(
  disposition: string,
  bridgeMode: string,
): PantavionDirectDispatchPromotionProbeResult['promotionOutcome'] {
  if (disposition === 'blocked') {
    return 'blocked';
  }

  if (disposition === 'dispatched' && (bridgeMode === 'bridge-ready' || bridgeMode === 'live-ready')) {
    return 'promoted';
  }

  if (disposition === 'fallback-dispatched' && bridgeMode === 'bridge-ready') {
    return 'fallback-promoted';
  }

  return 'watch';
}

const TARGETS: DirectDispatchProbeSpec[] = [
  {
    capabilityKey: 'external-provider-routing',
    operationKey: 'dispatch-to-provider',
    preferredAdapterKey: 'pantavion-external-provider-bridge',
    preferredEndpointKey: 'bridge-external-routing',
    payload: {
      kind: 'direct-dispatch-promotion-probe',
      routeClass: 'external-provider-routing',
      desiredMode: 'direct',
    },
  },
  {
    capabilityKey: 'voice-turn-processing',
    operationKey: 'process-turn',
    preferredAdapterKey: 'pantavion-voice-runtime',
    preferredEndpointKey: 'bridge-voice-stream',
    payload: {
      kind: 'direct-dispatch-promotion-probe',
      routeClass: 'voice-turn-processing',
      desiredMode: 'direct',
    },
  },
];

function buildDirectives(specs: DirectDispatchProbeSpec[]): PantavionDirectDispatchPromotionDirective[] {
  return specs.map((item) => ({
    preferenceKey: `${item.capabilityKey}:${item.operationKey}`,
    preferredAdapterKey: item.preferredAdapterKey,
    preferredEndpointKey: item.preferredEndpointKey,
    dispatchPreference: 'force-direct',
    notes: [
      `Force direct dispatch preference for ${item.capabilityKey}.`,
      `Prefer adapter ${item.preferredAdapterKey}.`,
      `Prefer endpoint ${item.preferredEndpointKey}.`,
    ],
  }));
}

function renderWave(output: PantavionDirectDispatchPromotionWaveOutput): string {
  return [
    'PANTAVION DIRECT DISPATCH PROMOTION MINI WAVE',
    `generatedAt=${output.generatedAt}`,
    `bootstrapRegistryCount=${output.bootstrapRegistryCount}`,
    `decisionStatus=${output.decision.status}`,
    `promotedCount=${output.decision.promotedCount}`,
    `fallbackPromotedCount=${output.decision.fallbackPromotedCount}`,
    `watchCount=${output.decision.watchCount}`,
    `blockedCount=${output.decision.blockedCount}`,
    '',
    'DIRECTIVES',
    ...output.directives.map((item) =>
      `- preferenceKey=${item.preferenceKey} adapter=${item.preferredAdapterKey} endpoint=${item.preferredEndpointKey} dispatchPreference=${item.dispatchPreference}`
    ),
    '',
    'TARGET PROBES',
    ...output.probes.map((item) =>
      `- capability=${item.capabilityKey} operation=${item.operationKey} disposition=${item.disposition} bridgeMode=${item.bridgeMode} promotionOutcome=${item.promotionOutcome} adapter=${item.adapterKey} endpoint=${item.endpointKey}`
    ),
    '',
    'ACTIONS',
    ...output.decision.actions.map((item) => `- ${item}`),
  ].join('\n');
}

export async function runDirectDispatchPromotionMiniWave(): Promise<PantavionDirectDispatchPromotionWaveOutput> {
  const bootstrap = await bootstrapInternalProviderAdapterLayer();
  const bootstrapRecord = asRecord(bootstrap);
  const bootstrapSnapshot = asRecord(bootstrapRecord.registrySnapshot);
  const bootstrapRegistryCount = Number(bootstrapSnapshot.entryCount ?? 0);

  const directives = buildDirectives(TARGETS);
  const probes: PantavionDirectDispatchPromotionProbeResult[] = [];

  for (const target of TARGETS) {
    const bridgeUnknown = await executeRealExternalProviderBridge({
      capabilityKey: target.capabilityKey,
      operationKey: target.operationKey,
      preferredAdapterKey: target.preferredAdapterKey,
      payload: target.payload,
      metadata: {
        source: 'direct-dispatch-promotion-mini-wave',
        preferredEndpointKey: target.preferredEndpointKey,
        dispatchPreference: 'force-direct',
        selectorMode: 'direct-only-preferred',
      },
    });

    const bridge = asRecord(bridgeUnknown);

    const disposition = readString(bridge.disposition, 'unknown');
    const bridgeMode = readString(bridge.bridgeMode, 'watch');
    const adapterKey = readString(bridge.adapterKey, target.preferredAdapterKey);
    const endpointKey = readString(bridge.endpointKey, target.preferredEndpointKey);

    probes.push({
      capabilityKey: target.capabilityKey,
      operationKey: target.operationKey,
      disposition,
      bridgeMode,
      adapterKey,
      endpointKey,
      promotionOutcome: toPromotionOutcome(disposition, bridgeMode),
    });
  }

  const decision = evaluateDirectDispatchPromotion(probes);

  const output: PantavionDirectDispatchPromotionWaveOutput = {
    generatedAt: nowIso(),
    bootstrapRegistryCount,
    directives,
    probes,
    decision,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'protocol.direct-dispatch-promotion.latest',
    kind: 'report',
    payload: {
      bootstrapRegistryCount,
      directives,
      probes,
      decision,
    },
    tags: ['protocol', 'direct-dispatch', 'promotion', 'latest'],
    metadata: {
      decisionStatus: decision.status,
      promotedCount: decision.promotedCount,
      fallbackPromotedCount: decision.fallbackPromotedCount,
      watchCount: decision.watchCount,
      blockedCount: decision.blockedCount,
    },
  });

  return output;
}

export default runDirectDispatchPromotionMiniWave;
