/**
 * Global Connect Foundation is intentionally a contract layer.
 *
 * It describes the data and policy boundaries required before a real auth,
 * device, translation, or country-registry flow may be exposed. It does not
 * authenticate a user, write to PostgreSQL, call a provider, or claim that a
 * deployment has occurred.
 */

export const GLOBAL_CONNECT_FOUNDATION_VERSION = "2026-08-15";

export type GlobalConnectCapabilityState =
  | "contract_only"
  | "migration_pending"
  | "provider_pending"
  | "verification_pending"
  | "verified";

export type GlobalConnectDataBoundary =
  | "identity"
  | "people"
  | "social"
  | "private_chat"
  | "voice"
  | "sos";

export type TranslationArtifactKind = "text" | "transcript" | "subtitle" | "synthesized_audio_reference";
export type TranslationLaneDirection = "a_to_b" | "b_to_a";
export type ConsentDecision = "granted" | "denied" | "not_recorded";
export type PolicyDecisionState = "approved" | "blocked" | "pending";

export interface GlobalConnectCapability {
  readonly id: string;
  readonly state: GlobalConnectCapabilityState;
  readonly boundary: GlobalConnectDataBoundary;
  readonly detail: string;
}

export const GLOBAL_CONNECT_CAPABILITIES: readonly GlobalConnectCapability[] = Object.freeze([
  {
    id: "identity_auth_persistence",
    state: "migration_pending",
    boundary: "identity",
    detail: "Additive PostgreSQL contract exists; no live database migration was applied in this cycle.",
  },
  {
    id: "device_and_session_registry",
    state: "migration_pending",
    boundary: "identity",
    detail: "Hashed session-secret and device-record schema is defined; no session runtime is connected.",
  },
  {
    id: "country_coverage_ledger",
    state: "contract_only",
    boundary: "people",
    detail: "All 249 ISO alpha-2 entries are represented as registry-only; jurisdiction packs remain unapproved.",
  },
  {
    id: "bidirectional_translation_channel",
    state: "provider_pending",
    boundary: "private_chat",
    detail: "Two-lane, immutable-original contracts are present; no engine or external provider is connected by this foundation.",
  },
  {
    id: "capability_readiness_api",
    state: "verification_pending",
    boundary: "identity",
    detail: "Read-only endpoint is implemented locally; deployment and production verification are not part of this cycle.",
  },
]);

export interface NormalizedHandle {
  readonly handle: string;
  readonly normalizedHandle: string;
  readonly confusableSkeleton: string;
}

const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$/;
const RESERVED_HANDLES = new Set(["admin", "help", "pantavion", "security", "sos", "support", "system"]);

/**
 * The first secure handle subset is ASCII-only. This intentionally rejects
 * Unicode lookalikes until an approved Unicode confusable implementation and
 * multilingual handle policy are in place. Display names remain a separate
 * localized field and are not constrained by this technical identifier rule.
 */
export function normalizeGlobalConnectHandle(input: string): NormalizedHandle {
  const trimmed = input.trim();

  if (trimmed.length !== input.length) {
    throw new Error("Handle may not contain leading or trailing whitespace.");
  }

  if (/[^\x00-\x7F]/.test(trimmed)) {
    throw new Error("Public handles are ASCII-only until the Unicode confusable policy is implemented.");
  }

  const normalizedHandle = trimmed.toLowerCase();

  if (!HANDLE_PATTERN.test(normalizedHandle)) {
    throw new Error("Handle must be 3–30 ASCII characters using letters, digits, dot, underscore, or hyphen.");
  }

  if (RESERVED_HANDLES.has(normalizedHandle)) {
    throw new Error("This handle is reserved.");
  }

  return Object.freeze({
    handle: trimmed,
    normalizedHandle,
    // ASCII-only handles make the initial skeleton deterministic and prevent
    // cross-script lookalikes in the persisted uniqueness constraint.
    confusableSkeleton: normalizedHandle,
  });
}

export interface PasskeyCredentialContract {
  readonly internalIdentityId: string;
  readonly credentialId: string;
  readonly publicKeyCose: string;
  readonly signCount: number;
  readonly backupEligible: boolean;
  readonly backupState: boolean;
  readonly transports: readonly string[];
  readonly relyingPartyId: string;
  readonly createdAt: string;
  readonly lastUsedAt: string | null;
  readonly revokedAt: string | null;
}

export interface AuthChallengeStorageContract {
  readonly internalIdentityId: string | null;
  readonly purpose: "passkey_registration" | "passkey_authentication" | "recovery";
  readonly challengeHash: string;
  readonly expiresAt: string;
  readonly consumedAt: string | null;
}

export interface DeviceSessionContract {
  readonly internalIdentityId: string;
  readonly deviceId: string;
  readonly sessionId: string;
  readonly refreshSecretHash: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly revokedAt: string | null;
}

export interface TranslationLane {
  readonly id: TranslationLaneDirection;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
}

export interface TranslationChannel {
  readonly id: string;
  readonly ownerIdentityId: string;
  readonly dataBoundary: Extract<GlobalConnectDataBoundary, "private_chat" | "social" | "voice" | "sos">;
  readonly state: "contract_only";
  readonly lanes: readonly [TranslationLane, TranslationLane];
  readonly originalArtifactRule: "immutable_original_separate_translation_records";
}

export interface CreateTranslationChannelInput {
  readonly id: string;
  readonly ownerIdentityId: string;
  readonly dataBoundary: TranslationChannel["dataBoundary"];
  readonly participantALanguage: string;
  readonly participantBLanguage: string;
}

function canonicalizeBcp47(tag: string): string {
  const candidate = tag.trim();

  if (!candidate) {
    throw new Error("A non-empty BCP 47 language tag is required.");
  }

  try {
    const canonicalLocales = (
      Intl as typeof Intl & { getCanonicalLocales?: (locales: string | readonly string[]) => string[] }
    ).getCanonicalLocales;
    const canonical = canonicalLocales?.(candidate)[0];

    if (!canonical) {
      if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(candidate)) {
        throw new Error("No canonical locale was returned.");
      }

      return candidate
        .split("-")
        .map((part, index) => (index === 0 ? part.toLowerCase() : part.length === 2 ? part.toUpperCase() : part))
        .join("-");
    }

    return canonical;
  } catch {
    throw new Error(`Invalid BCP 47 language tag: ${JSON.stringify(tag)}.`);
  }
}

/**
 * Builds the explicit A→B and B→A lanes required for a translation channel.
 * Neither lane calls an engine and neither modifies the original artifact.
 */
export function createBidirectionalTranslationChannel(input: CreateTranslationChannelInput): TranslationChannel {
  if (!input.id || !input.ownerIdentityId) {
    throw new Error("Translation channels require opaque channel and owner identity IDs.");
  }

  const participantALanguage = canonicalizeBcp47(input.participantALanguage);
  const participantBLanguage = canonicalizeBcp47(input.participantBLanguage);

  if (participantALanguage === participantBLanguage) {
    throw new Error("Bidirectional translation lanes require two distinct canonical language tags.");
  }

  return Object.freeze({
    id: input.id,
    ownerIdentityId: input.ownerIdentityId,
    dataBoundary: input.dataBoundary,
    state: "contract_only",
    lanes: Object.freeze([
      Object.freeze({ id: "a_to_b", sourceLanguage: participantALanguage, targetLanguage: participantBLanguage }),
      Object.freeze({ id: "b_to_a", sourceLanguage: participantBLanguage, targetLanguage: participantALanguage }),
    ]) as [TranslationLane, TranslationLane],
    originalArtifactRule: "immutable_original_separate_translation_records",
  });
}

export interface ExternalTranslationDispatchInput {
  readonly dataBoundary: TranslationChannel["dataBoundary"];
  readonly providerRouteId: string | null;
  readonly consent: ConsentDecision;
  readonly policyDecision: PolicyDecisionState;
}

export interface ExternalTranslationDispatchPlan {
  readonly allowed: boolean;
  readonly reason:
    | "provider_route_missing"
    | "policy_not_approved"
    | "private_content_consent_missing"
    | "sos_machine_translation_blocked"
    | "authorized";
}

/**
 * A provider-neutral authorization decision. A caller must persist the policy
 * decision and consent reference before dispatching any private content.
 */
export function planExternalTranslationDispatch(
  input: ExternalTranslationDispatchInput,
): ExternalTranslationDispatchPlan {
  if (!input.providerRouteId) {
    return Object.freeze({ allowed: false, reason: "provider_route_missing" });
  }

  if (input.policyDecision !== "approved") {
    return Object.freeze({ allowed: false, reason: "policy_not_approved" });
  }

  if (input.dataBoundary === "sos") {
    return Object.freeze({ allowed: false, reason: "sos_machine_translation_blocked" });
  }

  if (input.dataBoundary === "private_chat" && input.consent !== "granted") {
    return Object.freeze({ allowed: false, reason: "private_content_consent_missing" });
  }

  return Object.freeze({ allowed: true, reason: "authorized" });
}

export interface TranslationJobContract {
  readonly idempotencyKey: string;
  readonly laneId: TranslationLaneDirection;
  readonly source: Readonly<{
    readonly artifactId: string;
    readonly artifactKind: TranslationArtifactKind;
    readonly immutableOriginal: true;
    readonly contentHash: string;
  }>;
  readonly outputKinds: readonly TranslationArtifactKind[];
  readonly dispatch: ExternalTranslationDispatchPlan;
}

export function createTranslationJobContract(input: {
  readonly idempotencyKey: string;
  readonly laneId: TranslationLaneDirection;
  readonly artifactId: string;
  readonly artifactKind: TranslationArtifactKind;
  readonly contentHash: string;
  readonly outputKinds: readonly TranslationArtifactKind[];
  readonly dispatch: ExternalTranslationDispatchPlan;
}): TranslationJobContract {
  if (!input.idempotencyKey || !input.artifactId || !input.contentHash) {
    throw new Error("Translation jobs require an idempotency key and immutable source artifact reference/hash.");
  }

  return Object.freeze({
    idempotencyKey: input.idempotencyKey,
    laneId: input.laneId,
    source: Object.freeze({
      artifactId: input.artifactId,
      artifactKind: input.artifactKind,
      immutableOriginal: true,
      contentHash: input.contentHash,
    }),
    outputKinds: Object.freeze([...input.outputKinds]),
    dispatch: input.dispatch,
  });
}

export function globalConnectReadinessSnapshot() {
  return Object.freeze({
    version: GLOBAL_CONNECT_FOUNDATION_VERSION,
    state: "contract_only" as const,
    deployment: "not_deployed_by_this_branch" as const,
    capabilities: GLOBAL_CONNECT_CAPABILITIES,
  });
}
