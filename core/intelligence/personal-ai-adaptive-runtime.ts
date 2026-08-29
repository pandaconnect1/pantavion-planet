import type { SupabaseClient } from "@supabase/supabase-js";

export const PANTAVION_PERSONAL_ADAPTIVE_RUNTIME_V1 = {
  id: "pantavion_personal_adaptive_runtime_v1",
  personalizationProvider: "pantavion-owned:deterministic-v1",
  externalProviderRequiredForPersonalization: false,
  doctrine: {
    explicitPreferencesBeatInference: true,
    currentInteractionSignalsMayAdaptPresentation: true,
    noHiddenDiagnosis: true,
    noSensitiveTraitScoring: true,
    userAgencyPreserved: true,
    highImpactActionsRequireExplicitApproval: true,
    irreversibleActionsRequireExplicitApproval: true,
    jurisdictionAndSafetyCannotBeRelaxed: true,
    externalGenerationDependencyMustRemainVisible: true,
  },
} as const;

export type PersonalAIAssistanceLevel = "minimal" | "balanced" | "proactive" | "guided";
export type PersonalAIResponseLength = "brief" | "balanced" | "detailed";
export type PersonalAIExplanationStyle = "plain" | "standard" | "technical";
export type PersonalAIStructureMode = "direct" | "balanced" | "step_by_step";
export type PersonalAIAutonomyMode =
  | "suggest_only"
  | "bounded_assist"
  | "proactive_with_confirmation"
  | "guided_step_by_step";

export type PersonalAIAdaptiveSignal =
  | "asks_for_simpler_explanation"
  | "asks_for_step_by_step"
  | "asks_to_repeat_or_rephrase"
  | "asks_for_example"
  | "requests_translation_help"
  | "requests_shorter_chunks"
  | "uses_voice_preference"
  | "uses_captions_preference"
  | "requests_reduced_stimulation"
  | "requests_low_bandwidth";

export type PersonalAIAdaptiveProfile = {
  preferred_locale: string | null;
  timezone: string;
  assistance_level: PersonalAIAssistanceLevel;
  memory_enabled: boolean;
  cross_thread_enabled: boolean;
  voice_enabled: boolean;
  communication_preferences?: unknown;
  language_profile?: unknown;
  privacy_settings?: unknown;
};

export type PersonalAIAdaptiveRequest = {
  input?: string | null;
  inputMode?: "text" | "voice" | "image" | "video" | "file" | "mixed";
  metadata?: Record<string, unknown>;
  explicitSignals?: PersonalAIAdaptiveSignal[];
};

export type PersonalAIAdaptivePlan = {
  runtime: typeof PANTAVION_PERSONAL_ADAPTIVE_RUNTIME_V1.id;
  personalizationProvider: typeof PANTAVION_PERSONAL_ADAPTIVE_RUNTIME_V1.personalizationProvider;
  externalProviderRequiredForPersonalization: false;
  signals: PersonalAIAdaptiveSignal[];
  locale: {
    preferred: string | null;
    timezone: string;
  };
  response: {
    length: PersonalAIResponseLength;
    explanationStyle: PersonalAIExplanationStyle;
    structure: PersonalAIStructureMode;
    includeExamplesWhenHelpful: boolean;
    preserveOriginalUserWording: true;
  };
  modality: {
    voiceFirst: boolean;
    captionsPreferred: boolean;
    reducedStimulation: boolean;
    lowBandwidth: boolean;
  };
  continuity: {
    memoryEnabled: boolean;
    crossThreadEnabled: boolean;
  };
  autonomy: {
    mode: PersonalAIAutonomyMode;
    mayActWithoutConfirmation: boolean;
    highImpactRequiresExplicitApproval: true;
    irreversibleRequiresExplicitApproval: true;
  };
  privacy: {
    hiddenSensitiveProfilingAllowed: false;
    transientSignalsPersistedAsTraits: false;
    userCanOverrideAdaptation: true;
  };
  sovereignty: {
    personalizationCapability: "PANTAVION_OWNED";
    externalGenerationDependencyEvaluatedSeparately: true;
    internalFirst: true;
  };
  rationale: string[];
};

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function normalized(value: string): string {
  return value.toLocaleLowerCase().normalize("NFKC");
}

function includesAny(value: string, terms: readonly string[]): boolean {
  return terms.some((term) => value.includes(term));
}

export function detectExplicitPersonalAIAdaptiveSignals(
  request: PersonalAIAdaptiveRequest,
): PersonalAIAdaptiveSignal[] {
  const input = normalized(request.input || "");
  const metadata = asObject(request.metadata);
  const signals = new Set<PersonalAIAdaptiveSignal>(request.explicitSignals || []);

  if (includesAny(input, ["πιο απλ", "απλά", "απλα", "simpler", "simple explanation", "eli5"])) {
    signals.add("asks_for_simpler_explanation");
  }
  if (includesAny(input, ["βήμα βήμα", "βημα βημα", "step by step", "one step at a time"])) {
    signals.add("asks_for_step_by_step");
  }
  if (includesAny(input, ["ξαναπ", "επαναδιατύπ", "επαναδιατυπ", "rephrase", "say it again", "repeat that"])) {
    signals.add("asks_to_repeat_or_rephrase");
  }
  if (includesAny(input, ["παράδειγμα", "παραδειγμα", "example"])) {
    signals.add("asks_for_example");
  }
  if (includesAny(input, ["μετάφρα", "μεταφρα", "translate", "translation"])) {
    signals.add("requests_translation_help");
  }
  if (includesAny(input, ["σύντομα", "συντομα", "συνοπτικά", "συνοπτικα", "brief", "concise", "shorter"])) {
    signals.add("requests_shorter_chunks");
  }
  if (request.inputMode === "voice" || metadata.handsFree === true || metadata.driving === true) {
    signals.add("uses_voice_preference");
  }
  if (metadata.captions === true) signals.add("uses_captions_preference");
  if (metadata.reducedStimulation === true) signals.add("requests_reduced_stimulation");
  if (metadata.lowBandwidth === true) signals.add("requests_low_bandwidth");

  return [...signals];
}

function autonomyFor(level: PersonalAIAssistanceLevel): PersonalAIAutonomyMode {
  if (level === "minimal") return "suggest_only";
  if (level === "proactive") return "proactive_with_confirmation";
  if (level === "guided") return "guided_step_by_step";
  return "bounded_assist";
}

export function resolvePersonalAIAdaptivePlan(
  profile: PersonalAIAdaptiveProfile,
  request: PersonalAIAdaptiveRequest = {},
): PersonalAIAdaptivePlan {
  const communication = asObject(profile.communication_preferences);
  const signals = detectExplicitPersonalAIAdaptiveSignals(request);
  const signalSet = new Set(signals);

  let length = asEnum<PersonalAIResponseLength>(
    communication.responseLength,
    ["brief", "balanced", "detailed"],
    profile.assistance_level === "guided" ? "detailed" : "balanced",
  );
  if (signalSet.has("requests_shorter_chunks") || request.metadata?.driving === true) length = "brief";

  let explanationStyle = asEnum<PersonalAIExplanationStyle>(
    communication.explanationStyle,
    ["plain", "standard", "technical"],
    "standard",
  );
  if (signalSet.has("asks_for_simpler_explanation")) explanationStyle = "plain";

  let structure = asEnum<PersonalAIStructureMode>(
    communication.structure,
    ["direct", "balanced", "step_by_step"],
    profile.assistance_level === "guided" ? "step_by_step" : "balanced",
  );
  if (signalSet.has("asks_for_step_by_step")) structure = "step_by_step";

  const voiceFirst = Boolean(
    profile.voice_enabled &&
      (signalSet.has("uses_voice_preference") || asBoolean(communication.voiceFirst)),
  );
  const captionsPreferred = Boolean(
    signalSet.has("uses_captions_preference") || asBoolean(communication.captions),
  );
  const reducedStimulation = Boolean(
    signalSet.has("requests_reduced_stimulation") || asBoolean(communication.reducedStimulation),
  );
  const lowBandwidth = Boolean(
    signalSet.has("requests_low_bandwidth") || asBoolean(communication.lowBandwidth),
  );

  const autonomyMode = autonomyFor(profile.assistance_level);
  const mayActWithoutConfirmation = autonomyMode === "bounded_assist";

  return {
    runtime: PANTAVION_PERSONAL_ADAPTIVE_RUNTIME_V1.id,
    personalizationProvider: PANTAVION_PERSONAL_ADAPTIVE_RUNTIME_V1.personalizationProvider,
    externalProviderRequiredForPersonalization: false,
    signals,
    locale: {
      preferred: profile.preferred_locale,
      timezone: profile.timezone,
    },
    response: {
      length,
      explanationStyle,
      structure,
      includeExamplesWhenHelpful:
        signalSet.has("asks_for_example") || asBoolean(communication.examples),
      preserveOriginalUserWording: true,
    },
    modality: {
      voiceFirst,
      captionsPreferred,
      reducedStimulation,
      lowBandwidth,
    },
    continuity: {
      memoryEnabled: profile.memory_enabled,
      crossThreadEnabled: profile.cross_thread_enabled,
    },
    autonomy: {
      mode: autonomyMode,
      mayActWithoutConfirmation,
      highImpactRequiresExplicitApproval: true,
      irreversibleRequiresExplicitApproval: true,
    },
    privacy: {
      hiddenSensitiveProfilingAllowed: false,
      transientSignalsPersistedAsTraits: false,
      userCanOverrideAdaptation: true,
    },
    sovereignty: {
      personalizationCapability: "PANTAVION_OWNED",
      externalGenerationDependencyEvaluatedSeparately: true,
      internalFirst: true,
    },
    rationale: [
      "Personalization is resolved inside Pantavion without an external personalization provider.",
      "Only explicit profile preferences and current-interaction signals change presentation behavior.",
      "No disability, diagnosis, intelligence level, mental-health condition or other sensitive trait is inferred.",
      "High-impact and irreversible actions always remain behind explicit authorization and the global safety/jurisdiction fabric.",
    ],
  };
}

export async function loadPersonalAIAdaptivePlan(
  supabase: SupabaseClient,
  userId: string,
  request: PersonalAIAdaptiveRequest = {},
): Promise<PersonalAIAdaptivePlan> {
  const profile = await supabase
    .from("personal_ai_profiles")
    .select("preferred_locale,timezone,assistance_level,memory_enabled,cross_thread_enabled,voice_enabled,communication_preferences,language_profile,privacy_settings")
    .eq("user_id", userId)
    .single();

  if (profile.error || !profile.data) {
    throw new Error(`personal_ai_adaptive_profile_read_failed:${profile.error?.message || "not_found"}`);
  }

  return resolvePersonalAIAdaptivePlan(profile.data as PersonalAIAdaptiveProfile, request);
}

export function personalAIAdaptivePromptLines(plan: PersonalAIAdaptivePlan): string[] {
  return [
    `PANTAVION ADAPTIVE RUNTIME: ${plan.runtime}; personalization=${plan.personalizationProvider}; external_personalization=false.`,
    `Response preference: length=${plan.response.length}; explanation=${plan.response.explanationStyle}; structure=${plan.response.structure}; examples=${plan.response.includeExamplesWhenHelpful}.`,
    `Modality: voiceFirst=${plan.modality.voiceFirst}; captions=${plan.modality.captionsPreferred}; reducedStimulation=${plan.modality.reducedStimulation}; lowBandwidth=${plan.modality.lowBandwidth}.`,
    `Autonomy: ${plan.autonomy.mode}; high-impact and irreversible actions require explicit approval.`,
    "Do not infer hidden sensitive traits from these adaptation signals. Treat them only as presentation and interaction preferences for the current user.",
  ];
}
