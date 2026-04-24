// core/runtime/voice-hardening-policy.ts

import type { PantavionRealExternalBridgeResult } from '../protocol/real-external-provider-bridge';

export type PantavionVoiceHardeningStatus =
  | 'blocked'
  | 'degraded'
  | 'watch'
  | 'bridge-ready'
  | 'live-ready';

export interface PantavionVoiceHardeningDecision {
  status: PantavionVoiceHardeningStatus;
  summary: string;
  evidence: string[];
  actions: string[];
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function evaluateVoiceHardening(input: {
  bridgeResult: PantavionRealExternalBridgeResult;
  runtimeSignals: string[];
  providerHealthStatus?: string;
  endpointStatus?: string;
  sessionCount?: number;
}): PantavionVoiceHardeningDecision {
  const evidence = uniqStrings([
    `bridgeDisposition=${input.bridgeResult.disposition}`,
    `bridgeMode=${input.bridgeResult.bridgeMode}`,
    `providerHealth=${input.providerHealthStatus ?? 'unknown'}`,
    `endpointStatus=${input.endpointStatus ?? 'unknown'}`,
    `sessionCount=${String(input.sessionCount ?? 0)}`,
    ...input.runtimeSignals,
  ]);

  const runtimeMissing = input.runtimeSignals.some((item) => item.endsWith('=missing'));

  if (runtimeMissing || input.bridgeResult.bridgeMode === 'blocked') {
    return {
      status: 'blocked',
      summary: 'Voice runtime path is not safe enough for governed execution.',
      evidence,
      actions: [
        'Restore missing runtime functions before promotion.',
        'Do not treat voice runtime as operational yet.',
      ],
    };
  }

  if (
    input.bridgeResult.bridgeMode === 'simulated' ||
    input.providerHealthStatus === 'degraded' ||
    input.endpointStatus === 'degraded'
  ) {
    return {
      status: 'degraded',
      summary: 'Voice runtime still relies on degraded or simulation-grade bridge behavior.',
      evidence,
      actions: [
        'Promote the voice bridge to stronger bridge-ready behavior.',
        'Reduce degraded dependency posture before voice promotion.',
      ],
    };
  }

  if (
    input.providerHealthStatus === 'watch' ||
    input.endpointStatus === 'watch'
  ) {
    return {
      status: 'watch',
      summary: 'Voice runtime is available but still under watch posture.',
      evidence,
      actions: [
        'Reduce watch-level risk and improve voice runtime confidence.',
        'Strengthen session continuity and turn-handling stability.',
      ],
    };
  }

  if (input.bridgeResult.bridgeMode === 'bridge-ready') {
    return {
      status: 'bridge-ready',
      summary: 'Voice runtime is stable at bridge-ready hardening stage.',
      evidence,
      actions: [
        'Promote from bridge-ready to live-ready with stronger endpoint health and continuity guarantees.',
      ],
    };
  }

  return {
    status: 'live-ready',
    summary: 'Voice runtime is acceptable for live-ready hardening stage.',
    evidence,
    actions: [
      'Observe and maintain current voice runtime posture.',
    ],
  };
}

export default evaluateVoiceHardening;
