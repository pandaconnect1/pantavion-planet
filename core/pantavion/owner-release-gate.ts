import type { ImplementationSyncItem } from "@/core/pantavion/implementation-sync-registry";

export type ReleaseAudience = "founder_only" | "users";

export type OwnerReleaseDecision = {
  audience: ReleaseAudience;
  ownerApprovedForUsers: boolean;
  approvedAt?: string;
  approvedBy?: string;
};

export type ReleaseGateResult = {
  allowed: boolean;
  audience: ReleaseAudience;
  blockers: string[];
};

export function evaluateOwnerReleaseGate(
  item: ImplementationSyncItem,
  decision: OwnerReleaseDecision,
): ReleaseGateResult {
  const blockers: string[] = [];

  if (decision.audience === "founder_only") {
    return { allowed: true, audience: "founder_only", blockers };
  }

  if (item.state !== "verified_live") blockers.push("implementation_not_verified_live");
  if (!decision.ownerApprovedForUsers) blockers.push("owner_ok_for_users_missing");
  if (!decision.approvedAt || !Number.isFinite(Date.parse(decision.approvedAt))) {
    blockers.push("owner_approval_timestamp_missing_or_invalid");
  }
  if (!decision.approvedBy?.trim()) blockers.push("owner_approval_identity_missing");

  return {
    allowed: blockers.length === 0,
    audience: "users",
    blockers,
  };
}

export const ownerReleaseDoctrine = {
  developmentAudience: "founder_only" as const,
  publicReleaseRequires: [
    "VERIFIED_LIVE implementation truth",
    "explicit owner OK FOR USERS",
    "timestamped owner approval identity",
  ] as const,
  rule:
    "Coded, tested, merged, deployed and verified work remains founder-only until the founder explicitly approves release to users.",
};
