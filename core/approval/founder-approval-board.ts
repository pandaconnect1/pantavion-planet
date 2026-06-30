export type PantavionApprovalRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type PantavionApprovalActionClass =
  | "dwg_source_truth"
  | "cad_gis_conversion"
  | "secret_access"
  | "auth_user_access"
  | "billing_payment"
  | "production_deploy"
  | "infrastructure_change"
  | "legal_compliance"
  | "backup_restore"
  | "security_sensitive"
  | "repo_ci_cd"
  | "data_changing"
  | "provider_cloud_upload"
  | "unknown";

export type PantavionFounderApprovalRequestInput = {
  title: string;
  actionClass: PantavionApprovalActionClass;
  riskZone: PantavionApprovalRiskZone;
  requestedBy: string;
  reason: string;
  target?: string;
  route?: string;
  relatedArtifactPath?: string;
  relatedRequestId?: string;
  proposedAction?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
};

export type PantavionFounderApprovalDecisionInput = {
  requestId: string;
  decision: "approved" | "rejected" | "cancelled";
  decidedBy: string;
  reason: string;
};

export type PantavionFounderApprovalRecord = {
  id: string;
  title: string;
  actionClass: PantavionApprovalActionClass;
  riskZone: PantavionApprovalRiskZone;
  status: PantavionApprovalStatus;
  requestedBy: string;
  decidedBy?: string;
  reason: string;
  decisionReason?: string;
  target?: string;
  route?: string;
  relatedArtifactPath?: string;
  relatedRequestId?: string;
  proposedAction?: string;
  requiresFounderApproval: boolean;
  blocksAutomaticExecution: boolean;
  auditTags: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
};

export type PantavionFounderApprovalAssessment = {
  ok: true;
  requestId: string;
  status: PantavionApprovalStatus;
  riskZone: PantavionApprovalRiskZone;
  actionClass: PantavionApprovalActionClass;
  requiresFounderApproval: boolean;
  blocksAutomaticExecution: boolean;
  allowedToExecute: boolean;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

const Z3_Z4_ACTION_CLASSES = new Set<PantavionApprovalActionClass>([
  "dwg_source_truth",
  "cad_gis_conversion",
  "secret_access",
  "auth_user_access",
  "billing_payment",
  "production_deploy",
  "infrastructure_change",
  "legal_compliance",
  "backup_restore",
  "security_sensitive",
  "repo_ci_cd",
  "data_changing",
  "provider_cloud_upload"
]);

export function pantavionApprovalRequiresFounderApproval(
  actionClass: PantavionApprovalActionClass,
  riskZone: PantavionApprovalRiskZone
): boolean {
  return riskZone === "Z3" || riskZone === "Z4" || Z3_Z4_ACTION_CLASSES.has(actionClass);
}

export function createPantavionFounderApprovalRecord(
  input: PantavionFounderApprovalRequestInput
): PantavionFounderApprovalRecord {
  const now = new Date().toISOString();
  const requiresFounderApproval = pantavionApprovalRequiresFounderApproval(
    input.actionClass,
    input.riskZone
  );

  const id = `approval_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    title: input.title,
    actionClass: input.actionClass,
    riskZone: input.riskZone,
    status: "pending",
    requestedBy: input.requestedBy,
    reason: input.reason,
    target: input.target,
    route: input.route,
    relatedArtifactPath: input.relatedArtifactPath,
    relatedRequestId: input.relatedRequestId,
    proposedAction: input.proposedAction,
    requiresFounderApproval,
    blocksAutomaticExecution: requiresFounderApproval,
    auditTags: [
      "founder_approval",
      input.actionClass,
      input.riskZone.toLowerCase(),
      requiresFounderApproval ? "approval_required" : "approval_not_required"
    ],
    metadata: input.metadata,
    createdAt: now,
    updatedAt: now,
    expiresAt: input.expiresAt
  };
}

export function decidePantavionFounderApprovalRecord(
  record: PantavionFounderApprovalRecord,
  input: PantavionFounderApprovalDecisionInput
): PantavionFounderApprovalRecord {
  if (record.status !== "pending") {
    throw new Error(`Approval request is not pending: ${record.id}`);
  }

  if (record.id !== input.requestId) {
    throw new Error("Approval request id mismatch.");
  }

  return {
    ...record,
    status: input.decision,
    decidedBy: input.decidedBy,
    decisionReason: input.reason,
    updatedAt: new Date().toISOString(),
    auditTags: [
      ...record.auditTags,
      `decision_${input.decision}`,
      input.decidedBy === "founder" ? "founder_decided" : "delegated_decision"
    ]
  };
}

export function assessPantavionFounderApprovalRecord(
  record: PantavionFounderApprovalRecord
): PantavionFounderApprovalAssessment {
  const expired =
    record.status === "pending" &&
    typeof record.expiresAt === "string" &&
    new Date(record.expiresAt).getTime() < Date.now();

  const status: PantavionApprovalStatus = expired ? "expired" : record.status;
  const allowedToExecute = status === "approved";

  const notes: string[] = [];

  if (record.requiresFounderApproval) {
    notes.push("Founder approval is required before execution.");
  }

  if (record.blocksAutomaticExecution && status !== "approved") {
    notes.push("Automatic execution is blocked until approval is granted.");
  }

  if (status === "approved") {
    notes.push("Approval granted. Execution may proceed only within the approved scope and after green checks.");
  }

  if (status === "rejected") {
    notes.push("Approval rejected. Execution must not proceed.");
  }

  if (status === "expired") {
    notes.push("Approval expired. A new approval request is required.");
  }

  if (record.actionClass === "dwg_source_truth") {
    notes.push("DWG source-truth rule remains active: original must stay read-only and preserved.");
  }

  if (record.actionClass === "production_deploy") {
    notes.push("Production deploy also requires green build, typecheck, kernel checks, and scoped changes.");
  }

  return {
    ok: true,
    requestId: record.id,
    status,
    riskZone: record.riskZone,
    actionClass: record.actionClass,
    requiresFounderApproval: record.requiresFounderApproval,
    blocksAutomaticExecution: record.blocksAutomaticExecution,
    allowedToExecute,
    notes,
    auditTags: record.auditTags,
    assessedAt: new Date().toISOString()
  };
}
