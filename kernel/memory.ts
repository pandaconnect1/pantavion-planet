import type { KernelStore } from "./store";
import type {
  KernelContext,
  KernelScope,
  MemoryEntry,
  MemoryEntryDraft,
  TruthZone,
} from "./types";
import { createKernelId, nowIso } from "./types";

export interface MemoryRecallOptions {
  scope?: KernelScope;
  limit?: number;
}

export interface KernelMemoryStore {
  addEntry: (entry: MemoryEntryDraft) => MemoryEntry;
  bulkAdd: (entries: MemoryEntryDraft[]) => MemoryEntry[];
  recall: (query: string, options?: MemoryRecallOptions) => MemoryEntry[];
  list: (limit?: number) => MemoryEntry[];
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "into",
  "pantavion",
  "kernel",
  "t??",
  "t??",
  "t??",
  "st?",
  "st?",
  "st??",
  "?a?",
  "?a",
  "t?",
  "ta",
  "t??",
  "t??",
  "µ?a",
  "??a",
  "e?a?",
  "e??a?",
]);

const normalizeKeywords = (text: string): string[] => {
  const matches = text.toLowerCase().match(/[a-z0-9\u0370-\u03ff_-]{3,}/g) ?? [];
  return Array.from(new Set(matches.filter((word) => !STOP_WORDS.has(word)))).slice(0, 20);
};

const inferSummary = (text: string): string =>
  text.length <= 180 ? text : text.slice(0, 177).trimEnd() + "...";

const inferRelevance = (text: string): number => {
  const lower = text.toLowerCase();
  let score = 0.4;

  if (lower.includes("pantavion")) score += 0.2;
  if (lower.includes("kernel")) score += 0.2;
  if (lower.includes("build") || lower.includes("create") || lower.includes("orchestr")) score += 0.1;
  if (text.length > 160) score += 0.05;

  return Math.max(0, Math.min(score, 1));
};

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values));

export const createMemoryStore = (store: KernelStore): KernelMemoryStore => {
  const addEntry = (entry: MemoryEntryDraft): MemoryEntry => {
    const now = nowIso();

    const finalEntry: MemoryEntry = {
      id: entry.id ?? createKernelId("mem"),
      createdAt: entry.createdAt ?? now,
      updatedAt: entry.updatedAt ?? now,
      scope: entry.scope,
      memoryClass: entry.memoryClass,
      privacyClass: entry.privacyClass,
      truthZone: entry.truthZone,
      content: entry.content,
      summary: entry.summary,
      keywords: uniqueStrings(entry.keywords),
      sourceIntakeId: entry.sourceIntakeId,
      relevance: entry.relevance,
      eligibleScopes: uniqueStrings(entry.eligibleScopes) as any,
      metadata: entry.metadata,
    };

    store.mutate((state) => {
      state.memory.entries.push(finalEntry);
      state.memory.indexKeywords = uniqueStrings(
        state.memory.entries.flatMap((memory) => memory.keywords)
      ).slice(0, 1000);
    });

    return finalEntry;
  };

  return {
    addEntry,

    bulkAdd: (entries: MemoryEntryDraft[]): MemoryEntry[] => entries.map(addEntry),

    recall: (query: string, options?: MemoryRecallOptions): MemoryEntry[] => {
      const state = store.snapshot();
      const limit = options?.limit ?? 8;
      const keywords = normalizeKeywords(query);

      const scored = state.memory.entries
        .filter((entry) => (options?.scope ? entry.scope === options.scope : true))
        .map((entry) => {
          const score =
            keywords.filter((keyword) => entry.keywords.includes(keyword)).length +
            (entry.content.toLowerCase().includes(query.toLowerCase()) ? 2 : 0) +
            entry.relevance;
          return { entry, score };
        })
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, limit)
        .map((item) => item.entry);

      return scored;
    },

    list: (limit?: number): MemoryEntry[] => {
      const state = store.snapshot();
      return state.memory.entries.slice(-(limit ?? 20));
    },
  };
};

export const buildMemoryCandidatesFromIntake = (
  normalizedText: string,
  context: KernelContext,
  scope: KernelScope,
  truthZone: TruthZone,
  sourceIntakeId: string
): MemoryEntryDraft[] => {
  const text = normalizedText.trim();
  if (!text) return [];

  const keywords = normalizeKeywords(text);
  const summary = inferSummary(text);
  const relevance = inferRelevance(text);
  const lower = text.toLowerCase();

  const candidates: MemoryEntryDraft[] = [
    {
      scope,
      memoryClass:
        scope === "project"
          ? "project"
          : scope === "workspace"
          ? "workspace"
          : scope === "thread"
          ? "thread"
          : "session",
      privacyClass: "private",
      truthZone,
      content: text,
      summary,
      keywords,
      sourceIntakeId,
      relevance,
      eligibleScopes:
        scope === "project"
          ? ["project", "workspace", "thread", "session"]
          : ["thread", "session", "workspace"],
      metadata: {
        sessionId: context.sessionId,
        threadId: context.threadId,
        workspaceId: context.workspaceId,
        projectId: context.projectId,
      },
    },
  ];

  const strategicMarkers = [
    "pantavion",
    "kernel",
    "ecosystem",
    "orchestrator",
    "registry",
    "multimodal",
    "governance",
    "continuity",
    "colossus",
  ];

  const strategicHit = strategicMarkers.some((marker) => lower.includes(marker));

  if (strategicHit) {
    candidates.push({
      scope: context.projectId ? "project" : "workspace",
      memoryClass: "strategic_durable",
      privacyClass: "internal",
      truthZone,
      content: text,
      summary,
      keywords,
      sourceIntakeId,
      relevance: Math.max(relevance, 0.85),
      eligibleScopes: ["project", "workspace", "thread", "session"],
      metadata: {
        strategic: true,
        projectId: context.projectId,
        workspaceId: context.workspaceId,
      },
    });
  }

  return candidates;
};

/* PANTAVION_LEGACY_MEMORY_COMPAT */
const cloneMemoryCompat = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const addMemoryEntry = (state: any, entry: any): any => {
  const next = cloneMemoryCompat(state ?? {});
  next.memory = next.memory ?? {};
  next.memory.entries = Array.isArray(next.memory.entries) ? next.memory.entries : [];
  next.memory.indexKeywords = Array.isArray(next.memory.indexKeywords) ? next.memory.indexKeywords : [];
  next.memory.lastUpdated = nowIso();

  const content =
    typeof entry === "string"
      ? entry
      : String(entry?.content ?? entry?.summary ?? entry?.title ?? "Legacy memory entry");

  const normalized = {
    id: entry?.id ?? createKernelId("mem"),
    createdAt: entry?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    scope: entry?.scope ?? "thread",
    memoryClass: entry?.memoryClass ?? "thread",
    privacyClass: entry?.privacyClass ?? "private",
    truthZone: entry?.truthZone ?? "likely",
    content,
    summary: entry?.summary ?? inferSummary(content),
    keywords: Array.isArray(entry?.keywords) ? entry.keywords : normalizeKeywords(content),
    sourceIntakeId: entry?.sourceIntakeId,
    relevance: typeof entry?.relevance === "number" ? entry.relevance : inferRelevance(content),
    eligibleScopes: Array.isArray(entry?.eligibleScopes) ? entry.eligibleScopes : ["thread", "session", "workspace"],
    metadata: entry?.metadata ?? {},
  };

  next.memory.entries.push(normalized);
  next.memory.indexKeywords = Array.from(
    new Set([...(next.memory.indexKeywords ?? []), ...(normalized.keywords ?? [])])
  );

  return next;
};
