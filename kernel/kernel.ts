import { appendAuditEntries, buildAuditSummary, createAuditEntry } from "./audit";
import { classifyKernelInput } from "./classifier";
import { buildPriorityState, deriveSignalsFromIntake } from "./intelligence";
import { buildMemoryCandidatesFromIntake, createMemoryStore, type KernelMemoryStore } from "./memory";
import { buildPlanFromAnalysis, flattenTasksFromPlans } from "./planner";
import { recommendCapabilitiesForText } from "./registry";
import { runPlan } from "./runner";
import { createInitialKernelState, createKernelStore, type KernelStore } from "./store";
import { buildKernelStateSummary } from "./stats";
import type {
  InputModality,
  KernelActor,
  KernelAnalysisResult,
  KernelAnalyzeRequest,
  KernelCompleteRequest,
  KernelCompletionResult,
  KernelContext,
  KernelIntakeRequest,
  KernelIntakeResult,
  KernelOutput,
  KernelRunRequest,
  KernelRunResult,
  KernelScope,
  KernelState,
  KernelStateSummary,
  TruthZone,
  IntakePacket,
  Plan,
} from "./types";
import { clamp, createKernelId, nowIso } from "./types";

const INTENT_PATTERNS: Array<{ intent: string; words: string[] }> = [
  { intent: "build", words: ["build", "create", "generate", "implement", "code", "kernel"] },
  { intent: "analyze", words: ["analyze", "review", "inspect", "evaluate", "signal"] },
  { intent: "learn", words: ["learn", "course", "roadmap", "teach", "explain"] },
  { intent: "compare", words: ["compare", "vs", "better", "best", "difference"] },
];

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values));

const normalizeText = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const detectLanguage = (text: string): string => {
  const hasGreek = /[\u0370-\u03ff]/.test(text);
  return hasGreek ? "el" : "en";
};

const detectIntent = (text: string): string => {
  const lower = text.toLowerCase();
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.words.some((word) => lower.includes(word))) {
      return pattern.intent;
    }
  }
  return "general";
};

const extractEntities = (text: string): string[] => {
  const matches = text.match(/[A-Za-z0-9\u0370-\u03ff._-]{3,}/g) ?? [];
  return uniqueStrings(matches).slice(0, 20);
};

const inferUrgency = (text: string): number => {
  const lower = text.toLowerCase();
  let value = 0.2;
  if (lower.includes("urgent") || lower.includes("asap") || lower.includes("critical")) value += 0.55;
  if (lower.includes("τώρα") || lower.includes("άμεσα")) value += 0.55;
  return clamp(value, 0, 1);
};

const inferScope = (
  req: KernelIntakeRequest,
  contextPatch?: Partial<KernelContext>
): KernelScope => {
  if (req.scope) return req.scope;
  if (contextPatch?.projectId) return "project";
  if (contextPatch?.workspaceId) return "workspace";
  if (contextPatch?.threadId) return "thread";
  return "session";
};

const inferModality = (req: KernelIntakeRequest): InputModality =>
  req.modality ?? "text";

const inferTruthZone = (req: KernelIntakeRequest): TruthZone =>
  req.truthZone ?? "likely";

const mergeActor = (base: KernelActor, patch?: Partial<KernelActor>): KernelActor => ({
  ...base,
  ...patch,
  permissions: patch?.permissions ?? base.permissions,
});

const mergeContext = (base: KernelContext, patch?: Partial<KernelContext>): KernelContext => ({
  ...base,
  ...patch,
  tags: uniqueStrings([...(base.tags ?? []), ...(patch?.tags ?? [])]),
});

export class PantavionKernel {
  private readonly store: KernelStore;
  private readonly memory: KernelMemoryStore;

  constructor(initialState?: KernelState) {
    this.store = createKernelStore(initialState ?? createInitialKernelState());
    this.memory = createMemoryStore(this.store);
  }

  getState(): KernelState {
    return this.store.snapshot();
  }

  getStateSummary(): KernelStateSummary {
    return buildKernelStateSummary(this.store.snapshot());
  }

  private buildPacket(req: KernelIntakeRequest): IntakePacket {
    const raw = normalizeText(req.raw ?? req.text ?? "");
    const contextPatch = req.context;
    const scope = inferScope(req, contextPatch);
    const modality = inferModality(req);
    const truthZone = inferTruthZone(req);

    return {
      id: createKernelId("intake"),
      createdAt: nowIso(),
      modality,
      raw,
      normalizedText: raw,
      language: detectLanguage(raw),
      intent: detectIntent(raw),
      entities: extractEntities(raw),
      urgencyHint: inferUrgency(raw),
      confidence: raw.length > 0 ? 0.86 : 0.2,
      truthZone,
      scope,
      metadata: req.metadata ?? {},
    };
  }

  private stagePacket(packet: IntakePacket, req: KernelIntakeRequest): KernelState {
    return this.store.mutate((state) => {
      state.actor = mergeActor(state.actor, req.actor);
      state.context = mergeContext(
        {
          ...state.context,
          sessionId: state.session.id,
        },
        req.context
      );
      state.intake.push(packet);
      state.inputs.push(packet);
      state.capabilities.recommended = recommendCapabilitiesForText(packet.normalizedText);
      if (state.context.threadId) {
        state.continuity.openThreads = uniqueStrings([
          ...state.continuity.openThreads,
          state.context.threadId,
        ]);
      }
      state.health.status = "healthy";
    });
  }

  intake(req: KernelIntakeRequest): KernelIntakeResult {
    const packet = this.buildPacket(req);
    const state = this.stagePacket(packet, req);
    appendAuditEntries(state, [
      createAuditEntry(
        "kernel.intake",
        "Canonical intake packet stored.",
        "info",
        [packet.id],
        { scope: packet.scope, modality: packet.modality }
      ),
    ]);
    this.store.replace(state);

    return {
      ok: true,
      packet,
      recommendedCapabilities: state.capabilities.recommended,
      summary: "Intake packet staged successfully in canonical kernel state.",
    };
  }

  analyze(req: KernelAnalyzeRequest): KernelAnalysisResult {
    const packet = this.buildPacket(req);
    const staged = this.stagePacket(packet, req);

    const memoryCandidates = buildMemoryCandidatesFromIntake(
      packet.normalizedText,
      staged.context,
      packet.scope,
      packet.truthZone,
      packet.id
    );

    const memories = this.memory.bulkAdd(memoryCandidates);
    const snapshotAfterMemory = this.store.snapshot();
    const signals = deriveSignalsFromIntake(packet, memories);
    const priority = buildPriorityState([
      ...snapshotAfterMemory.signals,
      ...signals,
    ].slice(-40));

    const classification = classifyKernelInput(packet.normalizedText);
    const plan = buildPlanFromAnalysis({
      state: snapshotAfterMemory,
      packet,
      signals,
      priority,
    });

    const output: KernelOutput = {
      id: createKernelId("out"),
      createdAt: nowIso(),
      type: "analysis",
      title: "Kernel analysis",
      content: [
        "Pantavion Kernel analyzed the intake successfully.",
        "Intent: " + packet.intent,
        "Scope: " + packet.scope,
        "Language: " + packet.language,
        "Recommended Capabilities: " + classification.recommendedCapabilityIds.join(", "),
        "Top Priority Band: " + priority.band,
        "Signal Count: " + signals.length,
        "Memory Count Added: " + memories.length,
        "Plan Goal: " + plan.goal,
      ].join("\n"),
      truthZone: packet.truthZone,
      relatedIds: [packet.id, plan.id, ...signals.map((signal) => signal.id)],
    };

    const nextState = this.store.mutate((state) => {
      state.signals.push(...signals);
      state.priorities = priority;
      state.plans.push(plan);
      state.tasks = flattenTasksFromPlans(state.plans);
      state.outputs.push(output);
      state.continuity.activeGoals = uniqueStrings([...state.continuity.activeGoals, plan.goal]);
      state.capabilities.recommended = uniqueStrings([
        ...state.capabilities.recommended,
        ...classification.recommendedCapabilityIds,
      ]);
      appendAuditEntries(state, [
        createAuditEntry(
          "kernel.analyze",
          "Kernel analysis completed.",
          "info",
          [packet.id, plan.id],
          {
            signalCount: signals.length,
            memoryCount: memories.length,
            priorityBand: priority.band,
          }
        ),
      ]);
    });

    this.store.replace(nextState);

    return {
      ok: true,
      packet,
      memories,
      signals,
      priority,
      plan,
      output,
    };
  }

  complete(req: KernelCompleteRequest = {}): KernelCompletionResult {
    const state = this.store.snapshot();
    const targetPlan =
      (req.planId ? state.plans.find((plan) => plan.id === req.planId) : undefined) ??
      state.plans[state.plans.length - 1];

    const latestOutput = state.outputs[state.outputs.length - 1];
    const title = targetPlan ? "Kernel completion for active plan" : "Kernel completion";

    const contentParts = [
      "Pantavion Kernel completion generated.",
      targetPlan ? "Plan Goal: " + targetPlan.goal : "No active plan was found.",
      targetPlan ? "Plan Status: " + targetPlan.status : "Plan Status: none",
      "Priority Band: " + state.priorities.band,
      "Recommended Capabilities: " + state.capabilities.recommended.join(", "),
      latestOutput ? "Last Output Type: " + latestOutput.type : "Last Output Type: none",
    ];

    if (req.prompt) {
      contentParts.push("Prompt Context: " + req.prompt);
    }

    const auditSummary = req.includeAudit ? buildAuditSummary(state) : undefined;
    if (auditSummary) {
      contentParts.push("Audit Summary:");
      contentParts.push(auditSummary);
    }

    const output: KernelOutput = {
      id: createKernelId("out"),
      createdAt: nowIso(),
      type: "completion",
      title,
      content: contentParts.join("\n"),
      truthZone: "likely",
      relatedIds: targetPlan ? [targetPlan.id] : [],
    };

    const nextState = this.store.mutate((draft) => {
      draft.outputs.push(output);
      appendAuditEntries(draft, [
        createAuditEntry(
          "kernel.complete",
          "Kernel completion returned to caller.",
          "info",
          targetPlan ? [targetPlan.id, output.id] : [output.id]
        ),
      ]);
    });

    this.store.replace(nextState);

    return {
      ok: true,
      output,
      plan: targetPlan,
      auditSummary,
    };
  }

  run(req: KernelRunRequest = {}): KernelRunResult {
    const state = this.store.snapshot();
    const plan =
      (req.planId ? state.plans.find((candidate) => candidate.id === req.planId) : undefined) ??
      state.plans[state.plans.length - 1];

    if (!plan) {
      const fallbackPlan: Plan = {
        id: createKernelId("plan"),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        goal: "No-op fallback plan",
        summary: "Fallback plan because no active plan exists.",
        status: "ready",
        priorityBand: "LOW",
        steps: [],
        notes: ["No active plan was available."],
        fallbackPaths: ["Run analyze first."],
        approvalRequired: false,
        confidence: 0.4,
      };

      const executionResult = runPlan(fallbackPlan, state, req.mode ?? "dry_run");

      const fallbackState = this.store.mutate((draft) => {
        draft.plans.push(executionResult.updatedPlan);
        draft.tasks = flattenTasksFromPlans(draft.plans);
        draft.executions.push(executionResult.record);
        draft.outputs.push(executionResult.output);
        appendAuditEntries(draft, [
          createAuditEntry(
            "kernel.run",
            "Fallback no-op run executed because no active plan existed.",
            "warn",
            [executionResult.record.id]
          ),
        ]);
      });

      this.store.replace(fallbackState);

      return {
        ok: true,
        execution: executionResult.record,
        output: executionResult.output,
        plan: executionResult.updatedPlan,
      };
    }

    const executionResult = runPlan(plan, state, req.mode ?? "dry_run");

    const nextState = this.store.mutate((draft) => {
      draft.plans = draft.plans.map((existingPlan) =>
        existingPlan.id === executionResult.updatedPlan.id ? executionResult.updatedPlan : existingPlan
      );
      draft.tasks = flattenTasksFromPlans(draft.plans);
      draft.executions.push(executionResult.record);
      draft.outputs.push(executionResult.output);
      appendAuditEntries(draft, [
        createAuditEntry(
          "kernel.run",
          "Plan executed through canonical runner.",
          executionResult.record.status === "completed" ? "info" : "warn",
          [executionResult.record.id, executionResult.updatedPlan.id],
          { mode: req.mode ?? "dry_run", status: executionResult.record.status }
        ),
      ]);
    });

    this.store.replace(nextState);

    return {
      ok: true,
      execution: executionResult.record,
      output: executionResult.output,
      plan: executionResult.updatedPlan,
    };
  }
}

export const pantavionKernel = new PantavionKernel();

export {
  canonicalKernelRuntime,
  createCanonicalKernelRuntime,
  getCanonicalKernelRuntime,
} from "./canonical-runtime";

export type {
  CanonicalAuditModule,
  CanonicalKernelRuntime,
  CanonicalKernelRuntimeHealth,
  CanonicalMemoryModule,
  CanonicalStoreModule,
} from "./canonical-runtime";
