import {
  acquirePantavionThreadLock,
  releasePantavionThreadLock,
  summarizePantavionThreadLocks,
  type PantavionLockOwnerKind,
} from "@/core/pantaai/runtime/file-thread-lock-registry";
import { isPantavionSchedulerAuthorized } from "@/core/pantaai/runtime/scheduler-guard";
import { appendPantavionRuntimeLedgerEvent } from "@/core/pantaai/runtime/runtime-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER_KINDS: readonly PantavionLockOwnerKind[] = [
  "founder",
  "worker_thread",
  "kernel",
  "cron",
  "github_pr",
  "unknown",
];

function asOwnerKind(value: unknown): PantavionLockOwnerKind {
  return typeof value === "string" && OWNER_KINDS.includes(value as PantavionLockOwnerKind)
    ? (value as PantavionLockOwnerKind)
    : "unknown";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function requireAuthorizedInProduction(request: Request): Response | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;

  if (isPantavionSchedulerAuthorized(request)) return undefined;

  appendPantavionRuntimeLedgerEvent({
    eventType: "founder_gate_required",
    severity: "warning",
    kernelFamily: "Pantavion File Thread Lock Registry",
    message: "Unauthorized file/thread lock mutation blocked in production.",
    protectedDomains: ["production", "thread_locks", "founder_gate"],
    metadata: {
      marker: "pantavion_file_thread_locks_route_c9c_v1",
    },
  });

  return Response.json(
    {
      ok: false,
      marker: "pantavion_file_thread_locks_route_c9c_v1",
      error: "Unauthorized file/thread lock request.",
    },
    { status: 401 },
  );
}

export async function GET() {
  return Response.json({
    ok: true,
    marker: "pantavion_file_thread_locks_route_c9c_v1",
    locks: summarizePantavionThreadLocks(),
  });
}

export async function POST(request: Request) {
  const unauthorized = requireAuthorizedInProduction(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = asString(body.action) ?? "acquire";

  if (action === "release") {
    const result = releasePantavionThreadLock({
      lockId: asString(body.lockId) ?? "",
      ownerId: asString(body.ownerId),
      sourceRunId: asString(body.sourceRunId),
    });

    return Response.json({
      ok: result.ok,
      marker: "pantavion_file_thread_locks_route_c9c_v1",
      result,
    });
  }

  const result = acquirePantavionThreadLock({
    ownerKind: asOwnerKind(body.ownerKind),
    ownerId: asString(body.ownerId) ?? "unknown-worker",
    purpose: asString(body.purpose) ?? "Pantavion file/thread lock request.",
    branch: asString(body.branch),
    sourceRunId: asString(body.sourceRunId),
    ttlMinutes: asNumber(body.ttlMinutes),
    files: asStringArray(body.files),
  });

  return Response.json({
    ok: result.ok,
    marker: "pantavion_file_thread_locks_route_c9c_v1",
    result,
  });
}

const pantavion_file_thread_locks_route_marker_v1 =
  "pantavion_file_thread_locks_route_c9c_v1";
