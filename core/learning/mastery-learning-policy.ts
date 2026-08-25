export type PantavionLearningGoal =
  | "understand_concept"
  | "solve_problem"
  | "practice"
  | "prepare_assessment"
  | "review_mistake"
  | "explain_back";

export type PantavionLearningScaffold =
  | "ask_what_student_knows"
  | "identify_knowns_and_unknowns"
  | "concept_reminder"
  | "single_hint"
  | "guided_question"
  | "worked_micro_example"
  | "student_attempt"
  | "feedback_on_attempt"
  | "second_hint"
  | "partial_step"
  | "worked_solution_with_explanation"
  | "transfer_problem"
  | "explain_back_check"
  | "spaced_review_prompt";

export type PantavionMasteryLearningPolicy = {
  contract: "pantavion-mastery-learning-v1";
  goal: PantavionLearningGoal;
  principle: "mastery_before_answer";
  defaultSequence: readonly PantavionLearningScaffold[];
  directAnswerDefault: false;
  requireStudentAttemptWhenAppropriate: true;
  preferHintsBeforeWorkedSolution: true;
  requireConceptExplanationWithWorkedSolution: true;
  requireTransferCheck: true;
  avoidRoteMemorizationAsPrimaryMethod: true;
  avoidShameOrAbilityLabels: true;
  adaptToStudentResponse: true;
  formativeChecks: readonly string[];
  allowedEscalationToWorkedSolution: readonly string[];
  prohibitedBehaviors: readonly string[];
};

export function resolvePantavionMasteryLearningPolicy(input?: {
  goal?: PantavionLearningGoal;
  learnerRequestedImmediateAnswer?: boolean;
  repeatedUnsuccessfulAttempts?: number;
}): PantavionMasteryLearningPolicy {
  const goal = input?.goal ?? "understand_concept";

  return {
    contract: "pantavion-mastery-learning-v1",
    goal,
    principle: "mastery_before_answer",
    defaultSequence: [
      "ask_what_student_knows",
      "identify_knowns_and_unknowns",
      "concept_reminder",
      "single_hint",
      "guided_question",
      "student_attempt",
      "feedback_on_attempt",
      "second_hint",
      "partial_step",
      "worked_micro_example",
      "student_attempt",
      "worked_solution_with_explanation",
      "transfer_problem",
      "explain_back_check",
      "spaced_review_prompt",
    ],
    directAnswerDefault: false,
    requireStudentAttemptWhenAppropriate: true,
    preferHintsBeforeWorkedSolution: true,
    requireConceptExplanationWithWorkedSolution: true,
    requireTransferCheck: true,
    avoidRoteMemorizationAsPrimaryMethod: true,
    avoidShameOrAbilityLabels: true,
    adaptToStudentResponse: true,
    formativeChecks: [
      "ask-learner-to-predict-next-step",
      "ask-learner-to-explain-why",
      "use-a-similar-but-not-identical-transfer-problem",
      "check-understanding-before-increasing-difficulty",
      "revisit-the-concept-later-with-spaced-review",
    ],
    allowedEscalationToWorkedSolution: [
      "learner-has-made-a-genuine-attempt",
      "multiple-hints-did-not-unblock-learning",
      "worked-example-is-needed-to-teach-the-method",
      "accessibility-or-time-constraint-makes-guided-dialogue-impractical",
    ],
    prohibitedBehaviors: [
      "answer-dump-without-teaching",
      "solve-every-step-before-the-learner-attempts-when-a-guided-path-is-appropriate",
      "reward-copying-or-rote-repetition-as-proof-of-understanding",
      "present-memorization-as-the-only-learning-strategy",
      "label-the-learner-as-smart-slow-bad-or-disordered",
      "pretend-understanding-was-achieved-without-a-formative-check",
    ],
  };
}

export function buildPantavionMasterySystemInstruction(): string {
  return [
    "PANTAVION MASTERY LEARNING MODE:",
    "Teach for understanding, not answer copying or rote memorization.",
    "Start from what the learner already knows, identify the missing concept, then use one hint or guided question at a time.",
    "When appropriate, ask the learner to attempt the next step before revealing it.",
    "If a worked solution becomes necessary, explain why each step works and then give a new transfer problem to check understanding.",
    "Prefer concrete examples, visual or verbal analogies, and retrieval practice over repetition without meaning.",
    "Do not shame, diagnose, or label ability. Adapt pace, language and representation to the learner response.",
    "If the learner asks for an immediate answer, still provide enough teaching context to preserve learning value unless safety or accessibility requires a different path.",
  ].join("\n");
}
