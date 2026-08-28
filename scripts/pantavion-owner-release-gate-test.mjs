import assert from "node:assert/strict";

import {
  defaultOwnerReleasePolicy,
  evaluateOwnerReleaseGate,
  validateReleasePolicyTransition,
} from "../core/pantavion/owner-release-gate.ts";

const base = {
  id: "test-capability",
  title: "Test capability",
  domain: "test",
  state: "coded",
  source: "test",
  updatedAt: "2026-08-28T03:08:00.000Z",
};

const founderOnly = evaluateOwnerReleaseGate(base, {
  audience: "founder_only",
  ownerApprovedForUsers: false,
});
assert.equal(founderOnly.allowed, true);
assert.equal(founderOnly.policyVersion, 1);
assert.deepEqual(founderOnly.blockers, []);

for (const state of ["idea", "coded", "tested", "merged", "deployed"]) {
  const result = evaluateOwnerReleaseGate(
    { ...base, state },
    {
      audience: "users",
      ownerApprovedForUsers: true,
      approvedAt: "2026-08-28T03:08:00.000Z",
      approvedBy: "founder",
    },
  );
  assert.equal(result.allowed, false, `${state} must remain private`);
  assert.ok(result.blockers.includes("implementation_below_policy_minimum:verified_live"));
}

const verifiedWithoutOwner = evaluateOwnerReleaseGate(
  { ...base, state: "verified_live" },
  {
    audience: "users",
    ownerApprovedForUsers: false,
  },
);
assert.equal(verifiedWithoutOwner.allowed, false);
assert.ok(verifiedWithoutOwner.blockers.includes("owner_ok_for_users_missing"));
assert.ok(verifiedWithoutOwner.blockers.includes("owner_approval_timestamp_missing_or_invalid"));
assert.ok(verifiedWithoutOwner.blockers.includes("owner_approval_identity_missing"));

const verifiedAndApproved = evaluateOwnerReleaseGate(
  { ...base, state: "verified_live" },
  {
    audience: "users",
    ownerApprovedForUsers: true,
    approvedAt: "2026-08-28T03:08:00.000Z",
    approvedBy: "founder",
  },
);
assert.equal(verifiedAndApproved.allowed, true);
assert.deepEqual(verifiedAndApproved.blockers, []);

const futurePolicy = {
  ...defaultOwnerReleasePolicy,
  version: 2,
  effectiveAt: "2027-01-01T00:00:00.000Z",
};
const validTransition = validateReleasePolicyTransition(
  defaultOwnerReleasePolicy,
  futurePolicy,
  {
    actor: "founder",
    changedAt: "2027-01-01T00:00:00.000Z",
    reason: "Future owner-authorized policy evolution",
    rollbackToVersion: 1,
  },
);
assert.deepEqual(validTransition, []);

const unsafeTransition = validateReleasePolicyTransition(
  defaultOwnerReleasePolicy,
  { ...futurePolicy, auditRequired: false, rollbackRequired: false },
  {
    actor: "",
    changedAt: "invalid",
    reason: "",
    rollbackToVersion: 99,
  },
);
assert.ok(unsafeTransition.includes("release_policy_audit_must_remain_enabled"));
assert.ok(unsafeTransition.includes("release_policy_rollback_must_remain_enabled"));
assert.ok(unsafeTransition.includes("release_policy_owner_actor_missing"));
assert.ok(unsafeTransition.includes("release_policy_change_reason_missing"));
assert.ok(unsafeTransition.includes("release_policy_change_timestamp_invalid"));
assert.ok(unsafeTransition.includes("release_policy_rollback_target_invalid"));

console.log("Pantavion owner release gate: PASS");
