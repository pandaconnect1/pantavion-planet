export const FOUNDER_INTENT_WORKBENCH_MARKER = "pantavion_founder_intent_workbench_v1" as const;
export const FOUNDER_INTENT_VAULT_MARKER = "pantavion_founder_intent_encrypted_vault_v1" as const;
const vaultIterations = 210_000;

export const founderIntentModules = [
  "intent_to_outcome",
  "ephemeral_agent_swarm",
  "disconnected_edge",
  "intent_firewall",
  "capability_budget",
  "owner_control",
  "technology_library",
  "implementation_truth",
] as const;

export type FounderIntentModule = (typeof founderIntentModules)[number];
export type FounderIntentPriority = "normal" | "high" | "critical";
export type FounderIntentState = "captured";

export type FounderIntentInput = {
  title: string;
  desiredOutcome: string;
  acceptanceEvidence: string;
  module: FounderIntentModule;
  priority: FounderIntentPriority;
  maxActions: number;
  maxMinutes: number;
};

export type FounderIntentRecord = FounderIntentInput & {
  marker: typeof FOUNDER_INTENT_WORKBENCH_MARKER;
  id: string;
  createdAt: string;
  state: FounderIntentState;
  networkPolicy: "offline_only";
  productionWriteAuthority: false;
  mergeAuthority: false;
  deploymentAuthority: false;
  canonicalPayload: string;
  sha256: string;
};

export type FounderIntentValidation = {
  valid: boolean;
  errors: string[];
};

export type FounderIntentFirewallAssessment = {
  marker: "pantavion_founder_intent_firewall_assessment_v1";
  intentId: string;
  disposition: "owner_review_required";
  executionAllowed: false;
  reasons: string[];
  assessedPayload: string;
  sha256: string;
};

export type FounderIntentBudgetEnvelope = {
  marker: "pantavion_founder_intent_budget_envelope_v1";
  intentId: string;
  capabilityScope: FounderIntentModule;
  actionLimit: number;
  timeLimitMinutes: number;
  expiresAt: string;
  grantStatus: "withheld_pending_owner_review";
  executionAllowed: false;
  canonicalPayload: string;
  sha256: string;
};

export type FounderIntentEdgeHandoff = {
  marker: "pantavion_founder_intent_edge_handoff_v1";
  intentId: string;
  intentSha256: string;
  firewallSha256: string;
  budgetSha256: string;
  nonce: string;
  createdAt: string;
  networkPolicy: "offline_only";
  replayPolicy: "single_use_pending_owner_admission";
  executionAllowed: false;
  canonicalPayload: string;
  sha256: string;
};

export type FounderTechnologyAssessment = {
  marker: "pantavion_founder_technology_assessment_v1";
  intentId: string;
  edgeHandoffSha256: string;
  requiredCapabilities: string[];
  approvedTechnologies: string[];
  missingCapabilities: string[];
  disposition: "compatible_pending_owner_admission" | "technology_hold";
  executionAllowed: false;
  canonicalPayload: string;
  sha256: string;
};

export type FounderEphemeralAgentLease = {
  marker: "pantavion_founder_ephemeral_agent_lease_v1";
  intentId: string;
  agentId: string;
  capabilityScope: FounderIntentModule;
  actionLimit: number;
  expiresAt: string;
  status: "withheld_pending_owner_admission";
  executionAllowed: false;
  canonicalPayload: string;
  sha256: string;
};

export type FounderEphemeralAgentRevocation = {
  marker: "pantavion_founder_ephemeral_agent_revocation_v1";
  intentId: string;
  agentId: string;
  leaseSha256: string;
  revokedAt: string;
  reason: "owner_revoked" | "budget_exhausted" | "integrity_failure" | "expired";
  terminal: true;
  executionAllowed: false;
  canonicalPayload: string;
  sha256: string;
};

export type FounderIntentVerificationBundle = {
  marker: "pantavion_founder_intent_verification_bundle_v1";
  intentId: string;
  receiptChain: [string, string, string, string, string];
  lifecycleState: "TESTED_LOCALLY_NOT_MERGED";
  syntheticRecordsCountedAsImplementation: 0;
  canonicalPayload: string;
  sha256: string;
};

const founderTechnologyLibrary: Record<FounderIntentModule, ReadonlyArray<{ capability: string; technology: string }>> = {
  intent_to_outcome: [{ capability: "deterministic_receipts", technology: "WebCrypto SHA-256" }],
  ephemeral_agent_swarm: [],
  disconnected_edge: [{ capability: "local_encryption", technology: "WebCrypto AES-GCM" }, { capability: "offline_persistence", technology: "IndexedDB" }, { capability: "integrity_receipts", technology: "WebCrypto SHA-256" }],
  intent_firewall: [{ capability: "deterministic_policy", technology: "Pantavion Intent Firewall" }],
  capability_budget: [{ capability: "bounded_budget", technology: "Pantavion Budget Envelope" }],
  owner_control: [{ capability: "owner_authentication", technology: "Pantavion Owner AAL2" }],
  technology_library: [{ capability: "technology_admission", technology: "Pantavion Technology Library" }],
  implementation_truth: [{ capability: "lifecycle_evidence", technology: "Pantavion Implementation Truth" }],
};

export type EncryptedFounderIntentVault = {
  marker: typeof FOUNDER_INTENT_VAULT_MARKER;
  cipher: "AES-GCM-256";
  kdf: "PBKDF2-SHA-256";
  iterations: typeof vaultIterations;
  salt: string;
  iv: string;
  ciphertext: string;
};

const titleLimit = 180;
const outcomeLimit = 4_000;
const evidenceLimit = 2_000;

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isIntegerInRange(value: number, minimum: number, maximum: number) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

export function validateFounderIntentInput(input: FounderIntentInput): FounderIntentValidation {
  const errors: string[] = [];
  const title = normalizeText(input.title);
  const desiredOutcome = normalizeText(input.desiredOutcome);
  const acceptanceEvidence = normalizeText(input.acceptanceEvidence);

  if (!title) errors.push("title_required");
  if (title.length > titleLimit) errors.push("title_too_long");
  if (!desiredOutcome) errors.push("desired_outcome_required");
  if (desiredOutcome.length > outcomeLimit) errors.push("desired_outcome_too_long");
  if (!acceptanceEvidence) errors.push("acceptance_evidence_required");
  if (acceptanceEvidence.length > evidenceLimit) errors.push("acceptance_evidence_too_long");
  if (!founderIntentModules.includes(input.module)) errors.push("module_invalid");
  if (!["normal", "high", "critical"].includes(input.priority)) errors.push("priority_invalid");
  if (!isIntegerInRange(input.maxActions, 1, 50)) errors.push("max_actions_invalid");
  if (!isIntegerInRange(input.maxMinutes, 1, 1_440)) errors.push("max_minutes_invalid");

  return { valid: errors.length === 0, errors };
}

export function canonicalizeFounderIntent(params: {
  input: FounderIntentInput;
  id: string;
  createdAt: string;
}) {
  const validation = validateFounderIntentInput(params.input);
  if (!validation.valid) throw new Error(validation.errors.join(","));

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)) {
    throw new Error("intent_id_invalid");
  }
  if (!Number.isFinite(Date.parse(params.createdAt))) throw new Error("created_at_invalid");

  return JSON.stringify({
    marker: FOUNDER_INTENT_WORKBENCH_MARKER,
    id: params.id.toLowerCase(),
    createdAt: new Date(params.createdAt).toISOString(),
    title: normalizeText(params.input.title),
    desiredOutcome: normalizeText(params.input.desiredOutcome),
    acceptanceEvidence: normalizeText(params.input.acceptanceEvidence),
    module: params.input.module,
    priority: params.input.priority,
    maxActions: params.input.maxActions,
    maxMinutes: params.input.maxMinutes,
    state: "captured",
    networkPolicy: "offline_only",
    productionWriteAuthority: false,
    mergeAuthority: false,
    deploymentAuthority: false,
  });
}

export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createFounderIntentRecord(params: {
  input: FounderIntentInput;
  id: string;
  createdAt: string;
}): Promise<FounderIntentRecord> {
  const canonicalPayload = canonicalizeFounderIntent(params);
  const canonical = JSON.parse(canonicalPayload) as Omit<FounderIntentRecord, "canonicalPayload" | "sha256">;

  return {
    ...canonical,
    canonicalPayload,
    sha256: await sha256Hex(canonicalPayload),
  };
}

export async function verifyFounderIntentRecord(record: FounderIntentRecord) {
  if (record.marker !== FOUNDER_INTENT_WORKBENCH_MARKER) return false;
  if (record.networkPolicy !== "offline_only") return false;
  if (record.productionWriteAuthority || record.mergeAuthority || record.deploymentAuthority) return false;
  if (!/^[0-9a-f]{64}$/.test(record.sha256)) return false;
  if (await sha256Hex(record.canonicalPayload) !== record.sha256) return false;

  const canonical = JSON.parse(record.canonicalPayload) as Record<string, unknown>;
  return canonical.marker === record.marker
    && canonical.id === record.id
    && canonical.createdAt === record.createdAt
    && canonical.title === record.title
    && canonical.desiredOutcome === record.desiredOutcome
    && canonical.acceptanceEvidence === record.acceptanceEvidence
    && canonical.module === record.module
    && canonical.priority === record.priority
    && canonical.maxActions === record.maxActions
    && canonical.maxMinutes === record.maxMinutes
    && canonical.state === record.state
    && canonical.networkPolicy === record.networkPolicy
    && canonical.productionWriteAuthority === false
    && canonical.mergeAuthority === false
    && canonical.deploymentAuthority === false;
}

export async function assessFounderIntentFirewall(record: FounderIntentRecord): Promise<FounderIntentFirewallAssessment> {
  if (!await verifyFounderIntentRecord(record)) throw new Error("intent_record_integrity_failed");
  const reasons = ["explicit_execution_authority_missing", "merge_authority_missing", "deployment_authority_missing"];
  if (record.priority === "critical") reasons.push("critical_priority_requires_owner_review");
  if (record.module === "ephemeral_agent_swarm") reasons.push("agent_capability_grant_missing");
  if (record.module === "technology_library") reasons.push("technology_clearance_missing");
  if (record.maxActions > 20) reasons.push("elevated_action_budget_requires_owner_review");
  if (record.maxMinutes > 480) reasons.push("elevated_time_budget_requires_owner_review");
  const assessedPayload = JSON.stringify({
    marker: "pantavion_founder_intent_firewall_assessment_v1",
    intentId: record.id,
    intentSha256: record.sha256,
    disposition: "owner_review_required",
    executionAllowed: false,
    reasons,
  });
  return {
    marker: "pantavion_founder_intent_firewall_assessment_v1",
    intentId: record.id,
    disposition: "owner_review_required",
    executionAllowed: false,
    reasons,
    assessedPayload,
    sha256: await sha256Hex(assessedPayload),
  };
}

export async function verifyFounderIntentFirewallAssessment(record: FounderIntentRecord, assessment: FounderIntentFirewallAssessment) {
  if (!await verifyFounderIntentRecord(record)) return false;
  if (assessment.marker !== "pantavion_founder_intent_firewall_assessment_v1") return false;
  if (assessment.intentId !== record.id || assessment.executionAllowed !== false) return false;
  if (assessment.disposition !== "owner_review_required") return false;
  if (!assessment.reasons.includes("explicit_execution_authority_missing")) return false;
  if (!/^[0-9a-f]{64}$/.test(assessment.sha256) || await sha256Hex(assessment.assessedPayload) !== assessment.sha256) return false;
  const signed = JSON.parse(assessment.assessedPayload) as Record<string, unknown>;
  return signed.marker === assessment.marker
    && signed.intentId === record.id
    && signed.intentSha256 === record.sha256
    && signed.disposition === assessment.disposition
    && signed.executionAllowed === false
    && JSON.stringify(signed.reasons) === JSON.stringify(assessment.reasons);
}

export async function createFounderIntentBudgetEnvelope(record: FounderIntentRecord): Promise<FounderIntentBudgetEnvelope> {
  if (!await verifyFounderIntentRecord(record)) throw new Error("intent_record_integrity_failed");
  const expiresAt = new Date(Date.parse(record.createdAt) + record.maxMinutes * 60_000).toISOString();
  const canonicalPayload = JSON.stringify({ marker: "pantavion_founder_intent_budget_envelope_v1", intentId: record.id, intentSha256: record.sha256, capabilityScope: record.module, actionLimit: record.maxActions, timeLimitMinutes: record.maxMinutes, expiresAt, grantStatus: "withheld_pending_owner_review", executionAllowed: false });
  return { marker: "pantavion_founder_intent_budget_envelope_v1", intentId: record.id, capabilityScope: record.module, actionLimit: record.maxActions, timeLimitMinutes: record.maxMinutes, expiresAt, grantStatus: "withheld_pending_owner_review", executionAllowed: false, canonicalPayload, sha256: await sha256Hex(canonicalPayload) };
}

export async function verifyFounderIntentBudgetEnvelope(record: FounderIntentRecord, envelope: FounderIntentBudgetEnvelope) {
  if (!await verifyFounderIntentRecord(record)) return false;
  if (envelope.intentId !== record.id || envelope.executionAllowed !== false || envelope.capabilityScope !== record.module || envelope.actionLimit !== record.maxActions || envelope.timeLimitMinutes !== record.maxMinutes || envelope.grantStatus !== "withheld_pending_owner_review") return false;
  if (!/^[0-9a-f]{64}$/.test(envelope.sha256) || await sha256Hex(envelope.canonicalPayload) !== envelope.sha256) return false;
  const signed = JSON.parse(envelope.canonicalPayload) as Record<string, unknown>;
  return signed.marker === envelope.marker && signed.intentId === record.id && signed.intentSha256 === record.sha256 && signed.capabilityScope === envelope.capabilityScope && signed.actionLimit === envelope.actionLimit && signed.timeLimitMinutes === envelope.timeLimitMinutes && signed.expiresAt === envelope.expiresAt && signed.grantStatus === envelope.grantStatus && signed.executionAllowed === false;
}

export async function createFounderIntentEdgeHandoff(params: {
  record: FounderIntentRecord;
  assessment: FounderIntentFirewallAssessment;
  budget: FounderIntentBudgetEnvelope;
  nonce: string;
  createdAt: string;
}): Promise<FounderIntentEdgeHandoff> {
  if (!await verifyFounderIntentRecord(params.record)) throw new Error("intent_record_integrity_failed");
  if (!await verifyFounderIntentFirewallAssessment(params.record, params.assessment)) throw new Error("intent_firewall_integrity_failed");
  if (!await verifyFounderIntentBudgetEnvelope(params.record, params.budget)) throw new Error("intent_budget_integrity_failed");
  if (!/^[0-9a-f]{32}$/i.test(params.nonce)) throw new Error("edge_nonce_invalid");
  if (!Number.isFinite(Date.parse(params.createdAt))) throw new Error("edge_created_at_invalid");
  const canonicalPayload = JSON.stringify({ marker: "pantavion_founder_intent_edge_handoff_v1", intentId: params.record.id, intentSha256: params.record.sha256, firewallSha256: params.assessment.sha256, budgetSha256: params.budget.sha256, nonce: params.nonce.toLowerCase(), createdAt: new Date(params.createdAt).toISOString(), networkPolicy: "offline_only", replayPolicy: "single_use_pending_owner_admission", executionAllowed: false });
  const canonical = JSON.parse(canonicalPayload) as Omit<FounderIntentEdgeHandoff, "canonicalPayload" | "sha256">;
  return { ...canonical, canonicalPayload, sha256: await sha256Hex(canonicalPayload) };
}

export async function verifyFounderIntentEdgeHandoff(params: {
  record: FounderIntentRecord;
  assessment: FounderIntentFirewallAssessment;
  budget: FounderIntentBudgetEnvelope;
  handoff: FounderIntentEdgeHandoff;
}) {
  if (!await verifyFounderIntentRecord(params.record)) return false;
  if (!await verifyFounderIntentFirewallAssessment(params.record, params.assessment)) return false;
  if (!await verifyFounderIntentBudgetEnvelope(params.record, params.budget)) return false;
  const { handoff } = params;
  if (handoff.intentId !== params.record.id || handoff.intentSha256 !== params.record.sha256 || handoff.firewallSha256 !== params.assessment.sha256 || handoff.budgetSha256 !== params.budget.sha256) return false;
  if (handoff.networkPolicy !== "offline_only" || handoff.replayPolicy !== "single_use_pending_owner_admission" || handoff.executionAllowed !== false || !/^[0-9a-f]{32}$/.test(handoff.nonce)) return false;
  if (!/^[0-9a-f]{64}$/.test(handoff.sha256) || await sha256Hex(handoff.canonicalPayload) !== handoff.sha256) return false;
  const signed = JSON.parse(handoff.canonicalPayload) as Record<string, unknown>;
  return signed.marker === handoff.marker && signed.intentId === handoff.intentId && signed.intentSha256 === handoff.intentSha256 && signed.firewallSha256 === handoff.firewallSha256 && signed.budgetSha256 === handoff.budgetSha256 && signed.nonce === handoff.nonce && signed.createdAt === handoff.createdAt && signed.networkPolicy === "offline_only" && signed.replayPolicy === "single_use_pending_owner_admission" && signed.executionAllowed === false;
}

export async function assessFounderTechnologyLibrary(record: FounderIntentRecord, handoff: FounderIntentEdgeHandoff): Promise<FounderTechnologyAssessment> {
  if (!await verifyFounderIntentRecord(record)) throw new Error("intent_record_integrity_failed");
  if (handoff.intentId !== record.id || handoff.intentSha256 !== record.sha256 || handoff.executionAllowed !== false || await sha256Hex(handoff.canonicalPayload) !== handoff.sha256) throw new Error("edge_handoff_integrity_failed");
  const entries = founderTechnologyLibrary[record.module];
  const requiredCapabilities = record.module === "ephemeral_agent_swarm" ? ["sandbox_runtime", "ephemeral_identity", "capability_revocation"] : entries.map((entry) => entry.capability);
  const approvedTechnologies = entries.map((entry) => entry.technology);
  const covered = new Set(entries.map((entry) => entry.capability));
  const missingCapabilities = requiredCapabilities.filter((capability) => !covered.has(capability));
  const disposition = missingCapabilities.length === 0 ? "compatible_pending_owner_admission" : "technology_hold";
  const canonicalPayload = JSON.stringify({ marker: "pantavion_founder_technology_assessment_v1", intentId: record.id, intentSha256: record.sha256, edgeHandoffSha256: handoff.sha256, requiredCapabilities, approvedTechnologies, missingCapabilities, disposition, executionAllowed: false });
  return { marker: "pantavion_founder_technology_assessment_v1", intentId: record.id, edgeHandoffSha256: handoff.sha256, requiredCapabilities, approvedTechnologies, missingCapabilities, disposition, executionAllowed: false, canonicalPayload, sha256: await sha256Hex(canonicalPayload) };
}

export async function verifyFounderTechnologyAssessment(record: FounderIntentRecord, handoff: FounderIntentEdgeHandoff, assessment: FounderTechnologyAssessment) {
  if (!await verifyFounderIntentRecord(record) || handoff.intentId !== record.id || handoff.intentSha256 !== record.sha256 || await sha256Hex(handoff.canonicalPayload) !== handoff.sha256) return false;
  if (assessment.intentId !== record.id || assessment.edgeHandoffSha256 !== handoff.sha256 || assessment.executionAllowed !== false) return false;
  if (!/^[0-9a-f]{64}$/.test(assessment.sha256) || await sha256Hex(assessment.canonicalPayload) !== assessment.sha256) return false;
  const signed = JSON.parse(assessment.canonicalPayload) as Record<string, unknown>;
  return signed.marker === assessment.marker && signed.intentId === record.id && signed.intentSha256 === record.sha256 && signed.edgeHandoffSha256 === handoff.sha256 && JSON.stringify(signed.requiredCapabilities) === JSON.stringify(assessment.requiredCapabilities) && JSON.stringify(signed.approvedTechnologies) === JSON.stringify(assessment.approvedTechnologies) && JSON.stringify(signed.missingCapabilities) === JSON.stringify(assessment.missingCapabilities) && signed.disposition === assessment.disposition && signed.executionAllowed === false;
}

export async function createFounderEphemeralAgentLease(params: { record: FounderIntentRecord; budget: FounderIntentBudgetEnvelope; technology: FounderTechnologyAssessment; agentId: string }): Promise<FounderEphemeralAgentLease> {
  if (!await verifyFounderIntentRecord(params.record)) throw new Error("intent_record_integrity_failed");
  if (!await verifyFounderIntentBudgetEnvelope(params.record, params.budget)) throw new Error("intent_budget_integrity_failed");
  if (params.technology.disposition !== "compatible_pending_owner_admission" || params.technology.executionAllowed !== false) throw new Error("technology_admission_required");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.agentId)) throw new Error("agent_id_invalid");
  const canonicalPayload = JSON.stringify({ marker: "pantavion_founder_ephemeral_agent_lease_v1", intentId: params.record.id, intentSha256: params.record.sha256, budgetSha256: params.budget.sha256, technologySha256: params.technology.sha256, agentId: params.agentId.toLowerCase(), capabilityScope: params.record.module, actionLimit: params.budget.actionLimit, expiresAt: params.budget.expiresAt, status: "withheld_pending_owner_admission", executionAllowed: false });
  const canonical = JSON.parse(canonicalPayload) as Omit<FounderEphemeralAgentLease, "canonicalPayload" | "sha256">;
  return { ...canonical, canonicalPayload, sha256: await sha256Hex(canonicalPayload) };
}

export async function verifyFounderEphemeralAgentLease(record: FounderIntentRecord, budget: FounderIntentBudgetEnvelope, technology: FounderTechnologyAssessment, lease: FounderEphemeralAgentLease) {
  if (!await verifyFounderIntentRecord(record) || !await verifyFounderIntentBudgetEnvelope(record, budget)) return false;
  if (technology.disposition !== "compatible_pending_owner_admission" || technology.executionAllowed !== false) return false;
  if (lease.intentId !== record.id || lease.capabilityScope !== record.module || lease.actionLimit !== budget.actionLimit || lease.expiresAt !== budget.expiresAt || lease.status !== "withheld_pending_owner_admission" || lease.executionAllowed !== false) return false;
  if (!/^[0-9a-f]{64}$/.test(lease.sha256) || await sha256Hex(lease.canonicalPayload) !== lease.sha256) return false;
  const signed = JSON.parse(lease.canonicalPayload) as Record<string, unknown>;
  return signed.marker === lease.marker && signed.intentId === record.id && signed.intentSha256 === record.sha256 && signed.budgetSha256 === budget.sha256 && signed.technologySha256 === technology.sha256 && signed.agentId === lease.agentId && signed.capabilityScope === lease.capabilityScope && signed.actionLimit === lease.actionLimit && signed.expiresAt === lease.expiresAt && signed.status === lease.status && signed.executionAllowed === false;
}

export async function createFounderEphemeralAgentRevocation(params: { record: FounderIntentRecord; lease: FounderEphemeralAgentLease; revokedAt: string; reason: FounderEphemeralAgentRevocation["reason"] }): Promise<FounderEphemeralAgentRevocation> {
  if (!await verifyFounderIntentRecord(params.record)) throw new Error("intent_record_integrity_failed");
  if (params.lease.intentId !== params.record.id || params.lease.executionAllowed !== false || await sha256Hex(params.lease.canonicalPayload) !== params.lease.sha256) throw new Error("agent_lease_integrity_failed");
  if (!Number.isFinite(Date.parse(params.revokedAt))) throw new Error("revoked_at_invalid");
  if (!["owner_revoked", "budget_exhausted", "integrity_failure", "expired"].includes(params.reason)) throw new Error("revocation_reason_invalid");
  const canonicalPayload = JSON.stringify({ marker: "pantavion_founder_ephemeral_agent_revocation_v1", intentId: params.record.id, intentSha256: params.record.sha256, agentId: params.lease.agentId, leaseSha256: params.lease.sha256, revokedAt: new Date(params.revokedAt).toISOString(), reason: params.reason, terminal: true, executionAllowed: false });
  const canonical = JSON.parse(canonicalPayload) as Omit<FounderEphemeralAgentRevocation, "canonicalPayload" | "sha256">;
  return { ...canonical, canonicalPayload, sha256: await sha256Hex(canonicalPayload) };
}

export async function verifyFounderEphemeralAgentRevocation(record: FounderIntentRecord, lease: FounderEphemeralAgentLease, revocation: FounderEphemeralAgentRevocation) {
  if (!await verifyFounderIntentRecord(record)) return false;
  if (revocation.intentId !== record.id || revocation.agentId !== lease.agentId || revocation.leaseSha256 !== lease.sha256 || revocation.terminal !== true || revocation.executionAllowed !== false) return false;
  if (!/^[0-9a-f]{64}$/.test(revocation.sha256) || await sha256Hex(revocation.canonicalPayload) !== revocation.sha256) return false;
  const signed = JSON.parse(revocation.canonicalPayload) as Record<string, unknown>;
  return signed.marker === revocation.marker && signed.intentId === record.id && signed.intentSha256 === record.sha256 && signed.agentId === lease.agentId && signed.leaseSha256 === lease.sha256 && signed.revokedAt === revocation.revokedAt && signed.reason === revocation.reason && signed.terminal === true && signed.executionAllowed === false;
}

export async function createFounderIntentVerificationBundle(params: { record: FounderIntentRecord; firewall: FounderIntentFirewallAssessment; budget: FounderIntentBudgetEnvelope; handoff: FounderIntentEdgeHandoff; technology: FounderTechnologyAssessment }): Promise<FounderIntentVerificationBundle> {
  if (!await verifyFounderIntentRecord(params.record)) throw new Error("intent_record_integrity_failed");
  if (!await verifyFounderIntentFirewallAssessment(params.record, params.firewall)) throw new Error("intent_firewall_integrity_failed");
  if (!await verifyFounderIntentBudgetEnvelope(params.record, params.budget)) throw new Error("intent_budget_integrity_failed");
  if (!await verifyFounderIntentEdgeHandoff({ record: params.record, assessment: params.firewall, budget: params.budget, handoff: params.handoff })) throw new Error("edge_handoff_integrity_failed");
  if (!await verifyFounderTechnologyAssessment(params.record, params.handoff, params.technology)) throw new Error("technology_assessment_integrity_failed");
  const receiptChain: FounderIntentVerificationBundle["receiptChain"] = [params.record.sha256, params.firewall.sha256, params.budget.sha256, params.handoff.sha256, params.technology.sha256];
  const canonicalPayload = JSON.stringify({ marker: "pantavion_founder_intent_verification_bundle_v1", intentId: params.record.id, receiptChain, lifecycleState: "TESTED_LOCALLY_NOT_MERGED", syntheticRecordsCountedAsImplementation: 0 });
  return { marker: "pantavion_founder_intent_verification_bundle_v1", intentId: params.record.id, receiptChain, lifecycleState: "TESTED_LOCALLY_NOT_MERGED", syntheticRecordsCountedAsImplementation: 0, canonicalPayload, sha256: await sha256Hex(canonicalPayload) };
}

export async function verifyFounderIntentVerificationBundle(bundle: FounderIntentVerificationBundle) {
  if (bundle.lifecycleState !== "TESTED_LOCALLY_NOT_MERGED" || bundle.syntheticRecordsCountedAsImplementation !== 0 || bundle.receiptChain.length !== 5) return false;
  if (bundle.receiptChain.some((receipt) => !/^[0-9a-f]{64}$/.test(receipt))) return false;
  if (!/^[0-9a-f]{64}$/.test(bundle.sha256) || await sha256Hex(bundle.canonicalPayload) !== bundle.sha256) return false;
  const signed = JSON.parse(bundle.canonicalPayload) as Record<string, unknown>;
  return signed.marker === bundle.marker && signed.intentId === bundle.intentId && JSON.stringify(signed.receiptChain) === JSON.stringify(bundle.receiptChain) && signed.lifecycleState === bundle.lifecycleState && signed.syntheticRecordsCountedAsImplementation === 0;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveVaultKey(passphrase: string, salt: Uint8Array) {
  if (passphrase.length < 12 || passphrase.length > 256) throw new Error("vault_passphrase_invalid");
  const material = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return globalThis.crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: vaultIterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptFounderIntentVault(
  records: FounderIntentRecord[],
  passphrase: string,
): Promise<EncryptedFounderIntentVault> {
  const checks = await Promise.all(records.map((record) => verifyFounderIntentRecord(record)));
  if (checks.some((valid) => !valid)) throw new Error("vault_record_integrity_failed");

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(records));
  const ciphertext = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  return {
    marker: FOUNDER_INTENT_VAULT_MARKER,
    cipher: "AES-GCM-256",
    kdf: "PBKDF2-SHA-256",
    iterations: vaultIterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptFounderIntentVault(
  vault: EncryptedFounderIntentVault,
  passphrase: string,
) {
  if (vault.marker !== FOUNDER_INTENT_VAULT_MARKER
    || vault.cipher !== "AES-GCM-256"
    || vault.kdf !== "PBKDF2-SHA-256"
    || vault.iterations !== vaultIterations) {
    throw new Error("intent_vault_invalid");
  }

  try {
    const salt = base64ToBytes(vault.salt);
    const iv = base64ToBytes(vault.iv);
    if (salt.length !== 16 || iv.length !== 12) throw new Error("intent_vault_invalid");
    const key = await deriveVaultKey(passphrase, salt);
    const plaintext = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      base64ToBytes(vault.ciphertext),
    );
    const records = JSON.parse(new TextDecoder().decode(plaintext)) as FounderIntentRecord[];
    if (!Array.isArray(records)) throw new Error("intent_vault_invalid");
    const checks = await Promise.all(records.map((record) => verifyFounderIntentRecord(record)));
    if (checks.some((valid) => !valid)) throw new Error("vault_record_integrity_failed");
    return records;
  } catch (cause) {
    if (cause instanceof Error && ["intent_vault_invalid", "vault_record_integrity_failed", "vault_passphrase_invalid"].includes(cause.message)) {
      throw cause;
    }
    throw new Error("intent_vault_unlock_failed");
  }
}
