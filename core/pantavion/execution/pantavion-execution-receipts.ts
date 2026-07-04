// core/pantavion/execution/pantavion-execution-receipts.ts

import type {
  PantavionExecutionAudit,
  PantavionExecutionMemoryWrite,
  PantavionExecutionOutput,
  PantavionExecutionReceipt,
  PantavionExecutionStatus,
  PantavionExecutionTask,
  PantavionExecutionKind,
} from "./pantavion-execution-bus";

export type PantavionReceiptStoreRecord = PantavionExecutionReceipt & {
  createdAt: string;
  updatedAt: string;
};

export type PantavionReceiptQuery = {
  taskId?: string;
  status?: PantavionExecutionStatus;
  kind?: PantavionExecutionKind;
  adapterKey?: string | null;
  limit?: number;
};

export class PantavionExecutionReceiptStore {
  private readonly receipts: PantavionReceiptStoreRecord[] = [];

  add(receipt: PantavionExecutionReceipt): PantavionReceiptStoreRecord {
    const now = new Date().toISOString();

    const record: PantavionReceiptStoreRecord = {
      ...receipt,
      createdAt: now,
      updatedAt: now,
    };

    this.receipts.unshift(record);
    return record;
  }

  upsert(receipt: PantavionExecutionReceipt): PantavionReceiptStoreRecord {
    const index = this.receipts.findIndex((item) => item.id === receipt.id);
    const now = new Date().toISOString();

    if (index === -1) {
      const created: PantavionReceiptStoreRecord = {
        ...receipt,
        createdAt: now,
        updatedAt: now,
      };
      this.receipts.unshift(created);
      return created;
    }

    const existing = this.receipts[index];
    const updated: PantavionReceiptStoreRecord = {
      ...receipt,
      createdAt: existing.createdAt,
      updatedAt: now,
    };

    this.receipts[index] = updated;
    return updated;
  }

  getById(id: string): PantavionReceiptStoreRecord | null {
    return this.receipts.find((item) => item.id === id) ?? null;
  }

  getLatest(): PantavionReceiptStoreRecord | null {
    return this.receipts[0] ?? null;
  }

  query(filters: PantavionReceiptQuery = {}): PantavionReceiptStoreRecord[] {
    let items = [...this.receipts];

    if (filters.taskId) {
      items = items.filter((item) => item.taskId === filters.taskId);
    }

    if (filters.status) {
      items = items.filter((item) => item.status === filters.status);
    }

    if (filters.kind) {
      items = items.filter((item) => item.kind === filters.kind);
    }

    if (typeof filters.adapterKey !== "undefined") {
      items = items.filter((item) => item.adapterKey === filters.adapterKey);
    }

    return items.slice(0, filters.limit ?? 50);
  }

  getSummary() {
    const total = this.receipts.length;

    return {
      total,
      succeeded: this.receipts.filter((item) => item.status === "succeeded").length,
      failed: this.receipts.filter((item) => item.status === "failed").length,
      blocked: this.receipts.filter((item) => item.status === "blocked").length,
      reviewRequired: this.receipts.filter((item) => item.status === "review_required").length,
      timedOut: this.receipts.filter((item) => item.status === "timed_out").length,
    };
  }

  clear() {
    this.receipts.splice(0, this.receipts.length);
  }
}

export function createPantavionExecutionReceiptStore() {
  return new PantavionExecutionReceiptStore();
}

export function buildPantavionExecutionReceipt(args: {
  task: Pick<PantavionExecutionTask, "id" | "kind">;
  status: PantavionExecutionStatus;
  adapterKey?: string | null;
  adapterLabel?: string | null;
  output?: PantavionExecutionOutput;
  warnings?: string[];
  errors?: string[];
  memoryWrites?: PantavionExecutionMemoryWrite[];
  audit?: Partial<PantavionExecutionAudit>;
}): PantavionExecutionReceipt {
  const now = new Date().toISOString();

  return {
    id: createReceiptId(),
    taskId: args.task.id,
    status: args.status,
    kind: args.task.kind,
    adapterKey: args.adapterKey ?? null,
    adapterLabel: args.adapterLabel ?? null,
    output: args.output ?? {
      kind: "none",
      title: "Pantavion receipt",
      summary: "Pantavion produced a receipt without explicit output payload.",
    },
    warnings: dedupeStrings(args.warnings ?? []),
    errors: dedupeStrings(args.errors ?? []),
    memoryWrites: dedupeMemoryWrites(args.memoryWrites ?? []),
    audit: {
      taskId: args.task.id,
      adapterKey: args.adapterKey ?? null,
      policyDecision: args.audit?.policyDecision ?? "none",
      startedAt: args.audit?.startedAt ?? now,
      endedAt: args.audit?.endedAt ?? now,
      durationMs: args.audit?.durationMs ?? 0,
      timeoutMs: args.audit?.timeoutMs ?? 0,
    },
  };
}

export function buildPantavionBlockedReceipt(args: {
  task: Pick<PantavionExecutionTask, "id" | "kind">;
  reason: string;
}): PantavionExecutionReceipt {
  return buildPantavionExecutionReceipt({
    task: args.task,
    status: "blocked",
    output: {
      kind: "none",
      title: "Pantavion execution blocked",
      summary: args.reason,
    },
    errors: [args.reason],
  });
}

export function buildPantavionSuccessReceipt(args: {
  task: Pick<PantavionExecutionTask, "id" | "kind">;
  adapterKey?: string | null;
  adapterLabel?: string | null;
  summary: string;
  payload?: unknown;
  warnings?: string[];
  memoryWrites?: PantavionExecutionMemoryWrite[];
}): PantavionExecutionReceipt {
  return buildPantavionExecutionReceipt({
    task: args.task,
    status: "succeeded",
    adapterKey: args.adapterKey ?? null,
    adapterLabel: args.adapterLabel ?? null,
    output: {
      kind: "json",
      title: "Pantavion execution success",
      summary: args.summary,
      payload: args.payload,
    },
    warnings: args.warnings ?? [],
    memoryWrites: args.memoryWrites ?? [],
  });
}

function createReceiptId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pantavion_receipt_${crypto.randomUUID()}`;
  }

  return `pantavion_receipt_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function dedupeMemoryWrites(
  values: PantavionExecutionMemoryWrite[]
): PantavionExecutionMemoryWrite[] {
  const seen = new Set<string>();
  const output: PantavionExecutionMemoryWrite[] = [];

  for (const item of values) {
    const key = `${item.scope}:${item.key}:${item.summary}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }

  return output;
}
