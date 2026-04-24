// core/runtime/runtime-hardening-policy.ts

import type { PantavionProviderFallbackPlan } from '../protocol/provider-fallback-policy';
import type { PantavionProviderDispatchResult } from '../protocol/provider-dispatch-orchestrator';
import type { PantavionRuntimeScenario } from './runtime-scenario-registry';
import type { PantavionRuntimeMatrixStatus } from './runtime-health-matrix';

export interface PantavionRuntimeHardeningDecision {
  scenarioKey: string;
  status: PantavionRuntimeMatrixStatus;
  summary: string;
  evidence: string[];
  actions: string[];
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function evaluateRuntimeScenarioHardening(input: {
  scenario: PantavionRuntimeScenario;
  fallbackPlan: PantavionProviderFallbackPlan;
  dispatchResult?: PantavionProviderDispatchResult | null;
  runtimeEvidence?: string[];
}): PantavionRuntimeHardeningDecision {
  const evidence = uniqStrings([
    `fallbackDisposition=${input.fallbackPlan.disposition}`,
    `primaryAdapter=${input.fallbackPlan.primaryAdapterKey ?? 'none'}`,
    ...(input.dispatchResult
      ? [
          `dispatchStatus=${input.dispatchResult.status}`,
          `dispatchMode=${input.dispatchResult.dispatchMode}`,
          `health=${input.dispatchResult.healthStatus ?? 'unknown'}`,
        ]
      : []),
    ...(input.runtimeEvidence ?? []),
  ]);

  if (input.fallbackPlan.disposition === 'blocked') {
    return {
      scenarioKey: input.scenario.scenarioKey,
      status: 'blocked',
      summary: 'No routable adapter found for runtime scenario.',
      evidence,
      actions: [
        'Add or restore a provider adapter for this capability.',
        'Do not treat this runtime path as operational.',
      ],
    };
  }

  if (
    input.dispatchResult?.dispatchMode === 'simulated' &&
    input.scenario.target === 'provider-dispatch'
  ) {
    return {
      scenarioKey: input.scenario.scenarioKey,
      status: 'degraded',
      summary: 'Provider dispatch still resolves through simulation-grade path.',
      evidence,
      actions: [
        'Bind the provider dispatch path to a stronger real execution adapter.',
        'Add health-aware retries and provider-specific dispatch handlers.',
      ],
    };
  }

  if (
    input.fallbackPlan.disposition === 'degraded' ||
    input.dispatchResult?.healthStatus === 'degraded'
  ) {
    return {
      scenarioKey: input.scenario.scenarioKey,
      status: 'degraded',
      summary: 'Scenario is routable but still degraded.',
      evidence,
      actions: [
        'Harden the runtime/provider path before treating it as strong.',
      ],
    };
  }

  if (
    input.dispatchResult?.dispatchMode === 'simulated' ||
    input.dispatchResult?.healthStatus === 'watch'
  ) {
    return {
      scenarioKey: input.scenario.scenarioKey,
      status: 'watch',
      summary: 'Scenario is available but still under hardening/watch.',
      evidence,
      actions: [
        'Promote simulation/watch path into a stronger operational path.',
      ],
    };
  }

  return {
    scenarioKey: input.scenario.scenarioKey,
    status: 'pass',
    summary: 'Scenario is currently acceptable for this hardening stage.',
    evidence,
    actions: [
      'Observe and maintain current readiness posture.',
    ],
  };
}

export default evaluateRuntimeScenarioHardening;
