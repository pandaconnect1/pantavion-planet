import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionPrivateUploadSession,
  PANTAVION_PRIVATE_UPLOAD_SUPPORTED_EXTENSIONS,
  type PantavionPrivateUploadSessionInput
} from "@/core/storage/private-upload-session-contract";
import {
  appendPantavionPrivateUploadSessionAudit,
  readPantavionPrivateUploadSessionRecords,
  registerPantavionPrivateUploadSessionContract
} from "@/core/storage/private-upload-session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export async function GET() {
  const actor = "api:kernel:private-upload-session:get";
  const records = await readPantavionPrivateUploadSessionRecords();

  await appendPantavionPrivateUploadSessionAudit({
    event: "private.upload.session.read",
    actor,
    createdAt: new Date().toISOString(),
    records
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_private_storage_upload_session_multipart_contract",
    status: "internal_contract",
    supportedArtifacts: PANTAVION_PRIVATE_UPLOAD_SUPPORTED_EXTENSIONS,
    records,
    rules: {
      execution: "This route assesses and registers upload session contracts only. It does not upload bytes yet.",
      storage: "Private storage only. No Git storage and no public folder are allowed.",
      largeFiles: "Files above 100MB require multipart/chunked upload with resume, retry and final SHA256 verification in later patches.",
      original: "Original DWG/source truth is immutable and never mutated."
    }
  });
}

export async function POST(request: NextRequest) {
  const actor = "api:kernel:private-upload-session:post";
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const uploadRequest: PantavionPrivateUploadSessionInput = {
    sessionId: typeof body?.sessionId === "string" ? body.sessionId : undefined,
    artifactId: typeof body?.artifactId === "string" ? body.artifactId : undefined,
    filename: typeof body?.filename === "string" ? body.filename : undefined,
    extension: typeof body?.extension === "string" ? body.extension : undefined,
    sizeBytes: numberValue(body?.sizeBytes),
    sha256: typeof body?.sha256 === "string" ? body.sha256 : undefined,
    sourceTruth: Boolean(body?.sourceTruth),
    sensitive: Boolean(body?.sensitive),
    production: Boolean(body?.production),
    requestedSurface: typeof body?.requestedSurface === "string" ? body.requestedSurface : undefined,
    storageProvider: typeof body?.storageProvider === "string" ? body.storageProvider : undefined,
    providerConfigured: Boolean(body?.providerConfigured),
    founderApproved: Boolean(body?.founderApproved),
    publicAccessRequested: Boolean(body?.publicAccessRequested),
    actor: typeof body?.actor === "string" ? body.actor : actor,
    reason: typeof body?.reason === "string" ? body.reason : undefined
  };

  const mode = typeof body?.mode === "string" ? body.mode : "assess";

  if (mode === "register") {
    const result = await registerPantavionPrivateUploadSessionContract(uploadRequest);

    return NextResponse.json({
      ok: true,
      mode,
      assessment: result.assessment,
      records: result.records
    });
  }

  const assessment = assessPantavionPrivateUploadSession(uploadRequest);

  await appendPantavionPrivateUploadSessionAudit({
    event: "private.upload.session.assessed",
    actor: uploadRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: uploadRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    mode,
    assessment
  });
}
