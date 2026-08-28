export type PantavionFoundryAgentRole =
  | "orchestrator"
  | "sentinel"
  | "classifier"
  | "planner"
  | "researcher"
  | "builder"
  | "auditor"
  | "verifier"
  | "repairer"
  | "memory_guard";

export type PantavionFoundryAgentExecutionStatus =
  | "queued"
  | "planned"
  | "running"
  | "paused"
  | "succeeded"
  | "failed"
  | "cancelled";

export const PANTAVION_NERVOUS_SYSTEM_DEPENDENCY_BLOCKER =
  "nervous_system_dependency_wait_v1";

export interface PantavionFoundryAgentSnapshot {
  executionId: string;
  workOrderId: string;
  role: PantavionFoundryAgentRole;
  status: PantavionFoundryAgentExecutionStatus;
  idempotencyKey: string;
  internalCapabilities: string[];
  blockers: string[];
  nervousSystemBlocked: boolean;
  latestCheckpointId?: string;
}

export interface PantavionFoundryDependencyAction {
  executionId: string;
  action: "pause" | "release";
  waitingOn: string[];
  missingDependencies: string[];
}

export interface PantavionFoundryDependencyPlan {
  marker: "pantavion_foundry_dependency_plan_v1";
  issues: string[];
  readyQueuedTaskIds: string[];
  waitingTaskIds: string[];
  actions: PantavionFoundryDependencyAction[];
  missingDependencies: Record<string, string[]>;
}

const ROLE_DEPENDENCIES: Record<PantavionFoundryAgentRole, PantavionFoundryAgentRole[]> = {
  orchestrator: [],
  sentinel: [],
  classifier: ["orchestrator", "sentinel"],
  researcher: ["classifier"],
  planner: ["classifier", "researcher"],
  builder: ["planner", "sentinel"],
  auditor: ["planner", "sentinel"],
  verifier: ["auditor"],
  repairer: [],
  memory_guard: ["orchestrator"],
};

const ROLE_PRIORITY: Record<PantavionFoundryAgentRole, number> = {
  sentinel: 100,
  orchestrator: 95,
  classifier: 90,
  researcher: 80,
  planner: 75,
  builder: 60,
  auditor: 55,
  verifier: 50,
  memory_guard: 40,
  repairer: 35,
};

export function pantavionFoundryDependencyRoles(
  role: PantavionFoundryAgentRole,
): PantavionFoundryAgentRole[] {
  return [...ROLE_DEPENDENCIES[role]];
}

function expectedExecutionId(snapshot: PantavionFoundryAgentSnapshot) {
  return `${snapshot.workOrderId}:${snapshot.role}`;
}

function dependencyIds(snapshot: PantavionFoundryAgentSnapshot) {
  return pantavionFoundryDependencyRoles(snapshot.role).map(
    (role) => `${snapshot.workOrderId}:${role}`,
  );
}

function foreignBlockers(snapshot: PantavionFoundryAgentSnapshot) {
  return snapshot.blockers.filter(
    (blocker) => blocker !== PANTAVION_NERVOUS_SYSTEM_DEPENDENCY_BLOCKER,
  );
}

/**
 * Deterministic dependency gate for Pantavion-owned Foundry agents.
 *
 * The gate never executes agents and never claims durable work. It only decides
 * which durable agent records must wait and which nervous-system-paused records
 * may be released. The existing Foundry runtime remains responsible for the
 * atomic SQL claim immediately before execution.
 */
export function planPantavionFoundryDependencyGate(
  snapshots: PantavionFoundryAgentSnapshot[],
): PantavionFoundryDependencyPlan {
  const issues: string[] = [];
  const byId = new Map<string, PantavionFoundryAgentSnapshot>();

  for (const snapshot of snapshots) {
    if (!snapshot.executionId.trim()) {
      issues.push("execution_id_required");
      continue;
    }
    if (byId.has(snapshot.executionId)) {
      issues.push(`duplicate_execution:${snapshot.executionId}`);
      continue;
    }
    if (snapshot.executionId !== expectedExecutionId(snapshot)) {
      issues.push(`execution_identity_mismatch:${snapshot.executionId}`);
    }
    if (!snapshot.idempotencyKey.trim()) {
      issues.push(`idempotency_key_required:${snapshot.executionId}`);
    }
    byId.set(snapshot.executionId, snapshot);
  }

  const readyQueuedTaskIds: string[] = [];
  const waitingTaskIds: string[] = [];
  const actions: PantavionFoundryDependencyAction[] = [];
  const missingDependencies: Record<string, string[]> = {};

  for (const snapshot of snapshots) {
    const dependencies = dependencyIds(snapshot);
    const missing = dependencies.filter((dependencyId) => !byId.has(dependencyId));
    const waiting = dependencies.filter(
      (dependencyId) => byId.get(dependencyId)?.status !== "succeeded",
    );
    const hasForeignBlocker = foreignBlockers(snapshot).length > 0;

    if (missing.length > 0) missingDependencies[snapshot.executionId] = missing;

    if (waiting.length > 0) {
      if (snapshot.status === "queued" || snapshot.status === "planned") {
        waitingTaskIds.push(snapshot.executionId);
        if (!hasForeignBlocker && !snapshot.nervousSystemBlocked) {
          actions.push({
            executionId: snapshot.executionId,
            action: "pause",
            waitingOn: waiting,
            missingDependencies: missing,
          });
        }
      }
      continue;
    }

    if (snapshot.status === "queued" && !hasForeignBlocker) {
      readyQueuedTaskIds.push(snapshot.executionId);
    }

    if (
      snapshot.status === "paused" &&
      snapshot.nervousSystemBlocked &&
      snapshot.blockers.includes(PANTAVION_NERVOUS_SYSTEM_DEPENDENCY_BLOCKER) &&
      !hasForeignBlocker
    ) {
      actions.push({
        executionId: snapshot.executionId,
        action: "release",
        waitingOn: [],
        missingDependencies: [],
      });
    }
  }

  const priority = (executionId: string) => {
    const snapshot = byId.get(executionId);
    return snapshot ? ROLE_PRIORITY[snapshot.role] : 0;
  };
  const deterministic = (a: string, b: string) =>
    priority(b) - priority(a) || a.localeCompare(b);

  readyQueuedTaskIds.sort(deterministic);
  waitingTaskIds.sort(deterministic);
  actions.sort((a, b) => deterministic(a.executionId, b.executionId));

  return {
    marker: "pantavion_foundry_dependency_plan_v1",
    issues,
    readyQueuedTaskIds,
    waitingTaskIds,
    actions,
    missingDependencies,
  };
}
