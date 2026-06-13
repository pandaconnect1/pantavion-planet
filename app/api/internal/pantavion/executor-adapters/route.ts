import { createPantavionExecutorAdapterPlans } from "@/core/pantaai/execution-adapters/executor-adapter-planner";
import { createPantavionGeneratedExecutorAdapterDrafts } from "@/core/pantaai/execution-adapters/executor-adapter-module-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const maxRaw = Number(url.searchParams.get("maxAdapters") ?? "9");
  const maxAdapters = Number.isFinite(maxRaw) ? Math.max(1, Math.min(maxRaw, 50)) : 9;

  const plans = createPantavionExecutorAdapterPlans(maxAdapters);
  const drafts = createPantavionGeneratedExecutorAdapterDrafts(maxAdapters);

  return Response.json({
    ok: true,
    marker: "pantavion_executor_adapters_route_c6b_v1",
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

export const pantavion_executor_adapters_route_marker_v1 =
  "pantavion_executor_adapters_route_c6b_v1";
