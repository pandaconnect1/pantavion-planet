export type KernelIntent =
  | "memory"
  | "registry"
  | "planning"
  | "execution"
  | "audit"
  | "build"
  | "governance"
  | "orchestration"
  | "unknown";

export type KernelActionType =
  | "memory.upsert"
  | "registry.upsert"
  | "plan.record"
  | "run.record";

export type KernelRegistryKind =
  | "capability"
  | "tool"
  | "workflow"
  | "model"
  | "module"
  | "policy"
  | "memory_class"
  | "planner"
  | "runner"
  | "orchestrator"
  | "governance_rule"
  | "unknown";

export interface KernelAnalysis {
  normalizedInput: string;
  intent: KernelIntent;
  confidence: number;
  keywords: string[];
  requestedScopes: string[];
  wantsMemory: boolean;
  wantsRegistry: boolean;
  wantsPlanning: boolean;
  wantsExecution: boolean;
  wantsAudit: boolean;
  wantsGovernance: boolean;
  wantsBuild: boolean;
  wantsOrchestration: boolean;
}

export interface KernelMemoryItem {
  id: string;
  scope: string;
  title: string;
  content: string;
  tags: string[];
  sourceInput: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface KernelRegistryItem {
  id: string;
  name: string;
  kind: KernelRegistryKind;
  description: string;
  tags: string[];
  status: "candidate" | "active" | "blocked";
  sourceInput: string;
  createdAt: string;
  updatedAt: string;
}

export interface KernelPlanStep {
  id: string;
  title: string;
  detail: string;
  status: "pending" | "approved" | "skipped";
}

export interface KernelPlan {
  id: string;
  scope: string;
  objective: string;
  intent: KernelIntent;
  createdAt: string;
  steps: KernelPlanStep[];
}

export interface GovernedAction {
  id: string;
  type: KernelActionType;
  approved: boolean;
  reason: string;
  payload: Record<string, unknown>;
}

export interface KernelRunActionResult {
  actionId: string;
  type: KernelActionType;
  status: "executed" | "skipped" | "blocked";
  reason: string;
}

export interface KernelRun {
  id: string;
  input: string;
  normalizedInput: string;
  summary: string;
  createdAt: string;
  actions: KernelRunActionResult[];
}

export type KernelLedgerEventType =
  | "memory.upserted"
  | "registry.upserted"
  | "plan.recorded"
  | "run.recorded";

export interface KernelLedgerEvent<TPayload = unknown> {
  id: string;
  type: KernelLedgerEventType;
  createdAt: string;
  payload: TPayload;
}

export interface KernelState {
  memory: Record<string, KernelMemoryItem>;
  registry: Record<string, KernelRegistryItem>;
  plans: KernelPlan[];
  runs: KernelRun[];
  eventCount: number;
  lastUpdatedAt: string | null;
}

export interface KernelCompletionRequest {
  input: string;
  scope?: string;
  actor?: string;
  commit?: boolean;
}

export interface KernelCompletionResult {
  ok: boolean;
  analysis: KernelAnalysis;
  proposedMemory: KernelMemoryItem[];
  proposedRegistry: KernelRegistryItem[];
  plan: KernelPlan;
  governance: GovernedAction[];
  execution: KernelRunActionResult[];
  state: {
    memoryCount: number;
    registryCount: number;
    planCount: number;
    runCount: number;
    eventCount: number;
    lastUpdatedAt: string | null;
  };
}
