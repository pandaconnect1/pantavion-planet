import { runPantavionSchedulerSmokeCheck } from "@/core/pantaai/runtime/scheduler-smoke-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = runPantavionSchedulerSmokeCheck(request);

  return Response.json({
    ok: result.ok,
    marker: "pantavion_scheduler_smoke_route_c8b_v1",
    result,
  });
}

const pantavion_scheduler_smoke_route_marker_v1 =
  "pantavion_scheduler_smoke_route_c8b_v1";
