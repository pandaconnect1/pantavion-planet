import {
  PANTAVION_GLOBAL_250_LANGUAGES,
  PANTAVION_LANGUAGE_ATLAS_DOCTRINE,
} from "@/core/language/pantavion-language-atlas";

export const PANTAVION_INITIAL_LANGUAGE_TARGET = 259 as const;

export type PantavionLanguageCapability =
  | "text"
  | "speech_to_text"
  | "text_to_speech"
  | "realtime_voice"
  | "subtitles"
  | "camera_ocr";

export type PantavionCapabilityEvidenceState =
  | "unverified"
  | "provider_configured"
  | "verified_live";

export type PantavionLanguageCapabilityEvidence = {
  state: PantavionCapabilityEvidenceState;
  provider: string | null;
  verifiedAt: string | null;
  evidenceRef: string | null;
};

export type PantavionLanguageCapabilityRow = {
  ordinal: number;
  atlasCode: string;
  language: string;
  direction: "ltr" | "rtl";
  tier: string;
  capabilities: Record<
    PantavionLanguageCapability,
    PantavionLanguageCapabilityEvidence
  >;
};

const CAPABILITIES: readonly PantavionLanguageCapability[] = [
  "text",
  "speech_to_text",
  "text_to_speech",
  "realtime_voice",
  "subtitles",
  "camera_ocr",
];

function unverifiedCapabilities(): PantavionLanguageCapabilityRow["capabilities"] {
  return Object.fromEntries(
    CAPABILITIES.map((capability) => [
      capability,
      {
        state: "unverified" as const,
        provider: null,
        verifiedAt: null,
        evidenceRef: null,
      },
    ]),
  ) as PantavionLanguageCapabilityRow["capabilities"];
}

/**
 * This matrix is a target inventory, not a public support claim.
 * A modality may move to verified_live only after an end-to-end production
 * check records a provider, timestamp and durable evidence reference.
 */
export const PANTAVION_INITIAL_LANGUAGE_CAPABILITY_MATRIX: readonly PantavionLanguageCapabilityRow[] =
  PANTAVION_GLOBAL_250_LANGUAGES.slice(0, PANTAVION_INITIAL_LANGUAGE_TARGET).map(
    (language, index) => ({
      ordinal: index + 1,
      atlasCode: language.code,
      language: language.name,
      direction: language.direction,
      tier: language.tier,
      capabilities: unverifiedCapabilities(),
    }),
  );

export function getPantavionLanguageCapabilityMatrixSummary() {
  const verifiedByCapability = Object.fromEntries(
    CAPABILITIES.map((capability) => [
      capability,
      PANTAVION_INITIAL_LANGUAGE_CAPABILITY_MATRIX.filter(
        (row) => row.capabilities[capability].state === "verified_live",
      ).length,
    ]),
  );

  return {
    marker: "PANTAVION_LANGUAGE_CAPABILITY_MATRIX_V1",
    targetLanguages: PANTAVION_INITIAL_LANGUAGE_TARGET,
    inventoriedLanguages: PANTAVION_INITIAL_LANGUAGE_CAPABILITY_MATRIX.length,
    longTermNaturalLanguageGoal:
      PANTAVION_LANGUAGE_ATLAS_DOCTRINE.supports7000NaturalLanguages
        ? 7000
        : null,
    capabilities: CAPABILITIES,
    verifiedByCapability,
    truthRule:
      "Inventory membership is not evidence of provider or production support.",
  };
}
