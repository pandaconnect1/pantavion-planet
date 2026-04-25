export type ProductionStatus =
  | "LIVE"
  | "FOUNDATION"
  | "BETA"
  | "RESTRICTED"
  | "LEGAL_REVIEW"
  | "FUTURE"
  | "BLOCKED";

export type RiskClass =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type ProductFamily = {
  readonly id: string;
  readonly title: string;
  readonly status: ProductionStatus;
  readonly riskClass: RiskClass;
  readonly publicRoute: string;
  readonly summary: string;
  readonly modules: readonly string[];
  readonly mustHaveBeforeLive: readonly string[];
  readonly forbiddenUntilReady: readonly string[];
};

export const productFamilyTaxonomy = [
  {
    id: "planet",
    title: "Planet / Home",
    status: "LIVE",
    riskClass: "LOW",
    publicRoute: "/",
    summary: "Premium public entry point for Pantavion One.",
    modules: ["home", "vision", "navigation", "public baseline"],
    mustHaveBeforeLive: ["clear navigation", "no dead primary buttons"],
    forbiddenUntilReady: ["fake user counters", "unverified claims"],
  },
  {
    id: "architecture",
    title: "Master Architecture",
    status: "LIVE",
    riskClass: "MEDIUM",
    publicRoute: "/architecture",
    summary: "Unified Pantavion architecture baseline and governed ecosystem skeleton.",
    modules: ["kernel plane", "product families", "intelligence plane", "governance plane"],
    mustHaveBeforeLive: ["clear doctrine", "route visibility", "foundational boundaries"],
    forbiddenUntilReady: ["claiming implemented backend where only doctrine exists"],
  },
  {
    id: "ai-feature-register",
    title: "AI Feature Register",
    status: "LIVE",
    riskClass: "HIGH",
    publicRoute: "/ai-feature-register",
    summary: "Governed AI capability register by module and risk zone.",
    modules: ["green AI", "yellow AI", "red AI", "human oversight"],
    mustHaveBeforeLive: ["risk zones", "fallback rules", "human control for critical use"],
    forbiddenUntilReady: ["autonomous critical decisions", "silent enforcement"],
  },
  {
    id: "sos-interpreter",
    title: "SOS + Interpreter",
    status: "FOUNDATION",
    riskClass: "CRITICAL",
    publicRoute: "/sos-interpreter",
    summary: "Emergency assistance and multilingual interpreter foundation.",
    modules: ["trusted contacts", "off-grid packet", "silent SOS", "translation support"],
    mustHaveBeforeLive: ["legal disclaimer", "consent", "false alarm flow", "no authority claims without agreement"],
    forbiddenUntilReady: ["guaranteed rescue claims", "automatic authority dispatch without opt-in"],
  },
  {
    id: "access-model",
    title: "Pantavion Access Model",
    status: "LIVE",
    riskClass: "MEDIUM",
    publicRoute: "/access-model",
    summary: "Access, plans, entitlements, lifecycle and fair-use doctrine.",
    modules: ["free", "starter", "pro", "elite", "institutional"],
    mustHaveBeforeLive: ["terms alignment", "refund policy", "usage limits", "provider-cost controls"],
    forbiddenUntilReady: ["unlimited costly API promises", "unsafe lifetime guarantees"],
  },
  {
    id: "competitive-intelligence",
    title: "Competitive Intelligence",
    status: "LIVE",
    riskClass: "MEDIUM",
    publicRoute: "/intelligence/competitive",
    summary: "Market and competitor intelligence layer for lawful strategic comparison.",
    modules: ["global giants", "AI tools", "social ecosystems", "market signals"],
    mustHaveBeforeLive: ["no logo copying", "no false rankings", "legal adaptation only"],
    forbiddenUntilReady: ["copying competitor UI", "using unverified market claims as facts"],
  },
  {
    id: "kernel-audit",
    title: "Kernel Audit",
    status: "LIVE",
    riskClass: "HIGH",
    publicRoute: "/kernel/audit",
    summary: "Kernel gap, governance and production audit checkpoint.",
    modules: ["gaps", "routes", "risk", "release gates"],
    mustHaveBeforeLive: ["route audit", "risk audit", "gap registry"],
    forbiddenUntilReady: ["dead buttons", "empty sections", "silent failures"],
  },
  {
    id: "messages",
    title: "Messages / Communication",
    status: "FOUNDATION",
    riskClass: "HIGH",
    publicRoute: "/messages",
    summary: "Secure messaging and future global communication bridge.",
    modules: ["contacts", "inbox", "groups", "translation", "secure channels"],
    mustHaveBeforeLive: ["consent", "privacy", "abuse reporting", "external import legality"],
    forbiddenUntilReady: ["scraping external apps", "claiming WhatsApp/Viber/Telegram import without official route"],
  },
  {
    id: "marketplace",
    title: "Marketplace / Ads Center",
    status: "FOUNDATION",
    riskClass: "HIGH",
    publicRoute: "/market",
    summary: "Separate commercial listings and ads center outside the clean core UX.",
    modules: ["classifieds", "services", "business listings", "sponsored placements"],
    mustHaveBeforeLive: ["category taxonomy", "fraud policy", "restricted goods policy", "payment policy"],
    forbiddenUntilReady: ["regulated goods", "misleading ads", "unreviewed adult commerce"],
  },
  {
    id: "audio-radio",
    title: "Pantavion Audio / Radio",
    status: "FOUNDATION",
    riskClass: "HIGH",
    publicRoute: "/radio",
    summary: "World audio network foundation: live, archive, alerts and multilingual streams.",
    modules: ["live audio", "shows", "alerts", "submissions", "article-to-audio"],
    mustHaveBeforeLive: ["media rights", "news policy", "user submission moderation", "alert authority rules"],
    forbiddenUntilReady: ["unlicensed music", "fake breaking news", "unverified civic emergency claims"],
  },
  {
    id: "studio",
    title: "Creator Studio",
    status: "FOUNDATION",
    riskClass: "MEDIUM",
    publicRoute: "/studio",
    summary: "Creation surface for media, video, audio, writing and multilingual assets.",
    modules: ["video", "voice", "music", "dubbing", "posts"],
    mustHaveBeforeLive: ["copyright guardrails", "voice consent", "AI disclosure"],
    forbiddenUntilReady: ["voice cloning without consent", "copyright infringement"],
  },
  {
    id: "build-services",
    title: "Build Services",
    status: "FOUNDATION",
    riskClass: "MEDIUM",
    publicRoute: "/build-services",
    summary: "Professional service layer for apps, websites, workflows and implementation projects.",
    modules: ["apps", "websites", "automation", "business tools"],
    mustHaveBeforeLive: ["scope limits", "pricing", "delivery terms", "support boundaries"],
    forbiddenUntilReady: ["guaranteed outcomes", "uncapped custom work"],
  },
  {
    id: "legal",
    title: "Legal / Safety / Privacy",
    status: "FOUNDATION",
    riskClass: "CRITICAL",
    publicRoute: "/legal",
    summary: "Legal center, terms, privacy, safety and platform boundaries.",
    modules: ["terms", "privacy", "refunds", "safety", "security", "minors"],
    mustHaveBeforeLive: ["terms", "privacy", "refund policy", "minor protection", "data rights"],
    forbiddenUntilReady: ["payments without legal pages", "minor access without controls"],
  },
] as const satisfies readonly ProductFamily[];

export const productFamilySummary = {
  total: productFamilyTaxonomy.length,
  live: productFamilyTaxonomy.filter((item) => item.status === "LIVE").length,
  foundation: productFamilyTaxonomy.filter((item) => item.status === "FOUNDATION").length,
  critical: productFamilyTaxonomy.filter((item) => item.riskClass === "CRITICAL").length,
} as const;
