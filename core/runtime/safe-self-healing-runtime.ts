export const PANTAVION_SAFE_SELF_HEALING_RUNTIME_V1 = {
  id: "pantavion_safe_self_healing_runtime_v1",
  doctrine:
    "Pantavion may automatically repair only bounded, reversible, evidence-backed failures. Security, policy, data-integrity, secret, irreversible and high-impact failures must isolate, preserve evidence and escalate instead of silently mutating production.",
  classificationTargetMs: 50,
  decisionTargetMs: 100,
  maxAutomaticAttempts: 3,
  zeroSilentProductionMutation: true,
} as const;

export type PantavionIncidentKind =
  | "transient_runtime"
  | "dependency_unavailable"
  | "validation_failure"
  | "data_integrity"
  | "security_event"
  | "policy_violation"
  | "deployment_drift"
  | "unknown";

export type PantavionIncidentSeverity = "low" | "medium" | "high" | "critical";

export type PantavionHealingDisposition =
  | "retry_internal"
  | "repair_queue"
  | "rollback_and_isolate"
  | "safety_halt"
  | "evidence_review";

export interface PantavionHealingIncident {
  incidentId: string;
  executionId?: string | null;
  kind: PantavionIncidentKind;
  severity: PantavionIncidentSeverity;
  reversible: boolean;
  retryCount: number;
  affectsSecrets?: boolean;
  affectsIdentity?: boolean;
  affectsUserData?: boolean;
  affectsProduction?: boolean;
  evidence: string[];
}

export interface PantavionHealingDecision {
  marker: "pantavion_safe_self_healing_decision_v1";
  incidentId: string;
  disposition: PantavionHealingDisposition;
  automaticActionAllowed: boolean;
  productionMutationAllowed: false;
  retryAllowed: boolean;
  rollbackRequired: boolean;
  isolateRequired: boolean;
  founderOrSecurityReviewRequired: boolean;
  nextActions: string[];
  requiredEvidence: string[];
  reason: string[];
}

function sensitiveBoundary(input: PantavionHealingIncident): boolean {
  return Boolean(
    input.affectsSecrets ||
      input.affectsIdentity ||
      input.affectsUserData ||
      input.kind === "security_event" ||
      input.kind === "policy_violation" ||
      input.kind === "data_integrity",
  );
}

export function planPantavionSelfHealing(
  input: PantavionHealingIncident,
): PantavionHealingDecision {
  if (!input.incidentId.trim()) throw new Error("incident_id_required");
  if (!Number.isInteger(input.retryCount) || input.retryCount < 0) {
    throw new Error("retry_count_invalid");
  }

  const reasons: string[] = [];
  const requiredEvidence = [
    "incident_marker",
    "pre_action_state",
    "action_receipt",
    "post_action_verification",
  ];
  const nextActions: string[] = [];

  const sensitive = sensitiveBoundary(input);
  const attemptsRemaining =
    input.retryCount < PANTAVION_SAFE_SELF_HEALING_RUNTIME_V1.maxAutomaticAttempts;

  if (sensitive) {
    reasons.push("Sensitive or protected boundary detected.");
    nextActions.push(
      "preserve_evidence",
      "isolate_affected_scope",
      "block_automatic_mutation",
      "route_security_or_founder_review",
    );
    return {
      marker: "pantavion_safe_self_healing_decision_v1",
      incidentId: input.incidentId,
      disposition:
        input.kind === "security_event" || input.kind === "policy_violation"
          ? "safety_halt"
          : "rollback_and_isolate",
      automaticActionAllowed: false,
      productionMutationAllowed: false,
      retryAllowed: false,
      rollbackRequired: Boolean(input.affectsProduction),
      isolateRequired: true,
      founderOrSecurityReviewRequired: true,
      nextActions,
      requiredEvidence,
      reason: reasons,
    };
  }

  if (
    (input.kind === "transient_runtime" ||
      input.kind === "dependency_unavailable") &&
    input.reversible &&
    attemptsRemaining &&
    input.severity !== "critical"
  ) {
    reasons.push("Failure is transient, reversible and within bounded retry budget.");
    nextActions.push(
      "checkpoint_current_state",
      "retry_internal_runtime",
      "verify_health_after_retry",
      "queue_repair_if_retry_fails",
    );
    return {
      marker: "pantavion_safe_self_healing_decision_v1",
      incidentId: input.incidentId,
      disposition: "retry_internal",
      automaticActionAllowed: true,
      productionMutationAllowed: false,
      retryAllowed: true,
      rollbackRequired: false,
      isolateRequired: false,
      founderOrSecurityReviewRequired: false,
      nextActions,
      requiredEvidence,
      reason: reasons,
    };
  }

  if (
    input.kind === "validation_failure" ||
    input.kind === "deployment_drift" ||
    !attemptsRemaining
  ) {
    reasons.push(
      !attemptsRemaining
        ? "Automatic retry budget exhausted."
        : "Failure requires bounded repair analysis rather than blind retry.",
    );
    nextActions.push(
      "preserve_failure_state",
      "queue_bounded_repair",
      "run_validation_suite",
      "verify_before_release",
    );
    return {
      marker: "pantavion_safe_self_healing_decision_v1",
      incidentId: input.incidentId,
      disposition: "repair_queue",
      automaticActionAllowed: true,
      productionMutationAllowed: false,
      retryAllowed: false,
      rollbackRequired: Boolean(input.affectsProduction),
      isolateRequired: Boolean(input.affectsProduction),
      founderOrSecurityReviewRequired:
        input.severity === "high" || input.severity === "critical",
      nextActions,
      requiredEvidence,
      reason: reasons,
    };
  }

  reasons.push("Incident is not safe for automatic mutation without more evidence.");
  nextActions.push(
    "preserve_evidence",
    "classify_root_cause",
    "prepare_bounded_resolution",
    "require_verification_before_action",
  );

  return {
    marker: "pantavion_safe_self_healing_decision_v1",
    incidentId: input.incidentId,
    disposition: "evidence_review",
    automaticActionAllowed: false,
    productionMutationAllowed: false,
    retryAllowed: false,
    rollbackRequired: Boolean(input.affectsProduction),
    isolateRequired: input.severity === "critical",
    founderOrSecurityReviewRequired:
      input.severity === "high" || input.severity === "critical",
    nextActions,
    requiredEvidence,
    reason: reasons,
  };
}
