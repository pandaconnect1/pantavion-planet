import {
  AuditLevel,
  KernelPriority,
  KernelScope,
  KernelSignalRecord,
  createKernelId,
  nowIso,
  normalizeAuditLevel,
  normalizeKernelPriority,
  normalizeKernelScopes,
} from "./canonical-types";

export type CanonicalKernelAuditEntry = {
  id: string;
  action: string;
  message: string;
  level: AuditLevel;
  createdAt: string;
  refs: string[];
  metadata: Record<string, unknown>;
};

export type CanonicalKernelState = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "idle" | "running" | "complete" | "error";
  scopes: KernelScope[];
  priority: KernelPriority;
  signals: KernelSignalRecord[];
  audit: CanonicalKernelAuditEntry[];
  memory: {
    entries: unknown[];
    lastUpdatedAt: string | null;
  };
  planner: {
    tasksQueued: number;
    tasksDone: number;
  };
  metadata: Record<string, unknown>;
};

export function createCanonicalKernelState(
  input: Partial<CanonicalKernelState> = {}
): CanonicalKernelState {
  const createdAt = typeof input.createdAt === "string" && input.createdAt.trim()
    ? input.createdAt
    : nowIso();

  const updatedAt = typeof input.updatedAt === "string" && input.updatedAt.trim()
    ? input.updatedAt
    : createdAt;

  const rawStatus = String(input.status ?? "idle").trim().toLowerCase();
  const status =
    rawStatus === "running" ? "running" :
    rawStatus === "complete" ? "complete" :
    rawStatus === "error" ? "error" :
    "idle";

  return {
    id: typeof input.id === "string" && input.id.trim() ? input.id : createKernelId("state"),
    createdAt,
    updatedAt,
    status,
    scopes: normalizeKernelScopes(input.scopes),
    priority: normalizeKernelPriority(input.priority),
    signals: Array.isArray(input.signals) ? input.signals : [],
    audit: Array.isArray(input.audit) ? input.audit : [],
    memory: {
      entries: Array.isArray(input.memory?.entries) ? input.memory?.entries : [],
      lastUpdatedAt:
        typeof input.memory?.lastUpdatedAt === "string" && input.memory?.lastUpdatedAt.trim()
          ? input.memory.lastUpdatedAt
          : null,
    },
    planner: {
      tasksQueued:
        typeof input.planner?.tasksQueued === "number" && Number.isFinite(input.planner.tasksQueued)
          ? input.planner.tasksQueued
          : 0,
      tasksDone:
        typeof input.planner?.tasksDone === "number" && Number.isFinite(input.planner.tasksDone)
          ? input.planner.tasksDone
          : 0,
    },
    metadata:
      input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
        ? input.metadata
        : {},
  };
}

export function touchCanonicalKernelState(state: CanonicalKernelState): CanonicalKernelState {
  return {
    ...state,
    updatedAt: nowIso(),
  };
}

export function setCanonicalKernelStatus(
  state: CanonicalKernelState,
  status: CanonicalKernelState["status"]
): CanonicalKernelState {
  return touchCanonicalKernelState({
    ...state,
    status,
  });
}

export function appendCanonicalKernelSignal(
  state: CanonicalKernelState,
  signal: Partial<KernelSignalRecord>
): CanonicalKernelState {
  const normalized: KernelSignalRecord = {
    id: typeof signal.id === "string" && signal.id.trim() ? signal.id : createKernelId("signal"),
    name: typeof signal.name === "string" && signal.name.trim() ? signal.name : "Unnamed signal",
    priority: normalizeKernelPriority(signal.priority),
    source: typeof signal.source === "string" && signal.source.trim() ? signal.source : undefined,
    createdAt: typeof signal.createdAt === "string" && signal.createdAt.trim() ? signal.createdAt : nowIso(),
    metadata:
      signal.metadata && typeof signal.metadata === "object" && !Array.isArray(signal.metadata)
        ? signal.metadata
        : {},
  };

  return touchCanonicalKernelState({
    ...state,
    signals: [...state.signals, normalized],
  });
}

export function appendCanonicalKernelAudit(
  state: CanonicalKernelState,
  entry: Partial<CanonicalKernelAuditEntry>
): CanonicalKernelState {
  const normalized: CanonicalKernelAuditEntry = {
    id: typeof entry.id === "string" && entry.id.trim() ? entry.id : createKernelId("audit"),
    action: typeof entry.action === "string" && entry.action.trim() ? entry.action : "unknown",
    message: typeof entry.message === "string" ? entry.message : "",
    level: normalizeAuditLevel(entry.level),
    createdAt: typeof entry.createdAt === "string" && entry.createdAt.trim() ? entry.createdAt : nowIso(),
    refs: Array.isArray(entry.refs)
      ? Array.from(new Set(entry.refs.map((x) => String(x ?? "").trim()).filter(Boolean)))
      : [],
    metadata:
      entry.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata)
        ? entry.metadata
        : {},
  };

  return touchCanonicalKernelState({
    ...state,
    audit: [...state.audit, normalized],
  });
}

export function summarizeCanonicalKernelState(state: CanonicalKernelState) {
  return {
    id: state.id,
    status: state.status,
    priority: state.priority,
    scopes: state.scopes,
    signals: state.signals.length,
    audit: state.audit.length,
    memoryEntries: state.memory.entries.length,
    tasksQueued: state.planner.tasksQueued,
    tasksDone: state.planner.tasksDone,
    updatedAt: state.updatedAt,
  };
}


