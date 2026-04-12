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
  MemoryEntry,
  TruthZone,
  IntakePacket,
  Plan,
} from "./types";
import { clamp, createKernelId, nowIso } from "./types";

const INTENT_PATTERNS: Array<{ intent: string; words: string[] }> = [
  { intent: "build", words: ["build", "create", "generate", "implement", "code", "kernel", "website", "app"] },
  { intent: "analyze", words: ["analyze", "review", "inspect", "evaluate", "signal", "audit"] },
  { intent: "learn", words: ["learn", "course", "roadmap", "teach", "explain"] },
  { intent: "compare", words: ["compare", "vs", "better", "best", "difference"] },
  { intent: "research", words: ["research", "search", "find", "sources", "evidence", "study", "investigate"] },
  { intent: "design", words: ["design", "ui", "ux", "layout", "brand", "designer"] },
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

const parseIsoToMillis = (value?: string): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getScopeRecallOrder = (scope: KernelScope): KernelScope[] => {
  switch (scope) {
    case "project":
      return ["project", "workspace", "thread", "session"];
    case "workspace":
      return ["workspace", "thread", "session"];
    case "thread":
      return ["thread", "session", "workspace"];
    default:
      return ["session", "thread", "workspace"];
  }
};

const getScopeWeight = (currentScope: KernelScope, memoryScope: KernelScope): number => {
  const order = getScopeRecallOrder(currentScope);
  const index = order.indexOf(memoryScope);
  if (index === -1) return 0.35;
  return clamp(1 - index * 0.18, 0.4, 1);
};

type KernelClassification = ReturnType<typeof classifyKernelInput>;

type KernelRouteMode =
  | "builder"
  | "researcher"
  | "analyst"
  | "designer"
  | "orchestrator"
  | "general";

interface KernelCapabilityDirective {
  capabilityId: string;
  reason: string;
  score: number;
}

interface KernelMemoryInsight {
  id: string;
  summary: string;
  relevance: number;
  scope: KernelScope;
  recencyScore: number;
  totalScore: number;
}

interface KernelRouteDecision {
  mode: KernelRouteMode;
  reason: string;
  confidence: number;
  capabilityIds: string[];
}

interface KernelOrchestrationBrief {
  query: string;
  intent: string;
  language: string;
  truthZone: TruthZone;
  scope: KernelScope;
  directives: KernelCapabilityDirective[];
  memories: KernelMemoryInsight[];
  routeDecision: KernelRouteDecision;
  confidence: number;
}

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

  private recallMemoryPool(packet: IntakePacket): MemoryEntry[] {
    const order = getScopeRecallOrder(packet.scope);
    const pools = order.flatMap((scope) =>
      this.memory.recall(packet.normalizedText, { scope, limit: 6 })
    );

    const merged = new Map<string, MemoryEntry>();
    pools.forEach((entry) => {
      if (!merged.has(entry.id)) {
        merged.set(entry.id, entry);
      }
    });

    return Array.from(merged.values());
  }

  private buildCapabilityDirectives(
    normalizedText: string,
    classification: KernelClassification
  ): KernelCapabilityDirective[] {
    const registryDirectives: KernelCapabilityDirective[] = recommendCapabilitiesForText(normalizedText).map(
      (capabilityId, index) => ({
        capabilityId,
        reason: "registry recommendation",
        score: clamp(0.92 - index * 0.08, 0.35, 0.92),
      })
    );

    const classifierDirectives: KernelCapabilityDirective[] = classification.recommendedCapabilityIds.map(
      (capabilityId, index) => ({
        capabilityId,
        reason: "classifier recommendation",
        score: clamp(0.88 - index * 0.07, 0.35, 0.88),
      })
    );

    const merged = new Map<string, KernelCapabilityDirective>();

    [...registryDirectives, ...classifierDirectives].forEach((directive) => {
      const existing = merged.get(directive.capabilityId);

      if (!existing) {
        merged.set(directive.capabilityId, directive);
        return;
      }

      const reasons = uniqueStrings([existing.reason, directive.reason]).join("; ");

      merged.set(directive.capabilityId, {
        capabilityId: directive.capabilityId,
        reason: reasons,
        score: Math.max(existing.score, directive.score),
      });
    });

    return Array.from(merged.values())
      .sort((left, right) => right.score - left.score)
      .slice(0, 10);
  }

  private buildMemoryInsights(packet: IntakePacket, entries: MemoryEntry[]): KernelMemoryInsight[] {
    const now = Date.now();

    return entries
      .map((entry) => {
        const ageMs = Math.max(0, now - parseIsoToMillis(entry.updatedAt ?? entry.createdAt));
        const ageDays = ageMs / 86400000;
        const recencyScore = clamp(1 - ageDays / 30, 0.15, 1);
        const scopeWeight = getScopeWeight(packet.scope, entry.scope);
        const totalScore = clamp(entry.relevance * 0.55 + scopeWeight * 0.25 + recencyScore * 0.2, 0, 1);

        return {
          id: entry.id,
          summary: entry.summary,
          relevance: entry.relevance,
          scope: entry.scope,
          recencyScore,
          totalScore,
        };
      })
      .sort((left, right) => right.totalScore - left.totalScore)
      .slice(0, 8);
  }

  private decideRouteMode(
    packet: IntakePacket,
    directives: KernelCapabilityDirective[],
    insights: KernelMemoryInsight[]
  ): KernelRouteDecision {
    const lower = packet.normalizedText.toLowerCase();
    const capabilityIds = directives.slice(0, 5).map((directive) => directive.capabilityId);

    let mode: KernelRouteMode = "general";
    let reason = "general kernel handling";
    let confidence = 0.52;

    if (
      packet.intent === "build" ||
      lower.includes("website") ||
      lower.includes("app") ||
      lower.includes("code")
    ) {
      mode = "builder";
      reason = "build intent and implementation signals detected";
      confidence = 0.82;
    } else if (
      packet.intent === "research" ||
      lower.includes("research") ||
      lower.includes("search") ||
      lower.includes("sources") ||
      lower.includes("evidence")
    ) {
      mode = "researcher";
      reason = "research/search evidence intent detected";
      confidence = 0.8;
    } else if (
      packet.intent === "analyze" ||
      lower.includes("evaluate") ||
      lower.includes("inspect") ||
      lower.includes("compare")
    ) {
      mode = "analyst";
      reason = "analysis/evaluation intent detected";
      confidence = 0.78;
    } else if (
      packet.intent === "design" ||
      lower.includes("design") ||
      lower.includes("ui") ||
      lower.includes("ux") ||
      lower.includes("designer")
    ) {
      mode = "designer";
      reason = "design intent detected";
      confidence = 0.76;
    }

    if (directives.length >= 4 && insights.length >= 2) {
      mode = mode === "general" ? "orchestrator" : mode;
      confidence = clamp(confidence + 0.08, 0, 1);
    }

    return {
      mode,
      reason,
      confidence,
      capabilityIds,
    };
  }

  private buildOrchestrationBrief(
    packet: IntakePacket,
    recalledMemories: MemoryEntry[],
    classification: KernelClassification
  ): KernelOrchestrationBrief {
    const directives = this.buildCapabilityDirectives(packet.normalizedText, classification);
    const memories = this.buildMemoryInsights(packet, recalledMemories);
    const routeDecision = this.decideRouteMode(packet, directives, memories);

    const confidence = clamp(
      packet.confidence * 0.35 +
        (directives.length > 0 ? 0.18 : 0.04) +
        (memories.length > 0 ? 0.18 : 0.04) +
        routeDecision.confidence * 0.19 +
        (classification.recommendedCapabilityIds.length > 0 ? 0.1 : 0),
      0,
      1
    );

    return {
      query: packet.normalizedText,
      intent: packet.intent,
      language: packet.language,
      truthZone: packet.truthZone,
      scope: packet.scope,
      directives,
      memories,
      routeDecision,
      confidence,
    };
  }

  private formatDirectiveSummary(directives: KernelCapabilityDirective[]): string {
    if (directives.length === 0) return "none";
    return directives
      .map((directive) => directive.capabilityId + " (" + directive.score.toFixed(2) + ")")
      .join(", ");
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

    const recalledMemories = this.recallMemoryPool(packet);

    const memoryCandidates = buildMemoryCandidatesFromIntake(
      packet.normalizedText,
      staged.context,
      packet.scope,
      packet.truthZone,
      packet.id
    );

    const storedMemories = this.memory.bulkAdd(memoryCandidates);
    const memoryContext = [...recalledMemories, ...storedMemories];
    const snapshotAfterMemory = this.store.snapshot();
    const signals = deriveSignalsFromIntake(packet, memoryContext);
    const priority = buildPriorityState([
      ...snapshotAfterMemory.signals,
      ...signals,
    ].slice(-40));

    const classification = classifyKernelInput(packet.normalizedText);
    const orchestration = this.buildOrchestrationBrief(packet, memoryContext, classification);
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
        "Route Mode: " + orchestration.routeDecision.mode,
        "Route Reason: " + orchestration.routeDecision.reason,
        "Recommended Capabilities: " + this.formatDirectiveSummary(orchestration.directives),
        "Top Priority Band: " + priority.band,
        "Signal Count: " + signals.length,
        "Memory Recall Count: " + recalledMemories.length,
        "Memory Count Added: " + storedMemories.length,
        "Orchestration Confidence: " + orchestration.confidence.toFixed(2),
        "Plan Goal: " + plan.goal,
        orchestration.memories[0]
          ? "Top Memory: " + orchestration.memories[0].summary
          : "Top Memory: none",
      ].join("\n"),
      truthZone: packet.truthZone,
      relatedIds: [
        packet.id,
        plan.id,
        ...signals.map((signal) => signal.id),
        ...orchestration.memories.map((memory) => memory.id),
      ],
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
        ...orchestration.directives.map((directive) => directive.capabilityId),
      ]);
      appendAuditEntries(state, [
        createAuditEntry(
          "kernel.analyze",
          "Kernel analysis completed with hierarchical retrieval and routing.",
          "info",
          [packet.id, plan.id, output.id],
          {
            signalCount: signals.length,
            recalledMemoryCount: recalledMemories.length,
            storedMemoryCount: storedMemories.length,
            directiveCount: orchestration.directives.length,
            routeMode: orchestration.routeDecision.mode,
            routeConfidence: orchestration.routeDecision.confidence,
            orchestrationConfidence: orchestration.confidence,
            priorityBand: priority.band,
          }
        ),
      ]);
    });

    this.store.replace(nextState);

    return {
      ok: true,
      packet,
      memories: storedMemories,
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
      "Open Goal Count: " + state.continuity.activeGoals.length,
      "Memory Count: " + state.memory.entries.length,
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
