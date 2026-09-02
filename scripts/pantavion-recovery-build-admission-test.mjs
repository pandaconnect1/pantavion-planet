import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createAgentBudgetGrant } from "../core/sovereign/agent-capability-budget-control.ts";
import { createDisconnectedExecutionPacket } from "../core/sovereign/edge-execution.ts";
import {
  activateEphemeralAgent,
  createEphemeralAgent,
} from "../core/sovereign/ephemeral-agent-swarm.ts";
import {
  admitPantavionRecoveryBuildCapsule,
  derivePantavionRecoveryBuildAdmissionBinding,
  verifyPantavionRecoveryBuildAdmission,
} from "../core/recovery/pantavion-recovery-build-admission.ts";
import { createRecoveryBuildOwnerDecisionReceipt } from "../core/recovery/pantavion-recovery-owner-decision.ts";
import { createPantavionRecoveryScopedBuildCapsule } from "../core/recovery/pantavion-recovery-scoped-build-capsule.ts";

const readinessIndex = JSON.parse(
  await readFile("data/recovery/sovereign-build-readiness-index-v1.json", "utf8"),
);
const repository = "pandaconnect1/pantavion-planet";
const baseRevision = "acbb65664a20423d574fdb3bf672c6ff777ba868";
const ownerUserId = "00000000-0000-4000-8000-000000000001";
const decisionEpoch = Date.parse("2026-08-31T10:00:00.000Z");

assert.equal(readinessIndex.marker, "pantavion_recovery_build_readiness_index_v1");
assert.equal(readinessIndex.corpus.sourceRecordCount, 82413);
assert.equal(readinessIndex.corpus.classifiedCandidateCount, 31779);
assert.equal(readinessIndex.corpus.governedHoldCount, 355);
assert.equal(readinessIndex.corpus.recursiveProvenanceCount, 50279);
assert.equal(readinessIndex.packets.length, 279);

function at(epoch, deltaMs) {
  return new Date(epoch + deltaMs).toISOString();
}

function createFixture(packet, offset, previousCapsuleDigest, previousAdmissionDigest) {
  const epoch = decisionEpoch + offset * 1000;
  const decidedAt = at(epoch, 0);
  const compiledAt = at(epoch, 5 * 60 * 1000);
  const issuedAt = at(epoch, 6 * 60 * 1000);
  const observedAt = at(epoch, 7 * 60 * 1000);
  const expiresAt = at(epoch, 26 * 60 * 1000);
  const ownerReceipt = createRecoveryBuildOwnerDecisionReceipt({
    source: packet,
    readinessIndexDigest: readinessIndex.indexDigest,
    ownerUserId,
    assuranceLevel: "aal2",
    decision: "approve_scoped_implementation",
    note: "Synthetic admission protocol verification only; no Founder approval was recorded.",
    decidedAt,
  });
  const capsule = createPantavionRecoveryScopedBuildCapsule({
    packet,
    receipt: ownerReceipt,
    readinessIndexDigest: readinessIndex.indexDigest,
    repository,
    baseRevision,
    compiledAt,
    previousCapsuleDigest,
  });
  const binding = derivePantavionRecoveryBuildAdmissionBinding(capsule);
  const licenseId = `license://${capsule.technology.entryId}`;
  const technologyEntry = {
    id: capsule.technology.entryId,
    name: `Synthetic isolated implementation technology ${offset + 1}`,
    capability: binding.capability,
    source: "pantavion_native",
    maturity: "prototype",
    licenseId,
    commercialUseAllowed: true,
    sourceAvailable: true,
    reversibleIntegration: true,
    securityReviewed: true,
    privacyReviewed: true,
    evidence: [
      { kind: "source", reference: `source://${capsule.capsuleDigest}`, digest: capsule.capsuleDigest, observedAt: compiledAt },
      { kind: "benchmark", reference: `benchmark://${capsule.capsuleDigest}`, digest: capsule.capsuleDigest, observedAt: compiledAt },
      { kind: "security", reference: `security://${capsule.capsuleDigest}`, digest: capsule.capsuleDigest, observedAt: compiledAt },
      { kind: "privacy", reference: `privacy://${capsule.capsuleDigest}`, digest: capsule.capsuleDigest, observedAt: compiledAt },
      { kind: "license", reference: licenseId, digest: capsule.capsuleDigest, observedAt: compiledAt },
    ],
  };
  const agent = activateEphemeralAgent(createEphemeralAgent({
    id: `synthetic_recovery_builder_${offset + 1}`,
    parentIntentId: binding.intentId,
    role: "builder",
    capabilities: [{
      capability: binding.capability,
      scope: binding.scope,
      readOnly: false,
      expiresAt,
    }],
    budget: 6,
    createdAt: issuedAt,
    expiresAt,
  }), new Date(observedAt));
  const grant = createAgentBudgetGrant({
    id: `synthetic_recovery_grant_${offset + 1}`,
    agentId: agent.id,
    intentId: binding.intentId,
    capabilities: [{
      capability: binding.capability,
      scope: binding.scope,
      access: "write",
    }],
    budgetLimit: 6,
    issuedAt,
    expiresAt,
  });
  const edgePolicy = {
    allowedCapabilities: [binding.capability],
    maximumPayloadBytes: 4096,
  };
  const edgePacket = createDisconnectedExecutionPacket({
    id: binding.edgeTaskId,
    intentId: binding.intentId,
    capability: binding.capability,
    payload: {
      capsuleDigest: capsule.capsuleDigest,
      ownerReceiptDigest: ownerReceipt.receiptDigest,
      workspaceId: capsule.isolation.workspaceId,
      baseRevision: capsule.baseRevision,
      sessionId: binding.sessionId,
      scope: binding.scope,
    },
    deterministic: true,
    reversible: true,
    requiresNetwork: false,
    writesProduction: false,
    issuedAt,
    expiresAt,
  }, edgePolicy);
  const admissionInput = {
    capsule,
    readinessPacket: packet,
    ownerReceipt,
    technologyEntry,
    agent,
    grant,
    edgePacket,
    edgePolicy,
    consumedEdgeDigests: new Set(),
    estimatedCost: 6,
    maximumEvidenceBytes: 1024 * 1024,
    jurisdiction: "CY",
    legalConsentRecorded: true,
    legalConsentEvidenceDigest: capsule.capsuleDigest,
    observedAt,
    previousAdmissionDigest,
  };
  return { admissionInput, binding, capsule, ownerReceipt, technologyEntry, agent, grant, edgePacket };
}

const admissions = [];
const fixtures = [];
let previousCapsuleDigest = null;
let previousAdmissionDigest = null;
for (const [offset, packet] of readinessIndex.packets.entries()) {
  const fixture = createFixture(packet, offset, previousCapsuleDigest, previousAdmissionDigest);
  const admission = admitPantavionRecoveryBuildCapsule(fixture.admissionInput);

  assert.equal(admission.disposition, "ready_for_isolated_bounded_execution");
  assert.equal(admission.source.capsuleDigest, fixture.capsule.capsuleDigest);
  assert.equal(admission.source.ownerReceiptDigest, fixture.ownerReceipt.receiptDigest);
  assert.equal(admission.previousAdmissionDigest, previousAdmissionDigest);
  assert.equal(admission.boundedSession.state, "ready");
  assert.equal(admission.boundedSession.completedStepIds.length, 0);
  assert.equal(admission.boundedSession.receipts.length, 0);
  assert.equal(admission.lifecycle.sourceImplementationState, "IDEA");
  assert.equal(admission.lifecycle.nextPermittedEvidenceState, "CODED");
  assert.equal(admission.authority.isolatedCodePreparation, true);
  assert.equal(admission.authority.boundedSessionCreation, true);
  assert.ok(Object.entries(admission.authority).every(([key, value]) => {
    if (["isolatedCodePreparation", "boundedSessionCreation"].includes(key)) return value === true;
    return value === false;
  }));
  assert.equal(verifyPantavionRecoveryBuildAdmission(admission, fixture.admissionInput.observedAt), true);

  admissions.push(admission);
  fixtures.push(fixture);
  previousCapsuleDigest = fixture.capsule.capsuleDigest;
  previousAdmissionDigest = admission.admissionDigest;
}

assert.equal(admissions.length, 279);
assert.equal(
  fixtures.reduce((total, fixture) => total + fixture.capsule.membership.memberCount, 0),
  31779,
);
assert.equal(new Set(admissions.map((item) => item.admissionDigest)).size, 279);
assert.equal(new Set(admissions.map((item) => item.binding.intentId)).size, 279);
assert.equal(new Set(admissions.map((item) => item.binding.sessionId)).size, 279);
assert.equal(new Set(fixtures.map((item) => item.edgePacket.payloadDigest)).size, 279);
assert.equal(readinessIndex.corpus.governedHoldCount + readinessIndex.corpus.recursiveProvenanceCount, 50634);

const first = fixtures[0];
const firstInput = first.admissionInput;
assert.throws(
  () => admitPantavionRecoveryBuildCapsule({
    ...firstInput,
    capsule: { ...first.capsule, baseRevision: "f".repeat(40) },
  }),
  /capsule_invalid/,
);
assert.throws(
  () => admitPantavionRecoveryBuildCapsule({
    ...firstInput,
    ownerReceipt: fixtures[1].ownerReceipt,
  }),
  /owner_receipt_mismatch/,
);
assert.throws(
  () => admitPantavionRecoveryBuildCapsule({
    ...firstInput,
    technologyEntry: { ...first.technologyEntry, securityReviewed: false },
  }),
  /technology_not_ready/,
);
assert.throws(
  () => admitPantavionRecoveryBuildCapsule({
    ...firstInput,
    technologyEntry: { ...first.technologyEntry, source: "external_provider" },
  }),
  /technology_not_ready:owner_approval_required/,
);
assert.throws(
  () => admitPantavionRecoveryBuildCapsule({
    ...firstInput,
    grant: { ...first.grant, budgetLimit: 5 },
  }),
  /budget_binding_invalid/,
);
assert.throws(
  () => admitPantavionRecoveryBuildCapsule({
    ...firstInput,
    consumedEdgeDigests: new Set([first.edgePacket.payloadDigest]),
  }),
  /edge_denied:packet_replay_detected/,
);
assert.throws(
  () => admitPantavionRecoveryBuildCapsule({
    ...firstInput,
    edgePacket: {
      ...first.edgePacket,
      task: {
        ...first.edgePacket.task,
        payload: { ...first.edgePacket.task.payload, capsuleDigest: "0".repeat(64) },
      },
    },
  }),
  /edge_denied:packet_digest_mismatch/,
);
assert.throws(
  () => admitPantavionRecoveryBuildCapsule({
    ...firstInput,
    observedAt: at(Date.parse(first.ownerReceipt.decidedAt), 24 * 60 * 60 * 1000 + 1),
  }),
  /owner_receipt_expired/,
);

const sensitiveOffset = readinessIndex.packets.findIndex((packet) =>
  packet.data.classes.some((dataClass) => dataClass === "sensitive" || dataClass === "regulated"),
);
assert.notEqual(sensitiveOffset, -1, "The readiness corpus must retain a sensitive or regulated packet.");
const sensitive = fixtures[sensitiveOffset];
assert.throws(
  () => admitPantavionRecoveryBuildCapsule({
    ...sensitive.admissionInput,
    legalConsentRecorded: false,
  }),
  /kernel_denied:sensitive_data_without_consent/,
);
assert.throws(
  () => admitPantavionRecoveryBuildCapsule({
    ...sensitive.admissionInput,
    legalConsentEvidenceDigest: null,
  }),
  /legal_consent_evidence_required/,
);

const validAdmission = admissions[0];
assert.equal(
  verifyPantavionRecoveryBuildAdmission({
    ...validAdmission,
    authority: { ...validAdmission.authority, productionWrite: true },
  }, firstInput.observedAt),
  false,
);
assert.equal(
  verifyPantavionRecoveryBuildAdmission({
    ...validAdmission,
    boundedSession: { ...validAdmission.boundedSession, state: "completed" },
  }, firstInput.observedAt),
  false,
);
assert.equal(
  verifyPantavionRecoveryBuildAdmission(validAdmission, validAdmission.validUntil),
  false,
);

console.log("PANTAVION RECOVERY BUILD ADMISSION: PASSED");
console.log("- 279/279 scoped capsules admitted into bounded Pantavion sessions under synthetic in-memory gates");
console.log("- all 31,779 classified members covered; 50,634 non-executable records preserved");
console.log("- owner receipt, Technology Library, Intent Firewall, agent, budget and disconnected-edge gates are exact-bound");
console.log("- sessions contain 0 completed steps and 0 receipts; production, merge, deployment, public and release authority remain false");
console.log("- 0 real Founder approvals, Technology clearances, agents, grants, budgets, edge packets or executions were issued");
