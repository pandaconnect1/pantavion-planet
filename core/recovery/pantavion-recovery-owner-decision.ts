import { createHash } from "node:crypto";

export type RecoveryBuildOwnerDecision =
  | "approve_scoped_implementation"
  | "reject";

export interface RecoveryBuildReadinessDecisionSource {
  marker: "pantavion_recovery_build_readiness_packet_v1";
  buildOrderId: string;
  buildOrderDigest: string;
  readinessDigest: string;
  currentImplementationState: "IDEA";
  risk: { level: "low" | "medium" | "high" | "critical" };
  data: { classes: Array<"public" | "private" | "sensitive" | "regulated"> };
  ownerControl: {
    audience: "founder_only";
    state: "awaiting_owner";
    founderDecisionRequired: true;
    approvalRecorded: false;
    releaseAuthorized: false;
  };
  authority: {
    analysis: true;
    planning: true;
    codeMutation: false;
    execution: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
  };
  completion: false;
}

export interface RecoveryBuildOwnerDecisionReceipt {
  marker: "pantavion_recovery_build_owner_decision_receipt_v1";
  readinessIndexDigest: string;
  buildOrderId: string;
  buildOrderDigest: string;
  readinessDigest: string;
  ownerUserId: string;
  assuranceLevel: "aal2";
  decision: RecoveryBuildOwnerDecision;
  decisionScope: "isolated_code_preparation_only" | "remain_blocked";
  note: string | null;
  decidedAt: string;
  sourceImplementationState: "IDEA";
  nextPermittedLifecycleState: "CODED" | "IDEA";
  scopeApprovalRecorded: boolean;
  separateCapabilityGrantRequired: true;
  separateBudgetGrantRequired: true;
  exactRevisionEvidenceRequired: true;
  riskLevel: "low" | "medium" | "high" | "critical";
  dataClasses: Array<"public" | "private" | "sensitive" | "regulated">;
  authority: {
    codeMutation: false;
    agentGrant: false;
    execution: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
  };
  completion: false;
  receiptDigest: string;
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("owner_decision_non_finite_number");
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
  throw new Error("owner_decision_unsupported_digest_value");
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertSha256(label: string, value: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label}_must_be_sha256`);
}

function normalizeNote(note: string | null | undefined): string | null {
  const normalized = note?.trim() || null;
  if (normalized && normalized.length > 2000) throw new Error("owner_decision_note_too_long");
  return normalized;
}

function validateDecisionSource(source: RecoveryBuildReadinessDecisionSource): void {
  if (source.marker !== "pantavion_recovery_build_readiness_packet_v1") {
    throw new Error("owner_decision_readiness_marker_invalid");
  }
  if (!/^recovery_build_order_[0-9a-f]{64}$/.test(source.buildOrderId)) {
    throw new Error("owner_decision_build_order_id_invalid");
  }
  assertSha256("owner_decision_build_order_digest", source.buildOrderDigest);
  assertSha256("owner_decision_readiness_digest", source.readinessDigest);
  if (
    source.currentImplementationState !== "IDEA" ||
    source.ownerControl.audience !== "founder_only" ||
    source.ownerControl.state !== "awaiting_owner" ||
    source.ownerControl.founderDecisionRequired !== true ||
    source.ownerControl.approvalRecorded !== false ||
    source.ownerControl.releaseAuthorized !== false ||
    source.completion !== false
  ) {
    throw new Error("owner_decision_source_boundary_invalid");
  }
  if (source.authority.analysis !== true || source.authority.planning !== true) {
    throw new Error("owner_decision_planning_authority_missing");
  }
  for (const [key, value] of Object.entries(source.authority)) {
    if (key === "analysis" || key === "planning") continue;
    if (value !== false) throw new Error(`owner_decision_source_authority_escalation:${key}`);
  }
}

export function createRecoveryBuildOwnerDecisionReceipt(input: {
  source: RecoveryBuildReadinessDecisionSource;
  readinessIndexDigest: string;
  ownerUserId: string;
  assuranceLevel: string;
  decision: RecoveryBuildOwnerDecision;
  note?: string | null;
  decidedAt: string;
}): RecoveryBuildOwnerDecisionReceipt {
  validateDecisionSource(input.source);
  assertSha256("owner_decision_readiness_index", input.readinessIndexDigest);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.ownerUserId)) {
    throw new Error("owner_decision_owner_identity_invalid");
  }
  if (input.assuranceLevel !== "aal2") throw new Error("owner_decision_aal2_required");
  if (!Number.isFinite(Date.parse(input.decidedAt))) {
    throw new Error("owner_decision_timestamp_invalid");
  }
  if (!["approve_scoped_implementation", "reject"].includes(input.decision)) {
    throw new Error("owner_decision_value_invalid");
  }

  const note = normalizeNote(input.note);
  const highConsequenceApproval =
    input.decision === "approve_scoped_implementation" &&
    (input.source.risk.level === "critical" || input.source.data.classes.includes("regulated"));
  if (highConsequenceApproval && (!note || note.length < 20)) {
    throw new Error("owner_decision_high_consequence_note_required");
  }

  const approved = input.decision === "approve_scoped_implementation";
  const unsigned = {
    marker: "pantavion_recovery_build_owner_decision_receipt_v1" as const,
    readinessIndexDigest: input.readinessIndexDigest,
    buildOrderId: input.source.buildOrderId,
    buildOrderDigest: input.source.buildOrderDigest,
    readinessDigest: input.source.readinessDigest,
    ownerUserId: input.ownerUserId.toLowerCase(),
    assuranceLevel: "aal2" as const,
    decision: input.decision,
    decisionScope: approved
      ? "isolated_code_preparation_only" as const
      : "remain_blocked" as const,
    note,
    decidedAt: new Date(input.decidedAt).toISOString(),
    sourceImplementationState: "IDEA" as const,
    nextPermittedLifecycleState: approved ? "CODED" as const : "IDEA" as const,
    scopeApprovalRecorded: approved,
    separateCapabilityGrantRequired: true as const,
    separateBudgetGrantRequired: true as const,
    exactRevisionEvidenceRequired: true as const,
    riskLevel: input.source.risk.level,
    dataClasses: [...input.source.data.classes],
    authority: {
      codeMutation: false as const,
      agentGrant: false as const,
      execution: false as const,
      productionWrite: false as const,
      merge: false as const,
      deployment: false as const,
      publicExposure: false as const,
      release: false as const,
    },
    completion: false as const,
  };

  return { ...unsigned, receiptDigest: sha256(canonicalJson(unsigned)) };
}

export function verifyRecoveryBuildOwnerDecisionReceipt(
  receipt: RecoveryBuildOwnerDecisionReceipt,
): boolean {
  const { receiptDigest, ...unsigned } = receipt;
  assertSha256("owner_decision_receipt", receiptDigest);
  if (sha256(canonicalJson(unsigned)) !== receiptDigest) return false;
  if (receipt.assuranceLevel !== "aal2" || receipt.completion !== false) return false;
  if (Object.values(receipt.authority).some((value) => value !== false)) return false;
  if (receipt.decision === "approve_scoped_implementation") {
    return (
      receipt.scopeApprovalRecorded === true &&
      receipt.decisionScope === "isolated_code_preparation_only" &&
      receipt.nextPermittedLifecycleState === "CODED"
    );
  }
  return (
    receipt.scopeApprovalRecorded === false &&
    receipt.decisionScope === "remain_blocked" &&
    receipt.nextPermittedLifecycleState === "IDEA"
  );
}
