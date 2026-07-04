// core/pantavion/memory/pantavion-runtime-memory.ts

import type { PantavionExecutionMemoryWrite } from "../execution/pantavion-execution-bus";

export type PantavionRuntimeMemoryScope =
  | "session"
  | "runtime"
  | "module"
  | "archive";

export type PantavionRuntimeMemoryEntry = {
  id: string;
  key: string;
  title: string;
  summary: string;
  scope: PantavionRuntimeMemoryScope;
  createdAt: string;
  updatedAt: string;
};

export type PantavionRuntimeMemoryQuery = {
  scope?: PantavionRuntimeMemoryScope;
  key?: string;
  limit?: number;
};

export class PantavionRuntimeMemoryStore {
  private readonly entries: PantavionRuntimeMemoryEntry[] = [];

  write(write: PantavionExecutionMemoryWrite): PantavionRuntimeMemoryEntry {
    const now = new Date().toISOString();

    const existingIndex = this.entries.findIndex(
      (item) => item.scope === write.scope && item.key === write.key
    );

    if (existingIndex >= 0) {
      const existing = this.entries[existingIndex];
      const updated: PantavionRuntimeMemoryEntry = {
        ...existing,
        title: write.title,
        summary: write.summary,
        updatedAt: now,
      };
      this.entries[existingIndex] = updated;
      return updated;
    }

    const created: PantavionRuntimeMemoryEntry = {
      id: createMemoryId(),
      key: write.key,
      title: write.title,
      summary: write.summary,
      scope: write.scope,
      createdAt: now,
      updatedAt: now,
    };

    this.entries.unshift(created);
    return created;
  }

  writeMany(writes: PantavionExecutionMemoryWrite[]) {
    return writes.map((item) => this.write(item));
  }

  query(filters: PantavionRuntimeMemoryQuery = {}): PantavionRuntimeMemoryEntry[] {
    let items = [...this.entries];

    if (filters.scope) {
      items = items.filter((item) => item.scope === filters.scope);
    }

    if (filters.key) {
      items = items.filter((item) => item.key === filters.key);
    }

    return items.slice(0, filters.limit ?? 50);
  }

  getLatest(): PantavionRuntimeMemoryEntry | null {
    return this.entries[0] ?? null;
  }

  getSummary() {
    return {
      total: this.entries.length,
      session: this.entries.filter((item) => item.scope === "session").length,
      runtime: this.entries.filter((item) => item.scope === "runtime").length,
      module: this.entries.filter((item) => item.scope === "module").length,
      archive: this.entries.filter((item) => item.scope === "archive").length,
    };
  }

  clear() {
    this.entries.splice(0, this.entries.length);
  }
}

export function createPantavionRuntimeMemoryStore() {
  return new PantavionRuntimeMemoryStore();
}

function createMemoryId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pantavion_memory_${crypto.randomUUID()}`;
  }

  return `pantavion_memory_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
