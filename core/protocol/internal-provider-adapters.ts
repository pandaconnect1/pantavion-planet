// core/protocol/internal-provider-adapters.ts

import {
  registerProviderAdapter,
  syncProviderAdaptersToGateway,
  getProviderAdapterRegistrySnapshot,
  type PantavionProviderAdapterRecord,
  type PantavionProviderAdapterRegistrationInput,
  type PantavionProviderGatewaySyncResult,
} from './provider-adapter-registry';

import {
  upsertProviderHealth,
  getProviderHealthRegistrySnapshot,
  type PantavionProviderHealthRegistrySnapshot,
  type PantavionProviderHealthRecord,
} from './provider-health-registry';

export interface PantavionInternalProviderBootstrapResult {
  generatedAt: string;
  adapters: PantavionProviderAdapterRecord[];
  healthRecords: PantavionProviderHealthRecord[];
  gatewaySync: PantavionProviderGatewaySyncResult;
  registrySnapshot: ReturnType<typeof getProviderAdapterRegistrySnapshot>;
  healthSnapshot: PantavionProviderHealthRegistrySnapshot;
}

function nowIso(): string {
  return new Date().toISOString();
}

export const INTERNAL_PROVIDER_ADAPTER_DEFINITIONS: PantavionProviderAdapterRegistrationInput[] = [
  {
    adapterKey: 'pantavion-kernel-governor',
    displayName: 'Pantavion Kernel Governor',
    family: 'internal',
    providerKind: 'internal',
    availability: 'ready',
    trustTier: 'system',
    authModes: ['service', 'admin'],
    executionModes: ['sync', 'async'],
    truthModes: ['deterministic', 'verified'],
    supportedCapabilities: [
      'kernel-decisioning',
      'governed-routing',
      'capability-resolution',
      'policy-aware-orchestration',
    ],
    supportedOperations: [
      'decide',
      'route',
      'govern',
      'explain',
    ],
    metadata: {
      layer: 'kernel',
      source: 'internal-foundation',
    },
  },
  {
    adapterKey: 'pantavion-memory-continuity',
    displayName: 'Pantavion Memory Continuity',
    family: 'memory',
    providerKind: 'internal',
    availability: 'ready',
    trustTier: 'high',
    authModes: ['service', 'delegated'],
    executionModes: ['sync', 'async'],
    truthModes: ['deterministic', 'verified'],
    supportedCapabilities: [
      'memory-continuity',
      'session-recall',
      'project-recall',
      'state-rehydration',
    ],
    supportedOperations: [
      'recall',
      'hydrate',
      'summarize-memory',
    ],
    metadata: {
      layer: 'continuity',
    },
  },
  {
    adapterKey: 'pantavion-reporting-export',
    displayName: 'Pantavion Reporting and Export',
    family: 'reporting',
    providerKind: 'internal',
    availability: 'ready',
    trustTier: 'trusted',
    authModes: ['service'],
    executionModes: ['sync', 'async'],
    truthModes: ['deterministic', 'verified'],
    supportedCapabilities: [
      'report-export',
      'json-export',
      'artifact-summary',
      'closure-reporting',
    ],
    supportedOperations: [
      'export',
      'render-report',
      'render-summary',
    ],
    metadata: {
      layer: 'reporting',
    },
  },
  {
    adapterKey: 'pantavion-runtime-orchestrator',
    displayName: 'Pantavion Runtime Orchestrator',
    family: 'runtime',
    providerKind: 'internal',
    availability: 'ready',
    trustTier: 'high',
    authModes: ['service', 'delegated'],
    executionModes: ['sync', 'async'],
    truthModes: ['deterministic'],
    supportedCapabilities: [
      'durable-execution',
      'workspace-task-routing',
      'runtime-orchestration',
      'task-fanout',
    ],
    supportedOperations: [
      'execute-task',
      'schedule',
      'cancel',
      'resume',
    ],
    metadata: {
      layer: 'runtime',
    },
  },
  {
    adapterKey: 'pantavion-voice-runtime',
    displayName: 'Pantavion Voice Runtime',
    family: 'voice',
    providerKind: 'internal',
    availability: 'maintenance',
    trustTier: 'trusted',
    authModes: ['service', 'session'],
    executionModes: ['sync', 'async'],
    truthModes: ['deterministic', 'verified'],
    supportedCapabilities: [
      'voice-turn-processing',
      'interpreter-session',
      'speech-routing',
      'live-multilingual-bridge',
    ],
    supportedOperations: [
      'start-voice-session',
      'process-turn',
      'pause-session',
      'end-session',
    ],
    metadata: {
      layer: 'voice',
    },
  },
  {
    adapterKey: 'pantavion-resilience-fallback',
    displayName: 'Pantavion Resilience Fallback',
    family: 'resilience',
    providerKind: 'internal',
    availability: 'ready',
    trustTier: 'system',
    authModes: ['service', 'admin'],
    executionModes: ['sync', 'async'],
    truthModes: ['deterministic'],
    supportedCapabilities: [
      'resilience-fallback',
      'offline-buffering',
      'failover-coordination',
      'degraded-continuity',
    ],
    supportedOperations: [
      'plan-fallback',
      'trigger-failover',
      'buffer-offline',
      'resume-continuity',
    ],
    metadata: {
      layer: 'resilience',
    },
  },
  {
    adapterKey: 'pantavion-external-provider-bridge',
    displayName: 'Pantavion External Provider Bridge',
    family: 'external',
    providerKind: 'hybrid',
    availability: 'degraded',
    trustTier: 'bounded',
    authModes: ['service', 'delegated'],
    executionModes: ['async'],
    truthModes: ['verified', 'generative'],
    supportedCapabilities: [
      'external-provider-routing',
      'model-inference-bridge',
      'provider-health-check',
    ],
    supportedOperations: [
      'dispatch-to-provider',
      'probe-health',
      'collect-availability',
    ],
    metadata: {
      layer: 'external-bridge',
      note: 'Initial degraded bridge baseline.',
    },
  },
  {
    adapterKey: 'pantavion-research-intake',
    displayName: 'Pantavion Research Intake',
    family: 'research',
    providerKind: 'internal',
    availability: 'ready',
    trustTier: 'trusted',
    authModes: ['service'],
    executionModes: ['async'],
    truthModes: ['verified'],
    supportedCapabilities: [
      'research-intake',
      'evidence-bundling',
      'frontier-scan',
      'source-comparison',
    ],
    supportedOperations: [
      'collect-sources',
      'bundle-evidence',
      'score-sources',
    ],
    metadata: {
      layer: 'research',
    },
  },
];

function buildHealthRecordForAdapter(
  adapter: PantavionProviderAdapterRecord,
): PantavionProviderHealthRecord {
  switch (adapter.adapterKey) {
    case 'pantavion-kernel-governor':
      return upsertProviderHealth({
        adapterKey: adapter.adapterKey,
        status: 'healthy',
        successRate: 0.998,
        latencyMs: 18,
        incidents: 0,
        notes: ['Primary governed kernel adapter.'],
      });

    case 'pantavion-memory-continuity':
      return upsertProviderHealth({
        adapterKey: adapter.adapterKey,
        status: 'healthy',
        successRate: 0.996,
        latencyMs: 22,
        incidents: 0,
        notes: ['Continuity path stable.'],
      });

    case 'pantavion-reporting-export':
      return upsertProviderHealth({
        adapterKey: adapter.adapterKey,
        status: 'healthy',
        successRate: 0.997,
        latencyMs: 25,
        incidents: 0,
        notes: ['Reporting/export path stable.'],
      });

    case 'pantavion-runtime-orchestrator':
      return upsertProviderHealth({
        adapterKey: adapter.adapterKey,
        status: 'watch',
        successRate: 0.982,
        latencyMs: 66,
        incidents: 1,
        notes: ['Runtime path still under hardening.'],
      });

    case 'pantavion-voice-runtime':
      return upsertProviderHealth({
        adapterKey: adapter.adapterKey,
        status: 'watch',
        successRate: 0.971,
        latencyMs: 94,
        incidents: 2,
        notes: ['Voice runtime in maintenance/watch posture.'],
      });

    case 'pantavion-resilience-fallback':
      return upsertProviderHealth({
        adapterKey: adapter.adapterKey,
        status: 'healthy',
        successRate: 0.999,
        latencyMs: 19,
        incidents: 0,
        notes: ['Fallback path ready.'],
      });

    case 'pantavion-external-provider-bridge':
      return upsertProviderHealth({
        adapterKey: adapter.adapterKey,
        status: 'degraded',
        successRate: 0.913,
        latencyMs: 240,
        incidents: 4,
        notes: ['External bridge still degraded and needs hardening.'],
      });

    case 'pantavion-research-intake':
      return upsertProviderHealth({
        adapterKey: adapter.adapterKey,
        status: 'healthy',
        successRate: 0.989,
        latencyMs: 58,
        incidents: 0,
        notes: ['Research intake stable.'],
      });

    default:
      return upsertProviderHealth({
        adapterKey: adapter.adapterKey,
        status: 'watch',
        successRate: 0.97,
        latencyMs: 80,
        incidents: 1,
        notes: ['Default provider health applied.'],
      });
  }
}

export function registerInternalProviderAdapters(): PantavionProviderAdapterRecord[] {
  return INTERNAL_PROVIDER_ADAPTER_DEFINITIONS.map((definition) =>
    registerProviderAdapter(definition),
  );
}

export async function bootstrapInternalProviderAdapterLayer(): Promise<PantavionInternalProviderBootstrapResult> {
  const adapters = registerInternalProviderAdapters();
  const healthRecords = adapters.map(buildHealthRecordForAdapter);
  const gatewaySync = await syncProviderAdaptersToGateway();

  return {
    generatedAt: nowIso(),
    adapters,
    healthRecords,
    gatewaySync,
    registrySnapshot: getProviderAdapterRegistrySnapshot(),
    healthSnapshot: getProviderHealthRegistrySnapshot(),
  };
}

export default bootstrapInternalProviderAdapterLayer;
