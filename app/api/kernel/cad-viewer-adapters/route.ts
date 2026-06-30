import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionCadViewerAdapter,
  listPantavionCadViewerAdapters,
  type PantavionCadViewerAssessmentInput
} from "@/core/cad/cad-viewer-adapter-matrix";
import { appendPantavionCadViewerAudit } from "@/core/cad/cad-viewer-audit";
import { verifyKernelRequest } from "@/core/kernel/kernel-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = verifyKernelRequest(request);

  if (!auth.ok && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.statusCode }
    );
  }

  const actor = auth.ok ? auth.actor : "local-cad-viewer-adapters";
  const adapters = listPantavionCadViewerAdapters();

  await appendPantavionCadViewerAudit({
    event: "cad.viewer.adapters.read",
    actor,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_cad_dwg_viewer_adapter_matrix",
    status: "internal",
    adapters,
    policy: {
      dwgSourceTruth:
        "Original DWG must remain read-only source truth. No layer, color, text, arrow, label, block, coordinate, or entity may be removed, filtered, simplified, sampled, reconstructed, or replaced.",
      blocked:
        "Static image, PDF, screenshot, Leaflet/GeoJSON, tiles, or reconstructed maps must never be presented as the original DWG.",
      approval:
        "DWG/source-truth, cloud upload, production, legal, infrastructure, and security-sensitive changes require founder approval."
    }
  });
}

export async function POST(request: NextRequest) {
  const auth = verifyKernelRequest(request);

  if (!auth.ok && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.statusCode }
    );
  }

  const actor = auth.ok ? auth.actor : "local-cad-viewer-adapters";
  const body = (await request.json().catch(() => null)) as
    | Partial<PantavionCadViewerAssessmentInput>
    | null;

  const cadRequest: PantavionCadViewerAssessmentInput = {
    adapterId: body?.adapterId,
    sourceFormat: body?.sourceFormat ?? "dwg",
    target: body?.target ?? "embedded_viewer",
    useCase: body?.useCase,
    sourceTruth: body?.sourceTruth ?? true,
    production: body?.production,
    founderApproved: body?.founderApproved,
    licenseAvailable: body?.licenseAvailable,
    cloudApproved: body?.cloudApproved,
    actor
  };

  const assessment = assessPantavionCadViewerAdapter(cadRequest);

  await appendPantavionCadViewerAudit({
    event: "cad.viewer.adapter.assessed",
    actor: cadRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: cadRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    assessment
  });
}
