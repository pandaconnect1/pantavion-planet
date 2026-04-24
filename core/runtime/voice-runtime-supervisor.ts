// core/runtime/voice-runtime-supervisor.ts

import * as VoiceRuntimeModule from './voice-runtime';

import {
  executeRealExternalProviderBridge,
  type PantavionRealExternalBridgeResult,
} from '../protocol/real-external-provider-bridge';

import {
  bootstrapInternalProviderAdapterLayer,
  type PantavionInternalProviderBootstrapResult,
} from '../protocol/internal-provider-adapters';

import {
  getExternalProviderEndpoint,
} from '../protocol/external-provider-endpoint-registry';

import {
  getProviderHealth,
} from '../protocol/provider-health-registry';

import {
  getExternalBridgeSessionSnapshot,
} from '../protocol/external-provider-session-store';

import {
  saveKernelState,
} from '../storage/kernel-state-store';

import {
  evaluateVoiceHardening,
  type PantavionVoiceHardeningDecision,
} from './voice-hardening-policy';

type UnknownRecord = Record<string, unknown>;
type AnyFn = (...args: unknown[]) => unknown;

export interface PantavionVoiceRuntimeSupervisorOutput {
  generatedAt: string;
  bootstrap: PantavionInternalProviderBootstrapResult;
  bridgeResult: PantavionRealExternalBridgeResult;
  decision: PantavionVoiceHardeningDecision;
  runtimeSignals: string[];
  providerHealthStatus?: string;
  endpointStatus?: string;
  sessionSnapshot: ReturnType<typeof getExternalBridgeSessionSnapshot>;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function pickFunction(source: UnknownRecord, keys: string[]): AnyFn | undefined {
  for (const key of keys) {
    const candidate = source[key];
    if (typeof candidate === 'function') {
      return candidate as AnyFn;
    }
  }

  for (const nestedValue of Object.values(source)) {
    if (!nestedValue || typeof nestedValue !== 'object') {
      continue;
    }

    const nested = nestedValue as UnknownRecord;
    for (const key of keys) {
      const candidate = nested[key];
      if (typeof candidate === 'function') {
        return candidate as AnyFn;
      }
    }
  }

  return undefined;
}

function collectVoiceRuntimeSignals(): string[] {
  const moduleLike = VoiceRuntimeModule as unknown as UnknownRecord;

  const startFn = pickFunction(moduleLike, ['startVoiceSession']);
  const processFn = pickFunction(moduleLike, ['processVoiceTurn']);
  const pauseFn = pickFunction(moduleLike, ['pauseVoiceSession']);
  const endFn = pickFunction(moduleLike, ['endVoiceSession']);
  const listFn = pickFunction(moduleLike, ['listVoiceSessions']);

  return [
    startFn ? 'startVoiceSession=present' : 'startVoiceSession=missing',
    processFn ? 'processVoiceTurn=present' : 'processVoiceTurn=missing',
    pauseFn ? 'pauseVoiceSession=present' : 'pauseVoiceSession=missing',
    endFn ? 'endVoiceSession=present' : 'endVoiceSession=missing',
    listFn ? 'listVoiceSessions=present' : 'listVoiceSessions=missing',
  ];
}

function renderVoiceSupervisor(
  output: PantavionVoiceRuntimeSupervisorOutput,
): string {
  return [
    'PANTAVION VOICE RUNTIME HARDENING MINI WAVE',
    `generatedAt=${output.generatedAt}`,
    `bootstrapAdapters=${output.bootstrap.registrySnapshot.entryCount}`,
    `bootstrapHealthy=${output.bootstrap.healthSnapshot.healthyCount}`,
    `voiceStatus=${output.decision.status}`,
    `bridgeDisposition=${output.bridgeResult.disposition}`,
    `bridgeMode=${output.bridgeResult.bridgeMode}`,
    `providerHealth=${output.providerHealthStatus ?? ''}`,
    `endpointStatus=${output.endpointStatus ?? ''}`,
    `bridgeSessions=${output.sessionSnapshot.count}`,
    '',
    'RUNTIME SIGNALS',
    ...output.runtimeSignals.map((signal) => `- ${signal}`),
    '',
    'ACTIONS',
    ...output.decision.actions.map((action) => `- ${action}`),
  ].join('\n');
}

export async function runVoiceRuntimeSupervisor(): Promise<PantavionVoiceRuntimeSupervisorOutput> {
  const bootstrap = await bootstrapInternalProviderAdapterLayer();
  const runtimeSignals = collectVoiceRuntimeSignals();

  const bridgeResult = await executeRealExternalProviderBridge({
    capabilityKey: 'voice-turn-processing',
    operationKey: 'process-turn',
    preferredAdapterKey: 'pantavion-voice-runtime',
    payload: {
      kind: 'voice-hardening-probe',
      turn: 'hello world',
    },
    metadata: {
      source: 'voice-runtime-hardening-mini-wave',
    },
  });

  const endpoint = bridgeResult.endpointKey
    ? getExternalProviderEndpoint(bridgeResult.endpointKey)
    : null;

  const providerHealth = bridgeResult.adapterKey
    ? getProviderHealth(bridgeResult.adapterKey)
    : null;

  const sessionSnapshot = getExternalBridgeSessionSnapshot();

  const decision = evaluateVoiceHardening({
    bridgeResult,
    runtimeSignals,
    providerHealthStatus: providerHealth?.status,
    endpointStatus: endpoint?.status,
    sessionCount: sessionSnapshot.count,
  });

  const output: PantavionVoiceRuntimeSupervisorOutput = {
    generatedAt: nowIso(),
    bootstrap,
    bridgeResult,
    decision,
    runtimeSignals,
    providerHealthStatus: providerHealth?.status,
    endpointStatus: endpoint?.status,
    sessionSnapshot,
    rendered: '',
  };

  output.rendered = renderVoiceSupervisor(output);

  saveKernelState({
    key: 'runtime.voice-hardening.latest',
    kind: 'snapshot',
    payload: {
      bootstrap,
      bridgeResult,
      decision,
      runtimeSignals,
      sessionSnapshot,
    },
    tags: ['runtime', 'voice', 'hardening', 'latest'],
    metadata: {
      voiceStatus: decision.status,
      bridgeMode: bridgeResult.bridgeMode,
      providerHealth: providerHealth?.status ?? 'unknown',
      endpointStatus: endpoint?.status ?? 'unknown',
      bootstrapAdapters: bootstrap.registrySnapshot.entryCount,
    },
  });

  return output;
}

export default runVoiceRuntimeSupervisor;
