export type PantavionLanguageKernelStatus =
  | "visible_foundation_live"
  | "provider_required"
  | "protected_founder_approval_required"
  | "autonomous_draft_allowed"
  | "blocked_until_policy";

export type PantavionLanguageKernelRisk =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type PantavionLanguageKernelDomain =
  | "global_language_selector"
  | "live_text_translation"
  | "live_voice_translation"
  | "sos_emergency_translation"
  | "video_subtitles"
  | "offline_language_pack"
  | "language_quality"
  | "provider_router"
  | "consent_privacy_audit";

export type PantavionLanguageKernelRecord = {
  id: string;
  title: string;
  domain: PantavionLanguageKernelDomain;
  status: PantavionLanguageKernelStatus;
  risk: PantavionLanguageKernelRisk;
  founderApprovalRequired: boolean;
  autonomousDraftAllowed: boolean;
  publicClaimAllowed: boolean;
  currentState: string;
  requiredRealImplementation: string[];
  protectedRules: string[];
};

export const PANTAVION_LANGUAGE_KERNEL_SCOPE = {
  planetScope: "all_continents",
  naturalLanguageScope: "7000_plus_natural_languages",
  visibleStarterCatalog: "250_plus_language_locale_choices",
  currentVisibleLayer: "global_language_selector_deployed",
  liveTranslationTruth:
    "Live translation is not complete until provider routing, quality checks, consent, audit logs, cost controls and founder approval exist.",
} as const;

export const PANTAVION_LANGUAGE_KERNEL_RECORDS: PantavionLanguageKernelRecord[] = [
  {
    id: "language-visible-selector-v1",
    title: "Visible world language selector",
    domain: "global_language_selector",
    status: "visible_foundation_live",
    risk: "medium",
    founderApprovalRequired: false,
    autonomousDraftAllowed: true,
    publicClaimAllowed: true,
    currentState:
      "Global selector is visible in production with 250+ starter language/locales and 7000+ natural language scope messaging.",
    requiredRealImplementation: [
      "Keep selector visible across critical routes",
      "Persist selected language safely in localStorage",
      "Expose selected language to html lang and dataset state",
      "Add searchable catalog later instead of huge unusable dropdown",
    ],
    protectedRules: [
      "Do not claim every language has provider-backed live translation yet",
      "Do not remove emergency translation disclaimers",
    ],
  },
  {
    id: "language-provider-router-v1",
    title: "Translation provider router",
    domain: "provider_router",
    status: "protected_founder_approval_required",
    risk: "high",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    currentState:
      "Provider routing is not complete. Pantavion needs provider contracts, env keys, cost limits and fallback rules before live use.",
    requiredRealImplementation: [
      "Define provider registry",
      "Define per-provider supported language matrix",
      "Add env/key boundary checks",
      "Add cost and rate-limit controls",
      "Add fallback and outage behavior",
      "Add founder approval before enabling paid provider traffic",
    ],
    protectedRules: [
      "No secret keys in GitHub",
      "No provider call without cost boundary",
      "No fake live provider claim",
    ],
  },
  {
    id: "sos-live-translation-v1",
    title: "SOS live voice/text translation",
    domain: "sos_emergency_translation",
    status: "protected_founder_approval_required",
    risk: "critical",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    currentState:
      "SOS/elder translation route exists as foundation, but real emergency-grade provider-backed live translation requires protected implementation.",
    requiredRealImplementation: [
      "Speech capture with consent",
      "Language detection",
      "Text translation",
      "Voice output or readable emergency phrases",
      "Emergency disclaimers",
      "Offline fallback phrases",
      "Audit-safe local event record",
      "Founder approval before live emergency claims",
    ],
    protectedRules: [
      "Never claim guaranteed emergency rescue",
      "Never replace doctors, lawyers, police or emergency services",
      "Do not store sensitive voice data without explicit consent and policy",
    ],
  },
  {
    id: "chat-message-translation-v1",
    title: "Messages and chat translation",
    domain: "live_text_translation",
    status: "provider_required",
    risk: "high",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    currentState:
      "Messages/Chat is in product scope, but real multilingual chat needs identity, storage, moderation, consent and provider-backed translation.",
    requiredRealImplementation: [
      "Authenticated users",
      "Conversation storage",
      "Message moderation",
      "Language detection",
      "Translation provider router",
      "User controls for original and translated text",
      "Abuse and harassment controls",
    ],
    protectedRules: [
      "Do not expose private messages",
      "Do not translate sensitive content without policy controls",
    ],
  },
  {
    id: "video-subtitle-translation-v1",
    title: "Video subtitles and live media translation",
    domain: "video_subtitles",
    status: "provider_required",
    risk: "high",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    currentState:
      "Video/subtitle translation is in Pantavion scope but needs media pipeline, consent, copyright boundaries and provider infrastructure.",
    requiredRealImplementation: [
      "Media permission model",
      "Speech-to-text provider",
      "Translation provider",
      "Subtitle renderer",
      "Copyright and consent controls",
      "Quality confidence display",
    ],
    protectedRules: [
      "No unauthorized voice cloning",
      "No copyrighted media processing without policy",
    ],
  },
  {
    id: "offline-emergency-language-pack-v1",
    title: "Offline emergency language pack",
    domain: "offline_language_pack",
    status: "autonomous_draft_allowed",
    risk: "high",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    currentState:
      "Offline SOS language pack is required for weak/no signal cases, but must remain assistive and device-local until certified integrations exist.",
    requiredRealImplementation: [
      "Local emergency phrases",
      "Medical/allergy phrase templates",
      "Country and helper language presets",
      "QR/local display mode",
      "No-network warning",
      "Later sync queue when connection returns",
    ],
    protectedRules: [
      "No claim of satellite beacon behavior",
      "No automatic authority dispatch without legal contracts",
    ],
  },
  {
    id: "language-quality-safety-v1",
    title: "Translation quality and safety guard",
    domain: "language_quality",
    status: "protected_founder_approval_required",
    risk: "critical",
    founderApprovalRequired: true,
    autonomousDraftAllowed: true,
    publicClaimAllowed: false,
    currentState:
      "Pantavion must show translation confidence, warnings and safety boundaries before using translations in medical, legal, emergency or financial contexts.",
    requiredRealImplementation: [
      "Confidence scoring",
      "Human review lanes for critical contexts",
      "Medical/legal/emergency disclaimers",
      "Source/original text always available",
      "Misinterpretation risk warning",
    ],
    protectedRules: [
      "Never present machine translation as legally perfect",
      "Never hide original source text in critical contexts",
    ],
  },
];

export function getPantavionLanguageKernelRecords() {
  return PANTAVION_LANGUAGE_KERNEL_RECORDS;
}

export function getPantavionLanguageKernelRecordsByStatus(
  status: PantavionLanguageKernelStatus,
) {
  return PANTAVION_LANGUAGE_KERNEL_RECORDS.filter((record) => record.status === status);
}

export function getPantavionLanguageKernelProtectedRecords() {
  return PANTAVION_LANGUAGE_KERNEL_RECORDS.filter(
    (record) => record.founderApprovalRequired || record.risk === "critical",
  );
}

export const pantavionLanguageKernelStats = {
  total: PANTAVION_LANGUAGE_KERNEL_RECORDS.length,
  visibleFoundationLive: getPantavionLanguageKernelRecordsByStatus(
    "visible_foundation_live",
  ).length,
  providerRequired: getPantavionLanguageKernelRecordsByStatus("provider_required").length,
  founderApprovalRequired: getPantavionLanguageKernelProtectedRecords().length,
} as const;
