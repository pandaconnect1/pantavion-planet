import { NextRequest, NextResponse } from "next/server";
import { verifyKernelRequest } from "@/core/kernel/kernel-auth";
import {
  assessPantavionWaterWorkOrder,
  type PantavionWaterWorkOrderRegistryInput
} from "@/core/water/water-work-order-registry";
import {
  appendPantavionWaterWorkOrderRegistryAudit,
  readPantavionWaterWorkOrderRecords,
  registerPantavionWaterWorkOrder
} from "@/core/water/water-work-order-registry-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function resolveActor(request: Request, fallbackActor: string) {
  const auth = verifyKernelRequest(request);

  if (auth.ok) {
    return {
      actor: auth.actor,
      authWarning: auth.warning
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      actor: fallbackActor,
      authWarning:
        "Local development mode. Water work order registry request accepted without production auth."
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  const resolved = resolveActor(request, "api:kernel:water-work-order-registry:get");

  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized water work order registry access." },
      { status: 401 }
    );
  }

  const actor = resolved.actor;
  const records = await readPantavionWaterWorkOrderRecords();

  await appendPantavionWaterWorkOrderRegistryAudit({
    event: "water.work.order.registry.read",
    actor,
    createdAt: new Date().toISOString(),
    records
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_water_work_order_field_verification_registry",
    status: "internal",
    records,
    rules: {
      scope:
        "Fault, repair, replacement, lost/covered investigation, inspection, telemetry check and as-built verification workflows.",
      original:
        "Work orders reference original DWG/source artifacts but never mutate original DWG source truth.",
      field:
        "Field verification, supervisor review, photo references and crew/work history are recorded as operational state.",
      control:
        "No physical valve control and no SCADA write are allowed.",
      telemetry:
        "Telemetry references are read/status bindings only at this stage."
    }
  });
}

export async function POST(request: NextRequest) {
  const resolved = resolveActor(request, "api:kernel:water-work-order-registry:post");

  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized water work order registry mutation." },
      { status: 401 }
    );
  }

  const actor = resolved.actor;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const workOrderRequest: PantavionWaterWorkOrderRegistryInput = {
    workOrderId: typeof body?.workOrderId === "string" ? body.workOrderId : undefined,
    assetId: typeof body?.assetId === "string" ? body.assetId : undefined,
    assetKind: typeof body?.assetKind === "string" ? body.assetKind : undefined,
    kind: typeof body?.kind === "string" ? body.kind : undefined,
    status: typeof body?.status === "string" ? body.status : undefined,
    priority: typeof body?.priority === "string" ? body.priority : undefined,
    title: typeof body?.title === "string" ? body.title : undefined,
    faultId: typeof body?.faultId === "string" ? body.faultId : undefined,
    crewId: typeof body?.crewId === "string" ? body.crewId : undefined,
    assignedTo: stringArray(body?.assignedTo),
    photoRefs: stringArray(body?.photoRefs),
    materialRefs: stringArray(body?.materialRefs),
    telemetryPointIds: stringArray(body?.telemetryPointIds),
    relatedWorkOrderIds: stringArray(body?.relatedWorkOrderIds),
    roadName: typeof body?.roadName === "string" ? body.roadName : undefined,
    zoneId: typeof body?.zoneId === "string" ? body.zoneId : undefined,
    dmaId: typeof body?.dmaId === "string" ? body.dmaId : undefined,
    sourceDwgBindingId:
      typeof body?.sourceDwgBindingId === "string" ? body.sourceDwgBindingId : undefined,
    fieldNotes: typeof body?.fieldNotes === "string" ? body.fieldNotes : undefined,
    repairNotes: typeof body?.repairNotes === "string" ? body.repairNotes : undefined,
    replacementNotes:
      typeof body?.replacementNotes === "string" ? body.replacementNotes : undefined,
    fieldVerified: Boolean(body?.fieldVerified),
    supervisorReviewed: Boolean(body?.supervisorReviewed),
    replacementRequired: Boolean(body?.replacementRequired),
    repairCompleted: Boolean(body?.repairCompleted),
    actor,
    reason: typeof body?.reason === "string" ? body.reason : undefined
  };

  const mode = typeof body?.mode === "string" ? body.mode : "assess";

  if (mode === "register") {
    const result = await registerPantavionWaterWorkOrder(workOrderRequest);

    return NextResponse.json({
      ok: true,
      mode,
      assessment: result.assessment,
      records: result.records
    });
  }

  const assessment = assessPantavionWaterWorkOrder(workOrderRequest);

  await appendPantavionWaterWorkOrderRegistryAudit({
    event: "water.work.order.registry.assessed",
    actor,
    createdAt: new Date().toISOString(),
    request: workOrderRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    mode,
    assessment
  });
}
