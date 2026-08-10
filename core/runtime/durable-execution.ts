export type PantavionExecutionStatus =
  | "queued"
  | "planned"
  | "running"
  | "paused"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface PantavionExecutionCheckpoint {
  id: string;
  at: string;
  label: string;
  state: Record<string, unknown>;
}

export interface PantavionDurableExecutionRecord {
  executionId: string;
  idempotencyKey: string;
  taskName?: string;
  status: PantavionExecutionStatus;
  createdAt: string;
  updatedAt: string;
  attempt: number;
  maxAttempts?: number;
  input?: unknown;
  output?: unknown;
  checkpoints: PantavionExecutionCheckpoint[];
  lastError?: string;
}

export interface PantavionDurableExecutionStore {
  get(executionId: string): Promise<PantavionDurableExecutionRecord | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<PantavionDurableExecutionRecord | null>;
  put(record: PantavionDurableExecutionRecord): Promise<void>;
  list(limit?: number): Promise<PantavionDurableExecutionRecord[]>;
}

export type PantavionExecutionCheckpointWriter = (
  label: string,
  state?: Record<string, unknown>,
) => Promise<PantavionDurableExecutionRecord>;

export interface PantavionExecutionContext<TInput = unknown> {
  executionId: string;
  idempotencyKey: string;
  input: TInput;
  attempt: number;
  checkpoint: PantavionExecutionCheckpointWriter;
  getRecord: () => Promise<PantavionDurableExecutionRecord | null>;
  assertActive: () => Promise<void>;
}

export type PantavionExecutionHandler<TInput = unknown, TOutput = unknown> = (
  context: PantavionExecutionContext<TInput>,
) => Promise<TOutput> | TOutput;

export interface PantavionTaskDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  handler: PantavionExecutionHandler<TInput, TOutput>;
  maxAttempts?: number;
}

export interface PantavionEnqueueRequest<TInput = unknown> {
  taskName: string;
  input: TInput;
  idempotencyKey: string;
  executionId?: string;
  maxAttempts?: number;
}

export interface PantavionDurableExecutionSnapshot {
  status: "operational";
  tasks: string[];
  queue: string[];
  executions: PantavionDurableExecutionRecord[];
}

export class PantavionExecutionPausedError extends Error {
  constructor() {
    super("execution_paused");
    this.name = "PantavionExecutionPausedError";
  }
}

export class PantavionExecutionCancelledError extends Error {
  constructor() {
    super("execution_cancelled");
    this.name = "PantavionExecutionCancelledError";
  }
}

function newExecutionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `px_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function createExecutionRecord(
  executionId: string,
  idempotencyKey: string,
  taskName?: string,
  input?: unknown,
  maxAttempts = 3,
): PantavionDurableExecutionRecord {
  const now = new Date().toISOString();

  return {
    executionId,
    idempotencyKey,
    taskName,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    attempt: 0,
    maxAttempts,
    input,
    checkpoints: [],
  };
}

export function appendCheckpoint(
  record: PantavionDurableExecutionRecord,
  label: string,
  state: Record<string, unknown> = {},
): PantavionDurableExecutionRecord {
  const checkpoint: PantavionExecutionCheckpoint = {
    id: `${record.executionId}:${record.checkpoints.length + 1}`,
    at: new Date().toISOString(),
    label,
    state,
  };

  return {
    ...record,
    updatedAt: checkpoint.at,
    checkpoints: [...record.checkpoints, checkpoint],
  };
}

export class PantavionMemoryExecutionStore implements PantavionDurableExecutionStore {
  private readonly records = new Map<string, PantavionDurableExecutionRecord>();

  async get(executionId: string) {
    return this.records.get(executionId) ?? null;
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    for (const record of this.records.values()) {
      if (record.idempotencyKey === idempotencyKey) return record;
    }
    return null;
  }

  async put(record: PantavionDurableExecutionRecord) {
    this.records.set(record.executionId, record);
  }

  async list(limit = 100) {
    return [...this.records.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }
}

export class PantavionDurableExecutionRuntimeEngine {
  private readonly tasks = new Map<string, PantavionTaskDefinition>();
  private readonly queue: string[] = [];
  private draining = false;

  constructor(private readonly store: PantavionDurableExecutionStore = new PantavionMemoryExecutionStore()) {}

  register<TInput = unknown, TOutput = unknown>(definition: PantavionTaskDefinition<TInput, TOutput>) {
    if (!definition.name.trim()) throw new Error("task_name_required");
    if (this.tasks.has(definition.name)) throw new Error(`task_already_registered:${definition.name}`);
    this.tasks.set(definition.name, definition as PantavionTaskDefinition);
    return this;
  }

  registerTask<TInput = unknown, TOutput = unknown>(
    name: string,
    handler: PantavionExecutionHandler<TInput, TOutput>,
    options: { maxAttempts?: number } = {},
  ) {
    return this.register({ name, handler, maxAttempts: options.maxAttempts });
  }

  async enqueue<TInput = unknown>(request: PantavionEnqueueRequest<TInput>) {
    const task = this.tasks.get(request.taskName);
    if (!task) throw new Error(`task_not_registered:${request.taskName}`);
    if (!request.idempotencyKey.trim()) throw new Error("idempotency_key_required");

    const existing = await this.store.findByIdempotencyKey(request.idempotencyKey);
    if (existing) {
      if (["queued", "planned"].includes(existing.status) && !this.queue.includes(existing.executionId)) {
        this.queue.push(existing.executionId);
      }
      return existing;
    }

    const record = createExecutionRecord(
      request.executionId ?? newExecutionId(),
      request.idempotencyKey,
      request.taskName,
      request.input,
      Math.max(1, request.maxAttempts ?? task.maxAttempts ?? 3),
    );
    await this.store.put(record);
    this.queue.push(record.executionId);
    return record;
  }

  async plan(executionId: string, state: Record<string, unknown> = {}) {
    const record = await this.requireRecord(executionId);
    if (!["queued", "planned"].includes(record.status)) return record;
    const planned = appendCheckpoint(
      { ...record, status: "planned", updatedAt: new Date().toISOString() },
      "planned",
      state,
    );
    await this.store.put(planned);
    return planned;
  }

  async checkpoint(executionId: string, label: string, state: Record<string, unknown> = {}) {
    const record = await this.requireRecord(executionId);
    if (["succeeded", "failed", "cancelled"].includes(record.status)) {
      throw new Error(`execution_terminal:${record.status}`);
    }
    const updated = appendCheckpoint(record, label, state);
    await this.store.put(updated);
    return updated;
  }

  async pause(executionId: string) {
    const record = await this.requireRecord(executionId);
    if (["succeeded", "failed", "cancelled"].includes(record.status)) return record;
    const updated = appendCheckpoint(
      { ...record, status: "paused", updatedAt: new Date().toISOString() },
      "paused",
    );
    await this.store.put(updated);
    return updated;
  }

  async resume(executionId: string) {
    const record = await this.requireRecord(executionId);
    if (record.status !== "paused" && record.status !== "failed") return record;
    const maxAttempts = record.maxAttempts ?? 3;
    if (record.attempt >= maxAttempts) throw new Error("execution_attempts_exhausted");
    const updated = appendCheckpoint(
      { ...record, status: "queued", lastError: undefined, updatedAt: new Date().toISOString() },
      "resumed",
    );
    await this.store.put(updated);
    if (!this.queue.includes(executionId)) this.queue.push(executionId);
    return updated;
  }

  async cancel(executionId: string, reason = "cancelled") {
    const record = await this.requireRecord(executionId);
    if (["succeeded", "failed", "cancelled"].includes(record.status)) return record;
    const updated = appendCheckpoint(
      { ...record, status: "cancelled", updatedAt: new Date().toISOString() },
      "cancelled",
      { reason },
    );
    await this.store.put(updated);
    const index = this.queue.indexOf(executionId);
    if (index >= 0) this.queue.splice(index, 1);
    return updated;
  }

  async execute(executionId: string): Promise<PantavionDurableExecutionRecord> {
    let record = await this.requireRecord(executionId);
    if (["succeeded", "cancelled"].includes(record.status)) return record;
    if (record.status === "paused") throw new PantavionExecutionPausedError();
    if (!record.taskName) throw new Error("execution_task_missing");

    const task = this.tasks.get(record.taskName);
    if (!task) throw new Error(`task_not_registered:${record.taskName}`);

    const maxAttempts = record.maxAttempts ?? task.maxAttempts ?? 3;
    if (record.attempt >= maxAttempts) return record;

    record = appendCheckpoint(
      {
        ...record,
        status: "running",
        attempt: record.attempt + 1,
        lastError: undefined,
        updatedAt: new Date().toISOString(),
      },
      "attempt_started",
      { attempt: record.attempt + 1, maxAttempts },
    );
    await this.store.put(record);

    const assertActive = async () => {
      const current = await this.requireRecord(executionId);
      if (current.status === "cancelled") throw new PantavionExecutionCancelledError();
      if (current.status === "paused") throw new PantavionExecutionPausedError();
    };

    try {
      const output = await task.handler({
        executionId,
        idempotencyKey: record.idempotencyKey,
        input: record.input,
        attempt: record.attempt,
        checkpoint: (label, state = {}) => this.checkpoint(executionId, label, state),
        getRecord: () => this.store.get(executionId),
        assertActive,
      });
      await assertActive();
      const latest = await this.requireRecord(executionId);
      const succeeded = appendCheckpoint(
        {
          ...latest,
          status: "succeeded",
          output,
          lastError: undefined,
          updatedAt: new Date().toISOString(),
        },
        "succeeded",
      );
      await this.store.put(succeeded);
      return succeeded;
    } catch (error) {
      if (error instanceof PantavionExecutionCancelledError) return this.requireRecord(executionId);
      if (error instanceof PantavionExecutionPausedError) return this.requireRecord(executionId);

      const latest = await this.requireRecord(executionId);
      const exhausted = latest.attempt >= maxAttempts;
      const failed = appendCheckpoint(
        {
          ...latest,
          status: exhausted ? "failed" : "queued",
          lastError: errorMessage(error),
          updatedAt: new Date().toISOString(),
        },
        exhausted ? "failed" : "retry_scheduled",
        { error: errorMessage(error), attempt: latest.attempt, maxAttempts },
      );
      await this.store.put(failed);
      if (!exhausted && !this.queue.includes(executionId)) this.queue.push(executionId);
      return failed;
    }
  }

  async run(options: { maxExecutions?: number } = {}) {
    if (this.draining) return this.getSnapshot();
    this.draining = true;
    const maxExecutions = Math.max(1, options.maxExecutions ?? 100);
    let processed = 0;

    try {
      while (this.queue.length > 0 && processed < maxExecutions) {
        const executionId = this.queue.shift();
        if (!executionId) break;
        const record = await this.store.get(executionId);
        if (!record || !["queued", "planned"].includes(record.status)) continue;
        await this.execute(executionId);
        processed += 1;
      }
      return this.getSnapshot();
    } finally {
      this.draining = false;
    }
  }

  async get(executionId: string) {
    return this.store.get(executionId);
  }

  async getSnapshot(limit = 100): Promise<PantavionDurableExecutionSnapshot> {
    return {
      status: "operational",
      tasks: [...this.tasks.keys()].sort(),
      queue: [...this.queue],
      executions: await this.store.list(limit),
    };
  }

  private async requireRecord(executionId: string) {
    const record = await this.store.get(executionId);
    if (!record) throw new Error(`execution_not_found:${executionId}`);
    return record;
  }
}

export function createDurableExecutionRuntime(store?: PantavionDurableExecutionStore) {
  return new PantavionDurableExecutionRuntimeEngine(store);
}

export const durableExecutionRuntime = createDurableExecutionRuntime();
export type PantavionDurableExecutionRuntime = PantavionDurableExecutionRuntimeEngine;
