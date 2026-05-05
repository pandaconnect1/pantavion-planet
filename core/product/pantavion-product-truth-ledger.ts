export type PantavionImplementationStatus =
  | "LOCKED_REQUIREMENT"
  | "MISSING_IMPLEMENTATION"
  | "STATIC_SHELL"
  | "LOCAL_ONLY"
  | "PROVIDER_REQUIRED"
  | "DATABASE_REQUIRED"
  | "LEGAL_CONTRACT_REQUIRED"
  | "LIVE_WORKING";

export type PantavionRiskLane =
  | "general"
  | "minor_safety"
  | "adult_18_plus"
  | "privacy"
  | "medical_boundary"
  | "legal_boundary"
  | "financial_boundary"
  | "emergency_boundary"
  | "copyright_boundary";

export interface PantavionProductTruthItem {
  key: string;
  title: string;
  founderRequirement: string;
  currentTruth: string;
  status: PantavionImplementationStatus;
  riskLane: PantavionRiskLane;
  mustNotClaim: string[];
  nextRealStep: string;
  implementationProof?: string;
}

export const PANTAVION_PRODUCT_TRUTH_LEDGER_V1 = {
  marker: "PANTAVION_PRODUCT_TRUTH_LEDGER_V1",
  doctrine:
    "Pantavion must not present roadmap, static text, local-only flows, provider-required features, or legal-contract-required features as live working functionality.",
  rule:
    "A feature is LIVE_WORKING only when it has real implementation proof: route/action/provider/database/API/test/audit and safe legal boundary.",
  founderComplaintAcknowledged:
    "The founder repeatedly requested real implementation, not static shells. This ledger exists to stop fake-active features and force truth before claims.",
} as const;

export const PANTAVION_PRODUCT_TRUTH_ITEMS: readonly PantavionProductTruthItem[] = [
  {
    key: "universal_interpreter_global_product",
    title: "Universal Interpreter / 7000+ Natural Language Atlas",
    founderRequirement:
      "The interpreter must be a central homepage product for every user, separate from SOS, supporting natural language communication across travel, street, work, nightlife, social, camera, text, voice and subtitles.",
    currentTruth:
      "Core interpreter doctrine exists, but full live provider-connected translation and homepage product presentation are not yet complete.",
    status: "PROVIDER_REQUIRED",
    riskLane: "privacy",
    mustNotClaim: [
      "Do not claim perfect live translation for all 7000+ natural languages on day one.",
      "Do not confuse Universal Interpreter with SOS emergency translation.",
    ],
    nextRealStep:
      "Add homepage product block and route status labels, then connect provider-supported translation separately from SOS emergency translation.",
  },
  {
    key: "sos_emergency_translation",
    title: "SOS Emergency Translation",
    founderRequirement:
      "SOS needs simple emergency translation for panic, elder, minor, violence, bullying, accident, lost traveler, trusted contacts and no-signal instructions.",
    currentTruth:
      "SOS and elder flows exist with local/browser behavior and safety wording, but institutional dispatch and certified satellite/provider flows are not live.",
    status: "LOCAL_ONLY",
    riskLane: "emergency_boundary",
    mustNotClaim: [
      "Do not claim police, ambulance, government, institutional or satellite dispatch without certified agreements.",
      "Do not claim SOS replaces local emergency services.",
    ],
    nextRealStep:
      "Keep SOS emergency translation separate from Universal Interpreter and label provider/institution-required functions clearly.",
    implementationProof: "Existing /sos and /sos/elder routes plus green build after elder fallback fix.",
  },
  {
    key: "contacts_import_phone_email_csv_apps",
    title: "Contacts Import / Contact Bridge",
    founderRequirement:
      "User must be able to bring contacts from phone, email, CSV/vCard and legally available app exports with explicit consent, so Pantavion becomes the life communication center.",
    currentTruth:
      "Requirement is locked, but real phone/email/app contact import is not live without OS permissions, OAuth providers, upload parser, database and consent UI.",
    status: "PROVIDER_REQUIRED",
    riskLane: "privacy",
    mustNotClaim: [
      "Do not claim live phone contact import from web/PWA without OS/mobile permission.",
      "Do not claim import from third-party apps where APIs/legal export are unavailable.",
    ],
    nextRealStep:
      "Implement CSV/vCard local import MVP first, then Gmail/Outlook OAuth contacts, then mobile app phone contacts.",
  },
  {
    key: "email_hub",
    title: "Unified Email Hub",
    founderRequirement:
      "Pantavion should centralize email communication so the user does not jump between many apps.",
    currentTruth:
      "Not live. Requires OAuth provider integrations, permission scopes, account separation, storage policy and send/read UI.",
    status: "PROVIDER_REQUIRED",
    riskLane: "privacy",
    mustNotClaim: [
      "Do not claim Gmail/Outlook email hub is active until OAuth and provider scopes exist.",
      "Do not read or send email without explicit consent.",
    ],
    nextRealStep:
      "Create provider-required Email Hub shell with Gmail/Outlook OAuth roadmap and clear disabled state.",
  },
  {
    key: "sms_messages_hub",
    title: "SMS / Messages Hub",
    founderRequirement:
      "Pantavion should centralize SMS/messages where legally and technically possible.",
    currentTruth:
      "Not live. Web/PWA cannot promise full SMS access. Mobile app permissions or platform APIs are required.",
    status: "PROVIDER_REQUIRED",
    riskLane: "privacy",
    mustNotClaim: [
      "Do not claim full SMS access from browser/PWA.",
      "Do not claim access to private app messages without official API and consent.",
    ],
    nextRealStep:
      "Create status-labeled Messages Hub shell: mobile-app-required / provider-required.",
  },
  {
    key: "calendar_birthdays_reminders_tasks",
    title: "Calendar / Birthdays / Reminders / Tasks",
    founderRequirement:
      "Pantavion should remember birthdays, appointments, tasks, work, notes and reminders so the user does not need 100 apps.",
    currentTruth:
      "Not fully live. Local-first notes/reminders can be implemented first; provider calendar sync requires OAuth.",
    status: "DATABASE_REQUIRED",
    riskLane: "privacy",
    mustNotClaim: [
      "Do not claim calendar sync until Google/Outlook/Apple calendar provider integration exists.",
      "Do not claim reliable notifications until notification permissions and reminder engine exist.",
    ],
    nextRealStep:
      "Build local-first Notes/Tasks/Birthdays MVP, then provider calendar sync.",
  },
  {
    key: "public_panta_ai",
    title: "Public PantaAI",
    founderRequirement:
      "The world should see a public AI that can answer about Pantavion, communication, translation, safety, work and learning.",
    currentTruth:
      "PantaAI doctrine exists, but public provider-connected AI route/page must be verified before claiming live AI.",
    status: "PROVIDER_REQUIRED",
    riskLane: "general",
    mustNotClaim: [
      "Do not claim public AI works without provider key/route/page proof.",
      "Do not make medical/legal/financial/emergency authority claims.",
    ],
    nextRealStep:
      "Add or verify public PantaAI route with provider-required state and safe response boundaries.",
  },
  {
    key: "personal_panta_ai_per_user",
    title: "Personal PantaAI Per User",
    founderRequirement:
      "Each user should have their own AI assistant adapted to age, language, country, role, consent, context and permissions.",
    currentTruth:
      "Not live. Requires auth, user profile, database, memory policy, consent, provider routing and safety rules.",
    status: "DATABASE_REQUIRED",
    riskLane: "privacy",
    mustNotClaim: [
      "Do not claim personal AI per user until auth/database/profile/memory exist.",
      "Do not imply private memory exists without consent and implementation.",
    ],
    nextRealStep:
      "Build user profile/role/memory contract before personal AI.",
  },
  {
    key: "internal_guardian_ai_workforce",
    title: "Internal Guardian AI / AI Workforce",
    founderRequirement:
      "Internal AI assistants should detect gaps, fix mistakes, audit language, dead buttons, unsafe SOS claims, missing modules and product truth.",
    currentTruth:
      "Not autonomous yet. Current reality is manual audits and scripts. Needs agent registry, scheduler/runner, repo access, permissions and founder approval workflow.",
    status: "MISSING_IMPLEMENTATION",
    riskLane: "legal_boundary",
    mustNotClaim: [
      "Do not claim AI agents are already working autonomously.",
      "Do not allow production self-modification without founder approval.",
    ],
    nextRealStep:
      "Implement Guardian AI registry and read-only audit runner before any auto-patch behavior.",
  },
  {
    key: "communication_universe",
    title: "Pantavion Communication Universe",
    founderRequirement:
      "Pantavion must include its own channels: chat, groups, channels, pulse, stories, shorts, media, live, people, family, work, elite and 18+ dating/relationships with equality for all.",
    currentTruth:
      "Mostly not live. Requires backend, auth, storage, moderation, age locks, reporting and content policy.",
    status: "DATABASE_REQUIRED",
    riskLane: "minor_safety",
    mustNotClaim: [
      "Do not claim real social/chat/media universe until backend and moderation exist.",
      "Do not expose dating/relationships to under-18 users.",
    ],
    nextRealStep:
      "Build communication shell with status labels and age-lock policy before live social features.",
  },
  {
    key: "dating_relationships_18_plus",
    title: "Dating / Relationships 18+",
    founderRequirement:
      "Pantavion should support equality for all adults, including LGBTQ+ users, but adult dating/discovery must be 18+ only.",
    currentTruth:
      "Not live. Requires age verification roadmap, consent, privacy, reporting, jurisdiction checks and strict under-18 lock.",
    status: "LEGAL_CONTRACT_REQUIRED",
    riskLane: "adult_18_plus",
    mustNotClaim: [
      "Do not expose adult dating to minors.",
      "Do not claim age verification exists until implemented.",
    ],
    nextRealStep:
      "Create policy-only status shell first; live feature later after age/legal controls.",
  },
  {
    key: "media_music_movies_video_photo",
    title: "Media / Music / Movies / Video / Photo",
    founderRequirement:
      "Pantavion should include music, movies, video, photos, creator content, live, subtitles and translation.",
    currentTruth:
      "Not live as licensed media platform. Requires upload/storage, moderation, copyright/licensing, AI labeling, age ratings and provider agreements.",
    status: "LEGAL_CONTRACT_REQUIRED",
    riskLane: "copyright_boundary",
    mustNotClaim: [
      "Do not host copyrighted movies/music without rights.",
      "Do not claim streaming library exists without licensing.",
    ],
    nextRealStep:
      "Start with user-owned uploads and public-domain/creator-controlled media policy, not illegal media hosting.",
  },
  {
    key: "seo_public_discovery",
    title: "SEO / Public Discovery / Google Visibility",
    founderRequirement:
      "Pantavion must be visible publicly so Google, Bing, Apple ecosystem users and other platforms can discover and understand it.",
    currentTruth:
      "Site is live, but discoverability/revenue is not guaranteed by being online. Needs SEO pages, metadata, sitemap, structured content, public docs, analytics and growth plan.",
    status: "STATIC_SHELL",
    riskLane: "general",
    mustNotClaim: [
      "Do not claim Google/Apple/MS will promote Pantavion automatically.",
      "Do not claim revenue will start just because the site is online.",
    ],
    nextRealStep:
      "Create public product pages for Interpreter, SOS, PantaAI, Communication Universe, Life Connector Hub and Safety Doctrine with SEO metadata.",
  },
];

export function getPantavionProductTruthItem(key: string) {
  return PANTAVION_PRODUCT_TRUTH_ITEMS.find((item) => item.key === key);
}

export function listPantavionLiveWorkingItems() {
  return PANTAVION_PRODUCT_TRUTH_ITEMS.filter((item) => item.status === "LIVE_WORKING");
}

export function listPantavionMissingOrRequiredItems() {
  return PANTAVION_PRODUCT_TRUTH_ITEMS.filter((item) => item.status !== "LIVE_WORKING");
}

export function summarizePantavionProductTruth() {
  const byStatus = PANTAVION_PRODUCT_TRUTH_ITEMS.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    marker: PANTAVION_PRODUCT_TRUTH_LEDGER_V1.marker,
    total: PANTAVION_PRODUCT_TRUTH_ITEMS.length,
    byStatus,
    liveWorking: listPantavionLiveWorkingItems().length,
    notYetLive: listPantavionMissingOrRequiredItems().length,
  };
}
