export type KernelPriority = "low" | "medium" | "high" | "critical";
export type ModuleStateValue = "idle" | "active" | "paused";
export type ModuleHealth = "green" | "yellow" | "red";
export type TaskStatus = "queued" | "running" | "done" | "failed";
export type PlannerStatus = "planned" | "queued" | "done" | "blocked";
export type RadarRing = "watch" | "trial" | "adopt" | "hold";

export type MemoryEntry = {
  id: string;
  text: string;
  tags: string[];
  kind: "directive" | "decision" | "context" | "fact" | "signal";
  createdAt: string;
};

export type PlannerEntry = {
  id: string;
  title: string;
  detail: string;
  priority: KernelPriority;
  domain: string;
  status: PlannerStatus;
  createdAt: string;
};

export type TaskEntry = {
  id: string;
  title: string;
  area: string;
  priority: KernelPriority;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  result?: string;
};

export type SignalEntry = {
  id: string;
  name: string;
  category: string;
  description: string;
  impact: number;
  confidence: number;
  urgency: number;
  createdAt: string;
};

export type RadarEntry = {
  id: string;
  signalId: string;
  label: string;
  category: string;
  score: number;
  ring: RadarRing;
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  action: string;
  entity: string;
  message: string;
  createdAt: string;
};

export type ModuleEntry = {
  key: string;
  title: string;
  state: ModuleStateValue;
  health: ModuleHealth;
  runs: number;
  changes: number;
  errors: number;
  lastRunAt?: string;
};

export type CapabilityEntry = {
  id: string;
  key: string;
  title: string;
  owner: string;
  maturity: "seed" | "prototype" | "active" | "stable" | "critical";
  status: "building" | "healthy" | "degraded";
  createdAt: string;
};

export type KernelState = {
  version: number;
  updatedAt: string;
  memory: MemoryEntry[];
  planner: PlannerEntry[];
  tasks: TaskEntry[];
  signals: SignalEntry[];
  radar: RadarEntry[];
  audit: AuditEntry[];
  modules: ModuleEntry[];
  capabilities: CapabilityEntry[];
};
