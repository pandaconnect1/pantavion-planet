export type InputSource = "text" | "image" | "link" | "file" | "mixed";

export type KernelType =
  | "AI_TOOLS"
  | "LANGUAGE_MAP"
  | "ARCHITECTURE"
  | "WORKSPACE_STACK"
  | "DATA_SCIENCE"
  | "PROMPTING"
  | "RAG_CAG"
  | "MARKETING_STACK"
  | "VOICE_SYSTEM"
  | "SECURITY_PATTERN"
  | "UNKNOWN";

export type KernelDomain =
  | "creator"
  | "developer"
  | "research"
  | "data"
  | "business"
  | "voice"
  | "security"
  | "knowledge"
  | "general";

export type KernelIntent =
  | "exploration"
  | "comparison"
  | "implementation"
  | "architecture"
  | "classification"
  | "expansion"
  | "optimization"
  | "unknown";

export interface RawKernelInput {
  title?: string;
  text?: string;
  kind?: InputSource;
  attachments?: string[];
  metadata?: Record<string, unknown>;
}

export interface NormalizedInput {
  id: string;
  timestamp: string;
  title: string;
  text: string;
  source: InputSource;
  tokens: string[];
  keywords: string[];
  signals: string[];
  attachments: string[];
  metadata: Record<string, unknown>;
}

export interface ClassificationResult {
  type: KernelType;
  domain: KernelDomain;
  intent: KernelIntent;
  confidence: number;
  tags: string[];
  reasoning: string[];
}

const STOP_WORDS = new Set([
  "the","a","an","and","or","to","of","for","with","in","on","at","by","from",
  "is","are","be","this","that","these","those","it","its","as","into","about",
  "top","best","new","all","use","using","tools","tool","vs","kai","gia","sto",
  "stin","na","to","ta","ti","tis","ton","tous","me","se","apo","auto","ayto",
  "einai","pou","osa","oso","more","than"
]);

const TYPE_RULES: Array<{
  type: KernelType;
  weight: number;
  patterns: RegExp[];
  tags: string[];
}> = [
  {
    type: "VOICE_SYSTEM",
    weight: 1.35,
    patterns: [
      /\bvoice\b/i,
      /\baudio\b/i,
      /\btts\b/i,
      /\bstt\b/i,
      /\btranslator\b/i,
      /\blive audio\b/i,
      /\breal[- ]time audio\b/i,
      /\bbidirectional translation\b/i,
      /\bspeech\b/i
    ],
    tags: ["voice", "audio"]
  },
  {
    type: "ARCHITECTURE",
    weight: 1.25,
    patterns: [
      /\barchitecture\b/i,
      /\bkernel\b/i,
      /\bcore\b/i,
      /\bpipeline\b/i,
      /\bregistry\b/i,
      /\bmodule\b/i,
      /\bworkspace\b/i,
      /\bpolicy\b/i,
      /\baudit\b/i
    ],
    tags: ["architecture", "system-design"]
  },
  {
    type: "SECURITY_PATTERN",
    weight: 1.25,
    patterns: [
      /\bsecurity\b/i,
      /\bzero trust\b/i,
      /\bsupply chain\b/i,
      /\bpolicy gate\b/i,
      /\baudit\b/i,
      /\bapproval\b/i,
      /\brisk\b/i
    ],
    tags: ["security", "governance"]
  },
  {
    type: "AI_TOOLS",
    weight: 1.1,
    patterns: [
      /\bai tools?\b/i,
      /\btop\s+\d+\s+ai\b/i,
      /\bgoogle ai tools?\b/i,
      /\bgemini\b/i,
      /\bnotebooklm\b/i,
      /\bclaude\b/i,
      /\bchatgpt\b/i,
      /\bperplexity\b/i,
      /\bmidjourney\b/i,
      /\bcanva ai\b/i
    ],
    tags: ["ai-tools", "tool-discovery"]
  },
  {
    type: "LANGUAGE_MAP",
    weight: 1.0,
    patterns: [
      /\bprogramming languages?\b/i,
      /\blanguages? and their uses\b/i,
      /\bpython\b/i,
      /\bjavascript\b/i,
      /\breact\b/i,
      /\bjava\b/i,
      /\bc\+\+\b/i,
      /\bswift\b/i,
      /\bphp\b/i
    ],
    tags: ["languages", "mapping"]
  },
  {
    type: "WORKSPACE_STACK",
    weight: 1.0,
    patterns: [
      /\bstack\b/i,
      /\bworkflow\b/i,
      /\bcreator\b/i,
      /\bmarketing\b/i,
      /\bautomation\b/i,
      /\bwebsite\b/i,
      /\bimage\b/i,
      /\bvideo\b/i,
      /\bdesign\b/i
    ],
    tags: ["workspace", "stack"]
  },
  {
    type: "DATA_SCIENCE",
    weight: 1.1,
    patterns: [
      /\bdata science\b/i,
      /\bmachine learning\b/i,
      /\bml\b/i,
      /\beda\b/i,
      /\bmodel monitoring\b/i,
      /\bfeature engineering\b/i,
      /\bstatistics\b/i
    ],
    tags: ["data", "ml"]
  },
  {
    type: "PROMPTING",
    weight: 1.0,
    patterns: [
      /\bprompt\b/i,
      /\bprompts\b/i,
      /\bprompting\b/i,
      /\bchatgpt prompt\b/i,
      /\bclaude prompt\b/i
    ],
    tags: ["prompting"]
  },
  {
    type: "RAG_CAG",
    weight: 1.0,
    patterns: [
      /\brag\b/i,
      /\bcag\b/i,
      /\bvector db\b/i,
      /\bembedding\b/i,
      /\bretrieval augmented generation\b/i,
      /\bcache augmented generation\b/i
    ],
    tags: ["retrieval", "knowledge-runtime"]
  },
  {
    type: "MARKETING_STACK",
    weight: 1.05,
    patterns: [
      /\bseo\b/i,
      /\bmarketing\b/i,
      /\bad creative\b/i,
      /\breels?\b/i,
      /\bcontent\b/i,
      /\bcaptions?\b/i,
      /\bbrand\b/i,
      /\bcampaign\b/i
    ],
    tags: ["marketing"]
  }
];

function safeId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}
  return `kernel_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function detectSource(input: RawKernelInput): InputSource {
  if (input.kind) return input.kind;
  const hasText = Boolean((input.title || "").trim() || (input.text || "").trim());
  const attachments = input.attachments || [];
  const hasImage = attachments.some((a) => /\.(png|jpg|jpeg|webp|gif)$/i.test(a));
  const hasFile = attachments.some((a) => /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|csv|txt|md)$/i.test(a));
  const hasLink = /https?:\/\//i.test(`${input.title || ""} ${input.text || ""}`);

  const count = [hasText, hasImage, hasFile, hasLink].filter(Boolean).length;
  if (count > 1) return "mixed";
  if (hasImage) return "image";
  if (hasFile) return "file";
  if (hasLink) return "link";
  return "text";
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\-\+\.]/gu, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function extractKeywords(tokens: string[]): string[] {
  const counts = new Map<string, number>();

  for (const token of tokens) {
    if (token.length < 2) continue;
    if (STOP_WORDS.has(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([token]) => token);
}

function extractSignals(text: string): string[] {
  const signals: string[] = [];
  const lower = text.toLowerCase();

  if (/compare|vs|versus|difference/.test(lower)) signals.push("comparison");
  if (/implement|build|code|terminal|paste|production|deploy/.test(lower)) signals.push("implementation");
  if (/architecture|kernel|registry|workspace|module/.test(lower)) signals.push("architecture");
  if (/top|best|list|map|stack|ecosystem|tools/.test(lower)) signals.push("exploration");
  if (/optimiz|improve|faster|better|scale/.test(lower)) signals.push("optimization");
  if (/expand|grow|add|include|thousands/.test(lower)) signals.push("expansion");
  if (/security|policy|audit|risk|zero trust/.test(lower)) signals.push("security");
  if (/voice|audio|translator|realtime|real-time/.test(lower)) signals.push("voice");
  if (/image|screenshot|photo|diagram/.test(lower)) signals.push("visual-input");

  return [...new Set(signals)];
}

export function normalizeInput(input: RawKernelInput): NormalizedInput {
  const title = (input.title || "").trim();
  const text = (input.text || "").trim();
  const merged = `${title}\n${text}`.trim();
  const tokens = tokenize(merged);
  const keywords = extractKeywords(tokens);
  const signals = extractSignals(merged);

  return {
    id: safeId(),
    timestamp: new Date().toISOString(),
    title,
    text,
    source: detectSource(input),
    tokens,
    keywords,
    signals,
    attachments: input.attachments || [],
    metadata: input.metadata || {}
  };
}

function detectType(normalized: NormalizedInput): {
  type: KernelType;
  confidence: number;
  tags: string[];
  reasoning: string[];
} {
  const haystack = `${normalized.title}\n${normalized.text}\n${normalized.keywords.join(" ")}\n${normalized.signals.join(" ")}`;
  let bestType: KernelType = "UNKNOWN";
  let bestScore = 0;
  let bestTags: string[] = [];
  let reasoning: string[] = [];

  for (const rule of TYPE_RULES) {
    let rawMatches = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(haystack)) rawMatches += 1;
    }
    const score = rawMatches * rule.weight;

    if (score > bestScore) {
      bestScore = score;
      bestType = rule.type;
      bestTags = rule.tags;
      reasoning = [`matched ${rawMatches} pattern(s) for ${rule.type} with weight ${rule.weight}`];
    }
  }

  const confidence = bestScore === 0 ? 0.25 : Math.min(0.55 + bestScore * 0.08, 0.95);

  return {
    type: bestType,
    confidence,
    tags: bestTags,
    reasoning: reasoning.length ? reasoning : ["no strong rule match; defaulted to UNKNOWN"]
  };
}

function detectDomain(normalized: NormalizedInput, type: KernelType): KernelDomain {
  const text = `${normalized.title}\n${normalized.text}`.toLowerCase();

  if (type === "DATA_SCIENCE") return "data";
  if (type === "VOICE_SYSTEM") return "voice";
  if (type === "SECURITY_PATTERN") return "security";
  if (type === "PROMPTING" || type === "AI_TOOLS") return "research";

  if (/marketing|seo|brand|campaign/.test(text)) return "business";
  if (/python|react|typescript|code|api|backend|frontend|programming/.test(text)) return "developer";
  if (/voice|audio|speech|translator/.test(text)) return "voice";
  if (/security|policy|audit|risk|zero trust/.test(text)) return "security";
  if (/data science|ml|model|eda|statistics/.test(text)) return "data";
  if (/research|study|analysis|compare|benchmark/.test(text)) return "research";
  if (/design|image|video|creator|content/.test(text)) return "creator";
  if (/knowledge|rag|cag|notebooklm|docs|pdf/.test(text)) return "knowledge";

  return "general";
}

function detectIntent(normalized: NormalizedInput): KernelIntent {
  const text = `${normalized.title}\n${normalized.text}`.toLowerCase();
  const signals = new Set(normalized.signals);

  if (signals.has("implementation") || /build|implement|code|terminal|paste|write file/.test(text)) {
    return "implementation";
  }
  if (signals.has("architecture") || /architecture|kernel|structure|mapping|registry/.test(text)) {
    return "architecture";
  }
  if (signals.has("comparison") || /compare|vs|difference|better than|replace/.test(text)) {
    return "comparison";
  }
  if (signals.has("optimization") || /faster|improve|optimi[sz]e|performance/.test(text)) {
    return "optimization";
  }
  if (signals.has("expansion") || /expand|add|include|more|thousands/.test(text)) {
    return "expansion";
  }
  if (/classify|what is this|ti einai|τι είναι/.test(text)) {
    return "classification";
  }
  if (signals.has("exploration") || /top|best|tools|map|ecosystem|landscape|stack/.test(text)) {
    return "exploration";
  }

  return "unknown";
}

export function classifyInput(input: RawKernelInput): {
  normalized: NormalizedInput;
  classification: ClassificationResult;
} {
  const normalized = normalizeInput(input);
  const typeResult = detectType(normalized);
  const domain = detectDomain(normalized, typeResult.type);
  const intent = detectIntent(normalized);

  const tags = [
    ...new Set([
      ...typeResult.tags,
      ...normalized.signals,
      ...normalized.keywords.slice(0, 8),
      normalized.source
    ])
  ];

  const classification: ClassificationResult = {
    type: typeResult.type,
    domain,
    intent,
    confidence: typeResult.confidence,
    tags,
    reasoning: [
      ...typeResult.reasoning,
      `domain resolved to ${domain}`,
      `intent resolved to ${intent}`,
      `source detected as ${normalized.source}`
    ]
  };

  return { normalized, classification };
}
