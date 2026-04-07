export interface MemoryRecord {
  id: string;
  timestamp: string;
  input: {
    title: string;
    text: string;
    source: string;
    keywords: string[];
    signals: string[];
  };
  classification: {
    type: string;
    domain: string;
    intent: string;
    confidence: number;
    tags: string[];
  };
  mapping: {
    workspace: string;
    category: string;
    module: string;
    core: string;
    policyZone: string;
  };
  execution: {
    decision: string;
    priority: string;
    reason: string[];
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __PANTAVION_KERNEL_MEMORY__: Map<string, MemoryRecord> | undefined;
}

function getStore(): Map<string, MemoryRecord> {
  if (!globalThis.__PANTAVION_KERNEL_MEMORY__) {
    globalThis.__PANTAVION_KERNEL_MEMORY__ = new Map<string, MemoryRecord>();
  }
  return globalThis.__PANTAVION_KERNEL_MEMORY__;
}

export class KernelMemoryStore {
  private store: Map<string, MemoryRecord>;

  constructor() {
    this.store = getStore();
  }

  save(record: MemoryRecord): MemoryRecord {
    this.store.set(record.id, record);
    return record;
  }

  get(id: string): MemoryRecord | null {
    return this.store.get(id) || null;
  }

  list(): MemoryRecord[] {
    return [...this.store.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  search(query: string): MemoryRecord[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.list();

    return this.list().filter((record) => {
      const haystack = [
        record.input.title,
        record.input.text,
        record.input.source,
        record.classification.type,
        record.classification.domain,
        record.classification.intent,
        record.mapping.workspace,
        record.mapping.category,
        record.mapping.module,
        ...record.input.keywords,
        ...record.classification.tags
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }

  exportSnapshot(): {
    total: number;
    items: MemoryRecord[];
  } {
    const items = this.list();
    return {
      total: items.length,
      items
    };
  }

  clear(): void {
    this.store.clear();
  }
}
