// core/runtime/runtime-execution-supervisor.ts

import * as DurableExecutionModule from './durable-execution';
import * as WorkspaceRuntimeModule from './workspace-runtime';
import * as VoiceRuntimeModule from './voice-runtime';
import * as ResilienceRuntimeModule from './resilience-runtime';

import {
  listRuntimeScenarios,
  type PantavionRuntimeScenario,
} from './runtime-scenario-registry';

import {
  buildProviderFallbackPlan,
  type PantavionProviderFallbackPlan,
} from '../protocol/provider-fallback-policy';

import {
  dispatchProviderRequest,
  type PantavionProviderDispatchResult,
} from '../protocol/provider-dispatch-orchestrator';

import {
  buildRuntimeHealthMatrix,
  type PantavionRuntimeHealthMatrix,
  type PantavionRuntimeMatrixRow,
} from './runtime-health-matrix';

import { evaluateRuntimeScenarioHardening } from './runtime-hardening-policy';
import { saveKernelState } from '../storage/kernel-state-store';

type UnknownRecord = Record<string, unknown>;
type AnyFn = (...args: unknown[]) => unknown;

export interface PantavionRuntimeScenarioExecutionRecord {
  scenario: PantavionRuntimeScenario;
  fallbackPlan: PantavionProviderFallbackPlan;
  dispatchResult?: PantavionProviderDispatchResult | null;
  status: PantavionRuntimeMatrixRow['status'];
  summary: string;
  evidence: string[];
  actions: string[];
}

export interface PantavionRuntimeSupervisorOutput {
  generatedAt: string;
  scenarioCount: number;
  scenarioResults: PantavionRuntimeScenarioExecutionRecord[];
  matrix: PantavionRuntimeHealthMatrix;
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

async function collectRuntimeEvidenceForTarget(
  target: PantavionRuntimeScenario['target'],
): Promise<string[]> {
  const evidence: string[] = [];

  if (target === 'durable') {
    const createFn = pickFunction(DurableExecutionModule as unknown as UnknownRecord, [
      'createDurableExecution',
      'createExecution',
    ]);

    evidence.push(createFn ? 'durableCreateFunction=present' : 'durableCreateFunction=missing');
  }

  if (target === 'workspace') {
    const taskFn = pickFunction(WorkspaceRuntimeModule as unknown as UnknownRecord, [
      'createWorkspaceTask',
      'runWorkspaceTask',
      'listWorkspaceTasks',
    ]);

    evidence.push(taskFn ? 'workspaceTaskFunction=present' : 'workspaceTaskFunction=missing');
  }

  if (target === 'voice') {
    const voiceFn = pickFunction(VoiceRuntimeModule as unknown as UnknownRecord, [
      'processVoiceTurn',
      'startVoiceSession',
      'listVoiceSessions',
    ]);

    evidence.push(voiceFn ? 'voiceRuntimeFunction=present' : 'voiceRuntimeFunction=missing');
  }

  if (target === 'resilience') {
    const resilienceFn = pickFunction(ResilienceRuntimeModule as unknown as UnknownRecord, [
      'getResilienceSnapshot',
      'planFallback',
      'createResiliencePlan',
    ]);

    evidence.push(
      resilienceFn ? 'resilienceFunction=present' : 'resilienceFunction=missing',
    );
  }

  if (target === 'provider-dispatch' || target === 'control-plane') {
    evidence.push('providerDispatchSupervision=enabled');
  }

  return evidence;
}

function renderRuntimeSupervisor(
  output: PantavionRuntimeSupervisorOutput,
): string {
  return [
    'PANTAVION RUNTIME HARDENING WAVE',
    `generatedAt=${output.generatedAt}`,
    `scenarioCount=${output.scenarioCount}`,
    ...output.scenarioResults.flatMap((item) => [
      '',
      `${item.scenario.scenarioKey} :: ${item.status.toUpperCase()}`,
      `summary=${item.summary}`,
      ...item.evidence.map((entry) => `evidence=${entry}`),
      ...item.actions.map((entry) => `action=${entry}`),
    ]),
  ].join('\n');
}

export async function runRuntimeExecutionSupervisor(): Promise<PantavionRuntimeSupervisorOutput> {
  const scenarios = listRuntimeScenarios();
  const results: PantavionRuntimeScenarioExecutionRecord[] = [];

  for (const scenario of scenarios) {
    const fallbackPlan = buildProviderFallbackPlan({
      capabilityKey: scenario.capabilityKey,
      operationKey: scenario.operationKey,
      preferredAdapterKey: scenario.preferredAdapterKey,
    });

    const runtimeEvidence = await collectRuntimeEvidenceForTarget(scenario.target);

    let dispatchResult: PantavionProviderDispatchResult | null = null;

    if (
      scenario.target === 'provider-dispatch' ||
      scenario.target === 'control-plane'
    ) {
      dispatchResult = await dispatchProviderRequest({
        capabilityKey: scenario.capabilityKey,
        operationKey: scenario.operationKey,
        preferredAdapterKey: scenario.preferredAdapterKey,
        payload: {
          scenarioKey: scenario.scenarioKey,
        },
        metadata: {
          source: 'runtime-hardening-wave',
        },
      });
    }

    const decision = evaluateRuntimeScenarioHardening({
      scenario,
      fallbackPlan,
      dispatchResult,
      runtimeEvidence,
    });

    results.push({
      scenario,
      fallbackPlan,
      dispatchResult,
      status: decision.status,
      summary: decision.summary,
      evidence: decision.evidence,
      actions: decision.actions,
    });
  }

  const matrixRows: PantavionRuntimeMatrixRow[] = results.map((result) => ({
    target: result.scenario.target,
    status: result.status,
    summary: result.summary,
    evidence: result.evidence,
    actions: result.actions,
  }));

  const matrix = buildRuntimeHealthMatrix(matrixRows);

  saveKernelState({
    key: 'runtime.hardening.latest',
    kind: 'snapshot',
    payload: {
      scenarioCount: results.length,
      results,
      matrix,
    },
    tags: ['runtime', 'hardening', 'latest'],
    metadata: {
      scenarioCount: results.length,
      blockedCount: results.filter((item) => item.status === 'blocked').length,
      degradedCount: results.filter((item) => item.status === 'degraded').length,
      watchCount: results.filter((item) => item.status === 'watch').length,
    },
  });

  const output: PantavionRuntimeSupervisorOutput = {
    generatedAt: nowIso(),
    scenarioCount: results.length,
    scenarioResults: results,
    matrix,
    rendered: '',
  };

  output.rendered = renderRuntimeSupervisor(output);

  return output;
}

export default runRuntimeExecutionSupervisor;
