import {
  executeClaimedPantavionWorkPackageAsPr,
  summarizeWorkPackagePrExecutorQueue,
} from "@/core/pantaai/runtime/work-package-pr-executor";
import { isPantavionSchedulerAuthorized } from "@/core/pantaai/runtime/scheduler-guard";
import { appendPantavionRuntimeLedgerEvent } from "@/core/pantaai/runtime/runtime-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function modeFrom(value: unknown): "dry_run" | "github_pr" {
  return value === "github_pr" ? "github_pr" : "dry_run";
}

function requireAuthorizedForGithubPr(request: Request, mode: "dry_run" | "github_pr"): Response | undefined {
  if (mode !== "github_pr") return undefined;

  if (isPantavionSchedulerAuthorized(request)) return undefined;

  appendPantavionRuntimeLedgerEvent({
    eventType: "founder_gate_required",
    severity: "warning",
    kernelFamily: "Pantavion Work Package PR Executor",
    message: "Unauthorized work-package PR execution blocked.",
    protectedDomains: ["production", "github_pr", "founder_gate"],
    metadata: {
      marker: "pantavion_work_package_pr_executor_route_c9g_v1",
    },
  });

  return Response.json(
    {
      ok: false,
      marker: "pantavion_work_package_pr_executor_route_c9g_v1",
      error: "Unauthorized work-package PR execution.",
    },
    { status: 401 },
  );
}

export async function GET() {
  return Response.json({
    ok: true,
    marker: "pantavion_work_package_pr_executor_route_c9g_v1",
    executor: summarizeWorkPackagePrExecutorQueue(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const mode = modeFrom(body.mode);

  const unauthorized = requireAuthorizedForGithubPr(request, mode);
  if (unauthorized) return unauthorized;

  const result = await executeClaimedPantavionWorkPackageAsPr({
    packageId: asString(body.packageId),
    sourceRunId: asString(body.sourceRunId),
    mode,
  });

  return Response.json({
    ok: result.ok,
    marker: "pantavion_work_package_pr_executor_route_c9g_v1",
    result,
  });
}

const pantavion_work_package_pr_executor_route_marker_v1 =
  "pantavion_work_package_pr_executor_route_c9g_v1";
