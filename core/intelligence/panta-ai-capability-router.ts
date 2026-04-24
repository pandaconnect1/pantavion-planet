export type PantaAIActionKind =
  | "answer"
  | "write"
  | "research"
  | "summarize"
  | "translate"
  | "code"
  | "image"
  | "video"
  | "slides"
  | "notes"
  | "memory"
  | "plan"
  | "data"
  | "finance"
  | "security"
  | "health"
  | "legal"
  | "unknown";

export type PantaAITruthMode =
  | "deterministic"
  | "verified-required"
  | "generative-assisted"
  | "restricted";

export type PantaAIAccessMode =
  | "public"
  | "signed-in"
  | "restricted"
  | "admin-only";

export interface PantaAIExecuteInput {
  action?: string;
  task?: string;
  userText?: string;
  locale?: string;
  userId?: string;
  context?: Record<string, unknown>;
}

export interface PantaAIExecutionResult {
  kind: "text" | "structured" | "blocked";
  title: string;
  content: string;
  sections: {
    title: string;
    items: string[];
  }[];
}

export interface PantaAIExecutionPacket {
  accepted: boolean;
  actionKind: PantaAIActionKind;
  capabilityFamily: string;
  route: string;
  accessMode: PantaAIAccessMode;
  truthMode: PantaAITruthMode;
  providerStrategy: string;
  safetyBoundaries: string[];
  nextSteps: string[];
  warnings: string[];
  result: PantaAIExecutionResult;
  createdAt: string;
}

export interface PantaAIActionDefinition {
  key: PantaAIActionKind;
  title: string;
  capabilityFamily: string;
  accessMode: PantaAIAccessMode;
  truthMode: PantaAITruthMode;
  examples: string[];
}

export const PANTA_AI_ACTIONS: PantaAIActionDefinition[] = [
  {
    key: "answer",
    title: "General AI answer",
    capabilityFamily: "general-assistance",
    accessMode: "public",
    truthMode: "generative-assisted",
    examples: ["Explain something", "Compare two ideas", "Help me decide"],
  },
  {
    key: "write",
    title: "Writing and drafting",
    capabilityFamily: "content-creation",
    accessMode: "public",
    truthMode: "generative-assisted",
    examples: ["Write email", "Create post", "Improve text"],
  },
  {
    key: "research",
    title: "Deep research",
    capabilityFamily: "verified-knowledge",
    accessMode: "signed-in",
    truthMode: "verified-required",
    examples: ["Research market", "Compare tools", "Find evidence"],
  },
  {
    key: "summarize",
    title: "Summarization",
    capabilityFamily: "knowledge-compression",
    accessMode: "public",
    truthMode: "deterministic",
    examples: ["Summarize article", "Extract points", "Make brief"],
  },
  {
    key: "translate",
    title: "Translation",
    capabilityFamily: "language",
    accessMode: "public",
    truthMode: "generative-assisted",
    examples: ["Translate text", "Detect language", "Rewrite bilingual"],
  },
  {
    key: "code",
    title: "Code assistant",
    capabilityFamily: "software-building",
    accessMode: "signed-in",
    truthMode: "deterministic",
    examples: ["Fix bug", "Create component", "Explain error"],
  },
  {
    key: "image",
    title: "Image creation",
    capabilityFamily: "visual-generation",
    accessMode: "signed-in",
    truthMode: "generative-assisted",
    examples: ["Create logo", "Generate mockup", "Edit image"],
  },
  {
    key: "video",
    title: "Video creation",
    capabilityFamily: "video-generation",
    accessMode: "signed-in",
    truthMode: "generative-assisted",
    examples: ["Create reel", "Storyboard", "Script video"],
  },
  {
    key: "slides",
    title: "Presentations",
    capabilityFamily: "presentation-building",
    accessMode: "signed-in",
    truthMode: "generative-assisted",
    examples: ["Make deck", "Pitch summary", "Investor slides"],
  },
  {
    key: "notes",
    title: "Notes and knowledge",
    capabilityFamily: "personal-knowledge",
    accessMode: "signed-in",
    truthMode: "deterministic",
    examples: ["Organize notes", "Make checklist", "Create archive"],
  },
  {
    key: "memory",
    title: "Memory and continuity",
    capabilityFamily: "continuity",
    accessMode: "signed-in",
    truthMode: "restricted",
    examples: ["Remember project", "Restore context", "Track decision"],
  },
  {
    key: "plan",
    title: "Planning",
    capabilityFamily: "execution-planning",
    accessMode: "public",
    truthMode: "deterministic",
    examples: ["Make roadmap", "Break task", "Prioritize work"],
  },
  {
    key: "data",
    title: "Data analysis",
    capabilityFamily: "analysis",
    accessMode: "signed-in",
    truthMode: "verified-required",
    examples: ["Analyze CSV", "Find pattern", "Explain chart"],
  },
  {
    key: "finance",
    title: "Finance-aware guidance",
    capabilityFamily: "finance-aware-reasoning",
    accessMode: "signed-in",
    truthMode: "verified-required",
    examples: ["Budget plan", "Pricing model", "Cost analysis"],
  },
  {
    key: "security",
    title: "Security and safety",
    capabilityFamily: "defensive-security",
    accessMode: "restricted",
    truthMode: "restricted",
    examples: ["Security checklist", "Incident response", "Risk review"],
  },
  {
    key: "health",
    title: "Health information",
    capabilityFamily: "health-information",
    accessMode: "restricted",
    truthMode: "verified-required",
    examples: ["Explain symptoms", "Prepare doctor questions", "Health summary"],
  },
  {
    key: "legal",
    title: "Legal information",
    capabilityFamily: "legal-information",
    accessMode: "restricted",
    truthMode: "verified-required",
    examples: ["Explain clause", "Prepare questions", "Policy summary"],
  },
];

export function getPantaAIActions(): PantaAIActionDefinition[] {
  return PANTA_AI_ACTIONS.map((item) => ({ ...item, examples: [...item.examples] }));
}

export function executePantaAIAction(input: PantaAIExecuteInput): PantaAIExecutionPacket {
  const text = normalizeText([input.action, input.task, input.userText].filter(Boolean).join(" "));
  const actionKind = inferActionKind(input.action, text);
  const definition = PANTA_AI_ACTIONS.find((item) => item.key === actionKind) ?? PANTA_AI_ACTIONS[0];

  const warnings = buildWarnings(definition, input);
  const accepted = definition.accessMode !== "admin-only";

  return {
    accepted,
    actionKind,
    capabilityFamily: definition.capabilityFamily,
    route: `panta-ai.${definition.capabilityFamily}.${definition.key}`,
    accessMode: definition.accessMode,
    truthMode: definition.truthMode,
    providerStrategy: buildProviderStrategy(definition),
    safetyBoundaries: buildSafetyBoundaries(definition),
    nextSteps: buildNextSteps(definition),
    warnings,
    result: accepted
      ? buildResult(definition, input)
      : {
          kind: "blocked",
          title: "Action blocked",
          content: "This action requires admin-only governance before execution.",
          sections: [],
        },
    createdAt: new Date().toISOString(),
  };
}

function inferActionKind(action: unknown, text: string): PantaAIActionKind {
  const explicit = typeof action === "string" ? action.toLowerCase().trim() : "";

  if (isActionKind(explicit)) return explicit;

  if (hasAny(text, ["research", "verify", "evidence", "source"])) return "research";
  if (hasAny(text, ["write", "draft", "email", "post", "rewrite"])) return "write";
  if (hasAny(text, ["summary", "summarize", "synopsis"])) return "summarize";
  if (hasAny(text, ["translate", "translation", "language"])) return "translate";
  if (hasAny(text, ["code", "typescript", "react", "bug", "error"])) return "code";
  if (hasAny(text, ["image", "logo", "photo", "picture"])) return "image";
  if (hasAny(text, ["video", "reel", "movie", "clip"])) return "video";
  if (hasAny(text, ["slides", "presentation", "deck", "pitch"])) return "slides";
  if (hasAny(text, ["notes", "obsidian", "notebook", "archive"])) return "notes";
  if (hasAny(text, ["memory", "remember", "continuity"])) return "memory";
  if (hasAny(text, ["plan", "roadmap", "steps", "schedule"])) return "plan";
  if (hasAny(text, ["data", "csv", "table", "chart"])) return "data";
  if (hasAny(text, ["finance", "budget", "price", "pricing", "bank"])) return "finance";
  if (hasAny(text, ["security", "safe", "breach", "risk"])) return "security";
  if (hasAny(text, ["health", "doctor", "medical", "symptom"])) return "health";
  if (hasAny(text, ["legal", "law", "contract", "gdpr"])) return "legal";

  return "answer";
}

function isActionKind(value: string): value is PantaAIActionKind {
  return PANTA_AI_ACTIONS.some((item) => item.key === value);
}

function buildProviderStrategy(definition: PantaAIActionDefinition): string {
  if (definition.truthMode === "verified-required") {
    return "Pantavion-first reasoning with official sources, verified connectors, or licensed provider APIs only.";
  }

  if (definition.accessMode === "restricted") {
    return "Pantavion governed execution with human review, audit trail, and no unsafe provider delegation.";
  }

  return "Pantavion-native execution first; external tools only through legal APIs, user-owned export/import, or approved partnerships.";
}

function buildSafetyBoundaries(definition: PantaAIActionDefinition): string[] {
  const base = [
    "No impersonation of external brands or tools.",
    "No scraping or unauthorized data extraction.",
    "No unsafe use of user private data.",
    "Every external provider must use official API, user authorization, or partnership route.",
  ];

  if (definition.key === "health") {
    base.push("Health output is informational and must not replace a qualified clinician.");
  }

  if (definition.key === "legal") {
    base.push("Legal output is informational and must not replace a qualified lawyer.");
  }

  if (definition.key === "security") {
    base.push("Security actions must remain defensive, auditable, and permission-bound.");
  }

  return base;
}

function buildNextSteps(definition: PantaAIActionDefinition): string[] {
  switch (definition.key) {
    case "research":
      return ["Collect sources", "Score credibility", "Extract claims", "Return cited answer"];
    case "write":
      return ["Detect format", "Draft content", "Offer tone variants", "Prepare final copy"];
    case "code":
      return ["Classify stack", "Locate files", "Generate patch", "Run typecheck/build"];
    case "image":
    case "video":
      return ["Collect creative brief", "Apply rights/safety checks", "Route to approved generation pipeline"];
    case "slides":
      return ["Build outline", "Create slide structure", "Generate export-ready deck"];
    case "memory":
      return ["Classify memory type", "Request consent when needed", "Store only governed long-term facts"];
    default:
      return ["Classify request", "Select capability", "Execute safe result", "Return structured output"];
  }
}

function buildWarnings(definition: PantaAIActionDefinition, input: PantaAIExecuteInput): string[] {
  const warnings: string[] = [];

  if (definition.accessMode !== "public" && !input.userId) {
    warnings.push(`This capability is ${definition.accessMode}; production should require identity/session validation.`);
  }

  if (definition.truthMode === "verified-required") {
    warnings.push("Verified mode requires sources before final factual claims.");
  }

  if (definition.key === "memory") {
    warnings.push("Memory actions require explicit user consent and reversible storage policy.");
  }

  return warnings;
}

function buildResult(
  definition: PantaAIActionDefinition,
  input: PantaAIExecuteInput,
): PantaAIExecutionResult {
  const raw = typeof input.userText === "string" ? input.userText.trim() : "";
  const task = typeof input.task === "string" ? input.task.trim() : "";
  const subject = raw || task || "No detailed task provided.";

  switch (definition.key) {
    case "write":
      return {
        kind: "structured",
        title: "Draft generated",
        content: `Draft basis: ${subject}`,
        sections: [
          { title: "Output", items: [`Clear draft prepared from: ${subject}`] },
          { title: "Next", items: ["Choose tone", "Review facts", "Finalize"] },
        ],
      };

    case "summarize":
      return {
        kind: "structured",
        title: "Summary generated",
        content: summarize(subject),
        sections: [
          { title: "Key points", items: summarizeBullets(subject) },
          { title: "Next", items: ["Verify missing context", "Expand if needed"] },
        ],
      };

    case "plan":
      return {
        kind: "structured",
        title: "Execution plan",
        content: `Plan created for: ${subject}`,
        sections: [
          { title: "Sequence", items: ["Define goal", "Break into tasks", "Assign priority", "Execute", "Audit result"] },
          { title: "Control", items: ["Track owner", "Track deadline", "Track risk"] },
        ],
      };

    case "research":
      return {
        kind: "structured",
        title: "Research packet prepared",
        content: `Research request classified: ${subject}`,
        sections: [
          { title: "Research method", items: ["Find primary sources", "Cross-check facts", "Separate claim from opinion", "Return citations"] },
          { title: "Truth mode", items: ["Verified-required", "No unsupported claims"] },
        ],
      };

    case "code":
      return {
        kind: "structured",
        title: "Code task packet",
        content: `Code request classified: ${subject}`,
        sections: [
          { title: "Build path", items: ["Inspect files", "Patch minimally", "Run typecheck", "Run build", "Commit"] },
          { title: "Safety", items: ["No blind overwrite", "Preserve working tree", "Rollback if build fails"] },
        ],
      };

    default:
      return {
        kind: "structured",
        title: definition.title,
        content: `Pantavion routed this task to ${definition.capabilityFamily}.`,
        sections: [
          { title: "Task", items: [subject] },
          { title: "Execution", items: buildNextSteps(definition) },
        ],
      };
  }
}

function summarize(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= 240) return clean;
  return `${clean.slice(0, 240)}...`;
}

function summarizeBullets(value: string): string[] {
  const parts = value
    .split(/[.!?]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  return parts.length > 0 ? parts : ["No enough text to extract bullets."];
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function hasAny(text: string, fragments: string[]): boolean {
  return fragments.some((fragment) => text.includes(fragment));
}

export interface PantaAIRouteDecision {
  route: string;
  actionKind: PantaAIActionKind;
  capabilityFamily: string;
  accessMode: PantaAIAccessMode;
  truthMode: PantaAITruthMode;
  providerStrategy: string;
  safetyBoundaries: string[];
  nextSteps: string[];
}

export interface PantaAIRoutingSnapshot {
  title: string;
  routeCount: number;
  publicCount: number;
  signedInCount: number;
  restrictedCount: number;
  adminOnlyCount: number;
  capabilityFamilies: string[];
  routes: PantaAIRouteDecision[];
  generatedAt: string;
}

export function resolvePantaAIRoute(input: PantaAIExecuteInput): PantaAIRouteDecision {
  const packet = executePantaAIAction(input);

  return {
    route: packet.route,
    actionKind: packet.actionKind,
    capabilityFamily: packet.capabilityFamily,
    accessMode: packet.accessMode,
    truthMode: packet.truthMode,
    providerStrategy: packet.providerStrategy,
    safetyBoundaries: [...packet.safetyBoundaries],
    nextSteps: [...packet.nextSteps],
  };
}

export function getPantaAIRoutingSnapshot(): PantaAIRoutingSnapshot {
  const routes = getPantaAIActions().map((action) =>
    resolvePantaAIRoute({
      action: action.key,
      task: action.title,
      userText: action.examples.join(" "),
      locale: "en",
    }),
  );

  const capabilityFamilies = Array.from(
    new Set(routes.map((route) => route.capabilityFamily)),
  ).sort();

  return {
    title: "PantaAI Prime Routing Snapshot",
    routeCount: routes.length,
    publicCount: routes.filter((route) => route.accessMode === "public").length,
    signedInCount: routes.filter((route) => route.accessMode === "signed-in").length,
    restrictedCount: routes.filter((route) => route.accessMode === "restricted").length,
    adminOnlyCount: routes.filter((route) => route.accessMode === "admin-only").length,
    capabilityFamilies,
    routes,
    generatedAt: new Date().toISOString(),
  };
}
