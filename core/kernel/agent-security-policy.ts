import type { PantavionAutonomousBuildTarget } from "./pantavion-autonomous-builder-kernel";

export type PantavionAgentWorkAuthority =
  | "observe"
  | "classify"
  | "propose"
  | "draft_patch"
  | "audit";

export type PantavionAgentWorkMode = "proposal_only" | "isolated_branch_draft";

export interface PantavionAgentSecurityProfile {
  marker: "pantavion_agent_security_profile_v1";
  workOrderId: string;
  target: PantavionAutonomousBuildTarget;
  mode: PantavionAgentWorkMode;
  allowedAuthorities: PantavionAgentWorkAuthority[];
  forbiddenAuthorities: string[];
  allowedTargetFiles: string[];
  dataBoundary: {
    mayReadPrivateUserData: false;
    mayExportPrivateData: false;
    maySendRawPrivateDataToExternalAI: false;
    externalNetworkEgress: "denied";
    internalRuntimeEgress: "pantavion_owned_runtime_only";
    secretsAccess: "brokered_server_only_never_returned_to_agent";
  };
  executionBoundary: {
    mayMerge: false;
    mayDeployProduction: false;
    mayChangeBillingOrPayments: false;
    mayChangeIdentityOrAuth: false;
    mayChangeSOSWaterOrCriticalInfrastructure: false;
    mayRunUnboundedShell: false;
    mayWriteOnlyInIsolatedBranch: boolean;
  };
  auditRequirements: string[];
  stopConditions: string[];
  blockers: string[];
  generatedAt: string;
}

const PROTECTED_TARGETS = new Set<PantavionAutonomousBuildTarget>([
  "safety_system",
  "water_infrastructure",
  "sos_elder",
]);

const PROTECTED_PATH_PREFIXES = [
  ".env",
  "app/api/auth",
  "core/auth",
  "core/identity",
  "core/security",
  "lib/supabase/admin",
  "supabase/migrations",
];

function isProtectedPath(path: string): boolean {
  const normalized = path.replace(/^\/+/, "");
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`) || normalized.startsWith(`${prefix}.`),
  );
}

export function isPantavionProtectedAgentTarget(target: PantavionAutonomousBuildTarget): boolean {
  return PROTECTED_TARGETS.has(target);
}

/**
 * Security envelope attached to every persisted work order before a worker is
 * allowed to inspect or draft anything. It is deliberately deny-by-default:
 * no external worker/provider egress, secret access, merge, deployment, or
 * critical-system mutation is granted by creating a work order. A future
 * runtime must be explicitly configured as Pantavion-owned before it receives
 * this bounded, non-private execution context.
 */
export function createPantavionAgentSecurityProfile(input: {
  workOrderId: string;
  target: PantavionAutonomousBuildTarget;
  targetFiles: string[];
  requestedScopedDraft: boolean;
  founderApprovedScopedDraft: boolean;
}): PantavionAgentSecurityProfile {
  const protectedTarget = isPantavionProtectedAgentTarget(input.target);
  const protectedPaths = input.targetFiles.filter(isProtectedPath);
  const draftAllowed =
    input.requestedScopedDraft &&
    input.founderApprovedScopedDraft &&
    !protectedTarget &&
    protectedPaths.length === 0;

  const blockers: string[] = [];
  if (protectedTarget) blockers.push("critical_target_requires_separate_founder_review");
  if (protectedPaths.length > 0) blockers.push("protected_path_requested");
  if (input.requestedScopedDraft && !input.founderApprovedScopedDraft) {
    blockers.push("scoped_draft_not_explicitly_approved");
  }

  return {
    marker: "pantavion_agent_security_profile_v1",
    workOrderId: input.workOrderId,
    target: input.target,
    mode: draftAllowed ? "isolated_branch_draft" : "proposal_only",
    allowedAuthorities: draftAllowed
      ? ["observe", "classify", "propose", "draft_patch", "audit"]
      : ["observe", "classify", "propose", "audit"],
    forbiddenAuthorities: [
      "read_or_return_secrets",
      "send_private_data_to_external_provider",
      "merge_pull_request",
      "deploy_production",
      "change_billing_or_payments",
      "change_identity_or_auth",
      "change_sos_water_or_critical_infrastructure",
      "delete_or_overwrite_unscoped_data",
      "run_arbitrary_unbounded_shell_commands",
    ],
    allowedTargetFiles: draftAllowed ? input.targetFiles : [],
    dataBoundary: {
      mayReadPrivateUserData: false,
      mayExportPrivateData: false,
      maySendRawPrivateDataToExternalAI: false,
      externalNetworkEgress: "denied",
      internalRuntimeEgress: "pantavion_owned_runtime_only",
      secretsAccess: "brokered_server_only_never_returned_to_agent",
    },
    executionBoundary: {
      mayMerge: false,
      mayDeployProduction: false,
      mayChangeBillingOrPayments: false,
      mayChangeIdentityOrAuth: false,
      mayChangeSOSWaterOrCriticalInfrastructure: false,
      mayRunUnboundedShell: false,
      mayWriteOnlyInIsolatedBranch: draftAllowed,
    },
    auditRequirements: [
      "repo_truth_before_patch",
      "scoped_diff_review",
      "implementation_audit",
      "autonomous_builder_audit",
      "typescript_verification",
      "production_build_verification",
      "founder_review_before_merge_or_deploy",
    ],
    stopConditions: [
      "approval_missing_or_revoked",
      "protected_target_or_path_detected",
      "private_data_boundary_detected",
      "provider_egress_not_allowlisted",
      "audit_typescript_or_build_failure",
      "scope_expands_beyond_declared_files",
    ],
    blockers,
    generatedAt: new Date().toISOString(),
  };
}
