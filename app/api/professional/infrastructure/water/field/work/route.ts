import { NextResponse } from "next/server";
import { WATER_FIELD_WORK_LIFECYCLE, type WaterFieldWorkRecord } from "@/core/water/water-field-work-record";
import { WATER_MATERIAL_SAMPLE_CATALOG } from "@/core/water/water-material-catalog";
import { UnconfiguredWaterFieldWorkRepository } from "@/core/water/water-field-work-repository";
import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";

const repository = new UnconfiguredWaterFieldWorkRepository();

function finiteNonNegative(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export async function POST(request: Request) {
  const access = await authorizeWaterMapRequest(request);
  if (!access.ok) {
    return NextResponse.json({ ok:false, error:"access_not_approved" }, { status:401 });
  }

  if (access.mode !== "admin-session") {\n    return NextResponse.json({ ok:false, error:"field_work_write_not_authorized" }, { status:403 });\n  }\n\n  const body = await request.json().catch(() => null) as Partial<WaterFieldWorkRecord> | null;
  if (!body?.workOrderId?.trim() || !body.stage || !WATER_FIELD_WORK_LIFECYCLE.includes(body.stage)) {
    return NextResponse.json({ ok:false, error:"invalid_field_work_record" }, { status:400 });
  }

  for (const material of body.materials ?? []) {
    if (material.itemRef !== "OTHER" && !WATER_MATERIAL_SAMPLE_CATALOG.some((item) => item.id === material.itemRef)) {
      return NextResponse.json({ ok:false, error:"unknown_material_catalog_item" }, { status:400 });
    }
    if (!Number.isFinite(material.quantity) || material.quantity <= 0) {
      return NextResponse.json({ ok:false, error:"invalid_material_quantity" }, { status:400 });
    }
  }

  for (const labour of body.labor ?? []) {
    if (!Number.isFinite(labour.hours) || labour.hours < 0) {
      return NextResponse.json({ ok:false, error:"invalid_labour_hours" }, { status:400 });
    }
  }

  const record: WaterFieldWorkRecord = {
    workOrderId: body.workOrderId.trim(),
    stage: body.stage,
    streetRegistryId: body.streetRegistryId ?? null,
    targetFeatureId: body.targetFeatureId ?? null,
    faultRef: body.faultRef ?? null,
    crew: body.crew ?? [],
    contractorRef: body.contractorRef ?? null,
    location: body.location ?? {},
    excavation: body.excavation ? {
      lengthM: finiteNonNegative(body.excavation.lengthM),
      widthM: finiteNonNegative(body.excavation.widthM),
      depthM: finiteNonNegative(body.excavation.depthM),
      surfaceType: body.excavation.surfaceType,
    } : undefined,
    networkObservation: body.networkObservation,
    materials: body.materials ?? [],
    labor: body.labor ?? [],
    evidenceRefs: body.evidenceRefs ?? [],
    notes: body.notes ?? [],
    capturedAt: body.capturedAt ?? new Date().toISOString(),
  };

  if (!repository.ready) {
    return NextResponse.json({
      ok:false,
      error:"field_work_persistence_not_ready",
      retainedAsDraft:false,
      canonicalNetworkMutated:false,
    }, { status:503 });
  }

  const saved = await repository.save(record, { actorRef: access.actorRef });
  return NextResponse.json({
    ok:true,
    saved,
    actorRef:access.actorRef,
    canonicalNetworkMutated:false,
  }, { status:201 });
}
