export type PantavionTranslationRuntimeMode =
  | "automatic_speech_detection"
  | "manual_helper_language_backup"
  | "text_only_fallback"
  | "provider_required";

export type PantavionTranslationRuntimeStatus =
  | "provider_required"
  | "internal_disabled"
  | "provider_adapter_not_implemented"
  | "beta_ready";

export interface PantavionTranslationRuntimeSessionInput {
  userLanguage?: string;
  helperLanguage?: string;
  sourceLanguageHint?: string;
  consentAccepted?: boolean;
  context?: "general" | "elder" | "sos" | "medical" | "legal" | "public_service";
  requestedMode?: PantavionTranslationRuntimeMode;
}

export interface PantavionTranslationRuntimeSession {
  id: string;
  contract: "pantavion_translation_runtime_contract_v1";
  mode: PantavionTranslationRuntimeMode;
  userLanguage: string;
  helperLanguage: string | null;
  sourceLanguageHint: string;
  consentAccepted: boolean;
  context: NonNullable<PantavionTranslationRuntimeSessionInput["context"]>;
  limitations: string[];
}

export interface PantavionRealtimeProviderReadinessInput {
  providerConfigured: boolean;
  runtimeEnabled: boolean;
  adapterImplemented: boolean;
  founderApprovedForSensitiveContexts: boolean;
  context: NonNullable<PantavionTranslationRuntimeSessionInput["context"]>;
}

export const pantavionTranslationRuntimeContractV1 = {
  id: "pantavion_translation_runtime_contract_v1",
  route: "/api/translation/realtime/session",
  defaultMode: "automatic_speech_detection",
  backupMode: "manual_helper_language_backup",
  fallbackMode: "text_only_fallback",
  blockedStatus: "provider_required",
  legalBoundary: "assistive_not_legal_medical_guarantee",
  consentRequired: true,
  elderSosRule:
    "User language controls the UI; automatic speech detection is first; manual helper language is backup for the other person.",
} as const;

function normalizeLanguage(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length <= 40 ? trimmed : fallback;
}

export function createPantavionTranslationRuntimeSession(
  input: PantavionTranslationRuntimeSessionInput,
): PantavionTranslationRuntimeSession {
  const context = input.context || "general";
  const requestedMode = input.requestedMode || "automatic_speech_detection";
  const mode: PantavionTranslationRuntimeMode = input.consentAccepted
    ? requestedMode
    : "provider_required";

  return {
    id: "pantavion_translation_runtime_" + Date.now(),
    contract: "pantavion_translation_runtime_contract_v1",
    mode,
    userLanguage: normalizeLanguage(input.userLanguage, "auto_ui_language"),
    helperLanguage: input.helperLanguage
      ? normalizeLanguage(input.helperLanguage, "manual_helper_language_backup")
      : null,
    sourceLanguageHint: normalizeLanguage(input.sourceLanguageHint, "auto_speech_detection"),
    consentAccepted: Boolean(input.consentAccepted),
    context,
    limitations: [
      "Translation is assistive and may be wrong.",
      "It is not a legal, medical, emergency, or professional replacement.",
      "SOS authority dispatch and satellite rescue require certified provider contracts.",
    ],
  };
}

export function evaluatePantavionRealtimeTranslationProvider(
  input: PantavionRealtimeProviderReadinessInput,
) {
  const sensitiveContext =
    input.context === "sos" || input.context === "medical" || input.context === "legal";

  if (!input.providerConfigured) {
    return {
      status: "provider_required" as const,
      canOpenRealtimeSession: false,
      reason: "PANTAVION_REALTIME_TRANSLATION_PROVIDER_REQUIRED",
    };
  }

  if (!input.runtimeEnabled) {
    return {
      status: "internal_disabled" as const,
      canOpenRealtimeSession: false,
      reason: "PANTAVION_REALTIME_TRANSLATION_RUNTIME_DISABLED",
    };
  }

  if (!input.adapterImplemented) {
    return {
      status: "provider_adapter_not_implemented" as const,
      canOpenRealtimeSession: false,
      reason: "PANTAVION_REALTIME_TRANSLATION_PROVIDER_ADAPTER_NOT_IMPLEMENTED",
    };
  }

  if (sensitiveContext && !input.founderApprovedForSensitiveContexts) {
    return {
      status: "internal_disabled" as const,
      canOpenRealtimeSession: false,
      reason: "PANTAVION_SENSITIVE_TRANSLATION_CONTEXT_REQUIRES_FOUNDER_APPROVAL",
    };
  }

  return {
    status: "beta_ready" as const,
    canOpenRealtimeSession: true,
    reason: "PANTAVION_REALTIME_TRANSLATION_BETA_READY",
  };
}
