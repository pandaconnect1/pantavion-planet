export type PantavionSupportNeed =
  | "reading_support"
  | "writing_support"
  | "numeracy_support"
  | "attention_and_structure"
  | "learning_difference_support"
  | "speech_and_communication_support"
  | "vision_accessibility"
  | "hearing_accessibility"
  | "sensory_accessibility"
  | "mobility_accessibility"
  | "language_newcomer_support"
  | "displacement_refugee_support"
  | "conflict_disruption_support"
  | "bullying_support"
  | "family_safety_support"
  | "emotional_wellbeing_support"
  | "caregiver_support"
  | "elder_support";

export type PantavionSupportSelectionSource =
  | "self_selected"
  | "guardian_selected"
  | "educator_supported"
  | "caregiver_selected";

export type PantavionSupportContext = {
  needs?: readonly PantavionSupportNeed[];
  source?: PantavionSupportSelectionSource;
  preferredLanguage?: string | null;
  readingLevelPreference?: "simpler" | "standard" | "advanced" | null;
  prefersStepByStep?: boolean;
  prefersVoice?: boolean;
  prefersCaptions?: boolean;
  prefersReducedSensoryLoad?: boolean;
};

export type PantavionSupportAdaptation = {
  enabled: boolean;
  needs: readonly PantavionSupportNeed[];
  accommodations: readonly string[];
  allowedAIRoles: readonly string[];
  safeguards: readonly string[];
  humanSupportRecommended: boolean;
  urgentHumanEscalationPathRequired: boolean;
  neverDiagnose: true;
  neverStigmatize: true;
  neverInferSensitiveNeedWithoutUserSignal: true;
};

const LEARNING_NEEDS = new Set<PantavionSupportNeed>([
  "reading_support",
  "writing_support",
  "numeracy_support",
  "attention_and_structure",
  "learning_difference_support",
]);

const ACCESSIBILITY_NEEDS = new Set<PantavionSupportNeed>([
  "speech_and_communication_support",
  "vision_accessibility",
  "hearing_accessibility",
  "sensory_accessibility",
  "mobility_accessibility",
]);

const HUMAN_SAFETY_NEEDS = new Set<PantavionSupportNeed>([
  "bullying_support",
  "family_safety_support",
  "emotional_wellbeing_support",
  "displacement_refugee_support",
  "conflict_disruption_support",
]);

export function resolvePantavionSupportAdaptation(input: {
  age: number | null;
  context?: PantavionSupportContext | null;
}): PantavionSupportAdaptation {
  const needs = [...new Set(input.context?.needs ?? [])];
  const accommodations = new Set<string>();
  const aiRoles = new Set<string>();
  const safeguards = new Set<string>([
    "support-is-assistance-not-diagnosis",
    "user-or-guardian-controls-support-preferences",
    "no-sensitive-trait-inference-from-behaviour-alone",
    "do-not-reduce-user-agency-because-of-support-needs",
  ]);

  if (input.context?.readingLevelPreference === "simpler") {
    accommodations.add("plain-language-explanations");
  }
  if (input.context?.prefersStepByStep) {
    accommodations.add("step-by-step-instructions");
    accommodations.add("one-concept-at-a-time");
  }
  if (input.context?.prefersVoice) accommodations.add("voice-first-option");
  if (input.context?.prefersCaptions) accommodations.add("captions-and-transcript-option");
  if (input.context?.prefersReducedSensoryLoad) accommodations.add("reduced-sensory-load-ui");
  if (input.context?.preferredLanguage) accommodations.add("preferred-language-first");

  for (const need of needs) {
    if (LEARNING_NEEDS.has(need)) {
      aiRoles.add("adaptive_tutor");
      aiRoles.add("patient_explainer");
      accommodations.add("adaptive-pacing");
      accommodations.add("multiple-explanation-formats");
      accommodations.add("knowledge-checks-without-shame");
      safeguards.add("do-not-label-learning-difficulty-as-low-ability");
    }

    if (need === "reading_support") {
      accommodations.add("read-aloud-option");
      accommodations.add("shorter-text-chunks");
    }
    if (need === "writing_support") {
      accommodations.add("writing-scaffold-and-prompts");
      accommodations.add("speech-to-text-option");
    }
    if (need === "numeracy_support") {
      accommodations.add("worked-concept-examples");
      accommodations.add("visual-number-explanations");
    }
    if (need === "attention_and_structure") {
      accommodations.add("short-task-sequences");
      accommodations.add("clear-progress-markers");
      accommodations.add("optional-reminders");
    }

    if (ACCESSIBILITY_NEEDS.has(need)) {
      aiRoles.add("accessibility_assistant");
      safeguards.add("preserve-meaning-over-fluency");
    }
    if (need === "speech_and_communication_support") {
      accommodations.add("speech-normalization-without-diagnosis");
      accommodations.add("alternative-text-input");
    }
    if (need === "vision_accessibility") {
      accommodations.add("screen-reader-compatible-output");
      accommodations.add("voice-output-option");
    }
    if (need === "hearing_accessibility") {
      accommodations.add("captions-by-default-option");
      accommodations.add("text-equivalent-for-audio");
    }
    if (need === "sensory_accessibility") {
      accommodations.add("reduced-motion-and-stimulation-option");
    }
    if (need === "mobility_accessibility") {
      accommodations.add("hands-free-and-switch-friendly-option");
    }

    if (need === "language_newcomer_support") {
      aiRoles.add("translator_and_language_bridge");
      accommodations.add("bilingual-explanations");
      accommodations.add("plain-language-local-context");
    }

    if (need === "displacement_refugee_support" || need === "conflict_disruption_support") {
      aiRoles.add("continuity_learning_assistant");
      aiRoles.add("language_and_local_context_bridge");
      accommodations.add("interrupted-learning-recovery-path");
      accommodations.add("low-bandwidth-friendly-content");
      safeguards.add("avoid-assuming-legal-or-residency-status");
      safeguards.add("do-not-expose-sensitive-location-by-default");
    }

    if (HUMAN_SAFETY_NEEDS.has(need)) {
      aiRoles.add("supportive_information_guide");
      safeguards.add("no-clinical-or-psychological-diagnosis");
      safeguards.add("no-secret-keeping-or-concealment-instructions");
      safeguards.add("offer-qualified-human-support-paths-when-appropriate");
      safeguards.add("age-appropriate-and-non-graphic-language");
    }

    if (need === "caregiver_support") {
      aiRoles.add("caregiver_guide");
      accommodations.add("care-recipient-age-aware-guidance");
    }
    if (need === "elder_support") {
      aiRoles.add("daily_living_support_assistant");
      accommodations.add("simplified-navigation-option");
      accommodations.add("voice-first-option");
      safeguards.add("preserve-adult-autonomy");
    }
  }

  const isMinor = typeof input.age === "number" && input.age < 18;
  const familySafety = needs.includes("family_safety_support");
  const humanSupportRecommended = needs.some((need) => HUMAN_SAFETY_NEEDS.has(need));

  if (isMinor && humanSupportRecommended) {
    safeguards.add("minor-safeguarding-path-available");
    safeguards.add("trusted-human-escalation-designed-by-jurisdiction");
  }

  return {
    enabled: needs.length > 0 || accommodations.size > 0,
    needs,
    accommodations: [...accommodations],
    allowedAIRoles: [...aiRoles],
    safeguards: [...safeguards],
    humanSupportRecommended,
    urgentHumanEscalationPathRequired: Boolean(isMinor && familySafety),
    neverDiagnose: true,
    neverStigmatize: true,
    neverInferSensitiveNeedWithoutUserSignal: true,
  };
}
