import type { PantavionOwnedAgentRole } from "./pantavion-agent-factory";

export type PantavionFoundryWorkloadKind = "single_work_order" | "recovery_excavation";

export type PantavionFoundryWorkloadStageId =
  | "inventory"
  | "classification"
  | "canonicalization"
  | "evidence_and_dependencies"
  | "implementation_planning"
  | "scoped_build"
  | "audit_and_verification"
  | "repair_queue";

export interface PantavionFoundryWorkloadRequest {
  kind: PantavionFoundryWorkloadKind;
  unitCount?: number;
  batchSize?: number;
  intakeReference?: string;
}

export interface PantavionFoundryWorkloadStage {
  id: PantavionFoundryWorkloadStageId;
  ownerRoles: PantavionOwnedAgentRole[];
  purpose: string;
  completionEvidence: string[];
}

export interface PantavionFoundryInternalLane {
  id: string;
  ownerRole: PantavionOwnedAgentRole;
  maximumConcurrentPartitions: number;
  scope: string;
}

export interface PantavionFoundryPartitionContract {
  idFormat: "{workOrderId}:batch:{zeroPaddedOrdinal}";
  startsAtUnit: 1;
  batchSize: number;
  batchCount: number;
  batchRangeFormula: "start=(ordinal-1)*batchSize+1; end=min(ordinal*batchSize,unitCount)";
  rawPayloadStorage: "forbidden_in_control_plane";
  progressAuthority: "durable_checkpoint_with_evidence";
}

export interface PantavionFoundryWorkloadPlan {
  marker: "pantavion_foundry_workload_plan_v1";
  workOrderId: string;
  kind: PantavionFoundryWorkloadKind;
  unitCount: number;
  intakeReference?: string;
  stages: PantavionFoundryWorkloadStage[];
  internalLanes: PantavionFoundryInternalLane[];
  partitionContract: PantavionFoundryPartitionContract;
  externalWorkerDependency: false;
  completionRule: "every_partition_must_have_canonical_record_evidence_and_terminal_status";
  generatedAt: string;
}

export interface PantavionAgentWorkloadAssignment {
  marker: "pantavion_agent_workload_assignment_v1";
  workOrderId: string;
  workloadKind: PantavionFoundryWorkloadKind;
  unitCount: number;
  intakeReference?: string;
  assignedRole: PantavionOwnedAgentRole;
  ownedStages: PantavionFoundryWorkloadStageId[];
  partitionContract: PantavionFoundryPartitionContract;
  externalWorkerAllowed: false;
}

const DEFAULT_RECOVERY_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 1_000;

const STAGES: PantavionFoundryWorkloadStage[] = [
  {
    id: "inventory",
    ownerRoles: ["orchestrator", "memory_guard"],
    purpose: "Register source references and preserve a no-loss inventory before interpretation.",
    completionEvidence: ["source_reference", "inventory_count", "duplicate_check"],
  },
  {
    id: "classification",
    ownerRoles: ["classifier", "sentinel"],
    purpose: "Classify each recovered unit, scope, risk, and destination without dropping unresolved items.",
    completionEvidence: ["classification_record", "risk_label", "unresolved_reason_when_needed"],
  },
  {
    id: "canonicalization",
    ownerRoles: ["planner", "memory_guard"],
    purpose: "Attach the unit to one canonical capability, module, or explicit duplicate/superseded record.",
    completionEvidence: ["canonical_destination", "deduplication_decision", "continuity_link"],
  },
  {
    id: "evidence_and_dependencies",
    ownerRoles: ["researcher", "planner"],
    purpose: "Link verified evidence, dependencies, affected systems, and missing-proof blockers.",
    completionEvidence: ["evidence_links", "dependency_map", "missing_proof_list"],
  },
  {
    id: "implementation_planning",
    ownerRoles: ["planner", "orchestrator"],
    purpose: "Turn viable items into bounded work orders with explicit acceptance criteria and rollback boundary.",
    completionEvidence: ["scoped_work_order", "acceptance_criteria", "approval_requirement"],
  },
  {
    id: "scoped_build",
    ownerRoles: ["builder", "sentinel"],
    purpose: "Prepare only founder-authorized isolated-branch drafts within declared file scope.",
    completionEvidence: ["scoped_diff", "policy_check", "no_production_mutation"],
  },
  {
    id: "audit_and_verification",
    ownerRoles: ["auditor", "verifier"],
    purpose: "Reject static, unsafe, untested, or unproven outcomes before any completion claim.",
    completionEvidence: ["audit_result", "typescript_result", "build_result", "runtime_or_live_proof"],
  },
  {
    id: "repair_queue",
    ownerRoles: ["repairer", "auditor", "memory_guard"],
    purpose: "Keep failures visible, preserve evidence, and create a bounded repair record instead of losing work.",
    completionEvidence: ["failure_record", "repair_scope", "retry_or_escalation_decision"],
  },
];

const LANES: PantavionFoundryInternalLane[] = [
  { id: "control", ownerRole: "orchestrator", maximumConcurrentPartitions: 1, scope: "Order and gate work." },
  { id: "safety", ownerRole: "sentinel", maximumConcurrentPartitions: 2, scope: "Stop unsafe or out-of-scope work." },
  { id: "classification", ownerRole: "classifier", maximumConcurrentPartitions: 8, scope: "Classify recovery units." },
  { id: "planning", ownerRole: "planner", maximumConcurrentPartitions: 4, scope: "Canonical destinations and work plans." },
  { id: "research", ownerRole: "researcher", maximumConcurrentPartitions: 6, scope: "Evidence and dependency mapping." },
  { id: "build", ownerRole: "builder", maximumConcurrentPartitions: 2, scope: "Founder-scoped draft patches only." },
  { id: "audit", ownerRole: "auditor", maximumConcurrentPartitions: 4, scope: "Policy and realness checks." },
  { id: "verification", ownerRole: "verifier", maximumConcurrentPartitions: 3, scope: "Test, build, and runtime proof." },
  { id: "repair", ownerRole: "repairer", maximumConcurrentPartitions: 2, scope: "Bounded repair after evidence of failure." },
  { id: "continuity", ownerRole: "memory_guard", maximumConcurrentPartitions: 3, scope: "No-loss record and evidence links." },
];

function asPositiveInteger(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function chooseBatchSize(kind: PantavionFoundryWorkloadKind, requested: number | undefined): number {
  if (kind === "single_work_order") return 1;
  return Math.min(MAX_BATCH_SIZE, asPositiveInteger(requested, DEFAULT_RECOVERY_BATCH_SIZE));
}

/**
 * Produces a deterministic internal work-partition contract. It intentionally
 * stores no source payload: individual recovery records belong in the
 * canonical intake/evidence system, while this control plane stores only the
 * bounded ranges, roles, and proof requirements needed to finish every unit.
 */
export function createPantavionFoundryWorkloadPlan(input: {
  workOrderId: string;
  workload?: PantavionFoundryWorkloadRequest;
}): PantavionFoundryWorkloadPlan {
  const kind = input.workload?.kind ?? "single_work_order";
  const unitCount = kind === "recovery_excavation"
    ? asPositiveInteger(input.workload?.unitCount, 28_000)
    : 1;
  const batchSize = chooseBatchSize(kind, input.workload?.batchSize);
  const batchCount = Math.ceil(unitCount / batchSize);
  const intakeReference = input.workload?.intakeReference?.trim() || undefined;

  return {
    marker: "pantavion_foundry_workload_plan_v1",
    workOrderId: input.workOrderId,
    kind,
    unitCount,
    ...(intakeReference ? { intakeReference } : {}),
    stages: STAGES,
    internalLanes: LANES,
    partitionContract: {
      idFormat: "{workOrderId}:batch:{zeroPaddedOrdinal}",
      startsAtUnit: 1,
      batchSize,
      batchCount,
      batchRangeFormula: "start=(ordinal-1)*batchSize+1; end=min(ordinal*batchSize,unitCount)",
      rawPayloadStorage: "forbidden_in_control_plane",
      progressAuthority: "durable_checkpoint_with_evidence",
    },
    externalWorkerDependency: false,
    completionRule: "every_partition_must_have_canonical_record_evidence_and_terminal_status",
    generatedAt: new Date().toISOString(),
  };
}

export function createPantavionAgentWorkloadAssignment(input: {
  plan: PantavionFoundryWorkloadPlan;
  role: PantavionOwnedAgentRole;
}): PantavionAgentWorkloadAssignment {
  return {
    marker: "pantavion_agent_workload_assignment_v1",
    workOrderId: input.plan.workOrderId,
    workloadKind: input.plan.kind,
    unitCount: input.plan.unitCount,
    ...(input.plan.intakeReference ? { intakeReference: input.plan.intakeReference } : {}),
    assignedRole: input.role,
    ownedStages: input.plan.stages
      .filter((stage) => stage.ownerRoles.includes(input.role))
      .map((stage) => stage.id),
    partitionContract: input.plan.partitionContract,
    externalWorkerAllowed: false,
  };
}

export function describePantavionFoundryPartition(
  plan: PantavionFoundryWorkloadPlan,
  ordinal: number,
) {
  if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > plan.partitionContract.batchCount) {
    throw new Error("foundry_partition_ordinal_out_of_range");
  }

  const startUnit = (ordinal - 1) * plan.partitionContract.batchSize + 1;
  const endUnit = Math.min(ordinal * plan.partitionContract.batchSize, plan.unitCount);

  return {
    id: `${plan.workOrderId}:batch:${String(ordinal).padStart(6, "0")}`,
    ordinal,
    startUnit,
    endUnit,
    unitCount: endUnit - startUnit + 1,
    requiredStages: plan.stages.map((stage) => stage.id),
  } as const;
}
