export type PantavionExecutionStatus =
  | 'queued'
  | 'planned'
  | 'running'
  | 'paused'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface PantavionExecutionCheckpoint {
  id: string;
  at: string;
  label: string;
  state: Record<string, unknown>;
}

export interface PantavionDurableExecutionRecord {
  executionId: string;
  idempotencyKey: string;
  status: PantavionExecutionStatus;
  createdAt: string;
  updatedAt: string;
  attempt: number;
  checkpoints: PantavionExecutionCheckpoint[];
  lastError?: string;
}

export function createExecutionRecord(
  executionId: string,
  idempotencyKey: string,
): PantavionDurableExecutionRecord {
  const now = new Date().toISOString();

  return {
    executionId,
    idempotencyKey,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    attempt: 0,
    checkpoints: [],
  };
}

export function appendCheckpoint(
  record: PantavionDurableExecutionRecord,
  label: string,
  state: Record<string, unknown>,
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

export const durableExecutionRuntime: any = {
  register: () => null,
  registerTask: () => null,
  enqueue: () => null,
  execute: async () => null,
  run: async () => null,
  getSnapshot: () => ({
    status: "compatibility_rescue",
    tasks: [],
    queue: [],
  }),
};

export type PantavionDurableExecutionRuntime = typeof durableExecutionRuntime;

