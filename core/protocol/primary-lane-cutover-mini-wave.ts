// core/protocol/primary-lane-cutover-mini-wave.ts

import { bootstrapInternalProviderAdapterLayer } from './internal-provider-adapters';
import { executeRealExternalProviderBridge } from './real-external-provider-bridge';
import {
  evaluatePrimaryLaneCutover,
  type PantavionPrimaryLaneCutoverDecision,
  type PantavionPrimaryLaneCutoverProbeResult,
} from './primary-lane-cutover-policy';
import { saveKernelState } from '../storage/kernel-state-store';

type UnknownRecord = Record<string, unknown>;

export interface PantavionPrimaryLaneDirective {
  preferenceKey: string;
  preferredAdapterKey: string;
  preferredEndpointKey: string;
  dispatchPreference: 'primary-only';
  notes: string[];
}

export interface PantavionPrimaryLaneCutoverWaveOutput {
  generatedAt: string;
  bootstrapRegistryCount: number;
  directives: PantavionPrimaryLaneDirective[];
  probes: PantavionPrimaryLaneCutoverProbeResult[];
  decision: PantavionPrimaryLaneCutoverDecision;
  rendered: string;
}

interface PrimaryLaneProbeSpec {
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

function toCutoverOutcome(
  disposition: string,
  bridgeMode: string,
): PantavionPrimaryLaneCutoverProbeResult['cutoverOutcome'] {
  if (disposition === 'blocked') {
    return 'blocked';
  }

  if (disposition === 'dispatched' && (bridgeMode === 'bridge-ready' || bridgeMode === 'live-ready')) {
    return 'primary-active';
  }

  if (disposition === 'fallback-dispatched' && bridgeMode === 'bridge-ready') {
    return 'cutover-pending';
  }

  return 'watch';
}

const TARGETS: PrimaryLaneProbeSpec[] = [
  {
    capabilityKey: 'external-provider-routing',
    operationKey: 'dispatch-to-provider',
    preferredAdapterKey: 'pantavion-external-provider-bridge',
    preferredEndpointKey: 'bridge-external-routing',
    payload: {
      kind: 'primary-lane-cutover-probe',
      routeClass: 'external-provider-routing',
      targetMode: 'primary-only',
    },
  },
  {
    capabilityKey: 'voice-turn-processing',
    operationKey: 'process-turn',
    preferredAdapterKey: 'pantavion-voice-runtime',
    preferredEndpointKey: 'bridge-voice-stream',
    payload: {
      kind: 'primary-lane-cutover-probe',
      routeClass: 'voice-turn-processing',
      targetMode: 'primary-only',
    },
  },
];

function buildDirectives(specs: PrimaryLaneProbeSpec[]): PantavionPrimaryLaneDirective[] {
  return specs.map((item) => ({
    preferenceKey: `${item.capabilityKey}:${item.operationKey}`,
    preferredAdapterKey: item.preferredAdapterKey,
    preferredEndpointKey: item.preferredEndpointKey,
    dispatchPreference: 'primary-only',
    notes: [
      `Cut over ${item.capabilityKey} to primary-only preference.`,
      `Prefer adapter ${item.preferredAdapterKey}.`,
      `Prefer endpoint ${item.preferredEndpointKey}.`,
    ],
  }));
}

function renderWave(output: PantavionPrimaryLaneCutoverWaveOutput): string {
  return [
    'PANTAVION PRIMARY LANE CUTOVER MINI WAVE',
    `generatedAt=${output.generatedAt}`,
    `bootstrapRegistryCount=${output.bootstrapRegistryCount}`,
    `decisionStatus=${output.decision.status}`,
    `primaryActiveCount=${output.decision.primaryActiveCount}`,
    `cutoverPendingCount=${output.decision.cutoverPendingCount}`,
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
      `- capability=${item.capabilityKey} operation=${item.operationKey} disposition=${item.disposition} bridgeMode=${item.bridgeMode} cutoverOutcome=${item.cutoverOutcome} adapter=${item.adapterKey} endpoint=${item.endpointKey}`
    ),
    '',
    'ACTIONS',
    ...output.decision.actions.map((item) => `- ${item}`),
  ].join('\n');
}

export async function runPrimaryLaneCutoverMiniWave(): Promise<PantavionPrimaryLaneCutoverWaveOutput> {
  const bootstrap = await bootstrapInternalProviderAdapterLayer();
  const bootstrapRecord = asRecord(bootstrap);
  const bootstrapSnapshot = asRecord(bootstrapRecord.registrySnapshot);
  const bootstrapRegistryCount = Number(bootstrapSnapshot.entryCount ?? 0);

  const directives = buildDirectives(TARGETS);
  const probes: PantavionPrimaryLaneCutoverProbeResult[] = [];

  for (const target of TARGETS) {
    const bridgeUnknown = await executeRealExternalProviderBridge({
      capabilityKey: target.capabilityKey,
      operationKey: target.operationKey,
      preferredAdapterKey: target.preferredAdapterKey,
      payload: target.payload,
      metadata: {
        source: 'primary-lane-cutover-mini-wave',
        preferredEndpointKey: target.preferredEndpointKey,
        dispatchPreference: 'primary-only',
        fallbackAllowed: false,
        selectorMode: 'primary-cutover',
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
      cutoverOutcome: toCutoverOutcome(disposition, bridgeMode),
    });
  }

  const decision = evaluatePrimaryLaneCutover(probes);

  const output: PantavionPrimaryLaneCutoverWaveOutput = {
    generatedAt: nowIso(),
    bootstrapRegistryCount,
    directives,
    probes,
    decision,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'protocol.primary-lane-cutover.latest',
    kind: 'report',
    payload: {
      bootstrapRegistryCount,
      directives,
      probes,
      decision,
    },
    tags: ['protocol', 'primary-lane', 'cutover', 'latest'],
    metadata: {
      decisionStatus: decision.status,
      primaryActiveCount: decision.primaryActiveCount,
      cutoverPendingCount: decision.cutoverPendingCount,
      watchCount: decision.watchCount,
      blockedCount: decision.blockedCount,
    },
  });

  return output;
}

export default runPrimaryLaneCutoverMiniWave;
