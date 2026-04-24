// core/runtime/voice-runtime-hardening-mini-wave.ts

import {
  runVoiceRuntimeSupervisor,
  type PantavionVoiceRuntimeSupervisorOutput,
} from './voice-runtime-supervisor';

import {
  saveKernelState,
  getKernelState,
} from '../storage/kernel-state-store';

export interface PantavionVoiceRuntimeHardeningMiniWaveOutput {
  generatedAt: string;
  supervisor: PantavionVoiceRuntimeSupervisorOutput;
  previousRuntimeHardeningState: unknown;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderVoiceMiniWave(
  output: PantavionVoiceRuntimeHardeningMiniWaveOutput,
): string {
  return [
    'PANTAVION VOICE RUNTIME HARDENING MINI WAVE ORCHESTRATOR',
    `generatedAt=${output.generatedAt}`,
    `voiceStatus=${output.supervisor.decision.status}`,
    `bridgeMode=${output.supervisor.bridgeResult.bridgeMode}`,
    `bridgeDisposition=${output.supervisor.bridgeResult.disposition}`,
    `providerHealth=${output.supervisor.providerHealthStatus ?? ''}`,
    `endpointStatus=${output.supervisor.endpointStatus ?? ''}`,
    `sessionCount=${output.supervisor.sessionSnapshot.count}`,
  ].join('\n');
}

export async function runVoiceRuntimeHardeningMiniWave(): Promise<PantavionVoiceRuntimeHardeningMiniWaveOutput> {
  const previousRuntimeHardeningState =
    getKernelState('runtime.hardening.latest')?.payload ?? null;

  const supervisor = await runVoiceRuntimeSupervisor();

  const output: PantavionVoiceRuntimeHardeningMiniWaveOutput = {
    generatedAt: nowIso(),
    supervisor,
    previousRuntimeHardeningState,
    rendered: '',
  };

  output.rendered = renderVoiceMiniWave(output);

  saveKernelState({
    key: 'runtime.voice-hardening-mini-wave.latest',
    kind: 'report',
    payload: {
      supervisor,
      previousRuntimeHardeningState,
    },
    tags: ['runtime', 'voice', 'mini-wave', 'latest'],
    metadata: {
      voiceStatus: supervisor.decision.status,
      bridgeMode: supervisor.bridgeResult.bridgeMode,
    },
  });

  return output;
}

export default runVoiceRuntimeHardeningMiniWave;
