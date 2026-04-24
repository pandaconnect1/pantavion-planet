// core/runtime/runtime-scenario-registry.ts

export type PantavionRuntimeTarget =
  | 'durable'
  | 'workspace'
  | 'voice'
  | 'resilience'
  | 'provider-dispatch'
  | 'control-plane';

export type PantavionRuntimeScenarioSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export interface PantavionRuntimeScenario {
  scenarioKey: string;
  title: string;
  target: PantavionRuntimeTarget;
  severity: PantavionRuntimeScenarioSeverity;
  capabilityKey: string;
  operationKey: string;
  preferredAdapterKey?: string;
  description: string;
  metadata: Record<string, unknown>;
}

export interface PantavionRuntimeScenarioRegistrySnapshot {
  generatedAt: string;
  count: number;
  scenarioKeys: string[];
  targets: PantavionRuntimeTarget[];
}

function nowIso(): string {
  return new Date().toISOString();
}

const RUNTIME_SCENARIOS: PantavionRuntimeScenario[] = [
  {
    scenarioKey: 'durable.execution.baseline',
    title: 'Durable execution baseline',
    target: 'durable',
    severity: 'high',
    capabilityKey: 'durable-execution',
    operationKey: 'execute-task',
    preferredAdapterKey: 'pantavion-runtime-orchestrator',
    description: 'Validate durable execution routing and execution readiness.',
    metadata: {
      family: 'runtime',
    },
  },
  {
    scenarioKey: 'workspace.task.baseline',
    title: 'Workspace task baseline',
    target: 'workspace',
    severity: 'medium',
    capabilityKey: 'durable-execution',
    operationKey: 'schedule',
    preferredAdapterKey: 'pantavion-runtime-orchestrator',
    description: 'Validate workspace task orchestration readiness.',
    metadata: {
      family: 'workspace',
    },
  },
  {
    scenarioKey: 'voice.turn.baseline',
    title: 'Voice turn baseline',
    target: 'voice',
    severity: 'high',
    capabilityKey: 'voice-turn-processing',
    operationKey: 'process-turn',
    preferredAdapterKey: 'pantavion-voice-runtime',
    description: 'Validate live voice/interpreter runtime posture.',
    metadata: {
      family: 'voice',
    },
  },
  {
    scenarioKey: 'resilience.failover.baseline',
    title: 'Resilience failover baseline',
    target: 'resilience',
    severity: 'critical',
    capabilityKey: 'resilience-fallback',
    operationKey: 'plan-fallback',
    preferredAdapterKey: 'pantavion-resilience-fallback',
    description: 'Validate degraded continuity and failover path readiness.',
    metadata: {
      family: 'resilience',
    },
  },
  {
    scenarioKey: 'provider.dispatch.external',
    title: 'External provider dispatch',
    target: 'provider-dispatch',
    severity: 'high',
    capabilityKey: 'external-provider-routing',
    operationKey: 'dispatch-to-provider',
    preferredAdapterKey: 'pantavion-external-provider-bridge',
    description: 'Validate external provider bridge routing posture.',
    metadata: {
      family: 'provider',
    },
  },
  {
    scenarioKey: 'control-plane.kernel.decision',
    title: 'Kernel decision control plane path',
    target: 'control-plane',
    severity: 'critical',
    capabilityKey: 'kernel-decisioning',
    operationKey: 'decide',
    preferredAdapterKey: 'pantavion-kernel-governor',
    description: 'Validate top-level governed control-plane dispatch posture.',
    metadata: {
      family: 'control-plane',
    },
  },
];

export function listRuntimeScenarios(): PantavionRuntimeScenario[] {
  return JSON.parse(JSON.stringify(RUNTIME_SCENARIOS)) as PantavionRuntimeScenario[];
}

export function getRuntimeScenario(
  scenarioKey: string,
): PantavionRuntimeScenario | null {
  const item = RUNTIME_SCENARIOS.find((scenario) => scenario.scenarioKey === scenarioKey);
  return item ? (JSON.parse(JSON.stringify(item)) as PantavionRuntimeScenario) : null;
}

export function getRuntimeScenarioRegistrySnapshot(): PantavionRuntimeScenarioRegistrySnapshot {
  const list = listRuntimeScenarios();

  return {
    generatedAt: nowIso(),
    count: list.length,
    scenarioKeys: list.map((item) => item.scenarioKey),
    targets: [...new Set(list.map((item) => item.target))],
  };
}

export default listRuntimeScenarios;
