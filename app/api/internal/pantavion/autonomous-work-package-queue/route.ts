import {
  claimNextPantavionWorkPackage,
  completePantavionWorkPackage,
  failPantavionWorkPackage,
  seedPantavionAutonomousWorkPackages,
  summarizePantavionWorkPackageQueue,
} from "@/core/pantaai/runtime/autonomous-work-package-coordinator";
import { isPantavionSchedulerAuthorized } from "@/core/pantaai/runtime/scheduler-guard";
import { appendPantavionRuntimeLedgerEvent } from "@/core/pantaai/runtime/runtime-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function requireAuthorizedForMutation(request: Request): Response | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;

  if (isPantavionSchedulerAuthorized(request)) return undefined;

  appendPantavionRuntimeLedgerEvent({
    eventType: "founder_gate_required",
    severity: "warning",
    kernelFamily: "Pantavion Autonomous Work Package Coordinator",
    message: "Unauthorized work-package queue mutation blocked in production.",
    protectedDomains: ["production", "work_package_queue", "founder_gate"],
    metadata: {
      marker: "pantavion_autonomous_work_package_queue_route_c9e_v1",
    },
  });

  return Response.json(
    {
      ok: false,
      marker: "pantavion_autonomous_work_package_queue_route_c9e_v1",
      error: "Unauthorized work-package queue request.",
    },
    { status: 401 },
  );
}

export async function GET() {
  return Response.json({
    ok: true,
    marker: "pantavion_autonomous_work_package_queue_route_c9e_v1",
    queue: summarizePantavionWorkPackageQueue(),
  });
}

export async function POST(request: Request) {
  const unauthorized = requireAuthorizedForMutation(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = asString(body.action) ?? "seed";

  if (action === "claim") {
    const result = claimNextPantavionWorkPackage({
      ownerId: asString(body.ownerId) ?? "pantavion-autonomous-kernel",
      ownerKind: "kernel",
      branch: asString(body.branch),
      sourceRunId: asString(body.sourceRunId),
    });

    return Response.json({
      ok: result.ok,
      marker: "pantavion_autonomous_work_package_queue_route_c9e_v1",
      result,
    });
  }

  if (action === "complete") {
    const result = completePantavionWorkPackage({
      packageId: asString(body.packageId) ?? "",
      sourceRunId: asString(body.sourceRunId),
    });

    return Response.json({
      ok: result.ok,
      marker: "pantavion_autonomous_work_package_queue_route_c9e_v1",
      result,
    });
  }

  if (action === "fail") {
    const result = failPantavionWorkPackage({
      packageId: asString(body.packageId) ?? "",
      reason: asString(body.reason) ?? "Work package failed without recorded reason.",
      sourceRunId: asString(body.sourceRunId),
    });

    return Response.json({
      ok: result.ok,
      marker: "pantavion_autonomous_work_package_queue_route_c9e_v1",
      result,
    });
  }

  const queue = seedPantavionAutonomousWorkPackages();

  return Response.json({
    ok: true,
    marker: "pantavion_autonomous_work_package_queue_route_c9e_v1",
    action: "seed",
    queue: summarizePantavionWorkPackageQueue(),
    packages: queue.packages,
  });
}

const pantavion_autonomous_work_package_queue_route_marker_v1 =
  "pantavion_autonomous_work_package_queue_route_c9e_v1";
