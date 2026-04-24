// core/protocol/external-provider-bridge-orchestrator.ts

import {
  bootstrapInternalProviderAdapterLayer,
  type PantavionInternalProviderBootstrapResult,
} from './internal-provider-adapters';

import {
  executeRealExternalProviderBridge,
  type PantavionRealExternalBridgeResult,
} from './real-external-provider-bridge';

import {
  getExternalProviderCapabilityMapSnapshot,
} from './provider-capability-map';

import {
  getExternalProviderEndpointRegistrySnapshot,
} from './external-provider-endpoint-registry';

import {
  getExternalBridgeSessionSnapshot,
} from './external-provider-session-store';

import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionRealExternalProviderBridgeWaveOutput {
  generatedAt: string;
  bootstrap: PantavionInternalProviderBootstrapResult;
  routeSnapshot: ReturnType<typeof getExternalProviderCapabilityMapSnapshot>;
  endpointSnapshot: ReturnType<typeof getExternalProviderEndpointRegistrySnapshot>;
  sessionSnapshot: ReturnType<typeof getExternalBridgeSessionSnapshot>;
  results: PantavionRealExternalBridgeResult[];
  hardeningStatus: 'blocked' | 'degraded' | 'bridge-ready' | 'live-ready';
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function deriveHardeningStatus(
  results: PantavionRealExternalBridgeResult[],
): PantavionRealExternalProviderBridgeWaveOutput['hardeningStatus'] {
  if (results.some((item) => item.disposition === 'blocked' || item.bridgeMode === 'blocked')) {
    return 'blocked';
  }

  if (results.some((item) => item.bridgeMode === 'simulated')) {
    return 'degraded';
  }

  if (results.some((item) => item.bridgeMode === 'bridge-ready')) {
    return 'bridge-ready';
  }

  return 'live-ready';
}

function renderExternalBridgeWave(
  output: PantavionRealExternalProviderBridgeWaveOutput,
): string {
  return [
    'PANTAVION REAL EXTERNAL PROVIDER BRIDGE WAVE',
    `generatedAt=${output.generatedAt}`,
    `hardeningStatus=${output.hardeningStatus}`,
    `routeCount=${output.routeSnapshot.count}`,
    `endpointCount=${output.endpointSnapshot.count}`,
    `sessionCount=${output.sessionSnapshot.count}`,
    `readyEndpoints=${output.endpointSnapshot.readyCount}`,
    `watchEndpoints=${output.endpointSnapshot.watchCount}`,
    `degradedEndpoints=${output.endpointSnapshot.degradedCount}`,
    '',
    'BRIDGE RESULTS',
    ...output.results.flatMap((item) => [
      `- capability=${item.capabilityKey} operation=${item.operationKey}`,
      `  disposition=${item.disposition} bridgeMode=${item.bridgeMode}`,
      `  adapter=${item.adapterKey ?? ''} endpoint=${item.endpointKey ?? ''}`,
      `  health=${item.healthStatus ?? ''}`,
    ]),
  ].join('\n');
}

export async function runRealExternalProviderBridgeWave(): Promise<PantavionRealExternalProviderBridgeWaveOutput> {
  const bootstrap = await bootstrapInternalProviderAdapterLayer();

  const results: PantavionRealExternalBridgeResult[] = [
    await executeRealExternalProviderBridge({
      capabilityKey: 'external-provider-routing',
      operationKey: 'dispatch-to-provider',
      preferredAdapterKey: 'pantavion-external-provider-bridge',
    }),
    await executeRealExternalProviderBridge({
      capabilityKey: 'research-intake',
      operationKey: 'collect-sources',
      preferredAdapterKey: 'pantavion-research-intake',
    }),
    await executeRealExternalProviderBridge({
      capabilityKey: 'voice-turn-processing',
      operationKey: 'process-turn',
      preferredAdapterKey: 'pantavion-voice-runtime',
    }),
    await executeRealExternalProviderBridge({
      capabilityKey: 'report-export',
      operationKey: 'export',
      preferredAdapterKey: 'pantavion-reporting-export',
    }),
    await executeRealExternalProviderBridge({
      capabilityKey: 'kernel-decisioning',
      operationKey: 'decide',
      preferredAdapterKey: 'pantavion-kernel-governor',
    }),
  ];

  const routeSnapshot = getExternalProviderCapabilityMapSnapshot();
  const endpointSnapshot = getExternalProviderEndpointRegistrySnapshot();
  const sessionSnapshot = getExternalBridgeSessionSnapshot();
  const hardeningStatus = deriveHardeningStatus(results);

  saveKernelState({
    key: 'protocol.external-provider-bridge.wave.latest',
    kind: 'report',
    payload: {
      bootstrap,
      routeSnapshot,
      endpointSnapshot,
      sessionSnapshot,
      results,
      hardeningStatus,
    },
    tags: ['provider', 'external-bridge', 'wave', 'latest'],
    metadata: {
      hardeningStatus,
      resultCount: results.length,
      sessionCount: sessionSnapshot.count,
    },
  });

  const output: PantavionRealExternalProviderBridgeWaveOutput = {
    generatedAt: nowIso(),
    bootstrap,
    routeSnapshot,
    endpointSnapshot,
    sessionSnapshot,
    results,
    hardeningStatus,
    rendered: '',
  };

  output.rendered = renderExternalBridgeWave(output);

  return output;
}

export default runRealExternalProviderBridgeWave;
