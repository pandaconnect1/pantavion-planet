export type PantavionCapabilityStatus =
  | "live"
  | "foundation"
  | "beta"
  | "planned"
  | "legal_provider_required";

export type PantavionCapabilityDomain =
  | "Planet"
  | "Communication"
  | "Social"
  | "Media"
  | "Work"
  | "Knowledge"
  | "Travel"
  | "Safety"
  | "Professional"
  | "AI"
  | "Finance"
  | "Governance"
  | "Future";

export type PantavionUniversalLifeCapability = {
  id: string;
  title: string;
  domain: PantavionCapabilityDomain;
  status: PantavionCapabilityStatus;
  route?: string;
  source: "pantavion-one" | "pantavion-planet" | "merged";
  principle: string;
  realImplementationRequired: string;
  safetyNote?: string;
};

export const PANTAVION_UNIVERSAL_LIFE_CAPABILITIES: PantavionUniversalLifeCapability[] = [
  {
    id: "planet-living-screen",
    title: "Planet / World Living Screen",
    domain: "Planet",
    status: "foundation",
    route: "/",
    source: "merged",
    principle: "The planet in one living screen: one organized global entrance for life, safety, communication, work, knowledge and AI.",
    realImplementationRequired: "Canonical homepage, real navigation, live capability registry, public status clarity and no dead actions."
  },
  {
    id: "countries-cultures",
    title: "Countries, Cultures and Local Worlds",
    domain: "Planet",
    status: "planned",
    source: "pantavion-one",
    principle: "Every country, culture, language and local community must have a place inside Pantavion.",
    realImplementationRequired: "Country/culture registry, localization rules, public routes, source-backed information and moderation."
  },
  {
    id: "messages-chat",
    title: "Messages / Chat",
    domain: "Communication",
    status: "foundation",
    route: "/unified-inbox",
    source: "pantavion-one",
    principle: "Pantavion must include its own communication channels, not depend only on outside social apps.",
    realImplementationRequired: "Authenticated users, conversations, consent rules, storage, abuse controls and notification logic."
  },
  {
    id: "voice-translation",
    title: "Voice Bridge and Live Translation",
    domain: "Communication",
    status: "foundation",
    route: "/translate",
    source: "merged",
    principle: "Real-time multilingual voice, text and subtitle communication across people and services.",
    realImplementationRequired: "Speech recognition, language detection, translation provider, consent, logs policy and fallback UI."
  },
  {
    id: "sos-interpreter",
    title: "SOS Interpreter",
    domain: "Communication",
    status: "beta",
    route: "/sos-interpreter",
    source: "pantavion-planet",
    principle: "Emergency communication must work even when language blocks safety.",
    realImplementationRequired: "Emergency phrases, medical disclaimers, offline preparation, provider checks and user consent."
  },
  {
    id: "video-subtitles",
    title: "Video Calls with Live Subtitles",
    domain: "Communication",
    status: "planned",
    source: "pantavion-one",
    principle: "Video communication should cross language barriers with subtitles and interpretation.",
    realImplementationRequired: "Video provider, captions, translation pipeline, permissions, moderation and recording consent."
  },
  {
    id: "stories",
    title: "Stories",
    domain: "Social",
    status: "planned",
    source: "pantavion-one",
    principle: "Pantavion needs a social expression layer for daily life, culture, community and trusted sharing.",
    realImplementationRequired: "User profiles, media upload, expiration rules, privacy controls, moderation and reporting."
  },
  {
    id: "family-friends",
    title: "Family and Friends",
    domain: "Social",
    status: "planned",
    source: "pantavion-one",
    principle: "Trusted circles must be first-class, especially for elder, child, emergency and care contexts.",
    realImplementationRequired: "Contacts, trusted circles, invitation consent, guardian rules, privacy permissions and emergency roles."
  },
  {
    id: "communities",
    title: "Communities",
    domain: "Social",
    status: "planned",
    source: "pantavion-one",
    principle: "People need organized community spaces by place, interest, language, profession and safety needs.",
    realImplementationRequired: "Community creation, roles, moderation, membership rules, reporting, content ranking and local governance."
  },
  {
    id: "dates-connections",
    title: "Dates / Connections",
    domain: "Social",
    status: "legal_provider_required",
    source: "pantavion-one",
    principle: "Connection and dating surfaces belong to the broader life platform, with equality and safety.",
    realImplementationRequired: "Age gates, identity safety, consent, harassment controls, jurisdiction review and sensitive-content policy.",
    safetyNote: "Must not launch publicly without legal, age, consent and moderation controls."
  },
  {
    id: "contacts-import",
    title: "Contacts and Invite System",
    domain: "Social",
    status: "foundation",
    source: "merged",
    principle: "Growth should use lawful opt-in contacts, invitations and trusted-circle flows without harvesting private data.",
    realImplementationRequired: "Explicit consent, contact import boundaries, invite tracking, opt-out, abuse throttling and privacy notices."
  },
  {
    id: "music",
    title: "Music",
    domain: "Media",
    status: "planned",
    source: "pantavion-one",
    principle: "Pantavion should include cultural and entertainment surfaces, including music discovery and creator expression.",
    realImplementationRequired: "Licensing model, creator uploads, playlists, rights management, takedown process and attribution."
  },
  {
    id: "movies-video",
    title: "Movies / Video",
    domain: "Media",
    status: "planned",
    source: "pantavion-one",
    principle: "Video, film and long-form media belong inside the Pantavion media universe.",
    realImplementationRequired: "Media hosting/provider, copyright controls, age suitability, moderation, transcoding and creator accounts."
  },
  {
    id: "photos-multimedia",
    title: "Photos and Multimedia",
    domain: "Media",
    status: "planned",
    source: "pantavion-one",
    principle: "Users need safe photo, video and multimedia expression connected to identity and communities.",
    realImplementationRequired: "Upload pipeline, content safety checks, metadata/privacy controls, storage, reporting and deletion flows."
  },
  {
    id: "creator-studio",
    title: "Creator / Studio",
    domain: "Media",
    status: "foundation",
    route: "/studio",
    source: "pantavion-planet",
    principle: "Creation tools should become real workflows, not decorative UI.",
    realImplementationRequired: "Project storage, media generation providers, asset management, publishing status and creator safety rules."
  },
  {
    id: "work-business",
    title: "Work / Business",
    domain: "Work",
    status: "foundation",
    route: "/work",
    source: "pantavion-one",
    principle: "Pantavion must include work, services, business presence and professional collaboration.",
    realImplementationRequired: "Profiles, service listings, roles, tasks, verified businesses, messaging and transaction boundaries."
  },
  {
    id: "services-income",
    title: "Services and Income",
    domain: "Work",
    status: "planned",
    source: "merged",
    principle: "Users should be able to learn, work, offer services and earn through governed systems.",
    realImplementationRequired: "Service marketplace, contracts, payments, tax/legal disclaimers, dispute handling and fraud checks."
  },
  {
    id: "marketplace",
    title: "Marketplace / Classifieds",
    domain: "Work",
    status: "planned",
    source: "pantavion-one",
    principle: "Classifieds and lawful marketplace activity belong in a separated professional/commercial layer.",
    realImplementationRequired: "Categories, posting rules, moderation, prohibited-items policy, local legal checks and reporting."
  },
  {
    id: "education",
    title: "Education",
    domain: "Knowledge",
    status: "planned",
    source: "pantavion-one",
    principle: "Education should connect languages, cultures, AI, work and life skills.",
    realImplementationRequired: "Courses, learning paths, progress state, sources, moderation, child-safety controls and certification logic."
  },
  {
    id: "academy",
    title: "Academy",
    domain: "Knowledge",
    status: "planned",
    source: "pantavion-one",
    principle: "Pantavion Academy should turn learning into capability, work and safe income paths.",
    realImplementationRequired: "Curriculum registry, lessons, progress, quizzes, credentials, income-claim safety and review workflow."
  },
  {
    id: "research",
    title: "Research",
    domain: "Knowledge",
    status: "planned",
    source: "pantavion-one",
    principle: "Research needs source reliability, citations, licensing tiers and memory.",
    realImplementationRequired: "Source atlas, citations, reliability scoring, licensing labels, saved research and audit trails."
  },
  {
    id: "news-newspaper",
    title: "News / Newspaper",
    domain: "Knowledge",
    status: "foundation",
    route: "/newspaper",
    source: "pantavion-one",
    principle: "Pantavion needs a governed information layer, not uncontrolled misinformation feeds.",
    realImplementationRequired: "Sources, editorial labels, fact-checking workflow, local pages, moderation and corrections policy."
  },
  {
    id: "culture",
    title: "Culture",
    domain: "Knowledge",
    status: "planned",
    source: "pantavion-one",
    principle: "Culture is central to global unity and must be treated as a first-class platform layer.",
    realImplementationRequired: "Culture pages, language support, community submissions, source review and respectful moderation."
  },
  {
    id: "sports",
    title: "Sports",
    domain: "Knowledge",
    status: "planned",
    source: "pantavion-one",
    principle: "Sports connect communities and countries and should be organized in a safe information layer.",
    realImplementationRequired: "Sports registry, schedules/providers, local clubs, fan communities and moderation."
  },
  {
    id: "tourism",
    title: "Tourism",
    domain: "Travel",
    status: "planned",
    source: "pantavion-one",
    principle: "Tourism should connect translation, local culture, safety and services.",
    realImplementationRequired: "Destination pages, provider integrations, safety guidance, translation support and local business listings."
  },
  {
    id: "flights-travel",
    title: "Flights / Travel",
    domain: "Travel",
    status: "planned",
    source: "pantavion-one",
    principle: "Travel belongs in the global life platform as guidance, communication and safety support.",
    realImplementationRequired: "Provider integrations, itinerary state, alerts, translation, emergency contacts and travel disclaimers."
  },
  {
    id: "shipping-marine",
    title: "Shipping / Marine",
    domain: "Travel",
    status: "planned",
    source: "pantavion-one",
    principle: "Marine and shipping contexts are important for Greece, global work and safety.",
    realImplementationRequired: "Marine registry, compliance boundaries, provider data, safety rules and professional access layers."
  },
  {
    id: "sos",
    title: "SOS Safety",
    domain: "Safety",
    status: "beta",
    route: "/sos",
    source: "pantavion-planet",
    principle: "SOS is a life-protection mechanism, not a casual feature.",
    realImplementationRequired: "Trusted contacts, consent, emergency flow, offline pack, audit loendar-reminders",
    title: "Calendar / Reminders",
    domain: "Safety",
    status: "planned",
    source: "pantavion-one",
    principle: "Life organization, reminders and care routines belong in the universal life center.",
    realImplementationRequired: "User accounts, reminders, notifications, consent, recurring tasks and privacy controls."
  },
  {
    id: "professional-infrastructure",
    title: "Professional Infrastructure",
    domain: "Professional",
    status: "foundation",
    route: "/professional/infrastructure",
    source: "pantavion-planet",
    principle: "Pantavion includes protected professional infrastructure systems, not only social/AI screens.",
    realImplementationRequired: "Identity, access control, audit logs, protected data vaults, admin approval and field workflows."
  },
  {
    id: "water-infrastructure",
    title: "Water Infrastructure",
    domain: "Professional",
    status: "beta",
    route: "/professional/infrastructure/water",
    source: "pantavion-planet",
    principle: "Water infrastructure is protected engineering data with founder/admin control.",
    realImplementationRequired: "Protected map access, private source vault, audit trail, field assistant, approvals and no public raw data."
  },
  {
    id: "panta-ai",
    title: "PantaAI Center",
    domain: "AI",
    status: "foundation",
    route: "/panta-ai",
    source: "pantavion-planet",
    principle: "PantaAI is the execution, intelligence and orchestration center of Pantavion.",
    realImplementationRequired: "Provider registry, routing, memory, agent permissions, cost controls, audits and founder approval gates."
  },
  {
    id: "ai-sovereignty",
    title: "AI Sovereignty / Guardian Kernel",
    domain: "AI",
    status: "foundation",
    route: "/sovereignty",
    source: "pantavion-planet",
    principle: "Pantavion needs a sovereign kernel that observes, audits, proposes and safely improves the ecosystem.",
    realImplementationRequired: "Runtime monitoring, build gates, risk checks, memory, patch approval and deployment audit."
  },
  {
    id: "economy-banks",
    title: "Economy / Banks",
    domain: "Finance",
    status: "legal_provider_required",
    source: "pantavion-one",
    principle: "Finance information and economic context belong in the business layer with strict compliance.",
    realImplementationRequired: "Licensed data providers, disclaimers, no investment guarantees, user suitability and regulatory review.",
    safetyNote: "No banking/trading/financial advice launch without compliance controls."
  },
  {
    id: "environment",
    title: "Environment",
    domain: "Governance",
    status: "planned",
    source: "pantavion-one",
    principle: "Environmental knowledge and local/global signals belong in the planetary screen.",
    realImplementationRequired: "Source-backed data, local reports, moderation, map layers and public/private data boundaries."
  },
  {
    id: "politics",
    title: "Politics",
    domain: "Governance",
    status: "legal_provider_required",
    source: "pantavion-one",
    principle: "Politics can be represented only with neutrality, source labels and strong moderation.",
    realImplementationRequired: "Jurisdiction review, misinformation controls, source labeling, civic-safety rules and abuse prevention."
  },
  {
    id: "faith-religions",
    title: "Faith and Religions",
    domain: "Governance",
    status: "planned",
    source: "pantavion-one",
    principle: "Faith and religions require respectful cultural representation and safety controls.",
    realImplementationRequired: "Community rules, respectful taxonomy, moderation, reporting and interfaith safety boundaries."
  },
  {
    id: "vr-ar",
    title: "VR / AR",
    domain: "Future",
    status: "planned",
    source: "pantavion-one",
    principle: "Future immersive layers can extend Pantavion into spatial communication, education and culture.",
    realImplementationRequired: "Device/provider strategy, accessibility, age safety, content moderation and cost controls."
  },
  {
    id: "elite",
    title: "Pantavion Elite",
    domain: "Future",
    status: "planned",
    source: "merged",
    principle: "Elite should be a premium, clean, ad-free, professional and trusted society layer.",
    realImplementationRequired: "Membership, identity, pricing, benefits, moderation, professional verification and privacy rules."
  }
  {
    id: "health",
    title: "Health",
    domain: "Safety",
    status: "legal_provider_required",
    source: "pantavion-one",
    principle: "Health belongs inside Pantavion as a protected care, support and safety layer, not as fake medical authority.",
    realImplementationRequired: "Medical disclaimers, risk triage, professional-care escalation, provider review, user consent, audit logs and no diagnosis claims.",
    safetyNote: "Health must stay safety-limited until medical/legal governance and provider controls are complete."
  },
  {
    id: "support-care",
    title: "Support and Care",
    domain: "Safety",
    status: "foundation",
    route: "/sos/elder",
    source: "merged",
    principle: "Support and Care covers elder, child, vulnerable, disabled, special-needs and everyday help flows inside Pantavion.",
    realImplementationRequired: "Trusted contacts, guardian rules, elder mode, care history, privacy controls, consent, escalation boundaries and language assistance."
  },
];

export const PANTAVION_CAPABILITY_DOMAIN_ORDER: PantavionCapabilityDomain[] = [
  "Planet",
  "Communication",
  "Social",
  "Media",
  "Work",
  "Knowledge",
  "Travel",
  "Safety",
  "Professional",
  "AI",
  "Finance",
  "Governance",
  "Future"
  {
    id: "health",
    title: "Health",
    domain: "Safety",
    status: "legal_provider_required",
    source: "pantavion-one",
    principle: "Health belongs inside Pantavion as a protected care, support and safety layer, not as fake medical authority.",
    realImplementationRequired: "Medical disclaimers, risk triage, professional-care escalation, provider review, user consent, audit logs and no diagnosis claims.",
    safetyNote: "Health must stay safety-limited until medical/legal governance and provider controls are complete."
  },
  {
    id: "support-care",
    title: "Support and Care",
    domain: "Safety",
    status: "foundation",
    route: "/sos/elder",
    source: "merged",
    principle: "Support and Care covers elder, child, vulnerable, disabled, special-needs and everyday help flows inside Pantavion.",
    realImplementationRequired: "Trusted contacts, guardian rules, elder mode, care history, privacy controls, consent, escalation boundaries and language assistance."
  },
];

export const PANTAVION_CAPABILITY_STATUS_ORDER: PantavionCapabilityStatus[] = [
  "live",
  "beta",
  "foundation",
  "planned",
  "legal_provider_required"
  {
    id: "health",
    title: "Health",
    domain: "Safety",
    status: "legal_provider_required",
    source: "pantavion-one",
    principle: "Health belongs inside Pantavion as a protected care, support and safety layer, not as fake medical authority.",
    realImplementationRequired: "Medical disclaimers, risk triage, professional-care escalation, provider review, user consent, audit logs and no diagnosis claims.",
    safetyNote: "Health must stay safety-limited until medical/legal governance and provider controls are complete."
  },
  {
    id: "support-care",
    title: "Support and Care",
    domain: "Safety",
    status: "foundation",
    route: "/sos/elder",
    source: "merged",
    principle: "Support and Care covers elder, child, vulnerable, disabled, special-needs and everyday help flows inside Pantavion.",
    realImplementationRequired: "Trusted contacts, guardian rules, elder mode, care history, privacy controls, consent, escalation boundaries and language assistance."
  },
];

export function getPantavionUniversalLifeCapability(id: string) {
  return PANTAVION_UNIVERSAL_LIFE_CAPABILITIES.find((capability) => capability.id === id);
}

export function getPantavionUniversalLifeCapabilitiesByDomain(domain: PantavionCapabilityDomain) {
  return PANTAVION_UNIVERSAL_LIFE_CAPABILITIES.filter(
    (capability) => capability.domain === domain
  );
}

export function getPantavionUniversalLifeCapabilitiesByStatus(status: PantavionCapabilityStatus) {
  return PANTAVION_UNIVERSAL_LIFE_CAPABILITIES.filter(
    (capability) => capability.status === status
  );
}

export const pantavionUniversalLifeStats = {
  total: PANTAVION_UNIVERSAL_LIFE_CAPABILITIES.length,
  live: getPantavionUniversalLifeCapabilitiesByStatus("live").length,
  beta: getPantavionUniversalLifeCapabilitiesByStatus("beta").length,
  foundation: getPantavionUniversalLifeCapabilitiesByStatus("foundation").length,
  planned: getPantavionUniversalLifeCapabilitiesByStatus("planned").length,
  legalProviderRequired: getPantavionUniversalLifeCapabilitiesByStatus("legal_provider_required").length
};

