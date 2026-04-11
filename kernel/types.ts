export type ISODateString = string;
export type UUID = string;

export type PriorityBand =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "BACKGROUND";

export type PriorityBandLoose = PriorityBand | Lowercase<PriorityBand>;

export type RadarRing =
  | "immediate"
  | "active"
  | "watch"
  | "queued"
  | "archived";

export type KernelScope =
  | "identity"
  | "memory"
  | "signals"
  | "planning"
  | "execution"
  | "continuity"
  | "voice"
  | "chat"
  | "people"
  | "pulse"
  | "compass"
  | "mind"
  | "create"
  | "safety"
  | "admin"
  | "governance"
  | "global"
  | string;

export type KernelOutputType =
  | "analysis"
  | "summary"
  | "completion"
  | "plan"
  | "action"
  | "memory"
  | "signal"
  | "status"
  | "error"
  | string;

export type KernelTaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "blocked"
  | "cancelled"
  | string;

export type KernelExecutionStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | string;

export type KernelHealthStatus =
  | "healthy"
  | "degraded"
  | "critical"
  | "unknown"
  | string;

export type KernelSignalKind =
  | "risk"
  | "opportunity"
  | "goal"
  | "memory"
  | "continuity"
  | "priority"
  | "gap"
  | "governance"
  | "voice"
  | "social"
  | "system"
  | string;

export interface KernelBaseEntity {
  id: UUID;
  createdAt: ISODateString;
  updatedAt?: ISODateString;
}

export interface KernelSession extends KernelBaseEntity {
  id: string;
  project?: string;
  threadId?: string;
  userId?: string;
  title?: string;
  locale?: string;
  timezone?: string;
  status?: string;
  updatedAt: ISODateString;
}

export interface KernelCounters {
  intake: number;
  memory: number;
  signals: number;
  plans: number;
  tasks: number;
  executions: number;
  outputs: number;
  audits: number;
  [key: string]: number;
}

export interface KernelHealth {
  status: KernelHealthStatus;
  score?: number;
  counters: KernelCounters;
  notes?: string[];
  lastCheckedAt?: ISODateString;
  [key: string]: unknown;
}

export interface KernelPriorities {
  band: PriorityBandLoose;
  ring: RadarRing;
  score?: number;
  reasons?: string[];
  recommendedActions?: string[];
  [key: string]: unknown;
}

export interface KernelGoal extends KernelBaseEntity {
  title: string;
  description?: string;
  status?: string;
  priority?: PriorityBandLoose;
  owner?: string;
  targetAt?: ISODateString;
  scope?: KernelScope;
  metadata?: Record<string, unknown>;
}

export interface KernelContinuity {
  activeGoals: KernelGoal[];
  nextActions?: string[];
  blockers?: string[];
  assumptions?: string[];
  lastThreadSummary?: string;
  [key: string]: unknown;
}

export interface KernelCapability {
  id: string;
  key?: string;
  name: string;
  description?: string;
  enabled?: boolean;
  status?: string;
  scopes?: KernelScope[];
  metadata?: Record<string, unknown>;
}

export interface KernelCapabilities {
  enabled: string[];
  recommended: string[];
  available?: KernelCapability[];
  disabled?: string[];
  [key: string]: unknown;
}

export interface KernelIntakeEntry extends KernelBaseEntity {
  source: string;
  type?: string;
  content?: string;
  summary?: string;
  tags?: string[];
  scopes?: KernelScope[];
  metadata?: Record<string, unknown>;
}

export interface MemorySourceRef {
  sourceType?: string;
  sourceId?: string;
  sourceIntakeId?: string;
  sourceUrl?: string;
  [key: string]: unknown;
}

export interface MemoryRecord extends KernelBaseEntity {
  title?: string;
  content: string;
  summary?: string;
  relevance?: number;
  keywords?: string[];
  tags?: string[];
  eligibleScopes?: KernelScope[];
  sourceIntakeId?: string;
  metadata?: Record<string, unknown>;
}

export interface KernelMemoryStore {
  entries: MemoryRecord[];
  lastUpdatedAt?: ISODateString;
  [key: string]: unknown;
}

export interface KernelSignal extends KernelBaseEntity {
  name: string;
  description?: string;
  kind?: KernelSignalKind;
  score?: number;
  priority?: PriorityBandLoose;
  ring?: RadarRing;
  reasons?: string[];
  scopes?: KernelScope[];
  promoted?: boolean;
  metadata?: Record<string, unknown>;
}

export interface KernelPlanStep {
  id: string;
  title: string;
  description?: string;
  status?: KernelTaskStatus;
  owner?: string;
  dueAt?: ISODateString;
  metadata?: Record<string, unknown>;
}

export interface KernelPlan extends KernelBaseEntity {
  title: string;
  description?: string;
  objective?: string;
  priority?: PriorityBandLoose;
  steps: KernelPlanStep[];
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface KernelTask extends KernelBaseEntity {
  title: string;
  description?: string;
  status: KernelTaskStatus;
  priority?: PriorityBandLoose;
  scope?: KernelScope;
  linkedPlanId?: string;
  linkedSignalId?: string;
  metadata?: Record<string, unknown>;
}

export interface KernelExecution extends KernelBaseEntity {
  action: string;
  status: KernelExecutionStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface KernelOutput extends KernelBaseEntity {
  type: KernelOutputType;
  title?: string;
  content?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEntry extends KernelBaseEntity {
  actor?: string;
  action: string;
  target?: string;
  status?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export interface KernelStateSummary {
  sessionId: string;
  status: KernelHealthStatus;
  counts: KernelCounters;
  priorityBand: PriorityBandLoose;
  radarRing: RadarRing;
  activeGoalCount: number;
  recommendedCapabilities: string[];
  lastPlanId?: string;
  lastOutputType?: string;
  updatedAt: ISODateString;
}

export interface KernelModuleState {
  id: string;
  name?: string;
  enabled?: boolean;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface KernelState {
  session: KernelSession;
  health: KernelHealth;
  priorities: KernelPriorities;
  continuity: KernelContinuity;
  capabilities: KernelCapabilities;

  intake: KernelIntakeEntry[];
  memory: KernelMemoryStore;
  signals: KernelSignal[];
  plans: KernelPlan[];
  tasks: KernelTask[];
  executions: KernelExecution[];
  outputs: KernelOutput[];
  audit: AuditEntry[];

  modules?: KernelModuleState[];

  [key: string]: unknown;
}

export interface KernelAnalyzeRequest {
  input?: string;
  content?: string;
  source?: string;
  mode?: string;
  metadata?: Record<string, unknown>;
}

export interface KernelCompleteRequest {
  prompt?: string;
  goal?: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

export interface KernelRunRequest {
  action?: string;
  input?: Record<string, unknown>;
  dryRun?: boolean;
  metadata?: Record<string, unknown>;
}

export interface KernelApiResponse<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
  error?: string;
  summary?: KernelStateSummary;
}

export const PRIORITY_BANDS: PriorityBand[] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "BACKGROUND",
];

export const RADAR_RINGS: RadarRing[] = [
  "immediate",
  "active",
  "watch",
  "queued",
  "archived",
];

export const DEFAULT_COUNTERS: KernelCounters = {
  intake: 0,
  memory: 0,
  signals: 0,
  plans: 0,
  tasks: 0,
  executions: 0,
  outputs: 0,
  audits: 0,
};

export const createEmptyKernelState = (): KernelState => {
  const now = new Date().toISOString();

  return {
    session: {
      id: "kernel-session",
      createdAt: now,
      updatedAt: now,
      status: "active",
      locale: "el-CY",
      timezone: "Asia/Nicosia",
    },
    health: {
      status: "healthy",
      score: 1,
      counters: { ...DEFAULT_COUNTERS },
      notes: [],
      lastCheckedAt: now,
    },
    priorities: {
      band: "BACKGROUND",
      ring: "archived",
      score: 0,
      reasons: [],
      recommendedActions: [],
    },
    continuity: {
      activeGoals: [],
      nextActions: [],
      blockers: [],
      assumptions: [],
      lastThreadSummary: "",
    },
    capabilities: {
      enabled: [],
      recommended: [],
      available: [],
      disabled: [],
    },
    intake: [],
    memory: {
      entries: [],
      lastUpdatedAt: now,
    },
    signals: [],
    plans: [],
    tasks: [],
    executions: [],
    outputs: [],
    audit: [],
    modules: [],
  };
};

export const createMemoryStore = (): KernelMemoryStore => ({
  entries: [],
  lastUpdatedAt: new Date().toISOString(),
});

export const normalizePriorityBand = (value: unknown): PriorityBandLoose => {
  const raw = String(value ?? "BACKGROUND").trim().toUpperCase();

  if (raw === "CRITICAL") return "CRITICAL";
  if (raw === "HIGH") return "HIGH";
  if (raw === "MEDIUM") return "MEDIUM";
  if (raw === "LOW") return "LOW";
  return "BACKGROUND";
};

export const normalizeRadarRing = (value: unknown): RadarRing => {
  const raw = String(value ?? "archived").trim().toLowerCase();

  if (raw === "immediate") return "immediate";
  if (raw === "active") return "active";
  if (raw === "watch") return "watch";
  if (raw === "queued") return "queued";
  return "archived";
};
