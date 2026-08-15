export type KnowledgeSourceFamily =
  | "founder-vision"
  | "unfinished-gap"
  | "recovery"
  | "donor"
  | "current-code"
  | "live-state";

export type KnowledgeRelationType =
  | "EXTENDS"
  | "EVOLVES"
  | "IMPLEMENTS"
  | "DEPENDS_ON"
  | "SUPERSEDES"
  | "CONFLICTS_WITH"
  | "RELATED_TO"
  | "DUPLICATE_EXACT";

export type KnowledgeLayer =
  | "UI"
  | "API"
  | "KERNEL"
  | "RUNTIME"
  | "SERVICE"
  | "DATA"
  | "SCRIPT"
  | "TEST"
  | "DOCS"
  | "RECOVERY"
  | "UNKNOWN";

export type RecoveryState =
  | "COMPLETE"
  | "PARTIAL"
  | "SKELETON"
  | "IDEA-SPEC"
  | "DELETED-HISTORICAL"
  | "UNCLASSIFIED";

export type RecoveryDecision =
  | "KEEP"
  | "MERGE"
  | "EVOLVE"
  | "REBUILD"
  | "ARCHIVE"
  | "INVESTIGATE"
  | "UNCLASSIFIED";

export type LiveState =
  | "SPEC_ONLY"
  | "UI_ONLY"
  | "BACKEND_PARTIAL"
  | "BACKEND_LIVE"
  | "CONNECTED"
  | "TESTED"
  | "DEPLOYED"
  | "VERIFIED_LIVE"
  | "UNCLASSIFIED";

export interface KnowledgeProvenance {
  sourceFamily: KnowledgeSourceFamily;
  sourceFile: string;
  sourceLine: number | null;
  sourceRef: string;
  sourceCommit: string | null;
  sourceReport: string | null;
}

export interface KnowledgeRelation {
  type: KnowledgeRelationType;
  targetId: string;
  rationale: string;
  confidence: number | null;
}

export interface CanonicalKnowledgeClassification {
  topicFamily: string | null;
  productDomain: string | null;
  module: string | null;
  subsystem: string | null;
  capability: string | null;
  feature: string | null;
  layer: KnowledgeLayer;
  recoveryState: RecoveryState;
  decision: RecoveryDecision;
  liveState: LiveState;
  canonicalTarget: string | null;
  owningKernel: string | null;
  guardianLane: string | null;
  agentLane: string | null;
  blockers: string[];
  nextAction: string | null;
}

export interface CanonicalKnowledgeRecord {
  id: string;
  ordinal: number;
  provenance: KnowledgeProvenance;
  marker: string | null;
  text: string;
  classification: CanonicalKnowledgeClassification;
  relations: KnowledgeRelation[];
  reviewStatus: "UNCLASSIFIED" | "CLASSIFIED" | "REVIEW_REQUIRED" | "APPROVED";
  notes: string[];
}

export interface KnowledgeBatchCheckpoint {
  batchId: string;
  batchLabel: string;
  startOrdinal: number;
  endOrdinal: number;
  recordCount: number;
  sourceCounts: Record<string, number>;
  classifiedCount: number;
  unresolvedCount: number;
  crossBatchRelationCount: number;
  generatedAt: string;
  corpusFingerprint: string;
}

export const CANONICAL_KNOWLEDGE_BATCH_SIZE = 1499;

export const EMPTY_KNOWLEDGE_CLASSIFICATION: CanonicalKnowledgeClassification = {
  topicFamily: null,
  productDomain: null,
  module: null,
  subsystem: null,
  capability: null,
  feature: null,
  layer: "UNKNOWN",
  recoveryState: "UNCLASSIFIED",
  decision: "UNCLASSIFIED",
  liveState: "UNCLASSIFIED",
  canonicalTarget: null,
  owningKernel: null,
  guardianLane: null,
  agentLane: null,
  blockers: [],
  nextAction: null,
};
