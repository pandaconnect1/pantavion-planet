export type SosCompetitiveCategory =
  | "satellite-sos"
  | "family-safety"
  | "dispatch-provider"
  | "device-safety"
  | "location"
  | "communication"
  | "translation"
  | "ai-companion"
  | "elder-care";

export type SosCompetitiveReadiness =
  | "implement-now"
  | "ready-next"
  | "blocked-provider"
  | "blocked-infrastructure"
  | "blocked-legal"
  | "blocked-cost";

export type SosCompetitiveSynthesisItem = {
  id: string;
  externalPatternName: string;
  referenceExamples: string[];
  category: SosCompetitiveCategory;
  readiness: SosCompetitiveReadiness;
  whatTheySolve: string;
  legalPatternToAbsorb: string[];
  whatPantavionMustNotCopy: string[];
  theirLimitsOrGaps: string[];
  pantavionOpportunity: string;
  implementNowActions: string[];
  blockedUntil: string[];
  nextPantavionAction: string;
};

export const PANTAVION_COMPETITIVE_SYNTHESIS_REMINDER =
  "Pantavion absorbs legal patterns, not brands, logos, code, UI, patents, private systems or unsupported emergency claims. Anything not possible today stays in ledger with reason, cost, risk and unlock condition.";

export const pantavionLegalAbsorptionRules = [
  "Absorb user needs, safety patterns, workflows and architectural lessons.",
  "Do not copy brand names as Pantavion features.",
  "Do not copy logos, UI, text, code, rankings, screenshots or protected claims.",
  "Do not claim official dispatch, satellite rescue, medical diagnosis or 24/7 monitoring without provider/legal/infrastructure.",
  "Translate every external pattern into a Pantavion-owned capability with safety, consent, cost and legal boundaries.",
  "Track every blocked capability in the SOS gap ledger until provider, legal, infrastructure and revenue conditions exist."
] as const;

export const pantavionSosCompetitiveSynthesis: SosCompetitiveSynthesisItem[] = [
  {
    id: "apple-emergency-satellite-pattern",
    externalPatternName: "Device satellite emergency readiness",
    referenceExamples: ["Apple Emergency SOS via Satellite style pattern"],
    category: "satellite-sos",
    readiness: "implement-now",
    whatTheySolve:
      "Emergency communication when normal cellular or Wi-Fi is unavailable, but only with supported device, region and conditions.",
    legalPatternToAbsorb: [
      "satellite-aware mode",
      "clear device/network limitations",
      "off-grid emergency instructions",
      "prebuilt emergency profile",
      "guided low-signal SOS flow"
    ],
    whatPantavionMustNotCopy: [
      "Apple UI",
      "Apple wording",
      "satellite rescue claims",
      "hardware-level capability claims",
      "country coverage claims"
    ],
    theirLimitsOrGaps: [
      "device-specific",
      "country/region-specific",
      "requires sky visibility and supported hardware",
      "not a universal cross-platform human safety layer"
    ],
    pantavionOpportunity:
      "Pantavion can become the cross-device emergency readiness layer: trusted contacts, language, SOS packet, offline identity pack and future certified satellite/provider integrations.",
    implementNowActions: [
      "keep satellite-aware wording",
      "store off-grid identity pack locally",
      "show no-signal guidance",
      "track satellite provider as blocked until agreement"
    ],
    blockedUntil: [
      "certified satellite or mobile-operator provider",
      "supported hardware path",
      "country legal review",
      "response/escalation agreement"
    ],
    nextPantavionAction:
      "Keep Pantavion honest: works over available internet now, stores offline packet locally, and does not claim satellite rescue."
  },
  {
    id: "garmin-inreach-response-pattern",
    externalPatternName: "Dedicated satellite communicator and response-center model",
    referenceExamples: ["Garmin inReach / Garmin Response style pattern"],
    category: "satellite-sos",
    readiness: "blocked-provider",
    whatTheySolve:
      "Remote-area SOS with dedicated satellite device, subscription and response coordination.",
    legalPatternToAbsorb: [
      "SOS incident timeline",
      "two-way emergency status",
      "medical/contact profile",
      "response coordination model",
      "device/service limitation clarity"
    ],
    whatPantavionMustNotCopy: [
      "Garmin device claims",
      "Garmin Response claims",
      "24/7 rescue center claim",
      "satellite-device feature claim without hardware/provider"
    ],
    theirLimitsOrGaps: [
      "requires device",
      "requires subscription",
      "not a general social/language/family/AI ecosystem",
      "not browser-first for every user"
    ],
    pantavionOpportunity:
      "Pantavion can be the software readiness and family/language layer, then integrate with hardware providers later.",
    implementNowActions: [
      "track response-center integration as blocked",
      "design incident timeline",
      "keep medical/contact SOS packet fields",
      "prepare future provider adapter interface"
    ],
    blockedUntil: [
      "hardware/provider agreement",
      "subscription/business model",
      "insurance/legal review",
      "official emergency response partner"
    ],
    nextPantavionAction:
      "Add response-center pattern to future provider roadmap, not public rescue claims."
  },
  {
    id: "life360-family-safety-pattern",
    externalPatternName: "Family circle, trusted contacts and safety check model",
    referenceExamples: ["Life360 style family safety pattern"],
    category: "family-safety",
    readiness: "ready-next",
    whatTheySolve:
      "Family visibility, emergency contacts, SOS alerts, safety checks and circle-based support.",
    legalPatternToAbsorb: [
      "Emergency Circle",
      "trusted contact invite/accept",
      "cancel countdown",
      "practice SOS",
      "family safety check",
      "acknowledgement that someone saw the alert"
    ],
    whatPantavionMustNotCopy: [
      "Life360 UI",
      "Life360 plan claims",
      "dispatch claims not available to Pantavion",
      "always-on surveillance positioning"
    ],
    theirLimitsOrGaps: [
      "can feel location-surveillance heavy",
      "less focused on multilingual elderly support",
      "less focused on AI companionship and life memory",
      "less integrated with global language/social/work ecosystem"
    ],
    pantavionOpportunity:
      "Pantavion can create a consent-first Emergency Circle for elders, minors and vulnerable users without making the whole platform feel like surveillance.",
    implementNowActions: [
      "keep trusted contacts first",
      "add local Safety Check route later",
      "track verified invite/accept as account-dependent",
      "add practice SOS to future UX"
    ],
    blockedUntil: [
      "real accounts",
      "database",
      "push/SMS/email provider",
      "guardian/minor consent rules"
    ],
    nextPantavionAction:
      "Implement local-first Emergency Circle improvements before verified account-based invites."
  },
  {
    id: "noonlight-dispatch-api-pattern",
    externalPatternName: "Certified dispatch provider and human verification model",
    referenceExamples: ["Noonlight style dispatch API / monitoring-center pattern"],
    category: "dispatch-provider",
    readiness: "blocked-provider",
    whatTheySolve:
      "Emergency escalation through authorized agents, incident verification and dispatch workflows where legally supported.",
    legalPatternToAbsorb: [
      "human verification before authority escalation",
      "false alarm reduction",
      "incident timeline",
      "operator handoff",
      "provider adapter model",
      "country-specific coverage"
    ],
    whatPantavionMustNotCopy: [
      "dispatch API claim without contract",
      "official responder claim",
      "monitoring center claim",
      "24/7 human operator claim"
    ],
    theirLimitsOrGaps: [
      "provider/infrastructure layer rather than full human platform",
      "requires coverage by country/partner",
      "business/enterprise integration path",
      "not a complete multilingual family/AI/social layer"
    ],
    pantavionOpportunity:
      "Pantavion can become the user-facing global safety operating layer and later connect certified dispatch providers per country.",
    implementNowActions: [
      "track dispatch as blocked",
      "keep no-authority-dispatch copy",
      "design future dispatch adapter",
      "require founder/legal approval before activation"
    ],
    blockedUntil: [
      "company/legal entity",
      "provider contract",
      "insurance/liability review",
      "country legal review",
      "human incident process"
    ],
    nextPantavionAction:
      "Do not expose official dispatch; keep Institution Gateway as future provider path."
  },
  {
    id: "google-personal-safety-pattern",
    externalPatternName: "Device personal safety, emergency info and safety check model",
    referenceExamples: ["Google Pixel / Android Personal Safety style pattern"],
    category: "device-safety",
    readiness: "ready-next",
    whatTheySolve:
      "Emergency info, emergency sharing, safety check and device-assisted alerts.",
    legalPatternToAbsorb: [
      "emergency information card",
      "safety check timer",
      "emergency sharing",
      "device-permission clarity",
      "future crash/fall detection roadmap"
    ],
    whatPantavionMustNotCopy: [
      "Google/Pixel UI",
      "device-specific claims",
      "automatic crash detection claim without native device integration"
    ],
    theirLimitsOrGaps: [
      "device/platform-specific",
      "not Pantavion-wide social/language/AI ecosystem",
      "native features may not exist in browser"
    ],
    pantavionOpportunity:
      "Pantavion can implement the web/PWA readiness version now and track native crash/fall/background location as future.",
    implementNowActions: [
      "add safety check to SOS roadmap",
      "keep emergency profile simple",
      "track native device capabilities as future",
      "do not claim background detection in web"
    ],
    blockedUntil: [
      "native iOS/Android app",
      "sensor permissions",
      "battery/background policy",
      "app store review",
      "legal safety policy"
    ],
    nextPantavionAction:
      "Build local Safety Check before native sensor automation."
  },
  {
    id: "what3words-location-pattern",
    externalPatternName: "Precise location packet and address-less rescue support",
    referenceExamples: ["what3words style precise location pattern"],
    category: "location",
    readiness: "implement-now",
    whatTheySolve:
      "Communicating precise location where normal addresses are weak or missing.",
    legalPatternToAbsorb: [
      "multi-format location packet",
      "GPS coordinate display",
      "map link",
      "offline display of location",
      "future precise-location adapter"
    ],
    whatPantavionMustNotCopy: [
      "what3words word system",
      "brand name as a Pantavion feature",
      "licensed API behavior without terms review"
    ],
    theirLimitsOrGaps: [
      "location layer only",
      "not a full SOS/family/AI/emergency platform",
      "requires user/device location permission"
    ],
    pantavionOpportunity:
      "Pantavion can combine location with identity, medical notes, trusted contacts, language and SOS evidence.",
    implementNowActions: [
      "keep GPS/map link in SOS packet",
      "add fallback when permission denied",
      "track future precise-location adapter"
    ],
    blockedUntil: [
      "provider terms review for advanced adapters",
      "location permission UX",
      "country/privacy review if stored centrally"
    ],
    nextPantavionAction:
      "Improve SOS packet location display before adding third-party location provider."
  },
  {
    id: "starlink-connectivity-pattern",
    externalPatternName: "Remote internet connectivity over satellite-backed networks",
    referenceExamples: ["Starlink / satellite internet / direct-to-cell style connectivity pattern"],
    category: "satellite-sos",
    readiness: "blocked-provider",
    whatTheySolve:
      "Internet access in remote, maritime, disaster or weak-network environments where supported.",
    legalPatternToAbsorb: [
      "connection-aware state",
      "online / weak / offline / satellite-supported modes",
      "maritime and remote-area infrastructure roadmap",
      "provider-specific limitation clarity"
    ],
    whatPantavionMustNotCopy: [
      "network coverage claims",
      "satellite emergency-service claim",
      "Starlink branding as Pantavion capability",
      "guarantees of connectivity"
    ],
    theirLimitsOrGaps: [
      "connectivity is not the same as emergency dispatch",
      "requires hardware/service/region support",
      "can be expensive for maritime/institution use"
    ],
    pantavionOpportunity:
      "Pantavion can run over any available internet and later offer institution/maritime safety layers where connectivity exists.",
    implementNowActions: [
      "keep connection-aware doctrine",
      "build offline queue",
      "do not claim provider coverage",
      "track maritime/institution connectivity as future business layer"
    ],
    blockedUntil: [
      "connectivity/provider agreement",
      "hardware/service path",
      "institution/business pricing",
      "legal and liability review"
    ],
    nextPantavionAction:
      "Treat satellite internet as connectivity, not emergency dispatch."
  },
  {
    id: "secure-messaging-emergency-channel-pattern",
    externalPatternName: "Messaging app emergency channel pattern",
    referenceExamples: ["WhatsApp", "Viber", "Signal", "Telegram style communication patterns"],
    category: "communication",
    readiness: "blocked-infrastructure",
    whatTheySolve:
      "Fast user-to-user communication through messages, calls, media and groups.",
    legalPatternToAbsorb: [
      "Pantavion-to-Pantavion emergency channel",
      "read receipts",
      "voice/video incident room",
      "family group escalation",
      "message status",
      "fallback to SMS/email when not online"
    ],
    whatPantavionMustNotCopy: [
      "app UI",
      "encryption claims unless implemented",
      "brand names",
      "network effect claims",
      "automatic access to third-party apps"
    ],
    theirLimitsOrGaps: [
      "not SOS-specific by default",
      "may not integrate emergency profile/language/AI",
      "third-party apps cannot be controlled by Pantavion",
      "requires both sides to be reachable"
    ],
    pantavionOpportunity:
      "Pantavion can build its own emergency-first communication channel with SMS/email/push fallback and multilingual SOS context.",
    implementNowActions: [
      "track Pantavion emergency channel as future",
      "keep browser share/SMS/email now",
      "prepare account-based messaging schema later"
    ],
    blockedUntil: [
      "real accounts",
      "database",
      "realtime server",
      "push provider",
      "abuse moderation",
      "encryption/privacy design"
    ],
    nextPantavionAction:
      "Do not promise third-party app automation; build Pantavion-controlled channels first."
  },
  {
    id: "live-translation-care-pattern",
    externalPatternName: "Live interpreter and care communication pattern",
    referenceExamples: ["speech translation apps", "medical interpreter workflows", "care communication tools"],
    category: "translation",
    readiness: "ready-next",
    whatTheySolve:
      "Two people can communicate when they do not share a language.",
    legalPatternToAbsorb: [
      "speech-to-speech translation",
      "text fallback",
      "large readable captions",
      "language auto-detect",
      "care/home/hospital/taxi/service scenarios"
    ],
    whatPantavionMustNotCopy: [
      "medical interpreter certification claim",
      "perfect translation claim",
      "provider UI",
      "provider model claims"
    ],
    theirLimitsOrGaps: [
      "translation is not legal/medical certainty",
      "may not integrate SOS profile or family safety",
      "cost and quality vary by provider"
    ],
    pantavionOpportunity:
      "Pantavion can place translation next to SOS and AI companion as an elder-first orange zone with no access to private green history.",
    implementNowActions: [
      "define orange zone as live translation/help",
      "keep no-private-history-access rule",
      "add simple readable UI first"
    ],
    blockedUntil: [
      "AI/translation provider router",
      "audio permission flow",
      "cost control",
      "language QA"
    ],
    nextPantavionAction:
      "Implement orange UI contract before paid live translation provider."
  },
  {
    id: "ai-companion-life-journal-pattern",
    externalPatternName: "AI companion, life journal and wellbeing support pattern",
    referenceExamples: ["voice assistant", "AI companion", "digital journal and memory patterns"],
    category: "ai-companion",
    readiness: "ready-next",
    whatTheySolve:
      "Loneliness, daily conversation, memory, journaling, reminders and emotional support.",
    legalPatternToAbsorb: [
      "one-tap natural conversation",
      "voice plus text",
      "dated transcript",
      "optional audio recording",
      "life-story journal",
      "important concern markers",
      "family sharing by consent only"
    ],
    whatPantavionMustNotCopy: [
      "doctor claim",
      "therapy claim without clinical governance",
      "diagnosis claim",
      "caregiver automatic access",
      "unsafe dependency language"
    ],
    theirLimitsOrGaps: [
      "may ignore elder-specific safety",
      "may lack family consent model",
      "may not connect to SOS when danger appears",
      "may not handle multilingual care context"
    ],
    pantavionOpportunity:
      "Pantavion can create a green elder AI companion that is local-first, consent-first, voice-first and connected to SOS safety boundaries.",
    implementNowActions: [
      "keep green AI companion in ledger",
      "store voice/text/date/time requirement",
      "block caregiver auto-access",
      "avoid doctor/diagnosis wording"
    ],
    blockedUntil: [
      "PantaAI voice/text layer",
      "local/session storage design",
      "consent controls",
      "future cloud sync",
      "AI safety policy"
    ],
    nextPantavionAction:
      "Create red/orange/green elder mode spec and then build static UI route."
  }
];

export function getImplementableSosCompetitivePatternsNow() {
  return pantavionSosCompetitiveSynthesis.filter(
    (item) => item.readiness === "implement-now" || item.readiness === "ready-next"
  );
}

export function getBlockedSosCompetitivePatterns() {
  return pantavionSosCompetitiveSynthesis.filter(
    (item) =>
      item.readiness === "blocked-provider" ||
      item.readiness === "blocked-infrastructure" ||
      item.readiness === "blocked-legal" ||
      item.readiness === "blocked-cost"
  );
}

export function getPantavionOwnedSosOpportunitySummary() {
  return {
    summary:
      "Pantavion can legally synthesize satellite-aware readiness, family safety, dispatch-provider pathways, device safety, precise location, emergency communication, live translation and AI companionship into a Pantavion-owned global safety ecosystem.",
    mustNotClaim:
      "Pantavion must not claim official dispatch, satellite rescue, diagnosis, medical replacement, 24/7 response center or automatic third-party app control until those capabilities are actually implemented with providers, legal review and infrastructure.",
    bestPossibleNow:
      "Build the red/orange/green elder-safe mode, local trusted contacts, SOS packet, translation/help UI, AI companion memory contract, SMS/email readiness and strict audit guardrails."
  } as const;
}
