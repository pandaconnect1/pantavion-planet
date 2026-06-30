import { NextRequest, NextResponse } from "next/server";
import { verifyKernelRequest } from "@/core/kernel/kernel-auth";
import {
  assessPantavionArtifactIntake,
  listPantavionArtifactIntakeRules,
  type PantavionArtifactIntakeInput,
  type PantavionArtifactStorageProvider
} from "@/core/artifacts/artifact-intake-registry";
import { appendPantavionArtifactIntakeAudit } from "@/core/artifacts/artifact-intake-audit";

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
      actor: "local-artifact-intake-registry-api",
      authWarning: "Local development mode. Artifact intake request accepted without production auth."
    };
  }

  return null;
}

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

export async function GET(request: NextRequest) {
  const auth = resolveActor(request);

  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized artifact intake registry access." },
      { status: 401 }
    );
  }

  const actor = auth.actor;
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
    authWarning: auth.authWarning,
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
  const auth = resolveActor(request);

  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized artifact intake assessment." },
      { status: 401 }
    );
  }

  const actor = auth.actor;
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
    actor,
    reason: typeof body?.reason === "string" ? body.reason : undefined
  };

  const assessment = assessPantavionArtifactIntake(intakeRequest);

  await appendPantavionArtifactIntakeAudit({
    event: "artifact.intake.assessed",
    actor,
    createdAt: new Date().toISOString(),
    request: intakeRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    authWarning: auth.authWarning,
    assessment
  });
}
