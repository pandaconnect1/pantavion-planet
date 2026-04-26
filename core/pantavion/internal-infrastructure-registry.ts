export type PantavionDependencyMode =
  | "pantavion_owned"
  | "temporary_adapter"
  | "hybrid_transition"
  | "blocked_until_owned"
  | "provider_boundary";

export type PantavionInfrastructureRisk =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type PantavionInfrastructureStatus =
  | "doctrine_locked"
  | "foundation"
  | "prototype"
  | "backend_required"
  | "operational"
  | "blocked";

export type PantavionInfrastructureLayer =
  | "ai"
  | "communication"
  | "identity"
  | "memory"
  | "translation"
  | "maps"
  | "analytics"
  | "storage"
  | "payments"
  | "security"
  | "media"
  | "search"
  | "infrastructure";

export type PantavionInternalSystem = {
  id: string;
  name: string;
  layer: PantavionInfrastructureLayer;
  mission: string;
  currentDependency: string;
  dependencyMode: PantavionDependencyMode;
  targetOwnedSystem: string;
  status: PantavionInfrastructureStatus;
  risk: PantavionInfrastructureRisk;
  whatWeBuildNow: string[];
  whatWeBuildLater: string[];
  forbiddenClaims: string[];
  sovereigntyRule: string;
};

export const pantavionInternalInfrastructureRegistry: PantavionInternalSystem[] = [
  {
    id: "pantaai-kernel",
    name: "PantaAI Kernel",
    layer: "ai",
    mission:
      "Become the visible intelligence and execution brain of Pantavion. Users must see PantaAI and Pantavion Kernel, not third-party model brands.",
    currentDependency:
      "Third-party AI providers may exist only as hidden temporary adapters while Pantavion builds internal intelligence layers.",
    dependencyMode: "hybrid_transition",
    targetOwnedSystem:
      "Pantavion-owned intent parser, planner, memory router, capability selector, execution verifier, safety router and later Pantavion-trained models.",
    status: "foundation",
    risk: "critical",
    whatWeBuildNow: [
      "Internal intent taxonomy",
      "Capability registry",
      "Execution planner",
      "Provider abstraction boundary",
      "Prompt and response policy layer",
      "No public provider branding rule",
      "Cost and dependency ledger"
    ],
    whatWeBuildLater: [
      "Pantavion-owned small models",
      "Domain-specific models",
      "Private fine-tuning pipeline",
      "Own evaluation harness",
      "Self-improving kernel loop with human approval",
      "Sovereign inference infrastructure"
    ],
    forbiddenClaims: [
      "Do not claim Pantavion already owns frontier AI models.",
      "Do not claim AI acts without human, legal or policy boundaries.",
      "Do not expose OpenAI, Claude, Gemini or other provider brands as the user-facing brain."
    ],
    sovereigntyRule:
      "Third-party AI is allowed only as a temporary hidden adapter. Strategic control remains inside Pantavion Kernel."
  },
  {
    id: "pantavion-communication-core",
    name: "Pantavion Communication Core",
    layer: "communication",
    mission:
      "Build Pantavion-owned messaging, voice, rooms, media sharing and contact communication so the ecosystem is not dependent on WhatsApp, Viber, Telegram or SMS providers.",
    currentDependency:
      "External messaging apps and SMS/email providers may be needed only for invitations, verification or fallback delivery.",
    dependencyMode: "hybrid_transition",
    targetOwnedSystem:
      "Pantavion-owned chat, groups, voice rooms, media messaging, contact graph, notification routing and legal import flow.",
    status: "backend_required",
    risk: "critical",
    whatWeBuildNow: [
      "Contact consent model",
      "Message schema",
      "Conversation schema",
      "Room schema",
      "Notification route map",
      "Import legality matrix",
      "No scraping policy"
    ],
    whatWeBuildLater: [
      "Realtime chat backend",
      "End-to-end encryption roadmap",
      "Voice call infrastructure",
      "Video/media rooms",
      "Federated responder channels",
      "Offline queue and delayed delivery"
    ],
    forbiddenClaims: [
      "Do not claim WhatsApp/Viber/Telegram messages can be imported without official API, export or user-controlled legal transfer.",
      "Do not collect third-party app passwords.",
      "Do not scrape private messages."
    ],
    sovereigntyRule:
      "Pantavion must own its communication layer. Third-party channels are only bridges, fallbacks or user-authorized imports."
  },
  {
    id: "pantavion-memory-graph",
    name: "Pantavion Memory Graph",
    layer: "memory",
    mission:
      "Create a persistent Pantavion-owned memory and knowledge graph connecting people, places, topics, work, learning, safety and execution history.",
    currentDependency:
      "Managed database may be used initially for speed and stability.",
    dependencyMode: "hybrid_transition",
    targetOwnedSystem:
      "Pantavion-owned graph memory, user memory, project memory, audit memory and restore/export controls.",
    status: "foundation",
    risk: "critical",
    whatWeBuildNow: [
      "Memory object model",
      "Graph entity taxonomy",
      "Consent boundaries",
      "User export policy",
      "Audit event schema",
      "Retention classes"
    ],
    whatWeBuildLater: [
      "Self-managed PostgreSQL",
      "Self-managed Neo4j or graph alternative",
      "Encrypted backups",
      "User-controlled memory controls",
      "Graph search",
      "Long-term archival storage"
    ],
    forbiddenClaims: [
      "Do not claim permanent memory without backup, restore and consent controls.",
      "Do not store sensitive data without purpose and policy."
    ],
    sovereigntyRule:
      "Memory is a sovereign Pantavion spine. Providers can host data temporarily, but ownership, schema and governance belong to Pantavion."
  },
  {
    id: "pantavion-interpreter-core",
    name: "Pantavion Interpreter Core",
    layer: "translation",
    mission:
      "Build Pantavion-owned translation and interpreter infrastructure with glossaries, phrase packs, confidence scoring, emergency phrases and language memory.",
    currentDependency:
      "Translation providers may be used initially as hidden engines.",
    dependencyMode: "hybrid_transition",
    targetOwnedSystem:
      "Pantavion translation memory, glossaries, phrase packs, language detection, confidence scoring and later own translation models.",
    status: "foundation",
    risk: "high",
    whatWeBuildNow: [
      "Language registry",
      "Phrase pack registry",
      "Emergency phrase pack",
      "Confidence score contract",
      "Medical/legal disclaimer model",
      "Offline phrase support"
    ],
    whatWeBuildLater: [
      "Pantavion-owned translator",
      "Dialect and local language packs",
      "Voice interpreter",
      "Human review routes",
      "Certified interpreter partnerships",
      "On-device translation roadmap"
    ],
    forbiddenClaims: [
      "Do not claim 100 percent perfect translation.",
      "Do not claim certified legal or medical interpretation unless certified.",
      "Do not hide confidence or uncertainty in emergency/professional contexts."
    ],
    sovereigntyRule:
      "Pantavion must own the interpreter experience, glossary, confidence and safety logic even when a temporary provider performs translation."
  },
  {
    id: "pantavion-compass-maps",
    name: "Pantavion Compass Maps",
    layer: "maps",
    mission:
      "Reduce dependence on Google Maps by building an OpenStreetMap-first mapping, places and route intelligence layer.",
    currentDependency:
      "Google Maps or paid map providers should be avoided unless a specific route requires them.",
    dependencyMode: "hybrid_transition",
    targetOwnedSystem:
      "Pantavion Compass using OpenStreetMap data, own places cache, own route metadata, own local travel intelligence and offline packs.",
    status: "foundation",
    risk: "medium",
    whatWeBuildNow: [
      "OSM-first doctrine",
      "Place category taxonomy",
      "Map route contract",
      "Offline map pack roadmap",
      "Location consent model"
    ],
    whatWeBuildLater: [
      "Own tile strategy",
      "Own places database",
      "Local transport intelligence",
      "Hotel return mode",
      "Driver display mode",
      "Emergency location sharing"
    ],
    forbiddenClaims: [
      "Do not claim own global maps before own data/tile infrastructure exists.",
      "Do not send location without explicit user consent except lawful emergency logic defined by policy."
    ],
    sovereigntyRule:
      "Pantavion Compass must be OSM-first and progressively owned. Paid map providers are exceptions, not the core."
  },
  {
    id: "pantavion-analytics-core",
    name: "Pantavion Analytics Core",
    layer: "analytics",
    mission:
      "Avoid surveillance-heavy third-party analytics by building privacy-first Pantavion-owned analytics and observability.",
    currentDependency:
      "Vercel analytics or external analytics may be avoided unless operationally necessary.",
    dependencyMode: "pantavion_owned",
    targetOwnedSystem:
      "Pantavion-owned event ledger, route health, usage metrics, error logging and privacy-safe analytics.",
    status: "foundation",
    risk: "medium",
    whatWeBuildNow: [
      "Route event schema",
      "Privacy-safe page view model",
      "No invasive tracking rule",
      "Error event ledger",
      "Performance snapshot model"
    ],
    whatWeBuildLater: [
      "Self-hosted analytics dashboard",
      "Operational observability",
      "Abuse detection signals",
      "Cost monitoring",
      "Kernel health monitor"
    ],
    forbiddenClaims: [
      "Do not track users across unrelated sites.",
      "Do not collect sensitive personal analytics without consent and purpose."
    ],
    sovereigntyRule:
      "Pantavion analytics must serve product health and safety, not surveillance."
  },
  {
    id: "pantavion-payment-boundary",
    name: "Pantavion Payment Boundary",
    layer: "payments",
    mission:
      "Use payment providers safely while keeping commercial policy, pricing, subscription lifecycle, refunds and restricted-category rules inside Pantavion.",
    currentDependency:
      "Stripe or other payment provider may be used for hosted checkout only after commercial/legal gate.",
    dependencyMode: "provider_boundary",
    targetOwnedSystem:
      "Pantavion commercial policy, pricing registry, refund logic, subscription lifecycle, invoice responsibility model and restricted business review.",
    status: "blocked",
    risk: "critical",
    whatWeBuildNow: [
      "Stripe readiness gate",
      "Commercial policy",
      "Refund policy",
      "Subscription lifecycle",
      "Restricted goods/services registry",
      "No raw card handling rule"
    ],
    whatWeBuildLater: [
      "Merchant of record review",
      "Marketplace payout model",
      "KYC/KYB provider boundary",
      "Tax and invoicing workflow",
      "Fraud review console"
    ],
    forbiddenClaims: [
      "Do not launch live charging before legal/commercial gate.",
      "Do not handle raw card data.",
      "Do not enable marketplace payouts before KYC/KYB model."
    ],
    sovereigntyRule:
      "Payment rails can be third-party for compliance, but Pantavion owns the commercial rules and must not expose uncontrolled financial risk."
  },
  {
    id: "pantavion-security-kernel",
    name: "Pantavion Security Kernel",
    layer: "security",
    mission:
      "Create defense-in-depth controls across identity, admin, API, rate limits, logs, secrets, incident response and recovery.",
    currentDependency:
      "Platform hosting and framework security features are useful but not sufficient.",
    dependencyMode: "pantavion_owned",
    targetOwnedSystem:
      "Pantavion-owned security control ledger, audit logs, admin protection, incident response, kill switch and recovery governance.",
    status: "foundation",
    risk: "critical",
    whatWeBuildNow: [
      "Security control ledger",
      "Admin route protection plan",
      "Rate limit policy",
      "Secret handling rule",
      "Audit log schema",
      "Incident response states"
    ],
    whatWeBuildLater: [
      "MFA",
      "Role-based access control",
      "API abuse shield",
      "Bot defense",
      "Dependency scanning",
      "Backup and restore drills",
      "Vulnerability disclosure process"
    ],
    forbiddenClaims: [
      "Do not claim unbreakable security.",
      "Do not expose admin controls without RBAC and audit.",
      "Do not store secrets in frontend code."
    ],
    sovereigntyRule:
      "Pantavion must never depend on hope. Security is a governed kernel layer."
  },
  {
    id: "pantavion-media-rights-core",
    name: "Pantavion Media Rights Core",
    layer: "media",
    mission:
      "Prepare Pantavion media, radio, alerts and creator surfaces with copyright, verification, consent and official alert boundaries.",
    currentDependency:
      "Third-party platforms may be used for distribution but not as the core truth layer.",
    dependencyMode: "hybrid_transition",
    targetOwnedSystem:
      "Pantavion-owned media registry, rights ledger, official alert channels, AI voice consent and source verification workflow.",
    status: "foundation",
    risk: "high",
    whatWeBuildNow: [
      "Media type registry",
      "Official alert boundary",
      "AI-generated label rules",
      "Voice consent rule",
      "News/opinion/ad/user submission labels",
      "Copyright review status"
    ],
    whatWeBuildLater: [
      "Pantavion radio",
      "Creator studio",
      "Verified civic channels",
      "Emergency broadcast integrations",
      "Archive rights ledger"
    ],
    forbiddenClaims: [
      "Do not allow normal users to issue official emergency alerts.",
      "Do not broadcast copyrighted media without rights.",
      "Do not use AI voice cloning without consent."
    ],
    sovereigntyRule:
      "Pantavion can host media, but official alerts and rights must be governed before public expansion."
  },
  {
    id: "pantavion-storage-compute",
    name: "Pantavion Storage and Compute",
    layer: "infrastructure",
    mission:
      "Start with managed infrastructure where needed, then progressively move toward Pantavion-owned servers, backups, storage and compute control.",
    currentDependency:
      "Vercel and managed databases are acceptable in early phase for deployment speed.",
    dependencyMode: "hybrid_transition",
    targetOwnedSystem:
      "Pantavion-owned deployment pipeline, self-managed databases, object storage, backups, restore, private compute and future data center strategy.",
    status: "foundation",
    risk: "high",
    whatWeBuildNow: [
      "Infrastructure dependency ledger",
      "Backup policy",
      "Export policy",
      "Environment variable discipline",
      "Cost control register",
      "Provider exit plan"
    ],
    whatWeBuildLater: [
      "Self-managed servers",
      "Private object storage",
      "Cold storage",
      "Multi-region failover",
      "Own deployment runners",
      "Data center roadmap"
    ],
    forbiddenClaims: [
      "Do not claim own data centers before they exist.",
      "Do not build without backups and exit paths."
    ],
    sovereigntyRule:
      "Managed infrastructure is a bridge. Pantavion must always keep an exit path and owned-control roadmap."
  }
];

export const pantavionSovereigntyDoctrine = {
  title: "Pantavion Sovereign Infrastructure Doctrine",
  summary:
    "Pantavion must become a Pantavion-owned ecosystem. Third-party providers are temporary adapters, compliance rails, or infrastructure bridges only where necessary.",
  visibleUserRule:
    "Users see PantaAI, Pantavion Kernel, Pantavion Communication, Pantavion Compass and Pantavion-owned surfaces. They do not see provider dependency as the identity of the product.",
  providerRule:
    "Third-party providers must not become the strategic brain, memory, communication identity, or governance authority of Pantavion.",
  costRule:
    "Every provider must have a cost reason, replacement path, privacy boundary and shutdown strategy.",
  legalRule:
    "Pantavion may reduce third-party dependency, but it must not bypass law, consent, KYC/KYB, payments compliance, privacy law or emergency authority boundaries.",
  kernelRule:
    "The Pantavion Kernel owns routing, policy, memory, execution, safety, audit and provider abstraction."
};

export const pantavionInfrastructureStats = {
  totalSystems: pantavionInternalInfrastructureRegistry.length,
  criticalSystems: pantavionInternalInfrastructureRegistry.filter(
    (item) => item.risk === "critical"
  ).length,
  pantavionOwnedNow: pantavionInternalInfrastructureRegistry.filter(
    (item) => item.dependencyMode === "pantavion_owned"
  ).length,
  hybridTransition: pantavionInternalInfrastructureRegistry.filter(
    (item) => item.dependencyMode === "hybrid_transition"
  ).length,
  blockedSystems: pantavionInternalInfrastructureRegistry.filter(
    (item) => item.status === "blocked"
  ).length
};
