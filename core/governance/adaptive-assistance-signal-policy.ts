export type PantavionNeutralAssistanceSignal =
  | "asks_for_simpler_explanation"
  | "asks_for_step_by_step"
  | "asks_to_repeat_or_rephrase"
  | "asks_for_example"
  | "requests_translation_help"
  | "uses_voice_preference"
  | "uses_captions_preference"
  | "requests_reduced_stimulation"
  | "requests_shorter_chunks";

export type PantavionTransientSafetySignal =
  | "bullying_help_request"
  | "family_safety_help_request"
  | "emotional_support_request"
  | "conflict_or_displacement_help_request";

export type PantavionAdaptiveAssistanceDecision = {
  accommodations: readonly string[];
  offerSupportChoice: boolean;
  offerHumanSupportPath: boolean;
  jurisdictionSafeguardingCheckRequired: boolean;
  mayAdaptSilently: true;
  mayAssignDiagnosis: false;
  mayCreateSensitiveProfileLabel: false;
  mayPersistTransientSafetySignalAsTrait: false;
  rationale: readonly string[];
};

/**
 * Adapts the experience to what is happening in the current interaction without
 * inferring a disability, diagnosis, mental-health condition, intelligence level,
 * or other sensitive trait. Safety signals are transient request-level context,
 * not profile labels.
 */
export function resolvePantavionAdaptiveAssistance(input: {
  neutralSignals?: readonly PantavionNeutralAssistanceSignal[];
  transientSafetySignals?: readonly PantavionTransientSafetySignal[];
  isMinor?: boolean;
}): PantavionAdaptiveAssistanceDecision {
  const neutralSignals = [...new Set(input.neutralSignals ?? [])];
  const safetySignals = [...new Set(input.transientSafetySignals ?? [])];
  const accommodations = new Set<string>();

  for (const signal of neutralSignals) {
    if (signal === "asks_for_simpler_explanation") accommodations.add("plain-language-next-response");
    if (signal === "asks_for_step_by_step") accommodations.add("step-by-step-next-response");
    if (signal === "asks_to_repeat_or_rephrase") accommodations.add("alternate-explanation-without-judgement");
    if (signal === "asks_for_example") accommodations.add("concrete-example-next-response");
    if (signal === "requests_translation_help") accommodations.add("language-bridge-next-response");
    if (signal === "uses_voice_preference") accommodations.add("voice-first-output-option");
    if (signal === "uses_captions_preference") accommodations.add("captions-and-text-equivalent");
    if (signal === "requests_reduced_stimulation") accommodations.add("reduced-sensory-load-ui");
    if (signal === "requests_shorter_chunks") accommodations.add("shorter-content-chunks");
  }

  const offerHumanSupportPath = safetySignals.length > 0;
  const jurisdictionSafeguardingCheckRequired = Boolean(input.isMinor && offerHumanSupportPath);

  return {
    accommodations: [...accommodations],
    offerSupportChoice: neutralSignals.length > 0 || safetySignals.length > 0,
    offerHumanSupportPath,
    jurisdictionSafeguardingCheckRequired,
    mayAdaptSilently: true,
    mayAssignDiagnosis: false,
    mayCreateSensitiveProfileLabel: false,
    mayPersistTransientSafetySignalAsTrait: false,
    rationale: [
      "adapt-to-current-interaction-not-hidden-diagnosis",
      "help-without-stigma-or-loss-of-agency",
      "neutral-friction-signals-can-change-presentation-without-sensitive-inference",
      "safety-help-requests-trigger-support-paths-without-becoming-profile-traits",
    ],
  };
}
