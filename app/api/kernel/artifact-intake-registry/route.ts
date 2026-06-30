import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionArtifactIntake,
  listPantavionArtifactIntakeRules,
  type PantavionArtifactIntakeInput,
  type PantavionArtifactStorageProvider
} from "@/core/artifacts/artifact-intake-registry";
import { appendPantavionArtifactIntakeAudit } from "@/core/artifacts/artifact-intake-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeStorageProvider(value: unknown): PantavionArtifactStorageProvider {
  const allowed: PantavionArtifactStorageProvider[] = [
    "local_metadata_only",
    "vercel_blob_private",
    "s3_private",
    "cloudflare_r2_private",
    "google_drive_import",
    "onedrive_import",
    "signed_url_import",
    "unknown"
  ];

  return allowed.includes(value as PantavionArtifactStorageProvider)
    ? (value as PantavionArtifactStorageProvider)
    : "unknown";
}

export async function GET() {
  const actor = "api:kernel:artifact-intake-registry:get";
  const rules = listPantavionArtifactIntakeRules();

  await appendPantavionArtifactIntakeAudit({
    event: "artifact.intake.rules.read",
    actor,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_universal_artifact_intake_registry",
    status: "internal",
    rules,
    policy: {
      storage:
        "Large or source-truth artifacts must use private object storage, not Git, public folders, or browser-visible static assets.",
      dwg:
        "DWG source truth requires private storage, SHA256 verification, vault check, CAD adapter check, and founder approval.",
      derivatives:
        "GeoJSON/PDF/image/screenshot/tile derivatives must never be presented as original DWG.",
      upload:
        "This route assesses intake and upload strategy. It does not upload bytes until a private storage adapter is configured."
    }
  });
}

export async function POST(request: NextRequest) {
  const actor = "api:kernel:artifact-intake-registry:post";
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const intakeRequest: PantavionArtifactIntakeInput = {
    filename: typeof body?.filename === "string" ? body.filename : undefined,
    extension: typeof body?.extension === "string" ? body.extension : undefined,
    sizeBytes: typeof body?.sizeBytes === "number" ? body.sizeBytes : undefined,
    sha256: typeof body?.sha256 === "string" ? body.sha256 : undefined,
    storageProvider: normalizeStorageProvider(body?.storageProvider),
    requestedSurface: typeof body?.requestedSurface === "string" ? body.requestedSurface : undefined,
    sourceTruth: Boolean(body?.sourceTruth),
    production: Boolean(body?.production),
    founderApproved: Boolean(body?.founderApproved),
    actor: typeof body?.actor === "string" ? body.actor : actor,
    reason: typeof body?.reason === "string" ? body.reason : undefined
  };

  const assessment = assessPantavionArtifactIntake(intakeRequest);

  await appendPantavionArtifactIntakeAudit({
    event: "artifact.intake.assessed",
    actor: intakeRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: intakeRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    assessment
  });
}
