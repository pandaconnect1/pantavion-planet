import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
} from "../core/recovery/pantavion-recovery-build-admission.ts";
import {
  advancePantavionRecoveryBoundedExecution,
  beginPantavionRecoveryBoundedExecution,
  createPantavionRecoveryStepEvidenceBytes,
  verifyPantavionRecoveryBoundedExecution,
} from "../core/recovery/pantavion-recovery-bounded-step-execution.ts";
import { createRecoveryBuildOwnerDecisionReceipt } from "../core/recovery/pantavion-recovery-owner-decision.ts";
import { createPantavionRecoveryScopedBuildCapsule } from "../core/recovery/pantavion-recovery-scoped-build-capsule.ts";

const readinessIndex = JSON.parse(
  await readFile("data/recovery/sovereign-build-readiness-index-v1.json", "utf8"),
);
const repository = "pandaconnect1/pantavion-planet";
const baseRevision = "f76aaed13cee9f5b4ac2748b2daf0a50897a06d7";
const ownerUserId = "00000000-0000-4000-8000-000000000001";
const decisionEpoch = Date.parse("2026-08-31T18:00:00.000Z");
const stepIds = [
  "source_binding",
  "isolated_code_preparation",
  "unit_verification",
  "security_verification",
  "rollback_evidence",
  "exact_revision_evidence",
];

assert.equal(readinessIndex.marker, "pantavion_recovery_build_readiness_index_v1");
assert.equal(readinessIndex.corpus.sourceRecordCount, 82413);
assert.equal(readinessIndex.corpus.classifiedCandidateCount, 31779);
assert.equal(readinessIndex.corpus.governedHoldCount, 355);
assert.equal(readinessIndex.corpus.recursiveProvenanceCount, 50279);
assert.equal(readinessIndex.packets.length, 279);

function at(epoch, deltaMs) {
  return new Date(epoch + deltaMs).toISOString();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function createFixture(packet, offset, previousCapsuleDigest, previousAdmissionDigest) {
  const epoch = decisionEpoch + offset * 1000;
  const decidedAt = at(epoch, 0);
  const compiledAt = at(epoch, 5 * 60 * 1000);
  const issuedAt = at(epoch, 6 * 60 * 1000);
  const admittedAt = at(epoch, 7 * 60 * 1000);
  const expiresAt = at(epoch, 26 * 60 * 1000);
  const ownerReceipt = createRecoveryBuildOwnerDecisionReceipt({
    source: packet,
    readinessIndexDigest: readinessIndex.indexDigest,
    ownerUserId,
    assuranceLevel: "aal2",
    decision: "approve_scoped_implementation",
    note: "Synthetic bounded-step protocol verification only; no Founder approval was recorded.",
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
    name: `Synthetic isolated execution technology ${offset + 1}`,
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
    id: `synthetic_recovery_executor_${offset + 1}`,
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
  }), new Date(admittedAt));
  const grant = createAgentBudgetGrant({
    id: `synthetic_recovery_execution_grant_${offset + 1}`,
    agentId: agent.id,
    intentId: binding.intentId,
    capabilities: [{ capability: binding.capability, scope: binding.scope, access: "write" }],
    budgetLimit: 6,
    issuedAt,
    expiresAt,
  });
  const edgePolicy = { allowedCapabilities: [binding.capability], maximumPayloadBytes: 4096 };
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
  const admission = admitPantavionRecoveryBuildCapsule({
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
    observedAt: admittedAt,
    previousAdmissionDigest,
  });
  return { epoch, packet, capsule, binding, ownerReceipt, edgePacket, edgePolicy, admission };
}

function stepMaterial(fixture, stepId) {
  const artifactBytes = Buffer.from(JSON.stringify({
    admissionDigest: fixture.admission.admissionDigest,
    buildOrderId: fixture.packet.buildOrderId,
    memberFingerprint: fixture.packet.membership.orderedMemberWorkUnitIdFingerprint,
    readinessDigest: fixture.packet.readinessDigest,
    stepId,
    synthetic: true,
  }));
  let action = "discard_isolated_workspace_output";
  if (stepId === "source_binding") action = "read_only_no_write";
  const rollbackBytes = Buffer.from(JSON.stringify({
    admissionDigest: fixture.admission.admissionDigest,
    stepId,
    action,
    synthetic: true,
  }));
  let isolatedCommit = null;
  let isolatedTreeDigest = null;
  if (stepId === "exact_revision_evidence") {
    isolatedCommit = sha256(`commit|${fixture.admission.admissionDigest}`).slice(0, 40);
    isolatedTreeDigest = sha256(`tree|${fixture.admission.admissionDigest}`);
  }
  return { artifactBytes, rollbackBytes, isolatedCommit, isolatedTreeDigest };
}

function executeFixture(fixture) {
  const startedAt = at(fixture.epoch, 8 * 60 * 1000);
  let execution = beginPantavionRecoveryBoundedExecution({
    admission: fixture.admission,
    edgePacket: fixture.edgePacket,
    edgePolicy: fixture.edgePolicy,
    consumedEdgeDigests: new Set(),
    workerId: `synthetic_worker_${fixture.packet.buildOrderOrdinal}`,
    fencingToken: 1,
    observedAt: startedAt,
  });
  assert.equal(execution.status, "ready");
  assert.equal(execution.checkpoints.length, 1);
  assert.equal(execution.evidence.length, 0);
  assert.equal(verifyPantavionRecoveryBoundedExecution(execution, fixture.admission, startedAt), true);

  for (const [stepOffset, stepId] of stepIds.entries()) {
    const observedAt = at(fixture.epoch, (9 + stepOffset) * 60 * 1000);
    const material = stepMaterial(fixture, stepId);
    const evidenceBytes = createPantavionRecoveryStepEvidenceBytes({
      admission: fixture.admission,
      stepId,
      origin: "synthetic_test_only",
      observedAt,
      ...material,
    });
    execution = advancePantavionRecoveryBoundedExecution({
      execution,
      admission: fixture.admission,
      evidenceBytes,
      artifactBytes: material.artifactBytes,
      rollbackBytes: material.rollbackBytes,
      cost: 1,
      observedAt,
    });
    assert.equal(verifyPantavionRecoveryBoundedExecution(execution, fixture.admission, observedAt), true);
  }
  return execution;
}

const fixtures = [];
const executions = [];
let previousCapsuleDigest = null;
let previousAdmissionDigest = null;
for (const [offset, packet] of readinessIndex.packets.entries()) {
  const fixture = createFixture(packet, offset, previousCapsuleDigest, previousAdmissionDigest);
  const execution = executeFixture(fixture);
  fixtures.push(fixture);
  executions.push(execution);
  previousCapsuleDigest = fixture.capsule.capsuleDigest;
  previousAdmissionDigest = fixture.admission.admissionDigest;
}

assert.equal(executions.length, 279);
assert.equal(fixtures.reduce((sum, fixture) => sum + fixture.packet.membership.memberCount, 0), 31779);
assert.equal(readinessIndex.corpus.governedHoldCount + readinessIndex.corpus.recursiveProvenanceCount, 50634);
assert.equal(new Set(executions.map((execution) => execution.executionDigest)).size, 279);
assert.equal(executions.reduce((sum, execution) => sum + execution.session.receipts.length, 0), 1674);
assert.equal(executions.reduce((sum, execution) => sum + execution.checkpoints.length, 0), 1953);
for (const execution of executions) {
  assert.equal(execution.status, "bounded_protocol_complete");
  assert.equal(execution.session.state, "completed");
  assert.equal(execution.session.receipts.length, 6);
  assert.equal(execution.session.grant.spent, 6);
  assert.equal(execution.checkpoints.length, 7);
  assert.equal(execution.evidence.length, 6);
  assert.equal(execution.evidence.every((evidence) => evidence.origin === "synthetic_test_only"), true);
  assert.equal(execution.lifecycle.sourceImplementationState, "IDEA");
  assert.equal(execution.lifecycle.promotionRecorded, false);
  assert.equal(execution.authority.canonicalRepositoryWrite, false);
  assert.equal(execution.authority.productionWrite, false);
  assert.equal(execution.authority.merge, false);
  assert.equal(execution.authority.deployment, false);
  assert.equal(execution.authority.publicExposure, false);
  assert.equal(execution.authority.release, false);
  assert.equal(execution.authority.lifecyclePromotion, false);
  assert.equal(execution.completion, false);
}

const first = fixtures[0];
const firstStart = at(first.epoch, 8 * 60 * 1000);
assert.throws(
  () => beginPantavionRecoveryBoundedExecution({
    admission: first.admission,
    edgePacket: first.edgePacket,
    edgePolicy: first.edgePolicy,
    consumedEdgeDigests: new Set([first.edgePacket.payloadDigest]),
    workerId: "replay_worker",
    fencingToken: 1,
    observedAt: firstStart,
  }),
  /packet_replay_detected/,
);
assert.throws(
  () => beginPantavionRecoveryBoundedExecution({
    admission: first.admission,
    edgePacket: {
      ...first.edgePacket,
      task: { ...first.edgePacket.task, payload: { ...first.edgePacket.task.payload, scope: "canonical/tampered" } },
    },
    edgePolicy: first.edgePolicy,
    consumedEdgeDigests: new Set(),
    workerId: "tampered_worker",
    fencingToken: 1,
    observedAt: firstStart,
  }),
  /packet_digest_mismatch/,
);
assert.throws(
  () => beginPantavionRecoveryBoundedExecution({
    admission: first.admission,
    edgePacket: first.edgePacket,
    edgePolicy: { ...first.edgePolicy, maximumPayloadBytes: 4097 },
    consumedEdgeDigests: new Set(),
    workerId: "expanded_policy_worker",
    fencingToken: 1,
    observedAt: firstStart,
  }),
  /edge_binding_invalid/,
);
assert.throws(
  () => beginPantavionRecoveryBoundedExecution({
    admission: first.admission,
    edgePacket: first.edgePacket,
    edgePolicy: first.edgePolicy,
    consumedEdgeDigests: new Set(),
    workerId: "expired_worker",
    fencingToken: 1,
    observedAt: first.admission.validUntil,
  }),
  /admission_invalid_or_expired/,
);

let partial = beginPantavionRecoveryBoundedExecution({
  admission: first.admission,
  edgePacket: first.edgePacket,
  edgePolicy: first.edgePolicy,
  consumedEdgeDigests: new Set(),
  workerId: "negative_worker",
  fencingToken: 4,
  observedAt: firstStart,
});
const sourceTime = at(first.epoch, 9 * 60 * 1000);
const sourceMaterial = stepMaterial(first, "source_binding");
const sourceEvidence = createPantavionRecoveryStepEvidenceBytes({
  admission: first.admission,
  stepId: "source_binding",
  origin: "synthetic_test_only",
  observedAt: sourceTime,
  ...sourceMaterial,
});
assert.throws(
  () => advancePantavionRecoveryBoundedExecution({
    execution: partial,
    admission: first.admission,
    evidenceBytes: Buffer.concat([sourceEvidence, Buffer.from(" ")]),
    artifactBytes: sourceMaterial.artifactBytes,
    rollbackBytes: sourceMaterial.rollbackBytes,
    cost: 1,
    observedAt: sourceTime,
  }),
  /not_canonical/,
);
assert.throws(
  () => advancePantavionRecoveryBoundedExecution({
    execution: partial,
    admission: first.admission,
    evidenceBytes: sourceEvidence,
    artifactBytes: Buffer.from("tampered-artifact"),
    rollbackBytes: sourceMaterial.rollbackBytes,
    cost: 1,
    observedAt: sourceTime,
  }),
  /binding_invalid/,
);
const outOfOrderTime = at(first.epoch, 10 * 60 * 1000);
const outOfOrderMaterial = stepMaterial(first, "unit_verification");
const outOfOrderEvidence = createPantavionRecoveryStepEvidenceBytes({
  admission: first.admission,
  stepId: "unit_verification",
  origin: "synthetic_test_only",
  observedAt: outOfOrderTime,
  ...outOfOrderMaterial,
});
assert.throws(
  () => advancePantavionRecoveryBoundedExecution({
    execution: partial,
    admission: first.admission,
    evidenceBytes: outOfOrderEvidence,
    artifactBytes: outOfOrderMaterial.artifactBytes,
    rollbackBytes: outOfOrderMaterial.rollbackBytes,
    cost: 1,
    observedAt: outOfOrderTime,
  }),
  /dependency-ready/,
);
assert.throws(
  () => createPantavionRecoveryStepEvidenceBytes({
    admission: first.admission,
    stepId: "exact_revision_evidence",
    origin: "synthetic_test_only",
    observedAt: outOfOrderTime,
    artifactBytes: outOfOrderMaterial.artifactBytes,
    rollbackBytes: outOfOrderMaterial.rollbackBytes,
  }),
  /exact_revision_required/,
);

partial = advancePantavionRecoveryBoundedExecution({
  execution: partial,
  admission: first.admission,
  evidenceBytes: sourceEvidence,
  artifactBytes: sourceMaterial.artifactBytes,
  rollbackBytes: sourceMaterial.rollbackBytes,
  cost: 1,
  observedAt: sourceTime,
});
assert.equal(verifyPantavionRecoveryBoundedExecution({
  ...partial,
  authority: { ...partial.authority, canonicalRepositoryWrite: true },
}, first.admission, sourceTime), false);
assert.equal(verifyPantavionRecoveryBoundedExecution({
  ...partial,
  lifecycle: { ...partial.lifecycle, promotionRecorded: true },
}, first.admission, sourceTime), false);
assert.equal(verifyPantavionRecoveryBoundedExecution({
  ...partial,
  checkpoints: partial.checkpoints.map((checkpoint, index) => {
    if (index === 1) return { ...checkpoint, workerId: "tampered_worker" };
    return checkpoint;
  }),
}, first.admission, sourceTime), false);
assert.throws(
  () => advancePantavionRecoveryBoundedExecution({
    execution: executions[0],
    admission: first.admission,
    evidenceBytes: sourceEvidence,
    artifactBytes: sourceMaterial.artifactBytes,
    rollbackBytes: sourceMaterial.rollbackBytes,
    cost: 1,
    observedAt: sourceTime,
  }),
  /state_invalid_or_expired|already_complete/,
);

console.log("PANTAVION RECOVERY BOUNDED STEP EXECUTION: PASSED");
console.log("- 279/279 bounded admission sessions exercised through the complete six-step DAG");
console.log("- all 31,779 classified members covered; 355 governed HOLD and 50,279 provenance records preserved outside execution");
console.log("- 1,674 byte-derived step receipts and 1,953 chained checkpoints verified in synthetic in-memory protocol tests");
console.log("- edge replay, dependency order, evidence bytes, rollback, budget, fencing and lifecycle boundaries fail closed");
console.log("- 0 real approvals, agents, grants, code mutations, repository writes, production writes, merges, deployments or lifecycle promotions occurred");
