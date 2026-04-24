// core/runtime/runtime-hardening-orchestrator.ts

import {
  runProviderAdapterWave,
  type PantavionProviderAdapterWaveOutput,
} from '../protocol/provider-dispatch-orchestrator';

import {
  runRuntimeExecutionSupervisor,
  type PantavionRuntimeSupervisorOutput,
} from './runtime-execution-supervisor';

import {
  getKernelStateStoreSnapshot,
  saveKernelState,
} from '../storage/kernel-state-store';

export interface PantavionRuntimeHardeningWaveOutput {
  generatedAt: string;
  providerWave: PantavionProviderAdapterWaveOutput;
  supervisor: PantavionRuntimeSupervisorOutput;
  hardeningStatus: 'blocked' | 'degraded' | 'watch' | 'pass';
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function deriveHardeningStatus(
  supervisor: PantavionRuntimeSupervisorOutput,
): PantavionRuntimeHardeningWaveOutput['hardeningStatus'] {
  if (supervisor.scenarioResults.some((item) => item.status === 'blocked')) {
    return 'blocked';
  }

  if (supervisor.scenarioResults.some((item) => item.status === 'degraded')) {
    return 'degraded';
  }

  if (supervisor.scenarioResults.some((item) => item.status === 'watch')) {
    return 'watch';
  }

  return 'pass';
}

function renderRuntimeHardeningWave(
  output: PantavionRuntimeHardeningWaveOutput,
): string {
  return [
    'PANTAVION RUNTIME HARDENING ORCHESTRATOR',
    `generatedAt=${output.generatedAt}`,
    `hardeningStatus=${output.hardeningStatus}`,
    `providerRegistryEntries=${output.providerWave.registrySnapshot.entryCount}`,
    `providerHealthy=${output.providerWave.healthSnapshot.healthyCount}`,
    `providerWatch=${output.providerWave.healthSnapshot.watchCount}`,
    `providerDegraded=${output.providerWave.healthSnapshot.degradedCount}`,
    `runtimeScenarioCount=${output.supervisor.scenarioCount}`,
    '',
    'SCENARIO STATUS',
    ...output.supervisor.scenarioResults.map(
      (item) => `- ${item.scenario.scenarioKey} => ${item.status}`,
    ),
  ].join('\n');
}

export async function runRuntimeHardeningWave(): Promise<PantavionRuntimeHardeningWaveOutput> {
  const providerWave = await runProviderAdapterWave();
  const supervisor = await runRuntimeExecutionSupervisor();
  const hardeningStatus = deriveHardeningStatus(supervisor);

  saveKernelState({
    key: 'runtime.hardening.orchestrator.latest',
    kind: 'report',
    payload: {
      providerWave,
      supervisor,
      hardeningStatus,
      stateStoreSnapshot: getKernelStateStoreSnapshot(),
    },
    tags: ['runtime', 'hardening', 'orchestrator', 'latest'],
    metadata: {
      hardeningStatus,
      scenarioCount: supervisor.scenarioCount,
    },
  });

  const output: PantavionRuntimeHardeningWaveOutput = {
    generatedAt: nowIso(),
    providerWave,
    supervisor,
    hardeningStatus,
    rendered: '',
  };

  output.rendered = renderRuntimeHardeningWave(output);

  return output;
}

export default runRuntimeHardeningWave;
