import {
  recordPantavionFailureAndCreateRepairJob,
  summarizePantavionRepairQueue,
  type PantavionRepairSignalKind,
} from "@/core/pantaai/autonomous-code/autonomous-repair-loop";
import { isPantavionSchedulerAuthorized } from "@/core/pantaai/runtime/scheduler-guard";
import { appendPantavionRuntimeLedgerEvent } from "@/core/pantaai/runtime/runtime-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPAIR_KINDS: readonly PantavionRepairSignalKind[] = [
  "build_failed",
  "typecheck_failed",
  "audit_failed",
  "github_actions_failed",
  "vercel_failed",
  "pr_preflight_failed",
  "runtime_error",
  "unknown_failure",
];

function asRepairKind(value: unknown): PantavionRepairSignalKind {
  return typeof value === "string" && REPAIR_KINDS.includes(value as PantavionRepairSignalKind)
    ? (value as PantavionRepairSignalKind)
    : "unknown_failure";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function requireAuthorizedInProduction(request: Request): Response | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;

  if (isPantavionSchedulerAuthorized(request)) return undefined;

  appendPantavionRuntimeLedgerEvent({
    eventType: "founder_gate_required",
    severity: "warning",
    kernelFamily: "Pantavion Autonomous Repair Kernel",
    message: "Unauthorized repair-loop request blocked in production.",
    protectedDomains: ["production", "autonomous_repair", "founder_gate"],
    metadata: {
      marker: "pantavion_autonomous_repair_route_c9b_v1",
    },
  });

  return Response.json(
    {
      ok: false,
      marker: "pantavion_autonomous_repair_route_c9b_v1",
      error: "Unauthorized autonomous repair request.",
    },
    { status: 401 },
  );
}

export async function GET(request: Request) {
  const unauthorized = requireAuthorizedInProduction(request);
  if (unauthorized) return unauthorized;

  return Response.json({
    ok: true,
    marker: "pantavion_autonomous_repair_route_c9b_v1",
    repair: summarizePantavionRepairQueue(),
  });
}

export async function POST(request: Request) {
  const unauthorized = requireAuthorizedInProduction(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const job = recordPantavionFailureAndCreateRepairJob({
    kind: asRepairKind(body.kind),
    summary: asString(body.summary) ?? "Autonomous failure reported without summary.",
    rawOutput: asString(body.rawOutput),
    targetFile: asString(body.targetFile),
    targetBranch: asString(body.targetBranch),
    sourceRunId: asString(body.sourceRunId),
  });

  return Response.json({
    ok: true,
    marker: "pantavion_autonomous_repair_route_c9b_v1",
    job,
    repair: summarizePantavionRepairQueue(),
  });
}

const pantavion_autonomous_repair_route_marker_v1 =
  "pantavion_autonomous_repair_route_c9b_v1";
