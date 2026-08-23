export type EvidenceStatus =
  | "registry-only"
  | "research-pending"
  | "evidence-partial"
  | "reviewed"
  | "legally-reviewed"
  | "approved-for-production"
  | "suspended";

export type TranslationLaneDirection = "A_TO_B" | "B_TO_A";
export type TranslationJobState = "queued" | "running" | "succeeded" | "failed" | "quarantined";
export type AssuranceLevel = "aal1" | "aal2" | "phishing-resistant";

export interface DeviceCapabilitySnapshot {
  passkeys?: boolean;
  mediaCapture?: boolean;
  push?: boolean;
  backgroundSync?: boolean;
  webRtc?: boolean;
  serviceWorker?: boolean;
  lowDataMode?: boolean;
  capturedAt: string;
}

export interface IdentityDeviceContract {
  devicePublicId: string;
  displayName?: string;
  platform?: string;
  browserFamily?: string;
  capabilities: DeviceCapabilitySnapshot;
}

export interface IdentitySessionContract {
  sessionId: string;
  devicePublicId?: string;
  assuranceLevel: AssuranceLevel;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface TranslationLaneContract {
  direction: TranslationLaneDirection;
  sourceLanguageTag: string;
  targetLanguageTag: string;
  autoDetect: boolean;
}

export interface TranslationChannelContract {
  channelId: string;
  contextKind: "chat" | "interpreter" | "voice" | "document" | "other";
  privacyClass: "private" | "restricted" | "public";
  lanes: readonly [TranslationLaneContract, TranslationLaneContract];
}

export interface TranslationJobContract {
  jobId: string;
  laneId: string;
  idempotencyKey: string;
  originalText: string;
  state: TranslationJobState;
  providerConnected: boolean;
}

export const GLOBAL_CONNECT_BOUNDARIES = Object.freeze({
  privateChatMayEnterSocial: false,
  aiMayDecideIdentity: false,
  aiMayDecideAgeOrConsent: false,
  aiMayDecideSecurityAuthorization: false,
  translationMayReplaceOriginal: false,
  translationProviderConnectedByContract: false,
});
