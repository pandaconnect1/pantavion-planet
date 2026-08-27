export type KernelTruthStage =
  | "DISCOVERED"
  | "CLASSIFIED"
  | "CANONICALIZED"
  | "IMPLEMENTED"
  | "TESTED"
  | "STAGING_VERIFIED"
  | "DEPLOYED"
  | "PRODUCTION_PROBED"
  | "VERIFIED_LIVE";

export type KernelEvidenceType =
  | "source"
  | "classification"
  | "canonical_record"
  | "commit"
  | "test"
  | "staging_probe"
  | "deployment"
  | "production_probe"
  | "security_review"
  | "audit";

export interface KernelEvidence {
  evidenceId: string;
  type: KernelEvidenceType;
  revision: string;
  at: string;
  actorNodeId: string;
  reference: string;
}

export interface KernelTruthRecord {
  capabilityId: string;
  revision: string;
  stage: KernelTruthStage;
  evidence: KernelEvidence[];
  updatedAt: string;
}

const STAGES: KernelTruthStage[] = [
  "DISCOVERED",
  "CLASSIFIED",
  "CANONICALIZED",
  "IMPLEMENTED",
  "TESTED",
  "STAGING_VERIFIED",
  "DEPLOYED",
  "PRODUCTION_PROBED",
  "VERIFIED_LIVE",
];

const REQUIRED_EVIDENCE: Partial<Record<KernelTruthStage, KernelEvidenceType[]>> = {
  CLASSIFIED: ["classification"],
  CANONICALIZED: ["canonical_record"],
  IMPLEMENTED: ["commit"],
  TESTED: ["test"],
  STAGING_VERIFIED: ["staging_probe"],
  DEPLOYED: ["deployment"],
  PRODUCTION_PROBED: ["production_probe"],
};

const evidenceForRevision = (record: KernelTruthRecord) =>
  record.evidence.filter((item) => item.revision === record.revision);

const hasEvidence = (
  evidence: KernelEvidence[],
  type: KernelEvidenceType,
): boolean => evidence.some((item) => item.type === type && item.reference.trim().length > 0);

export const createKernelTruthRecord = (
  capabilityId: string,
  revision: string,
  evidence: KernelEvidence,
): KernelTruthRecord => {
  if (!capabilityId.trim()) throw new Error("capabilityId is required");
  if (!revision.trim()) throw new Error("revision is required");
  if (evidence.type !== "source") throw new Error("discovery requires source evidence");
  if (evidence.revision !== revision) throw new Error("evidence revision mismatch");

  return {
    capabilityId,
    revision,
    stage: "DISCOVERED",
    evidence: [evidence],
    updatedAt: evidence.at,
  };
};

export const appendKernelEvidence = (
  record: KernelTruthRecord,
  evidence: KernelEvidence,
): KernelTruthRecord => {
  if (evidence.revision !== record.revision) throw new Error("evidence revision mismatch");
  if (!evidence.evidenceId.trim()) throw new Error("evidenceId is required");
  if (!evidence.reference.trim()) throw new Error("evidence reference is required");
  if (record.evidence.some((item) => item.evidenceId === evidence.evidenceId)) {
    return record;
  }

  return {
    ...record,
    evidence: [...record.evidence, evidence],
    updatedAt: evidence.at,
  };
};

export const requiredEvidenceForTruthStage = (stage: KernelTruthStage): KernelEvidenceType[] =>
  [...(REQUIRED_EVIDENCE[stage] ?? [])];

export const advanceKernelTruth = (
  record: KernelTruthRecord,
  nextStage: KernelTruthStage,
  at = new Date().toISOString(),
): KernelTruthRecord => {
  const currentIndex = STAGES.indexOf(record.stage);
  const nextIndex = STAGES.indexOf(nextStage);

  if (nextIndex !== currentIndex + 1) {
    throw new Error(`invalid_truth_transition:${record.stage}->${nextStage}`);
  }

  const evidence = evidenceForRevision(record);
  for (const requiredType of requiredEvidenceForTruthStage(nextStage)) {
    if (!hasEvidence(evidence, requiredType)) {
      throw new Error(`missing_evidence:${nextStage}:${requiredType}`);
    }
  }

  if (nextStage === "VERIFIED_LIVE") {
    const finalRequirements: KernelEvidenceType[] = [
      "commit",
      "test",
      "deployment",
      "production_probe",
    ];
    for (const requiredType of finalRequirements) {
      if (!hasEvidence(evidence, requiredType)) {
        throw new Error(`missing_evidence:${nextStage}:${requiredType}`);
      }
    }
  }

  return {
    ...record,
    stage: nextStage,
    updatedAt: at,
  };
};

/**
 * A revision change invalidates live truth for the changed capability.
 * Evidence from the previous revision is retained for audit history but cannot
 * satisfy gates for the new revision.
 */
export const startKernelTruthRevision = (
  record: KernelTruthRecord,
  revision: string,
  sourceEvidence: KernelEvidence,
): KernelTruthRecord => {
  if (!revision.trim()) throw new Error("revision is required");
  if (revision === record.revision) throw new Error("revision must change");
  if (sourceEvidence.type !== "source") throw new Error("revision requires source evidence");
  if (sourceEvidence.revision !== revision) throw new Error("evidence revision mismatch");

  return {
    ...record,
    revision,
    stage: "DISCOVERED",
    evidence: [...record.evidence, sourceEvidence],
    updatedAt: sourceEvidence.at,
  };
};
