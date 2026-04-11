import type { CanonicalKernelState, CanonicalKernelAuditEntry } from "./canonical-store";

export type CanonicalMemoryEntry = {
  id: string;
  scope: string;
  text: string;
  createdAtIso: string;
  updatedAtIso: string;
  source?: string;
  tags: string[];
  meta: Record<string, unknown>;
};

export type CanonicalMemoryState = {
  entries: CanonicalMemoryEntry[];
  lastUpdatedIso: string;
};

export const createCanonicalMemoryState = (): CanonicalMemoryState => ({
  entries: [],
  lastUpdatedIso: new Date().toISOString(),
});

export const upsertCanonicalMemoryEntry = (
  state: CanonicalMemoryState,
  entry: CanonicalMemoryEntry
): CanonicalMemoryState => {
  const nextEntries = [...state.entries];
  const index = nextEntries.findIndex((x) => x.id === entry.id);

  if (index >= 0) {
    nextEntries[index] = {
      ...nextEntries[index],
      ...entry,
      updatedAtIso: new Date().toISOString(),
    };
  } else {
    nextEntries.push({
      ...entry,
      createdAtIso: entry.createdAtIso || new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
    });
  }

  return {
    entries: nextEntries,
    lastUpdatedIso: new Date().toISOString(),
  };
};

export const removeCanonicalMemoryEntry = (
  state: CanonicalMemoryState,
  id: string
): CanonicalMemoryState => ({
  entries: state.entries.filter((x) => x.id !== id),
  lastUpdatedIso: new Date().toISOString(),
});

export const summarizeCanonicalMemory = (
  state: CanonicalMemoryState
): {
  totalEntries: number;
  scopes: string[];
  tags: string[];
  lastUpdatedIso: string;
} => {
  const scopes = Array.from(new Set(state.entries.map((x) => x.scope).filter(Boolean))).sort();
  const tags = Array.from(new Set(state.entries.flatMap((x) => x.tags || []).filter(Boolean))).sort();

  return {
    totalEntries: state.entries.length,
    scopes,
    tags,
    lastUpdatedIso: state.lastUpdatedIso,
  };
};

export const attachCanonicalMemoryAudit = (
  audit: CanonicalKernelAuditEntry[],
  action: string,
  message: string
): CanonicalKernelAuditEntry[] => {
  const entry: CanonicalKernelAuditEntry = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level: "info",
    action,
    message,
    createdAt: new Date().toISOString(),
    refs: [],
    metadata: {},
  };

  return [...audit, entry];
};

export const projectCanonicalMemoryIntoKernelState = (
  state: CanonicalKernelState,
  memory: CanonicalMemoryState
): CanonicalKernelState & { memorySummary: ReturnType<typeof summarizeCanonicalMemory> } => {
  return {
    ...state,
    memorySummary: summarizeCanonicalMemory(memory),
  };
};

