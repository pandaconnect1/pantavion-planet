import assert from "node:assert/strict";
import {
  assessCrossCulturalUnderstanding,
} from "../core/pantavion/cross-cultural-understanding-assessment.ts";

let assertions = 0;
const eq = (actual, expected, message) => { assert.equal(actual, expected, message); assertions += 1; };
const ok = (value, message) => { assert.ok(value, message); assertions += 1; };
const throws = (fn, pattern, message) => { assert.throws(fn, pattern, message); assertions += 1; };

const policy = {
  policyVersion: "pantavion-understanding-v1",
  maximumDeviationForUnderstanding: 0.2,
  requireOwnerReviewForMinors: true,
  maximumTextLength: 2048,
};
const base = {
  messageId: "msg-001",
  originalMessageDigest: "a".repeat(64),
  translationReceipt: "b".repeat(64),
  senderIntent: "Ask whether the recipient can attend a safe community meeting.",
  sourceLanguage: "el",
  targetLanguage: "en",
  culturalContext: "Cyprus community context",
  recipientAgeBand: "ADULT",
  jurisdiction: "CY",
  jurisdictionDecision: "ADMIT",
  consentToUnderstandingCheck: true,
  understandingSignal: "UNDERSTOOD",
  recipientMeaningSummary: "The sender asks whether I can attend the community meeting.",
  meaningDeviationScore: 0.1,
  safetySignal: "NONE",
};

const understood = assessCrossCulturalUnderstanding(base, policy);
eq(understood.decision, "UNDERSTOOD", "verified understanding decision");
eq(understood.understandingVerified, true, "understanding verified only on admitted signal");
eq(understood.repairDirective, null, "no repair directive for understood outcome");
eq(understood.reasons[0], "recipient_understanding_within_threshold", "explicit reason");
ok(/^[a-f0-9]{64}$/.test(understood.evidenceReceipt), "canonical SHA-256 evidence receipt");
eq(understood.assessmentOnly, true, "assessment-only boundary");
eq(understood.messageDelivered, false, "no message delivery");
eq(understood.repairExecuted, false, "no repair execution");
eq(understood.executionAllowed, false, "no execution authority");
eq(understood.productionWriteAllowed, false, "no production write");
eq(understood.authorizationEffect, "none", "no authorization effect");

const repeat = assessCrossCulturalUnderstanding(structuredClone(base), structuredClone(policy));
eq(repeat.evidenceReceipt, understood.evidenceReceipt, "byte-stable deterministic receipt");

const highDeviation = assessCrossCulturalUnderstanding({...base, meaningDeviationScore:0.7}, policy);
eq(highDeviation.decision, "REPAIR_REQUIRED", "deviation requires repair");
eq(highDeviation.understandingVerified, false, "repair pending is not understood");
eq(highDeviation.repairDirective?.preserveOriginalIntent, true, "repair preserves original intent");
eq(highDeviation.repairDirective?.maximumAttempts, 1, "repair is bounded");
eq(highDeviation.repairDirective?.mode, "CLARIFY_WITHOUT_AUTHORITY_EXPANSION", "repair cannot widen authority");
ok(highDeviation.reasons.includes("meaning_deviation_above_threshold"), "deviation blocker visible");

const partial = assessCrossCulturalUnderstanding({...base, understandingSignal:"PARTIAL", meaningDeviationScore:0.1}, policy);
eq(partial.decision, "REPAIR_REQUIRED", "reported partial understanding requires repair");
ok(partial.reasons.includes("recipient_reports_incomplete_understanding"), "partial signal reason visible");

const declined = assessCrossCulturalUnderstanding({...base, consentToUnderstandingCheck:false, understandingSignal:"DECLINED", recipientMeaningSummary:""}, policy);
eq(declined.decision, "DENY", "consent denial fails closed");
eq(declined.repairDirective, null, "no repair without consent");
eq(declined.understandingVerified, false, "decline cannot verify understanding");

const jurisdictionDenied = assessCrossCulturalUnderstanding({...base, jurisdictionDecision:"DENY"}, policy);
eq(jurisdictionDenied.decision, "DENY", "jurisdiction denial fails closed");
ok(jurisdictionDenied.reasons.includes("jurisdiction_denied"), "jurisdiction reason visible");

const harm = assessCrossCulturalUnderstanding({...base, safetySignal:"IMMINENT_HARM"}, policy);
eq(harm.decision, "DENY", "imminent harm fails closed");
ok(harm.reasons.includes("imminent_harm_escalation_required"), "harm escalation reason visible");

const minor = assessCrossCulturalUnderstanding({...base, recipientAgeBand:"TEEN"}, policy);
eq(minor.decision, "OWNER_APPROVAL_REQUIRED", "minor requires owner review");
ok(minor.reasons.includes("minor_owner_review"), "minor blocker visible");
eq(minor.executionAllowed, false, "owner review does not authorize execution");

const review = assessCrossCulturalUnderstanding({...base, jurisdictionDecision:"OWNER_REVIEW"}, policy);
eq(review.decision, "OWNER_APPROVAL_REQUIRED", "jurisdiction review remains withheld");

const potential = assessCrossCulturalUnderstanding({...base, safetySignal:"POTENTIAL_HARM"}, policy);
eq(potential.decision, "OWNER_APPROVAL_REQUIRED", "potential harm remains withheld");

const changedPolicy = assessCrossCulturalUnderstanding(base, {...policy, maximumDeviationForUnderstanding:0.15});
ok(changedPolicy.evidenceReceipt !== understood.evidenceReceipt, "policy is bound into receipt");
const changedIntent = assessCrossCulturalUnderstanding({...base, senderIntent:"Different bounded intent."}, policy);
ok(changedIntent.evidenceReceipt !== understood.evidenceReceipt, "intent is bound into receipt");

throws(() => assessCrossCulturalUnderstanding({...base, originalMessageDigest:"bad"}, policy), /invalid_original_digest/, "reject invalid source digest");
throws(() => assessCrossCulturalUnderstanding({...base, translationReceipt:"bad"}, policy), /invalid_translation_receipt/, "reject invalid translation receipt");
throws(() => assessCrossCulturalUnderstanding({...base, meaningDeviationScore:1.1}, policy), /invalid_meaning_deviation/, "reject invalid deviation");
throws(() => assessCrossCulturalUnderstanding({...base, senderIntent:""}, policy), /sender_intent_required/, "reject empty intent");
throws(() => assessCrossCulturalUnderstanding(base, {...policy, maximumDeviationForUnderstanding:-1}), /invalid_deviation_threshold/, "reject invalid threshold");
throws(() => assessCrossCulturalUnderstanding(base, {...policy, maximumTextLength:16}), /invalid_text_bound/, "reject unsafe text bound");
throws(() => assessCrossCulturalUnderstanding({...base, culturalContext:"x".repeat(2049)}, policy), /cultural_context_too_long/, "reject oversized context");

console.log(`Cross-cultural understanding assessment contract: PASS (${assertions} assertions)`);
