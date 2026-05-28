export type PantavionProductDNAStatus =
  | "contract-registered"
  | "implementation-required"
  | "live"
  | "blocked";

export type PantavionProductDNAFamily =
  | "one-global-profile"
  | "unified-social-universe"
  | "universal-communication"
  | "unified-inbox"
  | "contacts-import"
  | "media-stories-video-photo-music"
  | "professional-network"
  | "work-services-income"
  | "marketplace-classifieds"
  | "dating-equality-social"
  | "pantaai-center"
  | "sos-offline-safety"
  | "education-knowledge-science"
  | "health-safety-boundary"
  | "water-infrastructure-intelligence"
  | "global-research-innovation"
  | "kernel-gap-repair-upgrade";

export interface PantavionProductDNAReport {
  ok: boolean;
  marker: "pantavion_product_dna_v1";
  status: PantavionProductDNAStatus;
  generatedAt: string;
  mission: {
    planetInOneLivingScreen: true;
    oneProfileForLife: true;
    allCommunicationInOnePlace: true;
    reduceHundredAppsAndAccounts: true;
    coreExperienceInterruptedByThirdPartyAds: false;
    pantavionOwnedLegalImplementationRequired: true;
  };
  benchmarkSignals: {
    note: "Market examples are category signals only. No copying of brand, UI, code, trademarks, claims, or private systems.";
    socialSignals: string[];
    communicationSignals: string[];
    professionalSignals: string[];
    mediaSignals: string[];
    marketplaceSignals: string[];
  };
  productFamilies: Array<{
    family: PantavionProductDNAFamily;
    title: string;
    intent: string;
    implementationRule: string;
    visibleButtonRule: "route-api-action-or-disabled-beta";
    status: PantavionProductDNAStatus;
  }>;
  communicationsDoctrine: {
    unifiedInboxRequired: true;
    emailSmsConnectorRequiresLegalProvider: true;
    appMessageImportRequiresUserConsentAndPlatformPermission: true;
    contactsImportRequiresExplicitConsent: true;
    noHiddenHarvesting: true;
    translationAssistRequired: true;
    voiceVideoTextSubtitleRequired: true;
  };
  adsDoctrine: {
    coreFeedThirdPartyAdInterruptionAllowed: false;
    classifiedAdsSeparateProfessionalArea: true;
    sponsorDisclosureRequired: true;
    sensitiveCategoriesRequireLegalReview: true;
    adultSensitiveAdsExcludedAtEarlyStage: true;
  };
  kernelBuildRules: {
    noDeadButtons: true;
    noStaticFakeFeatures: true;
    everyVisibleCapabilityNeedsRouteApiActionOrDisabledState: true;
    legalAdaptationOnly: true;
    userConsentFirst: true;
    minorsAndVulnerableUsersProtectionRequired: true;
    accessibilityAndMultilingualRequired: true;
  };
  nextImplementationTargets: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createPantavionProductDNAReport(): PantavionProductDNAReport {
  return {
    ok: true,
    marker: "pantavion_product_dna_v1",
    status: "contract-registered",
    generatedAt: nowIso(),
    mission: {
      planetInOneLivingScreen: true,
      oneProfileForLife: true,
      allCommunicationInOnePlace: true,
      reduceHundredAppsAndAccounts: true,
      coreExperienceInterruptedByThirdPartyAds: false,
      pantavionOwnedLegalImplementationRequired: true,
    },
    benchmarkSignals: {
      note:
        "Market examples are category signals only. No copying of brand, UI, code, trademarks, claims, or private systems.",
      socialSignals: [
        "global-feed",
        "friends-followers",
        "communities",
        "short-posts",
        "stories",
        "groups",
        "identity-safe-social",
      ],
      communicationSignals: [
        "chat",
        "voice",
        "video",
        "subtitles",
        "translation",
        "email",
        "sms",
        "contacts",
        "consented-connectors",
      ],
      professionalSignals: [
        "professional-profile",
        "company-page",
        "jobs",
        "services",
        "networking",
        "portfolio",
        "business-messaging",
      ],
      mediaSignals: [
        "photo",
        "video",
        "short-video",
        "music",
        "live",
        "creator-tools",
        "media-library",
      ],
      marketplaceSignals: [
        "classifieds",
        "local-ads",
        "professional-listings",
        "jobs",
        "services",
        "donations",
        "lawful-categories",
      ],
    },
    productFamilies: [
      {
        family: "one-global-profile",
        title: "One Global Profile",
        intent: "One lawful user identity across social, work, media, services, safety, and AI.",
        implementationRule: "Requires auth, consent, profile policy, minors policy, privacy controls.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "unified-social-universe",
        title: "Unified Social Universe",
        intent: "Pantavion-owned social surfaces for feed, friends, followers, groups, communities, stories, and identity-safe equality spaces.",
        implementationRule: "No brand copying; build lawful Pantavion-owned interaction models.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "universal-communication",
        title: "Universal Communication",
        intent: "Voice, video, text, subtitles, translation, weak-signal and offline-aware communication paths.",
        implementationRule: "Provider-backed live communication with consent, safety, logging, and translation disclaimers.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "unified-inbox",
        title: "Unified Inbox",
        intent: "One screen for Pantavion messages, email, SMS, contact-based messages, and lawful connectors.",
        implementationRule: "External imports require user consent and provider/platform permission.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "contacts-import",
        title: "Contacts Import",
        intent: "Bring contacts from phone, email, CSV, and devices where legally permitted.",
        implementationRule: "Explicit consent, no hidden harvesting, reversible import, privacy-first matching.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "media-stories-video-photo-music",
        title: "Pantavion Media",
        intent: "Photo, video, music, stories, creator tools, live and media sharing in one ecosystem.",
        implementationRule: "Moderation, copyright, minors safety, consent, licensing, and creator controls required.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "professional-network",
        title: "Pantavion Professional",
        intent: "Professional profiles, companies, jobs, business pages, networking, portfolios, and services.",
        implementationRule: "Separate professional layer with identity, business verification, lawful listings.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "marketplace-classifieds",
        title: "Pantavion Classifieds",
        intent: "Separate classified ads and local/professional listings without interrupting the core feed.",
        implementationRule: "Lawful categories only, sponsor disclosure, sensitive categories gated or excluded.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "dating-equality-social",
        title: "Equality Social Layer",
        intent: "Safe social/dating/equality surfaces for adults where legally allowed.",
        implementationRule: "Age gates, consent, safety, jurisdiction checks, anti-abuse controls.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "pantaai-center",
        title: "PantaAI Center",
        intent: "AI execution center for research, creation, work, automation, memory, learning, services, and build flows.",
        implementationRule: "Provider router, cost controls, privacy, audit, no fake AI claims.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "sos-offline-safety",
        title: "SOS / Offline Safety",
        intent: "Emergency circle, offline identity pack, local queue, QR/NFC, weak-signal sync, provider-backed satellite-supported future.",
        implementationRule: "No false satellite guarantees; certified provider/hardware required for satellite SOS claims.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "water-infrastructure-intelligence",
        title: "Water / Infrastructure Intelligence",
        intent: "Protected professional infrastructure maps, DWG source vault, derived safe layers, A/B/C intelligence maps.",
        implementationRule: "No raw private DWG public exposure; source proof, access control, founder approval.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "global-research-innovation",
        title: "Global Research / Innovation",
        intent: "Six-continent benchmark and technology absorption system for lawful improvement.",
        implementationRule: "Discover, classify, legal check, safety check, founder approval where risky, then build.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      },
      {
        family: "kernel-gap-repair-upgrade",
        title: "Kernel Gap / Repair / Upgrade",
        intent: "Continuous detection of Pantavion gaps and transformation into repair or advantage.",
        implementationRule: "Observe, compare, diagnose, propose, approve, patch, audit, deploy, monitor.",
        visibleButtonRule: "route-api-action-or-disabled-beta",
        status: "implementation-required",
      }
    ],
    communicationsDoctrine: {
      unifiedInboxRequired: true,
      emailSmsConnectorRequiresLegalProvider: true,
      appMessageImportRequiresUserConsentAndPlatformPermission: true,
      contactsImportRequiresExplicitConsent: true,
      noHiddenHarvesting: true,
      translationAssistRequired: true,
      voiceVideoTextSubtitleRequired: true,
    },
    adsDoctrine: {
      coreFeedThirdPartyAdInterruptionAllowed: false,
      classifiedAdsSeparateProfessionalArea: true,
      sponsorDisclosureRequired: true,
      sensitiveCategoriesRequireLegalReview: true,
      adultSensitiveAdsExcludedAtEarlyStage: true,
    },
    kernelBuildRules: {
      noDeadButtons: true,
      noStaticFakeFeatures: true,
      everyVisibleCapabilityNeedsRouteApiActionOrDisabledState: true,
      legalAdaptationOnly: true,
      userConsentFirst: true,
      minorsAndVulnerableUsersProtectionRequired: true,
      accessibilityAndMultilingualRequired: true,
    },
    nextImplementationTargets: [
      "live-kernel-panel",
      "one-global-profile-foundation",
      "unified-inbox-foundation",
      "contacts-consent-import-foundation",
      "universal-communication-foundation",
      "pantavion-social-navigation",
      "professional-classifieds-separate-layer",
      "sos-offline-pack",
      "water-dwg-source-proof",
      "pantaai-execution-center",
    ],
  };
}
