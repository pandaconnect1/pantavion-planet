import assert from "node:assert/strict";

import {
  defaultOwnerReleasePolicy,
  evaluateOwnerReleaseGate,
  validateReleasePolicyTransition,
} from "../core/pantavion/owner-release-gate.ts";

const base = {
  id: "sovereign-owner-control-boundary",
  title: "Owner control boundary",
  domain: "sovereign",
  state: "verified_live",
  source: "canonical",
  updatedAt: "2026-09-06T00:00:00.000Z",
};

const founderOnly = evaluateOwnerReleaseGate(base, {
  audience: "founder_only",
  ownerApprovedForUsers: false,
});
assert.equal(founderOnly.allowed, true);
assert.deepEqual(founderOnly.blockers, []);

const missingIdentity = evaluateOwnerReleaseGate(base, {
  audience: "users",
  ownerApprovedForUsers: true,
  approvedAt: "2026-09-06T00:00:00.000Z",
});
assert.equal(missingIdentity.allowed, false);
assert.ok(missingIdentity.blockers.includes("owner_approval_identity_missing"));

const approved = evaluateOwnerReleaseGate(base, {
  audience: "users",
  ownerApprovedForUsers: true,
  approvedAt: "2026-09-06T00:00:00.000Z",
  approvedBy: "founder",
});
assert.equal(approved.allowed, true);
assert.deepEqual(approved.blockers, []);

const unsafePolicy = {
  ...defaultOwnerReleasePolicy,
  requireOwnerApproval: false,
  requireApprovalIdentity: false,
  requireApprovalTimestamp: false,
  auditRequired: false,
  rollbackRequired: false,
};
const blockers = validateReleasePolicyTransition(defaultOwnerReleasePolicy, unsafePolicy, {
  actor: "founder",
  changedAt: "2026-09-06T00:00:00.000Z",
  reason: "Attempted unsafe owner-control weakening",
  rollbackToVersion: 1,
});
assert.ok(blockers.includes("release_policy_owner_approval_must_remain_enabled"));
assert.ok(blockers.includes("release_policy_owner_identity_must_remain_enabled"));
assert.ok(blockers.includes("release_policy_owner_timestamp_must_remain_enabled"));
assert.ok(blockers.includes("release_policy_audit_must_remain_enabled"));
assert.ok(blockers.includes("release_policy_rollback_must_remain_enabled"));

console.log("Pantavion sovereign owner control boundary: PASS");
