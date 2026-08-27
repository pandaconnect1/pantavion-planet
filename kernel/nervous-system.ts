export type KernelTaskStatus =
  | "queued"
  | "leased"
  | "running"
  | "blocked"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface KernelTaskNode {
  taskId: string;
  dependencies: string[];
  requiredCapabilities: string[];
  priority: number;
  status: KernelTaskStatus;
  idempotencyKey: string;
  ownerNodeId?: string;
  checkpointId?: string;
  leaseExpiresAt?: string;
}

export interface KernelWorkerSnapshot {
  id: string;
  capabilities: string[];
  healthy: boolean;
  capacity: number;
  activeTasks: number;
  priority: number;
}

export interface KernelDispatchAssignment {
  taskId: string;
  workerId: string;
  idempotencyKey: string;
  checkpointId?: string;
  leaseExpiresAt: string;
}

export interface KernelDispatchPlan {
  assignments: KernelDispatchAssignment[];
  unassignedTaskIds: string[];
}

const byTaskPriority = (a: KernelTaskNode, b: KernelTaskNode) =>
  b.priority - a.priority || a.taskId.localeCompare(b.taskId);

const hasCapabilities = (worker: KernelWorkerSnapshot, required: string[]) =>
  required.every((capability) => worker.capabilities.includes(capability));

export const validateKernelTaskGraph = (tasks: KernelTaskNode[]): string[] => {
  const issues: string[] = [];
  const taskIds = new Set<string>();

  for (const task of tasks) {
    if (!task.taskId.trim()) issues.push("task_id_required");
    if (taskIds.has(task.taskId)) issues.push(`duplicate_task:${task.taskId}`);
    taskIds.add(task.taskId);
    if (!task.idempotencyKey.trim()) issues.push(`idempotency_key_required:${task.taskId}`);
    if (task.dependencies.includes(task.taskId)) issues.push(`self_dependency:${task.taskId}`);
  }

  for (const task of tasks) {
    for (const dependency of task.dependencies) {
      if (!taskIds.has(dependency)) issues.push(`unknown_dependency:${task.taskId}:${dependency}`);
    }
  }

  const byId = new Map(tasks.map((task) => [task.taskId, task]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycleReported = new Set<string>();

  const visit = (taskId: string, path: string[]) => {
    if (visiting.has(taskId)) {
      const start = path.indexOf(taskId);
      const cycle = [...path.slice(start), taskId].join("->");
      if (!cycleReported.has(cycle)) {
        cycleReported.add(cycle);
        issues.push(`dependency_cycle:${cycle}`);
      }
      return;
    }
    if (visited.has(taskId)) return;

    const task = byId.get(taskId);
    if (!task) return;

    visiting.add(taskId);
    for (const dependency of task.dependencies) {
      if (byId.has(dependency)) visit(dependency, [...path, taskId]);
    }
    visiting.delete(taskId);
    visited.add(taskId);
  };

  for (const task of tasks) visit(task.taskId, []);
  return issues;
};

export const selectReadyKernelTasks = (
  tasks: KernelTaskNode[],
  maxTasks = Number.POSITIVE_INFINITY,
): KernelTaskNode[] => {
  const byId = new Map(tasks.map((task) => [task.taskId, task]));

  return tasks
    .filter((task) => task.status === "queued")
    .filter((task) =>
      task.dependencies.every((dependency) => byId.get(dependency)?.status === "succeeded")
    )
    .sort(byTaskPriority)
    .slice(0, Math.max(0, maxTasks));
};

/**
 * Builds a deterministic parallel dispatch plan.
 *
 * The planner never executes work itself. It only assigns dependency-ready
 * tasks to healthy workers that have capacity and the required capabilities.
 * The durable runtime/control plane remains responsible for atomically
 * claiming the lease before execution starts.
 */
export const planParallelKernelDispatch = (
  tasks: KernelTaskNode[],
  workers: KernelWorkerSnapshot[],
  leaseDurationMs: number,
  nowMs = Date.now(),
): KernelDispatchPlan => {
  if (leaseDurationMs <= 0) throw new Error("leaseDurationMs must be positive");

  const graphIssues = validateKernelTaskGraph(tasks);
  if (graphIssues.length > 0) {
    throw new Error(`invalid_task_graph:${graphIssues.join(",")}`);
  }

  const assignedCount = new Map<string, number>();
  const assignments: KernelDispatchAssignment[] = [];
  const unassignedTaskIds: string[] = [];

  const ready = selectReadyKernelTasks(tasks);
  for (const task of ready) {
    const eligible = workers
      .filter((worker) => worker.healthy)
      .filter((worker) => worker.capacity > 0)
      .filter((worker) => hasCapabilities(worker, task.requiredCapabilities))
      .filter((worker) => {
        const additional = assignedCount.get(worker.id) ?? 0;
        return worker.activeTasks + additional < worker.capacity;
      })
      .sort((a, b) => {
        const aLoad = a.activeTasks + (assignedCount.get(a.id) ?? 0);
        const bLoad = b.activeTasks + (assignedCount.get(b.id) ?? 0);
        if (aLoad !== bLoad) return aLoad - bLoad;
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.id.localeCompare(b.id);
      });

    const worker = eligible[0];
    if (!worker) {
      unassignedTaskIds.push(task.taskId);
      continue;
    }

    assignedCount.set(worker.id, (assignedCount.get(worker.id) ?? 0) + 1);
    assignments.push({
      taskId: task.taskId,
      workerId: worker.id,
      idempotencyKey: task.idempotencyKey,
      checkpointId: task.checkpointId,
      leaseExpiresAt: new Date(nowMs + leaseDurationMs).toISOString(),
    });
  }

  return { assignments, unassignedTaskIds };
};
