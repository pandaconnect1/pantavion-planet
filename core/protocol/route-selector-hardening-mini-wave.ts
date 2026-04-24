// core/protocol/route-selector-hardening-mini-wave.ts

import { bootstrapInternalProviderAdapterLayer } from './internal-provider-adapters';
import { executeRealExternalProviderBridge } from './real-external-provider-bridge';
import {
  evaluateRouteSelectorHardening,
  type PantavionRouteSelectorHardeningDecision,
  type PantavionRouteSelectorProbeResult,
} from './route-selector-hardening-policy';
import { saveKernelState } from '../storage/kernel-state-store';

type UnknownRecord = Record<string, unknown>;

export interface PantavionRouteSelectorDirective {
  preferenceKey: string;
  preferredAdapterKey: string;
  preferredEndpointKey: string;
  dispatchPreference: 'prefer-direct' | 'prefer-live' | 'allow-fallback';
  notes: string[];
}

export interface PantavionRouteSelectorHardeningWaveOutput {
  generatedAt: string;
  bootstrapRegistryCount: number;
  directives: PantavionRouteSelectorDirective[];
  probes: PantavionRouteSelectorProbeResult[];
  decision: PantavionRouteSelectorHardeningDecision;
  rendered: string;
}

interface RouteSelectorProbeSpec {
  capabilityKey: string;
  operationKey: string;
  preferredAdapterKey: string;
  preferredEndpointKey: string;
  dispatchPreference: PantavionRouteSelectorDirective['dispatchPreference'];
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

function toSelectorOutcome(
  disposition: string,
  bridgeMode: string,
): PantavionRouteSelectorProbeResult['selectorOutcome'] {
  if (disposition === 'blocked') {
    return 'blocked';
  }

  if (disposition === 'dispatched' && (bridgeMode === 'bridge-ready' || bridgeMode === 'live-ready')) {
    return 'direct-selected';
  }

  if (disposition === 'fallback-dispatched' && bridgeMode === 'bridge-ready') {
    return 'fallback-selected';
  }

  return 'watch';
}

const PROBES: RouteSelectorProbeSpec[] = [
  {
    capabilityKey: 'external-provider-routing',
    operationKey: 'dispatch-to-provider',
    preferredAdapterKey: 'pantavion-external-provider-bridge',
    preferredEndpointKey: 'bridge-external-routing',
    dispatchPreference: 'prefer-direct',
    payload: {
      kind: 'route-selector-hardening-probe',
      routeClass: 'external-provider-routing',
    },
  },
  {
    capabilityKey: 'research-intake',
    operationKey: 'collect-sources',
    preferredAdapterKey: 'pantavion-research-intake',
    preferredEndpointKey: 'bridge-research-evidence',
    dispatchPreference: 'prefer-live',
    payload: {
      kind: 'route-selector-hardening-probe',
      routeClass: 'research-intake',
    },
  },
  {
    capabilityKey: 'report-export',
    operationKey: 'export',
    preferredAdapterKey: 'pantavion-reporting-export',
    preferredEndpointKey: 'bridge-export-render',
    dispatchPreference: 'prefer-direct',
    payload: {
      kind: 'route-selector-hardening-probe',
      routeClass: 'report-export',
    },
  },
  {
    capabilityKey: 'kernel-decisioning',
    operationKey: 'decide',
    preferredAdapterKey: 'pantavion-kernel-governor',
    preferredEndpointKey: 'bridge-governed-kernel',
    dispatchPreference: 'prefer-direct',
    payload: {
      kind: 'route-selector-hardening-probe',
      routeClass: 'kernel-decisioning',
    },
  },
  {
    capabilityKey: 'voice-turn-processing',
    operationKey: 'process-turn',
    preferredAdapterKey: 'pantavion-voice-runtime',
    preferredEndpointKey: 'bridge-voice-stream',
    dispatchPreference: 'allow-fallback',
    payload: {
      kind: 'route-selector-hardening-probe',
      routeClass: 'voice-turn-processing',
    },
  },
];

function buildDirectives(specs: RouteSelectorProbeSpec[]): PantavionRouteSelectorDirective[] {
  return specs.map((item) => ({
    preferenceKey: `${item.capabilityKey}:${item.operationKey}`,
    preferredAdapterKey: item.preferredAdapterKey,
    preferredEndpointKey: item.preferredEndpointKey,
    dispatchPreference: item.dispatchPreference,
    notes: [
      `Prefer adapter ${item.preferredAdapterKey}.`,
      `Prefer endpoint ${item.preferredEndpointKey}.`,
      `Dispatch preference is ${item.dispatchPreference}.`,
    ],
  }));
}

function renderWave(output: PantavionRouteSelectorHardeningWaveOutput): string {
  return [
    'PANTAVION ROUTE SELECTOR HARDENING MINI WAVE',
    `generatedAt=${output.generatedAt}`,
    `bootstrapRegistryCount=${output.bootstrapRegistryCount}`,
    `decisionStatus=${output.decision.status}`,
    `directSelectedCount=${output.decision.directSelectedCount}`,
    `fallbackSelectedCount=${output.decision.fallbackSelectedCount}`,
    `watchCount=${output.decision.watchCount}`,
    `blockedCount=${output.decision.blockedCount}`,
    '',
    'SELECTOR DIRECTIVES',
    ...output.directives.map((item) =>
      `- preferenceKey=${item.preferenceKey} adapter=${item.preferredAdapterKey} endpoint=${item.preferredEndpointKey} dispatchPreference=${item.dispatchPreference}`
    ),
    '',
    'ROUTE PROBES',
    ...output.probes.map((item) =>
      `- capability=${item.capabilityKey} operation=${item.operationKey} disposition=${item.disposition} bridgeMode=${item.bridgeMode} selectorOutcome=${item.selectorOutcome} adapter=${item.adapterKey} endpoint=${item.endpointKey}`
    ),
    '',
    'ACTIONS',
    ...output.decision.actions.map((item) => `- ${item}`),
  ].join('\n');
}

export async function runRouteSelectorHardeningMiniWave(): Promise<PantavionRouteSelectorHardeningWaveOutput> {
  const bootstrap = await bootstrapInternalProviderAdapterLayer();
  const bootstrapRecord = asRecord(bootstrap);
  const bootstrapSnapshot = asRecord(bootstrapRecord.registrySnapshot);
  const bootstrapRegistryCount = Number(bootstrapSnapshot.entryCount ?? 0);

  const directives = buildDirectives(PROBES);
  const probes: PantavionRouteSelectorProbeResult[] = [];

  for (const probe of PROBES) {
    const bridgeUnknown = await executeRealExternalProviderBridge({
      capabilityKey: probe.capabilityKey,
      operationKey: probe.operationKey,
      preferredAdapterKey: probe.preferredAdapterKey,
      payload: probe.payload,
      metadata: {
        source: 'route-selector-hardening-mini-wave',
        preferredEndpointKey: probe.preferredEndpointKey,
        dispatchPreference: probe.dispatchPreference,
      },
    });

    const bridge = asRecord(bridgeUnknown);

    const disposition = readString(bridge.disposition, 'unknown');
    const bridgeMode = readString(bridge.bridgeMode, 'watch');
    const adapterKey = readString(bridge.adapterKey, 'unresolved-adapter');
    const endpointKey = readString(bridge.endpointKey, probe.preferredEndpointKey);

    probes.push({
      capabilityKey: probe.capabilityKey,
      operationKey: probe.operationKey,
      disposition,
      bridgeMode,
      adapterKey,
      endpointKey,
      selectorOutcome: toSelectorOutcome(disposition, bridgeMode),
    });
  }

  const decision = evaluateRouteSelectorHardening(probes);

  const output: PantavionRouteSelectorHardeningWaveOutput = {
    generatedAt: nowIso(),
    bootstrapRegistryCount,
    directives,
    probes,
    decision,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'protocol.route-selector-hardening.latest',
    kind: 'report',
    payload: {
      bootstrapRegistryCount,
      directives,
      probes,
      decision,
    },
    tags: ['protocol', 'route-selector', 'hardening', 'latest'],
    metadata: {
      decisionStatus: decision.status,
      directSelectedCount: decision.directSelectedCount,
      fallbackSelectedCount: decision.fallbackSelectedCount,
      watchCount: decision.watchCount,
      blockedCount: decision.blockedCount,
    },
  });

  return output;
}

export default runRouteSelectorHardeningMiniWave;
