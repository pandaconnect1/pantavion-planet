export type PantavionScanLearningSource =
  | "camera_photo"
  | "uploaded_image"
  | "uploaded_pdf"
  | "screenshot"
  | "typed_text"
  | "handwritten_notes"
  | "worksheet"
  | "textbook_page"
  | "teacher_board"
  | "unknown";

export type PantavionScanLearningGoal =
  | "explain"
  | "hint"
  | "step_by_step"
  | "practice"
  | "quiz"
  | "translate"
  | "read_aloud"
  | "simplify"
  | "check_work";

export type PantavionScanLearningPolicy = {
  allowed: boolean;
  source: PantavionScanLearningSource;
  goals: readonly PantavionScanLearningGoal[];
  personalStudyOnly: true;
  rawMediaRetentionDefault: false;
  canAnalyzeUserProvidedExcerpt: true;
  canGenerateOriginalExplanation: true;
  canGenerateOriginalPractice: true;
  mustAvoidLongVerbatimReproduction: true;
  mustAvoidBulkBookExtraction: true;
  mustDistinguishVisibleTextFromInference: true;
  mustNotClaimCurriculumAlignmentWithoutVerifiedSource: true;
  privacyProtections: readonly string[];
  learningBehaviors: readonly string[];
};

export function resolvePantavionScanLearningPolicy(input: {
  source: PantavionScanLearningSource;
  age?: number | null;
  goals?: readonly PantavionScanLearningGoal[];
}): PantavionScanLearningPolicy {
  const age = typeof input.age === "number" && Number.isFinite(input.age) ? Math.max(0, Math.floor(input.age)) : null;
  const isMinor = age !== null && age < 18;
  const requested = input.goals?.length ? [...new Set(input.goals)] : ["explain", "practice"] as PantavionScanLearningGoal[];

  const privacyProtections = [
    "do-not-persist-raw-media-by-default",
    "do-not-use-scans-for-ad-targeting",
    "do-not-expose-student-identifiers-in-generated-output",
  ];
  if (isMinor) {
    privacyProtections.push(
      "minor-data-minimization",
      "avoid-retaining-names-school-identifiers-or-faces-unless-required-and-authorized",
    );
  }

  return {
    allowed: true,
    source: input.source,
    goals: requested,
    personalStudyOnly: true,
    rawMediaRetentionDefault: false,
    canAnalyzeUserProvidedExcerpt: true,
    canGenerateOriginalExplanation: true,
    canGenerateOriginalPractice: true,
    mustAvoidLongVerbatimReproduction: true,
    mustAvoidBulkBookExtraction: true,
    mustDistinguishVisibleTextFromInference: true,
    mustNotClaimCurriculumAlignmentWithoutVerifiedSource: true,
    privacyProtections,
    learningBehaviors: [
      "explain-in-own-words",
      "prefer-hints-before-full-solution-when-appropriate",
      "adapt-language-and-complexity-to-user",
      "offer-step-by-step-reasoning-without-hidden-diagnosis",
      "generate-new-practice-instead-of-copying-protected-exercises",
      "state-uncertainty-when-the-scan-is-blurry-or-incomplete",
    ],
  };
}
