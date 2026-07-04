// core/pantavion/execution/pantavion-execution-bus.ts

import type {
  Actor,
  CostMode,
  PrivacyMode,
  SecurityMode,
  WorkspaceFamily,
} from "../../../app/pantavion/pantavion-state";

import type {
  PantavionGoalIntent,
  PantavionOrchestratorPlan,
} from "../../../app/pantavion/pantavion-orchestrator";

import type {
  PantavionCapabilityKey,
  PantavionRoutingDecision,
} from "../../../app/pantavion/pantavion-registry";

import type {
  PantavionPolicyDecision,
  PantavionPolicyEvaluation,
} from "../../../app/pantavion/pantavion-policy";

export type PantavionExecutionStatus =
  | "planned"
  | "review_required"
  | "running"
  | "succeeded"
  | "failed"
  | "blocked"
  | "timed_out";

export type PantavionExecutionKind =
  | "internal"
  | "provider_handoff"
  | "workflow"
  | "simulation"
  | "discovery"
  | "billing"
  | "voice";

export type PantavionExecutionOutputKind =
  | "none"
  | "text"
  | "json"
  | "handoff"
  | "artifact";

export type PantavionExecutionOutput = {
  kind: PantavionExecutionOutputKind;
  title: string;
  summary: string;
  payload?: unknown;
};

export type PantavionExecutionMemoryWrite = {
  key: string;
  title: string;
  summary: string;
  scope: "session" | "runtime" | "module" | "archive";
};

export type PantavionExecutionTask = {
  id: string;
  kind: PantavionExecutionKind;
  goal: string;
  normalizedGoal: string;
  intent: PantavionGoalIntent;
  workspace: WorkspaceFamily;
  capabilities: PantavionCapabilityKey[];
  routingDecisions: PantavionRoutingDecision[];
  actor: Actor;
  countryCode?: string;
  securityMode: SecurityMode;
  privacyMode: PrivacyMode;
  costMode: CostMode;
  preferredAdapterKey?: string | null;
  highImpact?: boolean;
  metadata?: Record<string, unknown>;
};

export type PantavionExecutionAudit = {
  taskId: string;
  adapterKey: string | null;
  policyDecision: PantavionPolicyDecision | "none";
  startedAt: string;
  endedAt: string;
  durationMs: number;
  timeoutMs: number;
};

export type PantavionExecutionReceipt = {
  id: string;
  taskId: string;
  status: PantavionExecutionStatus;
  kind: PantavionExecutionKind;
  adapterKey: string | null;
  adapterLabel: string | null;
  output: PantavionExecutionOutput;
  warnings: string[];
  errors: string[];
  memoryWrites: PantavionExecutionMemoryWrite[];
  audit: PantavionExecutionAudit;
};

export type PantavionExecutionRunInput = {
  task: PantavionExecutionTask;
  orchestratorPlan?: PantavionOrchestratorPlan | null;
  policyEvaluation?: PantavionPolicyEvaluation | null;
  timeoutMs?: number;
  allowReviewBypass?: boolean;
  metadata?: Record<string, unknown>;
};

export type PantavionExecutionAdapterContext = {
  task: PantavionExecutionTask;
  orchestratorPlan?: PantavionOrchestratorPlan | null;
  policyEvaluation?: PantavionPolicyEvaluation | null;
  timeoutMs: number;
  metadata?: Record<string, unknown>;
};

export type PantavionExecutionAdapterResult = {
  status?: Extract<
    PantavionExecutionStatus,
    "succeeded" | "failed" | "timed_out"
  >;
  output: PantavionExecutionOutput;
  warnings?: string[];
  errors?: string[];
  memoryWrites?: PantavionExecutionMemoryWrite[];
};

export type PantavionExecutionAdapter = {
  key: string;
  label: string;
  version: string;
  kinds: PantavionExecutionKind[];
  supports(task: PantavionExecutionTask): boolean;
  execute(
    context: PantavionExecutionAdapterContext
  ): Promise<PantavionExecutionAdapterResult>;
};

export type PantavionExecutionBusOptions = {
  defaultTimeoutMs?: number;
  adapters?: PantavionExecutionAdapter[];
  onReceipt?: (receipt: PantavionExecutionReceipt) => Promise<void> | void;
  now?: () => number;
};

export class PantavionExecutionBus {
  private readonly defaultTimeoutMs: number;
  private readonly adapters: Map<string, PantavionExecutionAdapter>;
  private readonly onReceipt?: (
    receipt: PantavionExecutionReceipt
  ) => Promise<void> | void;
  private readonly now: () => number;

  constructor(options: PantavionExecutionBusOptions = {}) {
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 20_000;
    this.adapters = new Map<string, PantavionExecutionAdapter>();
    this.onReceipt = options.onReceipt;
    this.now = options.now ?? (() => Date.now());

    for (const adapter of options.adapters ?? []) {
      this.registerAdapter(adapter);
    }

    if (!this.adapters.has(PANTAVION_INTERNAL_SUMMARY_ADAPTER.key)) {
      this.registerAdapter(PANTAVION_INTERNAL_SUMMARY_ADAPTER);
    }
  }

  registerAdapter(adapter: PantavionExecutionAdapter) {
    this.adapters.set(adapter.key, adapter);
  }

  unregisterAdapter(adapterKey: string) {
    this.adapters.delete(adapterKey);
  }

  listAdapters(): PantavionExecutionAdapter[] {
    return Array.from(this.adapters.values());
  }

  resolveAdapter(task: PantavionExecutionTask): PantavionExecutionAdapter | null {
    if (task.preferredAdapterKey) {
      const preferred = this.adapters.get(task.preferredAdapterKey);
      if (preferred && preferred.supports(task)) {
        return preferred;
      }
    }

    const supported = Array.from(this.adapters.values()).find((adapter) => {
      return adapter.kinds.includes(task.kind) && adapter.supports(task);
    });

    return supported ?? this.adapters.get(PANTAVION_INTERNAL_SUMMARY_ADAPTER.key) ?? null;
  }

  async execute(
    input: PantavionExecutionRunInput
  ): Promise<PantavionExecutionReceipt> {
    const startedAtMs = this.now();
    const startedAtIso = new Date(startedAtMs).toISOString();
    const timeoutMs = input.timeoutMs ?? this.defaultTimeoutMs;

    const policyGate = evaluatePolicyGate(
      input.policyEvaluation,
      input.allowReviewBypass === true
    );

    if (policyGate.status === "blocked" || policyGate.status === "review_required") {
      const receipt = this.createReceipt({
        task: input.task,
        startedAtMs,
        startedAtIso,
        timeoutMs,
        status: policyGate.status,
        adapterKey: null,
        adapterLabel: null,
        output: {
          kind: "none",
          title:
            policyGate.status === "blocked"
              ? "Execution blocked"
              : "Execution requires review",
          summary: policyGate.reason,
        },
        warnings: policyGate.status === "review_required" ? [policyGate.reason] : [],
        errors: policyGate.status === "blocked" ? [policyGate.reason] : [],
        memoryWrites: [],
      });

      await this.emitReceipt(receipt);
      return receipt;
    }

    const adapter = this.resolveAdapter(input.task);

    if (!adapter) {
      const receipt = this.createReceipt({
        task: input.task,
        startedAtMs,
        startedAtIso,
        timeoutMs,
        status: "failed",
        adapterKey: null,
        adapterLabel: null,
        output: {
          kind: "none",
          title: "No execution adapter resolved",
          summary:
            "Pantavion could not resolve an execution adapter for the current task.",
        },
        warnings: [],
        errors: ["No adapter resolved."],
        memoryWrites: [],
      });

      await this.emitReceipt(receipt);
      return receipt;
    }

    try {
      const adapterResult = await promiseWithTimeout(
        adapter.execute({
          task: input.task,
          orchestratorPlan: input.orchestratorPlan ?? null,
          policyEvaluation: input.policyEvaluation ?? null,
          timeoutMs,
          metadata: input.metadata,
        }),
        timeoutMs
      );

      const receipt = this.createReceipt({
        task: input.task,
        startedAtMs,
        startedAtIso,
        timeoutMs,
        status: adapterResult.status ?? "succeeded",
        adapterKey: adapter.key,
        adapterLabel: adapter.label,
        output: adapterResult.output,
        warnings: adapterResult.warnings ?? [],
        errors: adapterResult.errors ?? [],
        memoryWrites: adapterResult.memoryWrites ?? [],
      });

      await this.emitReceipt(receipt);
      return receipt;
    } catch (error) {
      const isTimeout = error instanceof Error && error.message === "__PANTAVION_TIMEOUT__";

      const receipt = this.createReceipt({
        task: input.task,
        startedAtMs,
        startedAtIso,
        timeoutMs,
        status: isTimeout ? "timed_out" : "failed",
        adapterKey: adapter.key,
        adapterLabel: adapter.label,
        output: {
          kind: "none",
          title: isTimeout ? "Execution timed out" : "Execution failed",
          summary: isTimeout
            ? "Pantavion execution exceeded the allowed timeout."
            : "Pantavion execution failed before producing a result.",
        },
        warnings: [],
        errors: [errorToMessage(error)],
        memoryWrites: [],
      });

      await this.emitReceipt(receipt);
      return receipt;
    }
  }

  private createReceipt(args: {
    task: PantavionExecutionTask;
    startedAtMs: number;
    startedAtIso: string;
    timeoutMs: number;
    status: PantavionExecutionStatus;
    adapterKey: string | null;
    adapterLabel: string | null;
    output: PantavionExecutionOutput;
    warnings: string[];
    errors: string[];
    memoryWrites: PantavionExecutionMemoryWrite[];
  }): PantavionExecutionReceipt {
    const endedAtMs = this.now();
    const endedAtIso = new Date(endedAtMs).toISOString();

    return {
      id: createExecutionId("receipt"),
      taskId: args.task.id,
      status: args.status,
      kind: args.task.kind,
      adapterKey: args.adapterKey,
      adapterLabel: args.adapterLabel,
      output: args.output,
      warnings: dedupeStrings(args.warnings),
      errors: dedupeStrings(args.errors),
      memoryWrites: dedupeMemoryWrites(args.memoryWrites),
      audit: {
        taskId: args.task.id,
        adapterKey: args.adapterKey,
        policyDecision: "none",
        startedAt: args.startedAtIso,
        endedAt: endedAtIso,
        durationMs: endedAtMs - args.startedAtMs,
        timeoutMs: args.timeoutMs,
      },
    };
  }

  private async emitReceipt(receipt: PantavionExecutionReceipt) {
    if (!this.onReceipt) return;
    await this.onReceipt(receipt);
  }
}

export function createPantavionExecutionBus(
  options: PantavionExecutionBusOptions = {}
) {
  return new PantavionExecutionBus(options);
}

export function buildPantavionExecutionTaskFromPlan(args: {
  goal: string;
  actor: Actor;
  countryCode?: string;
  securityMode: SecurityMode;
  privacyMode: PrivacyMode;
  costMode: CostMode;
  orchestratorPlan: PantavionOrchestratorPlan;
  preferredAdapterKey?: string | null;
  highImpact?: boolean;
  metadata?: Record<string, unknown>;
}): PantavionExecutionTask {
  return {
    id: createExecutionId("task"),
    kind: inferExecutionKind(args.orchestratorPlan.intent),
    goal: args.goal,
    normalizedGoal: normalizeText(args.goal),
    intent: args.orchestratorPlan.intent,
    workspace: args.orchestratorPlan.workspace,
    capabilities: args.orchestratorPlan.selectedCapabilities,
    routingDecisions: args.orchestratorPlan.routingDecisions,
    actor: args.actor,
    countryCode: args.countryCode,
    securityMode: args.securityMode,
    privacyMode: args.privacyMode,
    costMode: args.costMode,
    preferredAdapterKey: args.preferredAdapterKey ?? null,
    highImpact: args.highImpact ?? false,
    metadata: args.metadata,
  };
}

export function inferExecutionKind(
  intent: PantavionGoalIntent
): PantavionExecutionKind {
  switch (intent) {
    case "discover_gaps":
    case "research_world":
      return "discovery";
    case "run_simulation":
      return "simulation";
    case "voice_session":
      return "voice";
    case "billing_checkout":
      return "billing";
    case "build_product":
      return "workflow";
    default:
      return "internal";
  }
}

export function evaluatePolicyGate(
  policyEvaluation?: PantavionPolicyEvaluation | null,
  allowReviewBypass = false
):
  | { status: "allowed"; reason: string }
  | { status: "review_required"; reason: string }
  | { status: "blocked"; reason: string } {
  if (!policyEvaluation) {
    return {
      status: "allowed",
      reason: "No explicit policy evaluation supplied.",
    };
  }

  if (policyEvaluation.finalDecision === "deny") {
    return {
      status: "blocked",
      reason: joinReasons(policyEvaluation.reasons, "Execution denied by policy."),
    };
  }

  if (
    policyEvaluation.finalDecision === "review_required" &&
    !allowReviewBypass
  ) {
    return {
      status: "review_required",
      reason: joinReasons(
        policyEvaluation.reasons,
        "Execution requires human review before handoff."
      ),
    };
  }

  return {
    status: "allowed",
    reason: joinReasons(policyEvaluation.reasons, "Policy allows execution."),
  };
}

export const PANTAVION_INTERNAL_SUMMARY_ADAPTER: PantavionExecutionAdapter = {
  key: "pantavion_internal_summary",
  label: "Pantavion Internal Summary Adapter",
  version: "1.0.0",
  kinds: [
    "internal",
    "workflow",
    "simulation",
    "discovery",
    "voice",
    "billing",
    "provider_handoff",
  ],
  supports() {
    return true;
  },
  async execute(
    context: PantavionExecutionAdapterContext
  ): Promise<PantavionExecutionAdapterResult> {
    const providerLeads = context.task.routingDecisions
      .map((item) => item.primaryProviderKey)
      .filter(Boolean);

    const output: PantavionExecutionOutput = {
      kind: "json",
      title: "Pantavion execution summary",
      summary:
        "Pantavion executed the task through its internal kernel summary adapter. This is a live receipt-producing fallback until richer provider adapters are connected.",
      payload: {
        taskId: context.task.id,
        goal: context.task.goal,
        intent: context.task.intent,
        workspace: context.task.workspace,
        capabilities: context.task.capabilities,
        routingDecisions: context.task.routingDecisions,
        providerLeads,
        policyDecision:
          context.policyEvaluation?.finalDecision ?? "none",
        nextSuggestedStep: suggestNextStep(context.task.kind),
      },
    };

    const memoryWrites: PantavionExecutionMemoryWrite[] = [
      {
        key: "last_execution_summary",
        title: "Last execution summary",
        summary: `${context.task.intent} executed in ${context.task.workspace}.`,
        scope: "runtime",
      },
      {
        key: "last_goal",
        title: "Last goal",
        summary: context.task.goal,
        scope: "session",
      },
    ];

    const warnings: string[] = [
      "Execution used the internal summary adapter because richer live adapters are not yet attached.",
    ];

    if (
      context.policyEvaluation?.finalDecision === "allow_with_guardrails"
    ) {
      warnings.push(
        "Policy allows execution with guardrails; downstream adapters should enforce them."
      );
    }

    return {
      status: "succeeded",
      output,
      warnings,
      errors: [],
      memoryWrites,
    };
  },
};

export function createNoopSuccessReceipt(args: {
  task: PantavionExecutionTask;
  adapterKey?: string | null;
  adapterLabel?: string | null;
  summary?: string;
}): PantavionExecutionReceipt {
  const startedAtMs = Date.now();
  const startedAtIso = new Date(startedAtMs).toISOString();

  return {
    id: createExecutionId("receipt"),
    taskId: args.task.id,
    status: "succeeded",
    kind: args.task.kind,
    adapterKey: args.adapterKey ?? null,
    adapterLabel: args.adapterLabel ?? null,
    output: {
      kind: "text",
      title: "Pantavion execution completed",
      summary:
        args.summary ??
        "Pantavion produced a successful kernel-level receipt.",
    },
    warnings: [],
    errors: [],
    memoryWrites: [],
    audit: {
      taskId: args.task.id,
      adapterKey: args.adapterKey ?? null,
      policyDecision: "none",
      startedAt: startedAtIso,
      endedAt: startedAtIso,
      durationMs: 0,
      timeoutMs: 0,
    },
  };
}

function suggestNextStep(kind: PantavionExecutionKind): string {
  switch (kind) {
    case "discovery":
      return "Attach a live discovery runner adapter.";
    case "simulation":
      return "Attach a live simulation engine adapter.";
    case "voice":
      return "Attach a voice session runtime adapter.";
    case "billing":
      return "Attach a billing checkout adapter.";
    case "workflow":
      return "Attach a workflow execution adapter.";
    case "provider_handoff":
      return "Attach a provider handoff adapter.";
    case "internal":
    default:
      return "Attach a richer domain adapter or route to a live API boundary.";
  }
}

function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("__PANTAVION_TIMEOUT__"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function createExecutionId(prefix: "task" | "receipt"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pantavion_${prefix}_${crypto.randomUUID()}`;
  }

  return `pantavion_${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function joinReasons(reasons: string[] | undefined, fallback: string): string {
  if (!reasons?.length) return fallback;
  return reasons.join(" ");
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown Pantavion execution error.";
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
