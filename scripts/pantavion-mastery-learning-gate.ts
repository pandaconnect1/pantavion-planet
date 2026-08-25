import { buildPantavionMasterySystemInstruction, resolvePantavionMasteryLearningPolicy } from "../core/learning/mastery-learning-policy";
import { resolvePantavionScanLearningPolicy } from "../core/learning/scan-to-learn-policy";

function equal<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, received ${String(actual)}`);
}

function includes(values: readonly string[], expected: string, label: string): void {
  if (!values.includes(expected)) throw new Error(`${label}: missing ${expected}`);
}

const mastery = resolvePantavionMasteryLearningPolicy({ goal: "solve_problem", learnerRequestedImmediateAnswer: true });
equal(mastery.principle, "mastery_before_answer", "mastery principle");
equal(mastery.directAnswerDefault, false, "no direct answer dump by default");
equal(mastery.preferHintsBeforeWorkedSolution, true, "hints before worked solution");
equal(mastery.requireStudentAttemptWhenAppropriate, true, "student attempt required when appropriate");
equal(mastery.requireConceptExplanationWithWorkedSolution, true, "worked solution teaches concept");
equal(mastery.requireTransferCheck, true, "transfer check required");
equal(mastery.avoidRoteMemorizationAsPrimaryMethod, true, "rote memorization not primary");
includes(mastery.defaultSequence, "student_attempt", "student attempt in scaffold");
includes(mastery.defaultSequence, "transfer_problem", "transfer problem in scaffold");
includes(mastery.defaultSequence, "explain_back_check", "explain-back in scaffold");
includes(mastery.prohibitedBehaviors, "answer-dump-without-teaching", "answer dump prohibited");
includes(mastery.prohibitedBehaviors, "reward-copying-or-rote-repetition-as-proof-of-understanding", "rote repetition prohibited");

const scan = resolvePantavionScanLearningPolicy({ source: "textbook_page", age: 12, goals: ["explain", "practice"] });
equal(scan.rawMediaRetentionDefault, false, "raw scan retention off by default");
equal(scan.mustAvoidBulkBookExtraction, true, "bulk book extraction prohibited");
equal(scan.mustAvoidLongVerbatimReproduction, true, "long verbatim reproduction prohibited");
equal(scan.canGenerateOriginalExplanation, true, "original explanation allowed");
equal(scan.canGenerateOriginalPractice, true, "original practice allowed");
includes(scan.learningBehaviors, "prefer-hints-before-full-solution-when-appropriate", "scan hints before solution");
includes(scan.learningBehaviors, "generate-new-practice-instead-of-copying-protected-exercises", "original practice behavior");

const instruction = buildPantavionMasterySystemInstruction();
equal(instruction.includes("Teach for understanding"), true, "runtime instruction teaches for understanding");
equal(instruction.includes("transfer problem"), true, "runtime instruction includes transfer check");

console.log(JSON.stringify({
  status: "PASS",
  contract: mastery.contract,
  masteryBeforeAnswer: true,
  noAnswerDump: true,
  noRoteLearningAsPrimaryMethod: true,
  transferCheck: true,
  scanPrivacy: true,
  copyrightGuard: true,
}, null, 2));
