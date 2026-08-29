import assert from "node:assert/strict";

import {
  PANTAVION_PERSONAL_ADAPTIVE_RUNTIME_V1,
  detectExplicitPersonalAIAdaptiveSignals,
  resolvePersonalAIAdaptivePlan,
} from "../core/intelligence/personal-ai-adaptive-runtime.ts";

const baseProfile = {
  preferred_locale: "el-GR",
  timezone: "Europe/Nicosia",
  assistance_level: "balanced",
  memory_enabled: true,
  cross_thread_enabled: true,
  voice_enabled: true,
  communication_preferences: {},
  language_profile: {},
  privacy_settings: { cross_thread: true },
};

assert.equal(PANTAVION_PERSONAL_ADAPTIVE_RUNTIME_V1.personalizationProvider, "pantavion-owned:deterministic-v1");
assert.equal(PANTAVION_PERSONAL_ADAPTIVE_RUNTIME_V1.externalProviderRequiredForPersonalization, false);
assert.equal(PANTAVION_PERSONAL_ADAPTIVE_RUNTIME_V1.doctrine.noHiddenDiagnosis, true);
assert.equal(PANTAVION_PERSONAL_ADAPTIVE_RUNTIME_V1.doctrine.silentAdaptationIsPresentationOnly, true);

const defaultPlan = resolvePersonalAIAdaptivePlan(baseProfile, {});
assert.equal(defaultPlan.response.length, "balanced");
assert.equal(defaultPlan.response.explanationStyle, "standard");
assert.equal(defaultPlan.response.structure, "balanced");
assert.equal(defaultPlan.autonomy.mode, "bounded_assist");
assert.equal(defaultPlan.autonomy.mayAdaptPresentationWithoutConfirmation, true);
assert.equal(defaultPlan.autonomy.mayExecuteUserIntentWithoutConfirmation, false);
assert.equal(defaultPlan.autonomy.highImpactRequiresExplicitApproval, true);
assert.equal(defaultPlan.autonomy.irreversibleRequiresExplicitApproval, true);
assert.equal(defaultPlan.privacy.hiddenSensitiveProfilingAllowed, false);
assert.equal(defaultPlan.privacy.transientSignalsPersistedAsTraits, false);
assert.equal(defaultPlan.sovereignty.personalizationCapability, "PANTAVION_OWNED");

const greekSignals = detectExplicitPersonalAIAdaptiveSignals({
  input: "Πες το πιο απλά, βήμα βήμα, με παράδειγμα και σύντομα.",
});
assert.ok(greekSignals.includes("asks_for_simpler_explanation"));
assert.ok(greekSignals.includes("asks_for_step_by_step"));
assert.ok(greekSignals.includes("asks_for_example"));
assert.ok(greekSignals.includes("requests_shorter_chunks"));

const greekPlan = resolvePersonalAIAdaptivePlan(baseProfile, {
  input: "Πες το πιο απλά, βήμα βήμα, με παράδειγμα και σύντομα.",
});
assert.equal(greekPlan.response.length, "brief");
assert.equal(greekPlan.response.explanationStyle, "plain");
assert.equal(greekPlan.response.structure, "step_by_step");
assert.equal(greekPlan.response.includeExamplesWhenHelpful, true);

const drivingPlan = resolvePersonalAIAdaptivePlan(baseProfile, {
  input: "Συνέχισε",
  inputMode: "voice",
  metadata: { driving: true, handsFree: true, lowBandwidth: true },
});
assert.equal(drivingPlan.response.length, "brief");
assert.equal(drivingPlan.modality.voiceFirst, true);
assert.equal(drivingPlan.modality.lowBandwidth, true);
assert.equal(drivingPlan.autonomy.mayExecuteUserIntentWithoutConfirmation, false);

const explicitProfilePlan = resolvePersonalAIAdaptivePlan(
  {
    ...baseProfile,
    assistance_level: "guided",
    communication_preferences: {
      responseLength: "detailed",
      explanationStyle: "technical",
      structure: "step_by_step",
      examples: true,
      captions: true,
      reducedStimulation: true,
    },
  },
  {},
);
assert.equal(explicitProfilePlan.response.length, "detailed");
assert.equal(explicitProfilePlan.response.explanationStyle, "technical");
assert.equal(explicitProfilePlan.response.structure, "step_by_step");
assert.equal(explicitProfilePlan.response.includeExamplesWhenHelpful, true);
assert.equal(explicitProfilePlan.modality.captionsPreferred, true);
assert.equal(explicitProfilePlan.modality.reducedStimulation, true);
assert.equal(explicitProfilePlan.autonomy.mode, "guided_step_by_step");

const proactivePlan = resolvePersonalAIAdaptivePlan(
  { ...baseProfile, assistance_level: "proactive" },
  {},
);
assert.equal(proactivePlan.autonomy.mode, "proactive_with_confirmation");
assert.equal(proactivePlan.autonomy.mayExecuteUserIntentWithoutConfirmation, false);

console.log("PANTAVION PERSONAL AI ADAPTIVE RUNTIME: PASSED");
console.log("- personalization provider: Pantavion-owned deterministic runtime");
console.log("- external personalization provider required: no");
console.log("- silent adaptation: presentation only");
console.log("- hidden sensitive profiling: forbidden");
console.log("- substantive actions: normal capability/safety/jurisdiction gates required");
