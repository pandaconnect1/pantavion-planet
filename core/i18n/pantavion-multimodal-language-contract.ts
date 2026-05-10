export const PANTAVION_MULTIMODAL_LANGUAGE_CONTRACT_VERSION =
  "pantavion_multimodal_bidirectional_language_contract_v1";

export const PANTAVION_MULTIMODAL_LANGUAGE_SCOPE = {
  textInput: true,
  textOutput: true,
  speechInput: true,
  speechOutput: true,
  audioInput: true,
  audioOutput: true,
  imageTextExtraction: true,
  subtitleGeneration: true,
  bidirectionalConversation: true,
  userSelectedLanguageRequired: true,
  currentMinimumLanguageTarget: 250,
  dialectRoadmapTarget: 7200,
  sixContinentCoverageRequired: true,
  cyprusPriorityPopulationLanguagesRequired: true,
} as const;

export const PANTAVION_MULTIMODAL_PROVIDER_REQUIREMENTS = [
  "speech-to-text provider or browser speech recognition",
  "text-to-speech provider or browser speech synthesis",
  "text translation provider",
  "bidirectional conversation routing",
  "image OCR provider",
  "audio transcription provider",
  "subtitle generation provider",
  "language detection provider",
  "dialect roadmap registry",
  "provider cost and privacy controls",
] as const;

export type PantavionMultimodalLanguageReadiness = {
  marker: string;
  status: "contract_ready_provider_blocked";
  productionReady: false;
  dataReturned: false;
  waterNetworkDataReturned: false;
  bidirectionalRequired: true;
  userSelectedLanguageRequired: true;
  textSupportedByContract: true;
  speechSupportedByContract: true;
  audioSupportedByContract: true;
  imageSupportedByContract: true;
  subtitleSupportedByContract: true;
  currentMinimumLanguageTarget: 250;
  dialectRoadmapTarget: 7200;
  providerActivationAllowed: false;
  browserSpeechMayBeUsedAsLocalAssistiveLayer: true;
  providerRequirements: readonly string[];
  blockers: string[];
};

export function getPantavionMultimodalLanguageReadiness():
  PantavionMultimodalLanguageReadiness {
  return {
    marker: PANTAVION_MULTIMODAL_LANGUAGE_CONTRACT_VERSION,
    status: "contract_ready_provider_blocked",
    productionReady: false,
    dataReturned: false,
    waterNetworkDataReturned: false,
    bidirectionalRequired: true,
    userSelectedLanguageRequired: true,
    textSupportedByContract: true,
    speechSupportedByContract: true,
    audioSupportedByContract: true,
    imageSupportedByContract: true,
    subtitleSupportedByContract: true,
    currentMinimumLanguageTarget: 250,
    dialectRoadmapTarget: 7200,
    providerActivationAllowed: false,
    browserSpeechMayBeUsedAsLocalAssistiveLayer: true,
    providerRequirements: PANTAVION_MULTIMODAL_PROVIDER_REQUIREMENTS,
    blockers: [
      "translation provider is not connected",
      "speech-to-text provider is not connected",
      "text-to-speech provider is not connected",
      "image OCR provider is not connected",
      "audio transcription provider is not connected",
      "subtitle provider is not connected",
      "provider privacy/cost controls are not approved",
      "founder/admin activation approval is required",
    ],
  };
}
