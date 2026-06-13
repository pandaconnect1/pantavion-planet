import {
  appendPantavionRuntimeLedgerEvent,
  summarizePantavionRuntimeLedger,
  type PantavionRuntimeLedgerEventType,
  type PantavionRuntimeLedgerSeverity,
} from "@/core/pantaai/runtime/runtime-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.PANTAVION_AUTONOMOUS_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = request.headers.get("authorization") ?? "";
  const headerSecret = request.headers.get("x-pantavion-autonomous-secret") ?? "";
  return auth === `Bearer ${secret}` || headerSecret === secret;
}

const EVENT_TYPES: readonly PantavionRuntimeLedgerEventType[] = [
  "kernel_wake",
  "job_claimed",
  "gap_detected",
  "code_generated",
  "adapter_planned",
  "work_package_planned",
  "audit_passed",
  "audit_failed",
  "build_passed",
  "build_failed",
  "pr_created",
  "protected_gate_required",
  "founder_gate_required",
  "provider_required",
  "connector_required",
  "error_recorded",
];

const SEVERITIES: readonly PantavionRuntimeLedgerSeverity[] = [
  "info",
  "warning",
  "error",
  "critical",
];

function asEventType(value: unknown): PantavionRuntimeLedgerEventType {
  return typeof value === "string" && EVENT_TYPES.includes(value as PantavionRuntimeLedgerEventType)
    ? (value as PantavionRuntimeLedgerEventType)
    : "kernel_wake";
}

function asSeverity(value: unknown): PantavionRuntimeLedgerSeverity {
  return typeof value === "string" && SEVERITIES.includes(value as PantavionRuntimeLedgerSeverity)
    ? (value as PantavionRuntimeLedgerSeverity)
    : "info";
}

function asStringArray(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function GET() {
  return Response.json({
    marker: "pantavion_runtime_ledger_route_c7a_v1",
    ledger: summarizePantavionRuntimeLedger(),
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized runtime ledger append request.",
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => ({}));

  const event = appendPantavionRuntimeLedgerEvent({
    runId: typeof body.runId === "string" ? body.runId : undefined,
    eventType: asEventType(body.eventType),
    severity: asSeverity(body.severity),
    kernelFamily: typeof body.kernelFamily === "string" ? body.kernelFamily : "Pantavion Autonomous Kernel",
    message: typeof body.message === "string" ? body.message : "Runtime event recorded.",
    protectedDomains: asStringArray(body.protectedDomains),
    metadata:
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : undefined,
  });

  return Response.json({
    ok: true,
    marker: "pantavion_runtime_ledger_route_c7a_v1",
    event,
    ledger: summarizePantavionRuntimeLedger(),
  });
}

const pantavion_runtime_ledger_route_marker_v1 =
  "pantavion_runtime_ledger_route_c7a_v1";

