import type { PantavionAgentSecurityProfile } from "./agent-security-policy";
import type { PantavionAutonomousBuildTarget } from "./pantavion-autonomous-builder-kernel";

export type PantavionOwnedAgentRole =
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

export type PantavionOwnedAgentState =
  | "defined"
  | "ready_for_internal_runtime"
  | "blocked";

export interface PantavionOwnedAgentBlueprint {
  id: string;
  workOrderId: string;
  role: PantavionOwnedAgentRole;
  state: PantavionOwnedAgentState;
  purpose: string;
  internalCapabilities: string[];
  allowedTargetFiles: string[];
  maxRuntimeSeconds: number;
  maxAttempts: number;
  maySpawnChildAgents: false;
  mayUseThirdPartyWorkers: false;
  mayCoordinateBoundedInternalWorkPartitions: boolean;
  maxConcurrentPartitions: number;
  blockers: string[];
}

export interface PantavionOwnedAgentFleet {
  marker: "pantavion_owned_agent_fleet_v1";
  workOrderId: string;
  ownership: "pantavion_owned";
  externalWorkerDependency: false;
  internalWorkerTopology: "logical_specialists_on_pantavion_owned_runtime";
  internalPartitioning: {
    coordinatorRole: "orchestrator";
    mayCreateOnlyRecordedBoundedPartitions: true;
    totalLogicalWorkers: number;
  };
  modelRuntime:
    | "configured_pantavion_internal_runtime"
    | "self_hosted_or_pantavion_controlled_runtime_required";
  spawnPolicy: "only_founder_work_order_or_internal_orchestrator_within_recorded_scope";
  agents: PantavionOwnedAgentBlueprint[];
  generatedAt: string;
}

function internalPartitionPolicy(role: PantavionOwnedAgentRole) {
  if (role === "orchestrator") {
    return { mayCoordinateBoundedInternalWorkPartitions: true, maxConcurrentPartitions: 1 };
  }

  const maxConcurrentPartitions: Record<Exclude<PantavionOwnedAgentRole, "orchestrator">, number> = {
    sentinel: 2,
    classifier: 8,
    planner: 4,
    researcher: 6,
    builder: 2,
    auditor: 4,
    verifier: 3,
    repairer: 2,
    memory_guard: 3,
  };

  return {
    mayCoordinateBoundedInternalWorkPartitions: false,
    maxConcurrentPartitions: maxConcurrentPartitions[role],
  };
}

function blueprint(
  input: Omit<
    PantavionOwnedAgentBlueprint,
    "id" | "mayCoordinateBoundedInternalWorkPartitions" | "maxConcurrentPartitions"
  >,
): PantavionOwnedAgentBlueprint {
  return {
    ...input,
    id: `${input.workOrderId}:${input.role}`,
    ...internalPartitionPolicy(input.role),
  };
}

/**
 * Defines logical internal specialists for one work order. These are not
 * third-party workers or independent cloud machines: the orchestrator may
 * divide only the recorded work-order plan into bounded internal partitions.
 * A Pantavion-owned model/runtime is required before they can do
 * non-deterministic reasoning; before then their state is explicit and honest.
 */
export function createPantavionOwnedAgentFleet(input: {
  workOrderId: string;
  target: PantavionAutonomousBuildTarget;
  security: PantavionAgentSecurityProfile;
  internalRuntimeConfigured: boolean;
}): PantavionOwnedAgentFleet {
  const draftAllowed = input.security.mode === "isolated_branch_draft";
  const scopedFiles = input.security.allowedTargetFiles;
  const commonBlockers = input.security.blockers;
  const baseState: PantavionOwnedAgentState = commonBlockers.length > 0
    ? "blocked"
    : input.internalRuntimeConfigured
      ? "ready_for_internal_runtime"
      : "defined";

  const agents: PantavionOwnedAgentBlueprint[] = [
    blueprint({
      workOrderId: input.workOrderId,
      role: "orchestrator",
      state: baseState,
      purpose: `Route the Pantavion-owned agent fleet for ${input.target} without authority escalation.`,
      internalCapabilities: ["work_order_state", "checkpoint_orchestration", "approval_gate"],
      allowedTargetFiles: [],
      maxRuntimeSeconds: 120,
      maxAttempts: 1,
      maySpawnChildAgents: false,
      mayUseThirdPartyWorkers: false,
      blockers: commonBlockers,
    }),
    blueprint({
      workOrderId: input.workOrderId,
      role: "sentinel",
      state: baseState,
      purpose: "Continuously check scope, policy, stop conditions, and unsafe state transitions.",
      internalCapabilities: ["policy_check", "scope_check", "stop_signal"],
      allowedTargetFiles: [],
      maxRuntimeSeconds: 120,
      maxAttempts: 1,
      maySpawnChildAgents: false,
      mayUseThirdPartyWorkers: false,
      blockers: commonBlockers,
    }),
    blueprint({
      workOrderId: input.workOrderId,
      role: "classifier",
      state: baseState,
      purpose: "Classify the founder request into facts, dependencies, risks, and acceptance criteria.",
      internalCapabilities: ["intent_classification", "risk_classification", "acceptance_criteria"],
      allowedTargetFiles: [],
      maxRuntimeSeconds: 300,
      maxAttempts: 2,
      maySpawnChildAgents: false,
      mayUseThirdPartyWorkers: false,
      blockers: commonBlockers,
    }),
    blueprint({
      workOrderId: input.workOrderId,
      role: "planner",
      state: baseState,
      purpose: "Create ordered, reversible implementation steps and declare what proof is missing.",
      internalCapabilities: ["dependency_planning", "rollback_planning", "reality_proof"],
      allowedTargetFiles: scopedFiles,
      maxRuntimeSeconds: 300,
      maxAttempts: 2,
      maySpawnChildAgents: false,
      mayUseThirdPartyWorkers: false,
      blockers: commonBlockers,
    }),
    blueprint({
      workOrderId: input.workOrderId,
      role: "researcher",
      state: baseState,
      purpose: "Search Pantavion-owned knowledge and recorded evidence; new sources require a recorded intake.",
      internalCapabilities: ["internal_knowledge_search", "source_provenance", "gap_detection"],
      allowedTargetFiles: [],
      maxRuntimeSeconds: 300,
      maxAttempts: 2,
      maySpawnChildAgents: false,
      mayUseThirdPartyWorkers: false,
      blockers: commonBlockers,
    }),
    blueprint({
      workOrderId: input.workOrderId,
      role: "builder",
      state: draftAllowed
        ? input.internalRuntimeConfigured
          ? "ready_for_internal_runtime"
          : "defined"
        : "blocked",
      purpose: "Draft a scoped patch only inside the recorded isolated branch file boundary.",
      internalCapabilities: ["repo_truth", "scoped_patch", "sandbox_write"],
      allowedTargetFiles: scopedFiles,
      maxRuntimeSeconds: 900,
      maxAttempts: 1,
      maySpawnChildAgents: false,
      mayUseThirdPartyWorkers: false,
      blockers: draftAllowed ? [] : ["scoped_draft_patch_not_authorized", ...commonBlockers],
    }),
    blueprint({
      workOrderId: input.workOrderId,
      role: "auditor",
      state: baseState,
      purpose: "Check for policy violations, fake UI, dead routes, unscoped changes, and missing tests.",
      internalCapabilities: ["implementation_audit", "security_audit", "diff_review"],
      allowedTargetFiles: scopedFiles,
      maxRuntimeSeconds: 600,
      maxAttempts: 2,
      maySpawnChildAgents: false,
      mayUseThirdPartyWorkers: false,
      blockers: commonBlockers,
    }),
    blueprint({
      workOrderId: input.workOrderId,
      role: "verifier",
      state: baseState,
      purpose: "Run verification gates and refuse an unproven completion claim.",
      internalCapabilities: ["typescript_check", "build_check", "runtime_smoke", "evidence_capture"],
      allowedTargetFiles: scopedFiles,
      maxRuntimeSeconds: 900,
      maxAttempts: 2,
      maySpawnChildAgents: false,
      mayUseThirdPartyWorkers: false,
      blockers: commonBlockers,
    }),
    blueprint({
      workOrderId: input.workOrderId,
      role: "repairer",
      state: commonBlockers.length === 0 ? "defined" : "blocked",
      purpose: "Prepare a bounded repair plan after a verified blocker; it may draft only inside a founder-approved file scope.",
      internalCapabilities: draftAllowed
        ? ["failure_triage", "repair_plan", "scoped_patch", "rollback_preservation"]
        : ["failure_triage", "repair_plan", "rollback_preservation"],
      allowedTargetFiles: scopedFiles,
      maxRuntimeSeconds: 900,
      maxAttempts: 1,
      maySpawnChildAgents: false,
      mayUseThirdPartyWorkers: false,
      blockers: commonBlockers.length > 0
        ? commonBlockers
        : ["awaiting_verified_failure_or_repair_instruction"],
    }),
    blueprint({
      workOrderId: input.workOrderId,
      role: "memory_guard",
      state: baseState,
      purpose: "Store minimal durable facts, link evidence, and enforce memory policy.",
      internalCapabilities: ["memory_policy", "evidence_linking", "retention_guard"],
      allowedTargetFiles: [],
      maxRuntimeSeconds: 180,
      maxAttempts: 1,
      maySpawnChildAgents: false,
      mayUseThirdPartyWorkers: false,
      blockers: commonBlockers,
    }),
  ];

  return {
    marker: "pantavion_owned_agent_fleet_v1",
    workOrderId: input.workOrderId,
    ownership: "pantavion_owned",
    externalWorkerDependency: false,
    internalWorkerTopology: "logical_specialists_on_pantavion_owned_runtime",
    internalPartitioning: {
      coordinatorRole: "orchestrator",
      mayCreateOnlyRecordedBoundedPartitions: true,
      totalLogicalWorkers: agents.length,
    },
    modelRuntime: input.internalRuntimeConfigured
      ? "configured_pantavion_internal_runtime"
      : "self_hosted_or_pantavion_controlled_runtime_required",
    spawnPolicy: "only_founder_work_order_or_internal_orchestrator_within_recorded_scope",
    agents,
    generatedAt: new Date().toISOString(),
  };
}
