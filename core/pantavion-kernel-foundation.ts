export type KernelInputKind =
  | "tool"
  | "ai_tool"
  | "voice_agent"
  | "freelance_income_system"
  | "company_operating_system"
  | "business_framework"
  | "software_builder"
  | "education_system"
  | "data_ml_map"
  | "workflow"
  | "catalog_signal"
  | "unknown";

export type KernelModule =
  | "kernel"
  | "people"
  | "pulse"
  | "chat"
  | "voice"
  | "compass"
  | "mind"
  | "create"
  | "learn"
  | "workspaces"
  | "registry"
  | "commerce"
  | "audio_network"
  | "governance"
  | "ads_center";

export type UserSegment =
  | "public_user"
  | "learner"
  | "creator"
  | "freelancer"
  | "developer"
  | "operator"
  | "business"
  | "institution"
  | "admin";

export type ProductizationTarget =
  | "native_feature"
  | "connector"
  | "catalog"
  | "course"
  | "workflow";

export type GovernanceLevel = "low" | "medium" | "high";

export interface KernelFlags {
  incomeRelated: boolean;
  learningRelated: boolean;
  toolDiscovery: boolean;
  businessFramework: boolean;
}

export interface RegistryCandidate {
  shouldRegister: boolean;
  family: string;
  slug: string;
}

export interface GovernanceDecision {
  level: GovernanceLevel;
  blocked: boolean;
  reasons: string[];
}

export interface KernelConclusion {
  input: string;
  normalizedInput: string;
  inputKind: KernelInputKind;
  primaryModule: KernelModule;
  secondaryModules: KernelModule[];
  userSegments: UserSegment[];
  flags: KernelFlags;
  target: ProductizationTarget;
  confidence: number;
  summary: string;
  cleanConclusion: string;
  governance: GovernanceDecision;
  registryCandidate: RegistryCandidate;
  memoryKey: string;
  evidence: string[];
  nextActions: string[];
}

export interface KernelPlanStep {
  id: string;
  title: string;
  owner: "kernel" | "memory" | "registry" | "planner" | "runner" | "governance";
  status: "pending";
  output: string;
}

export interface KernelPlan {
  version: string;
  steps: KernelPlanStep[];
}

export interface KernelFoundationSnapshot {
  foundationVersion: string;
  constitutionVersion: string;
  memoryModel: string;
  planningMode: string;
  governanceMode: string;
  targetModel: string[];
}

const FOUNDATION_VERSION = "kernel-foundation-v1";
const CONSTITUTION_VERSION = "constitution-loader-v1";

const INPUT_KIND_KEYWORDS: Record<KernelInputKind, string[]> = {
  tool: ["tool", "software", "platform", "app", "application", "service", "saas", "program"],
  ai_tool: ["ai tool", "assistant", "model", "llm", "agentic", "generative ai", "genai"],
  voice_agent: ["voice agent", "speech", "stt", "tts", "call agent", "phone agent", "voice bot", "interpreter"],
  freelance_income_system: ["freelance", "gig", "income", "earn", "monetize", "client work", "marketplace jobs"],
  company_operating_system: ["company os", "operating system", "erp", "crm", "okr", "ops", "backoffice", "workspace"],
  business_framework: ["framework", "okr", "kpi", "strategy", "execution system", "playbook", "operating model"],
  software_builder: ["builder", "app builder", "website builder", "no-code", "low-code", "code generation", "dev platform"],
  education_system: ["course", "academy", "curriculum", "lesson", "learn", "training", "guided mastery", "education"],
  data_ml_map: ["data science", "machine learning", "ml", "mlops", "analytics", "dataset", "feature engineering"],
  workflow: ["workflow", "automation", "pipeline", "process", "orchestrate", "sequence", "playbook"],
  catalog_signal: ["directory", "catalog", "marketplace", "discovery", "listing", "hub", "compare tools"],
  unknown: [],
};

const MODULE_KEYWORDS: Record<KernelModule, string[]> = {
  kernel: ["kernel", "constitution", "foundation", "governance", "orchestrator", "planner", "registry", "memory"],
  people: ["people", "contacts", "identity", "profiles", "social graph", "community"],
  pulse: ["pulse", "feed", "news", "timeline", "broadcast"],
  chat: ["chat", "messaging", "conversation", "e2ee", "inbox"],
  voice: ["voice", "translator", "speech", "call", "interpreter", "stt", "tts"],
  compass: ["compass", "map", "maps", "location", "navigation", "discovery"],
  mind: ["mind", "knowledge", "memory", "assistant", "reasoning", "library"],
  create: ["create", "design", "video", "image", "music", "editing", "studio"],
  learn: ["learn", "academy", "course", "lesson", "training", "guided mastery"],
  workspaces: ["workspace", "builder", "coding", "excel", "cad", "gis", "python", "java"],
  registry: ["catalog", "registry", "directory", "tool discovery", "marketplace", "ecosystem"],
  commerce: ["payment", "billing", "subscription", "pricing", "revenue", "freelance", "income"],
  audio_network: ["radio", "audio network", "broadcast", "spoken news", "stream"],
  governance: ["policy", "safety", "audit", "moderation", "approval", "risk", "legal"],
  ads_center: ["classifieds", "ads center", "listing ads", "promoted listings"],
};

const SEGMENT_KEYWORDS: Record<UserSegment, string[]> = {
  public_user: ["everyone", "public", "consumer", "citizen", "user"],
  learner: ["student", "learn", "education", "course", "training", "beginner"],
  creator: ["creator", "designer", "writer", "video", "artist", "content"],
  freelancer: ["freelance", "gig", "client", "income", "jobs"],
  developer: ["developer", "engineer", "code", "api", "sdk", "programming"],
  operator: ["operator", "manager", "ops", "workflow", "team lead"],
  business: ["company", "business", "sales", "crm", "erp", "team", "executive"],
  institution: ["government", "university", "hospital", "institution", "school"],
  admin: ["admin", "moderation", "audit", "compliance", "governance"],
};

const INCOME_KEYWORDS = [
  "income",
  "revenue",
  "billing",
  "pricing",
  "subscription",
  "freelance",
  "marketplace jobs",
  "earn",
  "monetize",
  "sales",
];

const LEARNING_KEYWORDS = [
  "learn",
  "lesson",
  "course",
  "curriculum",
  "training",
  "academy",
  "guide",
  "tutorial",
  "guided mastery",
];

const DISCOVERY_KEYWORDS = [
  "discover",
  "discovery",
  "directory",
  "catalog",
  "hub",
  "marketplace",
  "compare",
  "alternatives",
  "find tools",
  "tool map",
];

const BUSINESS_FRAMEWORK_KEYWORDS = [
  "framework",
  "okr",
  "kpi",
  "execution",
  "operating model",
  "company os",
  "crm",
  "erp",
  "playbook",
  "strategy",
];

const CONNECTOR_KEYWORDS = [
  "connect",
  "connector",
  "integration",
  "sync",
  "import",
  "export",
  "api",
  "oauth",
  "webhook",
  "plugin",
];

const COURSE_KEYWORDS = [
  "course",
  "lesson",
  "curriculum",
  "training path",
  "guided mastery",
  "academy",
  "learn",
];

const CATALOG_KEYWORDS = [
  "catalog",
  "directory",
  "marketplace",
  "discover",
  "list tools",
  "compare tools",
  "hub",
];

const WORKFLOW_KEYWORDS = [
  "workflow",
  "automation",
  "pipeline",
  "process",
  "orchestrate",
  "playbook",
  "sequence",
];

const NATIVE_FEATURE_KEYWORDS = [
  "native",
  "built in",
  "inside pantavion",
  "real-time",
  "voice",
  "chat",
  "memory",
  "planner",
  "registry",
  "dashboard",
];

const HIGH_GOVERNANCE_KEYWORDS = [
  "face recognition",
  "biometric",
  "medical",
  "health",
  "government",
  "children",
  "payments",
  "financial",
  "admin",
  "surveillance",
];

const MEDIUM_GOVERNANCE_KEYWORDS = [
  "user data",
  "contacts",
  "location",
  "voice data",
  "moderation",
  "identity",
  "school",
  "enterprise",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s\-_/]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function scoreMap<T extends string>(text: string, map: Record<T, string[]>): Array<{ key: T; score: number }> {
  const rows = Object.entries(map as Record<string, string[]>).map(([key, words]: [string, string[]]) => {
    let score = 0;
    for (const word of words) {
      if (text.includes(word)) score += word.includes(" ") ? 3 : 1;
    }
    return { key: key as T, score };
  });
  return rows.sort((a, b) => b.score - a.score);
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function pickInputKind(text: string): { kind: KernelInputKind; evidence: string[]; confidence: number } {
  const ranked = scoreMap(text, INPUT_KIND_KEYWORDS).filter((row) => row.score > 0);
  if (!ranked.length) {
    return {
      kind: "unknown",
      evidence: ["No strong input-kind keyword cluster matched."],
      confidence: 0.28,
    };
  }

  const top = ranked[0];
  const confidence = Math.min(0.95, 0.4 + top.score * 0.08);

  return {
    kind: top.key,
    evidence: [`Input kind matched strongest keyword cluster: ${top.key}.`],
    confidence,
  };
}

function pickModules(text: string): { primary: KernelModule; secondary: KernelModule[]; evidence: string[] } {
  const ranked = scoreMap(text, MODULE_KEYWORDS).filter((row) => row.score > 0);
  if (!ranked.length) {
    return {
      primary: "kernel",
      secondary: ["registry", "governance"],
      evidence: ["No strong module match. Defaulted to kernel foundation path."],
    };
  }

  const primary = ranked[0].key;
  const secondary = ranked
    .slice(1)
    .filter((row) => row.score > 0)
    .map((row) => row.key)
    .slice(0, 3);

  return {
    primary,
    secondary,
    evidence: [`Primary module matched: ${primary}.`],
  };
}

function pickSegments(text: string): { segments: UserSegment[]; evidence: string[] } {
  const ranked = scoreMap(text, SEGMENT_KEYWORDS)
    .filter((row) => row.score > 0)
    .map((row) => row.key);

  const segments: UserSegment[] = ranked.length ? ranked.slice(0, 3) : ["public_user" as UserSegment];
  return {
    segments,
    evidence: [`User segments inferred: ${segments.join(", ")}.`],
  };
}

function pickFlags(text: string): KernelFlags {
  return {
    incomeRelated: hasAny(text, INCOME_KEYWORDS),
    learningRelated: hasAny(text, LEARNING_KEYWORDS),
    toolDiscovery: hasAny(text, DISCOVERY_KEYWORDS),
    businessFramework: hasAny(text, BUSINESS_FRAMEWORK_KEYWORDS),
  };
}

function pickTarget(text: string, flags: KernelFlags): { target: ProductizationTarget; evidence: string[] } {
  const scores: Record<ProductizationTarget, number> = {
    native_feature: 0,
    connector: 0,
    catalog: 0,
    course: 0,
    workflow: 0,
  };

  if (hasAny(text, CONNECTOR_KEYWORDS)) scores.connector += 4;
  if (hasAny(text, CATALOG_KEYWORDS) || flags.toolDiscovery) scores.catalog += 4;
  if (hasAny(text, COURSE_KEYWORDS) || flags.learningRelated) scores.course += 4;
  if (hasAny(text, WORKFLOW_KEYWORDS)) scores.workflow += 4;
  if (hasAny(text, NATIVE_FEATURE_KEYWORDS)) scores.native_feature += 4;

  if (flags.incomeRelated) scores.workflow += 1;
  if (flags.businessFramework) scores.workflow += 2;

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const winner = ranked[0];

  if (!winner || winner[1] === 0) {
    return {
      target: "native_feature",
      evidence: ["No strong packaging signal. Defaulted to native feature."],
    };
  }

  return {
    target: winner[0] as ProductizationTarget,
    evidence: [`Packaging target matched strongest score: ${winner[0]}.`],
  };
}

function pickGovernance(text: string): GovernanceDecision {
  const reasons: string[] = [];

  if (hasAny(text, HIGH_GOVERNANCE_KEYWORDS)) {
    reasons.push("Contains high-risk or regulated domain signals.");
    return { level: "high", blocked: false, reasons };
  }

  if (hasAny(text, MEDIUM_GOVERNANCE_KEYWORDS)) {
    reasons.push("Contains user-data or operational-risk signals.");
    return { level: "medium", blocked: false, reasons };
  }

  reasons.push("No major regulated or sensitive signal detected.");
  return { level: "low", blocked: false, reasons };
}

function pickRegistryFamily(kind: KernelInputKind, target: ProductizationTarget): string {
  if (target === "course") return "guided-mastery";
  if (target === "catalog") return "discovery-catalog";
  if (target === "connector") return "integration-layer";
  if (target === "workflow") return "execution-workflows";

  switch (kind) {
    case "voice_agent":
      return "voice-systems";
    case "freelance_income_system":
      return "income-systems";
    case "company_operating_system":
      return "company-os";
    case "business_framework":
      return "business-frameworks";
    case "software_builder":
      return "builder-platforms";
    case "education_system":
      return "learning-systems";
    case "data_ml_map":
      return "data-ml-maps";
    case "ai_tool":
      return "ai-tools";
    case "tool":
      return "software-tools";
    default:
      return "kernel-signals";
  }
}

function buildSummary(
  inputKind: KernelInputKind,
  primaryModule: KernelModule,
  target: ProductizationTarget,
  flags: KernelFlags,
  segments: UserSegment[],
): string {
  const bits = [
    `Detected as ${inputKind}`,
    `belongs primarily to ${primaryModule}`,
    `best packaged as ${target}`,
    `affects ${segments.join(", ")}`,
  ];

  if (flags.incomeRelated) bits.push("income-related");
  if (flags.learningRelated) bits.push("learning-related");
  if (flags.toolDiscovery) bits.push("tool-discovery");
  if (flags.businessFramework) bits.push("business-framework");

  return bits.join(" | ");
}

export function analyzePantavionKernelInput(input: string): KernelConclusion {
  const normalizedInput = normalize(input);

  const kind = pickInputKind(normalizedInput);
  const modules = pickModules(normalizedInput);
  const segments = pickSegments(normalizedInput);
  const flags = pickFlags(normalizedInput);
  const target = pickTarget(normalizedInput, flags);
  const governance = pickGovernance(normalizedInput);

  const registryFamily = pickRegistryFamily(kind.kind, target.target);
  const slug = toSlug(input || normalizedInput || "kernel-item");
  const summary = buildSummary(kind.kind, modules.primary, target.target, flags, segments.segments);
  const memoryKey = `pantavion/${modules.primary}/${target.target}/${slug}`;

  const evidence = [
    ...kind.evidence,
    ...modules.evidence,
    ...segments.evidence,
    ...target.evidence,
    `Governance level decided as ${governance.level}.`,
  ];

  const nextActions: string[] = [
    "Store normalized intake in canonical memory.",
    "Register candidate in capability registry.",
    "Create planner brief for human review.",
    "Mark governance lane before execution.",
  ];

  if (target.target === "connector") nextActions.push("Design sync/auth/provider contract.");
  if (target.target === "catalog") nextActions.push("Create taxonomy, filters, comparison fields.");
  if (target.target === "course") nextActions.push("Create mastery path, lessons, drills, assessments.");
  if (target.target === "workflow") nextActions.push("Define deterministic stages, inputs, outputs, audit logs.");
  if (target.target === "native_feature") nextActions.push("Define UX surface, data model, permissions, rollout flag.");

  const cleanConclusion =
    `Conclusion: This input is best treated as ${target.target} under ${modules.primary}. ` +
    `Primary audience: ${segments.segments.join(", ")}. ` +
    `Flags => income:${flags.incomeRelated ? "yes" : "no"}, learning:${flags.learningRelated ? "yes" : "no"}, ` +
    `tool-discovery:${flags.toolDiscovery ? "yes" : "no"}, business-framework:${flags.businessFramework ? "yes" : "no"}.`;

  return {
    input,
    normalizedInput,
    inputKind: kind.kind,
    primaryModule: modules.primary,
    secondaryModules: modules.secondary,
    userSegments: segments.segments,
    flags,
    target: target.target,
    confidence: Number(kind.confidence.toFixed(2)),
    summary,
    cleanConclusion,
    governance,
    registryCandidate: {
      shouldRegister: true,
      family: registryFamily,
      slug,
    },
    memoryKey,
    evidence,
    nextActions,
  };
}

export function buildPantavionKernelPlan(conclusion: KernelConclusion): KernelPlan {
  return {
    version: "kernel-plan-v1",
    steps: [
      {
        id: "intake-normalize",
        title: "Normalize intake",
        owner: "kernel",
        status: "pending",
        output: conclusion.memoryKey,
      },
      {
        id: "memory-write",
        title: "Write canonical memory record",
        owner: "memory",
        status: "pending",
        output: conclusion.memoryKey,
      },
      {
        id: "registry-register",
        title: "Register capability candidate",
        owner: "registry",
        status: "pending",
        output: `${conclusion.registryCandidate.family}/${conclusion.registryCandidate.slug}`,
      },
      {
        id: "planner-brief",
        title: "Generate execution brief",
        owner: "planner",
        status: "pending",
        output: conclusion.target,
      },
      {
        id: "governance-check",
        title: "Apply governance lane",
        owner: "governance",
        status: "pending",
        output: conclusion.governance.level,
      },
      {
        id: "runner-ready",
        title: "Prepare runner envelope",
        owner: "runner",
        status: "pending",
        output: conclusion.primaryModule,
      },
    ],
  };
}

export function getPantavionKernelFoundation(): KernelFoundationSnapshot {
  return {
    foundationVersion: FOUNDATION_VERSION,
    constitutionVersion: CONSTITUTION_VERSION,
    memoryModel: "canonical-memory-v1",
    planningMode: "deterministic-first",
    governanceMode: "lane-based",
    targetModel: ["native_feature", "connector", "catalog", "course", "workflow"],
  };
}


