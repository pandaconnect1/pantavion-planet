// core/runtime/workspace-runtime.ts

import {
  createDurableExecution,
  runDurableExecution,
  type PantavionDurableExecutionInput,
  type PantavionDurableExecutionRecord,
  type PantavionDurableExecutionRunResult,
  type PantavionDurableExecutionStepInput,
} from './durable-execution';

import {
  type PantavionApprovalTier,
  type PantavionResolvedIdentityPosture,
} from '../identity/identity-model';

import type { PantavionProtocolScopeRef } from '../protocol/protocol-types';

export type PantavionWorkspaceVisibility =
  | 'private'
  | 'shared'
  | 'organization'
  | 'institutional';

export type PantavionWorkspaceStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'archived';

export type PantavionWorkspaceMemberRole =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'operator'
  | 'viewer'
  | 'agent';

export type PantavionWorkspaceSessionStatus =
  | 'idle'
  | 'active'
  | 'paused'
  | 'ended';

export type PantavionWorkspaceTaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled';

export interface PantavionWorkspaceMetadata {
  [key: string]: unknown;
}

export interface PantavionWorkspaceScopeRef {
  scopeId: string;
  scopeLabel?: string;
}

export interface PantavionWorkspaceMemberRecord {
  actorId: string;
  role: PantavionWorkspaceMemberRole;
  addedAt: string;
  addedBy?: string;
  active: boolean;
  metadata?: PantavionWorkspaceMetadata;
}

export interface PantavionWorkspaceSessionRecord {
  id: string;
  workspaceId: string;
  actorId: string;
  startedAt: string;
  endedAt?: string;
  status: PantavionWorkspaceSessionStatus;
  metadata: PantavionWorkspaceMetadata;
}

export interface PantavionWorkspaceTaskInput {
  taskKey: string;
  title?: string;
  capabilityKey?: string;
  operationKey?: string;
  payload?: unknown;
  requestedScopes?: PantavionProtocolScopeRef[];
  requiredEntitlements?: string[];
  requiredApprovalTier?: PantavionApprovalTier;
  metadata?: PantavionWorkspaceMetadata;
}

export interface PantavionWorkspaceTaskRecord {
  id: string;
  workspaceId: string;
  taskKey: string;
  title: string;
  status: PantavionWorkspaceTaskStatus;
  durableExecutionId: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
  metadata: PantavionWorkspaceMetadata;
}

export interface PantavionWorkspaceRecord {
  id: string;
  workspaceKey: string;
  title: string;
  description?: string;
  visibility: PantavionWorkspaceVisibility;
  status: PantavionWorkspaceStatus;
  ownerActorId: string;
  members: PantavionWorkspaceMemberRecord[];
  scopes: PantavionWorkspaceScopeRef[];
  createdAt: string;
  updatedAt: string;
  metadata: PantavionWorkspaceMetadata;
}

export interface PantavionWorkspaceCreateInput {
  workspaceKey?: string;
  title: string;
  description?: string;
  visibility?: PantavionWorkspaceVisibility;
  ownerActorId: string;
  members?: Array<{
    actorId: string;
    role?: PantavionWorkspaceMemberRole;
    metadata?: PantavionWorkspaceMetadata;
  }>;
  scopes?: PantavionWorkspaceScopeRef[];
  metadata?: PantavionWorkspaceMetadata;
}

export interface PantavionWorkspaceRuntimeConfig {
  defaultVisibility: PantavionWorkspaceVisibility;
  autoAddOwnerAsMember: boolean;
}

export interface PantavionWorkspaceTaskRunOutput {
  workspace: PantavionWorkspaceRecord;
  task: PantavionWorkspaceTaskRecord;
  execution: PantavionDurableExecutionRecord;
  result: PantavionDurableExecutionRunResult;
}

const DEFAULT_WORKSPACE_RUNTIME_CONFIG: PantavionWorkspaceRuntimeConfig = {
  defaultVisibility: 'private',
  autoAddOwnerAsMember: true,
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

function dedupeScopes(
  scopes: PantavionWorkspaceScopeRef[],
): PantavionWorkspaceScopeRef[] {
  const seen = new Set<string>();
  const out: PantavionWorkspaceScopeRef[] = [];

  for (const scope of scopes) {
    const scopeId = safeText(scope.scopeId);
    if (!scopeId || seen.has(scopeId)) {
      continue;
    }

    seen.add(scopeId);
    out.push({
      scopeId,
      scopeLabel: safeText(scope.scopeLabel) || undefined,
    });
  }

  return out;
}

function dedupeMembers(
  members: PantavionWorkspaceMemberRecord[],
): PantavionWorkspaceMemberRecord[] {
  const seen = new Set<string>();
  const out: PantavionWorkspaceMemberRecord[] = [];

  for (const member of members) {
    const actorId = safeText(member.actorId);
    if (!actorId || seen.has(actorId)) {
      continue;
    }

    seen.add(actorId);
    out.push({
      actorId,
      role: member.role,
      addedAt: member.addedAt,
      addedBy: member.addedBy,
      active: member.active,
      metadata: member.metadata ?? {},
    });
  }

  return out;
}

function hasWorkspaceRole(
  workspace: PantavionWorkspaceRecord,
  actorId: string,
  roles: PantavionWorkspaceMemberRole[],
): boolean {
  return workspace.members.some(
    (member) =>
      member.actorId === actorId &&
      member.active &&
      roles.includes(member.role),
  );
}

function canAccessWorkspace(
  workspace: PantavionWorkspaceRecord,
  identity?: PantavionResolvedIdentityPosture | null,
): boolean {
  if (!identity?.actorId) {
    return workspace.visibility !== 'private';
  }

  if (identity.actorId === workspace.ownerActorId) {
    return true;
  }

  if (
    workspace.members.some(
      (member) => member.actorId === identity.actorId && member.active,
    )
  ) {
    return true;
  }

  if (workspace.visibility === 'shared') {
    return true;
  }

  if (
    workspace.visibility === 'organization' &&
    workspace.scopes.some((scope) =>
      identity.effectiveScopes.includes(scope.scopeId),
    )
  ) {
    return true;
  }

  if (
    workspace.visibility === 'institutional' &&
    identity.approvalTier !== 'none'
  ) {
    return true;
  }

  return false;
}

function mapTaskInputToSteps(
  task: PantavionWorkspaceTaskInput,
): PantavionDurableExecutionStepInput[] {
  return [
    {
      stepKey: `${safeText(task.taskKey)}.main`,
      title: safeText(task.title, safeText(task.taskKey)),
      kind: 'capability',
      capabilityKey: safeText(task.capabilityKey, safeText(task.taskKey)),
      operationKey: safeText(
        task.operationKey,
        `${safeText(task.taskKey, 'task')}.execute`,
      ),
      payload: task.payload ?? null,
      requestedScopes: task.requestedScopes ?? [],
      requiredEntitlements: task.requiredEntitlements ?? [],
      requiredApprovalTier: task.requiredApprovalTier,
      metadata: task.metadata ?? {},
    },
  ];
}

export class PantavionWorkspaceRuntime {
  private readonly config: PantavionWorkspaceRuntimeConfig;
  private readonly workspaces = new Map<string, PantavionWorkspaceRecord>();
  private readonly sessions = new Map<string, PantavionWorkspaceSessionRecord>();
  private readonly tasks = new Map<string, PantavionWorkspaceTaskRecord>();

  constructor(config: Partial<PantavionWorkspaceRuntimeConfig> = {}) {
    this.config = {
      ...DEFAULT_WORKSPACE_RUNTIME_CONFIG,
      ...config,
    };
  }

  createWorkspace(
    input: PantavionWorkspaceCreateInput,
  ): PantavionWorkspaceRecord {
    const createdAt = nowIso();

    const ownerMember: PantavionWorkspaceMemberRecord = {
      actorId: safeText(input.ownerActorId),
      role: 'owner',
      addedAt: createdAt,
      active: true,
      metadata: {},
    };

    const additionalMembers: PantavionWorkspaceMemberRecord[] = (input.members ?? []).map(
      (member) => ({
        actorId: safeText(member.actorId),
        role: member.role ?? 'viewer',
        addedAt: createdAt,
        addedBy: safeText(input.ownerActorId),
        active: true,
        metadata: member.metadata ?? {},
      }),
    );

    const workspace: PantavionWorkspaceRecord = {
      id: createId('wsp'),
      workspaceKey: safeText(input.workspaceKey, createId('workspace')),
      title: safeText(input.title, 'Workspace'),
      description: safeText(input.description) || undefined,
      visibility: input.visibility ?? this.config.defaultVisibility,
      status: 'active',
      ownerActorId: safeText(input.ownerActorId),
      members: dedupeMembers(
        this.config.autoAddOwnerAsMember
          ? [ownerMember, ...additionalMembers]
          : additionalMembers,
      ),
      scopes: dedupeScopes(input.scopes ?? []),
      createdAt,
      updatedAt: createdAt,
      metadata: input.metadata ?? {},
    };

    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  getWorkspace(workspaceId: string): PantavionWorkspaceRecord | null {
    return this.workspaces.get(workspaceId) ?? null;
  }

  listWorkspaces(): PantavionWorkspaceRecord[] {
    return [...this.workspaces.values()];
  }

  addMember(input: {
    workspaceId: string;
    actorId: string;
    role?: PantavionWorkspaceMemberRole;
    addedBy?: string;
    metadata?: PantavionWorkspaceMetadata;
  }): PantavionWorkspaceRecord | null {
    const workspace = this.workspaces.get(input.workspaceId);
    if (!workspace) {
      return null;
    }

    workspace.members = dedupeMembers([
      ...workspace.members,
      {
        actorId: safeText(input.actorId),
        role: input.role ?? 'viewer',
        addedAt: nowIso(),
        addedBy: safeText(input.addedBy) || undefined,
        active: true,
        metadata: input.metadata ?? {},
      },
    ]);

    workspace.updatedAt = nowIso();
    return workspace;
  }

  startSession(input: {
    workspaceId: string;
    identity: PantavionResolvedIdentityPosture;
    metadata?: PantavionWorkspaceMetadata;
  }): PantavionWorkspaceSessionRecord {
    const workspace = this.workspaces.get(input.workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${input.workspaceId}`);
    }

    if (!canAccessWorkspace(workspace, input.identity)) {
      throw new Error(`Access denied for workspace: ${input.workspaceId}`);
    }

    const session: PantavionWorkspaceSessionRecord = {
      id: createId('wss'),
      workspaceId: workspace.id,
      actorId: safeText(input.identity.actorId, 'anonymous'),
      startedAt: nowIso(),
      status: 'active',
      metadata: input.metadata ?? {},
    };

    this.sessions.set(session.id, session);
    return session;
  }

  endSession(sessionId: string): PantavionWorkspaceSessionRecord | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.status = 'ended';
    session.endedAt = nowIso();
    return session;
  }

  createTask(input: {
    workspaceId: string;
    task: PantavionWorkspaceTaskInput;
  }): PantavionWorkspaceTaskRecord {
    const workspace = this.workspaces.get(input.workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${input.workspaceId}`);
    }

    const durableInput: PantavionDurableExecutionInput = {
      executionKey: `${workspace.workspaceKey}.${safeText(input.task.taskKey)}`,
      title: safeText(input.task.title, safeText(input.task.taskKey)),
      actorId: workspace.ownerActorId,
      actorType: 'human',
      steps: mapTaskInputToSteps(input.task),
      metadata: {
        workspaceId: workspace.id,
        taskKey: input.task.taskKey,
      },
    };

    const execution = createDurableExecution(durableInput);

    const taskRecord: PantavionWorkspaceTaskRecord = {
      id: createId('wst'),
      workspaceId: workspace.id,
      taskKey: safeText(input.task.taskKey),
      title: safeText(input.task.title, safeText(input.task.taskKey)),
      status: 'pending',
      durableExecutionId: execution.id,
      createdAt: nowIso(),
      metadata: input.task.metadata ?? {},
    };

    this.tasks.set(taskRecord.id, taskRecord);
    return taskRecord;
  }

  getTask(taskId: string): PantavionWorkspaceTaskRecord | null {
    return this.tasks.get(taskId) ?? null;
  }

  listTasksForWorkspace(workspaceId: string): PantavionWorkspaceTaskRecord[] {
    return [...this.tasks.values()].filter(
      (task) => task.workspaceId === workspaceId,
    );
  }

  async runTask(input: {
    taskId: string;
    identity?: PantavionResolvedIdentityPosture | null;
  }): Promise<PantavionWorkspaceTaskRunOutput> {
    const task = this.tasks.get(input.taskId);
    if (!task) {
      throw new Error(`Task not found: ${input.taskId}`);
    }

    const workspace = this.workspaces.get(task.workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found for task: ${task.workspaceId}`);
    }

    if (!canAccessWorkspace(workspace, input.identity)) {
      throw new Error(`Access denied for workspace: ${workspace.id}`);
    }

    if (
      input.identity?.actorId &&
      !hasWorkspaceRole(workspace, input.identity.actorId, [
        'owner',
        'admin',
        'editor',
        'operator',
        'agent',
      ]) &&
      input.identity.actorId !== workspace.ownerActorId
    ) {
      throw new Error(`Actor cannot execute task in workspace: ${workspace.id}`);
    }

    task.status = 'running';
    task.startedAt = task.startedAt ?? nowIso();

    const result = await runDurableExecution(
      task.durableExecutionId,
      input.identity ?? undefined,
    );

    const execution = result.execution;

    if (result.completed) {
      task.status = 'completed';
      task.completedAt = nowIso();
      task.output = execution.steps[execution.steps.length - 1]?.output;
    } else if (result.blocked) {
      task.status = 'blocked';
      task.error = execution.lastError ?? result.currentStep?.error;
    } else if (result.failed) {
      task.status = 'failed';
      task.completedAt = nowIso();
      task.error = execution.lastError ?? result.currentStep?.error;
    }

    return {
      workspace,
      task,
      execution,
      result,
    };
  }

  archiveWorkspace(workspaceId: string): PantavionWorkspaceRecord | null {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return null;
    }

    workspace.status = 'archived';
    workspace.updatedAt = nowIso();
    return workspace;
  }
}

export function createWorkspaceRuntime(
  config: Partial<PantavionWorkspaceRuntimeConfig> = {},
): PantavionWorkspaceRuntime {
  return new PantavionWorkspaceRuntime(config);
}

export const workspaceRuntime = createWorkspaceRuntime();

export function createWorkspace(
  input: PantavionWorkspaceCreateInput,
): PantavionWorkspaceRecord {
  return workspaceRuntime.createWorkspace(input);
}

export function startWorkspaceSession(input: {
  workspaceId: string;
  identity: PantavionResolvedIdentityPosture;
  metadata?: PantavionWorkspaceMetadata;
}): PantavionWorkspaceSessionRecord {
  return workspaceRuntime.startSession(input);
}

export function endWorkspaceSession(
  sessionId: string,
): PantavionWorkspaceSessionRecord | null {
  return workspaceRuntime.endSession(sessionId);
}

export function createWorkspaceTask(input: {
  workspaceId: string;
  task: PantavionWorkspaceTaskInput;
}): PantavionWorkspaceTaskRecord {
  return workspaceRuntime.createTask(input);
}

export async function runWorkspaceTask(input: {
  taskId: string;
  identity?: PantavionResolvedIdentityPosture | null;
}): Promise<PantavionWorkspaceTaskRunOutput> {
  return workspaceRuntime.runTask(input);
}

export function listWorkspaceTasks(
  workspaceId: string,
): PantavionWorkspaceTaskRecord[] {
  return workspaceRuntime.listTasksForWorkspace(workspaceId);
}
