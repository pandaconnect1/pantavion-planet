// PASTE THIS FILE ONLY INTO:
// scripts/install-pantavion-intelligence-fabric.cjs

const fs = require("fs");
const path = require("path");

const root = process.cwd();

function assertRepoRoot() {
  const packagePath = path.join(root, "package.json");
  const appPath = path.join(root, "app");

  if (!fs.existsSync(packagePath) || !fs.existsSync(appPath)) {
    console.error("PANTAVION INTELLIGENCE INSTALL: FAILED");
    console.error("Run this from C:\\Users\\gnkkm\\pantavion-planet");
    process.exit(1);
  }
}

function writeFile(relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content.trimStart() + "\n", "utf8");
  console.log("WROTE " + relativePath);
}

assertRepoRoot();

const fabricTs = String.raw`
export type PantavionContinent =
  | "africa"
  | "asia"
  | "europe"
  | "north_america"
  | "south_america"
  | "oceania"
  | "global";

export type PantavionBrainKind =
  | "prime"
  | "research"
  | "market"
  | "technology"
  | "ai_provider"
  | "builder"
  | "security"
  | "legal"
  | "ops"
  | "user_memory"
  | "language"
  | "commerce"
  | "media"
  | "infrastructure"
  | "invention"
  | "vision_memory"
  | "production_monitor"
  | "growth"
  | "education"
  | "social"
  | "translation"
  | "emergency";

export type PantavionSignalDomain =
  | "ai_models"
  | "apps"
  | "tools"
  | "programming_languages"
  | "products"
  | "markets"
  | "competitors"
  | "research"
  | "patents"
  | "law_policy"
  | "security"
  | "user_behavior"
  | "infrastructure"
  | "education"
  | "media"
  | "commerce"
  | "health_safety"
  | "transport"
  | "maritime"
  | "aviation"
  | "environment"
  | "social"
  | "translation"
  | "work"
  | "creator_economy"
  | "emergency_systems"
  | "public_services"
  | "hardware"
  | "robotics"
  | "cloud"
  | "payments";

export type PantavionAgentAuthority =
  | "observe"
  | "compare"
  | "classify"
  | "score"
  | "propose"
  | "draft_patch"
  | "audit"
  | "request_founder_approval"
  | "execute_after_approval";

export type PantavionBuildQueueStatus =
  | "candidate"
  | "needs_research"
  | "needs_design"
  | "needs_legal_transform"
  | "needs_patch"
  | "needs_audit"
  | "needs_founder_approval"
  | "ready_for_build"
  | "blocked";

export interface PantavionBrainLayer {
  id: string;
  kind: PantavionBrainKind;
  name: string;
  purpose: string;
  responsibilities: string[];
  protectedBy: string[];
}

export interface PantavionAgentRole {
  id: string;
  name: string;
  scope: "platform" | "per_user" | "per_module" | "per_signal" | "per_build" | "per_continent";
  authority: PantavionAgentAuthority[];
  responsibilities: string[];
  forbidden: string[];
}

export interface PantavionContinentWatch {
  continent: PantavionContinent;
  watchTargets: PantavionSignalDomain[];
  purpose: string;
}

export interface PantavionOpportunity {
  id: string;
  title: string;
  sourceSignal: PantavionSignalDomain;
  continentScope: PantavionContinent[];
  whyItMatters: string;
  pantavionOwnedMove: string;
  legalBoundary: string;
  buildStatus: PantavionBuildQueueStatus;
}

export interface PantavionBuildWorkOrder {
  id: string;
  title: string;
  targetModule: string;
  requiredBrains: PantavionBrainKind[];
  status: PantavionBuildQueueStatus;
  routeTargets: string[];
  auditRequired: boolean;
  founderApprovalRequired: boolean;
}

export const PANTAVION_SOVEREIGN_INTELLIGENCE_FABRIC_ID =
  "pantavion_sovereign_intelligence_fabric_v1";

export const sovereignPrinciples = [
  "Pantavion is a living planetary platform, not a static presentation.",
  "The Prime Brain routes fast decisions; specialist brains perform deeper work.",
  "Agents are virtual workers with scoped authority, not uncontrolled autonomous actors.",
  "External products and competitors are signals only; Pantavion creates lawful original capabilities.",
  "No copying logos, layouts, proprietary assets, rankings, claims, source code, or protected expression.",
  "Every build action must pass audit, TypeScript, build, scoped commit, push, and production verification.",
  "Cloud 24/365 operation requires scheduler, durable storage, queue, logs, provider keys, monitoring, and approval controls.",
];

export const continentWatch: PantavionContinentWatch[] = [
  {
    continent: "africa",
    watchTargets: [
      "markets",
      "commerce",
      "payments",
      "transport",
      "health_safety",
      "education",
      "products",
      "apps",
      "public_services",
      "infrastructure",
    ],
    purpose:
      "Detect mobile-first, payment, education, infrastructure, safety, public-service, and local-service patterns.",
  },
  {
    continent: "asia",
    watchTargets: [
      "ai_models",
      "apps",
      "tools",
      "commerce",
      "media",
      "products",
      "programming_languages",
      "robotics",
      "hardware",
      "social",
    ],
    purpose:
      "Track super-apps, robotics, AI models, creator tools, commerce, gaming, hardware, and communication ecosystems.",
  },
  {
    continent: "europe",
    watchTargets: [
      "law_policy",
      "research",
      "security",
      "ai_models",
      "products",
      "markets",
      "translation",
      "public_services",
      "environment",
    ],
    purpose:
      "Track regulation, compliance, multilingual systems, safety, public infrastructure, environment, and research.",
  },
  {
    continent: "north_america",
    watchTargets: [
      "ai_models",
      "tools",
      "products",
      "competitors",
      "research",
      "infrastructure",
      "security",
      "cloud",
      "creator_economy",
    ],
    purpose:
      "Track frontier AI, cloud, developer ecosystems, enterprise software, social platforms, and security.",
  },
  {
    continent: "south_america",
    watchTargets: [
      "commerce",
      "apps",
      "markets",
      "products",
      "education",
      "transport",
      "payments",
      "creator_economy",
      "social",
    ],
    purpose:
      "Track fintech, creator economy, social-commerce, local services, mobile utility, and community networks.",
  },
  {
    continent: "oceania",
    watchTargets: [
      "environment",
      "maritime",
      "aviation",
      "health_safety",
      "infrastructure",
      "research",
      "emergency_systems",
    ],
    purpose:
      "Track remote-area resilience, maritime/aviation, environment, emergency, and distributed infrastructure patterns.",
  },
  {
    continent: "global",
    watchTargets: [
      "ai_models",
      "apps",
      "tools",
      "programming_languages",
      "products",
      "markets",
      "competitors",
      "research",
      "patents",
      "law_policy",
      "security",
      "user_behavior",
      "infrastructure",
      "education",
      "media",
      "commerce",
      "health_safety",
      "transport",
      "maritime",
      "aviation",
      "environment",
      "social",
      "translation",
      "work",
      "creator_economy",
      "emergency_systems",
      "public_services",
      "hardware",
      "robotics",
      "cloud",
      "payments",
    ],
    purpose:
      "Maintain global signal coverage for Pantavion improvement, invention, resilience, and lawful product evolution.",
  },
];

export const brainLayers: PantavionBrainLayer[] = [
  {
    id: "prime_brain",
    kind: "prime",
    name: "Prime Sovereign Brain",
    purpose:
      "Fast routing, prioritization, intent classification, and coordination of all specialist brains.",
    responsibilities: [
      "intent routing",
      "risk priority",
      "brain selection",
      "result synthesis",
      "founder escalation",
      "platform coherence",
    ],
    protectedBy: ["founder approval", "audit gate", "policy guard"],
  },
  {
    id: "research_brain",
    kind: "research",
    name: "Global Research Brain",
    purpose:
      "Evaluate research, papers, protocols, public-domain sources, and institutional knowledge.",
    responsibilities: [
      "source reliability",
      "citations",
      "research gaps",
      "knowledge graph seeding",
      "scientific opportunity detection",
    ],
    protectedBy: ["source provenance", "citation requirements", "licensing checks"],
  },
  {
    id: "market_brain",
    kind: "market",
    name: "Market and Product Brain",
    purpose:
      "Observe markets, products, tools, competitors, pricing patterns, user demand, and unmet needs.",
    responsibilities: [
      "market scanning",
      "product comparison",
      "advantage matrix",
      "opportunity detection",
      "competitor weakness mapping",
    ],
    protectedBy: ["no deceptive claims", "no copied marketing", "evidence rules"],
  },
  {
    id: "technology_brain",
    kind: "technology",
    name: "Technology Radar Brain",
    purpose:
      "Track AI, software, languages, APIs, protocols, hardware, cloud, security, and infrastructure changes.",
    responsibilities: [
      "technology radar",
      "gap detection",
      "stack recommendations",
      "compatibility mapping",
      "provider trend detection",
    ],
    protectedBy: ["provider terms", "security review", "architecture audit"],
  },
  {
    id: "ai_provider_brain",
    kind: "ai_provider",
    name: "AI Provider Router Brain",
    purpose:
      "Select models/providers by task, cost, privacy, speed, region, modality, reliability, and legal constraints.",
    responsibilities: [
      "model selection",
      "fallback routing",
      "cost controls",
      "latency controls",
      "modality matching",
    ],
    protectedBy: ["budget guard", "privacy guard", "provider compliance"],
  },
  {
    id: "builder_brain",
    kind: "builder",
    name: "Pantavion Build Factory Brain",
    purpose:
      "Transform approved opportunities into routes, APIs, modules, tests, audits, and deployable patches.",
    responsibilities: [
      "work orders",
      "patch drafts",
      "test requirements",
      "build verification",
      "deploy readiness",
    ],
    protectedBy: ["founder approval", "scoped git add only", "no blind patches"],
  },
  {
    id: "security_brain",
    kind: "security",
    name: "Security and Abuse Brain",
    purpose:
      "Protect users, infrastructure, identity, access, moderation, fraud, and platform integrity.",
    responsibilities: [
      "risk lanes",
      "abuse detection",
      "access control",
      "security headers",
      "incident escalation",
      "private infrastructure protection",
    ],
    protectedBy: ["least privilege", "audit logs", "safety policies"],
  },
  {
    id: "legal_brain",
    kind: "legal",
    name: "Legal Transformation Brain",
    purpose:
      "Convert outside patterns into lawful Pantavion-owned capabilities without copying protected expression.",
    responsibilities: [
      "legal abstraction",
      "licensing",
      "jurisdiction flags",
      "disclaimer lanes",
      "originality review",
    ],
    protectedBy: ["no trademark copying", "no UI copying", "provenance ledger"],
  },
  {
    id: "ops_brain",
    kind: "ops",
    name: "24/365 Operations Brain",
    purpose:
      "Monitor build, deploy, uptime, cron, queues, storage, provider health, logs, and incident repair.",
    responsibilities: [
      "production checks",
      "scheduled ticks",
      "alerts",
      "repair tasks",
      "deployment verification",
      "drift detection",
    ],
    protectedBy: ["cloud logs", "rate limits", "manual override"],
  },
  {
    id: "user_memory_brain",
    kind: "user_memory",
    name: "Per-User Memory Brain",
    purpose:
      "Maintain user preferences, language, permissions, context, agents, and personal workflows.",
    responsibilities: [
      "memory scopes",
      "consent",
      "per-user agent assignment",
      "context continuity",
      "language preference",
    ],
    protectedBy: ["consent", "data minimization", "user controls"],
  },
  {
    id: "language_brain",
    kind: "language",
    name: "PantaTranslate Language Brain",
    purpose:
      "Keep bidirectional translation across social, work, travel, SOS, elder, video, voice, camera, accessibility, and AI.",
    responsibilities: [
      "language detection",
      "translation routing",
      "accessibility subtitles",
      "elder simple mode",
      "same-phone interpreter",
      "two-device interpreter",
    ],
    protectedBy: ["translation disclaimers", "provider checks", "emergency limitations"],
  },
  {
    id: "commerce_brain",
    kind: "commerce",
    name: "Commerce and Marketplace Brain",
    purpose:
      "Support lawful marketplace, jobs, services, pricing, subscriptions, business tools, classifieds, and growth.",
    responsibilities: [
      "marketplace categories",
      "pricing safety",
      "classifieds",
      "jobs",
      "service workflows",
      "fraud detection",
    ],
    protectedBy: ["fraud checks", "regulated category guard", "billing compliance"],
  },
  {
    id: "media_brain",
    kind: "media",
    name: "Media and Creator Brain",
    purpose:
      "Support creator tools, design, video, music, photo, posts, channels, media intelligence, and copyright safety.",
    responsibilities: [
      "asset generation",
      "media workflows",
      "creator studio",
      "copyright checks",
      "brand originality",
    ],
    protectedBy: ["copyright guard", "consent guard", "brand originality"],
  },
  {
    id: "infrastructure_brain",
    kind: "infrastructure",
    name: "Infrastructure and Public Systems Brain",
    purpose:
      "Support water, maritime, aviation, emergency, environment, maps, private infrastructure, and admin access.",
    responsibilities: [
      "private data guard",
      "map services",
      "access approvals",
      "infrastructure modules",
      "sensitive asset protection",
    ],
    protectedBy: ["no public raw private data", "role access", "audit logs"],
  },
  {
    id: "invention_brain",
    kind: "invention",
    name: "Invention and Gap Discovery Brain",
    purpose:
      "Find what no competitor has solved and propose Pantavion-first inventions.",
    responsibilities: [
      "unmet needs",
      "new methods",
      "original capabilities",
      "future-proofing",
      "breakthrough queue",
    ],
    protectedBy: ["feasibility checks", "legal transformation", "founder approval"],
  },
  {
    id: "vision_memory_brain",
    kind: "vision_memory",
    name: "Founder Vision Memory Brain",
    purpose:
      "Keep founder requirements, old batches, repo truth, deployed truth, missing features, and fake/static gaps aligned.",
    responsibilities: [
      "vision ledger",
      "missing requirement detection",
      "batch continuity",
      "repo-to-vision comparison",
      "dead/static detection",
    ],
    protectedBy: ["source inventory", "audit logs", "no chat-only memory claims"],
  },
  {
    id: "production_monitor_brain",
    kind: "production_monitor",
    name: "Production Monitor Brain",
    purpose:
      "Continuously compare local repo, GitHub, Vercel, routes, APIs, public pages, and build status.",
    responsibilities: [
      "production verification",
      "dead route detection",
      "deployment drift",
      "repair queue",
      "public URL checks",
    ],
    protectedBy: ["production check required", "no false live claims", "founder alert"],
  },
  {
    id: "growth_brain",
    kind: "growth",
    name: "Growth and Distribution Brain",
    purpose:
      "Support lawful growth, invitations, referrals, onboarding, retention, localization, and launch readiness.",
    responsibilities: [
      "growth loops",
      "referral safety",
      "country localization",
      "onboarding optimization",
      "public launch signals",
    ],
    protectedBy: ["consent", "anti-spam", "privacy rules", "claim safety"],
  },
  {
    id: "social_brain",
    kind: "social",
    name: "Social Universe Brain",
    purpose:
      "Coordinate Pantavion social/chat/profile/media/community layers with translation, moderation, safety, and identity.",
    responsibilities: [
      "profile surfaces",
      "social graph",
      "chat",
      "voice/video surfaces",
      "moderation",
      "age suitability",
    ],
    protectedBy: ["minors policy", "abuse controls", "identity/privacy guard"],
  },
  {
    id: "emergency_brain",
    kind: "emergency",
    name: "SOS and Off-Grid Emergency Brain",
    purpose:
      "Protect SOS, elder, accessibility, emergency circle, offline identity pack, and certified-provider boundaries.",
    responsibilities: [
      "SOS flow",
      "elder mode",
      "emergency contacts",
      "offline pack",
      "connectivity state",
      "no false dispatch guarantee",
    ],
    protectedBy: ["human safety gate", "legal limitation", "provider certification boundary"],
  },
];

export const agentRoles: PantavionAgentRole[] = [
  {
    id: "guardian_agent",
    name: "Guardian Agent",
    scope: "platform",
    authority: ["observe", "compare", "classify", "score", "propose", "audit", "request_founder_approval"],
    responsibilities: [
      "detect broken routes",
      "detect gaps",
      "detect unsafe static claims",
      "open repair work orders",
      "compare vision against repo",
    ],
    forbidden: ["deploy without approval", "delete private data", "claim guarantees without evidence"],
  },
  {
    id: "continent_signal_agent",
    name: "Continent Signal Agent",
    scope: "per_continent",
    authority: ["observe", "compare", "classify", "score", "propose"],
    responsibilities: [
      "watch six continents",
      "classify market and technology signals",
      "detect competitor weakness",
      "detect regional opportunities",
    ],
    forbidden: ["copy proprietary assets", "scrape against terms", "make unsupported claims"],
  },
  {
    id: "product_absorption_agent",
    name: "Product Absorption Agent",
    scope: "per_signal",
    authority: ["observe", "compare", "classify", "score", "propose", "request_founder_approval"],
    responsibilities: [
      "extract strengths",
      "extract weaknesses",
      "create Pantavion-owned equivalent work order",
      "flag legal transformation needs",
    ],
    forbidden: ["copy UI layouts", "copy logos", "copy protected text", "copy proprietary rankings"],
  },
  {
    id: "invention_agent",
    name: "Invention Agent",
    scope: "platform",
    authority: ["observe", "compare", "classify", "score", "propose", "draft_patch"],
    responsibilities: [
      "find unsolved problems",
      "propose new methods",
      "rank breakthrough opportunities",
      "map discoveries to Pantavion modules",
    ],
    forbidden: ["present speculation as fact", "skip feasibility", "skip legal review"],
  },
  {
    id: "builder_agent",
    name: "Builder Agent",
    scope: "per_build",
    authority: ["draft_patch", "audit", "request_founder_approval", "execute_after_approval"],
    responsibilities: [
      "create routes",
      "create APIs",
      "create core modules",
      "run audit requirements",
      "prepare scoped commit lists",
    ],
    forbidden: ["git add .", "blind encoding replacements", "unscoped patches", "deploy without verification"],
  },
  {
    id: "ops_agent",
    name: "Ops Agent",
    scope: "platform",
    authority: ["observe", "classify", "score", "propose", "audit"],
    responsibilities: [
      "monitor uptime",
      "verify deployment",
      "check cron",
      "check logs",
      "create incident tasks",
      "detect drift",
    ],
    forbidden: ["hide failures", "claim live status without production check"],
  },
  {
    id: "per_user_companion_agent",
    name: "Per-User Companion Agent",
    scope: "per_user",
    authority: ["observe", "classify", "propose"],
    responsibilities: [
      "remember preferences with consent",
      "assist user workflows",
      "route user tasks to specialist agents",
      "adapt language and accessibility",
    ],
    forbidden: ["store sensitive data without consent", "act outside user permissions"],
  },
  {
    id: "legal_transform_agent",
    name: "Legal Transformation Agent",
    scope: "per_signal",
    authority: ["observe", "compare", "classify", "score", "propose", "audit"],
    responsibilities: [
      "abstract outside patterns",
      "ensure originality",
      "flag regulatory risk",
      "protect Pantavion-owned implementation",
    ],
    forbidden: ["copy protected expression", "ignore jurisdiction", "remove disclaimers"],
  },
  {
    id: "translation_agent",
    name: "Universal Translation Agent",
    scope: "per_module",
    authority: ["observe", "classify", "propose", "audit"],
    responsibilities: [
      "ensure PantaTranslate is available across modules",
      "detect missing language surfaces",
      "protect elder/simple modes",
      "route provider gaps",
    ],
    forbidden: ["claim perfect translation", "remove emergency disclaimers"],
  },
  {
    id: "sos_safety_agent",
    name: "SOS Safety Agent",
    scope: "per_module",
    authority: ["observe", "classify", "score", "propose", "audit"],
    responsibilities: [
      "check SOS flow",
      "check elder mode",
      "check emergency circle",
      "check off-grid boundary",
      "detect dangerous claims",
    ],
    forbidden: ["claim authority dispatch without agreements", "claim satellite rescue without certified provider"],
  },
  {
    id: "vision_gap_agent",
    name: "Founder Vision Gap Agent",
    scope: "platform",
    authority: ["observe", "compare", "classify", "score", "propose", "audit"],
    responsibilities: [
      "compare old batches with current repo",
      "detect missing Pantavion features",
      "detect fake/static modules",
      "create prioritized build gaps",
    ],
    forbidden: ["treat chat-only text as implementation", "hide missing features"],
  },
];

export const productAbsorptionPipeline = [
  "collect_signal",
  "classify_domain",
  "extract_strengths",
  "extract_weaknesses",
  "map_to_pantavion_gap",
  "legal_transform",
  "invent_better_pantavion_capability",
  "create_build_work_order",
  "audit_requirements",
  "founder_approval",
  "patch",
  "typescript_check",
  "build_check",
  "deploy",
  "production_verify",
];

export const legalTransformationRules = [
  "Observe capabilities, not protected expression.",
  "Do not copy logos, colors as brand identity, UI layouts, slogans, rankings, proprietary databases, source code, or private data.",
  "Record source category and inspiration boundary.",
  "Create Pantavion-owned naming, UX, architecture, copy, data model, and workflows.",
  "Add jurisdiction, licensing, privacy, and safety constraints before build.",
  "Treat competitor features as market signals, not as templates to copy.",
];

export const cloudRuntimeRequirements = [
  "Vercel cron or equivalent cloud scheduler",
  "durable database for signals opportunities agents and build queue",
  "queue for agent jobs",
  "object storage for reports artifacts and evidence",
  "AI provider keys and budget limits",
  "GitHub deployment credentials with scoped permissions",
  "Vercel deployment credentials with scoped permissions",
  "logs monitoring and alerting",
  "founder approval dashboard",
  "production route verification",
  "privacy consent and role access rules",
];

export const buildFactoryStages = [
  "requirement_capture",
  "vision_match",
  "gap_match",
  "source_inventory_check",
  "work_order",
  "legal_transform",
  "patch_plan",
  "code_generation",
  "audit",
  "typecheck",
  "build",
  "scoped_commit",
  "push",
  "deployment",
  "production_check",
  "monitoring",
];

export function getPantavionSovereignIntelligenceFabric() {
  return {
    id: PANTAVION_SOVEREIGN_INTELLIGENCE_FABRIC_ID,
    version: "1.0.0",
    runtimeName: "Pantavion Sovereign Multi-Brain Intelligence Fabric",
    status: {
      internalRuntimeContract: "active",
      cloudDaemon: "requires_scheduler_database_queue_provider_keys_and_monitoring",
      autonomousBuild: "approval_required",
      productionClaim: "only true after deployment and production route check",
    },
    sovereignPrinciples,
    brainLayers,
    agentRoles,
    continentWatch,
    productAbsorptionPipeline,
    legalTransformationRules,
    cloudRuntimeRequirements,
    buildFactoryStages,
  };
}

export function getPantavionOpportunities(): PantavionOpportunity[] {
  return [
    {
      id: "opp_global_ai_radar",
      title: "Global AI and product radar",
      sourceSignal: "ai_models",
      continentScope: ["global", "asia", "north_america", "europe"],
      whyItMatters:
        "Pantavion must detect new AI models, products, tools, and gaps before they become market standards.",
      pantavionOwnedMove:
        "Create a governed Pantavion AI Atlas and Opportunity Queue that converts signals into lawful build tasks.",
      legalBoundary:
        "No copying provider UI, logos, rankings, claims, source code, proprietary data, or protected expression.",
      buildStatus: "ready_for_build",
    },
    {
      id: "opp_six_continent_watch",
      title: "Six-continent technology and market watch",
      sourceSignal: "markets",
      continentScope: ["africa", "asia", "europe", "north_america", "south_america", "oceania"],
      whyItMatters:
        "Pantavion must learn from regional patterns, not only US/EU products.",
      pantavionOwnedMove:
        "Create continent-specific scanner jobs and opportunity scoring.",
      legalBoundary:
        "Use public, licensed, user-provided, or authorized sources only.",
      buildStatus: "ready_for_build",
    },
    {
      id: "opp_invention_engine",
      title: "Pantavion invention engine",
      sourceSignal: "research",
      continentScope: ["global"],
      whyItMatters:
        "The platform must find unsolved needs, not only react to competitors.",
      pantavionOwnedMove:
        "Create an invention queue that maps gaps to original Pantavion modules.",
      legalBoundary:
        "Treat all external sources as signals, not content to copy.",
      buildStatus: "needs_design",
    },
    {
      id: "opp_translation_everywhere",
      title: "PantaTranslate everywhere",
      sourceSignal: "translation",
      continentScope: ["global"],
      whyItMatters:
        "Translation is core Pantavion DNA across social, work, travel, SOS, elder, accessibility, and AI.",
      pantavionOwnedMove:
        "Route all human-to-human and human-to-AI communication through the PantaTranslate capability layer.",
      legalBoundary:
        "Translation is assistive and must not claim perfect legal, medical, or emergency accuracy.",
      buildStatus: "ready_for_build",
    },
    {
      id: "opp_emergency_resilience",
      title: "SOS and off-grid emergency resilience",
      sourceSignal: "emergency_systems",
      continentScope: ["global", "oceania", "africa"],
      whyItMatters:
        "Pantavion must support emergencies without false rescue guarantees.",
      pantavionOwnedMove:
        "Build online weak-network offline and satellite-supported states with offline identity pack and certified provider roadmap.",
      legalBoundary:
        "No authority dispatch or satellite rescue claim without certified agreements and hardware/provider support.",
      buildStatus: "needs_design",
    },
  ];
}

export function getPantavionBuildQueue(): PantavionBuildWorkOrder[] {
  return [
    {
      id: "build_cloud_signal_store",
      title: "Create durable signal and opportunity storage",
      targetModule: "pantavion-intelligence",
      requiredBrains: ["ops", "research", "technology", "security"],
      status: "needs_founder_approval",
      routeTargets: [
        "/api/pantavion/intelligence/signals",
        "/api/pantavion/intelligence/opportunities",
      ],
      auditRequired: true,
      founderApprovalRequired: true,
    },
    {
      id: "build_scheduler_tick",
      title: "Connect cloud scheduler to intelligence tick",
      targetModule: "pantavion-intelligence",
      requiredBrains: ["ops", "technology", "security"],
      status: "needs_founder_approval",
      routeTargets: ["/api/pantavion/intelligence/tick"],
      auditRequired: true,
      founderApprovalRequired: true,
    },
    {
      id: "build_agent_registry",
      title: "Create per-user and platform agent registry",
      targetModule: "pantavion-agents",
      requiredBrains: ["prime", "user_memory", "security", "ai_provider"],
      status: "needs_design",
      routeTargets: ["/api/pantavion/agents", "/api/pantavion/agents/user"],
      auditRequired: true,
      founderApprovalRequired: true,
    },
    {
      id: "build_founder_control_room",
      title: "Create founder control room for approvals build queue and production status",
      targetModule: "pantavion-admin",
      requiredBrains: ["prime", "ops", "security", "builder", "vision_memory"],
      status: "needs_founder_approval",
      routeTargets: [
        "/admin/pantavion/intelligence",
        "/api/pantavion/intelligence/build-queue",
      ],
      auditRequired: true,
      founderApprovalRequired: true,
    },
    {
      id: "build_global_product_absorption",
      title: "Create legal product absorption engine",
      targetModule: "pantavion-intelligence",
      requiredBrains: ["market", "legal", "technology", "invention"],
      status: "needs_design",
      routeTargets: ["/api/pantavion/intelligence/product-absorption"],
      auditRequired: true,
      founderApprovalRequired: true,
    },
  ];
}

export function runPantavionIntelligenceTick() {
  const fabric = getPantavionSovereignIntelligenceFabric();

  return {
    ok: true,
    route: "/api/pantavion/intelligence/tick",
    tickId: "pantavion_tick_" + Date.now(),
    executedAt: new Date().toISOString(),
    mode: "runtime_contract_tick",
    summary:
      "This tick evaluates the multi-brain fabric, prepares continent scanning jobs, and creates build/opportunity queues. Full external 24/365 scanning requires cloud scheduler, durable storage, queue, logs, provider keys, and production verification.",
    continentJobs: continentWatch.map((watch) => ({
      continent: watch.continent,
      watchTargets: watch.watchTargets,
      purpose: watch.purpose,
      status: "ready_for_cloud_scheduler",
    })),
    agentJobs: agentRoles.map((agent) => ({
      agent: agent.id,
      scope: agent.scope,
      authority: agent.authority,
      status: "ready_for_queue_runtime",
    })),
    nextCloudRequirements: fabric.cloudRuntimeRequirements,
    buildQueue: getPantavionBuildQueue(),
    opportunities: getPantavionOpportunities(),
  };
}
`;

const statusRoute = String.raw`
import { NextResponse } from "next/server";
import { getPantavionSovereignIntelligenceFabric } from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/intelligence/status",
    fabric: getPantavionSovereignIntelligenceFabric(),
  });
}
`;

const tickRoute = String.raw`
import { NextResponse } from "next/server";
import { runPantavionIntelligenceTick } from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(runPantavionIntelligenceTick());
}

export async function POST() {
  return NextResponse.json(runPantavionIntelligenceTick());
}
`;

const opportunitiesRoute = String.raw`
import { NextResponse } from "next/server";
import { getPantavionOpportunities } from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/intelligence/opportunities",
    opportunities: getPantavionOpportunities(),
  });
}
`;

const buildQueueRoute = String.raw`
import { NextResponse } from "next/server";
import { getPantavionBuildQueue } from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/intelligence/build-queue",
    buildQueue: getPantavionBuildQueue(),
  });
}
`;

const pageTsx = String.raw`
import Link from "next/link";
import {
  getPantavionBuildQueue,
  getPantavionOpportunities,
  getPantavionSovereignIntelligenceFabric,
} from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";

export const dynamic = "force-dynamic";

export default function PantavionIntelligencePage() {
  const fabric = getPantavionSovereignIntelligenceFabric();
  const opportunities = getPantavionOpportunities();
  const buildQueue = getPantavionBuildQueue();

  return (
    <main style={{ minHeight: "100vh", padding: "40px", background: "#070b16", color: "#f7e7b4" }}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", color: "#d6b45c" }}>
          Pantavion Intelligence
        </p>
        <h1 style={{ fontSize: "42px", lineHeight: 1.1, margin: "12px 0" }}>
          Sovereign Multi-Brain Intelligence Fabric
        </h1>
        <p style={{ maxWidth: "900px", color: "#d7d7df", fontSize: "18px" }}>
          Internal live runtime surface for Pantavion brains, agents, six-continent watch,
          legal transformation, invention, product absorption, build queue, and cloud 24/365 readiness.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "28px" }}>
          <Card title="Brains" value={String(fabric.brainLayers.length)} />
          <Card title="Agent Roles" value={String(fabric.agentRoles.length)} />
          <Card title="Continent Watches" value={String(fabric.continentWatch.length)} />
          <Card title="Build Orders" value={String(buildQueue.length)} />
        </div>

        <h2 style={{ marginTop: "40px" }}>Live API routes</h2>
        <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
          <RouteLink href="/api/pantavion/intelligence/status" />
          <RouteLink href="/api/pantavion/intelligence/tick" />
          <RouteLink href="/api/pantavion/intelligence/opportunities" />
          <RouteLink href="/api/pantavion/intelligence/build-queue" />
        </div>

        <h2 style={{ marginTop: "40px" }}>Brain layers</h2>
        <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
          {fabric.brainLayers.map((brain) => (
            <article key={brain.id} style={{ border: "1px solid rgba(214,180,92,0.35)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.04)" }}>
              <h3 style={{ margin: 0, color: "#ffd86b" }}>{brain.name}</h3>
              <p style={{ color: "#d7d7df" }}>{brain.purpose}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>
                Responsibilities: {brain.responsibilities.join(", ")}
              </p>
            </article>
          ))}
        </div>

        <h2 style={{ marginTop: "40px" }}>Six-continent watch</h2>
        <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
          {fabric.continentWatch.map((watch) => (
            <article key={watch.continent} style={{ border: "1px solid rgba(214,180,92,0.25)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.035)" }}>
              <h3 style={{ margin: 0, color: "#ffd86b" }}>{watch.continent.replace("_", " ")}</h3>
              <p style={{ color: "#d7d7df" }}>{watch.purpose}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Targets: {watch.watchTargets.join(", ")}</p>
            </article>
          ))}
        </div>

        <h2 style={{ marginTop: "40px" }}>Opportunities</h2>
        <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
          {opportunities.map((opportunity) => (
            <article key={opportunity.id} style={{ border: "1px solid rgba(214,180,92,0.25)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.035)" }}>
              <h3 style={{ margin: 0, color: "#ffd86b" }}>{opportunity.title}</h3>
              <p style={{ color: "#d7d7df" }}>{opportunity.whyItMatters}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Pantavion-owned move: {opportunity.pantavionOwnedMove}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Status: {opportunity.buildStatus}</p>
            </article>
          ))}
        </div>

        <h2 style={{ marginTop: "40px" }}>Build queue</h2>
        <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
          {buildQueue.map((item) => (
            <article key={item.id} style={{ border: "1px solid rgba(214,180,92,0.25)", borderRadius: "16px", padding: "18px", background: "rgba(255,255,255,0.035)" }}>
              <h3 style={{ margin: 0, color: "#ffd86b" }}>{item.title}</h3>
              <p style={{ color: "#d7d7df" }}>Target module: {item.targetModule}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Routes: {item.routeTargets.join(", ")}</p>
              <p style={{ color: "#aeb3c2", fontSize: "14px" }}>Status: {item.status}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: "1px solid rgba(214,180,92,0.35)", borderRadius: "18px", padding: "20px", background: "rgba(255,255,255,0.05)" }}>
      <div style={{ color: "#aeb3c2", fontSize: "14px" }}>{title}</div>
      <div style={{ fontSize: "34px", color: "#ffd86b", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function RouteLink({ href }: { href: string }) {
  return (
    <Link href={href} style={{ color: "#ffd86b", border: "1px solid rgba(214,180,92,0.28)", borderRadius: "12px", padding: "12px 14px", textDecoration: "none", background: "rgba(255,255,255,0.04)" }}>
      {href}
    </Link>
  );
}
`;

const gateScript = String.raw`
const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/intelligence/pantavion-sovereign-intelligence-fabric.ts",
  "app/pantavion/intelligence/page.tsx",
  "app/api/pantavion/intelligence/status/route.ts",
  "app/api/pantavion/intelligence/tick/route.ts",
  "app/api/pantavion/intelligence/opportunities/route.ts",
  "app/api/pantavion/intelligence/build-queue/route.ts",
  "scripts/pantavion-intelligence-fabric-gate.cjs",
  "docs/continuity/pantavion-sovereign-intelligence-fabric.md",
  "package.json"
];

const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

for (const file of requiredFiles) read(file);

const fabric = read("core/intelligence/pantavion-sovereign-intelligence-fabric.ts");
const page = read("app/pantavion/intelligence/page.tsx");
const statusRoute = read("app/api/pantavion/intelligence/status/route.ts");
const tickRoute = read("app/api/pantavion/intelligence/tick/route.ts");
const opportunitiesRoute = read("app/api/pantavion/intelligence/opportunities/route.ts");
const buildQueueRoute = read("app/api/pantavion/intelligence/build-queue/route.ts");
const packageJsonText = read("package.json");

const requiredMarkers = [
  "PANTAVION_SOVEREIGN_INTELLIGENCE_FABRIC_ID",
  "continentWatch",
  "brainLayers",
  "agentRoles",
  "productAbsorptionPipeline",
  "legalTransformationRules",
  "cloudRuntimeRequirements",
  "buildFactoryStages",
  "runPantavionIntelligenceTick",
  "getPantavionOpportunities",
  "getPantavionBuildQueue",
];

for (const marker of requiredMarkers) {
  if (!fabric.includes(marker)) failures.push("Fabric missing marker: " + marker);
}

if (!page.includes("Sovereign Multi-Brain Intelligence Fabric")) {
  failures.push("visible intelligence page must expose the fabric.");
}

if (!statusRoute.includes("getPantavionSovereignIntelligenceFabric")) {
  failures.push("status route must expose fabric status.");
}

if (!tickRoute.includes("runPantavionIntelligenceTick")) {
  failures.push("tick route must execute intelligence tick.");
}

if (!opportunitiesRoute.includes("getPantavionOpportunities")) {
  failures.push("opportunities route must expose opportunities.");
}

if (!buildQueueRoute.includes("getPantavionBuildQueue")) {
  failures.push("build queue route must expose build queue.");
}

let packageJson = null;
try {
  packageJson = JSON.parse(packageJsonText);
} catch {
  failures.push("package.json is invalid JSON.");
}

if (
  packageJson &&
  packageJson.scripts &&
  packageJson.scripts["audit:intelligence"] !== "node scripts/pantavion-intelligence-fabric-gate.cjs"
) {
  failures.push("package.json must include audit:intelligence script.");
}

if (fabric.includes("git add .")) {
  failures.push("Fabric must not contain blanket git add.");
}

if (failures.length > 0) {
  console.error("PANTAVION INTELLIGENCE FABRIC GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION INTELLIGENCE FABRIC GATE: PASSED");
  console.log("- visible page present");
  console.log("- multi-brain kernel contract present");
  console.log("- agent workforce present");
  console.log("- six-continent watch present");
  console.log("- product absorption pipeline present");
  console.log("- legal transformation rules present");
  console.log("- invention/build queue present");
  console.log("- cloud 24/365 requirements present");
  console.log("- status/tick/opportunities/build-queue routes present");
}
`;

const docs = String.raw`
# Pantavion Sovereign Intelligence Fabric

This is the first unified runtime contract for the Pantavion multi-brain intelligence system.

## Purpose

Pantavion is not a static presentation. It must become a living planetary platform with multiple internal brains, scoped agent workers, global signal watching, lawful product absorption, invention discovery, build queues, audits, and production verification.

## Core Runtime

- Prime Brain for fast routing.
- Specialist brains for research, technology, market, legal, security, ops, language, commerce, media, infrastructure, invention, founder vision memory, emergency, social, growth, and production monitoring.
- Agent workforce with scoped authority.
- Six-continent signal watch.
- Product absorption pipeline.
- Legal transformation layer.
- Invention engine.
- Build factory.
- Cloud 24/365 requirements.

## Live Page

- /pantavion/intelligence

## Live API Routes

- /api/pantavion/intelligence/status
- /api/pantavion/intelligence/tick
- /api/pantavion/intelligence/opportunities
- /api/pantavion/intelligence/build-queue

## 24/365 Truth

The repository now contains the runtime contract, visible page, and routes. Full 24/365 operation requires cloud scheduler, durable storage, queues, logs, provider keys, monitoring, and production deployment checks.

## Non-Negotiable Rule

No feature is called complete unless it has files, route/function, audit, TypeScript check, build check, scoped commit, push, and production verification.
`;

writeFile("core/intelligence/pantavion-sovereign-intelligence-fabric.ts", fabricTs);
writeFile("app/pantavion/intelligence/page.tsx", pageTsx);
writeFile("app/api/pantavion/intelligence/status/route.ts", statusRoute);
writeFile("app/api/pantavion/intelligence/tick/route.ts", tickRoute);
writeFile("app/api/pantavion/intelligence/opportunities/route.ts", opportunitiesRoute);
writeFile("app/api/pantavion/intelligence/build-queue/route.ts", buildQueueRoute);
writeFile("scripts/pantavion-intelligence-fabric-gate.cjs", gateScript);
writeFile("docs/continuity/pantavion-sovereign-intelligence-fabric.md", docs);

const packagePath = path.join(root, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
packageJson.scripts = packageJson.scripts || {};
packageJson.scripts["audit:intelligence"] =
  "node scripts/pantavion-intelligence-fabric-gate.cjs";
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");

console.log("UPDATED package.json audit:intelligence");
console.log("PANTAVION SOVEREIGN INTELLIGENCE FABRIC INSTALL: PASSED");
