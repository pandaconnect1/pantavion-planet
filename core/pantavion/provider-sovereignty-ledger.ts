export type PantavionProviderCategory =
  | "ai_model"
  | "hosting"
  | "database"
  | "storage"
  | "email"
  | "sms"
  | "maps"
  | "analytics"
  | "payments"
  | "translation"
  | "communication"
  | "security"
  | "search"
  | "media";

export type PantavionProviderStatus =
  | "pantavion_owned"
  | "allowed_temporary_bridge"
  | "foundation_only"
  | "blocked_until_gate"
  | "banned";

export type PantavionExposureLevel =
  | "never_user_visible"
  | "internal_only"
  | "public_if_disclosed"
  | "not_allowed";

export type PantavionDependencyPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type PantavionProviderDependency = {
  id: string;
  name: string;
  category: PantavionProviderCategory;
  currentStatus: PantavionProviderStatus;
  priority: PantavionDependencyPriority;
  publicName: string;
  currentRole: string;
  sovereigntyTarget: string;
  replacementPath: string[];
  allowedData: string[];
  blockedData: string[];
  exposure: PantavionExposureLevel;
  costPolicy: string;
  legalBoundary: string;
  kernelInstruction: string;
};

export type PantavionOwnedSystemTarget = {
  id: string;
  name: string;
  replaces: PantavionProviderCategory[];
  phase: "now" | "near" | "mid" | "long";
  description: string;
  kernelOwner: string;
};

export const pantavionSovereigntyDoctrine = {
  title: "Pantavion Sovereignty and Provider Independence Doctrine",
  version: "1.0.0",
  supremeRule:
    "Pantavion Kernel is the sovereign brain. Third-party providers are replaceable bridges, never the owner of Pantavion intelligence.",
  publicRule:
    "Users see PantaAI, Pantavion Kernel, Pantavion Intelligence and Pantavion Execution. They do not see OpenAI, Claude, Gemini or other hidden adapters.",
  providerRule:
    "External providers may be used only through controlled adapters, with minimum necessary data, no raw secrets and no permanent strategic dependence.",
  dataFirewallRule:
    "No raw Pantavion memory graph, private source strategy, user private graph, legal secrets, financial strategy or internal architecture is sent to providers.",
  costRule:
    "Every paid third-party dependency must have a reduction path, replacement path or explicit reason why it remains temporarily necessary.",
  claimRule:
    "Pantavion must not publicly claim owned models, owned global infrastructure or certified translation until those systems are actually built and verified.",
  completionRule:
    "The final direction is Pantavion-owned AI, Pantavion-owned communication, Pantavion-owned memory, Pantavion-owned maps, Pantavion-owned analytics and Pantavion-owned execution.",
  forbiddenClaims: [
    "Pantavion already owns frontier AI models.",
    "Pantavion is already independent from all providers.",
    "Pantavion translation is 100% certified perfect.",
    "Pantavion messaging has no infrastructure cost.",
    "Pantavion payment system is live before legal and commercial gates.",
    "Pantavion can guarantee emergency rescue without certified integrations."
  ],
  allowedClaims: [
    "Pantavion Kernel is the sovereign orchestration brain.",
    "Third-party providers are temporary hidden adapters where necessary.",
    "Pantavion is designed for provider independence.",
    "Pantavion is building toward owned AI, owned memory and owned communication.",
    "Pantavion uses legal, consent-based and security-controlled integration boundaries."
  ]
} as const;

export const pantavionProviderDependencies: PantavionProviderDependency[] = [
  {
    id: "ai-frontier-providers",
    name: "OpenAI / Anthropic / Google / other frontier AI providers",
    category: "ai_model",
    currentStatus: "allowed_temporary_bridge",
    priority: "critical",
    publicName: "PantaAI / Pantavion Kernel",
    currentRole:
      "Temporary reasoning, coding, language and multimodal assistance through hidden adapters while Pantavion-owned intelligence is built.",
    sovereigntyTarget:
      "Pantavion-owned model stack, specialist kernels, owned memory, owned datasets, owned evaluation suite and owned inference routing.",
    replacementPath: [
      "Build Pantavion intent parser and planner",
      "Build capability registry and execution verifier",
      "Build owned knowledge graph and memory system",
      "Build internal small specialist models",
      "Build translation and speech models",
      "Build multimodal model lab",
      "Reduce provider use to fallback only"
    ],
    allowedData: [
      "Redacted task context",
      "Non-secret public text",
      "Minimal prompt fragments",
      "Synthetic test examples"
    ],
    blockedData: [
      "Raw user private graph",
      "Pantavion internal strategy secrets",
      "Private source code keys",
      "Financial and banking secrets",
      "Unredacted legal files",
      "Unfiltered personal data",
      "Kernel master instructions"
    ],
    exposure: "never_user_visible",
    costPolicy:
      "Use only when value exceeds cost. Track every provider call. Prefer local logic, cache, small models and owned systems.",
    legalBoundary:
      "No sensitive user data is sent without consent, necessity, minimization and policy review.",
    kernelInstruction:
      "Route through AI Data Firewall. Never expose provider brand as the brain of Pantavion."
  },
  {
    id: "vercel-hosting",
    name: "Vercel",
    category: "hosting",
    currentStatus: "allowed_temporary_bridge",
    priority: "high",
    publicName: "Pantavion Web Infrastructure",
    currentRole:
      "Temporary managed deployment platform for fast web shipping, build verification and public availability.",
    sovereigntyTarget:
      "Multi-cloud and later Pantavion-owned infrastructure with failover, observability and deployment control.",
    replacementPath: [
      "Keep Vercel for early production",
      "Add backup deploy target",
      "Containerize app",
      "Add own VPS or bare-metal staging",
      "Add multi-region failover",
      "Move critical services out of single-provider lock-in"
    ],
    allowedData: [
      "Compiled app build",
      "Public web assets",
      "Non-secret deployment logs"
    ],
    blockedData: [
      "Secrets in repository",
      "Raw private user data in logs",
      "Unencrypted production database dumps"
    ],
    exposure: "internal_only",
    costPolicy:
      "Acceptable early cost. Must not become the only long-term infrastructure path.",
    legalBoundary:
      "Respect hosting terms, data locality needs and security header policy.",
    kernelInstruction:
      "Treat as deployment bridge, not sovereign infrastructure."
  },
  {
    id: "managed-database",
    name: "Managed PostgreSQL / Neo4j / graph storage provider",
    category: "database",
    currentStatus: "allowed_temporary_bridge",
    priority: "critical",
    publicName: "Pantavion Memory and Graph Core",
    currentRole:
      "Temporary managed database layer for user state, graph data, memory, audit and system state.",
    sovereigntyTarget:
      "Pantavion-owned database operations, backups, replication, graph intelligence and restore governance.",
    replacementPath: [
      "Start with managed database",
      "Define schema and migration discipline",
      "Add encrypted backups",
      "Add export and restore tests",
      "Move to self-managed PostgreSQL/Neo4j when capacity and skill exist",
      "Add regional storage policy"
    ],
    allowedData: [
      "Application state under privacy controls",
      "Encrypted user records",
      "Audit events"
    ],
    blockedData: [
      "Unencrypted sensitive data",
      "Secrets mixed with application records",
      "Children data without policy controls"
    ],
    exposure: "internal_only",
    costPolicy:
      "Use managed DB early to avoid collapse. Build migration path to own operations.",
    legalBoundary:
      "Must respect privacy, deletion, retention, jurisdiction and minors rules.",
    kernelInstruction:
      "Memory belongs to Pantavion, not the database vendor."
  },
  {
    id: "email-provider",
    name: "Email delivery provider",
    category: "email",
    currentStatus: "allowed_temporary_bridge",
    priority: "medium",
    publicName: "Pantavion Notices",
    currentRole:
      "Optional delivery bridge for account notices, verification, receipts and critical messages.",
    sovereigntyTarget:
      "Hybrid Pantavion mail system with strong reputation management and fallback providers.",
    replacementPath: [
      "Minimize outbound email",
      "Use provider only for reliability",
      "Build templates and consent rules",
      "Add notification center",
      "Add own mail domain reputation gradually",
      "Keep fallback provider only where deliverability requires"
    ],
    allowedData: [
      "Recipient email",
      "Transactional message content",
      "Delivery status"
    ],
    blockedData: [
      "Full private messages",
      "Contact books without consent",
      "Sensitive medical/legal content unless strictly necessary"
    ],
    exposure: "public_if_disclosed",
    costPolicy:
      "Use sparingly. Prefer in-app notifications once Pantavion communication exists.",
    legalBoundary:
      "Requires consent, unsubscribe where applicable and anti-spam compliance.",
    kernelInstruction:
      "Never use email provider as social messaging backbone."
  },
  {
    id: "sms-provider",
    name: "SMS / phone messaging provider",
    category: "sms",
    currentStatus: "blocked_until_gate",
    priority: "medium",
    publicName: "Pantavion Critical Relay",
    currentRole:
      "Not active by default. May be used only for verification or emergency relay where justified.",
    sovereigntyTarget:
      "Pantavion-owned communication first, SMS only as emergency or verification fallback.",
    replacementPath: [
      "Build Pantavion Messages",
      "Build push notification path",
      "Build emergency contacts relay",
      "Use SMS only when legal, necessary and cost-controlled",
      "Add per-country rules"
    ],
    allowedData: [
      "Phone number when user explicitly gives it",
      "Minimal verification code",
      "Minimal emergency alert"
    ],
    blockedData: [
      "Full chat history",
      "Bulk marketing without consent",
      "Imported phone books without explicit permission"
    ],
    exposure: "public_if_disclosed",
    costPolicy:
      "Expensive. Blocked unless the route is life-critical, verification-critical or legally necessary.",
    legalBoundary:
      "Country rules, consent and emergency disclaimer required.",
    kernelInstruction:
      "Do not turn SMS into normal messaging cost center."
  },
  {
    id: "maps-provider",
    name: "Maps / geocoding provider",
    category: "maps",
    currentStatus: "foundation_only",
    priority: "high",
    publicName: "Pantavion Compass",
    currentRole:
      "Early location and map support. Prefer open-data strategy before paid dependency.",
    sovereigntyTarget:
      "Pantavion Compass with OSM-based tiles, own cached maps, own place graph and future routing intelligence.",
    replacementPath: [
      "Use OpenStreetMap data where suitable",
      "Add own tile server later",
      "Add cached maps for travel and SOS",
      "Build Pantavion place graph",
      "Add own routing and safety overlays",
      "Avoid Google Maps lock-in unless absolutely necessary"
    ],
    allowedData: [
      "Approximate public map queries",
      "Consent-based location",
      "Cached public POI data"
    ],
    blockedData: [
      "Continuous tracking without consent",
      "Children location without protection",
      "Emergency location exposure to unauthorized parties"
    ],
    exposure: "internal_only",
    costPolicy:
      "Minimize paid map calls. Prefer open data and own cache.",
    legalBoundary:
      "Respect OSM license, privacy, emergency and location consent rules.",
    kernelInstruction:
      "Compass must become Pantavion-owned intelligence, not a Google Maps skin."
  },
  {
    id: "analytics-provider",
    name: "Third-party analytics",
    category: "analytics",
    currentStatus: "blocked_until_gate",
    priority: "high",
    publicName: "Pantavion Observability",
    currentRole:
      "Avoid by default. Analytics must be privacy-first and preferably self-hosted.",
    sovereigntyTarget:
      "Pantavion-owned observability, product metrics, audit logs and privacy-safe intelligence.",
    replacementPath: [
      "Use server logs and internal counters",
      "Add privacy-safe event schema",
      "Self-host analytics if needed",
      "Add observability dashboard",
      "Never sell user behavioral data"
    ],
    allowedData: [
      "Anonymous aggregate metrics",
      "Operational health events",
      "Route status"
    ],
    blockedData: [
      "Raw private user behavior sold to third parties",
      "Personal graph data",
      "Children tracking",
      "Sensitive SOS and health signals"
    ],
    exposure: "internal_only",
    costPolicy:
      "Prefer zero paid analytics. Build own observability first.",
    legalBoundary:
      "Privacy, consent, cookie and minors rules must be respected.",
    kernelInstruction:
      "Analytics serves the user and system safety, not surveillance."
  },
  {
    id: "stripe-payments",
    name: "Stripe / payment processor",
    category: "payments",
    currentStatus: "blocked_until_gate",
    priority: "critical",
    publicName: "Pantavion Commercial Gate",
    currentRole:
      "Foundation only. No live charging until legal, refund, tax, subscription and restricted-business gates pass.",
    sovereigntyTarget:
      "Pantavion commercial policy with hosted checkout, transparent billing and no raw card handling.",
    replacementPath: [
      "Build commercial policy",
      "Build pricing and refund terms",
      "Use hosted checkout only",
      "Block marketplace payouts until KYC/KYB model exists",
      "Add invoice and tax responsibility review",
      "Later evaluate multiple processors"
    ],
    allowedData: [
      "Checkout session metadata",
      "Order reference",
      "Payment status",
      "Customer billing email where required"
    ],
    blockedData: [
      "Raw card data",
      "Unapproved adult or restricted payments",
      "Marketplace payouts without KYC/KYB",
      "Hidden fees"
    ],
    exposure: "public_if_disclosed",
    costPolicy:
      "Do not activate live charging before readiness gate.",
    legalBoundary:
      "PCI boundary, refunds, subscription lifecycle, taxes, consumer rights and restricted categories required.",
    kernelInstruction:
      "Stripe is a payment rail, not Pantavion business policy."
  },
  {
    id: "translation-provider",
    name: "External translation provider",
    category: "translation",
    currentStatus: "allowed_temporary_bridge",
    priority: "critical",
    publicName: "Pantavion Interpreter",
    currentRole:
      "Temporary translation assistance while Pantavion builds own glossary, phrase packs, translation memory and interpreter models.",
    sovereigntyTarget:
      "Pantavion-owned interpreter for text, voice, emergency phrases, travel, culture, work and future high-confidence translation.",
    replacementPath: [
      "Build phrase packs",
      "Build emergency phrase library",
      "Build translation memory",
      "Build domain glossaries",
      "Build language detection",
      "Build offline packs",
      "Train or fine-tune own translation models later"
    ],
    allowedData: [
      "Non-sensitive translation snippets",
      "Public travel phrases",
      "Redacted interpreter text"
    ],
    blockedData: [
      "Unredacted medical/legal secrets without consent",
      "Children private data",
      "Sensitive crisis context unless necessary",
      "Claims of certified perfect translation"
    ],
    exposure: "never_user_visible",
    costPolicy:
      "Cache, glossary and phrase packs before paid provider calls.",
    legalBoundary:
      "Translation is assistive unless certified/human-reviewed.",
    kernelInstruction:
      "Never claim 100 percent perfect translation before verified certification."
  },
  {
    id: "communication-media-stack",
    name: "External chat, video, voice and push providers",
    category: "communication",
    currentStatus: "foundation_only",
    priority: "critical",
    publicName: "Pantavion Communication",
    currentRole:
      "Pantavion must build its own communication layer instead of depending on WhatsApp, Viber, Snapchat or similar platforms.",
    sovereigntyTarget:
      "Pantavion-owned messages, groups, calls, video, stories, channels, contacts and media vault.",
    replacementPath: [
      "Build account identity",
      "Build contact consent model",
      "Build messages database",
      "Build media storage",
      "Build groups and channels",
      "Build WebRTC voice/video",
      "Build push notifications",
      "Build abuse and moderation controls"
    ],
    allowedData: [
      "Pantavion-native messages",
      "User-consented contacts",
      "User-owned imported records where lawful"
    ],
    blockedData: [
      "Scraped third-party messages",
      "Collected passwords for third-party apps",
      "Unauthorized contact harvesting",
      "Illegal message import"
    ],
    exposure: "internal_only",
    costPolicy:
      "Communication has real server, storage and bandwidth cost. The goal is owned cost, not fake zero cost.",
    legalBoundary:
      "Imports require consent, official APIs or user-provided exports.",
    kernelInstruction:
      "Build owned communication. Do not promise access to other apps without legal connector paths."
  }
];

export const pantavionOwnedSystemTargets: PantavionOwnedSystemTarget[] = [
  {
    id: "owned-intent-planner",
    name: "Pantavion Intent Planner",
    replaces: ["ai_model"],
    phase: "now",
    description:
      "Deterministic and AI-assisted intent parsing, planning and execution routing owned by Pantavion.",
    kernelOwner: "Prime Kernel"
  },
  {
    id: "owned-capability-registry",
    name: "Pantavion Capability Registry",
    replaces: ["ai_model", "search"],
    phase: "now",
    description:
      "Capability-first system that maps goals to internal and external execution routes without exposing tools first.",
    kernelOwner: "Prime Kernel"
  },
  {
    id: "owned-memory-graph",
    name: "Pantavion Memory and Graph Core",
    replaces: ["database", "storage", "ai_model"],
    phase: "near",
    description:
      "Owned long-term memory, graph intelligence, profile state and continuity layer.",
    kernelOwner: "Memory Kernel"
  },
  {
    id: "owned-translation-core",
    name: "Pantavion Interpreter Core",
    replaces: ["translation", "ai_model"],
    phase: "near",
    description:
      "Glossaries, phrase packs, confidence scoring, emergency/travel language packs and later owned translation models.",
    kernelOwner: "Translation Kernel"
  },
  {
    id: "owned-communication-core",
    name: "Pantavion Communication Core",
    replaces: ["communication", "email", "sms", "media"],
    phase: "mid",
    description:
      "Owned messaging, groups, channels, calls, video, stories, contacts and notifications.",
    kernelOwner: "Communication Kernel"
  },
  {
    id: "owned-compass-maps",
    name: "Pantavion Compass Maps",
    replaces: ["maps"],
    phase: "mid",
    description:
      "Open-data-first maps, cached tiles, place graph, navigation and emergency geospatial intelligence.",
    kernelOwner: "Compass Kernel"
  },
  {
    id: "owned-observability",
    name: "Pantavion Observability",
    replaces: ["analytics", "security"],
    phase: "now",
    description:
      "Privacy-safe analytics, audit logs, route health, deployment status and system monitoring.",
    kernelOwner: "Security and Resilience Kernel"
  },
  {
    id: "owned-model-lab",
    name: "Pantavion Model Lab",
    replaces: ["ai_model", "translation", "media"],
    phase: "long",
    description:
      "Long-term training, fine-tuning, evaluation and deployment of Pantavion-owned specialist models.",
    kernelOwner: "Research and Build Kernel"
  }
];

export function getPantavionSovereigntyCounts(
  dependencies: PantavionProviderDependency[] = pantavionProviderDependencies
) {
  return dependencies.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.currentStatus] += 1;
      return acc;
    },
    {
      total: 0,
      pantavion_owned: 0,
      allowed_temporary_bridge: 0,
      foundation_only: 0,
      blocked_until_gate: 0,
      banned: 0
    } as Record<PantavionProviderStatus, number> & { total: number }
  );
}

export function getPantavionBlockedProviders() {
  return pantavionProviderDependencies.filter(
    (item) => item.currentStatus === "blocked_until_gate" || item.currentStatus === "banned"
  );
}

export function getPantavionCriticalProviderRisks() {
  return pantavionProviderDependencies.filter(
    (item) => item.priority === "critical"
  );
}

export function getPantavionNearOwnedTargets() {
  return pantavionOwnedSystemTargets.filter(
    (item) => item.phase === "now" || item.phase === "near"
  );
}
