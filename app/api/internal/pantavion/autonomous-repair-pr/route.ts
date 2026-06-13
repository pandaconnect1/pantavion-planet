import {
  createPantavionRepairPullRequest,
  summarizeRepairPrQueueState,
} from "@/core/pantaai/autonomous-code/autonomous-repair-pr-creator";
import { isPantavionSchedulerAuthorized } from "@/core/pantaai/runtime/scheduler-guard";
import { appendPantavionRuntimeLedgerEvent } from "@/core/pantaai/runtime/runtime-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function requireAuthorizedForExecution(request: Request, execute: boolean): Response | undefined {
  if (!execute) return undefined;

  if (isPantavionSchedulerAuthorized(request)) return undefined;

  appendPantavionRuntimeLedgerEvent({
    eventType: "founder_gate_required",
    severity: "warning",
    kernelFamily: "Pantavion Autonomous Repair PR Creator",
    message: "Unauthorized repair PR execution blocked.",
    protectedDomains: ["production", "github_pr", "founder_gate"],
    metadata: {
      marker: "pantavion_autonomous_repair_pr_route_c9d_v1",
    },
  });

  return Response.json(
    {
      ok: false,
      marker: "pantavion_autonomous_repair_pr_route_c9d_v1",
      error: "Unauthorized repair PR execution.",
    },
    { status: 401 },
  );
}

export async function GET() {
  return Response.json({
    ok: true,
    marker: "pantavion_autonomous_repair_pr_route_c9d_v1",
    repairPr: summarizeRepairPrQueueState(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const execute = asBoolean(body.execute);

  const unauthorized = requireAuthorizedForExecution(request, execute);
  if (unauthorized) return unauthorized;

  const result = await createPantavionRepairPullRequest({
    jobId: asString(body.jobId),
    sourceRunId: asString(body.sourceRunId),
    execute,
  });

  return Response.json({
    ok: result.ok,
    marker: "pantavion_autonomous_repair_pr_route_c9d_v1",
    result,
  });
}

const pantavion_autonomous_repair_pr_route_marker_v1 =
  "pantavion_autonomous_repair_pr_route_c9d_v1";
