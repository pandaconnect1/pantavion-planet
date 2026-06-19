export type PantavionProviderFamily =
  | "ai_model"
  | "realtime_voice"
  | "translation"
  | "speech_to_text"
  | "text_to_speech"
  | "search"
  | "maps"
  | "storage"
  | "workspace"
  | "mcp"
  | "satellite_connectivity"
  | "payments"
  | "unknown";

export type PantavionProviderStatus =
  | "enabled"
  | "disabled"
  | "beta"
  | "internal"
  | "degraded";

export interface PantavionProviderHealth {
  readonly status: PantavionProviderStatus;
  readonly lastCheckedAtIso?: string;
  readonly latencyMs?: number;
  readonly errorRate?: number;
  readonly message?: string;
}

export interface PantavionProviderRoute {
  readonly providerId: string;
  readonly family: PantavionProviderFamily;
  readonly status: PantavionProviderStatus;
  readonly primary: boolean;
  readonly fallbackProviderIds: readonly string[];
  readonly offlineFallbackMode:
    | "none"
    | "text_only"
    | "cached_phrases"
    | "local_queue"
    | "manual_process";
  readonly timeoutMs: number;
  readonly maxCostEurPerRequest: number;
  readonly requiresConsent: boolean;
  readonly requiresFounderApproval: boolean;
  readonly health: PantavionProviderHealth;
  readonly notes: string;
}

export interface PantavionProviderSelection {
  readonly selectedProviderId?: string;
  readonly fallbackUsed: boolean;
  readonly degradedMode: boolean;
  readonly reason: string;
}

export const PANTAVION_PROVIDER_ROUTES: readonly PantavionProviderRoute[] = [
  {
    providerId: "provider.realtime_voice.primary",
    family: "realtime_voice",
    status: "internal",
    primary: true,
    fallbackProviderIds: ["provider.translation.text_fallback"],
    offlineFallbackMode: "cached_phrases",
    timeoutMs: 15000,
    maxCostEurPerRequest: 0,
    requiresConsent: true,
    requiresFounderApproval: true,
    health: {
      status: "internal",
      message:
        "No live provider is enabled until adapter, consent, session state, ephemeral token endpoint and audit path exist.",
    },
    notes:
      "For SOS Elder, Interpreter and Universal Communication. Must not be exposed as a static button.",
  },
  {
    providerId: "provider.translation.text_fallback",
    family: "translation",
    status: "internal",
    primary: false,
    fallbackProviderIds: [],
    offlineFallbackMode: "cached_phrases",
    timeoutMs: 10000,
    maxCostEurPerRequest: 0,
    requiresConsent: false,
    requiresFounderApproval: false,
    health: {
      status: "internal",
      message:
        "Text fallback contract only until a real translation adapter and route are wired.",
    },
    notes:
      "Fallback for voice/interpreter flows and offline emergency phrases.",
  },
  {
    providerId: "provider.satellite.future_certified",
    family: "satellite_connectivity",
    status: "disabled",
    primary: false,
    fallbackProviderIds: [],
    offlineFallbackMode: "local_queue",
    timeoutMs: 30000,
    maxCostEurPerRequest: 0,
    requiresConsent: true,
    requiresFounderApproval: true,
    health: {
      status: "disabled",
      message:
        "Future certified provider/hardware/legal integration only. No guaranteed rescue claim.",
    },
    notes:
      "Connection-state awareness only until certified provider contracts exist.",
  },
];

export function selectPantavionProvider(
  routes: readonly PantavionProviderRoute[],
  family: PantavionProviderFamily,
): PantavionProviderSelection {
  const candidates = routes.filter((route) => route.family === family);

  const enabledPrimary = candidates.find(
    (route) => route.primary && route.status === "enabled",
  );

  if (enabledPrimary) {
    return {
      selectedProviderId: enabledPrimary.providerId,
      fallbackUsed: false,
      degradedMode: false,
      reason: "Enabled primary provider selected.",
    };
  }

  const enabledFallback = candidates.find((route) => route.status === "enabled");

  if (enabledFallback) {
    return {
      selectedProviderId: enabledFallback.providerId,
      fallbackUsed: true,
      degradedMode: false,
      reason: "Enabled fallback provider selected.",
    };
  }

  const degraded = candidates.find((route) => route.status === "degraded");

  if (degraded) {
    return {
      selectedProviderId: degraded.providerId,
      fallbackUsed: true,
      degradedMode: true,
      reason: "Only degraded provider is available.",
    };
  }

  return {
    fallbackUsed: false,
    degradedMode: true,
    reason:
      "No enabled provider is available. Capability must remain disabled, beta or internal.",
  };
}
