import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionWaterOperationalOverlay,
  listPantavionWaterOperationalColorPolicy,
  type PantavionWaterOperationalAction,
  type PantavionWaterOperationalAssetKind,
  type PantavionWaterOperationalOverlayInput
} from "@/core/water/water-operational-overlay";
import {
  appendPantavionWaterOperationalOverlayAudit,
  applyPantavionWaterOperationalOverlay,
  readPantavionWaterOperationalOverlayRecords
} from "@/core/water/water-operational-overlay-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeAction(value: unknown): PantavionWaterOperationalAction {
  const raw = String(value || "").trim();

  const allowed: PantavionWaterOperationalAction[] = [
    "mark_closed_fault",
    "mark_closed_permanent",
    "mark_open_after_repair",
    "restore_natural",
    "restore_all_opened",
    "mark_sv_problem",
    "mark_sv_defective_operable",
    "mark_sv_defective_inoperable",
    "mark_sv_replacement_required",
    "mark_sv_replaced_pending_verification",
    "mark_sv_lost_or_covered",
    "field_verify"
  ];

  return allowed.includes(raw as PantavionWaterOperationalAction)
    ? (raw as PantavionWaterOperationalAction)
    : "mark_closed_fault";
}

function normalizeAssetKind(value: unknown): PantavionWaterOperationalAssetKind {
  const raw = String(value || "").trim().toUpperCase();

  const allowed: PantavionWaterOperationalAssetKind[] = [
    "SV",
    "FH",
    "PRV",
    "DMA",
    "PIPE",
    "METER",
    "PUMP",
    "TANK",
    "TELEMETRY",
    "UNKNOWN"
  ];

  return allowed.includes(raw as PantavionWaterOperationalAssetKind)
    ? (raw as PantavionWaterOperationalAssetKind)
    : "UNKNOWN";
}

export async function GET() {
  const actor = "api:kernel:water-operational-overlay:get";
  const records = await readPantavionWaterOperationalOverlayRecords();

  await appendPantavionWaterOperationalOverlayAudit({
    event: "water.operational.overlay.read",
    actor,
    createdAt: new Date().toISOString(),
    records
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_water_operational_overlay_sv_workflow",
    status: "internal",
    colorPolicy: listPantavionWaterOperationalColorPolicy(),
    records,
    rules: {
      original:
        "Operational overlays never mutate original DWG colors, layers, blocks, entities, or source truth.",
      surfaces:
        "Surface B remains original-only. Surface C is the operational overlay surface.",
      colors:
        "Blue temporary closed, red permanent closed, green opened after repair, purple replacement required, cyan dashed ring with white internal hatch/symbol for lost/covered/buried/loose SV.",
      safety:
        "This is not remote physical valve control and does not write to SCADA."
    }
  });
}

export async function POST(request: NextRequest) {
  const actor = "api:kernel:water-operational-overlay:post";
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const overlayRequest: PantavionWaterOperationalOverlayInput = {
    action: normalizeAction(body?.action),
    assetId: typeof body?.assetId === "string" ? body.assetId : undefined,
    assetKind: normalizeAssetKind(body?.assetKind ?? "SV"),
    surface: typeof body?.surface === "string" ? body.surface : "C",
    faultId: typeof body?.faultId === "string" ? body.faultId : undefined,
    workOrderId: typeof body?.workOrderId === "string" ? body.workOrderId : undefined,
    reason: typeof body?.reason === "string" ? body.reason : undefined,
    actor: typeof body?.actor === "string" ? body.actor : actor,
    includePermanent: Boolean(body?.includePermanent),
    fieldVerified: Boolean(body?.fieldVerified),
    supervisorReviewed: Boolean(body?.supervisorReviewed)
  };

  const mode = typeof body?.mode === "string" ? body.mode : "assess";

  if (mode === "apply") {
    const result = await applyPantavionWaterOperationalOverlay(overlayRequest);

    return NextResponse.json({
      ok: true,
      mode,
      assessment: result.assessment,
      records: result.records
    });
  }

  const assessment = assessPantavionWaterOperationalOverlay(overlayRequest);

  await appendPantavionWaterOperationalOverlayAudit({
    event: "water.operational.overlay.assessed",
    actor: overlayRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: overlayRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    mode,
    assessment
  });
}
