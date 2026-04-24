// core/protocol/provider-dispatch-orchestrator.ts

import * as ProtocolGatewayModule from './protocol-gateway';

import {
  bootstrapInternalProviderAdapterLayer,
  type PantavionInternalProviderBootstrapResult,
} from './internal-provider-adapters';

import {
  buildProviderFallbackPlan,
  type PantavionProviderFallbackPlan,
} from './provider-fallback-policy';

import {
  getProviderAdapter,
  getProviderAdapterRegistrySnapshot,
  type PantavionProviderAdapterRecord,
  type PantavionProviderAdapterRegistrySnapshot,
} from './provider-adapter-registry';

import {
  getProviderHealth,
  getProviderHealthRegistrySnapshot,
  type PantavionProviderHealthRegistrySnapshot,
} from './provider-health-registry';

import {
  saveKernelState,
} from '../storage/kernel-state-store';

type UnknownRecord = Record<string, unknown>;
type AnyFn = (...args: unknown[]) => unknown;

export type PantavionProviderDispatchStatus =
  | 'dispatched'
  | 'fallback-dispatched'
  | 'blocked';

export interface PantavionProviderDispatchRequest {
  capabilityKey: string;
  operationKey: string;
  preferredAdapterKey?: string;
  payload?: unknown;
  metadata?: Record<string, unknown>;
}

export interface PantavionProviderDispatchResult {
  dispatchedAt: string;
  status: PantavionProviderDispatchStatus;
  dispatchMode: 'gateway' | 'simulated' | 'blocked';
  adapterKey?: string;
  capabilityKey: string;
  operationKey: string;
  fallbackPlan: PantavionProviderFallbackPlan;
  adapter?: PantavionProviderAdapterRecord | null;
  healthStatus?: string;
  gatewayResponse?: unknown;
  notes: string[];
}

export interface PantavionProviderAdapterWaveOutput {
  generatedAt: string;
  bootstrap: PantavionInternalProviderBootstrapResult;
  registrySnapshot: PantavionProviderAdapterRegistrySnapshot;
  healthSnapshot: PantavionProviderHealthRegistrySnapshot;
  fallbackPlans: PantavionProviderFallbackPlan[];
  sampleDispatch: PantavionProviderDispatchResult;
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

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export async function dispatchProviderRequest(
  request: PantavionProviderDispatchRequest,
): Promise<PantavionProviderDispatchResult> {
  const fallbackPlan = buildProviderFallbackPlan({
    capabilityKey: request.capabilityKey,
    operationKey: request.operationKey,
    preferredAdapterKey: request.preferredAdapterKey,
  });

  if (fallbackPlan.disposition === 'blocked' || !fallbackPlan.primaryAdapterKey) {
    const blocked: PantavionProviderDispatchResult = {
      dispatchedAt: nowIso(),
      status: 'blocked',
      dispatchMode: 'blocked',
      capabilityKey: request.capabilityKey,
      operationKey: request.operationKey,
      fallbackPlan,
      notes: ['No routable provider adapter found.'],
    };

    saveKernelState({
      key: 'protocol.provider-dispatch.latest',
      kind: 'state',
      payload: blocked,
      tags: ['provider', 'dispatch', 'blocked'],
      metadata: {
        capability: request.capabilityKey,
      },
    });

    return blocked;
  }

  const adapter = getProviderAdapter(fallbackPlan.primaryAdapterKey);
  const health = getProviderHealth(fallbackPlan.primaryAdapterKey);

  const moduleLike = ProtocolGatewayModule as unknown as UnknownRecord;
  const dispatchFn = pickFunction(moduleLike, [
    'dispatch',
    'dispatchProtocol',
    'executeDispatch',
    'routeDispatch',
  ]);

  let gatewayResponse: unknown = null;
  let dispatchMode: 'gateway' | 'simulated' = 'simulated';

  if (dispatchFn) {
    try {
      gatewayResponse = await Promise.resolve(
        dispatchFn({
          adapterKey: fallbackPlan.primaryAdapterKey,
          capabilityKey: request.capabilityKey,
          operationKey: request.operationKey,
          payload: request.payload ?? null,
          metadata: request.metadata ?? {},
        }),
      );

      dispatchMode = 'gateway';
    } catch (error) {
      gatewayResponse = {
        error: String(error),
        fallback: 'simulated-dispatch',
      };
      dispatchMode = 'simulated';
    }
  } else {
    gatewayResponse = {
      simulated: true,
      adapterKey: fallbackPlan.primaryAdapterKey,
      capabilityKey: request.capabilityKey,
      operationKey: request.operationKey,
    };
  }

  const result: PantavionProviderDispatchResult = {
    dispatchedAt: nowIso(),
    status:
      fallbackPlan.disposition === 'routable'
        ? 'dispatched'
        : 'fallback-dispatched',
    dispatchMode,
    adapterKey: fallbackPlan.primaryAdapterKey,
    capabilityKey: request.capabilityKey,
    operationKey: request.operationKey,
    fallbackPlan,
    adapter,
    healthStatus: health?.status,
    gatewayResponse,
    notes: uniqStrings([
      `dispatchMode=${dispatchMode}`,
      `adapter=${fallbackPlan.primaryAdapterKey}`,
      `health=${health?.status ?? 'unknown'}`,
    ]),
  };

  saveKernelState({
    key: 'protocol.provider-dispatch.latest',
    kind: 'state',
    payload: result,
    tags: ['provider', 'dispatch', 'latest'],
    metadata: {
      capability: request.capabilityKey,
      operation: request.operationKey,
      adapter: fallbackPlan.primaryAdapterKey,
      status: result.status,
    },
  });

  return result;
}

function renderProviderAdapterWave(
  output: PantavionProviderAdapterWaveOutput,
): string {
  return [
    'PANTAVION PROVIDER ADAPTER WAVE',
    `generatedAt=${output.generatedAt}`,
    `registryEntryCount=${output.registrySnapshot.entryCount}`,
    `readyCount=${output.registrySnapshot.readyCount}`,
    `degradedCount=${output.registrySnapshot.degradedCount}`,
    `healthHealthy=${output.healthSnapshot.healthyCount}`,
    `healthWatch=${output.healthSnapshot.watchCount}`,
    `healthDegraded=${output.healthSnapshot.degradedCount}`,
    `gatewayAttempted=${output.bootstrap.gatewaySync.attempted}`,
    `gatewaySynced=${output.bootstrap.gatewaySync.synced}`,
    `gatewaySkipped=${output.bootstrap.gatewaySync.skipped}`,
    '',
    'FALLBACK PLANS',
    ...output.fallbackPlans.flatMap((plan) => [
      `- capability=${plan.capabilityKey} disposition=${plan.disposition} primary=${plan.primaryAdapterKey ?? ''}`,
    ]),
    '',
    'SAMPLE DISPATCH',
    `status=${output.sampleDispatch.status}`,
    `dispatchMode=${output.sampleDispatch.dispatchMode}`,
    `adapter=${output.sampleDispatch.adapterKey ?? ''}`,
    `health=${output.sampleDispatch.healthStatus ?? ''}`,
  ].join('\n');
}

export async function runProviderAdapterWave(): Promise<PantavionProviderAdapterWaveOutput> {
  const bootstrap = await bootstrapInternalProviderAdapterLayer();
  const registrySnapshot = getProviderAdapterRegistrySnapshot();
  const healthSnapshot = getProviderHealthRegistrySnapshot();

  const fallbackPlans: PantavionProviderFallbackPlan[] = [
    buildProviderFallbackPlan({
      capabilityKey: 'kernel-decisioning',
      operationKey: 'decide',
      preferredAdapterKey: 'pantavion-kernel-governor',
    }),
    buildProviderFallbackPlan({
      capabilityKey: 'durable-execution',
      operationKey: 'execute-task',
      preferredAdapterKey: 'pantavion-runtime-orchestrator',
    }),
    buildProviderFallbackPlan({
      capabilityKey: 'external-provider-routing',
      operationKey: 'dispatch-to-provider',
      preferredAdapterKey: 'pantavion-external-provider-bridge',
    }),
    buildProviderFallbackPlan({
      capabilityKey: 'report-export',
      operationKey: 'export',
      preferredAdapterKey: 'pantavion-reporting-export',
    }),
  ];

  const sampleDispatch = await dispatchProviderRequest({
    capabilityKey: 'kernel-decisioning',
    operationKey: 'decide',
    preferredAdapterKey: 'pantavion-kernel-governor',
    payload: {
      request: 'provider-wave-smoke',
    },
    metadata: {
      source: 'provider-adapter-wave',
    },
  });

  saveKernelState({
    key: 'protocol.provider-registry.latest',
    kind: 'snapshot',
    payload: registrySnapshot,
    tags: ['provider', 'registry', 'latest'],
    metadata: {
      adapterCount: registrySnapshot.entryCount,
      syncedCount: registrySnapshot.syncedCount,
    },
  });

  saveKernelState({
    key: 'protocol.provider-health.latest',
    kind: 'snapshot',
    payload: healthSnapshot,
    tags: ['provider', 'health', 'latest'],
    metadata: {
      totalCount: healthSnapshot.totalCount,
      degradedCount: healthSnapshot.degradedCount,
    },
  });

  saveKernelState({
    key: 'protocol.provider-fallback.latest',
    kind: 'snapshot',
    payload: fallbackPlans,
    tags: ['provider', 'fallback', 'latest'],
    metadata: {
      planCount: fallbackPlans.length,
    },
  });

  const output: PantavionProviderAdapterWaveOutput = {
    generatedAt: nowIso(),
    bootstrap,
    registrySnapshot,
    healthSnapshot,
    fallbackPlans,
    sampleDispatch,
    rendered: '',
  };

  output.rendered = renderProviderAdapterWave(output);

  return output;
}

export default runProviderAdapterWave;
