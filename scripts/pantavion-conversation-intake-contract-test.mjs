import assert from "node:assert/strict";

import {
  createPantavionConversationIntakeRecord,
  createPantavionConversationWorkOrderCandidate,
} from "../core/intake/pantavion-conversation-intake.ts";

const record = createPantavionConversationIntakeRecord({
  sourceKind: "chat_thread",
  sourceId: "chat:2026-08-28:personal-ai-continuity",
  sourceDate: "2026-08-28T18:14:42Z",
  sourceThreadTitle: "Pantavion continuity",
  text: "Move Pantavion requirements into the canonical Planet and execute them through Pantavion.",
  domains: ["personal_ai", "kernel", "recovery"],
  truthState: "CANDIDATE",
  implementationState: "SPEC_ONLY",
  canonicalReferences: ["pandaconnect1/pantavion-planet"],
});

assert.equal(record.marker, "pantavion_conversation_intake_v1");
assert.equal(record.source.originalPreserved, true);
assert.equal(record.authority.directExecutionAllowed, false);
assert.equal(record.authority.productionAuthority, false);
assert.equal(record.authority.workOrderPromotionRequired, true);
assert.equal(record.authority.founderGateRequired, true);
assert.match(record.source.sha256, /^[a-f0-9]{64}$/);
assert.match(record.intakeId, /^pci_[a-f0-9]{32}$/);

const repeated = createPantavionConversationIntakeRecord({
  sourceKind: "chat_thread",
  sourceId: "chat:2026-08-28:personal-ai-continuity",
  sourceDate: "2026-08-28T18:14:42Z",
  sourceThreadTitle: "Pantavion continuity",
  text: "Move Pantavion requirements into the canonical Planet and execute them through Pantavion.",
  domains: ["personal_ai", "kernel", "recovery"],
  truthState: "CANDIDATE",
  implementationState: "SPEC_ONLY",
  canonicalReferences: ["pandaconnect1/pantavion-planet"],
});

assert.equal(repeated.source.sha256, record.source.sha256);
assert.equal(repeated.intakeId, record.intakeId);

const candidate = createPantavionConversationWorkOrderCandidate(record);
assert.equal(candidate.marker, "pantavion_conversation_work_order_candidate_v1");
assert.equal(candidate.authority.directExecutionAllowed, false);
assert.equal(candidate.authority.approvalScope, "proposal_only");
assert.equal(candidate.submission.approvalScope, "proposal_only");
assert.equal(candidate.submission.workload?.kind, "single_work_order");
assert.equal(candidate.submission.workload?.unitCount, 1);
assert.equal(candidate.submission.workload?.intakeReference, record.intakeId);
assert.equal(candidate.submission.target, "pantaai_center");
assert.ok(candidate.submission.capabilities.includes("founder_approval_gate"));
assert.ok(candidate.submission.capabilities.includes("repo_truth"));
assert.ok(candidate.submission.founderIntent.includes(record.source.sha256));
assert.ok(candidate.submission.founderIntent.includes("Preserve newer verified decisions"));

const translation = createPantavionConversationWorkOrderCandidate(
  createPantavionConversationIntakeRecord({
    sourceKind: "handoff",
    sourceId: "handoff:translation",
    text: "Complete stable bidirectional translation without public fallback.",
    domains: ["translation", "voice"],
  }),
);
assert.equal(translation.submission.target, "translation");

const social = createPantavionConversationWorkOrderCandidate(
  createPantavionConversationIntakeRecord({
    sourceKind: "memory_recovery",
    sourceId: "memory:social-chat",
    text: "Recover and compare Social, People and Chat requirements.",
    domains: ["people", "chat", "social"],
  }),
);
assert.equal(social.submission.target, "social_universe");

const safety = createPantavionConversationWorkOrderCandidate(
  createPantavionConversationIntakeRecord({
    sourceKind: "repo_recovery",
    sourceId: "repo:security",
    text: "Preserve zero-trust and founder approval boundaries.",
    domains: ["security", "kernel"],
  }),
);
assert.equal(safety.submission.target, "safety_system");

assert.throws(
  () =>
    createPantavionConversationIntakeRecord({
      sourceKind: "chat_thread",
      sourceId: "../escape",
      text: "invalid",
    }),
  /conversation_intake_source_id_invalid/,
);

assert.throws(
  () =>
    createPantavionConversationIntakeRecord({
      sourceKind: "chat_thread",
      sourceId: "chat:empty",
      text: "   ",
    }),
  /conversation_intake_text_required/,
);

console.log("PANTAVION CONVERSATION INTAKE CONTRACT: PASSED");
console.log("- deterministic provenance fingerprint: yes");
console.log("- original source preserved: yes");
console.log("- direct execution authority: no");
console.log("- founder-gated work-order promotion required: yes");
console.log("- canonical target routing: yes");
