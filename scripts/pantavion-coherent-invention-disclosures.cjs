const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const qualityPath = path.join(root, "data", "recovery", "preseed-shortlist-quality-audit", "manifest.json");
const outDir = path.join(root, "data", "recovery", "coherent-invention-disclosures");
const expectedQualityFingerprint = "c0ffee"; // replaced by gate binding to exact verdict and source fingerprint

function fail(message) {
  console.error("PANTAVION COHERENT INVENTION DISCLOSURES: FAIL - " + message);
  process.exit(1);
}
function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
function csvEscape(value) {
  return '"' + String(value ?? "").replace(/"/g, '""') + '"';
}
function canonicalDisclosure(input) {
  return {
    id: input.id,
    title: input.title,
    implementationStage: input.implementationStage,
    problem: input.problem,
    actors: input.actors,
    inputs: input.inputs,
    orderedSteps: input.orderedSteps,
    stateTransitions: input.stateTransitions,
    constraints: input.constraints,
    technicalEffect: input.technicalEffect,
    measurableOutcomes: input.measurableOutcomes,
    implementationEvidence: input.implementationEvidence,
    priorArtRisks: input.priorArtRisks,
    researchQuestions: input.researchQuestions,
    researchFitness: "COHERENT_TECHNICAL_MECHANISM",
    priorArtStatus: "UNVERIFIED_PRIOR_ART_REQUIRED",
    noveltyStatus: "NO_CLAIM",
    patentabilityStatus: "NO_CLAIM",
    claimDraftingStatus: "READY_FOR_PROFESSIONAL_REVIEW",
    publicDisclosureAuthorized: false,
    applicationEvidenceAuthorized: false,
    ownerApproved: false,
    executionAllowed: false,
    authorizationEffect: "none",
  };
}

if (!fs.existsSync(qualityPath)) fail("exact #494 quality manifest missing");
const quality = JSON.parse(fs.readFileSync(qualityPath, "utf8"));
if (quality.verdict !== "REJECT_FOR_INNOVATION_RESEARCH") fail("parent quality verdict drifted");
if (quality.sourceShortlistFingerprint !== "784202a49ab7fe27442021d2d66a8cd1dd4f792e255ea8376ceeb0f52db2d3d6") fail("parent shortlist fingerprint drifted");
if (quality.totals?.sourceItems !== 150 || quality.totals?.researchEligible !== 0 || quality.totals?.sourceRowsPreserved !== 150) fail("parent quality totals drifted");

const disclosures = [
  canonicalDisclosure({
    id: "verified-cross-cultural-understanding-loop",
    title: "Verified Cross-Cultural Understanding and Adaptive Repair Loop",
    implementationStage: "IDEA",
    problem: "Machine translation can produce linguistically plausible output without evidence that the recipient understood the sender's intended meaning under the recipient's culture, age, jurisdiction, consent and safety constraints.",
    actors: ["sender", "recipient", "translation_runtime", "policy_engine", "understanding_verifier", "repair_controller"],
    inputs: ["source_message", "source_language", "target_language", "sender_intent", "cultural_context", "recipient_context", "age_band", "jurisdiction_policy", "consent_state", "safety_policy"],
    orderedSteps: [
      "Preserve the original message and extract a bounded intent representation.",
      "Generate a translation while binding provenance to the original message and policy context.",
      "Apply age, jurisdiction, consent and safety constraints before delivery.",
      "Collect an explicit or measured recipient-understanding signal without treating delivery as comprehension.",
      "Compute bounded meaning deviation between sender intent and recipient understanding.",
      "When deviation exceeds policy thresholds, generate a constrained repair turn and require approval where policy demands it.",
      "Bind the original, translation, policy decisions, understanding signal, deviation and repair outcome into an evidence receipt."
    ],
    stateTransitions: ["INTENT_CAPTURED->TRANSLATED", "TRANSLATED->POLICY_ADMITTED", "POLICY_ADMITTED->UNDERSTANDING_PENDING", "UNDERSTANDING_PENDING->UNDERSTOOD|REPAIR_REQUIRED", "REPAIR_REQUIRED->REPAIRED|ESCALATED"],
    constraints: ["original_message_preserved", "no_perfect_translation_claim", "recipient_consent_required", "age_and_jurisdiction_fail_closed", "repair_cannot_expand_original_authority", "raw_audio_not_retained_by_default"],
    technicalEffect: "Uses recipient understanding as a feedback signal to trigger policy-aware communication repair while preserving an auditable chain between original intent and final understood outcome.",
    measurableOutcomes: ["meaning_deviation_rate", "verified_understanding_rate", "repair_success_rate", "policy_violation_rate", "false_repair_rate", "end_to_end_latency_ms", "cost_per_verified_turn"],
    implementationEvidence: [
      { kind:"RECOVERED_REQUIREMENT", ref:"main@f23533d21c8be62ca1ddd0c3ecb5fe50c22d6912:data/founder-vision-vault/conversation-intake/PANTAVION_THREAD_RECOVERY_SEED_20260828.md" },
      { kind:"FOUNDATION_CODE", ref:"main@f23533d21c8be62ca1ddd0c3ecb5fe50c22d6912:core/kernel/language/pantavion-language-kernel.ts" },
      { kind:"TRUTH_LEDGER", ref:"main@f23533d21c8be62ca1ddd0c3ecb5fe50c22d6912:core/product/pantavion-product-truth-ledger.ts" }
    ],
    priorArtRisks: ["interactive_machine_translation", "quality_estimation", "teach_back", "dialogue_repair", "culturally_adaptive_translation", "policy_based_access_control"],
    researchQuestions: [
      "Does prior art bind recipient-understanding verification to automatic policy-aware repair in a social communication loop?",
      "What objective meaning-deviation computation can be claimed without relying only on a generic language model?",
      "Which ordered combination produces a measurable technical effect beyond known translation and dialogue-repair systems?"
    ]
  }),
  canonicalDisclosure({
    id: "sovereign-ai-admission-evidence-chain",
    title: "Cryptographically Bound Sovereign AI Admission and Evidence Chain",
    implementationStage: "TESTED",
    problem: "Agentic workflows can pass individually valid policy, capability, budget, swarm and edge checks while executing with stale, mismatched or expanded authority across component boundaries.",
    actors: ["intent_owner", "intent_firewall", "plan_compiler", "capability_budget_controller", "swarm_admission_controller", "edge_preflight", "owner_admission_gate", "execution_runtime", "evidence_verifier"],
    inputs: ["intent_hash", "policy_receipt", "dependency_plan_receipt", "capability_scope_receipt", "budget_ceiling_receipt", "agent_topology_receipt", "edge_conditions_receipt", "owner_admission_receipt"],
    orderedSteps: [
      "Canonicalize the owner's intent and bind it to an immutable intent hash.",
      "Evaluate the intent firewall and dependency plan without granting execution authority.",
      "Bind capability, scope, expiry and budget ceilings to the same admission identity.",
      "Bind bounded ephemeral-agent topology and disconnected-edge preconditions.",
      "Reject admission if component identity, order, receipt length, expiry or authority constraints conflict.",
      "Require a distinct founder admission action after a READY_FOR_OWNER_ADMISSION preflight.",
      "At execution time revalidate the complete bundle and prevent any capability, budget or scope expansion.",
      "Bind post-execution evidence to the admitted bundle for deterministic verification and replay."
    ],
    stateTransitions: ["UNASSEMBLED->RECEIPTS_BOUND", "RECEIPTS_BOUND->DENY|OWNER_APPROVAL_REQUIRED|READY_FOR_OWNER_ADMISSION", "READY_FOR_OWNER_ADMISSION->ADMITTED|EXPIRED", "ADMITTED->EXECUTING", "EXECUTING->EVIDENCE_BOUND|REVOKED"],
    constraints: ["fixed_component_order", "unique_sha256_receipts", "exact_component_identity", "adjacent_lifecycle_only", "fail_closed_on_drift", "budget_and_scope_non_expansion", "owner_admission_separate_from_preflight", "no_execution_authority_in_preflight"],
    technicalEffect: "Prevents confused-deputy and cross-component authority escalation by making every execution-relevant constraint part of one revalidated cryptographic admission envelope.",
    measurableOutcomes: ["stale_receipt_rejection_rate", "capability_escalation_prevention_rate", "budget_overrun_prevention_rate", "replay_determinism_rate", "false_admission_rate", "admission_latency_ms"],
    implementationEvidence: [
      { kind:"TESTED_COMPONENT", ref:"PR#476@4fa03685a7277d4696873996ddd0b5b94b6514e0" },
      { kind:"TESTED_COMPONENT", ref:"PR#482@0d90c1906e0f22120eb00ee3a2c194065763f49b" },
      { kind:"TESTED_COMPONENT", ref:"PR#478@94791f0ab08fc8746d37977bb73e597fe8c4bf2a" },
      { kind:"TESTED_COMPONENT", ref:"PR#481@0d19340415546a63d7148a82d8b3746ff5e49bce" },
      { kind:"TESTED_COMPONENT", ref:"PR#479@67baa0fab093a7406af703619dec89bd48304d0e" },
      { kind:"TESTED_INTEGRATION", ref:"PR#489@34ef8f01c0ae53412a4b07ae93f8a13c711c2a16" }
    ],
    priorArtRisks: ["policy_engines", "capability_security", "workflow_provenance", "software_supply_chain_attestations", "short_lived_workload_identity", "multi_agent_orchestration", "human_in_the_loop_approval"],
    researchQuestions: [
      "Does prior art disclose one cryptographic envelope spanning intent, policy, capability, budget, topology, edge state, owner admission and post-execution evidence?",
      "Which bundle invariants demonstrably prevent confused-deputy or authority-escalation failures not prevented by independent checks?",
      "Can deterministic replay prove non-expansion of authority across disconnected execution?"
    ]
  })
];

for (const disclosure of disclosures) {
  for (const field of ["problem","technicalEffect"]) if (disclosure[field].length < 80) fail(disclosure.id + " incomplete " + field);
  for (const field of ["actors","inputs","orderedSteps","stateTransitions","constraints","measurableOutcomes","implementationEvidence","priorArtRisks","researchQuestions"]) {
    if (!Array.isArray(disclosure[field]) || disclosure[field].length < 3) fail(disclosure.id + " incomplete " + field);
  }
  disclosure.disclosureFingerprint = hash(JSON.stringify(disclosure));
}
const disclosureFingerprint = hash(disclosures.map(item => item.disclosureFingerprint).join("\n"));
const manifest = {
  id: "pantavion_coherent_invention_disclosures_v1",
  lifecycleState: "CODED",
  parentQualityVerdict: quality.verdict,
  parentSourceShortlistFingerprint: quality.sourceShortlistFingerprint,
  disclosureFingerprint,
  totals: {
    rejectedFragmentaryInputsPreserved: 150,
    coherentDisclosures: disclosures.length,
    ideaStage: disclosures.filter(item => item.implementationStage === "IDEA").length,
    testedStage: disclosures.filter(item => item.implementationStage === "TESTED").length,
    priorArtVerified: 0,
    noveltyClaims: 0,
    patentabilityClaims: 0,
    applicationEvidenceAuthorized: 0,
    publicDisclosureAuthorized: 0,
    executionAuthorized: 0
  },
  truthRule: "Coherent disclosure means suitable for professional claim drafting and prior-art research only. It is not proof of novelty, patentability, ownership, freedom to operate, funding eligibility or production readiness."
};
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
fs.writeFileSync(path.join(outDir, "disclosures.json"), JSON.stringify({manifest, disclosures}, null, 2) + "\n");
const rows = [["id","title","implementation_stage","research_fitness","prior_art_status","novelty_status","patentability_status","fingerprint"]];
for (const item of disclosures) rows.push([item.id,item.title,item.implementationStage,item.researchFitness,item.priorArtStatus,item.noveltyStatus,item.patentabilityStatus,item.disclosureFingerprint]);
fs.writeFileSync(path.join(outDir, "disclosures.csv"), rows.map(row => row.map(csvEscape).join(",")).join("\n") + "\n");
console.log(JSON.stringify(manifest, null, 2));
