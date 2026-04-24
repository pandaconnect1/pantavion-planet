// core/intelligence/panta-ai-action-engine.ts

import {
  getPantaAIVisibleSurfaceCard,
  getPantaAIVisibleSurfaceCards,
  getPantaAIVisibleSurfaceSummary,
} from "../public-surface/panta-ai-visible-surface";

type UnknownRecord = Record<string, unknown>;

export type PantaAIActionMode =
  | "answer"
  | "research"
  | "build"
  | "create"
  | "analyze"
  | "automate"
  | "route"
  | "review";

export type PantaAIKernelLane =
  | "assistant"
  | "research"
  | "builder"
  | "creator"
  | "automation"
  | "data"
  | "learning"
  | "business"
  | "voice"
  | "security"
  | "memory"
  | "governance";

export type PantaAIActionDisposition =
  | "ready"
  | "signed-in-required"
  | "verification-required"
  | "restricted-review"
  | "admin-only";

export interface PantaAIActionSurface {
  key: string;
  title: string;
  subtitle: string;
  explanation: string;
  whatItDoes: string[];
  whenToUseIt: string[];
  examples: string[];
  expectedResults: string[];
  internalCapabilityFamilies: string[];
  safetyBoundaries: string[];
  accessMode: string;
  truthMode: string;
  kernelLane: PantaAIKernelLane;
  actionMode: PantaAIActionMode;
  defaultRoute: string;
  actionApiRoute: string;
  detailRoute: string;
}

export interface PantaAIActionRequest {
  capabilityKey?: string;
  userGoal: string;
  userContext?: string;
  requestedMode?: PantaAIActionMode;
  actorId?: string;
  locale?: string;
}

export interface PantaAIActionPacket {
  id: string;
  createdAt: string;
  capability: PantaAIActionSurface;
  userGoal: string;
  userContext?: string;
  disposition: PantaAIActionDisposition;
  allowed: boolean;
  requiresSignIn: boolean;
  requiresVerification: boolean;
  requiresHumanReview: boolean;
  kernelLane: PantaAIKernelLane;
  actionMode: PantaAIActionMode;
  executionRoute: string;
  intakeRoute: string;
  safetyBoundaries: string[];
  workingPlan: string[];
  expectedResults: string[];
  auditNotes: string[];
}

export interface PantaAIActionSummary {
  generatedAt: string;
  visibleCapabilityCount: number;
  publicReadyCount: number;
  restrictedCount: number;
  adminOnlyCount: number;
  kernelLanes: PantaAIKernelLane[];
  actionModes: PantaAIActionMode[];
}

export function getPantaAIActionSurfaces(): PantaAIActionSurface[] {
  return getPantaAIVisibleSurfaceCards().map((card) => toActionSurface(card));
}

export function getPantaAIActionSurface(key: string): PantaAIActionSurface | null {
  const direct = getPantaAIVisibleSurfaceCard(key);

  if (direct) {
    return toActionSurface(direct);
  }

  return getPantaAIActionSurfaces().find((item) => item.key === key) ?? null;
}

export function getPantaAIActionSummary(): PantaAIActionSummary {
  const surfaces = getPantaAIActionSurfaces();
  const baseSummary = getPantaAIVisibleSurfaceSummary();

  return {
    generatedAt: new Date().toISOString(),
    visibleCapabilityCount: numberFromRecord(baseSummary, "cardCount", surfaces.length),
    publicReadyCount: surfaces.filter((item) => item.accessMode === "public").length,
    restrictedCount: surfaces.filter((item) => item.accessMode === "restricted").length,
    adminOnlyCount: surfaces.filter((item) => item.accessMode === "admin-only").length,
    kernelLanes: unique(surfaces.map((item) => item.kernelLane)).sort(),
    actionModes: unique(surfaces.map((item) => item.actionMode)).sort(),
  };
}

export function createPantaAIActionPacket(
  request: PantaAIActionRequest
): PantaAIActionPacket {
  const goal = normalizeText(request.userGoal, "General PantaAI request");
  const surface =
    request.capabilityKey
      ? getPantaAIActionSurface(request.capabilityKey)
      : inferSurfaceFromGoal(goal);

  const capability = surface ?? getDefaultSurface();
  const actionMode = request.requestedMode ?? capability.actionMode;
  const disposition = decideDisposition(capability);
  const allowed = disposition === "ready" || disposition === "signed-in-required";

  return {
    id: createId("pai_action"),
    createdAt: new Date().toISOString(),
    capability,
    userGoal: goal,
    userContext: normalizeOptionalText(request.userContext),
    disposition,
    allowed,
    requiresSignIn:
      disposition === "signed-in-required" ||
      disposition === "verification-required" ||
      disposition === "restricted-review" ||
      disposition === "admin-only",
    requiresVerification:
      disposition === "verification-required" ||
      disposition === "restricted-review" ||
      disposition === "admin-only",
    requiresHumanReview:
      disposition === "restricted-review" || disposition === "admin-only",
    kernelLane: capability.kernelLane,
    actionMode,
    executionRoute: capability.defaultRoute,
    intakeRoute: `/intelligence/routing?capability=${encodeURIComponent(capability.key)}`,
    safetyBoundaries: capability.safetyBoundaries,
    workingPlan: buildWorkingPlan(goal, capability, actionMode),
    expectedResults: capability.expectedResults,
    auditNotes: buildAuditNotes(capability, disposition),
  };
}

function toActionSurface(card: unknown): PantaAIActionSurface {
  const record = asRecord(card);
  const key = text(record.key, "universal-ai-assistant");
  const title = text(record.title, "PantaAI Capability");
  const subtitle = text(record.subtitle, "Pantavion AI capability family");
  const explanation = text(
    record.publicExplanation,
    text(record.explanation, "A governed Pantavion capability surface.")
  );
  const internalFamilies = stringArray(record.internalCapabilityFamilies);
  const accessMode = text(record.accessMode, text(record.access, "public"));
  const truthMode = text(record.truthMode, "mixed");

  const actionMode = inferActionMode(key, title, subtitle, internalFamilies);
  const kernelLane = inferKernelLane(key, title, subtitle, internalFamilies);

  return {
    key,
    title,
    subtitle,
    explanation,
    whatItDoes: stringArray(record.whatItDoes),
    whenToUseIt: stringArray(record.whenToUseIt),
    examples: stringArray(record.taskExamples).length
      ? stringArray(record.taskExamples)
      : stringArray(record.examples),
    expectedResults: stringArray(record.expectedResults).length
      ? stringArray(record.expectedResults)
      : stringArray(record.expectedResult),
    internalCapabilityFamilies: internalFamilies,
    safetyBoundaries: stringArray(record.safetyBoundaries),
    accessMode,
    truthMode,
    kernelLane,
    actionMode,
    defaultRoute: `/intelligence/routing?capability=${encodeURIComponent(key)}`,
    actionApiRoute: `/api/intelligence/actions?capability=${encodeURIComponent(key)}`,
    detailRoute: `/intelligence/capabilities/${encodeURIComponent(key)}`,
  };
}

function inferSurfaceFromGoal(goal: string): PantaAIActionSurface | null {
  const normalized = goal.toLowerCase();
  const surfaces = getPantaAIActionSurfaces();

  const ranked = surfaces
    .map((surface) => ({
      surface,
      score: scoreSurfaceForGoal(surface, normalized),
    }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.score > 0 ? ranked[0].surface : null;
}

function scoreSurfaceForGoal(surface: PantaAIActionSurface, goal: string): number {
  const haystack = [
    surface.key,
    surface.title,
    surface.subtitle,
    surface.explanation,
    ...surface.whatItDoes,
    ...surface.whenToUseIt,
    ...surface.examples,
    ...surface.internalCapabilityFamilies,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;

  for (const token of tokenize(goal)) {
    if (haystack.includes(token)) {
      score += 1;
    }
  }

  if (goal.includes("app") || goal.includes("code") || goal.includes("website")) {
    if (surface.actionMode === "build") score += 5;
  }

  if (goal.includes("research") || goal.includes("evidence") || goal.includes("source")) {
    if (surface.actionMode === "research" || surface.actionMode === "analyze") score += 5;
  }

  if (goal.includes("image") || goal.includes("video") || goal.includes("design")) {
    if (surface.actionMode === "create") score += 5;
  }

  if (goal.includes("automate") || goal.includes("workflow")) {
    if (surface.actionMode === "automate") score += 5;
  }

  return score;
}

function getDefaultSurface(): PantaAIActionSurface {
  return (
    getPantaAIActionSurface("universal-ai-assistant") ??
    getPantaAIActionSurfaces()[0] ?? {
      key: "panta-ai-general",
      title: "PantaAI General",
      subtitle: "General Pantavion AI intake",
      explanation: "General governed AI intake when no specific capability is matched.",
      whatItDoes: ["Understands the request", "Classifies the work", "Routes to a safe next step"],
      whenToUseIt: ["When the user wants help but has not selected a specific capability"],
      examples: ["Help me do this", "Find the best way", "Build a plan"],
      expectedResults: ["Clear next step", "Kernel routing plan", "Safe execution packet"],
      internalCapabilityFamilies: ["general-intake", "kernel-routing"],
      safetyBoundaries: ["No unsafe execution without review"],
      accessMode: "public",
      truthMode: "mixed",
      kernelLane: "assistant",
      actionMode: "answer",
      defaultRoute: "/intelligence/routing",
      actionApiRoute: "/api/intelligence/actions",
      detailRoute: "/intelligence/capabilities/panta-ai-general",
    }
  );
}

function decideDisposition(surface: PantaAIActionSurface): PantaAIActionDisposition {
  if (surface.accessMode === "admin-only") return "admin-only";
  if (surface.accessMode === "restricted") return "restricted-review";
  if (surface.accessMode === "verified") return "verification-required";
  if (surface.accessMode === "signed-in") return "signed-in-required";
  return "ready";
}

function inferKernelLane(
  key: string,
  title: string,
  subtitle: string,
  families: string[]
): PantaAIKernelLane {
  const textValue = `${key} ${title} ${subtitle} ${families.join(" ")}`.toLowerCase();

  if (containsAny(textValue, ["research", "retrieval", "evidence", "browser"])) return "research";
  if (containsAny(textValue, ["code", "coding", "build", "app", "website", "dev"])) return "builder";
  if (containsAny(textValue, ["image", "video", "audio", "design", "media", "presentation", "write"])) return "creator";
  if (containsAny(textValue, ["automation", "agent", "workflow"])) return "automation";
  if (containsAny(textValue, ["data", "analytics", "sql", "spreadsheet"])) return "data";
  if (containsAny(textValue, ["learn", "education", "mastery"])) return "learning";
  if (containsAny(textValue, ["business", "finance", "market", "strategy"])) return "business";
  if (containsAny(textValue, ["voice", "translation", "interpreter"])) return "voice";
  if (containsAny(textValue, ["security", "defense", "audit"])) return "security";
  if (containsAny(textValue, ["memory", "notes", "meeting"])) return "memory";
  if (containsAny(textValue, ["identity", "governance", "provider"])) return "governance";

  return "assistant";
}

function inferActionMode(
  key: string,
  title: string,
  subtitle: string,
  families: string[]
): PantaAIActionMode {
  const textValue = `${key} ${title} ${subtitle} ${families.join(" ")}`.toLowerCase();

  if (containsAny(textValue, ["research", "retrieval", "evidence", "browser"])) return "research";
  if (containsAny(textValue, ["code", "coding", "build", "app", "website", "dev"])) return "build";
  if (containsAny(textValue, ["image", "video", "audio", "design", "media", "presentation", "write"])) return "create";
  if (containsAny(textValue, ["automation", "agent", "workflow"])) return "automate";
  if (containsAny(textValue, ["data", "analytics", "sql", "finance", "health"])) return "analyze";
  if (containsAny(textValue, ["voice", "translation", "interpreter"])) return "route";
  if (containsAny(textValue, ["security", "restricted", "audit", "governance"])) return "review";

  return "answer";
}

function buildWorkingPlan(
  goal: string,
  surface: PantaAIActionSurface,
  mode: PantaAIActionMode
): string[] {
  const base = [
    `Capture the user goal: ${goal}`,
    `Classify into PantaAI capability: ${surface.title}`,
    `Use Prime Kernel lane: ${surface.kernelLane}`,
    `Use action mode: ${mode}`,
    "Apply truth, access, memory and safety boundaries before execution",
  ];

  if (mode === "build") {
    base.push("Create implementation plan", "Generate or route code work", "Validate with typecheck/build before completion");
  }

  if (mode === "research") {
    base.push("Collect evidence", "Compare sources", "Return verified answer with uncertainty boundaries");
  }

  if (mode === "create") {
    base.push("Prepare creative brief", "Generate asset/workflow plan", "Preserve style and user intent");
  }

  if (mode === "automate") {
    base.push("Create workflow steps", "Define triggers and fallbacks", "Require approval before external execution");
  }

  if (mode === "review") {
    base.push("Stop open execution", "Create review packet", "Require admin or restricted approval");
  }

  return unique(base);
}

function buildAuditNotes(
  surface: PantaAIActionSurface,
  disposition: PantaAIActionDisposition
): string[] {
  return [
    `Capability key: ${surface.key}`,
    `Access mode: ${surface.accessMode}`,
    `Truth mode: ${surface.truthMode}`,
    `Kernel lane: ${surface.kernelLane}`,
    `Action mode: ${surface.actionMode}`,
    `Disposition: ${disposition}`,
    "External ecosystems are treated as lawful references or integrations, not copied products.",
    "Pantavion exposes organized outcomes to users and keeps provider/tool complexity behind the Prime Kernel.",
  ];
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeText(value: unknown, fallback: string): string {
  return text(value, fallback);
}

function normalizeOptionalText(value: unknown): string | undefined {
  const normalized = text(value);
  return normalized.length > 0 ? normalized : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
}

function numberFromRecord(value: unknown, key: string, fallback: number): number {
  const record = asRecord(value);
  const candidate = record[key];
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : fallback;
}

function unique<T extends string>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function containsAny(textValue: string, fragments: string[]): boolean {
  return fragments.some((fragment) => textValue.includes(fragment));
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
