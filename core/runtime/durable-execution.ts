// core/runtime/durable-execution.ts

import {
  createCapabilityRequest,
  type PantavionCapabilityRequest,
  type PantavionProtocolScopeRef,
} from '../protocol/protocol-types';

import { dispatchProtocolRequest } from '../protocol/protocol-gateway';

import {
  type PantavionApprovalTier,
  type PantavionResolvedIdentityPosture,
} from '../identity/identity-model';

export type PantavionDurableExecutionStatus =
  | 'pending'
  | 'running'
  | 'waiting-approval'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled';

export type PantavionDurableStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'skipped';

export type PantavionDurableStepKind =
  | 'capability'
  | 'checkpoint'
  | 'approval'
  | 'manual'
  | 'transform';

export interface PantavionDurableMetadata {
  [key: string]: unknown;
}

export interface PantavionRetryPolicy {
  maxAttempts: number;
  backoffMs: number;
}

export interface PantavionDurableExecutionStepInput {
  stepKey: string;
  title?: string;
  kind?: PantavionDurableStepKind;
  capabilityKey?: string;
  operationKey?: string;
  payload?: unknown;
  requestedScopes?: PantavionProtocolScopeRef[];
  requiredEntitlements?: string[];
  requiredApprovalTier?: PantavionApprovalTier;
  retryPolicy?: Partial<PantavionRetryPolicy>;
  metadata?: PantavionDurableMetadata;
}

export interface PantavionDurableExecutionStepRecord {
  id: string;
  stepKey: string;
  title: string;
  kind: PantavionDurableStepKind;
  status: PantavionDurableStepStatus;
  capabilityRequest?: PantavionCapabilityRequest;
  requiredApprovalTier?: PantavionApprovalTier;
  retryPolicy: PantavionRetryPolicy;
  attemptCount: number;
  lastAttemptAt?: string;
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
  warnings: string[];
  metadata: PantavionDurableMetadata;
}

export interface PantavionDurableExecutionInput {
  executionKey?: string;
  title?: string;
  actorId?: string;
  actorType?: 'human' | 'agent' | 'service';
  steps: PantavionDurableExecutionStepInput[];
  metadata?: PantavionDurableMetadata;
}

export interface PantavionDurableExecutionRecord {
  id: string;
  executionKey: string;
  title: string;
  status: PantavionDurableExecutionStatus;
  actorId?: string;
  actorType: 'human' | 'agent' | 'service';
  steps: PantavionDurableExecutionStepRecord[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  currentStepIndex: number;
  lastError?: string;
  warnings: string[];
  metadata: PantavionDurableMetadata;
}

export interface PantavionDurableExecutionRunResult {
  execution: PantavionDurableExecutionRecord;
  completed: boolean;
  blocked: boolean;
  failed: boolean;
  currentStep?: PantavionDurableExecutionStepRecord;
}

export interface PantavionDurableExecutionConfig {
  defaultRetryPolicy: PantavionRetryPolicy;
  stopOnFailure: boolean;
  stopOnReview: boolean;
}

const DEFAULT_DURABLE_EXECUTION_CONFIG: PantavionDurableExecutionConfig = {
  defaultRetryPolicy: {
    maxAttempts: 2,
    backoffMs: 1000,
  },
  stopOnFailure: true,
  stopOnReview: true,
};

function nowIso(): string {
  return new Date().toISOString();
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function normalizeApprovalTier(value: unknown): PantavionApprovalTier {
  switch (value) {
    case 'none':
    case 'review':
    case 'admin':
    case 'security':
    case 'executive':
      return value;
    default:
      return 'review';
  }
}

function normalizeActorType(
  value: unknown,
): 'human' | 'agent' | 'service' {
  return value === 'agent' || value === 'service' ? value : 'human';
}

function normalizeRetryPolicy(
  retryPolicy: Partial<PantavionRetryPolicy> | undefined,
  fallback: PantavionRetryPolicy,
): PantavionRetryPolicy {
  return {
    maxAttempts:
      typeof retryPolicy?.maxAttempts === 'number' && retryPolicy.maxAttempts > 0
        ? retryPolicy.maxAttempts
        : fallback.maxAttempts,
    backoffMs:
      typeof retryPolicy?.backoffMs === 'number' && retryPolicy.backoffMs >= 0
        ? retryPolicy.backoffMs
        : fallback.backoffMs,
  };
}

function createStepRecord(
  input: PantavionDurableExecutionStepInput,
  fallbackRetryPolicy: PantavionRetryPolicy,
): PantavionDurableExecutionStepRecord {
  const kind = input.kind ?? (safeText(input.capabilityKey) ? 'capability' : 'checkpoint');
  const capabilityRequest =
    kind === 'capability'
      ? createCapabilityRequest({
          capabilityKey: safeText(input.capabilityKey, safeText(input.stepKey)),
          operationKey: safeText(
            input.operationKey,
            `${safeText(input.stepKey, 'step')}.execute`,
          ),
          input: input.payload ?? null,
          requestedScopes: input.requestedScopes ?? [],
          requiredEntitlements: input.requiredEntitlements ?? [],
          metadata: input.metadata ?? {},
        })
      : undefined;

  return {
    id: createId('des'),
    stepKey: safeText(input.stepKey),
    title: safeText(input.title, safeText(input.stepKey)),
    kind,
    status: 'pending',
    capabilityRequest,
    requiredApprovalTier: input.requiredApprovalTier
      ? normalizeApprovalTier(input.requiredApprovalTier)
      : undefined,
    retryPolicy: normalizeRetryPolicy(input.retryPolicy, fallbackRetryPolicy),
    attemptCount: 0,
    warnings: [],
    metadata: input.metadata ?? {},
  };
}

export class PantavionDurableExecutionRuntime {
  private readonly config: PantavionDurableExecutionConfig;
  private readonly executions = new Map<string, PantavionDurableExecutionRecord>();

  constructor(config: Partial<PantavionDurableExecutionConfig> = {}) {
    this.config = {
      ...DEFAULT_DURABLE_EXECUTION_CONFIG,
      ...config,
      defaultRetryPolicy: {
        ...DEFAULT_DURABLE_EXECUTION_CONFIG.defaultRetryPolicy,
        ...(config.defaultRetryPolicy ?? {}),
      },
    };
  }

  createExecution(
    input: PantavionDurableExecutionInput,
  ): PantavionDurableExecutionRecord {
    const createdAt = nowIso();

    const record: PantavionDurableExecutionRecord = {
      id: createId('dex'),
      executionKey: safeText(input.executionKey, createId('execution')),
      title: safeText(input.title, 'Durable Execution'),
      status: 'pending',
      actorId: safeText(input.actorId) || undefined,
      actorType: normalizeActorType(input.actorType),
      steps: input.steps.map((step) =>
        createStepRecord(step, this.config.defaultRetryPolicy),
      ),
      createdAt,
      currentStepIndex: 0,
      warnings: [],
      metadata: input.metadata ?? {},
    };

    this.executions.set(record.id, record);
    return record;
  }

  getExecution(executionId: string): PantavionDurableExecutionRecord | null {
    return this.executions.get(executionId) ?? null;
  }

  listExecutions(): PantavionDurableExecutionRecord[] {
    return [...this.executions.values()];
  }

  async runExecution(
    executionId: string,
    identity?: PantavionResolvedIdentityPosture | null,
  ): Promise<PantavionDurableExecutionRunResult> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status === 'completed') {
      return {
        execution,
        completed: true,
        blocked: false,
        failed: false,
      };
    }

    execution.status = 'running';
    execution.startedAt = execution.startedAt ?? nowIso();

    for (
      let index = execution.currentStepIndex;
      index < execution.steps.length;
      index += 1
    ) {
      const step = execution.steps[index];
      execution.currentStepIndex = index;

      const result = await this.runStep(step, identity);

      if (result.status === 'completed' || result.status === 'skipped') {
        continue;
      }

      if (result.status === 'blocked') {
        execution.status = 'waiting-approval';
        return {
          execution,
          completed: false,
          blocked: true,
          failed: false,
          currentStep: result,
        };
      }

      if (result.status === 'failed') {
        execution.status = 'failed';
        execution.lastError = safeText(result.error, 'Unknown step failure.');
        execution.completedAt = nowIso();

        return {
          execution,
          completed: false,
          blocked: false,
          failed: true,
          currentStep: result,
        };
      }
    }

    execution.status = 'completed';
    execution.completedAt = nowIso();

    return {
      execution,
      completed: true,
      blocked: false,
      failed: false,
    };
  }

  cancelExecution(executionId: string, reason?: string): PantavionDurableExecutionRecord | null {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return null;
    }

    execution.status = 'cancelled';
    execution.lastError = safeText(reason) || execution.lastError;
    execution.completedAt = nowIso();
    return execution;
  }

  private async runStep(
    step: PantavionDurableExecutionStepRecord,
    identity?: PantavionResolvedIdentityPosture | null,
  ): Promise<PantavionDurableExecutionStepRecord> {
    if (step.status === 'completed' || step.status === 'skipped') {
      return step;
    }

    step.status = 'running';
    step.startedAt = step.startedAt ?? nowIso();
    step.lastAttemptAt = nowIso();
    step.attemptCount += 1;

    if (step.kind === 'checkpoint' || step.kind === 'transform' || step.kind === 'manual') {
      step.status = 'completed';
      step.completedAt = nowIso();
      step.output = {
        acknowledged: true,
        kind: step.kind,
        stepKey: step.stepKey,
      };
      return step;
    }

    if (step.kind === 'approval') {
      step.status = 'blocked';
      step.error = 'Approval step requires external approval resolution.';
      step.warnings.push('Execution paused on explicit approval step.');
      return step;
    }

    if (!step.capabilityRequest) {
      step.status = 'failed';
      step.error = 'Capability step has no capability request.';
      step.completedAt = nowIso();
      return step;
    }

    if (
      step.requiredApprovalTier &&
      identity &&
      !hasSufficientApprovalTier(identity.approvalTier, step.requiredApprovalTier)
    ) {
      step.status = 'blocked';
      step.error = `Required approval tier ${step.requiredApprovalTier} not satisfied.`;
      step.warnings.push('Execution paused due to step approval requirement.');
      return step;
    }

    const dispatchResult = await dispatchProtocolRequest({
      request: step.capabilityRequest,
      identity: identity ?? undefined,
    });

    if (dispatchResult.route.disposition === 'review') {
      step.status = 'blocked';
      step.error = 'Protocol route requires approval before execution.';
      step.warnings.push(...dispatchResult.route.reason);
      return step;
    }

    if (!dispatchResult.dispatch.success) {
      if (step.attemptCount < step.retryPolicy.maxAttempts) {
        step.status = 'pending';
        step.error = safeText(
          dispatchResult.dispatch.errors[0],
          'Dispatch failed; retry available.',
        );
        step.warnings.push('Step failed but remains retryable.');
        return step;
      }

      step.status = 'failed';
      step.error = safeText(
        dispatchResult.dispatch.errors[0],
        'Dispatch failed after retries.',
      );
      step.completedAt = nowIso();
      return step;
    }

    step.status = 'completed';
    step.completedAt = nowIso();
    step.output = dispatchResult.capabilityResult.output;
    step.warnings.push(...dispatchResult.capabilityResult.warnings);
    return step;
  }
}

function hasSufficientApprovalTier(
  current: PantavionApprovalTier,
  required: PantavionApprovalTier,
): boolean {
  const order: PantavionApprovalTier[] = [
    'none',
    'review',
    'admin',
    'security',
    'executive',
  ];

  return order.indexOf(current) >= order.indexOf(required);
}

export function createDurableExecutionRuntime(
  config: Partial<PantavionDurableExecutionConfig> = {},
): PantavionDurableExecutionRuntime {
  return new PantavionDurableExecutionRuntime(config);
}

export const durableExecutionRuntime = createDurableExecutionRuntime();

export function createDurableExecution(
  input: PantavionDurableExecutionInput,
): PantavionDurableExecutionRecord {
  return durableExecutionRuntime.createExecution(input);
}

export async function runDurableExecution(
  executionId: string,
  identity?: PantavionResolvedIdentityPosture | null,
): Promise<PantavionDurableExecutionRunResult> {
  return durableExecutionRuntime.runExecution(executionId, identity);
}

export function cancelDurableExecution(
  executionId: string,
  reason?: string,
): PantavionDurableExecutionRecord | null {
  return durableExecutionRuntime.cancelExecution(executionId, reason);
}
