export interface PantavionWorkspaceRuntimeContext {
  workspaceId: string;
  region?: string;
  features: string[];
  metadata: Record<string, unknown>;
}

export function createWorkspaceRuntimeContext(input: {
  workspaceId: string;
  region?: string;
  features?: string[];
  metadata?: Record<string, unknown>;
}): PantavionWorkspaceRuntimeContext {
  return {
    workspaceId: input.workspaceId,
    region: input.region,
    features: input.features ?? [],
    metadata: input.metadata ?? {},
  };
}

export interface PantavionWorkspaceRecord {
  id: string;
  workspaceKey: string;
  title: string;
  description?: string;
  visibility: string;
  ownerActorId: string;
  metadata: Record<string, unknown>;
}

export interface PantavionWorkspaceTaskRecord {
  id: string;
  workspaceId: string;
  task: {
    status: "pending" | "running" | "completed" | "failed" | "blocked";
    taskKey?: string;
    title?: string;
    capabilityKey?: string;
    operationKey?: string;
    payload?: unknown;
  };
}

export interface PantavionWorkspaceTaskRunOutput {
  task: {
    status: "pending" | "running" | "completed" | "failed" | "blocked";
  };
  execution: {
    status: "pending" | "running" | "completed" | "failed" | "blocked";
  };
}

export interface PantavionWorkspaceRuntime {
  createWorkspace(input: {
    workspaceKey: string;
    title: string;
    description?: string;
    visibility: string;
    ownerActorId: string;
    scopes?: unknown[];
    metadata?: Record<string, unknown>;
  }): PantavionWorkspaceRecord;
  createTask(input: {
    workspaceId: string;
    task: {
      taskKey?: string;
      title?: string;
      capabilityKey?: string;
      operationKey?: string;
      payload?: unknown;
      requestedScopes?: unknown[];
      requiredEntitlements?: string[];
      metadata?: Record<string, unknown>;
    };
  }): PantavionWorkspaceTaskRecord;
  runTask(input: {
    taskId: string;
    identity?: unknown;
  }): Promise<PantavionWorkspaceTaskRunOutput>;
}

const workspaceTasks = new Map<string, PantavionWorkspaceTaskRecord>();

function createRuntimeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const workspaceRuntime: PantavionWorkspaceRuntime = {
  createWorkspace(input) {
    return {
      id: createRuntimeId("workspace"),
      workspaceKey: input.workspaceKey,
      title: input.title,
      description: input.description,
      visibility: input.visibility,
      ownerActorId: input.ownerActorId,
      metadata: input.metadata ?? {},
    };
  },

  createTask(input) {
    const record: PantavionWorkspaceTaskRecord = {
      id: createRuntimeId("task"),
      workspaceId: input.workspaceId,
      task: {
        status: "pending",
        taskKey: input.task.taskKey,
        title: input.task.title,
        capabilityKey: input.task.capabilityKey,
        operationKey: input.task.operationKey,
        payload: input.task.payload,
      },
    };

    workspaceTasks.set(record.id, record);
    return record;
  },

  async runTask(input) {
    const task = workspaceTasks.get(input.taskId);
    if (task) task.task.status = "completed";

    return {
      task: {
        status: task?.task.status ?? "completed",
      },
      execution: {
        status: "completed",
      },
    };
  },
};