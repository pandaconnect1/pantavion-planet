// core/kernel/kernel-bootstrap.ts

import {
  createKernel0Coordinator,
  type KernelGap,
  type KernelInput,
  type KernelOutput,
  type PantavionKernel0Coordinator,
} from './kernel';

import {
  identityModel,
  registerIdentity,
  resolveIdentityPosture,
  type PantavionIdentityRecord,
  type PantavionResolvedIdentityPosture,
} from '../identity/identity-model';

import {
  createDelegation,
  delegationModel,
  type PantavionDelegationRecord,
} from '../identity/delegation-model';

import {
  protocolGateway,
  registerFoundationProtocolAdapter,
  registerProtocolHandler,
  getProtocolRegistrySnapshot,
} from '../protocol/protocol-gateway';

import {
  durableExecutionRuntime,
  type PantavionDurableExecutionRuntime,
} from '../runtime/durable-execution';

import {
  workspaceRuntime,
  type PantavionWorkspaceRuntime,
} from '../runtime/workspace-runtime';

import {
  voiceRuntime,
  type PantavionVoiceRuntime,
} from '../runtime/voice-runtime';

import {
  resilienceRuntime,
  evaluateResilience,
  type PantavionResilienceEvaluation,
  type PantavionResilienceRuntime,
} from '../runtime/resilience-runtime';

type UnknownRecord = Record<string, unknown>;

export interface PantavionFoundationBootstrapConfig {
  registerFoundationActors: boolean;
  registerFoundationDelegations: boolean;
  registerFoundationAdapters: boolean;
  enableKernelHooks: boolean;
}

export interface PantavionFoundationActors {
  kernelSystem: PantavionIdentityRecord;
  protocolSystem: PantavionIdentityRecord;
  adminRoot: PantavionIdentityRecord;
  workspaceAgent: PantavionIdentityRecord;
}

export interface PantavionFoundationDelegations {
  adminToWorkspaceAgent?: PantavionDelegationRecord;
}

export interface PantavionFoundationBootstrapState {
  bootedAt: string;
  kernel: PantavionKernel0Coordinator;
  identityModel: typeof identityModel;
  delegationModel: typeof delegationModel;
  protocolGateway: typeof protocolGateway;
  durableExecutionRuntime: PantavionDurableExecutionRuntime;
  workspaceRuntime: PantavionWorkspaceRuntime;
  voiceRuntime: PantavionVoiceRuntime;
  resilienceRuntime: PantavionResilienceRuntime;
  actors: PantavionFoundationActors;
  delegations: PantavionFoundationDelegations;
  protocolAdapters: string[];
  process: (input: KernelInput) => Promise<KernelOutput>;
  resolveIdentity: (
    input: Parameters<typeof resolveIdentityPosture>[0],
  ) => PantavionResolvedIdentityPosture;
  evaluateResilience: (
    input?: Parameters<typeof evaluateResilience>[0],
  ) => PantavionResilienceEvaluation;
  getSnapshot: () => PantavionFoundationSnapshot;
}

export interface PantavionFoundationSnapshot {
  bootedAt: string;
  actorIds: string[];
  delegationIds: string[];
  protocolAdapterKeys: string[];
  resilienceMode: PantavionResilienceEvaluation['mode'];
  gatewayStats: ReturnType<typeof protocolGateway.getStats>;
}

const DEFAULT_BOOTSTRAP_CONFIG: PantavionFoundationBootstrapConfig = {
  registerFoundationActors: true,
  registerFoundationDelegations: true,
  registerFoundationAdapters: true,
  enableKernelHooks: true,
};

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function registerFoundationActors(): PantavionFoundationActors {
  const kernelSystem = registerIdentity({
    id: 'pantavion.system.kernel0',
    actorType: 'service',
    displayName: 'Pantavion Kernel 0',
    primaryRole: 'service-runtime',
    trustTier: 'system',
    approvalTier: 'security',
    status: 'active',
    defaultScopes: [{ kind: 'global', id: 'global', label: 'Global' }],
    metadata: {
      foundation: true,
      canonical: true,
      subsystem: 'kernel',
    },
  });

  const protocolSystem = registerIdentity({
    id: 'pantavion.system.protocol',
    actorType: 'service',
    displayName: 'Pantavion Protocol Gateway',
    primaryRole: 'service-runtime',
    trustTier: 'system',
    approvalTier: 'security',
    status: 'active',
    defaultScopes: [{ kind: 'global', id: 'global', label: 'Global' }],
    metadata: {
      foundation: true,
      canonical: true,
      subsystem: 'protocol',
    },
  });

  const adminRoot = registerIdentity({
    id: 'pantavion.admin.root',
    actorType: 'human',
    displayName: 'Pantavion Root Admin',
    primaryRole: 'admin-operator',
    trustTier: 'high-trust',
    approvalTier: 'admin',
    status: 'active',
    defaultScopes: [{ kind: 'global', id: 'global', label: 'Global' }],
    metadata: {
      foundation: true,
      canonical: true,
      subsystem: 'admin',
    },
  });

  const workspaceAgent = registerIdentity({
    id: 'pantavion.agent.workspace',
    actorType: 'agent',
    displayName: 'Pantavion Workspace Agent',
    primaryRole: 'agent-runtime',
    trustTier: 'trusted',
    approvalTier: 'review',
    status: 'active',
    defaultScopes: [{ kind: 'global', id: 'global', label: 'Global' }],
    metadata: {
      foundation: true,
      canonical: true,
      subsystem: 'workspace',
    },
  });

  return {
    kernelSystem,
    protocolSystem,
    adminRoot,
    workspaceAgent,
  };
}

function registerFoundationDelegations(
  actors: PantavionFoundationActors,
): PantavionFoundationDelegations {
  const adminToWorkspaceAgent = createDelegation({
    kind: 'workspace',
    principalId: actors.adminRoot.id,
    principalType: 'human',
    delegateId: actors.workspaceAgent.id,
    delegateType: 'agent',
    delegatedRoles: ['operator'],
    delegatedEntitlements: ['workspace:enter', 'task:execute'],
    delegatedScopes: [{ scopeId: 'global', scopeLabel: 'Global' }],
    delegatedCapabilities: [
      { capabilityKey: 'workspace-runtime-awareness', allowed: true },
      { capabilityKey: 'governed-routing', allowed: true },
      { capabilityKey: 'capability-lookup', allowed: true },
    ],
    trustFloor: 'trusted',
    approvalTier: 'review',
    constraints: [
      'scope-bounded',
      'audit-required',
      'no-privilege-escalation',
    ],
    rationale: [
      'Foundation delegation for workspace execution baseline.',
    ],
    metadata: {
      foundation: true,
      canonical: true,
    },
  });

  delegationModel.activateDelegation(adminToWorkspaceAgent.id);

  return {
    adminToWorkspaceAgent,
  };
}

function ensureFoundationProtocolAdapters(): string[] {
  const registered: string[] = [];

  const voiceAdapter = protocolGateway.getAdapter('voice-internal');
  if (!voiceAdapter) {
    registerFoundationProtocolAdapter({
      adapterKey: 'voice-internal',
      displayName: 'Voice Internal Adapter',
      family: 'internal',
      supportedOperations: [
        'voice.respond',
        'voice.translate',
        'voice.command',
        'voice.tool-call',
        'voice.dictation',
      ],
      supportedCapabilities: [
        'voice-runtime-awareness',
        'explainability',
        'memory-awareness',
      ],
      truthModes: ['deterministic', 'verified'],
      metadata: {
        foundation: true,
        runtime: 'voice',
      },
    });

    registerProtocolHandler('voice-internal', async ({ request }) => {
      const payload = asRecord(request.input);
      const text = safeText(payload.text, '[voice]');
      const sourceLanguage = safeText(payload.sourceLanguage, 'auto');
      const targetLanguage = safeText(payload.targetLanguage, sourceLanguage);

      if (request.operationKey === 'voice.translate') {
        return {
          text: `[translated ${sourceLanguage}->${targetLanguage}] ${text}`,
          operationKey: request.operationKey,
        };
      }

      if (request.operationKey === 'voice.command') {
        return {
          text: `[command-accepted] ${text}`,
          operationKey: request.operationKey,
        };
      }

      if (request.operationKey === 'voice.dictation') {
        return {
          text: `[dictation-captured] ${text}`,
          operationKey: request.operationKey,
        };
      }

      return {
        text: `[voice-response] ${text}`,
        operationKey: request.operationKey,
      };
    });

    registered.push('voice-internal');
  }

  const workspaceAdapter = protocolGateway.getAdapter('workspace-internal');
  if (!workspaceAdapter) {
    registerFoundationProtocolAdapter({
      adapterKey: 'workspace-internal',
      displayName: 'Workspace Internal Adapter',
      family: 'internal',
      supportedOperations: [
        'workspace.task.execute',
        'workspace.task.review',
      ],
      supportedCapabilities: [
        'workspace-runtime-awareness',
        'governed-routing',
      ],
      truthModes: ['deterministic', 'verified'],
      metadata: {
        foundation: true,
        runtime: 'workspace',
      },
    });

    registerProtocolHandler('workspace-internal', async ({ request }) => {
      return {
        text: `[workspace-executed] ${request.operationKey}`,
        operationKey: request.operationKey,
        capabilityKey: request.capabilityKey,
      };
    });

    registered.push('workspace-internal');
  }

  const resilienceAdapter = protocolGateway.getAdapter('resilience-internal');
  if (!resilienceAdapter) {
    registerFoundationProtocolAdapter({
      adapterKey: 'resilience-internal',
      displayName: 'Resilience Internal Adapter',
      family: 'internal',
      supportedOperations: ['resilience.evaluate'],
      supportedCapabilities: ['resilience-awareness'],
      truthModes: ['deterministic', 'verified'],
      metadata: {
        foundation: true,
        runtime: 'resilience',
      },
    });

    registerProtocolHandler('resilience-internal', async () => {
      return evaluateResilience({
        requestedServices: ['kernel', 'protocol-gateway'],
      });
    });

    registered.push('resilience-internal');
  }

  return registered;
}

function buildKernelHooks(
  actors: PantavionFoundationActors,
): NonNullable<Parameters<typeof createKernel0Coordinator>[0]>['hooks'] {
  return {
    resolveIdentityPosture: async (request) => {
      return resolveIdentityPosture({
        actorId: request.actor.actorId,
        actorType: request.actor.actorType,
        role: request.actor.role,
        scopes: request.actor.scopes,
        delegatedBy: request.actor.delegatedBy,
        workspaceId: request.actor.workspaceId,
        orgId: request.actor.orgId,
        planKey: request.actor.planKey,
        trustTierHint: request.actor.trustTierHint,
        requestedOperation: request.requestedOperation,
        requestedSensitivity: request.sensitivity,
      });
    },
    memoryAwareness: async (input) => {
      const gaps: KernelGap[] = [];

      if (
        input.request.memoryClass === 'governed-long-term' &&
        input.classification.truthZone === 'generative'
      ) {
        gaps.push({
          key: 'bootstrap-memory-promotion-review',
          severity: 'material',
          area: 'memory',
          description:
            'Governed long-term memory write should be promoted through verified/deterministic review.',
          requiredAction:
            'Introduce stronger canonical memory promotion gate before long-term write.',
        });
      }

      return {
        notes: [
          'Bootstrap hook attached memory-awareness note.',
        ],
        gaps,
      };
    },
    selfMaintenance: async () => {
      const evaluation = evaluateResilience({
        requestedServices: ['kernel', 'protocol-gateway', 'workspace-runtime', 'voice-runtime'],
        requiresWorkspaceContinuity: true,
        requiresVoiceContinuity: true,
      });

      if (evaluation.mode === 'normal') {
        return [];
      }

      return [
        {
          type: 'capacity-warning',
          severity:
            evaluation.mode === 'degraded'
              ? 'medium'
              : evaluation.mode === 'offline-buffered'
                ? 'high'
                : 'critical',
          summary: `Foundation resilience mode is ${evaluation.mode}.`,
          actions: evaluation.recommendedActions,
        },
      ];
    },
    selfUpgrade: async () => {
      return [
        {
          type: 'upgrade-opportunity',
          severity: 'medium',
          summary:
            'Foundation bootstrap suggests next hardening wave: stronger protocol/runtime integration contracts.',
          actions: [
            'Add provider-specific adapters.',
            'Add deterministic smoke execution suite.',
            'Add stronger audit serialization layer.',
          ],
        },
      ];
    },
    selfExpansion: async () => {
      return [
        {
          type: 'registry-expansion',
          severity: 'low',
          summary:
            'Foundation expansion candidate detected for future runtime/service families.',
          actions: [
            'Add create-runtime adapters.',
            'Add business/institutional runtime bindings.',
            'Add stronger kernel bootstrap admission registry.',
          ],
        },
      ];
    },
  };
}

export function bootPantavionFoundation(
  config: Partial<PantavionFoundationBootstrapConfig> = {},
): PantavionFoundationBootstrapState {
  const resolvedConfig: PantavionFoundationBootstrapConfig = {
    ...DEFAULT_BOOTSTRAP_CONFIG,
    ...config,
  };

  const actors = resolvedConfig.registerFoundationActors
    ? registerFoundationActors()
    : registerFoundationActors();

  const delegations = resolvedConfig.registerFoundationDelegations
    ? registerFoundationDelegations(actors)
    : {};

  const protocolAdapters = resolvedConfig.registerFoundationAdapters
    ? ensureFoundationProtocolAdapters()
    : [];

  const kernel = createKernel0Coordinator(
    resolvedConfig.enableKernelHooks
      ? {
          hooks: buildKernelHooks(actors),
        }
      : {},
    {},
  );

  resilienceRuntime.registerService({
    serviceKey: 'kernel-bootstrap',
    family: 'foundation',
    status: 'healthy',
    details: 'Kernel bootstrap integration layer ready.',
    metadata: {
      foundation: true,
    },
  });

  const bootedAt = new Date().toISOString();

  const state: PantavionFoundationBootstrapState = {
    bootedAt,
    kernel,
    identityModel,
    delegationModel,
    protocolGateway,
    durableExecutionRuntime,
    workspaceRuntime,
    voiceRuntime,
    resilienceRuntime,
    actors,
    delegations,
    protocolAdapters: uniqStrings([
      ...protocolAdapters,
      ...getProtocolRegistrySnapshot().adapters.map((adapter) => adapter.adapterKey),
    ]),
    process: async (input: KernelInput) => kernel.process(input),
    resolveIdentity: (input) => resolveIdentityPosture(input),
    evaluateResilience: (input = {}) => evaluateResilience(input),
    getSnapshot: () => ({
      bootedAt,
      actorIds: [
        actors.kernelSystem.id,
        actors.protocolSystem.id,
        actors.adminRoot.id,
        actors.workspaceAgent.id,
      ],
      delegationIds: uniqStrings(
        Object.values(delegations)
          .filter(Boolean)
          .map((item) => (item as PantavionDelegationRecord).id),
      ),
      protocolAdapterKeys: getProtocolRegistrySnapshot().adapters.map(
        (adapter) => adapter.adapterKey,
      ),
      resilienceMode: evaluateResilience().mode,
      gatewayStats: protocolGateway.getStats(),
    }),
  };

  return state;
}

export const pantavionFoundation = bootPantavionFoundation();
export default pantavionFoundation;
