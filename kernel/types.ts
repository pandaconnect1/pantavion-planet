export type KernelId = string;

export type InputModality =
  | "text"
  | "voice"
  | "audio"
  | "image"
  | "video"
  | "pdf"
  | "doc"
  | "screenshot"
  | "diagram"
  | "mixed";

export type KernelScope =
  | "session"
  | "thread"
  | "workspace"
  | "project"
  | "user"
  | "system"
  | "admin";

export type TruthZone =
  | "verified"
  | "likely"
  | "uncertain"
  | "speculative"
  | "unsafe";

export type MemoryClass =
  | "ephemeral"
  | "session"
  | "thread"
  | "workspace"
  | "project"
  | "preference"
  | "strategic_durable"
  | "restricted"
  | "admin";

export type PrivacyClass =
  | "public"
  | "internal"
  | "private"
  | "restricted"
  | "admin";

export type SignalType =
  | "urgency"
  | "risk"
  | "opportunity"
  | "contradiction"
  | "dependency"
  | "missing_information"
  | "escalation_needed"
  | "new_strategic_thread"
  | "learning_need"
  | "workspace_recommendation"
  | "capability_recommendation"
  | "verification_needed"
  | "governance_concern"
  | "user_intent_shift";

export type PriorityBand = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "BACKGROUND";
export type KernelPriority = PriorityBand | Lowercase<PriorityBand>;

export type RadarRing =
  | "core_immediate"
  | "active_near"
  | "monitored"
  | "peripheral"
  | "archived";

export type ExecutionMode = "dry_run" | "commit";

export type PlanStatus = "draft" | "ready" | "running" | "completed" | "failed";

export type PlanStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "blocked"
  | "failed"
  | "skipped";

export type PlanStepKind =
  | "capture"
  | "memory"
  | "signal"
  | "plan"
  | "respond"
  | "review"
  | "execute"
  | "clarify"
  | "governance";

export type CapabilityFamily =
  | "assistants_reasoning"
  | "research_knowledge"
  | "writing_communication"
  | "coding_app_building"
  | "data_analytics"
  | "design_image"
  | "video_media"
  | "audio_voice"
  | "productivity_memory"
  | "automation_integrations"
  | "learning_mastery"
  | "reference_cheatsheets"
  | "architecture_systems"
  | "signal_intelligence"
  | "security_governance";

export interface KernelActor {
  id: string;
  type: "user" | "system" | "admin" | "service";
  name: string;
  email?: string;
  permissions: string[];
}

export interface KernelContext {
  sessionId: string;
  threadId?: string;
  workspaceId?: string;
  projectId?: string;
  locale?: string;
  timezone?: string;
  tags: string[];
}

export interface IntakePacket {
  id: KernelId;
  createdAt: string;
  modality: InputModality;
  raw: string;
  normalizedText: string;
  language: string;
  intent: string;
  entities: string[];
  urgencyHint: number;
  confidence: number;
  truthZone: TruthZone;
  scope: KernelScope;
  metadata: Record<string, unknown>;
}

export interface MemoryEntry {
  id: KernelId;
  createdAt: string;
  updatedAt: string;
  scope: KernelScope;
  memoryClass: MemoryClass;
  privacyClass: PrivacyClass;
  truthZone: TruthZone;
  content: string;
  summary: string;
  keywords: string[];
  sourceIntakeId?: string;
  relevance: number;
  eligibleScopes: KernelScope[];
  metadata: Record<string, unknown>;
}

export type MemoryEntryDraft =
  Omit<MemoryEntry, "id" | "createdAt" | "updatedAt"> &
  Partial<Pick<MemoryEntry, "id" | "createdAt" | "updatedAt">>;

export interface SignalEntry {
  id: KernelId;
  createdAt: string;
  type: SignalType;
  label: string;
  reason: string;
  sourceIntakeId: string;
  score: number;
  confidence: number;
  band: PriorityBand;
  ring: RadarRing;
  truthZone: TruthZone;
  metadata: Record<string, unknown>;
}

export interface PriorityState {
  score: number;
  band: PriorityBand;
  ring: RadarRing;
  topSignalIds: string[];
  updatedAt: string;
}

export interface PlanStep {
  id: KernelId;
  kind: PlanStepKind;
  title: string;
  description: string;
  status: PlanStepStatus;
  requiresApproval: boolean;
  metadata: Record<string, unknown>;
}

export interface Plan {
  id: KernelId;
  createdAt: string;
  updatedAt: string;
  goal: string;
  summary: string;
  sourceIntakeId?: string;
  status: PlanStatus;
  priorityBand: PriorityBand;
  steps: PlanStep[];
  notes: string[];
  fallbackPaths: string[];
  approvalRequired: boolean;
  confidence: number;
}

export interface ExecutionStepResult {
  stepId: KernelId;
  status: PlanStepStatus;
  message: string;
  output?: string;
}

export interface ExecutionRecord {
  id: KernelId;
  planId: KernelId;
  mode: ExecutionMode;
  status: "running" | "completed" | "failed" | "blocked";
  startedAt: string;
  finishedAt?: string;
  stepResults: ExecutionStepResult[];
  summary: string;
  error?: string;
}

export interface AuditEntry {
  id: KernelId;
  createdAt: string;
  level: "info" | "warn" | "error";
  action: string;
  message: string;
  refs: string[];
  metadata: Record<string, unknown>;
}

export interface KernelHealth {
  status: "healthy" | "degraded" | "error";
  degradedReason?: string;
  lastUpdated: string;
  counters: {
    intakes: number;
    memories: number;
    signals: number;
    plans: number;
    executions: number;
  };
}

export interface KernelOutput {
  id: KernelId;
  createdAt: string;
  type: "analysis" | "completion" | "run" | "state";
  title: string;
  content: string;
  truthZone: TruthZone;
  relatedIds: string[];
}

export interface CapabilityProfile {
  id: string;
  family: CapabilityFamily;
  name: string;
  description: string;
  inputModalities: InputModality[];
  outputModalities: InputModality[];
  allowedScopes: KernelScope[];
  trustZoneFloor: TruthZone;
  orchestrationEligible: boolean;
  metadata: Record<string, unknown>;
}

export interface ClassificationResult {
  family: CapabilityFamily;
  confidence: number;
  recommendedCapabilityIds: string[];
}

export interface KernelEvolutionSnapshot {
  generatedAt: string;
  maturity: "baseline" | "expanding" | "orchestrating" | "colossus";
  activeGoalCount: number;
  memoryCount: number;
  signalCount: number;
  planCount: number;
  executionCount: number;
  recommendedNextMoves: string[];
}

export interface KernelState {
  session: {
    id: string;
    createdAt: string;
    updatedAt: string;
    mode: "active" | "idle";
  };
  actor: KernelActor;
  context: KernelContext;
  intake: IntakePacket[];
  inputs: IntakePacket[];
  memory: {
    entries: MemoryEntry[];
    indexKeywords: string[];
    lastUpdated: string;
  };
  continuity: {
    activeGoals: string[];
    lockedBaselines: string[];
    openThreads: string[];
    preferences: string[];
  };
  signals: SignalEntry[];
  priorities: PriorityState;
  plans: Plan[];
  tasks: PlanStep[];
  executions: ExecutionRecord[];
  capabilities: {
    enabled: string[];
    recommended: string[];
  };
  policies: {
    safeMode: boolean;
    truthFloor: TruthZone;
    privacyMode: "balanced" | "strict";
    requireApprovalForCommit: boolean;
  };
  audit: AuditEntry[];
  health: KernelHealth;
  outputs: KernelOutput[];
}

export interface KernelStateSummary {
  sessionId: string;
  status: KernelHealth["status"];
  counts: KernelHealth["counters"];
  priorityBand: PriorityBand;
  radarRing: RadarRing;
  activeGoalCount: number;
  recommendedCapabilities: string[];
  lastPlanId?: string;
  lastOutputType?: KernelOutput["type"];
  updatedAt: string;
}

export interface KernelIntakeRequest {
  raw?: string;
  text?: string;
  modality?: InputModality;
  scope?: KernelScope;
  truthZone?: TruthZone;
  metadata?: Record<string, unknown>;
  context?: Partial<KernelContext>;
  actor?: Partial<KernelActor>;
}

export interface KernelAnalyzeRequest extends KernelIntakeRequest {}

export interface KernelCompleteRequest {
  prompt?: string;
  planId?: string;
  includeAudit?: boolean;
}

export interface KernelRunRequest {
  planId?: string;
  mode?: ExecutionMode;
}

export interface KernelIntakeResult {
  ok: boolean;
  packet: IntakePacket;
  recommendedCapabilities: string[];
  summary: string;
}

export interface KernelAnalysisResult {
  ok: boolean;
  packet: IntakePacket;
  memories: MemoryEntry[];
  signals: SignalEntry[];
  priority: PriorityState;
  plan: Plan;
  output: KernelOutput;
}

export interface KernelCompletionResult {
  ok: boolean;
  output: KernelOutput;
  plan?: Plan;
  auditSummary?: string;
}

export interface KernelRunResult {
  ok: boolean;
  execution: ExecutionRecord;
  output: KernelOutput;
  plan: Plan;
}

export const nowIso = (): string => new Date().toISOString();

export const createKernelId = (prefix: string = "pk"): string => {
  const cryptoRef = globalThis.crypto as { randomUUID?: () => string } | undefined;
  const raw = cryptoRef?.randomUUID ? cryptoRef.randomUUID() : Math.random().toString(36).slice(2, 12);
  return prefix + "_" + raw.replace(/-/g, "");
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));


