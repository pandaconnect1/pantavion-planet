// core/protocol/external-routing-promotion-mini-wave.ts

import { bootstrapInternalProviderAdapterLayer } from './internal-provider-adapters';
import { executeRealExternalProviderBridge } from './real-external-provider-bridge';
import {
  evaluateExternalRoutingPromotion,
  type PantavionExternalRoutingPromotionDecision,
  type PantavionExternalRoutingPromotionProbeResult,
} from './external-routing-promotion-policy';
import { saveKernelState } from '../storage/kernel-state-store';

type UnknownRecord = Record<string, unknown>;

export interface PantavionExternalRoutingPromotionWaveOutput {
  generatedAt: string;
  bootstrapRegistryCount: number;
  probes: PantavionExternalRoutingPromotionProbeResult[];
  decision: PantavionExternalRoutingPromotionDecision;
  rendered: string;
}

interface PromotionProbeSpec {
  capabilityKey: string;
  operationKey: string;
  preferredAdapterKey: string;
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

function toRouteStatus(
  disposition: string,
  bridgeMode: string,
): PantavionExternalRoutingPromotionProbeResult['routeStatus'] {
  if (disposition === 'dispatched' && bridgeMode === 'bridge-ready') {
    return 'promoted';
  }

  if (disposition === 'fallback-dispatched' && bridgeMode === 'bridge-ready') {
    return 'bridge-ready';
  }

  if (disposition === 'blocked') {
    return 'blocked';
  }

  return 'watch';
}

const PROBES: PromotionProbeSpec[] = [
  {
    capabilityKey: 'external-provider-routing',
    operationKey: 'dispatch-to-provider',
    preferredAdapterKey: 'pantavion-external-provider-bridge',
    payload: {
      kind: 'external-routing-promotion-probe',
      target: 'provider-dispatch',
      url: 'https://example.invalid/provider-dispatch',
    },
  },
  {
    capabilityKey: 'research-intake',
    operationKey: 'collect-sources',
    preferredAdapterKey: 'pantavion-research-intake',
    payload: {
      kind: 'external-routing-promotion-probe',
      topic: 'routing-promotion-health',
    },
  },
  {
    capabilityKey: 'report-export',
    operationKey: 'export',
    preferredAdapterKey: 'pantavion-reporting-export',
    payload: {
      kind: 'external-routing-promotion-probe',
      format: 'json',
    },
  },
  {
    capabilityKey: 'kernel-decisioning',
    operationKey: 'decide',
    preferredAdapterKey: 'pantavion-kernel-governor',
    payload: {
      kind: 'external-routing-promotion-probe',
      decisionClass: 'routing-promotion',
    },
  },
  {
    capabilityKey: 'voice-turn-processing',
    operationKey: 'process-turn',
    preferredAdapterKey: 'pantavion-voice-runtime',
    payload: {
      kind: 'external-routing-promotion-probe',
      turn: 'route promotion check',
    },
  },
];

function renderWave(output: PantavionExternalRoutingPromotionWaveOutput): string {
  return [
    'PANTAVION EXTERNAL ROUTING PROMOTION MINI WAVE',
    `generatedAt=${output.generatedAt}`,
    `bootstrapRegistryCount=${output.bootstrapRegistryCount}`,
    `decisionStatus=${output.decision.status}`,
    `promotedCount=${output.decision.promotedCount}`,
    `bridgeReadyCount=${output.decision.bridgeReadyCount}`,
    `watchCount=${output.decision.watchCount}`,
    `blockedCount=${output.decision.blockedCount}`,
    '',
    'ROUTE PROBES',
    ...output.probes.map((item) =>
      `- capability=${item.capabilityKey} operation=${item.operationKey} disposition=${item.disposition} bridgeMode=${item.bridgeMode} routeStatus=${item.routeStatus} adapter=${item.adapterKey} endpoint=${item.endpointKey}`
    ),
    '',
    'ACTIONS',
    ...output.decision.actions.map((item) => `- ${item}`),
  ].join('\n');
}

export async function runExternalRoutingPromotionMiniWave(): Promise<PantavionExternalRoutingPromotionWaveOutput> {
  const bootstrap = await bootstrapInternalProviderAdapterLayer();
  const bootstrapRecord = asRecord(bootstrap);
  const bootstrapSnapshot = asRecord(bootstrapRecord.registrySnapshot);
  const bootstrapRegistryCount = Number(bootstrapSnapshot.entryCount ?? 0);

  const probes: PantavionExternalRoutingPromotionProbeResult[] = [];

  for (const probe of PROBES) {
    const bridgeUnknown = await executeRealExternalProviderBridge({
      capabilityKey: probe.capabilityKey,
      operationKey: probe.operationKey,
      preferredAdapterKey: probe.preferredAdapterKey,
      payload: probe.payload,
      metadata: {
        source: 'external-routing-promotion-mini-wave',
      },
    });

    const bridge = asRecord(bridgeUnknown);

    const disposition = readString(bridge.disposition, 'unknown');
    const bridgeMode = readString(bridge.bridgeMode, 'watch');
    const adapterKey = readString(bridge.adapterKey, 'unresolved-adapter');
    const endpointKey = readString(bridge.endpointKey, 'unresolved-endpoint');

    probes.push({
      capabilityKey: probe.capabilityKey,
      operationKey: probe.operationKey,
      disposition,
      bridgeMode,
      adapterKey,
      endpointKey,
      routeStatus: toRouteStatus(disposition, bridgeMode),
    });
  }

  const decision = evaluateExternalRoutingPromotion(probes);

  const output: PantavionExternalRoutingPromotionWaveOutput = {
    generatedAt: nowIso(),
    bootstrapRegistryCount,
    probes,
    decision,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'protocol.external-routing-promotion.latest',
    kind: 'report',
    payload: {
      bootstrapRegistryCount,
      probes,
      decision,
    },
    tags: ['protocol', 'external-routing', 'promotion', 'latest'],
    metadata: {
      decisionStatus: decision.status,
      promotedCount: decision.promotedCount,
      bridgeReadyCount: decision.bridgeReadyCount,
      watchCount: decision.watchCount,
      blockedCount: decision.blockedCount,
    },
  });

  return output;
}

export default runExternalRoutingPromotionMiniWave;
