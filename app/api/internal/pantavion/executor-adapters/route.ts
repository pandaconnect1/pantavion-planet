import { createPantavionExecutorAdapterPlans } from "@/core/pantaai/execution-adapters/executor-adapter-planner";
import { createPantavionGeneratedExecutorAdapterDrafts } from "@/core/pantaai/execution-adapters/executor-adapter-module-generator";
import { appendPantavionRuntimeLedgerEvent } from "@/core/pantaai/runtime/runtime-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function recordExecutorAdapterLedgerEvent(input: {
  readonly planCount: number;
  readonly draftCount: number;
  readonly maxAdapters: number;
  readonly gatedAdapters: number;
}): void {
  try {
    appendPantavionRuntimeLedgerEvent({
      eventType: "adapter_planned",
      kernelFamily: "Pantavion Executor Adapter Kernel",
      message: "Executor adapter plans and generated drafts were requested.",
      protectedDomains: input.gatedAdapters > 0 ? ["founder_gate", "protected_domain"] : [],
      metadata: input,
    });
  } catch {
    // Ledger failure must never break internal planning routes.
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const maxRaw = Number(url.searchParams.get("maxAdapters") ?? "9");
  const maxAdapters = Number.isFinite(maxRaw) ? Math.max(1, Math.min(maxRaw, 50)) : 9;

  const plans = createPantavionExecutorAdapterPlans(maxAdapters);
  const drafts = createPantavionGeneratedExecutorAdapterDrafts(maxAdapters);
  const gatedAdapters = plans.filter((plan) => plan.gatedTargets.length > 0).length;

  recordExecutorAdapterLedgerEvent({
    planCount: plans.length,
    draftCount: drafts.length,
    maxAdapters,
    gatedAdapters,
  });

  return Response.json({
    ok: true,
    marker: "pantavion_executor_adapters_route_c6b_v1",
    ledgerMarker: "pantavion_executor_adapters_ledger_route_c7c_v1",
    planCount: plans.length,
    draftCount: drafts.length,
    plans,
    drafts: drafts.map((draft) => ({
      id: draft.id,
      sourceAdapterPlanId: draft.sourceAdapterPlanId,
      kind: draft.kind,
      path: draft.path,
      title: draft.title,
      gates: draft.gates,
    })),
  });
}

const pantavion_executor_adapters_route_marker_v1 =
  "pantavion_executor_adapters_route_c6b_v1";

const pantavion_executor_adapters_ledger_route_marker_v1 =
  "pantavion_executor_adapters_ledger_route_c7c_v1";
