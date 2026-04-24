// core/intelligence/panta-ai-capability-router.ts

import {
  getPantaAIVisibleSurfaceCards,
  type PantaAIVisibleCard,
  type PantaAIAccessMode,
  type PantaAITruthMode,
} from "../public-surface/panta-ai-visible-surface";

export type PantaAIUserAccess =
  | "anonymous"
  | "signed-in"
  | "verified"
  | "admin";

export type PantaAIRouteDisposition =
  | "allow"
  | "sign-in-required"
  | "review-required"
  | "admin-required"
  | "deny";

export type PantaAIExecutionMode =
  | "answer"
  | "research"
  | "create"
  | "build"
  | "analyze"
  | "automate"
  | "learn"
  | "translate"
  | "secure-review";

export interface PantaAIRouteInput {
  query: string;
  userAccess?: PantaAIUserAccess;
  preferredCardKey?: string;
  locale?: string;
  source?: "home" | "intelligence" | "api" | "kernel" | "unknown";
  metadata?: Record<string, unknown>;
}

export interface PantaAICapabilityRoute {
  cardKey: string;
  title: string;
  executionMode: PantaAIExecutionMode;
  accessMode: PantaAIAccessMode;
  truthMode: PantaAITruthMode;
  internalCapabilityFamilies: string[];
  safetyBoundaries: string[];
  publicRoute: string;
  kernelRoute: string;
  orchestrationPath: string[];
}

export interface PantaAIRouteDecision {
  disposition: PantaAIRouteDisposition;
  confidence: number;
  reason: string;
  selected: PantaAICapabilityRoute | null;
  alternatives: PantaAICapabilityRoute[];
  requiredAction: string[];
  auditTags: string[];
}

export interface PantaAIRoutingSnapshot {
  generatedAt: string;
  cardCount: number;
  publicRouteCount: number;
  signedInRouteCount: number;
  restrictedRouteCount: number;
  adminOnlyRouteCount: number;
  executionModes: PantaAIExecutionMode[];
  capabilityFamilies: string[];
  routes: PantaAICapabilityRoute[];
}

const EXECUTION_MODE_BY_CARD: Record<string, PantaAIExecutionMode> = {
  "ai-assistant": "answer",
  "deep-research": "research",
  "writing-content": "create",
  "coding-build": "build",
  "app-website-builder": "build",
  "design-image": "create",
  "video-audio": "create",
  presentations: "create",
  "automation-workflows": "automate",
  "notes-memory": "analyze",
  "data-analytics": "analyze",
  "learning-mastery": "learn",
  "business-strategy": "research",
  "finance-guidance": "analyze",
  "health-knowledge": "research",
  "security-defense": "secure-review",
  "voice-translation": "translate",
};

const CARD_KEYWORDS: Record<string, string[]> = {
  "ai-assistant": [
    "ask",
    "assistant",
    "help",
    "question",
    "answer",
    "plan",
    "idea",
    "general",
    "organize",
    "guide",
  ],
  "deep-research": [
    "research",
    "source",
    "sources",
    "verify",
    "evidence",
    "market",
    "competitor",
    "compare",
    "study",
    "investigate",
  ],
  "writing-content": [
    "write",
    "rewrite",
    "post",
    "email",
    "article",
    "script",
    "copy",
    "text",
    "content",
  ],
  "coding-build": [
    "code",
    "typescript",
    "next",
    "react",
    "debug",
    "build",
    "repo",
    "file",
    "tsc",
    "terminal",
  ],
  "app-website-builder": [
    "app",
    "website",
    "site",
    "landing",
    "dashboard",
    "module",
    "builder",
    "product",
    "frontend",
  ],
  "design-image": [
    "design",
    "image",
    "logo",
    "brand",
    "ui",
    "visual",
    "mockup",
    "color",
    "icon",
  ],
  "video-audio": [
    "video",
    "audio",
    "voiceover",
    "clip",
    "reel",
    "podcast",
    "media",
    "sound",
  ],
  presentations: [
    "presentation",
    "slides",
    "deck",
    "pitch",
    "summary",
    "report",
    "gamma",
  ],
  "automation-workflows": [
    "automation",
    "workflow",
    "trigger",
    "zapier",
    "agent",
    "repeat",
    "task",
    "pipeline",
  ],
  "notes-memory": [
    "notes",
    "memory",
    "obsidian",
    "meeting",
    "recall",
    "continuity",
    "notebook",
  ],
  "data-analytics": [
    "data",
    "analytics",
    "table",
    "spreadsheet",
    "chart",
    "dashboard",
    "bi",
    "rose",
  ],
  "learning-mastery": [
    "learn",
    "course",
    "study",
    "lesson",
    "quiz",
    "practice",
    "mastery",
    "education",
  ],
  "business-strategy": [
    "business",
    "strategy",
    "pricing",
    "market",
    "growth",
    "startup",
    "operations",
  ],
  "finance-guidance": [
    "finance",
    "budget",
    "cost",
    "money",
    "pricing",
    "subscription",
    "revenue",
  ],
  "health-knowledge": [
    "health",
    "doctor",
    "medical",
    "symptom",
    "medicine",
    "hospital",
    "care",
  ],
  "security-defense": [
    "security",
    "defense",
    "audit",
    "incident",
    "breach",
    "cyber",
    "privacy",
    "safe",
  ],
  "voice-translation": [
    "voice",
    "translate",
    "translation",
    "language",
    "interpreter",
    "speech",
    "speak",
  ],
};

export function resolvePantaAIRoute(
  input: PantaAIRouteInput
): PantaAIRouteDecision {
  const userAccess = input.userAccess ?? "anonymous";
  const cards = getPantaAIVisibleSurfaceCards();

  const selectedCard =
    findPreferredCard(cards, input.preferredCardKey) ??
    rankCardsByQuery(cards, input.query)[0]?.card ??
    null;

  if (!selectedCard) {
    return {
      disposition: "deny",
      confidence: 0,
      reason: "No PantaAI capability card could be resolved.",
      selected: null,
      alternatives: [],
      requiredAction: ["Ask the user for a clearer task or intent."],
      auditTags: ["panta-ai-routing", "unresolved"],
    };
  }

  const selectedRoute = buildCapabilityRoute(selectedCard);
  const alternatives = rankCardsByQuery(cards, input.query)
    .filter((item) => item.card.key !== selectedCard.key)
    .slice(0, 3)
    .map((item) => buildCapabilityRoute(item.card));

  const accessDisposition = resolveAccessDisposition(
    selectedCard.accessMode,
    userAccess
  );

  const requiredAction = buildRequiredActions(
    accessDisposition,
    selectedCard,
    selectedRoute
  );

  return {
    disposition: accessDisposition,
    confidence: computeRouteConfidence(input.query, selectedCard),
    reason: buildRouteReason(selectedCard, selectedRoute, accessDisposition),
    selected: selectedRoute,
    alternatives,
    requiredAction,
    auditTags: [
      "panta-ai-routing",
      `card:${selectedCard.key}`,
      `mode:${selectedRoute.executionMode}`,
      `truth:${selectedCard.truthMode}`,
      `access:${selectedCard.accessMode}`,
    ],
  };
}

export function getPantaAIRoutingSnapshot(): PantaAIRoutingSnapshot {
  const routes = getPantaAIVisibleSurfaceCards().map((card) =>
    buildCapabilityRoute(card)
  );

  const capabilityFamilies = Array.from(
    new Set(routes.flatMap((route) => route.internalCapabilityFamilies))
  ).sort();

  const executionModes = Array.from(
    new Set(routes.map((route) => route.executionMode))
  ).sort();

  return {
    generatedAt: new Date().toISOString(),
    cardCount: routes.length,
    publicRouteCount: routes.filter((route) => route.accessMode === "public")
      .length,
    signedInRouteCount: routes.filter(
      (route) => route.accessMode === "signed-in"
    ).length,
    restrictedRouteCount: routes.filter(
      (route) => route.accessMode === "restricted"
    ).length,
    adminOnlyRouteCount: routes.filter(
      (route) => route.accessMode === "admin-only"
    ).length,
    executionModes,
    capabilityFamilies,
    routes,
  };
}

export function buildCapabilityRoute(
  card: PantaAIVisibleCard
): PantaAICapabilityRoute {
  const executionMode =
    EXECUTION_MODE_BY_CARD[card.key] ?? inferExecutionMode(card);

  return {
    cardKey: card.key,
    title: card.title,
    executionMode,
    accessMode: card.accessMode,
    truthMode: card.truthMode,
    internalCapabilityFamilies: [...card.internalCapabilityFamilies],
    safetyBoundaries: [...card.safetyBoundaries],
    publicRoute: card.route,
    kernelRoute: kernelRouteForExecutionMode(executionMode),
    orchestrationPath: buildOrchestrationPath(card, executionMode),
  };
}

function findPreferredCard(
  cards: PantaAIVisibleCard[],
  preferredCardKey?: string
): PantaAIVisibleCard | null {
  if (!preferredCardKey) {
    return null;
  }

  return cards.find((card) => card.key === preferredCardKey) ?? null;
}

function rankCardsByQuery(
  cards: PantaAIVisibleCard[],
  query: string
): { card: PantaAIVisibleCard; score: number }[] {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = tokenize(normalizedQuery);

  return cards
    .map((card) => ({
      card,
      score: scoreCard(card, normalizedQuery, queryTokens),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);
}

function scoreCard(
  card: PantaAIVisibleCard,
  normalizedQuery: string,
  queryTokens: string[]
): number {
  const keywords = CARD_KEYWORDS[card.key] ?? [];
  const searchable = normalizeSearchText(
    [
      card.key,
      card.title,
      card.subtitle,
      card.publicExplanation,
      card.whatItDoes.join(" "),
      card.whenToUseIt.join(" "),
      card.internalCapabilityFamilies.join(" "),
      keywords.join(" "),
    ].join(" ")
  );

  let score = 0;

  for (const keyword of keywords) {
    if (normalizedQuery.includes(keyword)) {
      score += 8;
    }
  }

  for (const token of queryTokens) {
    if (searchable.includes(token)) {
      score += token.length > 4 ? 3 : 1;
    }
  }

  if (normalizedQuery.includes(card.key)) {
    score += 20;
  }

  return score;
}

function resolveAccessDisposition(
  accessMode: PantaAIAccessMode,
  userAccess: PantaAIUserAccess
): PantaAIRouteDisposition {
  if (accessMode === "public") {
    return "allow";
  }

  if (accessMode === "signed-in") {
    return userAccess === "anonymous" ? "sign-in-required" : "allow";
  }

  if (accessMode === "restricted") {
    return userAccess === "admin" || userAccess === "verified"
      ? "review-required"
      : "sign-in-required";
  }

  if (accessMode === "admin-only") {
    return userAccess === "admin" ? "review-required" : "admin-required";
  }

  return "deny";
}

function buildRequiredActions(
  disposition: PantaAIRouteDisposition,
  card: PantaAIVisibleCard,
  route: PantaAICapabilityRoute
): string[] {
  const actions: string[] = [];

  if (disposition === "sign-in-required") {
    actions.push("Require signed-in user before execution.");
  }

  if (disposition === "review-required") {
    actions.push("Create approval or review packet before execution.");
  }

  if (disposition === "admin-required") {
    actions.push("Route to admin-only capability gate.");
  }

  if (card.truthMode === "verified") {
    actions.push("Attach evidence and source verification before final answer.");
  }

  if (card.truthMode === "restricted") {
    actions.push("Apply restricted safety policy and audit logging.");
  }

  if (route.safetyBoundaries.length > 0) {
    actions.push("Apply card safety boundaries.");
  }

  if (actions.length === 0) {
    actions.push("Proceed through Prime Kernel route.");
  }

  return actions;
}

function buildRouteReason(
  card: PantaAIVisibleCard,
  route: PantaAICapabilityRoute,
  disposition: PantaAIRouteDisposition
): string {
  return [
    `Resolved visible surface "${card.title}" to execution mode "${route.executionMode}".`,
    `Access disposition is "${disposition}".`,
    `Kernel route is "${route.kernelRoute}".`,
  ].join(" ");
}

function computeRouteConfidence(
  query: string,
  card: PantaAIVisibleCard
): number {
  const ranked = rankCardsByQuery([card], query);
  const score = ranked[0]?.score ?? 0;

  if (score >= 30) {
    return 0.94;
  }

  if (score >= 18) {
    return 0.86;
  }

  if (score >= 8) {
    return 0.74;
  }

  return 0.62;
}

function inferExecutionMode(card: PantaAIVisibleCard): PantaAIExecutionMode {
  if (card.truthMode === "verified") {
    return "research";
  }

  if (card.truthMode === "creative") {
    return "create";
  }

  if (card.truthMode === "restricted") {
    return "secure-review";
  }

  return "answer";
}

function kernelRouteForExecutionMode(mode: PantaAIExecutionMode): string {
  switch (mode) {
    case "research":
      return "/api/kernel/analyze";
    case "create":
      return "/api/kernel/intake";
    case "build":
      return "/api/kernel/run";
    case "analyze":
      return "/api/kernel/analyze";
    case "automate":
      return "/api/kernel/run";
    case "learn":
      return "/api/kernel/intake";
    case "translate":
      return "/api/kernel/intake";
    case "secure-review":
      return "/api/kernel/analyze";
    case "answer":
    default:
      return "/api/kernel";
  }
}

function buildOrchestrationPath(
  card: PantaAIVisibleCard,
  mode: PantaAIExecutionMode
): string[] {
  const base = [
    "intent-resolution",
    "visible-surface-selection",
    "capability-family-mapping",
    "truth-zone-check",
    "access-policy-check",
    "safety-boundary-check",
  ];

  switch (mode) {
    case "research":
      base.push("evidence-routing", "source-verification", "synthesis");
      break;
    case "create":
      base.push("creative-brief", "asset-or-content-generation", "review");
      break;
    case "build":
      base.push("build-plan", "repo-safety-gate", "implementation-validation");
      break;
    case "analyze":
      base.push("data-or-memory-analysis", "insight-extraction", "summary");
      break;
    case "automate":
      base.push("workflow-plan", "state-machine", "fallback-policy");
      break;
    case "learn":
      base.push("level-detection", "guided-path", "practice-feedback");
      break;
    case "translate":
      base.push("language-detection", "translation-adaptation", "delivery");
      break;
    case "secure-review":
      base.push("restricted-policy", "audit-log", "admin-review");
      break;
    case "answer":
    default:
      base.push("answer-plan", "response-generation");
      break;
  }

  base.push(...card.internalCapabilityFamilies.slice(0, 3));
  return Array.from(new Set(base));
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ\s-]/gi, " ");
}

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      normalizeSearchText(value)
        .split(/\s+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 3)
    )
  );
}
