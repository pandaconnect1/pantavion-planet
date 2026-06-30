import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionOriginalDwgSourceBinding,
  getPantavionOriginalDwgSourceBinding,
  type PantavionOriginalDwgBindingInput
} from "@/core/water/original-dwg-source-binding";
import { verifyPantavionOriginalDwgLocalFile } from "@/core/water/original-dwg-source-verifier";
import { appendPantavionOriginalDwgSourceAudit } from "@/core/water/original-dwg-source-audit";
import { assessPantavionSensitiveArtifact } from "@/core/vault/sensitive-artifact-vault";
import { assessPantavionCadViewerAdapter } from "@/core/cad/cad-viewer-adapter-matrix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = "api:kernel:original-dwg-source-binding:get";
  const binding = getPantavionOriginalDwgSourceBinding();

  await appendPantavionOriginalDwgSourceAudit({
    event: "original.dwg.binding.read",
    actor,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_original_dwg_source_binding",
    status: "internal",
    binding,
    policy: {
      original:
        "GEORGE_MAP_MASTER_B_C_FINAL.dwg is registered as the original Pantavion Water B/C source-truth artifact.",
      noConversion:
        "No PDF, image, screenshot, GeoJSON, Leaflet reconstruction, sampling, simplification, filtering, or derivative may replace the original DWG.",
      viewer:
        "B/C original DWG rendering requires a real licensed CAD/DWG viewer adapter and founder approval.",
      safety:
        "Metadata binding is allowed for planning. Automatic rendering is blocked."
    }
  });
}

export async function POST(request: NextRequest) {
  const actor = "api:kernel:original-dwg-source-binding:post";
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const localPath = typeof body?.localPath === "string" ? body.localPath : undefined;
  const verifySha256 = Boolean(body?.verifySha256);
  const founderApproved = Boolean(body?.founderApproved);
  const requestedSurface =
    typeof body?.requestedSurface === "string" ? body.requestedSurface : undefined;

  let assessment;

  if (localPath) {
    assessment = await verifyPantavionOriginalDwgLocalFile({
      localPath,
      requestedSurface,
      verifySha256,
      founderApproved,
      actor
    });

    await appendPantavionOriginalDwgSourceAudit({
      event: "original.dwg.local.verification.requested",
      actor,
      createdAt: new Date().toISOString(),
      request: {
        requestedSurface,
        founderApproved,
        localPathProvided: true,
        verifySha256
      },
      assessment
    });
  } else {
    const bindingRequest: PantavionOriginalDwgBindingInput = {
      observedFilename:
        typeof body?.observedFilename === "string" ? body.observedFilename : undefined,
      observedSizeBytes:
        typeof body?.observedSizeBytes === "number" ? body.observedSizeBytes : undefined,
      observedSha256:
        typeof body?.observedSha256 === "string" ? body.observedSha256 : undefined,
      requestedSurface,
      founderApproved,
      actor,
      reason: typeof body?.reason === "string" ? body.reason : undefined
    };

    assessment = assessPantavionOriginalDwgSourceBinding(bindingRequest);

    await appendPantavionOriginalDwgSourceAudit({
      event: "original.dwg.binding.assessed",
      actor,
      createdAt: new Date().toISOString(),
      request: bindingRequest,
      assessment
    });
  }

  const vaultAssessment = assessPantavionSensitiveArtifact({
    path: localPath,
    filename: assessment.filename,
    extension: "dwg",
    artifactClass: "dwg_source_truth",
    operation: "render",
    sourceTruth: true,
    production: false,
    founderApproved,
    actor,
    reason: "Pantavion original DWG B/C source binding"
  });

  const cadAssessment = assessPantavionCadViewerAdapter({
    adapterId: "oda_inweb_dwg_viewer",
    sourceFormat: "dwg",
    target: "embedded_viewer",
    useCase: "Pantavion Water B/C original DWG viewer",
    sourceTruth: true,
    production: false,
    founderApproved,
    licenseAvailable: false,
    cloudApproved: false,
    actor
  });

  return NextResponse.json({
    ok: true,
    assessment,
    vaultAssessment,
    cadAssessment
  });
}
