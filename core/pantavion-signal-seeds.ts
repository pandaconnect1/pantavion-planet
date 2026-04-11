export type PantavionSignalSeed = {
  id: string;
  title: string;
  domain:
    | "business"
    | "voice"
    | "tools"
    | "learning"
    | "software"
    | "data"
    | "automation"
    | "research";
  category: string;
  summary: string;
  userNeeds: string[];
  monetizationPaths: string[];
  moduleTargets: string[];
  nativeCandidates: string[];
  connectorCandidates: string[];
  userSegments: string[];
  geographyScope: "global" | "regional";
  languageScope: "multilingual" | "single-language" | "expandable";
  sourcePattern: string;
  priority: "critical" | "high" | "medium";
};

export const pantavionSignalSeeds: PantavionSignalSeed[] = [
  {
    id: "freelance-income-systems",
    title: "Freelance income systems",
    domain: "business",
    category: "income-strategy",
    summary:
      "Positioning, offers, client acquisition, pricing, trust, execution rhythm and converting skills into recurring income.",
    userNeeds: [
      "find clients",
      "increase income",
      "price offers",
      "build service business",
      "client pipeline"
    ],
    monetizationPaths: [
      "professional subscriptions",
      "service marketplace",
      "freelancer toolkits",
      "proposal systems"
    ],
    moduleTargets: ["Compass", "People", "Mind", "Create", "Tools Hub"],
    nativeCandidates: [
      "offer builder",
      "pricing workspace",
      "client pipeline board",
      "proposal generator"
    ],
    connectorCandidates: ["calendar", "payments", "crm", "email", "invoicing"],
    userSegments: ["freelancers", "solopreneurs", "consultants", "small-business owners"],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "business infographic / creator strategy",
    priority: "high"
  },
  {
    id: "voice-agents",
    title: "Voice agents and AI call handling",
    domain: "voice",
    category: "voice-agents",
    summary:
      "Inbound and outbound voice automation, multilingual call handling, lead qualification, support, scheduling and telephony intelligence.",
    userNeeds: [
      "handle calls",
      "book appointments",
      "qualify leads",
      "reduce support load",
      "multilingual voice support"
    ],
    monetizationPaths: [
      "voice subscriptions",
      "per-minute usage",
      "business automation plans",
      "enterprise workflows"
    ],
    moduleTargets: ["Voice", "Compass", "Business Layer", "Tools Hub"],
    nativeCandidates: [
      "voice agent builder",
      "call flow router",
      "lead qualification engine",
      "voice transcript intelligence"
    ],
    connectorCandidates: ["telephony", "crm", "calendar", "helpdesk", "analytics"],
    userSegments: ["businesses", "sales teams", "support teams", "operators"],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "voice AI promo / sales automation",
    priority: "critical"
  },
  {
    id: "ai-tools-discovery",
    title: "AI tools catalogs and discovery maps",
    domain: "tools",
    category: "tool-discovery",
    summary:
      "Discovery, comparison and structured mapping of AI tools across writing, coding, design, research, automation and productivity.",
    userNeeds: [
      "find best tools",
      "compare tools",
      "build workflows",
      "avoid tool chaos",
      "discover categories"
    ],
    monetizationPaths: [
      "tool marketplace",
      "premium discovery filters",
      "workflow bundles",
      "governed sponsored placements"
    ],
    moduleTargets: ["Tools Hub", "Mind", "Create", "PantaLearn"],
    nativeCandidates: [
      "tool comparison engine",
      "stack recommender",
      "goal-based tool search",
      "workflow starter kits"
    ],
    connectorCandidates: ["openai", "anthropic", "google", "canva", "notion", "zapier", "n8n"],
    userSegments: ["creators", "builders", "students", "professionals"],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "AI tools map / marketplace / carousel",
    priority: "critical"
  },
  {
    id: "company-operating-systems",
    title: "Company operating systems and execution frameworks",
    domain: "business",
    category: "business-framework",
    summary:
      "OKRs, scorecards, RACI, operating cadence, accountability frameworks and structured company execution systems.",
    userNeeds: [
      "run teams better",
      "align strategy",
      "track performance",
      "clarify ownership",
      "improve execution"
    ],
    monetizationPaths: [
      "team subscriptions",
      "business workspaces",
      "operating system templates",
      "consulting packages"
    ],
    moduleTargets: ["Compass", "Mind", "Business Layer", "Tools Hub"],
    nativeCandidates: [
      "okr workspace",
      "scorecard dashboard",
      "raci planner",
      "team operating system board"
    ],
    connectorCandidates: ["spreadsheets", "project-management", "docs", "calendar", "bi-tools"],
    userSegments: ["companies", "managers", "operators", "founders"],
    geographyScope: "global",
    languageScope: "expandable",
    sourcePattern: "management framework chart",
    priority: "high"
  },
  {
    id: "software-build-systems",
    title: "Software idea to product execution",
    domain: "software",
    category: "app-building",
    summary:
      "Transforming ideas into product specs, code, schemas, deployments, admin panels and complete software systems.",
    userNeeds: [
      "build app",
      "generate code",
      "create architecture",
      "move idea to product",
      "ship faster"
    ],
    monetizationPaths: [
      "builder workspaces",
      "app generator plans",
      "prototype subscriptions",
      "service marketplace"
    ],
    moduleTargets: ["Create", "Kernel", "Mind", "Tools Hub"],
    nativeCandidates: [
      "blueprint engine",
      "spec generator",
      "schema generator",
      "build readiness scoring"
    ],
    connectorCandidates: ["github", "vercel", "figma", "postgres", "cloud providers"],
    userSegments: ["developers", "founders", "agencies", "product teams"],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "app builder funnel / software workflow",
    priority: "critical"
  },
  {
    id: "guided-mastery-learning",
    title: "Guided mastery and learning maps",
    domain: "learning",
    category: "guided-mastery",
    summary:
      "Structured learning paths for AI, software, data science, productivity and career growth.",
    userNeeds: [
      "learn correctly",
      "follow roadmap",
      "improve skills",
      "prepare for work",
      "connect learning to income"
    ],
    monetizationPaths: [
      "learning subscriptions",
      "certification",
      "career tracks",
      "mentor matching"
    ],
    moduleTargets: ["PantaLearn", "Mind", "People", "Tools Hub"],
    nativeCandidates: [
      "learning path engine",
      "skills graph",
      "guided drills",
      "career-to-income maps"
    ],
    connectorCandidates: ["course platforms", "assessment tools", "docs", "video tools"],
    userSegments: ["students", "career switchers", "professionals", "creators"],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "learning roadmap / education infographic",
    priority: "high"
  },
  {
    id: "data-science-ml-maps",
    title: "Data science and ML maps",
    domain: "data",
    category: "data-ml-map",
    summary:
      "Python, SQL, EDA, statistics, ML, deep learning, MLOps and data career maps.",
    userNeeds: [
      "learn python",
      "learn sql",
      "understand ml",
      "follow data path",
      "build practical projects"
    ],
    monetizationPaths: [
      "premium pathways",
      "certification",
      "project packs",
      "career maps"
    ],
    moduleTargets: ["PantaLearn", "Mind", "Tools Hub", "Create"],
    nativeCandidates: [
      "data path planner",
      "ml roadmap engine",
      "skill gap scanner",
      "project progression map"
    ],
    connectorCandidates: ["notebooks", "datasets", "assessment tools", "course systems"],
    userSegments: ["students", "data analysts", "data scientists", "ml engineers"],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "data roadmap / ml path infographic",
    priority: "high"
  }
];
