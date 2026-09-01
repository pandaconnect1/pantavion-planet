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
