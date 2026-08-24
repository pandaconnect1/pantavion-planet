import type { PantavionOwnedAgentRole } from "./pantavion-agent-factory";

/**
 * A blocker is never an instruction to silently abandon a work order.  This
 * contract tells the Foundry which safe internal resolution path to try, and
 * exactly when it must stop and ask the founder instead of escalating its own
 * authority.
 */
export type PantavionFoundryBlockerKind =
  | "runtime_failure"
  | "invalid_execution_input"
  | "missing_evidence"
  | "unresolved_dependency"
  | "validation_failure"
  | "environment_configuration"
  | "scope_or_policy"
  | "founder_approval";

export type PantavionFoundryBlockerDisposition =
  | "self_resolving"
  | "repair_queued"
  | "awaiting_founder_approval"
  | "safety_halted";

export interface PantavionFoundryBlockerResolution {
  marker: "pantavion_foundry_blocker_resolution_v1";
  workOrderId: string;
  sourceAgentRole: PantavionOwnedAgentRole;
  blockerId: string;
  kind: PantavionFoundryBlockerKind;
  summary: string;
  disposition: PantavionFoundryBlockerDisposition;
  mayRetryInternalRuntime: boolean;
  allowedInternalActions: string[];
  forbiddenEscalations: [
    "third_party_worker",
    "external_message_or_campaign",
    "merge_or_production_deploy",
    "secret_or_private_data_export",
  ];
  requiredEvidence: string[];
  externalWorkerDependency: false;
  founderDecisionRequired: boolean;
  generatedAt: string;
}

function resolutionFor(kind: PantavionFoundryBlockerKind): Pick<
  PantavionFoundryBlockerResolution,
  | "disposition"
  | "mayRetryInternalRuntime"
  | "allowedInternalActions"
  | "requiredEvidence"
  | "founderDecisionRequired"
> {
  switch (kind) {
    case "runtime_failure":
      return {
        disposition: "repair_queued",
        mayRetryInternalRuntime: true,
        allowedInternalActions: [
          "record_failure_marker_without_secrets",
          "retry_within_attempt_budget",
          "run_pantavion_owned_runtime_health_check",
          "queue_bounded_repair_analysis",
        ],
        requiredEvidence: ["runtime_check", "retry_result", "repair_scope_or_escalation_reason"],
        founderDecisionRequired: false,
      };
    case "invalid_execution_input":
    case "validation_failure":
      return {
        disposition: "repair_queued",
        mayRetryInternalRuntime: false,
        allowedInternalActions: [
          "preserve_invalid_contract_marker",
          "reconstruct_bounded_input_from_canonical_work_order",
          "queue_scoped_repair_analysis",
        ],
        requiredEvidence: ["validation_result", "repair_scope", "post_repair_validation"],
        founderDecisionRequired: false,
      };
    case "missing_evidence":
    case "unresolved_dependency":
      return {
        disposition: "self_resolving",
        mayRetryInternalRuntime: false,
        allowedInternalActions: [
          "search_pantavion_owned_knowledge",
          "record_missing_evidence_or_dependency",
          "create_bounded_research_or_planning_partition",
          "recheck_acceptance_criteria",
        ],
        requiredEvidence: ["source_reference", "dependency_record", "resolution_or_remaining_gap"],
        founderDecisionRequired: false,
      };
    case "environment_configuration":
      return {
        disposition: "awaiting_founder_approval",
        mayRetryInternalRuntime: false,
        allowedInternalActions: [
          "diagnose_configuration_without_reading_or_returning_secrets",
          "prepare_minimum_safe_configuration_checklist",
          "recheck_after_authorized_configuration_change",
        ],
        requiredEvidence: ["configuration_check", "owner_attestation", "runtime_health_check"],
        founderDecisionRequired: true,
      };
    case "scope_or_policy":
      return {
        disposition: "safety_halted",
        mayRetryInternalRuntime: false,
        allowedInternalActions: [
          "preserve_policy_reason",
          "prepare_narrower_safe_scope_proposal",
          "wait_for_explicit_founder_approval",
        ],
        requiredEvidence: ["policy_check", "safe_scope_proposal", "founder_decision_when_provided"],
        founderDecisionRequired: true,
      };
    case "founder_approval":
      return {
        disposition: "awaiting_founder_approval",
        mayRetryInternalRuntime: false,
        allowedInternalActions: [
          "prepare_internal_plan_only",
          "state_exact_external_or_protected_action_needed",
          "wait_for_explicit_founder_approval",
        ],
        requiredEvidence: ["approval_requirement", "scoped_plan", "founder_decision_when_provided"],
        founderDecisionRequired: true,
      };
  }
}

function safeBlockerId(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, "-");
  return normalized.replace(/^-+|-+$/g, "").slice(0, 120) || "unclassified_blocker";
}

export function createPantavionFoundryBlockerResolution(input: {
  workOrderId: string;
  sourceAgentRole: PantavionOwnedAgentRole;
  blockerId: string;
  kind: PantavionFoundryBlockerKind;
  summary: string;
}): PantavionFoundryBlockerResolution {
  const resolution = resolutionFor(input.kind);

  return {
    marker: "pantavion_foundry_blocker_resolution_v1",
    workOrderId: input.workOrderId,
    sourceAgentRole: input.sourceAgentRole,
    blockerId: safeBlockerId(input.blockerId),
    kind: input.kind,
    summary: input.summary.trim().slice(0, 500) || "Pantavion Foundry recorded a blocker.",
    ...resolution,
    forbiddenEscalations: [
      "third_party_worker",
      "external_message_or_campaign",
      "merge_or_production_deploy",
      "secret_or_private_data_export",
    ],
    externalWorkerDependency: false,
    generatedAt: new Date().toISOString(),
  };
}
