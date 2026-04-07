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
  geographyScope: "global" | "regional";
  languageScope: "multilingual" | "single-language" | "expandable";
  sourcePattern: string;
  priority: "critical" | "high" | "medium";
};

export const pantavionSignalSeeds: PantavionSignalSeed[] = [
  {
    id: "freelance-income-strategy",
    title: "Freelance income systems",
    domain: "business",
    category: "income-strategy",
    summary:
      "Frameworks around positioning, offer design, visibility, client trust, boundaries, execution rhythm and turning skills into consistent income.",
    userNeeds: [
      "find clients",
      "improve positioning",
      "increase income consistency",
      "package offers",
      "weekly execution discipline"
    ],
    monetizationPaths: [
      "professional subscriptions",
      "service marketplace",
      "freelancer toolkits",
      "coaching templates",
      "client acquisition workflows"
    ],
    moduleTargets: ["Compass", "People", "Mind", "Create", "Tools Hub"],
    nativeCandidates: [
      "offer builder",
      "positioning workspace",
      "client pipeline board",
      "pricing assistant",
      "proposal templates"
    ],
    connectorCandidates: [
      "calendar",
      "payments",
      "CRM",
      "invoicing",
      "email automation"
    ],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "infographic / creator-business strategy",
    priority: "high"
  },
  {
    id: "voice-agents-sales-ops",
    title: "Voice agents and AI call handling",
    domain: "voice",
    category: "voice-agents",
    summary:
      "AI voice bots, outbound and inbound call handling, qualification flows, sales scaling and 24/7 phone automation.",
    userNeeds: [
      "handle calls at scale",
      "qualify leads automatically",
      "multilingual voice support",
      "reduce support load",
      "increase business conversion"
    ],
    monetizationPaths: [
      "voice subscriptions",
      "per-minute voice revenue",
      "business automation plans",
      "enterprise call workflows"
    ],
    moduleTargets: ["Voice", "Compass", "Tools Hub", "Business Layer"],
    nativeCandidates: [
      "voice agent builder",
      "call flow router",
      "multilingual lead qualifier",
      "voice transcript intelligence"
    ],
    connectorCandidates: [
      "telephony providers",
      "CRM",
      "calendar",
      "ticketing",
      "analytics"
    ],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "voice AI promo / sales automation",
    priority: "critical"
  },
  {
    id: "ai-tools-catalogs",
    title: "AI tools catalogs and discovery maps",
    domain: "tools",
    category: "tool-discovery",
    summary:
      "Lists of AI tools grouped by category such as writing, design, research, coding, automation, productivity and marketing.",
    userNeeds: [
      "discover useful tools",
      "compare tools by category",
      "find best-fit stack",
      "avoid tool chaos",
      "learn what to use for each goal"
    ],
    monetizationPaths: [
      "tool marketplace",
      "premium discovery filters",
      "affiliate-safe partnerships",
      "workflow bundles",
      "sponsored governed placements"
    ],
    moduleTargets: ["Tools Hub", "Mind", "Create", "PantaLearn"],
    nativeCandidates: [
      "tool comparison engine",
      "goal-based recommendations",
      "stack builder",
      "workflow starter kits"
    ],
    connectorCandidates: [
      "OpenAI",
      "Anthropic",
      "Google",
      "Canva",
      "Notion",
      "n8n",
      "Zapier"
    ],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "tool list / creator carousel / AI ecosystem map",
    priority: "critical"
  },
  {
    id: "company-operating-systems",
    title: "Company operating systems and execution frameworks",
    domain: "business",
    category: "management-frameworks",
    summary:
      "Business operating systems like EOS, OKRs, RACI, scorecards and structured execution frameworks for companies and teams.",
    userNeeds: [
      "run teams better",
      "align strategy with execution",
      "improve accountability",
      "track business health",
      "clarify roles and priorities"
    ],
    monetizationPaths: [
      "business workspaces",
      "team subscriptions",
      "execution dashboards",
      "consulting packages"
    ],
    moduleTargets: ["Compass", "Mind", "Business Layer", "Tools Hub"],
    nativeCandidates: [
      "OKR workspace",
      "RACI planner",
      "scorecard dashboards",
      "team operating system templates"
    ],
    connectorCandidates: [
      "spreadsheets",
      "project management",
      "calendar",
      "docs",
      "BI tools"
    ],
    geographyScope: "global",
    languageScope: "expandable",
    sourcePattern: "management framework infographic",
    priority: "high"
  },
  {
    id: "software-idea-to-build",
    title: "Software idea to product execution",
    domain: "software",
    category: "app-building",
    summary:
      "User demand around turning software ideas into apps, prototypes, product specs and implementation workflows.",
    userNeeds: [
      "validate product ideas",
      "turn concepts into apps",
      "get specs and code",
      "prototype quickly",
      "move from idea to execution"
    ],
    monetizationPaths: [
      "build workspaces",
      "app generator plans",
      "prototype subscriptions",
      "service marketplace"
    ],
    moduleTargets: ["Create", "Tools Hub", "Mind", "Kernel"],
    nativeCandidates: [
      "blueprint engine",
      "spec generator",
      "app planning workspace",
      "build readiness scoring"
    ],
    connectorCandidates: [
      "GitHub",
      "Vercel",
      "Figma",
      "DB providers",
      "cloud services"
    ],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "app-building ad / software idea funnel",
    priority: "critical"
  },
  {
    id: "data-science-learning-map",
    title: "Data science and AI learning maps",
    domain: "data",
    category: "guided-mastery",
    summary:
      "Structured maps for Python, SQL, statistics, EDA, ML, deep learning, NLP and generative AI learning progression.",
    userNeeds: [
      "learn in the right order",
      "understand career paths",
      "master fundamentals",
      "build practical projects",
      "connect study to income"
    ],
    monetizationPaths: [
      "learning subscriptions",
      "premium pathways",
      "certification surfaces",
      "career maps",
      "mentor matching"
    ],
    moduleTargets: ["PantaLearn", "Mind", "People", "Tools Hub"],
    nativeCandidates: [
      "learning path engine",
      "skill graph",
      "weak-spot detector",
      "guided drills",
      "career-to-income maps"
    ],
    connectorCandidates: [
      "docs",
      "notebooks",
      "video platforms",
      "assessment tools"
    ],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "education roadmap / career learning infographic",
    priority: "high"
  },
  {
    id: "ai-certification-bundles",
    title: "AI certification bundles and category-based tool packs",
    domain: "learning",
    category: "certification-and-bundles",
    summary:
      "Collections of tools grouped by writing, design, coding, research, automation and job search around certification or guided mastery funnels.",
    userNeeds: [
      "learn categories of tools",
      "prove competence",
      "follow curated bundles",
      "reduce tool overwhelm"
    ],
    monetizationPaths: [
      "certification fees",
      "premium curricula",
      "bundle memberships",
      "partner marketplaces"
    ],
    moduleTargets: ["PantaLearn", "Tools Hub", "Mind"],
    nativeCandidates: [
      "bundle builder",
      "tool track certification",
      "guided category maps"
    ],
    connectorCandidates: [
      "course systems",
      "assessment engines",
      "docs",
      "community platforms"
    ],
    geographyScope: "global",
    languageScope: "multilingual",
    sourcePattern: "AI category poster / certification funnel",
    priority: "medium"
  }
];
