import type {
  ImplementationState,
  ImplementationSyncItem,
} from "@/core/pantavion/implementation-sync-registry";

export type ReleaseAudience = "founder_only" | "users";

export type OwnerReleaseDecision = {
  audience: ReleaseAudience;
  ownerApprovedForUsers: boolean;
  approvedAt?: string;
  approvedBy?: string;
};

export type VersionedReleasePolicy = {
  id: "pantavion_owner_release_policy";
  version: number;
  effectiveAt: string;
  minimumUserState: Exclude<ImplementationState, "blocked">;
  requireOwnerApproval: boolean;
  requireApprovalIdentity: boolean;
  requireApprovalTimestamp: boolean;
  publicReleaseEnabled: boolean;
  auditRequired: boolean;
  rollbackRequired: boolean;
};

export type ReleasePolicyTransition = {
  actor: string;
  changedAt: string;
  reason: string;
  rollbackToVersion: number;
};

export type ReleaseGateResult = {
  allowed: boolean;
  audience: ReleaseAudience;
  blockers: string[];
  policyVersion: number;
};

const implementationRank: Record<Exclude<ImplementationState, "blocked">, number> = {
  idea: 0,
  coded: 1,
  tested: 2,
  merged: 3,
  deployed: 4,
  verified_live: 5,
};

export const defaultOwnerReleasePolicy: VersionedReleasePolicy = {
  id: "pantavion_owner_release_policy",
  version: 1,
  effectiveAt: "2026-08-28T03:08:00.000Z",
  minimumUserState: "verified_live",
  requireOwnerApproval: true,
  requireApprovalIdentity: true,
  requireApprovalTimestamp: true,
  publicReleaseEnabled: true,
  auditRequired: true,
  rollbackRequired: true,
};

export function validateReleasePolicy(policy: VersionedReleasePolicy): string[] {
  const blockers: string[] = [];
  if (policy.id !== "pantavion_owner_release_policy") blockers.push("release_policy_identity_invalid");
  if (!Number.isInteger(policy.version) || policy.version < 1) blockers.push("release_policy_version_invalid");
  if (!Number.isFinite(Date.parse(policy.effectiveAt))) blockers.push("release_policy_effective_at_invalid");
  if (!(policy.minimumUserState in implementationRank)) blockers.push("release_policy_minimum_state_invalid");
  if (!policy.auditRequired) blockers.push("release_policy_audit_must_remain_enabled");
  if (!policy.rollbackRequired) blockers.push("release_policy_rollback_must_remain_enabled");
  return blockers;
}

export function validateReleasePolicyTransition(
  current: VersionedReleasePolicy,
  next: VersionedReleasePolicy,
  transition: ReleasePolicyTransition,
): string[] {
  const blockers = validateReleasePolicy(next);
  if (next.version !== current.version + 1) blockers.push("release_policy_version_must_increment_once");
  if (!transition.actor.trim()) blockers.push("release_policy_owner_actor_missing");
  if (!transition.reason.trim()) blockers.push("release_policy_change_reason_missing");
  if (!Number.isFinite(Date.parse(transition.changedAt))) blockers.push("release_policy_change_timestamp_invalid");
  if (transition.rollbackToVersion !== current.version) blockers.push("release_policy_rollback_target_invalid");
  return blockers;
}

export function evaluateOwnerReleaseGate(
  item: ImplementationSyncItem,
  decision: OwnerReleaseDecision,
  policy: VersionedReleasePolicy = defaultOwnerReleasePolicy,
): ReleaseGateResult {
  const blockers = validateReleasePolicy(policy);

  if (decision.audience === "founder_only") {
    return {
      allowed: blockers.length === 0,
      audience: "founder_only",
      blockers,
      policyVersion: policy.version,
    };
  }

  if (!policy.publicReleaseEnabled) blockers.push("public_release_disabled_by_policy");
  if (item.state === "blocked") {
    blockers.push("implementation_blocked");
  } else if (implementationRank[item.state] < implementationRank[policy.minimumUserState]) {
    blockers.push(`implementation_below_policy_minimum:${policy.minimumUserState}`);
  }
  if (policy.requireOwnerApproval && !decision.ownerApprovedForUsers) {
    blockers.push("owner_ok_for_users_missing");
  }
  if (
    policy.requireApprovalTimestamp &&
    (!decision.approvedAt || !Number.isFinite(Date.parse(decision.approvedAt)))
  ) {
    blockers.push("owner_approval_timestamp_missing_or_invalid");
  }
  if (policy.requireApprovalIdentity && !decision.approvedBy?.trim()) {
    blockers.push("owner_approval_identity_missing");
  }

  return {
    allowed: blockers.length === 0,
    audience: "users",
    blockers,
    policyVersion: policy.version,
  };
}

export const ownerReleaseDoctrine = {
  developmentAudience: "founder_only" as const,
  currentPolicyVersion: defaultOwnerReleasePolicy.version,
  publicReleaseRequires: [
    "VERIFIED_LIVE implementation truth under the current policy",
    "explicit owner OK FOR USERS",
    "timestamped owner approval identity",
  ] as const,
  evolutionRule:
    "Release policy may evolve later only through a versioned, attributed, reasoned and rollback-safe transition.",
  rule:
    "Coded, tested, merged, deployed and verified work remains founder-only until the founder explicitly approves release to users under the active versioned release policy.",
};
