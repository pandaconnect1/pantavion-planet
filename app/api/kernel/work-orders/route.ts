import { NextResponse } from "next/server";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import {
  cancelPantavionFounderWorkOrder,
  listPantavionFounderWorkOrders,
  persistPantavionFounderWorkOrder,
  type PantavionFounderApprovalScope,
  type PantavionFounderWorkOrderSubmission,
} from "@/core/kernel/pantavion-work-order-runtime";
import type {
  PantavionAutonomousBuilderCapability,
  PantavionAutonomousBuildTarget,
} from "@/core/kernel/pantavion-autonomous-builder-kernel";
import type {
  PantavionFoundryWorkloadKind,
  PantavionFoundryWorkloadRequest,
} from "@/core/kernel/pantavion-foundry-workload-planner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUILD_TARGETS = [
  "pantavion_internal",
  "external_app",
  "api_integration",
  "admin_tool",
  "safety_system",
  "water_infrastructure",
  "sos_elder",
  "translation",
  "marketplace",
  "social_universe",
  "pantaai_center",
] as const satisfies readonly PantavionAutonomousBuildTarget[];

const BUILDER_CAPABILITIES = [
  "repo_truth",
  "code_audit",
  "error_repair",
  "scoped_patch",
  "internal_feature_build",
  "external_app_build",
  "provider_integration",
  "deployment_plan",
  "founder_approval_gate",
  "verification",
] as const satisfies readonly PantavionAutonomousBuilderCapability[];

const DEFAULT_CAPABILITIES: PantavionAutonomousBuilderCapability[] = [
  "repo_truth",
  "code_audit",
  "verification",
  "founder_approval_gate",
];

const APPROVAL_SCOPES = ["proposal_only", "scoped_draft_patch"] as const;
const WORKLOAD_KINDS = ["single_work_order", "recovery_excavation"] as const;

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function denied() {
  return noStore(
    NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
    }),
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringList(value: unknown, max = 40): string[] | null {
  if (!Array.isArray(value) || value.length > max) return null;
  if (!value.every((item) => typeof item === "string")) return null;
  return (value as string[]).map((item) => item.trim()).filter(Boolean);
}

function safeRepoPath(value: string): boolean {
  if (!value || value.length > 240) return false;
  if (value.startsWith("/") || value.startsWith(".") || value.includes("\\") || value.includes("..")) {
    return false;
  }

  return /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9._-]+$/.test(value);
}

function safeIntakeReference(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,159}$/.test(value) && !value.includes("..");
}

function parseWorkload(value: unknown): PantavionFoundryWorkloadRequest | null | undefined {
  if (value === undefined) return undefined;

  const workload = asRecord(value);
  if (!workload) return null;

  const kind = typeof workload.kind === "string" ? workload.kind : "";
  if (!WORKLOAD_KINDS.includes(kind as PantavionFoundryWorkloadKind)) return null;

  const rawUnitCount = workload.unitCount;
  const rawBatchSize = workload.batchSize;
  const unitCount = typeof rawUnitCount === "number" ? rawUnitCount : undefined;
  const batchSize = typeof rawBatchSize === "number" ? rawBatchSize : undefined;
  const intakeReference = typeof workload.intakeReference === "string"
    ? workload.intakeReference.trim()
    : undefined;

  if (
    (rawUnitCount !== undefined && (unitCount === undefined || !Number.isInteger(unitCount) || unitCount < 1 || unitCount > 100_000)) ||
    (rawBatchSize !== undefined && (batchSize === undefined || !Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1_000)) ||
    (intakeReference !== undefined && !safeIntakeReference(intakeReference))
  ) {
    return null;
  }

  if (kind === "recovery_excavation" && unitCount === undefined) return null;
  if (kind === "single_work_order" && unitCount !== undefined && unitCount !== 1) return null;

  return {
    kind: kind as PantavionFoundryWorkloadKind,
    ...(unitCount !== undefined ? { unitCount } : {}),
    ...(batchSize !== undefined ? { batchSize } : {}),
    ...(intakeReference ? { intakeReference } : {}),
  };
}

type ParsedSubmission =
  | { ok: true; value: PantavionFounderWorkOrderSubmission }
  | { ok: false; field: string; message: string };

function parseSubmission(value: unknown): ParsedSubmission {
  const body = asRecord(value);
  if (!body) return { ok: false, field: "body", message: "A JSON object is required." };

  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  if (!/^[a-zA-Z0-9_.:-]{8,180}$/.test(idempotencyKey)) {
    return {
      ok: false,
      field: "idempotencyKey",
      message: "Use an 8–180 character idempotency key containing only letters, digits, dot, underscore, colon, or dash.",
    };
  }

  const founderIntent = typeof body.founderIntent === "string" ? body.founderIntent.trim() : "";
  if (founderIntent.length < 12 || founderIntent.length > 6000) {
    return {
      ok: false,
      field: "founderIntent",
      message: "Founder intent must contain 12–6000 characters.",
    };
  }

  const target = typeof body.target === "string" ? body.target : "";
  if (!BUILD_TARGETS.includes(target as PantavionAutonomousBuildTarget)) {
    return { ok: false, field: "target", message: "Unknown Pantavion build target." };
  }

  const approvalScope =
    typeof body.approvalScope === "string" ? body.approvalScope : "proposal_only";
  if (!APPROVAL_SCOPES.includes(approvalScope as PantavionFounderApprovalScope)) {
    return { ok: false, field: "approvalScope", message: "Unknown approval scope." };
  }

  const targetFiles = body.targetFiles === undefined ? [] : stringList(body.targetFiles);
  if (!targetFiles || !targetFiles.every(safeRepoPath)) {
    return {
      ok: false,
      field: "targetFiles",
      message: "Target files must be scoped relative repository paths without hidden, absolute, or parent paths.",
    };
  }

  if (approvalScope === "scoped_draft_patch" && targetFiles.length === 0) {
    return {
      ok: false,
      field: "targetFiles",
      message: "A scoped draft patch requires at least one exact repository file.",
    };
  }

  const capabilities = body.capabilities === undefined ? [] : stringList(body.capabilities, 20);
  if (!capabilities || !capabilities.every((capability) => BUILDER_CAPABILITIES.includes(capability as PantavionAutonomousBuilderCapability))) {
    return { ok: false, field: "capabilities", message: "Unknown builder capability." };
  }

  const workload = parseWorkload(body.workload);
  if (workload === null) {
    return {
      ok: false,
      field: "workload",
      message:
        "Workload must be a bounded internal plan. Recovery excavation requires 1–100000 units and an optional opaque intake reference.",
    };
  }

  return {
    ok: true,
    value: {
      idempotencyKey,
      founderIntent,
      target: target as PantavionAutonomousBuildTarget,
      capabilities:
        capabilities.length > 0
          ? (Array.from(new Set(capabilities)) as PantavionAutonomousBuilderCapability[])
          : DEFAULT_CAPABILITIES,
      targetFiles: Array.from(new Set(targetFiles)),
      approvalScope: approvalScope as PantavionFounderApprovalScope,
      ...(workload ? { workload } : {}),
    },
  };
}

function durableRuntimeUnavailable() {
  return noStore(
    NextResponse.json(
      {
        ok: false,
        marker: "pantavion_work_order_storage_unavailable_v1",
        status: "blocked",
        reason: "durable_execution_runtime_unavailable",
        requiredAction:
          "Durable execution storage could not be reached. Verify the server-only Supabase admin key and deployed Foundry route; configure a Pantavion-owned internal runtime before work can execute.",
      },
      { status: 503 },
    ),
  );
}

function safeErrorMarker(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "idempotency_key_used_by_another_task") return message;
  if (message === "execution_is_not_a_pantavion_work_order") return message;
  return "pantavion_work_order_runtime_error";
}

export async function GET(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "30", 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 100)) : 30;

  try {
    const workOrders = await listPantavionFounderWorkOrders(limit);

    return noStore(
      NextResponse.json({
        ok: true,
        marker: "pantavion_founder_work_orders_operational_v1",
        status: "operational",
        workOrders,
        checkedAt: new Date().toISOString(),
      }),
    );
  } catch {
    return durableRuntimeUnavailable();
  }
}

export async function POST(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_work_order_invalid_json_v1",
          status: "invalid_request",
        },
        { status: 400 },
      ),
    );
  }

  const parsed = parseSubmission(body);
  if (!parsed.ok) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_work_order_validation_failed_v1",
          status: "invalid_request",
          field: parsed.field,
          message: parsed.message,
        },
        { status: 400 },
      ),
    );
  }

  try {
    const workOrder = await persistPantavionFounderWorkOrder(parsed.value);

    return noStore(
      NextResponse.json(
        {
          ok: true,
          marker: "pantavion_founder_work_order_persisted_v1",
          status: workOrder.execution.status,
          workOrder,
        },
        { status: workOrder.deduplicated ? 200 : 201 },
      ),
    );
  } catch (error) {
    const marker = safeErrorMarker(error);
    if (marker === "pantavion_work_order_runtime_error") return durableRuntimeUnavailable();

    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker,
          status: "conflict",
        },
        { status: 409 },
      ),
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  let body: Record<string, unknown> | null = null;
  try {
    body = asRecord(await request.json());
  } catch {
    body = null;
  }

  const executionId = typeof body?.executionId === "string" ? body.executionId.trim() : "";
  const action = typeof body?.action === "string" ? body.action : "";
  const reason = typeof body?.reason === "string" ? body.reason : "founder_requested_stop";

  if (action !== "cancel" || !/^pwo_[a-zA-Z0-9_-]{8,160}$/.test(executionId)) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_work_order_stop_validation_failed_v1",
          status: "invalid_request",
        },
        { status: 400 },
      ),
    );
  }

  try {
    const workOrder = await cancelPantavionFounderWorkOrder(executionId, reason);
    if (!workOrder) {
      return noStore(
        NextResponse.json(
          {
            ok: false,
            marker: "pantavion_work_order_not_found_v1",
            status: "not_found",
          },
          { status: 404 },
        ),
      );
    }

    return noStore(
      NextResponse.json({
        ok: true,
        marker: "pantavion_founder_work_order_cancelled_v1",
        status: workOrder.execution.status,
        workOrder,
      }),
    );
  } catch {
    return durableRuntimeUnavailable();
  }
}
