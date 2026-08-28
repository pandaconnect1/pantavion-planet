import "server-only";

import {
  appendCheckpoint,
  type PantavionDurableExecutionRecord,
} from "@/core/runtime/durable-execution";
import { PantavionSupabaseDurableExecutionStore } from "@/core/runtime/supabase-durable-execution-store";
import {
  runPantavionFoundryTick,
  type PantavionFoundryTickReport,
} from "./pantavion-foundry-runtime";
import { PANTAVION_OWNED_AGENT_TASK_NAME } from "./pantavion-work-order-runtime";
import {
  PANTAVION_NERVOUS_SYSTEM_DEPENDENCY_BLOCKER,
  planPantavionFoundryDependencyGate,
  type PantavionFoundryAgentRole,
  type PantavionFoundryAgentSnapshot,
  type PantavionFoundryDependencyAction,
} from "@/kernel/foundry-nervous-system";

const WAIT_CHECKPOINT = "pantavion_nervous_system_dependency_wait";
const RELEASE_CHECKPOINT = "pantavion_nervous_system_dependency_released";
const MAX_SCAN_RECORDS = 500;

const OWNED_AGENT_ROLES = new Set<PantavionFoundryAgentRole>([
  "orchestrator",
  "sentinel",
  "classifier",
  "planner",
  "researcher",
  "builder",
  "auditor",
  "verifier",
  "repairer",
  "memory_guard",
]);

type ParsedAgentRecord = {
  record: PantavionDurableExecutionRecord;
  root: Record<string, unknown>;
  agent: Record<string, unknown>;
  agentState: "defined" | "ready_for_internal_runtime" | "blocked";
  snapshot: PantavionFoundryAgentSnapshot;
};

export interface PantavionFoundryNervousSystemTickReport {
  marker: "pantavion_foundry_nervous_system_tick_v1";
  status: "ran" | "blocked" | "degraded";
  dependencyGate: {
    status: "operational" | "blocked" | "degraded";
    scannedAgentRecords: number;
    validAgentRecords: number;
    invalidAgentRecords: number;
    readyQueuedAgents: number;
    waitingAgents: number;
    actionsPlanned: number;
    pausedAgents: number;
    releasedAgents: number;
    missingDependencyAgents: number;
    issues: string[];
  };
  executionBoundary: {
    scheduler: "secure_scheduled_worker";
    durableStore: "supabase";
    executionClaim: "atomic_sql_claim_in_existing_foundry";
    dependencyGateRunsBeforeClaim: true;
    externalWorkerAllowed: false;
    productionDeployAllowed: false;
    durableWorkerLeaseReassignment: "not_yet_enforced";
  };
  foundry: PantavionFoundryTickReport | null;
  checkedAt: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asStringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? (value as string[])
    : null;
}

function nervousSystemBlocked(record: PantavionDurableExecutionRecord): boolean {
  let blocked = false;
  for (const checkpoint of record.checkpoints) {
    if (checkpoint.label === WAIT_CHECKPOINT) blocked = true;
    if (checkpoint.label === RELEASE_CHECKPOINT) blocked = false;
  }
  return blocked;
}

function parseAgentRecord(record: PantavionDurableExecutionRecord): ParsedAgentRecord | null {
  if (record.taskName !== PANTAVION_OWNED_AGENT_TASK_NAME) return null;

  const root = asRecord(record.input);
  const agent = asRecord(root?.agent);
  const role = typeof agent?.role === "string" ? agent.role : "";
  const workOrderId = typeof agent?.workOrderId === "string" ? agent.workOrderId : "";
  const agentId = typeof agent?.id === "string" ? agent.id : "";
  const capabilities = asStringList(agent?.internalCapabilities);
  const blockers = asStringList(agent?.blockers);
  const agentState = agent?.state;

  if (
    root?.marker !== "pantavion_owned_agent_execution_v1" ||
    typeof root.parentWorkOrderId !== "string" ||
    !OWNED_AGENT_ROLES.has(role as PantavionFoundryAgentRole) ||
    !workOrderId ||
    !agentId ||
    agentId !== `${workOrderId}:${role}` ||
    !capabilities ||
    !blockers ||
    (agentState !== "defined" &&
      agentState !== "ready_for_internal_runtime" &&
      agentState !== "blocked")
  ) {
    return null;
  }

  return {
    record,
    root,
    agent,
    agentState,
    snapshot: {
      executionId: record.executionId,
      workOrderId,
      role: role as PantavionFoundryAgentRole,
      status: record.status,
      idempotencyKey: record.idempotencyKey,
      internalCapabilities: capabilities,
      blockers,
      nervousSystemBlocked: nervousSystemBlocked(record),
      latestCheckpointId: record.checkpoints.at(-1)?.id,
    },
  };
}

function foreignBlockers(blockers: string[]) {
  return blockers.filter(
    (blocker) => blocker !== PANTAVION_NERVOUS_SYSTEM_DEPENDENCY_BLOCKER,
  );
}

async function applyDependencyAction(input: {
  store: PantavionSupabaseDurableExecutionStore;
  action: PantavionFoundryDependencyAction;
}): Promise<"paused" | "released" | "skipped"> {
  const current = await input.store.get(input.action.executionId);
  if (!current || current.taskName !== PANTAVION_OWNED_AGENT_TASK_NAME) return "skipped";

  const parsed = parseAgentRecord(current);
  if (!parsed) return "skipped";

  if (input.action.action === "pause") {
    if (current.status !== "queued" && current.status !== "planned") return "skipped";
    if (parsed.snapshot.nervousSystemBlocked) return "skipped";
    if (foreignBlockers(parsed.snapshot.blockers).length > 0) return "skipped";
    if (parsed.agentState === "blocked" && parsed.snapshot.blockers.length > 0) return "skipped";

    const blockers = Array.from(
      new Set([
        ...parsed.snapshot.blockers,
        PANTAVION_NERVOUS_SYSTEM_DEPENDENCY_BLOCKER,
      ]),
    );
    const paused = appendCheckpoint(
      {
        ...current,
        status: "paused",
        updatedAt: new Date().toISOString(),
        input: {
          ...parsed.root,
          agent: {
            ...parsed.agent,
            state: "blocked",
            blockers,
          },
        },
      },
      WAIT_CHECKPOINT,
      {
        marker: "pantavion_nervous_system_dependency_wait_v1",
        waitingOn: input.action.waitingOn,
        missingDependencies: input.action.missingDependencies,
        externalWorkerAllowed: false,
        productionDeployAllowed: false,
      },
    );
    await input.store.put(paused);
    return "paused";
  }

  if (current.status !== "paused") return "skipped";
  if (!parsed.snapshot.nervousSystemBlocked) return "skipped";
  if (!parsed.snapshot.blockers.includes(PANTAVION_NERVOUS_SYSTEM_DEPENDENCY_BLOCKER)) {
    return "skipped";
  }
  if (foreignBlockers(parsed.snapshot.blockers).length > 0) return "skipped";

  const released = appendCheckpoint(
    {
      ...current,
      status: "planned",
      lastError: undefined,
      updatedAt: new Date().toISOString(),
      input: {
        ...parsed.root,
        agent: {
          ...parsed.agent,
          state: "defined",
          blockers: parsed.snapshot.blockers.filter(
            (blocker) => blocker !== PANTAVION_NERVOUS_SYSTEM_DEPENDENCY_BLOCKER,
          ),
        },
      },
    },
    RELEASE_CHECKPOINT,
    {
      marker: "pantavion_nervous_system_dependency_released_v1",
      externalWorkerAllowed: false,
      productionDeployAllowed: false,
    },
  );
  await input.store.put(released);
  return "released";
}

/**
 * Runs a durable dependency reconciliation before the existing Foundry tick.
 *
 * This adapter deliberately does not replace the mature Foundry executor. The
 * existing executor still owns runtime input validation, blocker repair,
 * retries, evidence parsing, and the atomic SQL claim. This layer only prevents
 * dependency-blocked logical agents from becoming eligible for that claim.
 */
export async function runPantavionNervousSystemFoundryTick(): Promise<PantavionFoundryNervousSystemTickReport> {
  const checkedAt = new Date().toISOString();
  const store = new PantavionSupabaseDurableExecutionStore();

  let records: PantavionDurableExecutionRecord[];
  try {
    records = await store.list(MAX_SCAN_RECORDS);
  } catch {
    return {
      marker: "pantavion_foundry_nervous_system_tick_v1",
      status: "blocked",
      dependencyGate: {
        status: "blocked",
        scannedAgentRecords: 0,
        validAgentRecords: 0,
        invalidAgentRecords: 0,
        readyQueuedAgents: 0,
        waitingAgents: 0,
        actionsPlanned: 0,
        pausedAgents: 0,
        releasedAgents: 0,
        missingDependencyAgents: 0,
        issues: ["durable_execution_store_unavailable"],
      },
      executionBoundary: {
        scheduler: "secure_scheduled_worker",
        durableStore: "supabase",
        executionClaim: "atomic_sql_claim_in_existing_foundry",
        dependencyGateRunsBeforeClaim: true,
        externalWorkerAllowed: false,
        productionDeployAllowed: false,
        durableWorkerLeaseReassignment: "not_yet_enforced",
      },
      foundry: null,
      checkedAt,
    };
  }

  const agentRecords = records.filter(
    (record) => record.taskName === PANTAVION_OWNED_AGENT_TASK_NAME,
  );
  const parsed = agentRecords.map(parseAgentRecord);
  const snapshots = parsed
    .filter((value): value is ParsedAgentRecord => Boolean(value))
    .map((value) => value.snapshot);
  const invalidAgentRecords = parsed.length - snapshots.length;
  const dependencyPlan = planPantavionFoundryDependencyGate(snapshots);

  if (dependencyPlan.issues.length > 0) {
    return {
      marker: "pantavion_foundry_nervous_system_tick_v1",
      status: "blocked",
      dependencyGate: {
        status: "blocked",
        scannedAgentRecords: agentRecords.length,
        validAgentRecords: snapshots.length,
        invalidAgentRecords,
        readyQueuedAgents: dependencyPlan.readyQueuedTaskIds.length,
        waitingAgents: dependencyPlan.waitingTaskIds.length,
        actionsPlanned: dependencyPlan.actions.length,
        pausedAgents: 0,
        releasedAgents: 0,
        missingDependencyAgents: Object.keys(dependencyPlan.missingDependencies).length,
        issues: dependencyPlan.issues,
      },
      executionBoundary: {
        scheduler: "secure_scheduled_worker",
        durableStore: "supabase",
        executionClaim: "atomic_sql_claim_in_existing_foundry",
        dependencyGateRunsBeforeClaim: true,
        externalWorkerAllowed: false,
        productionDeployAllowed: false,
        durableWorkerLeaseReassignment: "not_yet_enforced",
      },
      foundry: null,
      checkedAt,
    };
  }

  let pausedAgents = 0;
  let releasedAgents = 0;
  const applicationIssues: string[] = [];

  for (const action of dependencyPlan.actions) {
    try {
      const outcome = await applyDependencyAction({ store, action });
      if (outcome === "paused") pausedAgents += 1;
      if (outcome === "released") releasedAgents += 1;
    } catch {
      applicationIssues.push(`dependency_action_failed:${action.executionId}`);
    }
  }

  if (applicationIssues.length > 0) {
    return {
      marker: "pantavion_foundry_nervous_system_tick_v1",
      status: "degraded",
      dependencyGate: {
        status: "degraded",
        scannedAgentRecords: agentRecords.length,
        validAgentRecords: snapshots.length,
        invalidAgentRecords,
        readyQueuedAgents: dependencyPlan.readyQueuedTaskIds.length,
        waitingAgents: dependencyPlan.waitingTaskIds.length,
        actionsPlanned: dependencyPlan.actions.length,
        pausedAgents,
        releasedAgents,
        missingDependencyAgents: Object.keys(dependencyPlan.missingDependencies).length,
        issues: applicationIssues,
      },
      executionBoundary: {
        scheduler: "secure_scheduled_worker",
        durableStore: "supabase",
        executionClaim: "atomic_sql_claim_in_existing_foundry",
        dependencyGateRunsBeforeClaim: true,
        externalWorkerAllowed: false,
        productionDeployAllowed: false,
        durableWorkerLeaseReassignment: "not_yet_enforced",
      },
      foundry: null,
      checkedAt,
    };
  }

  const foundry = await runPantavionFoundryTick();
  const degraded = invalidAgentRecords > 0 || foundry.status === "degraded";

  return {
    marker: "pantavion_foundry_nervous_system_tick_v1",
    status: foundry.status === "blocked" ? "blocked" : degraded ? "degraded" : "ran",
    dependencyGate: {
      status: invalidAgentRecords > 0 ? "degraded" : "operational",
      scannedAgentRecords: agentRecords.length,
      validAgentRecords: snapshots.length,
      invalidAgentRecords,
      readyQueuedAgents: dependencyPlan.readyQueuedTaskIds.length,
      waitingAgents: dependencyPlan.waitingTaskIds.length,
      actionsPlanned: dependencyPlan.actions.length,
      pausedAgents,
      releasedAgents,
      missingDependencyAgents: Object.keys(dependencyPlan.missingDependencies).length,
      issues: invalidAgentRecords > 0 ? ["invalid_agent_records_preserved_for_existing_foundry_repair"] : [],
    },
    executionBoundary: {
      scheduler: "secure_scheduled_worker",
      durableStore: "supabase",
      executionClaim: "atomic_sql_claim_in_existing_foundry",
      dependencyGateRunsBeforeClaim: true,
      externalWorkerAllowed: false,
      productionDeployAllowed: false,
      durableWorkerLeaseReassignment: "not_yet_enforced",
    },
    foundry,
    checkedAt,
  };
}
