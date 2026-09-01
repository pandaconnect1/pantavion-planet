import {
  createHash,
  createPublicKey,
  verify as verifyDetachedSignature,
} from "node:crypto";

import type { PantavionRecoveryImplementationReviewPacket } from "./pantavion-recovery-implementation-review.ts";
import {
  verifyRecoveryBuildOwnerDecisionReceipt,
  type RecoveryBuildOwnerDecisionReceipt,
} from "./pantavion-recovery-owner-decision.ts";

const PANTAVION_REPOSITORY = "pandaconnect1/pantavion-planet" as const;
const MAX_ATTESTATION_AGE_MS = 24 * 60 * 60 * 1000;

export const PANTAVION_RECOVERY_REQUIRED_REPOSITORY_GATES = [
  "Pantavion CI + Deploy Spine",
  "Pantavion Runtime Safety",
  "pantavion-guardian",
] as const;

export type PantavionRecoveryRepositoryAttestationStatus =
  | "synthetic_rehearsal_blocked"
  | "external_repository_attestation_required"
  | "repository_attested_founder_review_required";

export interface PantavionRepositoryAttestationTrustAnchor {
  marker: "pantavion_repository_attestation_trust_anchor_v1";
  repository: typeof PANTAVION_REPOSITORY;
  purpose: "recovery_implementation_repository_attestation";
  keyId: string;
  algorithm: "ed25519";
  publicKeyPem: string;
  publicKeyFingerprint: string;
  enabled: true;
  validFrom: string;
  validUntil: string;
}

export interface PantavionGitHubWorkflowArtifactObservation {
  id: number;
  name: string;
  sizeInBytes: number;
  digest: string;
}

export interface PantavionGitHubWorkflowObservation {
  runId: number;
  name: string;
  headSha: string;
  status: "completed";
  conclusion: "success";
  artifact: PantavionGitHubWorkflowArtifactObservation | null;
}

export interface PantavionRepositoryObservationBody {
  marker: "pantavion_trusted_github_repository_observation_v1";
  provider: "github";
  collector: "github_app_connector";
  repository: typeof PANTAVION_REPOSITORY;
  observedAt: string;
  pullRequest: {
    number: number;
    state: "open";
    merged: false;
    draft: false;
    mergeable: true;
    headBranch: string;
    baseBranch: string;
    headSha: string;
    baseSha: string;
    changedFiles: string[];
  };
  revision: {
    commitSha: string;
    treeSha: string;
    parentSha: string;
    isolatedTreeDigest: string;
  };
  workflows: PantavionGitHubWorkflowObservation[];
  evidence: {
    implementationReviewPacketDigest: string;
    finalEvidenceDigest: string;
    finalArtifactDigest: string;
    rollbackDigest: string;
  };
  connectorBoundary: {
    installationBound: true;
    readOnlyObservation: true;
    repositoryMutationPerformed: false;
    productionDataAccessed: false;
  };
}

export interface PantavionSignedRepositoryObservation
  extends PantavionRepositoryObservationBody {
  observationDigest: string;
  signature: {
    keyId: string;
    algorithm: "ed25519";
    valueBase64: string;
  };
}

export interface PantavionRecoveryRepositoryAttestationEvaluation {
  marker: "pantavion_recovery_repository_attestation_evaluation_v1";
  evaluationId: string;
  status: PantavionRecoveryRepositoryAttestationStatus;
  repository: typeof PANTAVION_REPOSITORY;
  observedAt: string;
  review: {
    packetId: string;
    packetDigest: string;
    readinessOrdinal: number;
    buildOrderId: string;
    memberCount: number;
    evidenceOrigin: PantavionRecoveryImplementationReviewPacket["evidence"]["origin"];
    isolatedCommit: string;
    isolatedTreeDigest: string;
  };
  attestation: {
    observationProvided: boolean;
    trustAnchorProvided: boolean;
    verified: boolean;
    observationDigest: string | null;
    keyId: string | null;
    pullRequestNumber: number | null;
    successfulWorkflowCount: number;
    artifactCount: number;
  };
  ownerControl: {
    initialScopeApprovalProvided: boolean;
    initialScopeApprovalBound: boolean;
    receiptDigest: string | null;
    ownerUserId: string | null;
    postCodeFounderReviewRequired: true;
    postCodeFounderReviewRecorded: false;
  };
  lifecycle: {
    currentImplementationState: "IDEA";
    requestedImplementationState: "CODED";
    repositoryEvidenceVerified: boolean;
    eligibleForFounderCodeReview: boolean;
    readyForLifecyclePromotion: false;
    promotionRecorded: false;
    blockers: string[];
  };
  authority: {
    codeMutation: false;
    canonicalRepositoryWrite: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
    lifecyclePromotion: false;
  };
  previousEvaluationDigest: string | null;
  completion: false;
  evaluationDigest: string;
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("repository_attestation_non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  throw new Error("repository_attestation_unsupported_digest_value");
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertSha256(label: string, value: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label}_must_be_sha256`);
}

function assertGitSha(label: string, value: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(`${label}_must_be_git_sha`);
}

function timestamp(label: string, value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label}_invalid`);
  return parsed;
}

function exactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function assertSafeText(label: string, value: string, maximumLength: number): void {
  if (!value.trim() || value !== value.trim() || value.length > maximumLength || /[\u0000-\u001f]/.test(value)) {
    throw new Error(`${label}_invalid`);
  }
}

function assertSafeRepositoryPath(value: string): void {
  assertSafeText("repository_attestation_changed_file", value, 512);
  if (
    value.startsWith("/") ||
    value.includes("\\") ||
    value.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) throw new Error("repository_attestation_changed_file_unsafe");
}

function validateReviewPacket(packet: PantavionRecoveryImplementationReviewPacket): void {
  const { packetDigest, ...unsigned } = packet;
  assertSha256("repository_attestation_review_packet", packetDigest);
  if (sha256(canonicalJson(unsigned)) !== packetDigest) {
    throw new Error("repository_attestation_review_packet_digest_mismatch");
  }
  if (
    packet.marker !== "pantavion_recovery_implementation_review_v1" ||
    packet.repository !== PANTAVION_REPOSITORY ||
    !/^recovery_review_[0-9a-f]{64}$/.test(packet.packetId) ||
    !Number.isInteger(packet.source.readinessOrdinal) ||
    packet.source.readinessOrdinal < 1 ||
    !Number.isInteger(packet.corpus.memberCount) ||
    packet.corpus.memberCount < 1 ||
    packet.review.currentLifecycleState !== "IDEA" ||
    packet.review.requestedLifecycleState !== "CODED" ||
    packet.review.founderAal2Required !== true ||
    packet.review.founderDecisionRequired !== true ||
    packet.review.founderDecisionRecorded !== false ||
    packet.review.readyForLifecyclePromotion !== false ||
    packet.evidence.externalRevisionAttestationRequired !== true ||
    packet.completion !== false
  ) throw new Error("repository_attestation_review_boundary_invalid");
  timestamp("repository_attestation_review_observed_at", packet.observedAt);
  assertGitSha("repository_attestation_review_commit", packet.revision.isolatedCommit);
  assertSha256("repository_attestation_review_tree", packet.revision.isolatedTreeDigest);
  assertSha256("repository_attestation_review_evidence", packet.revision.evidenceDigest);
  assertSha256("repository_attestation_review_artifact", packet.revision.artifactDigest);
  assertSha256("repository_attestation_review_rollback", packet.revision.rollbackDigest);
  if (
    packet.evidence.origin === "synthetic_test_only" &&
    (packet.status !== "synthetic_rehearsal" ||
      packet.evidence.syntheticOnly !== true ||
      packet.evidence.realWorkspaceEvidence !== false)
  ) throw new Error("repository_attestation_synthetic_review_boundary_invalid");
  if (
    packet.evidence.origin === "isolated_workspace" &&
    (packet.status !== "external_attestation_required" ||
      packet.evidence.syntheticOnly !== false ||
      packet.evidence.realWorkspaceEvidence !== true)
  ) throw new Error("repository_attestation_workspace_review_boundary_invalid");
  if (Object.values(packet.authority).some((value) => value !== false)) {
    throw new Error("repository_attestation_review_authority_escalation");
  }
  if (packet.source.readinessOrdinal === 1) {
    if (packet.previousReviewPacketDigest !== null) {
      throw new Error("repository_attestation_first_review_chain_invalid");
    }
  } else {
    if (packet.previousReviewPacketDigest === null) {
      throw new Error("repository_attestation_review_chain_missing");
    }
    assertSha256("repository_attestation_previous_review", packet.previousReviewPacketDigest);
  }
}

function validateOwnerReceipt(
  receipt: RecoveryBuildOwnerDecisionReceipt,
  packet: PantavionRecoveryImplementationReviewPacket,
): void {
  if (!verifyRecoveryBuildOwnerDecisionReceipt(receipt)) {
    throw new Error("repository_attestation_owner_receipt_invalid");
  }
  if (
    receipt.buildOrderId !== packet.source.buildOrderId ||
    receipt.readinessDigest !== packet.source.readinessDigest ||
    receipt.decision !== "approve_scoped_implementation" ||
    receipt.decisionScope !== "isolated_code_preparation_only" ||
    receipt.scopeApprovalRecorded !== true ||
    receipt.nextPermittedLifecycleState !== "CODED" ||
    receipt.assuranceLevel !== "aal2" ||
    receipt.exactRevisionEvidenceRequired !== true ||
    timestamp("repository_attestation_owner_decided_at", receipt.decidedAt) >
      timestamp("repository_attestation_review_observed_at", packet.observedAt)
  ) throw new Error("repository_attestation_owner_receipt_binding_invalid");
  if (Object.values(receipt.authority).some((value) => value !== false)) {
    throw new Error("repository_attestation_owner_receipt_authority_escalation");
  }
}

export function derivePantavionRepositoryObservationDigest(
  body: PantavionRepositoryObservationBody,
): string {
  return sha256(canonicalJson(body));
}

export function encodePantavionRepositoryObservationForSignature(input: {
  body: PantavionRepositoryObservationBody;
  observationDigest: string;
}): Uint8Array {
  assertSha256("repository_attestation_observation", input.observationDigest);
  if (derivePantavionRepositoryObservationDigest(input.body) !== input.observationDigest) {
    throw new Error("repository_attestation_observation_digest_mismatch");
  }
  return new TextEncoder().encode(canonicalJson({
    ...input.body,
    observationDigest: input.observationDigest,
  }));
}

export function derivePantavionAttestationPublicKeyFingerprint(publicKeyPem: string): string {
  const key = createPublicKey(publicKeyPem);
  const der = key.export({ format: "der", type: "spki" });
  return sha256(der);
}

function validateTrustAnchor(
  anchor: PantavionRepositoryAttestationTrustAnchor,
  observationTime: number,
): void {
  if (
    !exactKeys(anchor, [
      "marker", "repository", "purpose", "keyId", "algorithm", "publicKeyPem",
      "publicKeyFingerprint", "enabled", "validFrom", "validUntil",
    ]) ||
    anchor.marker !== "pantavion_repository_attestation_trust_anchor_v1" ||
    anchor.repository !== PANTAVION_REPOSITORY ||
    anchor.purpose !== "recovery_implementation_repository_attestation" ||
    anchor.algorithm !== "ed25519" ||
    anchor.enabled !== true
  ) throw new Error("repository_attestation_trust_anchor_boundary_invalid");
  assertSafeText("repository_attestation_key_id", anchor.keyId, 200);
  assertSha256("repository_attestation_public_key_fingerprint", anchor.publicKeyFingerprint);
  if (createPublicKey(anchor.publicKeyPem).asymmetricKeyType !== "ed25519") {
    throw new Error("repository_attestation_public_key_type_invalid");
  }
  if (derivePantavionAttestationPublicKeyFingerprint(anchor.publicKeyPem) !== anchor.publicKeyFingerprint) {
    throw new Error("repository_attestation_public_key_fingerprint_mismatch");
  }
  const validFrom = timestamp("repository_attestation_key_valid_from", anchor.validFrom);
  const validUntil = timestamp("repository_attestation_key_valid_until", anchor.validUntil);
  if (validUntil <= validFrom || observationTime < validFrom || observationTime >= validUntil) {
    throw new Error("repository_attestation_trust_anchor_expired_or_inactive");
  }
}

function validateObservation(
  observation: PantavionSignedRepositoryObservation,
  anchor: PantavionRepositoryAttestationTrustAnchor,
  packet: PantavionRecoveryImplementationReviewPacket,
  evaluationTime: number,
  consumedObservationDigests: ReadonlySet<string>,
): void {
  if (!exactKeys(observation, [
    "marker", "provider", "collector", "repository", "observedAt", "pullRequest",
    "revision", "workflows", "evidence", "connectorBoundary", "observationDigest", "signature",
  ])) throw new Error("repository_attestation_observation_schema_invalid");
  if (
    observation.marker !== "pantavion_trusted_github_repository_observation_v1" ||
    observation.provider !== "github" ||
    observation.collector !== "github_app_connector" ||
    observation.repository !== PANTAVION_REPOSITORY
  ) throw new Error("repository_attestation_observation_source_invalid");
  const observationTime = timestamp("repository_attestation_observed_at", observation.observedAt);
  const reviewTime = timestamp("repository_attestation_review_observed_at", packet.observedAt);
  if (
    observationTime < reviewTime ||
    observationTime > evaluationTime ||
    evaluationTime - observationTime > MAX_ATTESTATION_AGE_MS
  ) throw new Error("repository_attestation_observation_time_invalid_or_stale");
  validateTrustAnchor(anchor, observationTime);
  assertSha256("repository_attestation_observation", observation.observationDigest);
  if (consumedObservationDigests.has(observation.observationDigest)) {
    throw new Error("repository_attestation_observation_replay_detected");
  }
  const { observationDigest, signature, ...body } = observation;
  if (derivePantavionRepositoryObservationDigest(body) !== observationDigest) {
    throw new Error("repository_attestation_observation_digest_mismatch");
  }
  if (
    !exactKeys(signature, ["keyId", "algorithm", "valueBase64"]) ||
    signature.keyId !== anchor.keyId ||
    signature.algorithm !== "ed25519" ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(signature.valueBase64) ||
    signature.valueBase64.length % 4 !== 0
  ) throw new Error("repository_attestation_signature_envelope_invalid");
  const signatureBytes = Buffer.from(signature.valueBase64, "base64");
  if (signatureBytes.toString("base64") !== signature.valueBase64 || signatureBytes.byteLength !== 64) {
    throw new Error("repository_attestation_signature_encoding_invalid");
  }
  const payload = encodePantavionRepositoryObservationForSignature({ body, observationDigest });
  if (!verifyDetachedSignature(null, payload, createPublicKey(anchor.publicKeyPem), signatureBytes)) {
    throw new Error("repository_attestation_signature_invalid");
  }
  if (
    !exactKeys(observation.pullRequest, [
      "number", "state", "merged", "draft", "mergeable", "headBranch", "baseBranch",
      "headSha", "baseSha", "changedFiles",
    ]) ||
    !Number.isInteger(observation.pullRequest.number) ||
    observation.pullRequest.number < 1 ||
    observation.pullRequest.state !== "open" ||
    observation.pullRequest.merged !== false ||
    observation.pullRequest.draft !== false ||
    observation.pullRequest.mergeable !== true
  ) throw new Error("repository_attestation_pull_request_boundary_invalid");
  assertSafeText("repository_attestation_head_branch", observation.pullRequest.headBranch, 255);
  assertSafeText("repository_attestation_base_branch", observation.pullRequest.baseBranch, 255);
  assertGitSha("repository_attestation_pr_head", observation.pullRequest.headSha);
  assertGitSha("repository_attestation_pr_base", observation.pullRequest.baseSha);
  if (
    observation.pullRequest.headSha !== packet.revision.isolatedCommit ||
    observation.pullRequest.baseSha !== packet.source.baseRevision ||
    observation.pullRequest.changedFiles.length < 1 ||
    observation.pullRequest.changedFiles.length > 64
  ) throw new Error("repository_attestation_pull_request_binding_invalid");
  observation.pullRequest.changedFiles.forEach(assertSafeRepositoryPath);
  const sortedFiles = [...observation.pullRequest.changedFiles].sort();
  if (
    new Set(sortedFiles).size !== sortedFiles.length ||
    canonicalJson(sortedFiles) !== canonicalJson(observation.pullRequest.changedFiles)
  ) throw new Error("repository_attestation_changed_files_not_canonical");
  if (!exactKeys(observation.revision, [
    "commitSha", "treeSha", "parentSha", "isolatedTreeDigest",
  ])) throw new Error("repository_attestation_revision_schema_invalid");
  assertGitSha("repository_attestation_commit", observation.revision.commitSha);
  assertGitSha("repository_attestation_tree", observation.revision.treeSha);
  assertGitSha("repository_attestation_parent", observation.revision.parentSha);
  assertSha256("repository_attestation_isolated_tree", observation.revision.isolatedTreeDigest);
  if (
    observation.revision.commitSha !== packet.revision.isolatedCommit ||
    observation.revision.parentSha !== packet.source.baseRevision ||
    observation.revision.isolatedTreeDigest !== packet.revision.isolatedTreeDigest ||
    observation.pullRequest.headSha !== observation.revision.commitSha ||
    observation.pullRequest.baseSha !== observation.revision.parentSha
  ) throw new Error("repository_attestation_revision_binding_invalid");
  if (!exactKeys(observation.evidence, [
    "implementationReviewPacketDigest", "finalEvidenceDigest", "finalArtifactDigest", "rollbackDigest",
  ])) throw new Error("repository_attestation_evidence_schema_invalid");
  for (const [label, value] of Object.entries(observation.evidence)) {
    assertSha256(`repository_attestation_${label}`, value);
  }
  if (
    observation.evidence.implementationReviewPacketDigest !== packet.packetDigest ||
    observation.evidence.finalEvidenceDigest !== packet.revision.evidenceDigest ||
    observation.evidence.finalArtifactDigest !== packet.revision.artifactDigest ||
    observation.evidence.rollbackDigest !== packet.revision.rollbackDigest
  ) throw new Error("repository_attestation_evidence_binding_invalid");
  if (
    !exactKeys(observation.connectorBoundary, [
      "installationBound", "readOnlyObservation", "repositoryMutationPerformed", "productionDataAccessed",
    ]) ||
    observation.connectorBoundary.installationBound !== true ||
    observation.connectorBoundary.readOnlyObservation !== true ||
    observation.connectorBoundary.repositoryMutationPerformed !== false ||
    observation.connectorBoundary.productionDataAccessed !== false
  ) throw new Error("repository_attestation_connector_boundary_invalid");
  if (observation.workflows.length < PANTAVION_RECOVERY_REQUIRED_REPOSITORY_GATES.length) {
    throw new Error("repository_attestation_required_workflows_missing");
  }
  const runIds = new Set<number>();
  const workflowNames = new Set<string>();
  let artifactCount = 0;
  for (const workflow of observation.workflows) {
    if (!exactKeys(workflow, ["runId", "name", "headSha", "status", "conclusion", "artifact"])) {
      throw new Error("repository_attestation_workflow_schema_invalid");
    }
    if (!Number.isInteger(workflow.runId) || workflow.runId < 1 || runIds.has(workflow.runId)) {
      throw new Error("repository_attestation_workflow_run_id_invalid");
    }
    runIds.add(workflow.runId);
    assertSafeText("repository_attestation_workflow_name", workflow.name, 200);
    workflowNames.add(workflow.name);
    assertGitSha("repository_attestation_workflow_head", workflow.headSha);
    if (
      workflow.headSha !== packet.revision.isolatedCommit ||
      workflow.status !== "completed" ||
      workflow.conclusion !== "success"
    ) throw new Error("repository_attestation_workflow_not_exact_success");
    if (workflow.artifact !== null) {
      artifactCount += 1;
      if (!exactKeys(workflow.artifact, ["id", "name", "sizeInBytes", "digest"])) {
        throw new Error("repository_attestation_artifact_schema_invalid");
      }
      if (
        !Number.isInteger(workflow.artifact.id) ||
        workflow.artifact.id < 1 ||
        !Number.isInteger(workflow.artifact.sizeInBytes) ||
        workflow.artifact.sizeInBytes < 1
      ) throw new Error("repository_attestation_artifact_identity_invalid");
      assertSafeText("repository_attestation_artifact_name", workflow.artifact.name, 300);
      assertSha256("repository_attestation_artifact_digest", workflow.artifact.digest);
    }
  }
  for (const required of PANTAVION_RECOVERY_REQUIRED_REPOSITORY_GATES) {
    if (!workflowNames.has(required)) throw new Error("repository_attestation_required_workflows_missing");
  }
  if (artifactCount < 1) throw new Error("repository_attestation_artifact_missing");
}

type EvaluationInput = {
  reviewPacket: PantavionRecoveryImplementationReviewPacket;
  previousEvaluationDigest: string | null;
  observedAt: string;
} & Partial<{
  ownerReceipt: RecoveryBuildOwnerDecisionReceipt | null;
  repositoryObservation: PantavionSignedRepositoryObservation | null;
  trustAnchor: PantavionRepositoryAttestationTrustAnchor | null;
  consumedObservationDigests: ReadonlySet<string>;
}>;

function buildUnsignedEvaluation(
  input: EvaluationInput,
): Omit<PantavionRecoveryRepositoryAttestationEvaluation, "evaluationDigest"> {
  validateReviewPacket(input.reviewPacket);
  const observedAt = new Date(input.observedAt).toISOString();
  const evaluationTime = timestamp("repository_attestation_evaluation_observed_at", observedAt);
  if (evaluationTime < timestamp("repository_attestation_review_observed_at", input.reviewPacket.observedAt)) {
    throw new Error("repository_attestation_evaluation_before_review");
  }
  if (input.reviewPacket.source.readinessOrdinal === 1) {
    if (input.previousEvaluationDigest !== null) {
      throw new Error("repository_attestation_first_evaluation_chain_invalid");
    }
  } else {
    if (input.previousEvaluationDigest === null) {
      throw new Error("repository_attestation_previous_evaluation_required");
    }
    assertSha256("repository_attestation_previous_evaluation", input.previousEvaluationDigest);
  }

  const synthetic = input.reviewPacket.evidence.syntheticOnly;
  let ownerBound = false;
  let attestationVerified = false;
  if (!synthetic && input.ownerReceipt) {
    validateOwnerReceipt(input.ownerReceipt, input.reviewPacket);
    ownerBound = true;
  }
  if (!synthetic && input.repositoryObservation) {
    if (!input.trustAnchor) throw new Error("repository_attestation_trust_anchor_required");
    validateObservation(
      input.repositoryObservation,
      input.trustAnchor,
      input.reviewPacket,
      evaluationTime,
      input.consumedObservationDigests || new Set<string>(),
    );
    attestationVerified = true;
  }

  const blockers: string[] = [];
  let status: PantavionRecoveryRepositoryAttestationStatus;
  if (synthetic) {
    status = "synthetic_rehearsal_blocked";
    blockers.push(
      "synthetic_rehearsal_not_external_evidence",
      "trusted_repository_attestation_ineligible",
    );
  } else {
    status = "external_repository_attestation_required";
    if (!ownerBound) blockers.push("initial_founder_scope_approval_missing");
    if (!attestationVerified) blockers.push("trusted_repository_attestation_missing");
    if (ownerBound && attestationVerified) {
      status = "repository_attested_founder_review_required";
    }
  }
  blockers.push(
    "post_code_founder_review_not_recorded",
    "canonical_lifecycle_promotion_not_recorded",
  );
  const eligibleForFounderCodeReview = !synthetic && ownerBound && attestationVerified;
  let observation: PantavionSignedRepositoryObservation | null = null;
  if (attestationVerified && input.repositoryObservation) {
    observation = input.repositoryObservation;
  }
  let receipt: RecoveryBuildOwnerDecisionReceipt | null = null;
  if (ownerBound && input.ownerReceipt) {
    receipt = input.ownerReceipt;
  }
  let observationDigest: string | null = null;
  let keyId: string | null = null;
  let pullRequestNumber: number | null = null;
  let successfulWorkflowCount = 0;
  let verifiedArtifactCount = 0;
  if (observation !== null) {
    observationDigest = observation.observationDigest;
    keyId = observation.signature.keyId;
    pullRequestNumber = observation.pullRequest.number;
    successfulWorkflowCount = observation.workflows.length;
    verifiedArtifactCount = observation.workflows.filter(
      (workflow) => workflow.artifact !== null,
    ).length;
  }
  let ownerReceiptDigest: string | null = null;
  let ownerUserId: string | null = null;
  if (receipt !== null) {
    ownerReceiptDigest = receipt.receiptDigest;
    ownerUserId = receipt.ownerUserId;
  }
  const unsigned = {
    marker: "pantavion_recovery_repository_attestation_evaluation_v1" as const,
    evaluationId: `recovery_attestation_evaluation_${sha256(canonicalJson({
      reviewPacketDigest: input.reviewPacket.packetDigest,
      observationDigest,
      ownerReceiptDigest,
      observedAt,
    }))}`,
    status,
    repository: PANTAVION_REPOSITORY,
    observedAt,
    review: {
      packetId: input.reviewPacket.packetId,
      packetDigest: input.reviewPacket.packetDigest,
      readinessOrdinal: input.reviewPacket.source.readinessOrdinal,
      buildOrderId: input.reviewPacket.source.buildOrderId,
      memberCount: input.reviewPacket.corpus.memberCount,
      evidenceOrigin: input.reviewPacket.evidence.origin,
      isolatedCommit: input.reviewPacket.revision.isolatedCommit,
      isolatedTreeDigest: input.reviewPacket.revision.isolatedTreeDigest,
    },
    attestation: {
      observationProvided: input.repositoryObservation != null,
      trustAnchorProvided: input.trustAnchor != null,
      verified: attestationVerified,
      observationDigest,
      keyId,
      pullRequestNumber,
      successfulWorkflowCount,
      artifactCount: verifiedArtifactCount,
    },
    ownerControl: {
      initialScopeApprovalProvided: input.ownerReceipt != null,
      initialScopeApprovalBound: ownerBound,
      receiptDigest: ownerReceiptDigest,
      ownerUserId,
      postCodeFounderReviewRequired: true as const,
      postCodeFounderReviewRecorded: false as const,
    },
    lifecycle: {
      currentImplementationState: "IDEA" as const,
      requestedImplementationState: "CODED" as const,
      repositoryEvidenceVerified: attestationVerified,
      eligibleForFounderCodeReview,
      readyForLifecyclePromotion: false as const,
      promotionRecorded: false as const,
      blockers,
    },
    authority: {
      codeMutation: false as const,
      canonicalRepositoryWrite: false as const,
      productionWrite: false as const,
      merge: false as const,
      deployment: false as const,
      publicExposure: false as const,
      release: false as const,
      lifecyclePromotion: false as const,
    },
    previousEvaluationDigest: input.previousEvaluationDigest,
    completion: false as const,
  };
  return unsigned;
}

function withEvaluationDigest(
  unsigned: Omit<PantavionRecoveryRepositoryAttestationEvaluation, "evaluationDigest">,
): PantavionRecoveryRepositoryAttestationEvaluation {
  return { ...unsigned, evaluationDigest: sha256(canonicalJson(unsigned)) };
}

export function createPantavionRecoveryRepositoryAttestationEvaluation(
  input: EvaluationInput,
): PantavionRecoveryRepositoryAttestationEvaluation {
  return withEvaluationDigest(buildUnsignedEvaluation(input));
}

export function verifyPantavionRecoveryRepositoryAttestationEvaluation(
  evaluation: PantavionRecoveryRepositoryAttestationEvaluation,
  input: EvaluationInput,
): boolean {
  try {
    const expected = withEvaluationDigest(buildUnsignedEvaluation(input));
    return canonicalJson(evaluation) === canonicalJson(expected);
  } catch {
    return false;
  }
}
