import { createHash, randomUUID } from "node:crypto";
import {
  GovernedAction,
  KernelActionType,
  KernelAnalysis,
  KernelCompletionRequest,
  KernelCompletionResult,
  KernelIntent,
  KernelLedgerEvent,
  KernelMemoryItem,
  KernelPlan,
  KernelPlanStep,
  KernelRegistryItem,
  KernelRegistryKind,
  KernelRun,
  KernelRunActionResult,
  KernelState,
} from "./contracts";
import { appendLedgerEvents, readKernelState } from "./ledger";

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeInput(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function stableId(prefix: string, value: string): string {
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 16);
  return prefix + "_" + hash;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function pickKeywords(normalized: string): string[] {
  const seeds = [
    "kernel",
    "memory",
    "registry",
    "planner",
    "plan",
    "orchestrator",
    "orchestration",
    "runner",
    "execute",
    "execution",
    "governance",
    "audit",
    "build",
    "classify",
    "remember",
    "store",
    "save",
    "ledger",
    "canonical",
    "capability",
    "workflow",
    "tool",
    "module",
  ];

  return seeds.filter((seed) => normalized.includes(seed));
}

function detectIntent(normalized: string): KernelIntent {
  if (
    normalized.includes("memory") ||
    normalized.includes("remember") ||
    normalized.includes("store") ||
    normalized.includes("save")
  ) {
    return "memory";
  }

  if (
    normalized.includes("registry") ||
    normalized.includes("capability") ||
    normalized.includes("module") ||
    normalized.includes("tool")
  ) {
    return "registry";
  }

  if (
    normalized.includes("plan") ||
    normalized.includes("planner") ||
    normalized.includes("roadmap")
  ) {
    return "planning";
  }

  if (
    normalized.includes("execute") ||
    normalized.includes("execution") ||
    normalized.includes("runner")
  ) {
    return "execution";
  }

  if (normalized.includes("audit")) {
    return "audit";
  }

  if (
    normalized.includes("governance") ||
    normalized.includes("policy") ||
    normalized.includes("guardrail")
  ) {
    return "governance";
  }

  if (
    normalized.includes("orchestrator") ||
    normalized.includes("orchestration")
  ) {
    return "orchestration";
  }

  if (
    normalized.includes("build") ||
    normalized.includes("implement") ||
    normalized.includes("foundation")
  ) {
    return "build";
  }

  return "unknown";
}

function detectScopes(normalized: string): string[] {
  const scopes: string[] = [];

  if (normalized.includes("kernel")) scopes.push("kernel");
  if (normalized.includes("memory")) scopes.push("memory");
  if (normalized.includes("registry")) scopes.push("registry");
  if (normalized.includes("planner") || normalized.includes("plan")) scopes.push("planner");
  if (normalized.includes("orchestrator") || normalized.includes("orchestration")) scopes.push("orchestrator");
  if (normalized.includes("runner") || normalized.includes("execution")) scopes.push("runner");
  if (normalized.includes("governance")) scopes.push("governance");

  return uniqueStrings(scopes);
}

export async function getKernelState(): Promise<KernelState> {
  return readKernelState();
}

export async function analyzeKernelInput(input: string): Promise<KernelAnalysis> {
  const normalized = normalizeInput(input).toLowerCase();
  const intent = detectIntent(normalized);
  const keywords = pickKeywords(normalized);
  const requestedScopes = detectScopes(normalized);

  const wantsMemory =
    normalized.includes("memory") ||
    normalized.includes("remember") ||
    normalized.includes("save") ||
    normalized.includes("store") ||
    normalized.includes("canonical");

  const wantsRegistry =
    normalized.includes("registry") ||
    normalized.includes("capability") ||
    normalized.includes("tool") ||
    normalized.includes("workflow") ||
    normalized.includes("module");

  const wantsPlanning =
    normalized.includes("plan") ||
    normalized.includes("planner") ||
    normalized.includes("roadmap");

  const wantsExecution =
    normalized.includes("execute") ||
    normalized.includes("execution") ||
    normalized.includes("runner");

  const wantsAudit = normalized.includes("audit");
  const wantsGovernance =
    normalized.includes("governance") ||
    normalized.includes("policy") ||
    normalized.includes("guardrail");

  const wantsBuild =
    normalized.includes("build") ||
    normalized.includes("implement") ||
    normalized.includes("foundation");

  const wantsOrchestration =
    normalized.includes("orchestrator") ||
    normalized.includes("orchestration");

  let confidence = 0.45;
  if (keywords.length >= 2) confidence += 0.15;
  if (requestedScopes.length >= 2) confidence += 0.15;
  if (intent !== "unknown") confidence += 0.15;
  if (confidence > 0.95) confidence = 0.95;

  return {
    normalizedInput: normalized,
    intent,
    confidence,
    keywords,
    requestedScopes,
    wantsMemory,
    wantsRegistry,
    wantsPlanning,
    wantsExecution,
    wantsAudit,
    wantsGovernance,
    wantsBuild,
    wantsOrchestration,
  };
}

function titleFromContent(content: string): string {
  const words = content
    .replace(/[^\p{L}\p{N}\s\-_./]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);

  return words.join(" ") || "kernel-memory";
}

function tagFromInput(normalized: string): string[] {
  const tags = [
    ...pickKeywords(normalized),
    ...detectScopes(normalized),
  ];

  if (normalized.includes("canonical")) tags.push("canonical");
  if (normalized.includes("foundation")) tags.push("foundation");
  if (normalized.includes("pantavion")) tags.push("pantavion");

  return uniqueStrings(tags);
}

function extractQuotedValues(input: string): string[] {
  const matches = input.match(/"([^"]+)"|'([^']+)'/g) ?? [];
  return matches.map((m) => m.slice(1, -1).trim()).filter(Boolean);
}

function buildMemoryCandidates(
  input: string,
  scope: string,
  analysis: KernelAnalysis,
): KernelMemoryItem[] {
  if (!analysis.wantsMemory && !analysis.wantsBuild && !analysis.wantsGovernance) {
    return [];
  }

  const normalized = normalizeInput(input);
  const quoted = extractQuotedValues(input);
  const contents = quoted.length ? quoted : [normalized];

  return contents.map((content) => {
    const id = stableId("mem", scope + "::" + content.toLowerCase());
    const timestamp = nowIso();

    return {
      id,
      scope,
      title: titleFromContent(content),
      content,
      tags: tagFromInput(normalized.toLowerCase()),
      sourceInput: normalized,
      confidence: analysis.confidence,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

function registryKindForName(name: string): KernelRegistryKind {
  if (name.includes("memory")) return "memory_class";
  if (name.includes("planner") || name.includes("plan")) return "planner";
  if (name.includes("orchestrator")) return "orchestrator";
  if (name.includes("runner") || name.includes("execution")) return "runner";
  if (name.includes("governance") || name.includes("policy")) return "governance_rule";
  if (name.includes("module")) return "module";
  if (name.includes("workflow")) return "workflow";
  if (name.includes("tool")) return "tool";
  if (name.includes("capability")) return "capability";
  return "unknown";
}

function buildRegistryCandidates(
  input: string,
  analysis: KernelAnalysis,
): KernelRegistryItem[] {
  const normalized = normalizeInput(input).toLowerCase();

  const trackedNames = [
    "canonical memory",
    "registry",
    "planner",
    "orchestrator",
    "runner",
    "governance",
    "kernel",
    "ledger",
  ];

  const found = trackedNames.filter((name) => normalized.includes(name));
  if (!found.length && !analysis.wantsRegistry && !analysis.wantsOrchestration) {
    return [];
  }

  const sourceNames = found.length ? found : ["kernel"];
  const timestamp = nowIso();

  return sourceNames.map((name) => ({
    id: stableId("reg", name),
    name,
    kind: registryKindForName(name),
    description: "Governed kernel registry entry for " + name,
    tags: uniqueStrings([...tagFromInput(normalized), name]),
    status: "active",
    sourceInput: normalizeInput(input),
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

function createPlanSteps(
  analysis: KernelAnalysis,
  scope: string,
): KernelPlanStep[] {
  const steps: KernelPlanStep[] = [
    {
      id: randomUUID(),
      title: "Classify request",
      detail: "Normalize input, detect intent, scopes, and governance relevance.",
      status: "approved",
    },
  ];

  if (analysis.wantsMemory) {
    steps.push({
      id: randomUUID(),
      title: "Update canonical memory",
      detail: "Upsert governed memory records into ledger-backed memory state.",
      status: "approved",
    });
  }

  if (analysis.wantsRegistry || analysis.wantsOrchestration) {
    steps.push({
      id: randomUUID(),
      title: "Update registry",
      detail: "Upsert registry entities for capability, planner, runner, or governance domains.",
      status: "approved",
    });
  }

  if (analysis.wantsPlanning || analysis.wantsBuild) {
    steps.push({
      id: randomUUID(),
      title: "Record plan",
      detail: "Persist a compact execution plan for scope " + scope + ".",
      status: "approved",
    });
  }

  if (analysis.wantsExecution || analysis.wantsOrchestration) {
    steps.push({
      id: randomUUID(),
      title: "Run governed execution",
      detail: "Execute only allowed kernel-internal actions and record the run outcome.",
      status: "approved",
    });
  }

  if (analysis.wantsGovernance || analysis.wantsAudit) {
    steps.push({
      id: randomUUID(),
      title: "Apply governance",
      detail: "Approve, block, or skip actions under deterministic policy checks.",
      status: "approved",
    });
  }

  if (steps.length === 1) {
    steps.push({
      id: randomUUID(),
      title: "Record minimal kernel pass",
      detail: "Store a minimal run so the kernel preserves continuity.",
      status: "approved",
    });
  }

  return steps;
}

function buildPlan(
  input: string,
  scope: string,
  analysis: KernelAnalysis,
): KernelPlan {
  const normalized = normalizeInput(input);
  return {
    id: stableId("plan", scope + "::" + normalized.toLowerCase()),
    scope,
    objective: normalized,
    intent: analysis.intent,
    createdAt: nowIso(),
    steps: createPlanSteps(analysis, scope),
  };
}

function containsBlockedPattern(normalized: string): string | null {
  const blockedPatterns = [
    "rm -rf",
    "del /s /q",
    "format c:",
    "drop table",
    "truncate table",
    "shutdown /s",
    "remove-item -recurse -force",
  ];

  for (const pattern of blockedPatterns) {
    if (normalized.includes(pattern)) return pattern;
  }

  return null;
}

function buildGovernedActions(
  input: string,
  memoryItems: KernelMemoryItem[],
  registryItems: KernelRegistryItem[],
  plan: KernelPlan,
): GovernedAction[] {
  const normalized = normalizeInput(input).toLowerCase();
  const blockedPattern = containsBlockedPattern(normalized);

  const actions: GovernedAction[] = [];

  for (const item of memoryItems) {
    actions.push({
      id: randomUUID(),
      type: "memory.upsert",
      approved: !blockedPattern,
      reason: blockedPattern
        ? "Blocked due to destructive pattern: " + blockedPattern
        : "Allowed governed memory upsert",
      payload: { item },
    });
  }

  for (const item of registryItems) {
    actions.push({
      id: randomUUID(),
      type: "registry.upsert",
      approved: !blockedPattern,
      reason: blockedPattern
        ? "Blocked due to destructive pattern: " + blockedPattern
        : "Allowed governed registry upsert",
      payload: { item },
    });
  }

  actions.push({
    id: randomUUID(),
    type: "plan.record",
    approved: !blockedPattern,
    reason: blockedPattern
      ? "Blocked due to destructive pattern: " + blockedPattern
      : "Allowed plan recording",
    payload: { plan },
  });

  actions.push({
    id: randomUUID(),
    type: "run.record",
    approved: true,
    reason: "Always record run for audit continuity",
    payload: {},
  });

  return actions;
}

function toLedgerEvent(
  type: KernelLedgerEvent["type"],
  payload: unknown,
): KernelLedgerEvent {
  return {
    id: randomUUID(),
    type,
    createdAt: nowIso(),
    payload,
  };
}

async function commitGovernedActions(
  input: string,
  analysis: KernelAnalysis,
  actions: GovernedAction[],
  commit: boolean,
): Promise<KernelRunActionResult[]> {
  const results: KernelRunActionResult[] = [];
  const events: KernelLedgerEvent[] = [];

  for (const action of actions) {
    if (!action.approved) {
      results.push({
        actionId: action.id,
        type: action.type,
        status: "blocked",
        reason: action.reason,
      });
      continue;
    }

    if (!commit) {
      results.push({
        actionId: action.id,
        type: action.type,
        status: "skipped",
        reason: "Dry run only",
      });
      continue;
    }

    if (action.type === "memory.upsert") {
      events.push(
        toLedgerEvent("memory.upserted", action.payload.item as KernelMemoryItem),
      );
      results.push({
        actionId: action.id,
        type: action.type,
        status: "executed",
        reason: action.reason,
      });
      continue;
    }

    if (action.type === "registry.upsert") {
      events.push(
        toLedgerEvent("registry.upserted", action.payload.item as KernelRegistryItem),
      );
      results.push({
        actionId: action.id,
        type: action.type,
        status: "executed",
        reason: action.reason,
      });
      continue;
    }

    if (action.type === "plan.record") {
      events.push(toLedgerEvent("plan.recorded", action.payload.plan as KernelPlan));
      results.push({
        actionId: action.id,
        type: action.type,
        status: "executed",
        reason: action.reason,
      });
      continue;
    }

    if (action.type === "run.record") {
      const run: KernelRun = {
        id: stableId("run", input + "::" + Date.now().toString()),
        input: normalizeInput(input),
        normalizedInput: analysis.normalizedInput,
        summary: "Governed kernel run recorded",
        createdAt: nowIso(),
        actions: [],
      };
      events.push(toLedgerEvent("run.recorded", run));
      results.push({
        actionId: action.id,
        type: action.type,
        status: "executed",
        reason: action.reason,
      });
    }
  }

  if (events.length) {
    await appendLedgerEvents(events);
  }

  return results;
}

export async function completeKernel(
  request: KernelCompletionRequest,
): Promise<KernelCompletionResult> {
  const input = normalizeInput(request.input ?? "");
  const scope = request.scope?.trim() || "global";
  const commit = request.commit ?? true;

  if (!input) {
    throw new Error("Kernel input is required.");
  }

  const analysis = await analyzeKernelInput(input);
  const proposedMemory = buildMemoryCandidates(input, scope, analysis);
  const proposedRegistry = buildRegistryCandidates(input, analysis);
  const plan = buildPlan(input, scope, analysis);
  const governance = buildGovernedActions(
    input,
    proposedMemory,
    proposedRegistry,
    plan,
  );

  const execution = await commitGovernedActions(
    input,
    analysis,
    governance,
    commit,
  );

  const state = await getKernelState();

  return {
    ok: true,
    analysis,
    proposedMemory,
    proposedRegistry,
    plan,
    governance,
    execution,
    state: {
      memoryCount: Object.keys(state.memory).length,
      registryCount: Object.keys(state.registry).length,
      planCount: state.plans.length,
      runCount: state.runs.length,
      eventCount: state.eventCount,
      lastUpdatedAt: state.lastUpdatedAt,
    },
  };
}
