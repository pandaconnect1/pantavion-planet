import assert from "node:assert/strict";

import {
  assessFounderIntentFirewall,
  assessFounderTechnologyLibrary,
  canonicalizeFounderIntent,
  createFounderIntentBudgetEnvelope,
  createFounderIntentEdgeHandoff,
  createFounderIntentRecord,
  decryptFounderIntentVault,
  encryptFounderIntentVault,
  validateFounderIntentInput,
  verifyFounderIntentRecord,
  verifyFounderIntentFirewallAssessment,
  verifyFounderIntentBudgetEnvelope,
  verifyFounderIntentEdgeHandoff,
  verifyFounderTechnologyAssessment,
} from "../core/intent/pantavion-founder-intent-workbench.ts";

const input = {
  title: "  Build   a real offline intent surface ",
  desiredOutcome: "Founder can capture and verify an intent without network access.",
  acceptanceEvidence: "The record persists locally and its SHA-256 verifies after export/import.",
  module: "disconnected_edge",
  priority: "high",
  maxActions: 8,
  maxMinutes: 120,
};

assert.deepEqual(validateFounderIntentInput(input), { valid: true, errors: [] });

const params = {
  input,
  id: "11111111-2222-4333-8444-555555555555",
  createdAt: "2026-09-01T07:00:00.000Z",
};

const first = await createFounderIntentRecord(params);
const second = await createFounderIntentRecord(params);

assert.equal(first.canonicalPayload, second.canonicalPayload, "canonical payload must be deterministic");
assert.equal(first.sha256, second.sha256, "digest must be deterministic");
assert.match(first.sha256, /^[0-9a-f]{64}$/);
assert.equal(first.title, "Build a real offline intent surface");
assert.equal(first.networkPolicy, "offline_only");
assert.equal(first.productionWriteAuthority, false);
assert.equal(first.mergeAuthority, false);
assert.equal(first.deploymentAuthority, false);
assert.equal(await verifyFounderIntentRecord(first), true);

const assessment = await assessFounderIntentFirewall(first);
assert.equal(assessment.disposition, "owner_review_required");
assert.equal(assessment.executionAllowed, false);
assert.ok(assessment.reasons.includes("explicit_execution_authority_missing"));
assert.equal(await verifyFounderIntentFirewallAssessment(first, assessment), true);
assert.match(assessment.sha256, /^[0-9a-f]{64}$/);
assert.equal(
  await verifyFounderIntentFirewallAssessment(first, { ...assessment, reasons: [...assessment.reasons, "tampered"] }),
  false,
  "tampered displayed reasons must fail receipt verification",
);
assert.equal(
  await verifyFounderIntentFirewallAssessment(first, { ...assessment, assessedPayload: assessment.assessedPayload.replace("owner_review_required", "allow") }),
  false,
  "tampered signed payload must fail receipt verification",
);

const budget = await createFounderIntentBudgetEnvelope(first);
assert.equal(budget.capabilityScope, "disconnected_edge");
assert.equal(budget.actionLimit, 8);
assert.equal(budget.timeLimitMinutes, 120);
assert.equal(budget.grantStatus, "withheld_pending_owner_review");
assert.equal(budget.executionAllowed, false);
assert.equal(await verifyFounderIntentBudgetEnvelope(first, budget), true);
assert.equal(await verifyFounderIntentBudgetEnvelope(first, { ...budget, actionLimit: 9 }), false);

const handoff = await createFounderIntentEdgeHandoff({ record: first, assessment, budget, nonce: "00112233445566778899aabbccddeeff", createdAt: "2026-09-01T07:01:00.000Z" });
assert.equal(handoff.networkPolicy, "offline_only");
assert.equal(handoff.replayPolicy, "single_use_pending_owner_admission");
assert.equal(handoff.executionAllowed, false);
assert.equal(handoff.intentSha256, first.sha256);
assert.equal(handoff.firewallSha256, assessment.sha256);
assert.equal(handoff.budgetSha256, budget.sha256);
assert.equal(await verifyFounderIntentEdgeHandoff({ record: first, assessment, budget, handoff }), true);
assert.equal(await verifyFounderIntentEdgeHandoff({ record: first, assessment, budget, handoff: { ...handoff, nonce: "ffffffffffffffffffffffffffffffff" } }), false);

const technology = await assessFounderTechnologyLibrary(first, handoff);
assert.equal(technology.disposition, "compatible_pending_owner_admission");
assert.deepEqual(technology.missingCapabilities, []);
assert.ok(technology.approvedTechnologies.includes("WebCrypto AES-GCM"));
assert.ok(technology.approvedTechnologies.includes("IndexedDB"));
assert.equal(technology.executionAllowed, false);
assert.equal(await verifyFounderTechnologyAssessment(first, handoff, technology), true);
assert.equal(await verifyFounderTechnologyAssessment(first, handoff, { ...technology, approvedTechnologies: [...technology.approvedTechnologies, "Unreviewed Runtime"] }), false);

const tampered = { ...first, desiredOutcome: "tampered" };
assert.equal(await verifyFounderIntentRecord(tampered), false, "tampering must fail closed");

const widenedAuthority = { ...first, productionWriteAuthority: true };
assert.equal(await verifyFounderIntentRecord(widenedAuthority), false, "authority widening must fail closed");

const vault = await encryptFounderIntentVault([first], "correct horse battery staple");
assert.equal(vault.cipher, "AES-GCM-256");
assert.equal(vault.kdf, "PBKDF2-SHA-256");
assert.deepEqual(await decryptFounderIntentVault(vault, "correct horse battery staple"), [first]);
await assert.rejects(
  () => decryptFounderIntentVault(vault, "wrong passphrase"),
  /intent_vault_unlock_failed/,
);
await assert.rejects(
  () => decryptFounderIntentVault({ ...vault, ciphertext: `${vault.ciphertext.slice(0, -2)}AA` }, "correct horse battery staple"),
  /intent_vault_unlock_failed/,
);

assert.throws(
  () => canonicalizeFounderIntent({ ...params, input: { ...input, maxActions: 51 } }),
  /max_actions_invalid/,
);

assert.throws(
  () => canonicalizeFounderIntent({ ...params, input: { ...input, acceptanceEvidence: "" } }),
  /acceptance_evidence_required/,
);

console.log(JSON.stringify({
  marker: "pantavion_founder_intent_workbench_test_v1",
  status: "passed",
  assertions: 48,
  actualCapability: "encrypted offline intent capture plus fail-closed Firewall, capability/budget, replay-bound edge handoff, and Technology Library admission",
  sha256: first.sha256,
  syntheticRecordsCountedAsImplementation: 0,
}, null, 2));
