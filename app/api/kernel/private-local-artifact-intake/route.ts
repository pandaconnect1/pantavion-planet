import { NextRequest, NextResponse } from "next/server";
import {
  appendPantavionPrivateLocalArtifactAudit,
  assessPantavionPrivateLocalArtifactIntake,
  ingestPantavionPrivateLocalArtifact,
  readPantavionPrivateLocalArtifactRecords,
  type PantavionPrivateLocalArtifactInput
} from "@/core/storage/private-local-artifact-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = "api:kernel:private-local-artifact-intake:get";
  const records = await readPantavionPrivateLocalArtifactRecords();

  await appendPantavionPrivateLocalArtifactAudit({
    event: "private.local.artifact.intake.read",
    actor,
    createdAt: new Date().toISOString(),
    records
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_private_local_artifact_intake_dwg_upload",
    status: "internal_ready",
    records,
    rules: {
      intake:
        "Streams local/USB files into Pantavion private storage and computes SHA256.",
      original:
        "Original DWG/source truth is immutable and never mutated.",
      storage:
        "No Git storage, no public folder, private artifact folder only.",
      surfaces:
        "Requested B/C surface is stored as metadata for downstream DWG binding.",
      public:
        "Public access is blocked."
    }
  });
}

export async function POST(request: NextRequest) {
  const actor = "api:kernel:private-local-artifact-intake:post";
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const intakeRequest: PantavionPrivateLocalArtifactInput = {
    sourcePath: typeof body?.sourcePath === "string" ? body.sourcePath : undefined,
    artifactId: typeof body?.artifactId === "string" ? body.artifactId : undefined,
    filename: typeof body?.filename === "string" ? body.filename : undefined,
    expectedSha256: typeof body?.expectedSha256 === "string" ? body.expectedSha256 : undefined,
    sourceTruth: Boolean(body?.sourceTruth),
    sensitive: Boolean(body?.sensitive),
    production: Boolean(body?.production),
    requestedSurface: typeof body?.requestedSurface === "string" ? body.requestedSurface : undefined,
    founderApproved: Boolean(body?.founderApproved),
    publicAccessRequested: Boolean(body?.publicAccessRequested),
    actor: typeof body?.actor === "string" ? body.actor : actor,
    reason: typeof body?.reason === "string" ? body.reason : undefined
  };

  const mode = typeof body?.mode === "string" ? body.mode : "assess";

  if (mode === "ingest" || mode === "register") {
    const result = await ingestPantavionPrivateLocalArtifact(intakeRequest);

    return NextResponse.json({
      ok: true,
      mode,
      assessment: result.assessment,
      records: result.records
    });
  }

  const assessment = await assessPantavionPrivateLocalArtifactIntake(intakeRequest);

  await appendPantavionPrivateLocalArtifactAudit({
    event: "private.local.artifact.intake.assessed",
    actor: intakeRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: intakeRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    mode,
    assessment
  });
}
