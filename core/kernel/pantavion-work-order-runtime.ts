import "server-only";

import {
  createPantavionAgentSecurityProfile,
  isPantavionProtectedAgentTarget,
  type PantavionAgentSecurityProfile,
} from "./agent-security-policy";
import {
  createPantavionOwnedAgentFleet,
  type PantavionOwnedAgentFleet,
} from "./pantavion-agent-factory";
import {
  createPantavionEcosystemCell,
  type PantavionEcosystemCell,
} from "./pantavion-ecosystem-cell-factory";
import {
  createPantavionAgentModuleDeliveryAssignment,
  createPantavionModuleDeliveryCells,
  type PantavionModuleDeliveryCell,
} from "./pantavion-module-delivery-factory";
import {
  createPantavionAgentWorkloadAssignment,
  createPantavionFoundryWorkloadPlan,
  type PantavionFoundryWorkloadPlan,
  type PantavionFoundryWorkloadRequest,
} from "./pantavion-foundry-workload-planner";
import {
  createPantavionAutonomousWorkOrder,
  type PantavionAutonomousBuilderCapability,
  type PantavionAutonomousBuildTarget,
  type PantavionAutonomousWorkOrder,
} from "./pantavion-autonomous-builder-kernel";
import {
  createPantavionImplementationPlan,
  createPantavionRealityProof,
  type PantavionImplementationPlan,
  type PantavionImplementationSurface,
  type PantavionRealityProof,
} from "./pantavion-implementation-engine";
import {
  appendCheckpoint,
  createExecutionRecord,
  type PantavionDurableExecutionRecord,
  type PantavionDurableExecutionStore,
  type PantavionExecutionStatus,
} from "@/core/runtime/durable-execution";
import { createSupabaseDurableExecutionStore } from "@/core/runtime/supabase-durable-execution-store";

export const PANTAVION_WORK_ORDER_TASK_NAME = "pantavion_founder_work_order_v1";
export const PANTAVION_OWNED_AGENT_TASK_NAME = "pantavion_owned_agent_v1";

export type PantavionFounderApprovalScope = "proposal_only" | "scoped_draft_patch";

export interface PantavionFounderWorkOrderSubmission {
  idempotencyKey: string;
  founderIntent: string;
  target: PantavionAutonomousBuildTarget;
  capabilities: PantavionAutonomousBuilderCapability[];
  targetFiles: string[];
  approvalScope: PantavionFounderApprovalScope;
  workload?: PantavionFoundryWorkloadRequest;
}

export interface PantavionPersistedWorkOrder {
  execution: PantavionDurableExecutionRecord;
  workOrder: PantavionAutonomousWorkOrder;
  implementationPlan: PantavionImplementationPlan;
  targetRealityProof: PantavionRealityProof;
  agentSecurity: PantavionAgentSecurityProfile;
  agentFleet: PantavionOwnedAgentFleet;
  ecosystemCell: PantavionEcosystemCell;
  moduleDeliveryCells: PantavionModuleDeliveryCell[];
  workloadPlan: PantavionFoundryWorkloadPlan;
  deduplicated: boolean;
}

function createWorkOrderId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `pwo_${crypto.randomUUID()}`;
  }

  return `pwo_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function implementationSurfacesFor(
  target: PantavionAutonomousBuildTarget,
): PantavionImplementationSurface[] {
  switch (target) {
    case "pantaai_center":
      return ["kernel", "ai", "api", "app_route"];
    case "translation":
      return ["translation", "api", "app_route"];
    case "safety_system":
      return ["sos", "api", "kernel"];
    case "water_infrastructure":
      return ["water", "api", "kernel"];
    case "sos_elder":
      return ["sos", "api", "app_route"];
    case "marketplace":
      return ["marketplace", "api", "app_route"];
    case "social_universe":
      return ["social", "api", "app_route"];
    case "admin_tool":
      return ["admin", "api", "app_route"];
    default:
      return ["kernel", "api"];
  }
}

function normalizeStringList(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function hasConfiguredPantavionInternalRuntime(): boolean {
  return Boolean(
    process.env.PANTAVION_INTERNAL_AGENT_RUNTIME_URL?.trim() &&
    process.env.PANTAVION_INTERNAL_AGENT_RUNTIME_TOKEN?.trim() &&
    process.env.PANTAVION_INTERNAL_AGENT_RUNTIME_OWNERSHIP === "pantavion_owned",
  );
}

function executionStatusForAgent(state: PantavionOwnedAgentFleet["agents"][number]["state"]): PantavionExecutionStatus {
  if (state === "ready_for_internal_runtime") return "queued";
  if (state === "blocked") return "paused";
  return "planned";
}

async function materializePantavionOwnedAgentFleet(input: {
  store: PantavionDurableExecutionStore;
  parentExecution: PantavionDurableExecutionRecord;
  workOrder: PantavionAutonomousWorkOrder;
  agentFleet: PantavionOwnedAgentFleet;
  agentSecurity: PantavionAgentSecurityProfile;
  ecosystemCell: PantavionEcosystemCell;
  moduleDeliveryCells: PantavionModuleDeliveryCell[];
  workloadPlan: PantavionFoundryWorkloadPlan;
}): Promise<number> {
  let materializedCount = 0;

  for (const agent of input.agentFleet.agents) {
    const idempotencyKey = `${input.parentExecution.idempotencyKey}:agent:${agent.role}`;
    const existing = await input.store.findByIdempotencyKey(idempotencyKey);

    if (existing) {
      if (existing.taskName !== PANTAVION_OWNED_AGENT_TASK_NAME) {
        throw new Error("agent_idempotency_key_used_by_another_task");
      }
      materializedCount += 1;
      continue;
    }

    let execution = createExecutionRecord(
      agent.id,
      idempotencyKey,
      PANTAVION_OWNED_AGENT_TASK_NAME,
      {
        marker: "pantavion_owned_agent_execution_v1",
        parentWorkOrderId: input.parentExecution.executionId,
        founderIntent: input.workOrder.founderIntent,
        agent,
        agentSecurity: {
          marker: input.agentSecurity.marker,
          mode: input.agentSecurity.mode,
          allowedAuthorities: input.agentSecurity.allowedAuthorities,
          stopConditions: input.agentSecurity.stopConditions,
        },
        ecosystemCell: {
          marker: input.ecosystemCell.marker,
          target: input.ecosystemCell.target,
          requiredServiceIds: input.ecosystemCell.services
            .filter((service) => service.need === "required")
            .map((service) => service.id),
        },
        workload: createPantavionAgentWorkloadAssignment({
          plan: input.workloadPlan,
          role: agent.role,
        }),
        moduleDelivery: createPantavionAgentModuleDeliveryAssignment({
          workOrderId: input.workOrder.id,
          role: agent.role,
          cells: input.moduleDeliveryCells,
        }),
      },
      agent.maxAttempts,
    );
    execution = appendCheckpoint(
      {
        ...execution,
        status: executionStatusForAgent(agent.state),
        updatedAt: new Date().toISOString(),
      },
      "pantavion_agent_materialized",
      {
        marker: "pantavion_owned_agent_materialized_v1",
        role: agent.role,
        state: agent.state,
        ownership: "pantavion_owned",
        thirdPartyWorkerAllowed: false,
        internalRuntime: input.agentFleet.modelRuntime,
        workloadKind: input.workloadPlan.kind,
        workloadUnits: input.workloadPlan.unitCount,
        workloadBatchCount: input.workloadPlan.partitionContract.batchCount,
        moduleDeliveryCount: input.moduleDeliveryCells.length,
      },
    );
    await input.store.put(execution);
    materializedCount += 1;
  }

  return materializedCount;
}

async function ensurePantavionOwnedAgentFleet(input: {
  store: PantavionDurableExecutionStore;
  parentExecution: PantavionDurableExecutionRecord;
  workOrder: PantavionAutonomousWorkOrder;
  agentFleet: PantavionOwnedAgentFleet;
  agentSecurity: PantavionAgentSecurityProfile;
  ecosystemCell: PantavionEcosystemCell;
  moduleDeliveryCells: PantavionModuleDeliveryCell[];
  workloadPlan: PantavionFoundryWorkloadPlan;
}): Promise<PantavionDurableExecutionRecord> {
  const materializedCount = await materializePantavionOwnedAgentFleet(input);
  const alreadyRecorded = input.parentExecution.checkpoints.some(
    (checkpoint) => checkpoint.label === "pantavion_agent_fleet_materialized",
  );

  if (alreadyRecorded) return input.parentExecution;

  const execution = appendCheckpoint(
    input.parentExecution,
    "pantavion_agent_fleet_materialized",
    {
      marker: "pantavion_agent_fleet_materialized_v1",
      ownership: "pantavion_owned",
      agentCount: materializedCount,
      modelRuntime: input.agentFleet.modelRuntime,
      externalWorkerDependency: false,
      workloadMarker: input.workloadPlan.marker,
      workloadKind: input.workloadPlan.kind,
      workloadUnits: input.workloadPlan.unitCount,
      workloadBatchCount: input.workloadPlan.partitionContract.batchCount,
      moduleDeliveryCount: input.moduleDeliveryCells.length,
    },
  );
  await input.store.put(execution);
  return execution;
}

function extractPersistedWorkOrder(
  execution: PantavionDurableExecutionRecord,
): PantavionPersistedWorkOrder | null {
  if (!execution.input || typeof execution.input !== "object" || Array.isArray(execution.input)) {
    return null;
  }

  const input = execution.input as Partial<Omit<PantavionPersistedWorkOrder, "execution" | "deduplicated">>;

  if (
    !input.workOrder ||
    !input.implementationPlan ||
    !input.targetRealityProof ||
    !input.agentSecurity ||
    !input.agentFleet ||
    !input.ecosystemCell
  ) {
    return null;
  }

  const workOrder = input.workOrder as PantavionAutonomousWorkOrder;
  const workloadPlan = input.workloadPlan as PantavionFoundryWorkloadPlan | undefined;
  const moduleDeliveryCells = input.moduleDeliveryCells as PantavionModuleDeliveryCell[] | undefined;

  return {
    execution,
    workOrder,
    implementationPlan: input.implementationPlan as PantavionImplementationPlan,
    targetRealityProof: input.targetRealityProof as PantavionRealityProof,
    agentSecurity: input.agentSecurity as PantavionAgentSecurityProfile,
    agentFleet: input.agentFleet as PantavionOwnedAgentFleet,
    ecosystemCell: input.ecosystemCell as PantavionEcosystemCell,
    moduleDeliveryCells: moduleDeliveryCells ?? createPantavionModuleDeliveryCells({
      workOrderId: workOrder.id,
      target: workOrder.target,
    }),
    workloadPlan: workloadPlan ?? createPantavionFoundryWorkloadPlan({ workOrderId: workOrder.id }),
    deduplicated: true,
  };
}

/**
 * Persist a founder-submitted work order.  This is intentionally an intake
 * and control-plane operation, not an unchecked code executor: a later
 * Pantavion-owned runtime can only move it forward under the recorded
 * security profile, bounded workload plan, and audit gates.
 */
export async function persistPantavionFounderWorkOrder(
  submission: PantavionFounderWorkOrderSubmission,
): Promise<PantavionPersistedWorkOrder> {
  const store = createSupabaseDurableExecutionStore();
  const existing = await store.findByIdempotencyKey(submission.idempotencyKey);

  if (existing) {
    if (existing.taskName !== PANTAVION_WORK_ORDER_TASK_NAME) {
      throw new Error("idempotency_key_used_by_another_task");
    }

    const persisted = extractPersistedWorkOrder(existing);
    if (!persisted) throw new Error("idempotency_record_is_not_a_pantavion_work_order");
    const execution = await ensurePantavionOwnedAgentFleet({
      store,
      parentExecution: persisted.execution,
      workOrder: persisted.workOrder,
      agentFleet: persisted.agentFleet,
      agentSecurity: persisted.agentSecurity,
      ecosystemCell: persisted.ecosystemCell,
      moduleDeliveryCells: persisted.moduleDeliveryCells,
      workloadPlan: persisted.workloadPlan,
    });

    return {
      ...persisted,
      execution,
      deduplicated: true,
    };
  }

  const id = createWorkOrderId();
  const targetFiles = normalizeStringList(submission.targetFiles);
  const protectedTarget = isPantavionProtectedAgentTarget(submission.target);
  const requestedScopedDraft = submission.approvalScope === "scoped_draft_patch";
  const founderApprovedScopedDraft = requestedScopedDraft && !protectedTarget;

  const agentSecurity = createPantavionAgentSecurityProfile({
    workOrderId: id,
    target: submission.target,
    targetFiles,
    requestedScopedDraft,
    founderApprovedScopedDraft,
  });
  const scopedDraftAuthorized = agentSecurity.mode === "isolated_branch_draft";
  const agentFleet = createPantavionOwnedAgentFleet({
    workOrderId: id,
    target: submission.target,
    security: agentSecurity,
    internalRuntimeConfigured: hasConfiguredPantavionInternalRuntime(),
  });
  const ecosystemCell = createPantavionEcosystemCell({
    workOrderId: id,
    target: submission.target,
  });
  const moduleDeliveryCells = createPantavionModuleDeliveryCells({
    workOrderId: id,
    target: submission.target,
  });
  const workloadPlan = createPantavionFoundryWorkloadPlan({
    workOrderId: id,
    workload: submission.workload,
  });

  const workOrder = createPantavionAutonomousWorkOrder({
    id,
    founderIntent: submission.founderIntent,
    target: submission.target,
    capabilities: normalizeStringList(submission.capabilities) as PantavionAutonomousBuilderCapability[],
    targetFiles,
    // Work-order registration does not fabricate repo/audit/build evidence.
    repoTruthChecked: false,
    allowFileWrite: scopedDraftAuthorized,
    allowExternalAppCreation: false,
    allowProductionDeploy: false,
    hasFounderApproval: scopedDraftAuthorized,
    hasAudit: false,
    hasBuildVerification: false,
    hasTypeScriptVerification: false,
    touchesSensitiveData: protectedTarget,
    touchesPaymentsAuthSafetyOrInfrastructure: protectedTarget,
  });

  const implementationPlan = createPantavionImplementationPlan({
    id: `${id}:implementation`,
    title: `Pantavion work order: ${submission.target}`,
    founderIntent: submission.founderIntent,
    targetFiles,
    surfaces: implementationSurfacesFor(submission.target),
    requiresRuntimeBehavior: true,
    requiresFounderApproval: protectedTarget || requestedScopedDraft,
    touchesSensitiveData: protectedTarget,
    touchesProductionAccess: protectedTarget,
    visibleUserInterface: false,
    hasBackendOrRoute: true,
    hasAudit: false,
    hasBuildVerification: false,
  });

  const targetRealityProof = createPantavionRealityProof({
    id: `${id}:target-reality-proof`,
    visibleSurface: false,
    hasUserAction: false,
    hasRouteOrApi: false,
    hasRuntimeFunction: false,
    hasAudit: false,
    hasBuildVerification: false,
    hasTypeScriptVerification: false,
    hasProductionVerification: false,
  });

  const input = {
    marker: "pantavion_persisted_work_order_v1",
    workOrder,
    implementationPlan,
    targetRealityProof,
    agentSecurity,
    agentFleet,
    ecosystemCell,
    moduleDeliveryCells,
    workloadPlan,
  };

  let execution = createExecutionRecord(
    id,
    submission.idempotencyKey,
    PANTAVION_WORK_ORDER_TASK_NAME,
    input,
    1,
  );
  execution = appendCheckpoint(
    {
      ...execution,
      status: "planned",
      updatedAt: new Date().toISOString(),
    },
    "founder_work_order_registered",
    {
      marker: "pantavion_work_order_checkpoint_v1",
      workOrderMode: workOrder.mode,
      agentMode: agentSecurity.mode,
      agentFleetMarker: agentFleet.marker,
      pantavionOwnedAgentCount: agentFleet.agents.length,
      ecosystemCellMarker: ecosystemCell.marker,
      ecosystemServiceCount: ecosystemCell.services.length,
      moduleDeliveryCellCount: moduleDeliveryCells.length,
      externalWorkerDependency: false,
      workloadMarker: workloadPlan.marker,
      workloadKind: workloadPlan.kind,
      workloadUnits: workloadPlan.unitCount,
      workloadBatchCount: workloadPlan.partitionContract.batchCount,
      internalWorkerTopology: agentFleet.internalWorkerTopology,
      founderApprovalRequired: workOrder.founderApprovalRequired,
      productionDeployAllowed: false,
      externalNetworkEgress: agentSecurity.dataBoundary.externalNetworkEgress,
    },
  );

  await store.put(execution);

  execution = await ensurePantavionOwnedAgentFleet({
    store,
    parentExecution: execution,
    workOrder,
    agentFleet,
    agentSecurity,
    ecosystemCell,
    moduleDeliveryCells,
    workloadPlan,
  });

  return {
    execution,
    workOrder,
    implementationPlan,
    targetRealityProof,
    agentSecurity,
    agentFleet,
    ecosystemCell,
    moduleDeliveryCells,
    workloadPlan,
    deduplicated: false,
  };
}

export async function listPantavionFounderWorkOrders(limit = 30) {
  const store = createSupabaseDurableExecutionStore();
  const executions = await store.list(Math.max(1, Math.min(limit, 100)));

  return executions
    .filter((execution) => execution.taskName === PANTAVION_WORK_ORDER_TASK_NAME)
    .map(extractPersistedWorkOrder)
    .filter((value): value is PantavionPersistedWorkOrder => Boolean(value));
}

export async function cancelPantavionFounderWorkOrder(
  executionId: string,
  reason: string,
): Promise<PantavionPersistedWorkOrder | null> {
  const store = createSupabaseDurableExecutionStore();
  const existing = await store.get(executionId);

  if (!existing) return null;
  if (existing.taskName !== PANTAVION_WORK_ORDER_TASK_NAME) {
    throw new Error("execution_is_not_a_pantavion_work_order");
  }

  const terminal =
    existing.status === "succeeded" ||
    existing.status === "failed" ||
    existing.status === "cancelled";
  let execution = terminal
    ? existing
    : appendCheckpoint(
        {
          ...existing,
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        },
        "founder_stop",
        {
          marker: "pantavion_work_order_stop_v1",
          reason: reason.trim().slice(0, 500) || "founder_requested_stop",
        },
      );

  if (execution !== existing) await store.put(execution);

  let persisted = extractPersistedWorkOrder(execution);
  if (!persisted) throw new Error("execution_is_not_a_valid_pantavion_work_order");

  if (execution.status === "cancelled") {
    let stoppedAgents = 0;

    for (const agent of persisted.agentFleet.agents) {
      const child = await store.get(agent.id);
      const childTerminal =
        child?.status === "succeeded" ||
        child?.status === "failed" ||
        child?.status === "cancelled";
      if (!child || childTerminal) continue;

      const stopped = appendCheckpoint(
        {
          ...child,
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        },
        "parent_founder_stop",
        {
          marker: "pantavion_owned_agent_parent_stop_v1",
          parentWorkOrderId: execution.executionId,
        },
      );
      await store.put(stopped);
      stoppedAgents += 1;
    }

    const alreadyRecorded = execution.checkpoints.some(
      (checkpoint) => checkpoint.label === "pantavion_agent_fleet_stop_propagated",
    );
    if (!alreadyRecorded) {
      execution = appendCheckpoint(
        execution,
        "pantavion_agent_fleet_stop_propagated",
        {
          marker: "pantavion_agent_fleet_stop_propagated_v1",
          stoppedAgents,
        },
      );
      await store.put(execution);
      persisted = extractPersistedWorkOrder(execution);
      if (!persisted) throw new Error("execution_is_not_a_valid_pantavion_work_order");
    }
  }

  return persisted;
}
