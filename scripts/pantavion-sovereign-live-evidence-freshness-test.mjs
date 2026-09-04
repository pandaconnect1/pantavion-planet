import assert from "node:assert/strict";

const LIFECYCLE = [
  "IDEA",
  "CODED",
  "TESTED",
  "MERGED",
  "DEPLOYED",
  "VERIFIED_LIVE",
];

const workstreams = [
  "Intent-to-Outcome Fabric",
  "Ephemeral Agent Swarm",
  "disconnected/edge execution",
  "Intent Firewall",
  "Agent Capability/Budget Control",
  "Owner Control integration",
  "Technology Library",
  "visible implementation-status/verification surface",
];

function validateEvidence(entry, now = "2026-09-04T17:39:00.000Z") {
  const errors = [];
  const stateIndex = LIFECYCLE.indexOf(entry.state);
  if (stateIndex < 0) errors.push("state_invalid");
  if (!entry.workstream || !workstreams.includes(entry.workstream)) errors.push("workstream_invalid");
  if (stateIndex > 0 && !/^[0-9a-f]{40}$/.test(entry.commitSha ?? "")) errors.push("exact_commit_missing");
  if (stateIndex >= 4 && entry.ownerApproved !== true) errors.push("owner_approval_missing");
  if (stateIndex >= 4 && entry.externalAuthorization !== true) errors.push("external_authorization_missing");
  if (stateIndex === 5 && entry.liveVerification !== true) errors.push("live_verification_missing");
  if (stateIndex === 5 && !entry.verifiedAt) errors.push("verified_at_missing");
  if (entry.verifiedAt && new Date(entry.verifiedAt).getTime() > new Date(now).getTime()) errors.push("future_verification_timestamp");
  if (entry.generatedFromRecovery === true) errors.push("recovery_record_cannot_advance_implementation");
  return errors;
}

const validTested = {
  workstream: workstreams[0],
  state: "TESTED",
  commitSha: "0123456789abcdef0123456789abcdef01234567",
  ownerApproved: false,
  externalAuthorization: false,
  liveVerification: false,
};
assert.deepEqual(validateEvidence(validTested), []);

const staleLive = {
  workstream: workstreams[1],
  state: "VERIFIED_LIVE",
  commitSha: "0123456789abcdef0123456789abcdef01234567",
  ownerApproved: true,
  externalAuthorization: true,
  liveVerification: true,
  verifiedAt: "2026-09-03T17:39:00.000Z",
};
assert.deepEqual(validateEvidence(staleLive), []);

const futureLive = { ...staleLive, verifiedAt: "2026-09-05T00:00:00.000Z" };
assert.ok(validateEvidence(futureLive).includes("future_verification_timestamp"));

const syntheticMerged = {
  workstream: workstreams[2],
  state: "MERGED",
  commitSha: "0123456789abcdef0123456789abcdef01234567",
  ownerApproved: true,
  generatedFromRecovery: true,
};
assert.ok(validateEvidence(syntheticMerged).includes("recovery_record_cannot_advance_implementation"));

const unverifiableLive = {
  workstream: workstreams[3],
  state: "VERIFIED_LIVE",
  commitSha: "0123456789abcdef0123456789abcdef01234567",
  ownerApproved: true,
  externalAuthorization: true,
  liveVerification: false,
};
assert.ok(validateEvidence(unverifiableLive).includes("live_verification_missing"));
assert.ok(validateEvidence(unverifiableLive).includes("verified_at_missing"));

const invalidJump = {
  workstream: workstreams[4],
  state: "DEPLOYED",
  commitSha: "not-an-exact-sha",
  ownerApproved: false,
  externalAuthorization: false,
};
assert.ok(validateEvidence(invalidJump).includes("exact_commit_missing"));
assert.ok(validateEvidence(invalidJump).includes("owner_approval_missing"));
assert.ok(validateEvidence(invalidJump).includes("external_authorization_missing"));

console.log("Pantavion sovereign live-evidence freshness contract: PASS");
