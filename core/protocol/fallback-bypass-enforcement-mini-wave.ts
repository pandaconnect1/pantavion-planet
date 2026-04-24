// core/protocol/fallback-bypass-enforcement-mini-wave.ts

import { bootstrapInternalProviderAdapterLayer } from './internal-provider-adapters';
import { executeRealExternalProviderBridge } from './real-external-provider-bridge';
import {
  evaluateFallbackBypassEnforcement,
  type PantavionFallbackBypassDecision,
  type PantavionFallbackBypassProbeResult,
} from './fallback-bypass-enforcement-policy';
import { saveKernelState } from '../storage/kernel-state-store';

type UnknownRecord = Record<string, unknown>;

export interface PantavionFallbackBypassDirective {
  preferenceKey: string;
  preferredAdapterKey: string;
  preferredEndpointKey: string;
  enforcementMode: 'fallback-bypass';
  notes: string[];
}

export interface PantavionFallbackBypassWaveOutput {
  generatedAt: string;
  bootstrapRegistryCount: number;
  directives: PantavionFallbackBypassDirective[];
  probes: PantavionFallbackBypassProbeResult[];
  decision: PantavionFallbackBypassDecision;
  rendered: string;
}

interface FallbackBypassProbeSpec {
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

function toBypassOutcome(
  disposition: string,
  bridgeMode: string,
  adapterKey: string,
  endpointKey: string,
  preferredAdapterKey: string,
  preferredEndpointKey: string,
): PantavionFallbackBypassProbeResult['bypassOutcome'] {
  if (disposition === 'blocked') {
    return 'blocked';
  }

  if (
    bridgeMode === 'bridge-ready' &&
    adapterKey === preferredAdapterKey &&
    endpointKey === preferredEndpointKey &&
    (disposition === 'dispatched' || disposition === 'fallback-dispatched')
  ) {
    return 'bypass-active';
  }

  if (disposition === 'fallback-dispatched' && bridgeMode === 'bridge-ready') {
    return 'cutover-pending';
  }

  return 'watch';
}

const TARGETS: FallbackBypassProbeSpec[] = [
  {
    capabilityKey: 'external-provider-routing',
    operationKey: 'dispatch-to-provider',
    preferredAdapterKey: 'pantavion-external-provider-bridge',
    preferredEndpointKey: 'bridge-external-routing',
    payload: {
      kind: 'fallback-bypass-enforcement-probe',
      routeClass: 'external-provider-routing',
      enforcementTarget: 'primary-authoritative',
    },
  },
  {
    capabilityKey: 'voice-turn-processing',
    operationKey: 'process-turn',
    preferredAdapterKey: 'pantavion-voice-runtime',
    preferredEndpointKey: 'bridge-voice-stream',
    payload: {
      kind: 'fallback-bypass-enforcement-probe',
      routeClass: 'voice-turn-processing',
      enforcementTarget: 'primary-authoritative',
    },
  },
];

function buildDirectives(specs: FallbackBypassProbeSpec[]): PantavionFallbackBypassDirective[] {
  return specs.map((item) => ({
    preferenceKey: `${item.capabilityKey}:${item.operationKey}`,
    preferredAdapterKey: item.preferredAdapterKey,
    preferredEndpointKey: item.preferredEndpointKey,
    enforcementMode: 'fallback-bypass',
    notes: [
      `Bypass fallback classification for ${item.capabilityKey} when primary adapter and endpoint already match.`,
      `Prefer adapter ${item.preferredAdapterKey}.`,
      `Prefer endpoint ${item.preferredEndpointKey}.`,
    ],
  }));
}

function renderWave(output: PantavionFallbackBypassWaveOutput): string {
  return [
    'PANTAVION FALLBACK BYPASS ENFORCEMENT MINI WAVE',
    `generatedAt=${output.generatedAt}`,
    `bootstrapRegistryCount=${output.bootstrapRegistryCount}`,
    `decisionStatus=${output.decision.status}`,
    `bypassActiveCount=${output.decision.bypassActiveCount}`,
    `cutoverPendingCount=${output.decision.cutoverPendingCount}`,
    `watchCount=${output.decision.watchCount}`,
    `blockedCount=${output.decision.blockedCount}`,
    '',
    'DIRECTIVES',
    ...output.directives.map((item) =>
      `- preferenceKey=${item.preferenceKey} adapter=${item.preferredAdapterKey} endpoint=${item.preferredEndpointKey} enforcementMode=${item.enforcementMode}`
    ),
    '',
    'TARGET PROBES',
    ...output.probes.map((item) =>
      `- capability=${item.capabilityKey} operation=${item.operationKey} disposition=${item.disposition} bridgeMode=${item.bridgeMode} bypassOutcome=${item.bypassOutcome} adapter=${item.adapterKey} endpoint=${item.endpointKey}`
    ),
    '',
    'ACTIONS',
    ...output.decision.actions.map((item) => `- ${item}`),
  ].join('\n');
}

export async function runFallbackBypassEnforcementMiniWave(): Promise<PantavionFallbackBypassWaveOutput> {
  const bootstrap = await bootstrapInternalProviderAdapterLayer();
  const bootstrapRecord = asRecord(bootstrap);
  const bootstrapSnapshot = asRecord(bootstrapRecord.registrySnapshot);
  const bootstrapRegistryCount = Number(bootstrapSnapshot.entryCount ?? 0);

  const directives = buildDirectives(TARGETS);
  const probes: PantavionFallbackBypassProbeResult[] = [];

  for (const target of TARGETS) {
    const bridgeUnknown = await executeRealExternalProviderBridge({
      capabilityKey: target.capabilityKey,
      operationKey: target.operationKey,
      preferredAdapterKey: target.preferredAdapterKey,
      payload: target.payload,
      metadata: {
        source: 'fallback-bypass-enforcement-mini-wave',
        preferredEndpointKey: target.preferredEndpointKey,
        dispatchPreference: 'primary-only',
        fallbackAllowed: false,
        enforcementMode: 'bypass-classification',
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
      preferredAdapterKey: target.preferredAdapterKey,
      preferredEndpointKey: target.preferredEndpointKey,
      bypassOutcome: toBypassOutcome(
        disposition,
        bridgeMode,
        adapterKey,
        endpointKey,
        target.preferredAdapterKey,
        target.preferredEndpointKey,
      ),
    });
  }

  const decision = evaluateFallbackBypassEnforcement(probes);

  const output: PantavionFallbackBypassWaveOutput = {
    generatedAt: nowIso(),
    bootstrapRegistryCount,
    directives,
    probes,
    decision,
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'protocol.fallback-bypass-enforcement.latest',
    kind: 'report',
    payload: {
      bootstrapRegistryCount,
      directives,
      probes,
      decision,
    },
    tags: ['protocol', 'fallback-bypass', 'enforcement', 'latest'],
    metadata: {
      decisionStatus: decision.status,
      bypassActiveCount: decision.bypassActiveCount,
      cutoverPendingCount: decision.cutoverPendingCount,
      watchCount: decision.watchCount,
      blockedCount: decision.blockedCount,
    },
  });

  return output;
}

export default runFallbackBypassEnforcementMiniWave;
