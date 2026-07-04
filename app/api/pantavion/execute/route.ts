// app/api/pantavion/execute/route.ts

import { NextRequest, NextResponse } from "next/server";

import {
  createPantavionExecutionBus,
  type PantavionExecutionTask,
} from "../../../../core/pantavion/execution/pantavion-execution-bus";

import {
  createPantavionDefaultAdapterRegistry,
} from "../../../../core/pantavion/execution/pantavion-adapter-registry";

import {
  createPantavionExecutionReceiptStore,
} from "../../../../core/pantavion/execution/pantavion-execution-receipts";

import {
  normalizePantavionExecutionReceipt,
} from "../../../../core/pantavion/execution/pantavion-result-normalizer";

import {
  createPantavionRuntimeMemoryStore,
} from "../../../../core/pantavion/memory/pantavion-runtime-memory";

import {
  resolvePantavionEntitlements,
  isPantavionPlanKey,
  isPantavionModuleKey,
  type PantavionPlanKey,
  type PantavionModuleKey,
} from "../../../../core/pantavion/entitlements/pantavion-entitlement-resolver";

import {
  createPantavionUsageCounterStore,
  getPantavionDefaultUsageLimit,
  isPantavionUsageFamily,
  type PantavionUsageFamily,
} from "../../../../core/pantavion/usage/pantavion-usage-counters";

const adapterRegistry = createPantavionDefaultAdapterRegistry();
const receiptStore = createPantavionExecutionReceiptStore();
const runtimeMemoryStore = createPantavionRuntimeMemoryStore();
const usageStore = createPantavionUsageCounterStore();

const executionBus = createPantavionExecutionBus({
  adapters: adapterRegistry.list().map((item) => item.adapter),
  onReceipt: async (receipt) => {
    receiptStore.add(receipt);
    runtimeMemoryStore.writeMany(receipt.memoryWrites);
  },
});

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/pantavion/execute",
    adapterRegistry: adapterRegistry.getSummary(),
    receipts: receiptStore.getSummary(),
    memory: runtimeMemoryStore.getSummary(),
    usage: usageStore.getSummary(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const actorKey = toStringSafe(body.actorKey, "anonymous");
  const actor = toStringSafe(body.actor, "member");
  const planKey = isPantavionPlanKey(body.planKey) ? body.planKey : "free";
  const moduleKey = isPantavionModuleKey(body.moduleKey) ? body.moduleKey : "mind";
  const usageFamily = isPantavionUsageFamily(body.usageFamily)
    ? body.usageFamily
    : inferUsageFamily(moduleKey);

  const entitlements = resolvePantavionEntitlements({
    actorId: actorKey,
    planKey,
    moduleKey,
    trustLevel: body.trustLevel === "low" || body.trustLevel === "high" ? body.trustLevel : "standard",
    ageBand: body.ageBand === "minor" ? "minor" : "adult",
    verified: body.verified === true,
    institutional: body.institutional === true,
  });

  if (!entitlements.allowed) {
    return NextResponse.json(
      {
        ok: false,
        stage: "entitlements",
        entitlements,
      },
      { status: 403 }
    );
  }

  const usageLimit = getPantavionDefaultUsageLimit(planKey, usageFamily);
  const usageResult = usageStore.consume({
    actorKey,
    family: usageFamily,
    amount: 1,
    limit: usageLimit,
  });

  if (!usageResult.allowed) {
    return NextResponse.json(
      {
        ok: false,
        stage: "usage",
        entitlements,
        usage: usageResult,
      },
      { status: 429 }
    );
  }

  const task = buildTaskFromRequestBody(body, actor, moduleKey);

  const receipt = await executionBus.execute({
    task,
    allowReviewBypass: body.allowReviewBypass === true,
  });

  const normalized = normalizePantavionExecutionReceipt(receipt);

  return NextResponse.json({
    ok: receipt.status === "succeeded",
    entitlements,
    usage: usageResult.counter,
    receipt,
    normalized,
    adapterRegistry: adapterRegistry.getSummary(),
    receipts: receiptStore.getSummary(),
    memory: runtimeMemoryStore.getSummary(),
  });
}

function buildTaskFromRequestBody(
  body: Record<string, unknown>,
  actor: string,
  moduleKey: PantavionModuleKey
): PantavionExecutionTask {
  const goal = toStringSafe(body.goal, `Pantavion ${moduleKey} execution request`);
  const kind = isExecutionKind(body.kind) ? body.kind : inferExecutionKind(moduleKey);
  const intent = inferIntent(kind);
  const workspace = inferWorkspace(moduleKey);

  return {
    id: createTaskId(),
    kind,
    goal,
    normalizedGoal: goal.toLowerCase().replace(/\s+/g, " ").trim(),
    intent: intent as any,
    workspace: workspace as any,
    capabilities: Array.isArray(body.capabilities) ? (body.capabilities as any) : [],
    routingDecisions: Array.isArray(body.routingDecisions) ? (body.routingDecisions as any) : [],
    actor: actor as any,
    countryCode: typeof body.countryCode === "string" ? body.countryCode : undefined,
    securityMode: (typeof body.securityMode === "string" ? body.securityMode : "safe") as any,
    privacyMode: (typeof body.privacyMode === "string" ? body.privacyMode : "standard") as any,
    costMode: (typeof body.costMode === "string" ? body.costMode : "balanced") as any,
    preferredAdapterKey:
      typeof body.preferredAdapterKey === "string" ? body.preferredAdapterKey : null,
    highImpact: body.highImpact === true,
    metadata: isPlainObject(body.metadata) ? body.metadata : {},
  };
}

function inferUsageFamily(moduleKey: PantavionModuleKey): PantavionUsageFamily {
  switch (moduleKey) {
    case "voice":
      return "voice_sessions";
    case "discovery":
      return "discovery_runs";
    case "simulation":
      return "simulation_runs";
    case "billing":
      return "billing_attempts";
    default:
      return "workflow_actions";
  }
}

function inferExecutionKind(moduleKey: PantavionModuleKey) {
  switch (moduleKey) {
    case "voice":
      return "voice";
    case "billing":
      return "billing";
    case "discovery":
      return "discovery";
    case "simulation":
      return "simulation";
    default:
      return "workflow";
  }
}

function inferIntent(kind: string) {
  switch (kind) {
    case "voice":
      return "voice_session";
    case "billing":
      return "billing_checkout";
    case "discovery":
      return "discover_gaps";
    case "simulation":
      return "run_simulation";
    default:
      return "build_product";
  }
}

function inferWorkspace(moduleKey: PantavionModuleKey) {
  switch (moduleKey) {
    case "voice":
      return "voice_workspace";
    case "billing":
      return "billing_workspace";
    case "discovery":
      return "discovery_workspace";
    case "simulation":
      return "research_workspace";
    case "institutional":
      return "institutional_workspace";
    case "maps":
      return "maps_gis_workspace";
    default:
      return "mind_workspace";
  }
}

function isExecutionKind(value: unknown): value is PantavionExecutionTask["kind"] {
  return (
    typeof value === "string" &&
    [
      "internal",
      "provider_handoff",
      "workflow",
      "simulation",
      "discovery",
      "billing",
      "voice",
    ].includes(value)
  );
}

function toStringSafe(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createTaskId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pantavion_task_${crypto.randomUUID()}`;
  }

  return `pantavion_task_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
