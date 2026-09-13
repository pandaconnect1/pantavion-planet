/**
 * Canonical persistent control-plane contract.
 *
 * This module models the recovery-to-readiness lifecycle only. Database access
 * remains server-controlled through the established Supabase admin boundary.
 */

export type ControlPlaneLifecycleState = "active" | "archived" | "retained" | "purged";
export type RecoveryItemState = "discovered" | "classified" | "mapped" | "superseded" | "archived";
export type ClassificationDecision = "keep" | "merge" | "evolve" | "rebuild" | "archive" | "investigate";
export type WorkItemState = "planned" | "in_progress" | "blocked" | "implemented" | "tested" | "completed" | "cancelled";
export type ReadinessState = "unassessed" | "canonicalized" | "implemented" | "secured" | "tested" | "deployed" | "verified" | "blocked";
export type EvidenceKind = "source" | "migration" | "test" | "deployment" | "runtime_verification" | "audit" | "other";
export type CapabilityGrantState = "active" | "suspended" | "revoked" | "expired";
export type AiAuthorityState = "active" | "suspended" | "revoked" | "expired";
export type PolicyDecision = "allow" | "deny" | "require_human_approval";

export interface ControlPlaneOwnership {
  tenantId: string;
  ownerUserId: string;
  consentRecordId?: string;
  consentBasis?: string;
  authorizationBoundary: string;
  lifecycleState: ControlPlaneLifecycleState;
  retentionUntil?: string;
  provenance: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryItem extends ControlPlaneOwnership {
  id: string;
  sourceLocator: string;
  sourceKind: string;
  contentFingerprint?: string;
  state: RecoveryItemState;
}

export interface CanonicalClassification extends ControlPlaneOwnership {
  id: string;
  recoveryItemId: string;
  decision: ClassificationDecision;
  canonicalTarget: string;
  rationale: string;
}

export interface CanonicalEntity extends ControlPlaneOwnership {
  id: string;
  entityType: string;
  canonicalKey: string;
  displayName: string;
}

export interface ModuleEntityMapping extends ControlPlaneOwnership {
  id: string;
  classificationId: string;
  entityId: string;
  modulePath: string;
  mappingKind: string;
}

export interface GapRecord extends ControlPlaneOwnership {
  id: string;
  mappingId: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  state: "open" | "accepted" | "resolved" | "wont_fix";
}

export interface WorkItem extends ControlPlaneOwnership {
  id: string;
  gapId?: string;
  canonicalEntityId: string;
  title: string;
  state: WorkItemState;
  requiresHumanApproval: boolean;
}

export interface ControlPlaneEvidence extends ControlPlaneOwnership {
  id: string;
  workItemId?: string;
  canonicalEntityId?: string;
  kind: EvidenceKind;
  locator: string;
  checksum?: string;
  observedAt: string;
}

export interface ReadinessAssessment extends ControlPlaneOwnership {
  id: string;
  canonicalEntityId: string;
  state: ReadinessState;
  evaluatedBy: string;
  reason: string;
  evidenceIds: string[];
}

export interface DeterministicPolicyInput {
  tenantId: string;
  userId: string;
  agentId: string;
  capabilityKey: string;
  resourceType: string;
  resourceId: string;
  authorizationBoundary: string;
  consentRecordId?: string;
}

export interface DeterministicPolicyResult {
  decision: PolicyDecision;
  reason: string;
  evaluatedAt: string;
  policyVersion: string;
}
