import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createRecoveryBuildOwnerDecisionReceipt } from "../core/recovery/pantavion-recovery-owner-decision.ts";
import {
  createPantavionRecoveryScopedBuildCapsule,
  verifyPantavionRecoveryScopedBuildCapsule,
} from "../core/recovery/pantavion-recovery-scoped-build-capsule.ts";

const readinessIndex = JSON.parse(
  await readFile("data/recovery/sovereign-build-readiness-index-v1.json", "utf8"),
);
const repository = "pandaconnect1/pantavion-planet";
const baseRevision = "2ac29620918d61dbf1aabe039f6aca586a23dfb4";
const ownerUserId = "00000000-0000-4000-8000-000000000001";
const decisionEpoch = Date.parse("2026-08-31T05:00:00.000Z");

assert.equal(readinessIndex.marker, "pantavion_recovery_build_readiness_index_v1");
assert.equal(readinessIndex.corpus.sourceRecordCount, 82413);
assert.equal(readinessIndex.corpus.classifiedCandidateCount, 31779);
assert.equal(readinessIndex.corpus.governedHoldCount, 355);
assert.equal(readinessIndex.corpus.recursiveProvenanceCount, 50279);
assert.equal(readinessIndex.packets.length, 279);

const capsules = [];
let previousCapsuleDigest = null;
for (const [offset, packet] of readinessIndex.packets.entries()) {
  const decidedAt = new Date(decisionEpoch + offset * 1000).toISOString();
  const receipt = createRecoveryBuildOwnerDecisionReceipt({
    source: packet,
    readinessIndexDigest: readinessIndex.indexDigest,
    ownerUserId,
    assuranceLevel: "aal2",
    decision: "approve_scoped_implementation",
    note: "Synthetic protocol verification only; no Founder approval was recorded.",
    decidedAt,
  });
  const capsule = createPantavionRecoveryScopedBuildCapsule({
    packet,
    receipt,
    readinessIndexDigest: readinessIndex.indexDigest,
    repository,
    baseRevision,
    compiledAt: new Date(Date.parse(decidedAt) + 5 * 60 * 1000).toISOString(),
    previousCapsuleDigest,
  });

  assert.equal(capsule.buildOrderOrdinal, offset + 1);
  assert.equal(capsule.previousCapsuleDigest, previousCapsuleDigest);
  assert.equal(capsule.lifecycle.currentImplementationState, "IDEA");
  assert.equal(capsule.lifecycle.nextPermittedLifecycleState, "CODED");
  assert.equal(
    capsule.lifecycle.executionDisposition,
    "blocked_pending_separate_grants_and_technology_clearance",
  );
  assert.equal(capsule.technology.readiness, "hold");
  assert.equal(capsule.agent.state, "not_issued");
  assert.equal(capsule.agent.requestedBudgetLimit, 0);
  assert.equal(capsule.isolation.networkPolicy, "deny_by_default");
  assert.equal(capsule.isolation.productionCredentialsAvailable, false);
  assert.equal(capsule.isolation.productionDataAvailable, false);
  assert.ok(Object.entries(capsule.authority).every(
    ([key, value]) => key === "analysis" || key === "planning" ? value === true : value === false,
  ));
  assert.equal(capsule.steps.length, 6);
  assert.ok(capsule.steps.every((step) => step.executionAuthorized === false));
  assert.equal(verifyPantavionRecoveryScopedBuildCapsule(capsule), true);

  capsules.push(capsule);
  previousCapsuleDigest = capsule.capsuleDigest;
}

assert.equal(capsules.length, 279);
assert.equal(
  capsules.reduce((total, capsule) => total + capsule.membership.memberCount, 0),
  31779,
);
assert.equal(new Set(capsules.map((capsule) => capsule.buildOrderId)).size, 279);
assert.equal(new Set(capsules.map((capsule) => capsule.capsuleDigest)).size, 279);
assert.equal(new Set(capsules.map((capsule) => capsule.isolation.workspaceId)).size, 279);
assert.equal(readinessIndex.corpus.governedHoldCount + readinessIndex.corpus.recursiveProvenanceCount, 50634);

const packet = readinessIndex.packets[0];
const approval = createRecoveryBuildOwnerDecisionReceipt({
  source: packet,
  readinessIndexDigest: readinessIndex.indexDigest,
  ownerUserId,
  assuranceLevel: "aal2",
  decision: "approve_scoped_implementation",
  note: "Synthetic negative-case approval; not a real Founder decision.",
  decidedAt: "2026-08-31T06:00:00.000Z",
});
const rejection = createRecoveryBuildOwnerDecisionReceipt({
  source: packet,
  readinessIndexDigest: readinessIndex.indexDigest,
  ownerUserId,
  assuranceLevel: "aal2",
  decision: "reject",
  note: "Synthetic negative-case rejection.",
  decidedAt: "2026-08-31T06:00:00.000Z",
});
const compile = (overrides = {}) => createPantavionRecoveryScopedBuildCapsule({
  packet,
  receipt: approval,
  readinessIndexDigest: readinessIndex.indexDigest,
  repository,
  baseRevision,
  compiledAt: "2026-08-31T06:05:00.000Z",
  previousCapsuleDigest: null,
  ...overrides,
});

assert.throws(() => compile({ receipt: rejection }), /owner_approval_required/);
assert.throws(
  () => compile({ receipt: { ...approval, readinessDigest: "0".repeat(64) } }),
  /owner_receipt_invalid/,
);
assert.throws(
  () => compile({ readinessIndexDigest: "1".repeat(64) }),
  /owner_receipt_source_mismatch/,
);
assert.throws(
  () => compile({ compiledAt: "2026-08-30T06:05:00.000Z" }),
  /owner_receipt_from_future/,
);
assert.throws(
  () => compile({ compiledAt: "2026-09-01T06:00:00.001Z" }),
  /owner_receipt_expired/,
);
assert.throws(() => compile({ repository: "someone/else" }), /repository_mismatch/);
assert.throws(() => compile({ baseRevision: "f".repeat(64) }), /git_commit_sha/);
assert.throws(() => compile({ previousCapsuleDigest: "not-a-digest" }), /must_be_sha256/);
assert.throws(
  () => compile({
    packet: {
      ...packet,
      route: { ...packet.route, canonicalTarget: "canonical/../escape" },
    },
  }),
  /route_target_invalid/,
);

const valid = compile();
assert.equal(
  verifyPantavionRecoveryScopedBuildCapsule({
    ...valid,
    authority: { ...valid.authority, codeMutation: true },
  }),
  false,
);
assert.equal(
  verifyPantavionRecoveryScopedBuildCapsule({
    ...valid,
    steps: valid.steps.map((step, index) => index === 1
      ? { ...step, scope: "canonical/unapproved/scope" }
      : step),
  }),
  false,
);

console.log("PANTAVION RECOVERY SCOPED BUILD CAPSULES: PASSED");
console.log("- 279/279 build orders compiled under synthetic protocol-only approvals");
console.log("- all 31,779 classified members covered; 50,634 non-executable records preserved");
console.log("- every capsule is isolated, deny-by-default and cryptographically chained");
console.log("- 0 real Founder approvals, agent grants, budgets, executions or production authorities issued");
