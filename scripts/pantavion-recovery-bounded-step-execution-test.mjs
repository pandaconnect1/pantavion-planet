import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
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
import {
  createPantavionRecoveryImplementationReviewPacket,
  verifyPantavionRecoveryImplementationReviewPacket,
} from "../core/recovery/pantavion-recovery-implementation-review.ts";
import {
  createPantavionRecoveryRepositoryAttestationEvaluation,
  derivePantavionAttestationPublicKeyFingerprint,
  derivePantavionRepositoryObservationDigest,
  encodePantavionRepositoryObservationForSignature,
  PANTAVION_RECOVERY_REQUIRED_REPOSITORY_GATES,
  verifyPantavionRecoveryRepositoryAttestationEvaluation,
} from "../core/recovery/pantavion-recovery-repository-attestation.ts";
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

function createSignedRepositoryObservation({
  reviewPacket,
  privateKey,
  keyId,
  observedAt,
  headSha = reviewPacket.revision.isolatedCommit,
  workflowNames = [...PANTAVION_RECOVERY_REQUIRED_REPOSITORY_GATES],
}) {
  const body = {
    marker: "pantavion_trusted_github_repository_observation_v1",
    provider: "github",
    collector: "github_app_connector",
    repository,
    observedAt,
    pullRequest: {
      number: 375,
      state: "open",
      merged: false,
      draft: false,
      mergeable: true,
      headBranch: "feature/recovery-repository-attestation-gate-20260901",
      baseBranch: "feature/recovery-implementation-review-packets-20260831",
      headSha,
      baseSha: reviewPacket.source.baseRevision,
      changedFiles: [
        "core/recovery/pantavion-recovery-repository-attestation.ts",
        "scripts/pantavion-recovery-bounded-step-execution-test.mjs",
      ],
    },
    revision: {
      commitSha: headSha,
      treeSha: sha256(`git-tree|${reviewPacket.packetDigest}`).slice(0, 40),
      parentSha: reviewPacket.source.baseRevision,
      isolatedTreeDigest: reviewPacket.revision.isolatedTreeDigest,
    },
    workflows: workflowNames.map((name, index) => ({
      runId: 900000 + index,
      name,
      headSha,
      status: "completed",
      conclusion: "success",
      artifact: index === 0
        ? {
            id: 800000,
            name: "synthetic-repository-attestation-fixture",
            sizeInBytes: 4096,
            digest: sha256(`workflow-artifact|${reviewPacket.packetDigest}`),
          }
        : null,
    })),
    evidence: {
      implementationReviewPacketDigest: reviewPacket.packetDigest,
      finalEvidenceDigest: reviewPacket.revision.evidenceDigest,
      finalArtifactDigest: reviewPacket.revision.artifactDigest,
      rollbackDigest: reviewPacket.revision.rollbackDigest,
    },
    connectorBoundary: {
      installationBound: true,
      readOnlyObservation: true,
      repositoryMutationPerformed: false,
      productionDataAccessed: false,
    },
  };
  const observationDigest = derivePantavionRepositoryObservationDigest(body);
  const payload = encodePantavionRepositoryObservationForSignature({ body, observationDigest });
  return {
    ...body,
    observationDigest,
    signature: {
      keyId,
      algorithm: "ed25519",
      valueBase64: sign(null, payload, privateKey).toString("base64"),
    },
  };
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

function stepMaterial(fixture, stepId, origin = "synthetic_test_only") {
  const artifactBytes = Buffer.from(JSON.stringify({
    admissionDigest: fixture.admission.admissionDigest,
    buildOrderId: fixture.packet.buildOrderId,
    memberFingerprint: fixture.packet.membership.orderedMemberWorkUnitIdFingerprint,
    readinessDigest: fixture.packet.readinessDigest,
    stepId,
    synthetic: origin === "synthetic_test_only",
  }));
  let action = "discard_isolated_workspace_output";
  if (stepId === "source_binding") action = "read_only_no_write";
  const rollbackBytes = Buffer.from(JSON.stringify({
    admissionDigest: fixture.admission.admissionDigest,
    stepId,
    action,
    synthetic: origin === "synthetic_test_only",
  }));
  let isolatedCommit = null;
  let isolatedTreeDigest = null;
  if (stepId === "exact_revision_evidence") {
    isolatedCommit = sha256(`commit|${fixture.admission.admissionDigest}`).slice(0, 40);
    isolatedTreeDigest = sha256(`tree|${fixture.admission.admissionDigest}`);
  }
  return { artifactBytes, rollbackBytes, isolatedCommit, isolatedTreeDigest };
}

function executeFixture(fixture, origin = "synthetic_test_only") {
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
    const material = stepMaterial(fixture, stepId, origin);
    const evidenceBytes = createPantavionRecoveryStepEvidenceBytes({
      admission: fixture.admission,
      stepId,
      origin,
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
const reviewPackets = [];
let previousCapsuleDigest = null;
let previousAdmissionDigest = null;
let previousReviewPacketDigest = null;
for (const [offset, packet] of readinessIndex.packets.entries()) {
  const fixture = createFixture(packet, offset, previousCapsuleDigest, previousAdmissionDigest);
  const execution = executeFixture(fixture);
  const finalObservedAt = at(fixture.epoch, 14 * 60 * 1000);
  const finalMaterial = stepMaterial(fixture, "exact_revision_evidence");
  const finalEvidenceBytes = createPantavionRecoveryStepEvidenceBytes({
    admission: fixture.admission,
    stepId: "exact_revision_evidence",
    origin: "synthetic_test_only",
    observedAt: finalObservedAt,
    ...finalMaterial,
  });
  const reviewPacket = createPantavionRecoveryImplementationReviewPacket({
    execution,
    admission: fixture.admission,
    readinessPacket: packet,
    finalEvidenceBytes,
    finalArtifactBytes: finalMaterial.artifactBytes,
    finalRollbackBytes: finalMaterial.rollbackBytes,
    previousReviewPacketDigest,
    observedAt: at(fixture.epoch, 15 * 60 * 1000),
  });
  fixtures.push(fixture);
  executions.push(execution);
  reviewPackets.push(reviewPacket);
  previousCapsuleDigest = fixture.capsule.capsuleDigest;
  previousAdmissionDigest = fixture.admission.admissionDigest;
  previousReviewPacketDigest = reviewPacket.packetDigest;
}

const attestationEvaluations = [];
let previousEvaluationDigest = null;
for (const [index, reviewPacket] of reviewPackets.entries()) {
  const evaluation = createPantavionRecoveryRepositoryAttestationEvaluation({
    reviewPacket,
    previousEvaluationDigest,
    observedAt: at(fixtures[index].epoch, 16 * 60 * 1000),
  });
  attestationEvaluations.push(evaluation);
  previousEvaluationDigest = evaluation.evaluationDigest;
}

assert.equal(executions.length, 279);
assert.equal(fixtures.reduce((sum, fixture) => sum + fixture.packet.membership.memberCount, 0), 31779);
assert.equal(readinessIndex.corpus.governedHoldCount + readinessIndex.corpus.recursiveProvenanceCount, 50634);
assert.equal(new Set(executions.map((execution) => execution.executionDigest)).size, 279);
assert.equal(executions.reduce((sum, execution) => sum + execution.session.receipts.length, 0), 1674);
assert.equal(executions.reduce((sum, execution) => sum + execution.checkpoints.length, 0), 1953);
assert.equal(reviewPackets.length, 279);
assert.equal(new Set(reviewPackets.map((packet) => packet.packetDigest)).size, 279);
assert.equal(reviewPackets.reduce((sum, packet) => sum + packet.corpus.memberCount, 0), 31779);
assert.equal(attestationEvaluations.length, 279);
assert.equal(new Set(attestationEvaluations.map((evaluation) => evaluation.evaluationDigest)).size, 279);
assert.equal(attestationEvaluations.reduce((sum, evaluation) => sum + evaluation.review.memberCount, 0), 31779);
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
for (const [index, packet] of reviewPackets.entries()) {
  const finalMaterial = stepMaterial(fixtures[index], "exact_revision_evidence");
  const finalEvidenceBytes = createPantavionRecoveryStepEvidenceBytes({
    admission: fixtures[index].admission,
    stepId: "exact_revision_evidence",
    origin: "synthetic_test_only",
    observedAt: at(fixtures[index].epoch, 14 * 60 * 1000),
    ...finalMaterial,
  });
  assert.equal(packet.status, "synthetic_rehearsal");
  assert.equal(packet.protocol.receiptCount, 6);
  assert.equal(packet.protocol.checkpointCount, 7);
  assert.equal(packet.evidence.origin, "synthetic_test_only");
  assert.equal(packet.evidence.syntheticOnly, true);
  assert.equal(packet.evidence.realWorkspaceEvidence, false);
  assert.equal(packet.review.currentLifecycleState, "IDEA");
  assert.equal(packet.review.requestedLifecycleState, "CODED");
  assert.equal(packet.review.founderAal2Required, true);
  assert.equal(packet.review.founderDecisionRecorded, false);
  assert.equal(packet.review.readyForLifecyclePromotion, false);
  assert.equal(packet.review.blockers.includes("synthetic_inputs_not_external_evidence"), true);
  assert.equal(packet.authority.canonicalRepositoryWrite, false);
  assert.equal(packet.authority.productionWrite, false);
  assert.equal(packet.authority.merge, false);
  assert.equal(packet.authority.deployment, false);
  assert.equal(packet.authority.release, false);
  assert.equal(packet.authority.lifecyclePromotion, false);
  assert.equal(packet.completion, false);
  assert.equal(
    packet.previousReviewPacketDigest,
    index === 0 ? null : reviewPackets[index - 1].packetDigest,
  );
  assert.equal(verifyPantavionRecoveryImplementationReviewPacket({
    packet,
    execution: executions[index],
    admission: fixtures[index].admission,
    readinessPacket: fixtures[index].packet,
    finalEvidenceBytes,
    finalArtifactBytes: finalMaterial.artifactBytes,
    finalRollbackBytes: finalMaterial.rollbackBytes,
    observedAt: at(fixtures[index].epoch, 15 * 60 * 1000),
  }), true);
}
for (const [index, evaluation] of attestationEvaluations.entries()) {
  assert.equal(evaluation.status, "synthetic_rehearsal_blocked");
  assert.equal(evaluation.attestation.observationProvided, false);
  assert.equal(evaluation.attestation.trustAnchorProvided, false);
  assert.equal(evaluation.attestation.verified, false);
  assert.equal(evaluation.ownerControl.initialScopeApprovalProvided, false);
  assert.equal(evaluation.ownerControl.initialScopeApprovalBound, false);
  assert.equal(evaluation.ownerControl.postCodeFounderReviewRequired, true);
  assert.equal(evaluation.ownerControl.postCodeFounderReviewRecorded, false);
  assert.equal(evaluation.lifecycle.repositoryEvidenceVerified, false);
  assert.equal(evaluation.lifecycle.eligibleForFounderCodeReview, false);
  assert.equal(evaluation.lifecycle.readyForLifecyclePromotion, false);
  assert.equal(evaluation.lifecycle.promotionRecorded, false);
  assert.equal(evaluation.lifecycle.blockers.includes("synthetic_rehearsal_not_external_evidence"), true);
  assert.equal(Object.values(evaluation.authority).every((value) => value === false), true);
  assert.equal(evaluation.completion, false);
  assert.equal(
    evaluation.previousEvaluationDigest,
    index === 0 ? null : attestationEvaluations[index - 1].evaluationDigest,
  );
  assert.equal(verifyPantavionRecoveryRepositoryAttestationEvaluation(evaluation, {
    reviewPacket: reviewPackets[index],
    previousEvaluationDigest: index === 0 ? null : attestationEvaluations[index - 1].evaluationDigest,
    observedAt: at(fixtures[index].epoch, 16 * 60 * 1000),
  }), true);
}

const first = fixtures[0];
const firstStart = at(first.epoch, 8 * 60 * 1000);
const firstFinalObservedAt = at(first.epoch, 14 * 60 * 1000);
const firstReviewObservedAt = at(first.epoch, 15 * 60 * 1000);
const firstFinalMaterial = stepMaterial(first, "exact_revision_evidence");
const firstFinalEvidence = createPantavionRecoveryStepEvidenceBytes({
  admission: first.admission,
  stepId: "exact_revision_evidence",
  origin: "synthetic_test_only",
  observedAt: firstFinalObservedAt,
  ...firstFinalMaterial,
});

const realWorkspaceExecution = executeFixture(first, "isolated_workspace");
const realWorkspaceFinalMaterial = stepMaterial(first, "exact_revision_evidence", "isolated_workspace");
const realWorkspaceFinalEvidence = createPantavionRecoveryStepEvidenceBytes({
  admission: first.admission,
  stepId: "exact_revision_evidence",
  origin: "isolated_workspace",
  observedAt: firstFinalObservedAt,
  ...realWorkspaceFinalMaterial,
});
const realWorkspaceReview = createPantavionRecoveryImplementationReviewPacket({
  execution: realWorkspaceExecution,
  admission: first.admission,
  readinessPacket: first.packet,
  finalEvidenceBytes: realWorkspaceFinalEvidence,
  finalArtifactBytes: realWorkspaceFinalMaterial.artifactBytes,
  finalRollbackBytes: realWorkspaceFinalMaterial.rollbackBytes,
  previousReviewPacketDigest: null,
  observedAt: firstReviewObservedAt,
});
assert.equal(realWorkspaceReview.status, "external_attestation_required");
assert.equal(realWorkspaceReview.evidence.syntheticOnly, false);
assert.equal(realWorkspaceReview.evidence.realWorkspaceEvidence, true);

const { privateKey: attestationPrivateKey, publicKey: attestationPublicKey } =
  generateKeyPairSync("ed25519");
const attestationPublicKeyPem = attestationPublicKey
  .export({ format: "pem", type: "spki" })
  .toString();
const attestationKeyId = "pantavion-test-github-attestation-key-v1";
const trustAnchor = {
  marker: "pantavion_repository_attestation_trust_anchor_v1",
  repository,
  purpose: "recovery_implementation_repository_attestation",
  keyId: attestationKeyId,
  algorithm: "ed25519",
  publicKeyPem: attestationPublicKeyPem,
  publicKeyFingerprint: derivePantavionAttestationPublicKeyFingerprint(attestationPublicKeyPem),
  enabled: true,
  validFrom: at(first.epoch, -60 * 60 * 1000),
  validUntil: at(first.epoch, 120 * 60 * 1000),
};
const repositoryObservation = createSignedRepositoryObservation({
  reviewPacket: realWorkspaceReview,
  privateKey: attestationPrivateKey,
  keyId: attestationKeyId,
  observedAt: at(first.epoch, 16 * 60 * 1000),
});

const attestedWithoutOwner = createPantavionRecoveryRepositoryAttestationEvaluation({
  reviewPacket: realWorkspaceReview,
  repositoryObservation,
  trustAnchor,
  previousEvaluationDigest: null,
  observedAt: at(first.epoch, 17 * 60 * 1000),
});
assert.equal(attestedWithoutOwner.status, "external_repository_attestation_required");
assert.equal(attestedWithoutOwner.attestation.verified, true);
assert.equal(attestedWithoutOwner.ownerControl.initialScopeApprovalBound, false);
assert.equal(attestedWithoutOwner.lifecycle.eligibleForFounderCodeReview, false);
assert.equal(attestedWithoutOwner.lifecycle.blockers.includes("initial_founder_scope_approval_missing"), true);

const repositoryAttestedEvaluation = createPantavionRecoveryRepositoryAttestationEvaluation({
  reviewPacket: realWorkspaceReview,
  ownerReceipt: first.ownerReceipt,
  repositoryObservation,
  trustAnchor,
  previousEvaluationDigest: null,
  observedAt: at(first.epoch, 17 * 60 * 1000),
});
assert.equal(repositoryAttestedEvaluation.status, "repository_attested_founder_review_required");
assert.equal(repositoryAttestedEvaluation.attestation.verified, true);
assert.equal(repositoryAttestedEvaluation.attestation.successfulWorkflowCount, 3);
assert.equal(repositoryAttestedEvaluation.attestation.artifactCount, 1);
assert.equal(repositoryAttestedEvaluation.ownerControl.initialScopeApprovalBound, true);
assert.equal(repositoryAttestedEvaluation.ownerControl.postCodeFounderReviewRecorded, false);
assert.equal(repositoryAttestedEvaluation.lifecycle.repositoryEvidenceVerified, true);
assert.equal(repositoryAttestedEvaluation.lifecycle.eligibleForFounderCodeReview, true);
assert.equal(repositoryAttestedEvaluation.lifecycle.readyForLifecyclePromotion, false);
assert.equal(repositoryAttestedEvaluation.lifecycle.promotionRecorded, false);
assert.equal(Object.values(repositoryAttestedEvaluation.authority).every((value) => value === false), true);
assert.equal(repositoryAttestedEvaluation.completion, false);
assert.equal(verifyPantavionRecoveryRepositoryAttestationEvaluation(
  repositoryAttestedEvaluation,
  {
    reviewPacket: realWorkspaceReview,
    ownerReceipt: first.ownerReceipt,
    repositoryObservation,
    trustAnchor,
    previousEvaluationDigest: null,
    observedAt: at(first.epoch, 17 * 60 * 1000),
  },
), true);

const forgedSyntheticEvaluation = createPantavionRecoveryRepositoryAttestationEvaluation({
  reviewPacket: reviewPackets[0],
  ownerReceipt: first.ownerReceipt,
  repositoryObservation,
  trustAnchor,
  previousEvaluationDigest: null,
  observedAt: at(first.epoch, 17 * 60 * 1000),
});
assert.equal(forgedSyntheticEvaluation.status, "synthetic_rehearsal_blocked");
assert.equal(forgedSyntheticEvaluation.attestation.observationProvided, true);
assert.equal(forgedSyntheticEvaluation.attestation.verified, false);
assert.equal(forgedSyntheticEvaluation.ownerControl.initialScopeApprovalProvided, true);
assert.equal(forgedSyntheticEvaluation.ownerControl.initialScopeApprovalBound, false);
assert.equal(forgedSyntheticEvaluation.lifecycle.eligibleForFounderCodeReview, false);
assert.equal(forgedSyntheticEvaluation.lifecycle.readyForLifecyclePromotion, false);

const alteredSignature = `${repositoryObservation.signature.valueBase64[0] === "A" ? "B" : "A"}${repositoryObservation.signature.valueBase64.slice(1)}`;
assert.throws(
  () => createPantavionRecoveryRepositoryAttestationEvaluation({
    reviewPacket: realWorkspaceReview,
    ownerReceipt: first.ownerReceipt,
    repositoryObservation: {
      ...repositoryObservation,
      signature: { ...repositoryObservation.signature, valueBase64: alteredSignature },
    },
    trustAnchor,
    previousEvaluationDigest: null,
    observedAt: at(first.epoch, 17 * 60 * 1000),
  }),
  /signature_invalid/,
);
const wrongHeadObservation = createSignedRepositoryObservation({
  reviewPacket: realWorkspaceReview,
  privateKey: attestationPrivateKey,
  keyId: attestationKeyId,
  observedAt: at(first.epoch, 16 * 60 * 1000),
  headSha: sha256("wrong-attested-head").slice(0, 40),
});
assert.throws(
  () => createPantavionRecoveryRepositoryAttestationEvaluation({
    reviewPacket: realWorkspaceReview,
    ownerReceipt: first.ownerReceipt,
    repositoryObservation: wrongHeadObservation,
    trustAnchor,
    previousEvaluationDigest: null,
    observedAt: at(first.epoch, 17 * 60 * 1000),
  }),
  /pull_request_binding_invalid/,
);
const missingGateObservation = createSignedRepositoryObservation({
  reviewPacket: realWorkspaceReview,
  privateKey: attestationPrivateKey,
  keyId: attestationKeyId,
  observedAt: at(first.epoch, 16 * 60 * 1000),
  workflowNames: PANTAVION_RECOVERY_REQUIRED_REPOSITORY_GATES.slice(0, 2),
});
assert.throws(
  () => createPantavionRecoveryRepositoryAttestationEvaluation({
    reviewPacket: realWorkspaceReview,
    ownerReceipt: first.ownerReceipt,
    repositoryObservation: missingGateObservation,
    trustAnchor,
    previousEvaluationDigest: null,
    observedAt: at(first.epoch, 17 * 60 * 1000),
  }),
  /required_workflows_missing/,
);
assert.throws(
  () => createPantavionRecoveryRepositoryAttestationEvaluation({
    reviewPacket: realWorkspaceReview,
    ownerReceipt: first.ownerReceipt,
    repositoryObservation,
    trustAnchor,
    consumedObservationDigests: new Set([repositoryObservation.observationDigest]),
    previousEvaluationDigest: null,
    observedAt: at(first.epoch, 17 * 60 * 1000),
  }),
  /observation_replay_detected/,
);
assert.throws(
  () => createPantavionRecoveryRepositoryAttestationEvaluation({
    reviewPacket: realWorkspaceReview,
    ownerReceipt: fixtures[1].ownerReceipt,
    repositoryObservation,
    trustAnchor,
    previousEvaluationDigest: null,
    observedAt: at(first.epoch, 17 * 60 * 1000),
  }),
  /owner_receipt_binding_invalid/,
);
assert.throws(
  () => createPantavionRecoveryRepositoryAttestationEvaluation({
    reviewPacket: reviewPackets[1],
    previousEvaluationDigest: null,
    observedAt: at(fixtures[1].epoch, 16 * 60 * 1000),
  }),
  /previous_evaluation_required/,
);
assert.equal(verifyPantavionRecoveryRepositoryAttestationEvaluation(
  {
    ...repositoryAttestedEvaluation,
    lifecycle: {
      ...repositoryAttestedEvaluation.lifecycle,
      readyForLifecyclePromotion: true,
    },
  },
  {
    reviewPacket: realWorkspaceReview,
    ownerReceipt: first.ownerReceipt,
    repositoryObservation,
    trustAnchor,
    previousEvaluationDigest: null,
    observedAt: at(first.epoch, 17 * 60 * 1000),
  },
), false);
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

const incompleteReviewExecution = beginPantavionRecoveryBoundedExecution({
  admission: first.admission,
  edgePacket: first.edgePacket,
  edgePolicy: first.edgePolicy,
  consumedEdgeDigests: new Set(),
  workerId: "incomplete_review_worker",
  fencingToken: 2,
  observedAt: firstStart,
});
assert.throws(
  () => createPantavionRecoveryImplementationReviewPacket({
    execution: incompleteReviewExecution,
    admission: first.admission,
    readinessPacket: first.packet,
    finalEvidenceBytes: firstFinalEvidence,
    finalArtifactBytes: firstFinalMaterial.artifactBytes,
    finalRollbackBytes: firstFinalMaterial.rollbackBytes,
    previousReviewPacketDigest: null,
    observedAt: firstReviewObservedAt,
  }),
  /protocol_incomplete/,
);
assert.throws(
  () => createPantavionRecoveryImplementationReviewPacket({
    execution: executions[0],
    admission: first.admission,
    readinessPacket: first.packet,
    finalEvidenceBytes: Buffer.concat([firstFinalEvidence, Buffer.from(" ")]),
    finalArtifactBytes: firstFinalMaterial.artifactBytes,
    finalRollbackBytes: firstFinalMaterial.rollbackBytes,
    previousReviewPacketDigest: null,
    observedAt: firstReviewObservedAt,
  }),
  /not_canonical/,
);
assert.throws(
  () => createPantavionRecoveryImplementationReviewPacket({
    execution: executions[0],
    admission: first.admission,
    readinessPacket: first.packet,
    finalEvidenceBytes: firstFinalEvidence,
    finalArtifactBytes: Buffer.from("tampered-review-artifact"),
    finalRollbackBytes: firstFinalMaterial.rollbackBytes,
    previousReviewPacketDigest: null,
    observedAt: firstReviewObservedAt,
  }),
  /binding_invalid/,
);
const second = fixtures[1];
const secondFinalMaterial = stepMaterial(second, "exact_revision_evidence");
const secondFinalEvidence = createPantavionRecoveryStepEvidenceBytes({
  admission: second.admission,
  stepId: "exact_revision_evidence",
  origin: "synthetic_test_only",
  observedAt: at(second.epoch, 14 * 60 * 1000),
  ...secondFinalMaterial,
});
assert.throws(
  () => createPantavionRecoveryImplementationReviewPacket({
    execution: executions[1],
    admission: second.admission,
    readinessPacket: second.packet,
    finalEvidenceBytes: secondFinalEvidence,
    finalArtifactBytes: secondFinalMaterial.artifactBytes,
    finalRollbackBytes: secondFinalMaterial.rollbackBytes,
    previousReviewPacketDigest: null,
    observedAt: at(second.epoch, 15 * 60 * 1000),
  }),
  /previous_digest_required/,
);
assert.equal(verifyPantavionRecoveryImplementationReviewPacket({
  packet: {
    ...reviewPackets[0],
    authority: { ...reviewPackets[0].authority, lifecyclePromotion: true },
  },
  execution: executions[0],
  admission: first.admission,
  readinessPacket: first.packet,
  finalEvidenceBytes: firstFinalEvidence,
  finalArtifactBytes: firstFinalMaterial.artifactBytes,
  finalRollbackBytes: firstFinalMaterial.rollbackBytes,
  observedAt: firstReviewObservedAt,
}), false);
assert.equal(verifyPantavionRecoveryImplementationReviewPacket({
  packet: { ...reviewPackets[0], status: "external_attestation_required" },
  execution: executions[0],
  admission: first.admission,
  readinessPacket: first.packet,
  finalEvidenceBytes: firstFinalEvidence,
  finalArtifactBytes: firstFinalMaterial.artifactBytes,
  finalRollbackBytes: firstFinalMaterial.rollbackBytes,
  observedAt: firstReviewObservedAt,
}), false);
assert.equal(verifyPantavionRecoveryImplementationReviewPacket({
  packet: reviewPackets[0],
  execution: executions[0],
  admission: first.admission,
  readinessPacket: first.packet,
  finalEvidenceBytes: firstFinalEvidence,
  finalArtifactBytes: Buffer.from("tampered-verifier-artifact"),
  finalRollbackBytes: firstFinalMaterial.rollbackBytes,
  observedAt: firstReviewObservedAt,
}), false);
assert.equal(verifyPantavionRecoveryImplementationReviewPacket({
  packet: reviewPackets[0],
  execution: executions[0],
  admission: first.admission,
  readinessPacket: {
    ...first.packet,
    membership: { ...first.packet.membership, memberCount: first.packet.membership.memberCount + 1 },
  },
  finalEvidenceBytes: firstFinalEvidence,
  finalArtifactBytes: firstFinalMaterial.artifactBytes,
  finalRollbackBytes: firstFinalMaterial.rollbackBytes,
  observedAt: firstReviewObservedAt,
}), false);

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
console.log("- 279 chained implementation-review packets bind every session to its exact isolated revision and corpus membership");
console.log("- 279 chained repository-attestation evaluations keep every synthetic review blocked from Founder code review");
console.log("- Ed25519 trust-anchor, exact PR/commit/tree/workflow/artifact, owner-receipt and replay gates verified with isolated fixtures");
console.log("- synthetic evidence remains rehearsal-only and cannot request or record a CODED lifecycle promotion");
console.log("- edge replay, dependency order, evidence bytes, rollback, budget, fencing and lifecycle boundaries fail closed");
console.log("- 0 real approvals, agents, grants, code mutations, repository writes, production writes, merges, deployments or lifecycle promotions occurred");
