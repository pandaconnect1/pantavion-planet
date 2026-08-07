export type HandoffDomain =
  | "business"
  | "sports"
  | "education"
  | "travel"
  | "health"
  | "technical"
  | "safety"
  | "general";

export interface HandoffConversationSignal {
  text: string;
  language?: string;
  countryCode?: string;
  ageBand?: "child" | "teen" | "adult";
  userApprovedSensitiveTransfer?: boolean;
}

export interface ContextEnvelope {
  summary: string;
  language?: string;
  countryCode?: string;
  retainedFields: readonly string[];
  redactedFields: readonly string[];
}

export interface HandoffPlan {
  domain: HandoffDomain;
  targetRoute: string;
  targetModel: string;
  confidence: number;
  requiresUserApproval: boolean;
  reason: string;
  context: ContextEnvelope;
}

const domainRules: ReadonlyArray<{
  domain: HandoffDomain;
  keywords: readonly string[];
  targetRoute: string;
  targetModel: string;
  sensitive?: boolean;
}> = [
  {
    domain: "business",
    keywords: ["business", "company", "contract", "client", "investment", "sales", "marketing", "startup", "deal", "project"],
    targetRoute: "/business",
    targetModel: "pantavion-business-specialist",
  },
  {
    domain: "sports",
    keywords: ["sport", "football", "basketball", "team", "match", "training", "athlete", "league"],
    targetRoute: "/sports",
    targetModel: "pantavion-sports-specialist",
  },
  {
    domain: "education",
    keywords: ["school", "course", "university", "study", "teacher", "lesson", "learn", "education", "exam"],
    targetRoute: "/learn",
    targetModel: "pantavion-learning-specialist",
  },
  {
    domain: "travel",
    keywords: ["travel", "flight", "hotel", "trip", "tour", "visa", "destination", "map", "museum"],
    targetRoute: "/travel",
    targetModel: "pantavion-travel-specialist",
  },
  {
    domain: "health",
    keywords: ["health", "doctor", "medical", "symptom", "medicine", "hospital", "therapy"],
    targetRoute: "/health",
    targetModel: "pantavion-health-specialist",
    sensitive: true,
  },
  {
    domain: "technical",
    keywords: ["code", "software", "api", "server", "database", "github", "vercel", "bug", "architecture"],
    targetRoute: "/intelligence/execute",
    targetModel: "pantavion-technical-specialist",
  },
  {
    domain: "safety",
    keywords: ["danger", "emergency", "sos", "threat", "missing", "accident", "fire", "police"],
    targetRoute: "/safety",
    targetModel: "pantavion-safety-specialist",
    sensitive: true,
  },
];

function normalize(value: string): string {
  return value.toLowerCase();
}

function redactSensitiveText(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email-redacted]")
    .replace(/\+?\d[\d\s()-]{7,}\d/g, "[phone-redacted]");
}

export function buildContextHandoff(signal: HandoffConversationSignal): HandoffPlan {
  const normalized = normalize(signal.text);
  const scored = domainRules
    .map((rule) => ({
      rule,
      score: rule.keywords.reduce(
        (total, keyword) => total + (normalized.includes(keyword) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score)[0];

  const matched = scored?.score > 0 ? scored.rule : undefined;
  const domain: HandoffDomain = matched?.domain ?? "general";
  const sensitive = Boolean(matched?.sensitive);
  const requiresUserApproval = sensitive || domain !== "general";
  const safeSummary = redactSensitiveText(signal.text).slice(0, 600);

  return {
    domain,
    targetRoute: matched?.targetRoute ?? "/social-core",
    targetModel: matched?.targetModel ?? "pantavion-general-social",
    confidence: matched ? Math.min(0.55 + scored.score * 0.12, 0.98) : 0.35,
    requiresUserApproval,
    reason: matched
      ? `The conversation contains ${domain}-related signals and can continue in the specialist workspace.`
      : "No specialist transfer is required; remain in the general Social World.",
    context: {
      summary: safeSummary,
      language: signal.language,
      countryCode: signal.countryCode,
      retainedFields: ["summary", "language", "countryCode"],
      redactedFields: ["raw identifiers", "unnecessary message history"],
    },
  };
}
