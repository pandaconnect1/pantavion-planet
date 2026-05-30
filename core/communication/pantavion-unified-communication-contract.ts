export const PANTAVION_UNIFIED_COMMUNICATION_CONTRACT_MARKER =
  "pantavion_unified_communication_contract_v1";

export type PantavionCommunicationSurface =
  | "one-global-profile"
  | "unified-inbox"
  | "contacts-import"
  | "friend-network"
  | "direct-messaging"
  | "group-chat"
  | "voice-calls"
  | "video-calls"
  | "email-bridge"
  | "sms-bridge"
  | "social-feed"
  | "stories-short-media"
  | "photo-video-media"
  | "dating-social-discovery"
  | "professional-network"
  | "marketplace-classifieds"
  | "translation-layer"
  | "safety-moderation"
  | "identity-consent"
  | "pantaai-assistance";

export type PantavionBenchmarkFamily =
  | "facebook-style-social-graph"
  | "x-twitter-style-public-signal"
  | "instagram-style-photo-media"
  | "tiktok-style-short-video"
  | "snapchat-style-ephemeral-media"
  | "telegram-style-channels-groups"
  | "viber-whatsapp-style-messaging"
  | "linkedin-style-professional-identity"
  | "email-style-formal-communication"
  | "sms-style-device-contact-communication"
  | "dating-discovery-style-social-matching"
  | "marketplace-classifieds-style-commerce"
  | "apple-style-ecosystem-continuity";

export type PantavionContinent =
  | "africa"
  | "antarctica"
  | "asia"
  | "europe"
  | "north-america"
  | "oceania"
  | "south-america";

export interface PantavionUnifiedCommunicationContract {
  ok: true;
  marker: typeof PANTAVION_UNIFIED_COMMUNICATION_CONTRACT_MARKER;
  status: "product-dna-locked";
  doctrine: {
    oneScreenPrinciple: true;
    oneGlobalProfileRequired: true;
    noHundredAccountsExperience: true;
    noHundredAppsExperience: true;
    everyVisibleFeatureNeedsRealRouteOrDisabledState: true;
    thirdPartyAdInterruptionAllowed: false;
    professionalAdsLayerMustBeSeparate: true;
    pantavionOwnedLegalAdaptationRequired: true;
  };
  surfaces: PantavionCommunicationSurface[];
  benchmarkFamilies: PantavionBenchmarkFamily[];
  requiredResearchContinents: PantavionContinent[];
  legalAssimilation: {
    copyBrandsLogosLayoutsClaimsAllowed: false;
    useBenchmarksAsResearchSignalsOnly: true;
    buildPantavionOwnedWorkflows: true;
    trademarkAndCopyrightRespectRequired: true;
    privacyConsentBeforeContactImport: true;
    noMessageReadingWithoutExplicitConsent: true;
    noContactHarvestingWithoutConsent: true;
    minorsAndVulnerableUsersProtectionRequired: true;
    moderationBeforePublicExposureRequired: true;
  };
  productPromise: {
    unifiedInboxGoal: "collect-authorized-communication-signals-into-one-controlled-screen";
    contactGoal: "let-users-connect-existing-contacts-to-pantavion-through-consent-based-imports";
    socialGoal: "create-pantavion-owned-social-media-professional-dating-and-marketplace-surfaces";
    communicationGoal: "support-text-voice-video-email-sms-and-translation-through-lawful-providers";
    advantageGoal: "reduce-friction-fragmentation-and-account-chaos-through-one-governed-platform";
  };
  firstBuildTargets: string[];
  mustNotDo: string[];
}

export function createPantavionUnifiedCommunicationContract(): PantavionUnifiedCommunicationContract {
  return {
    ok: true,
    marker: PANTAVION_UNIFIED_COMMUNICATION_CONTRACT_MARKER,
    status: "product-dna-locked",
    doctrine: {
      oneScreenPrinciple: true,
      oneGlobalProfileRequired: true,
      noHundredAccountsExperience: true,
      noHundredAppsExperience: true,
      everyVisibleFeatureNeedsRealRouteOrDisabledState: true,
      thirdPartyAdInterruptionAllowed: false,
      professionalAdsLayerMustBeSeparate: true,
      pantavionOwnedLegalAdaptationRequired: true,
    },
    surfaces: [
      "one-global-profile",
      "unified-inbox",
      "contacts-import",
      "friend-network",
      "direct-messaging",
      "group-chat",
      "voice-calls",
      "video-calls",
      "email-bridge",
      "sms-bridge",
      "social-feed",
      "stories-short-media",
      "photo-video-media",
      "dating-social-discovery",
      "professional-network",
      "marketplace-classifieds",
      "translation-layer",
      "safety-moderation",
      "identity-consent",
      "pantaai-assistance",
    ],
    benchmarkFamilies: [
      "facebook-style-social-graph",
      "x-twitter-style-public-signal",
      "instagram-style-photo-media",
      "tiktok-style-short-video",
      "snapchat-style-ephemeral-media",
      "telegram-style-channels-groups",
      "viber-whatsapp-style-messaging",
      "linkedin-style-professional-identity",
      "email-style-formal-communication",
      "sms-style-device-contact-communication",
      "dating-discovery-style-social-matching",
      "marketplace-classifieds-style-commerce",
      "apple-style-ecosystem-continuity",
    ],
    requiredResearchContinents: [
      "africa",
      "antarctica",
      "asia",
      "europe",
      "north-america",
      "oceania",
      "south-america",
    ],
    legalAssimilation: {
      copyBrandsLogosLayoutsClaimsAllowed: false,
      useBenchmarksAsResearchSignalsOnly: true,
      buildPantavionOwnedWorkflows: true,
      trademarkAndCopyrightRespectRequired: true,
      privacyConsentBeforeContactImport: true,
      noMessageReadingWithoutExplicitConsent: true,
      noContactHarvestingWithoutConsent: true,
      minorsAndVulnerableUsersProtectionRequired: true,
      moderationBeforePublicExposureRequired: true,
    },
    productPromise: {
      unifiedInboxGoal:
        "collect-authorized-communication-signals-into-one-controlled-screen",
      contactGoal:
        "let-users-connect-existing-contacts-to-pantavion-through-consent-based-imports",
      socialGoal:
        "create-pantavion-owned-social-media-professional-dating-and-marketplace-surfaces",
      communicationGoal:
        "support-text-voice-video-email-sms-and-translation-through-lawful-providers",
      advantageGoal:
        "reduce-friction-fragmentation-and-account-chaos-through-one-governed-platform",
    },
    firstBuildTargets: [
      "unified-inbox-route",
      "one-global-profile-route",
      "contacts-consent-import-route",
      "message-center-route",
      "social-universe-route",
      "professional-classifieds-route",
      "communication-provider-registry",
      "privacy-consent-ledger",
      "safety-moderation-gate",
      "pantaai-communication-assistant",
    ],
    mustNotDo: [
      "copy-competitor-ui",
      "copy-brand-logos",
      "claim-official-integration-without-contract",
      "read-private-messages-without-consent",
      "import-contacts-without-consent",
      "mix-third-party-ads-into-core-private-inbox",
      "expose-minors-to-adult-dating-surfaces",
      "create-dead-buttons",
    ],
  };
}
