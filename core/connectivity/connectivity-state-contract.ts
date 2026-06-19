export type PantavionNetworkState =
  | "online"
  | "weak"
  | "offline"
  | "satellite_supported"
  | "unknown";

export type PantavionConnectivityRisk =
  | "normal"
  | "degraded"
  | "emergency"
  | "unsafe_to_claim_delivery";

export interface PantavionConnectivityState {
  readonly deviceId?: string;
  readonly module:
    | "sos"
    | "elder"
    | "water_field"
    | "maritime"
    | "aviation"
    | "workspace"
    | "general";
  readonly networkState: PantavionNetworkState;
  readonly lastOnlineAtIso?: string;
  readonly lastSyncAtIso?: string;
  readonly queuedEvents: number;
  readonly satelliteCapable: boolean;
  readonly certifiedProviderId?: string;
  readonly dataFreshnessSeconds?: number;
  readonly riskLevel: PantavionConnectivityRisk;
  readonly userMessage: string;
}

export interface PantavionOfflineQueueEvent {
  readonly eventId: string;
  readonly createdAtIso: string;
  readonly module: PantavionConnectivityState["module"];
  readonly type:
    | "sos_attempt"
    | "identity_pack_view"
    | "field_note"
    | "water_fault"
    | "translation_phrase"
    | "sync_retry";
  readonly encrypted: boolean;
  readonly syncRequired: boolean;
  readonly founderReviewRequired: boolean;
  readonly summary: string;
}

export function createConnectivityState(
  input: Omit<PantavionConnectivityState, "riskLevel" | "userMessage">,
): PantavionConnectivityState {
  if (input.networkState === "offline") {
    return {
      ...input,
      riskLevel: "unsafe_to_claim_delivery",
      userMessage:
        "Offline mode. Pantavion can store local emergency information and queue events, but cannot guarantee delivery until connectivity returns.",
    };
  }

  if (input.networkState === "weak") {
    return {
      ...input,
      riskLevel: "degraded",
      userMessage:
        "Weak connection. Pantavion should prefer small payloads, local queue and clear retry status.",
    };
  }

  if (input.networkState === "satellite_supported" && !input.certifiedProviderId) {
    return {
      ...input,
      riskLevel: "unsafe_to_claim_delivery",
      userMessage:
        "Satellite-supported state is detected, but no certified Pantavion provider is configured. No rescue guarantee may be claimed.",
    };
  }

  return {
    ...input,
    riskLevel: "normal",
    userMessage: "Connection available.",
  };
}
