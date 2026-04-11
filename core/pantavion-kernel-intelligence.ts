export type KernelSourceModality =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "mixed";

export type KernelDetectedType =
  | "software_builder"
  | "tool_catalog"
  | "developer_extension_stack"
  | "ai_marketplace"
  | "voice_agent_system"
  | "education_system"
  | "business_framework"
  | "freelance_income_system"
  | "company_operating_system"
  | "data_ml_map"
  | "workflow_system"
  | "research_signal"
  | "unknown";

export type KernelPrimaryModule =
  | "kernel"
  | "workspaces"
  | "registry"
  | "learn"
  | "voice"
  | "commerce"
  | "mind"
  | "governance"
  | "create";

export type KernelTarget =
  | "native_feature"
  | "connector"
  | "catalog"
  | "course"
  | "workflow";

export type KernelEvolutionAction =
  | "build_internal_capability"
  | "register_in_catalog"
  | "create_learning_path"
  | "create_execution_workflow"
  | "add_connector"
  | "hold_for_review";

export type KernelSegment =
  | "public_user"
  | "learner"
  | "creator"
  | "developer"
  | "freelancer"
  | "business"
  | "operator"
  | "admin";

export interface KernelIntelligenceInput {
  text: string;
  modality?: KernelSourceModality;
}

export interface KernelIntelligenceFlags {
  incomeRelated: boolean;
  learningRelated: boolean;
  toolDiscovery: boolean;
  businessFramework: boolean;
  builderRelated: boolean;
  researchRelated: boolean;
  developerRelated: boolean;
}

export interface KernelGapSignal {
  isGap: boolean;
  gapKey: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
}

export interface KernelPantavionFit {
  shouldBuild: boolean;
  shouldConnect: boolean;
  shouldCatalog: boolean;
  shouldTeach: boolean;
  shouldWorkflow: boolean;
}

export interface KernelIntelligenceConclusion {
  normalizedInput: string;
  modality: KernelSourceModality;
  detectedType: KernelDetectedType;
  primaryModule: KernelPrimaryModule;
  secondaryModules: KernelPrimaryModule[];
  userSegments: KernelSegment[];
  flags: KernelIntelligenceFlags;
  target: KernelTarget;
  evolutionAction: KernelEvolutionAction;
  pantavionFit: KernelPantavionFit;
  gap: KernelGapSignal;
  confidence: number;
  cleanConclusion: string;
  strategicValue: string;
  nextMoves: string[];
  evidence: string[];
}

const TYPE_KEYWORDS: Record<KernelDetectedType, string[]> = {
  software_builder: [
    "build website",
    "build app",
    "builder",
    "website builder",
    "app builder",
    "no-code",
    "low-code",
    "generate app",
    "generate website",
    "base44",
  ],
  tool_catalog: [
    "top 10",
    "directory",
    "catalog",
    "tools",
    "tool map",
    "extension list",
    "marketplace",
    "discovery",
    "compare tools",
  ],
  developer_extension_stack: [
    "vs code",
    "extension",
    "gitlens",
    "prettier",
    "docker",
    "rest client",
    "live share",
    "live server",
    "code runner",
    "better comments",
  ],
  ai_marketplace: [
    "ai tools",
    "ai marketplace",
    "tool marketplace",
    "agent marketplace",
    "discover ai",
  ],
  voice_agent_system: [
    "voice agent",
    "call agent",
    "stt",
    "tts",
    "speech",
    "translator",
    "voice bot",
    "interpreter",
  ],
  education_system: [
    "course",
    "learn",
    "training",
    "curriculum",
    "guide",
    "academy",
    "mastery",
  ],
  business_framework: [
    "framework",
    "okr",
    "kpi",
    "strategy",
    "operating model",
    "execution system",
    "playbook",
  ],
  freelance_income_system: [
    "freelance",
    "income",
    "gig",
    "earn",
    "monetize",
    "clients",
    "jobs",
  ],
  company_operating_system: [
    "company os",
    "crm",
    "erp",
    "operations",
    "workspace",
    "team system",
    "business operating system",
  ],
  data_ml_map: [
    "data science",
    "machine learning",
    "mlops",
    "analytics",
    "data map",
    "ml map",
  ],
  workflow_system: [
    "workflow",
    "automation",
    "pipeline",
    "process",
    "sequence",
    "orchestrate",
  ],
  research_signal: [
    "research",
    "discovery",
    "signal",
    "trend",
    "competitor",
    "new tool",
    "new technology",
  ],
  unknown: [],
};

const MODULE_KEYWORDS: Record<KernelPrimaryModule, string[]> = {
  kernel: ["kernel", "constitution", "memory", "planner", "orchestrator", "governance"],
  workspaces: ["builder", "workspace", "developer", "coding", "website", "app"],
  registry: ["catalog", "directory", "marketplace", "extensions", "tool stack", "discover"],
  learn: ["learn", "course", "training", "academy", "guide", "mastery"],
  voice: ["voice", "speech", "stt", "tts", "translator", "interpreter"],
  commerce: ["income", "freelance", "payment", "revenue", "billing", "jobs"],
  mind: ["research", "knowledge", "signal", "library", "discovery"],
  governance: ["policy", "safety", "audit", "moderation", "compliance"],
  create: ["design", "video", "image", "editor", "studio"],
};

const SEGMENT_KEYWORDS: Record<KernelSegment, string[]> = {
  public_user: ["everyone", "public", "consumer", "anyone"],
  learner: ["learn", "student", "training", "course", "beginner"],
  creator: ["creator", "designer", "writer", "content", "video"],
  developer: ["developer", "engineer", "vs code", "extension", "api", "code"],
  freelancer: ["freelance", "income", "client", "gig", "jobs"],
  business: ["business", "company", "crm", "erp", "team", "operations"],
  operator: ["operator", "workflow", "ops", "pipeline", "process"],
  admin: ["admin", "governance", "audit", "compliance"],
};

const GAP_RULES = [
  {
    key: "internal_website_app_builder",
    whenAny: ["build website", "website builder", "build app", "app builder", "base44", "generate website"],
    reason: "Pantavion needs an internal governed builder capability instead of relying only on external builders.",
    severity: "high" as const,
  },
  {
    key: "developer_tool_registry",
    whenAny: ["vs code", "extension", "gitlens", "prettier", "docker", "rest client"],
    reason: "Pantavion needs a structured developer tool registry and guided stack recommendations.",
    severity: "high" as const,
  },
  {
    key: "guided_mastery_dev_paths",
    whenAny: ["top 10", "extensions", "learn", "course", "training", "beginner"],
    reason: "Pantavion should convert raw tool lists into guided mastery paths and role-based learning.",
    severity: "medium" as const,
  },
  {
    key: "ai_tool_absorption_pipeline",
    whenAny: ["ai tools", "ai marketplace", "new tool", "competitor", "discovery"],
    reason: "Pantavion needs a controlled capability-absorption pipeline for external AI ecosystems.",
    severity: "high" as const,
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s\-_]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function rankMap<T extends string>(text: string, map: Record<T, string[]>) {
  const rows = (Object.keys(map) as T[]).map((key) => {
    const words = map[key] ?? [];
    let score = 0;

    for (const word of words) {
      if (text.includes(word)) {
        score += word.includes(" ") ? 3 : 1;
      }
    }

    return { key, score };
  });

  return rows.filter((row) => row.score > 0).sort((a, b) => b.score - a.score);
}

function detectType(text: string): { detectedType: KernelDetectedType; confidence: number; evidence: string[] } {
  const ranked = rankMap(text, TYPE_KEYWORDS).filter((x) => x.score > 0);
  if (!ranked.length) {
    return {
      detectedType: "unknown",
      confidence: 0.26,
      evidence: ["No strong type cluster matched."],
    };
  }
  return {
    detectedType: ranked[0].key,
    confidence: Math.min(0.97, 0.42 + ranked[0].score * 0.08),
    evidence: [`Detected strongest type cluster: ${ranked[0].key}.`],
  };
}

function detectModule(text: string): { primaryModule: KernelPrimaryModule; secondaryModules: KernelPrimaryModule[]; evidence: string[] } {
  const ranked = rankMap(text, MODULE_KEYWORDS).filter((x) => x.score > 0);
  if (!ranked.length) {
    return {
      primaryModule: "kernel",
      secondaryModules: ["mind", "registry"],
      evidence: ["Defaulted to kernel-centered handling."],
    };
  }
  return {
    primaryModule: ranked[0].key,
    secondaryModules: ranked.slice(1, 4).map((x) => x.key),
    evidence: [`Primary module resolved as ${ranked[0].key}.`],
  };
}

function detectSegments(text: string): { userSegments: KernelSegment[]; evidence: string[] } {
  const ranked = rankMap(text, SEGMENT_KEYWORDS)
    .filter((x) => x.score > 0)
    .map((x) => x.key);

  const userSegments: KernelSegment[] = ranked.length ? ranked.slice(0, 4) : ["public_user" as KernelSegment];
  return {
    userSegments,
    evidence: [`User segments inferred: ${userSegments.join(", ")}.`],
  };
}

function detectFlags(text: string): KernelIntelligenceFlags {
  return {
    incomeRelated: hasAny(text, ["income", "revenue", "freelance", "billing", "monetize", "client"]),
    learningRelated: hasAny(text, ["learn", "course", "training", "guide", "academy", "mastery"]),
    toolDiscovery: hasAny(text, ["tool", "tools", "catalog", "directory", "marketplace", "extension", "discover"]),
    businessFramework: hasAny(text, ["framework", "okr", "kpi", "strategy", "operating model", "crm", "erp"]),
    builderRelated: hasAny(text, ["builder", "build app", "build website", "generate app", "generate website", "base44"]),
    researchRelated: hasAny(text, ["research", "signal", "trend", "competitor", "new technology", "new tool"]),
    developerRelated: hasAny(text, ["developer", "vs code", "extension", "api", "code", "docker", "gitlens", "prettier"]),
  };
}

function decideTarget(text: string, type: KernelDetectedType, flags: KernelIntelligenceFlags): KernelTarget {
  if (flags.builderRelated || type === "software_builder") return "native_feature";
  if (flags.developerRelated && flags.toolDiscovery) return "catalog";
  if (flags.learningRelated) return "course";
  if (type === "workflow_system") return "workflow";
  if (type === "ai_marketplace" || type === "tool_catalog") return "catalog";
  if (type === "voice_agent_system") return "native_feature";
  if (type === "company_operating_system") return "workflow";
  return "connector";
}

function decidePantavionFit(type: KernelDetectedType, flags: KernelIntelligenceFlags, target: KernelTarget): KernelPantavionFit {
  const shouldBuild =
    target === "native_feature" ||
    type === "software_builder" ||
    type === "voice_agent_system" ||
    type === "company_operating_system";

  const shouldConnect =
    type === "ai_marketplace" ||
    type === "tool_catalog" ||
    type === "developer_extension_stack" ||
    target === "connector";

  const shouldCatalog =
    flags.toolDiscovery ||
    type === "tool_catalog" ||
    type === "developer_extension_stack" ||
    type === "ai_marketplace";

  const shouldTeach =
    flags.learningRelated ||
    type === "education_system" ||
    type === "developer_extension_stack" ||
    type === "tool_catalog";

  const shouldWorkflow =
    target === "workflow" ||
    type === "company_operating_system" ||
    type === "workflow_system" ||
    type === "freelance_income_system";

  return {
    shouldBuild,
    shouldConnect,
    shouldCatalog,
    shouldTeach,
    shouldWorkflow,
  };
}

function detectGap(text: string): KernelGapSignal {
  for (const rule of GAP_RULES) {
    if (hasAny(text, rule.whenAny)) {
      return {
        isGap: true,
        gapKey: rule.key,
        reason: rule.reason,
        severity: rule.severity,
      };
    }
  }

  return {
    isGap: false,
    gapKey: null,
    reason: "No specific Pantavion gap rule matched.",
    severity: "low",
  };
}

function decideEvolutionAction(
  fit: KernelPantavionFit,
  gap: KernelGapSignal,
  target: KernelTarget,
): KernelEvolutionAction {
  if (gap.isGap && fit.shouldBuild) return "build_internal_capability";
  if (fit.shouldCatalog && target === "catalog") return "register_in_catalog";
  if (fit.shouldTeach) return "create_learning_path";
  if (fit.shouldWorkflow) return "create_execution_workflow";
  if (fit.shouldConnect) return "add_connector";
  return "hold_for_review";
}

function strategicValue(type: KernelDetectedType, gap: KernelGapSignal, fit: KernelPantavionFit): string {
  if (gap.isGap && fit.shouldBuild) {
    return `High strategic value: external signal reveals a missing internal Pantavion capability (${gap.gapKey}).`;
  }
  if (fit.shouldCatalog && fit.shouldTeach) {
    return "Strong strategic value: can become both registry intelligence and guided mastery.";
  }
  if (fit.shouldConnect) {
    return "Moderate strategic value: useful as controlled external connector or ecosystem intake.";
  }
  return "Review value: signal may still help future capability planning.";
}

export function runPantavionKernelIntelligence(
  input: KernelIntelligenceInput,
): KernelIntelligenceConclusion {
  const modality = input.modality ?? "text";
  const normalizedInput = normalize(input.text);
  const typeResult = detectType(normalizedInput);
  const moduleResult = detectModule(normalizedInput);
  const segmentResult = detectSegments(normalizedInput);
  const flags = detectFlags(normalizedInput);
  const target = decideTarget(normalizedInput, typeResult.detectedType, flags);
  const pantavionFit = decidePantavionFit(typeResult.detectedType, flags, target);
  const gap = detectGap(normalizedInput);
  const evolutionAction = decideEvolutionAction(pantavionFit, gap, target);

  const nextMoves: string[] = [
    "Store the signal in canonical memory.",
    "Attach it to the capability registry intake lane.",
    "Create planner brief for human review.",
  ];

  if (pantavionFit.shouldBuild) nextMoves.push("Prepare internal build specification.");
  if (pantavionFit.shouldCatalog) nextMoves.push("Create catalog taxonomy and metadata fields.");
  if (pantavionFit.shouldTeach) nextMoves.push("Create guided mastery path from the signal.");
  if (pantavionFit.shouldWorkflow) nextMoves.push("Define deterministic workflow stages and outputs.");
  if (pantavionFit.shouldConnect) nextMoves.push("Evaluate connector contract, permissions, and fallback.");

  const cleanConclusion =
    `Detected ${typeResult.detectedType} under ${moduleResult.primaryModule}. ` +
    `Target => ${target}. ` +
    `Gap => ${gap.isGap ? `${gap.gapKey} (${gap.severity})` : "none"}. ` +
    `Action => ${evolutionAction}.`;

  return {
    normalizedInput,
    modality,
    detectedType: typeResult.detectedType,
    primaryModule: moduleResult.primaryModule,
    secondaryModules: moduleResult.secondaryModules,
    userSegments: segmentResult.userSegments,
    flags,
    target,
    evolutionAction,
    pantavionFit,
    gap,
    confidence: Number(typeResult.confidence.toFixed(2)),
    cleanConclusion,
    strategicValue: strategicValue(typeResult.detectedType, gap, pantavionFit),
    nextMoves,
    evidence: [
      ...typeResult.evidence,
      ...moduleResult.evidence,
      ...segmentResult.evidence,
      `Target selected as ${target}.`,
      `Evolution action selected as ${evolutionAction}.`,
    ],
  };
}





