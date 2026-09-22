export type PantavionSelfRepairSeverity = "low" | "medium" | "high" | "critical";

export interface PantavionSelfRepairDecision {
  marker: "pantavion_self_repair_decision_v1";
  incidentId: string;
  severity: PantavionSelfRepairSeverity;
  userImpact: boolean;
  safeAutomaticAction:
    | "retry_bounded"
    | "fallback"
    | "isolate_component"
    | "rollback_to_verified_checkpoint"
    | "degrade_truthfully"
    | "human_escalation";
  maxAutomaticAttempts: number;
  requiresEvidenceCapture: true;
  requiresPostRepairVerification: true;
  mayHideFailureFromUser: false;
  mayRewriteCanonicalTruthWithoutVerification: false;
}

export function decidePantavionSelfRepair(input: {
  incidentId: string;
  severity: PantavionSelfRepairSeverity;
  userImpact: boolean;
  trustedRollbackAvailable: boolean;
  safeFallbackAvailable: boolean;
  transientFailure: boolean;
}): PantavionSelfRepairDecision {
  let safeAutomaticAction: PantavionSelfRepairDecision["safeAutomaticAction"] = "human_escalation";
  let maxAutomaticAttempts = 0;

  if (input.transientFailure && input.severity !== "critical") {
    safeAutomaticAction = "retry_bounded";
    maxAutomaticAttempts = 2;
  } else if (input.safeFallbackAvailable) {
    safeAutomaticAction = "fallback";
    maxAutomaticAttempts = 1;
  } else if (input.trustedRollbackAvailable) {
    safeAutomaticAction = "rollback_to_verified_checkpoint";
    maxAutomaticAttempts = 1;
  } else if (input.severity === "critical") {
    safeAutomaticAction = "isolate_component";
    maxAutomaticAttempts = 1;
  } else if (input.userImpact) {
    safeAutomaticAction = "degrade_truthfully";
    maxAutomaticAttempts = 1;
  }

  return {
    marker: "pantavion_self_repair_decision_v1",
    incidentId: input.incidentId,
    severity: input.severity,
    userImpact: input.userImpact,
    safeAutomaticAction,
    maxAutomaticAttempts,
    requiresEvidenceCapture: true,
    requiresPostRepairVerification: true,
    mayHideFailureFromUser: false,
    mayRewriteCanonicalTruthWithoutVerification: false,
  };
}

export const PANTAVION_SELF_REPAIR_LOOP = [
  "DETECT",
  "CLASSIFY",
  "CONTAIN",
  "RETRY_OR_FALLBACK_OR_ROLLBACK",
  "VERIFY",
  "RESTORE_OR_ESCALATE",
  "LEARN",
] as const;
