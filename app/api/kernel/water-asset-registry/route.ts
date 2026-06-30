import { NextRequest, NextResponse } from "next/server";
import { verifyKernelRequest } from "@/core/kernel/kernel-auth";
import {
  assessPantavionWaterAssetRegistration,
  listPantavionWaterAssetTypeRegistry,
  type PantavionWaterAssetRegistryInput
} from "@/core/water/water-asset-registry";
import {
  appendPantavionWaterAssetRegistryAudit,
  readPantavionWaterAssetRecords,
  registerPantavionWaterAsset
} from "@/core/water/water-asset-registry-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveActor(request: Request) {
  const auth = verifyKernelRequest(request);

  if (auth.ok) {
    return {
      actor: auth.actor,
      authWarning: auth.warning
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      actor: "local-water-asset-registry-api",
      authWarning: "Local development mode. Water asset registry request accepted without production auth."
    };
  }

  return null;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export async function GET(request: NextRequest) {
  const resolved = resolveActor(request);

  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized water asset registry access." },
      { status: 401 }
    );
  }

  const actor = resolved.actor;
  const records = await readPantavionWaterAssetRecords();

  await appendPantavionWaterAssetRegistryAudit({
    event: "water.asset.registry.read",
    actor,
    createdAt: new Date().toISOString(),
    records
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_water_asset_registry_sv_fh_prv_dma_telemetry",
    status: "internal",
    authWarning: resolved.authWarning,
    assetTypes: listPantavionWaterAssetTypeRegistry(),
    records,
    rules: {
      original:
        "Asset registry stores metadata and source references only. It never mutates original DWG source truth.",
      control:
        "No physical valve control and no SCADA write are allowed.",
      overlay:
        "Operational overlay states are linked to assets but remain separate from original map/DWG styling.",
      telemetry:
        "Telemetry bindings are read/status references at this stage."
    }
  });
}

export async function POST(request: NextRequest) {
  const resolved = resolveActor(request);

  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized water asset registry mutation." },
      { status: 401 }
    );
  }

  const actor = resolved.actor;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const registryRequest: PantavionWaterAssetRegistryInput = {
    assetId: typeof body?.assetId === "string" ? body.assetId : undefined,
    kind: typeof body?.kind === "string" ? body.kind : undefined,
    displayName: typeof body?.displayName === "string" ? body.displayName : undefined,
    condition: typeof body?.condition === "string" ? body.condition : undefined,
    zoneId: typeof body?.zoneId === "string" ? body.zoneId : undefined,
    dmaId: typeof body?.dmaId === "string" ? body.dmaId : undefined,
    roadName: typeof body?.roadName === "string" ? body.roadName : undefined,
    sourceDwgBindingId:
      typeof body?.sourceDwgBindingId === "string" ? body.sourceDwgBindingId : undefined,
    sourceLayerName: typeof body?.sourceLayerName === "string" ? body.sourceLayerName : undefined,
    sourceBlockName: typeof body?.sourceBlockName === "string" ? body.sourceBlockName : undefined,
    latitude: numberValue(body?.latitude),
    longitude: numberValue(body?.longitude),
    mapX: numberValue(body?.mapX),
    mapY: numberValue(body?.mapY),
    telemetryPointIds: stringArray(body?.telemetryPointIds),
    workOrderIds: stringArray(body?.workOrderIds),
    photoRefs: stringArray(body?.photoRefs),
    sourceTruth: Boolean(body?.sourceTruth),
    fieldVerified: Boolean(body?.fieldVerified),
    supervisorReviewed: Boolean(body?.supervisorReviewed),
    actor,
    reason: typeof body?.reason === "string" ? body.reason : undefined
  };

  const mode = typeof body?.mode === "string" ? body.mode : "assess";

  if (mode === "register") {
    const result = await registerPantavionWaterAsset(registryRequest);

    return NextResponse.json({
      ok: true,
      mode,
      authWarning: resolved.authWarning,
      assessment: result.assessment,
      records: result.records
    });
  }

  const assessment = assessPantavionWaterAssetRegistration(registryRequest);

  await appendPantavionWaterAssetRegistryAudit({
    event: "water.asset.registry.assessed",
    actor: registryRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: registryRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    mode,
    authWarning: resolved.authWarning,
    assessment
  });
}
