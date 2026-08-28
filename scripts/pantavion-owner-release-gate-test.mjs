import assert from "node:assert/strict";

import { evaluateOwnerReleaseGate } from "../core/pantavion/owner-release-gate.ts";

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
  assert.ok(result.blockers.includes("implementation_not_verified_live"));
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

console.log("Pantavion owner release gate: PASS");
