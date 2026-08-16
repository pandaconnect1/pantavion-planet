import { promises as fs } from "fs";
import path from "path";
import {
  assessPantavionPrivateUploadSession,
  type PantavionPrivateUploadSessionAssessment,
  type PantavionPrivateUploadSessionInput,
  type PantavionPrivateUploadSessionRecord
} from "./private-upload-session-contract";

export type PantavionPrivateUploadSessionAuditEvent = {
  event:
    | "private.upload.session.read"
    | "private.upload.session.assessed"
    | "private.upload.session.registered";
  actor: string;
  createdAt: string;
  request?: PantavionPrivateUploadSessionInput;
  assessment?: PantavionPrivateUploadSessionAssessment;
  records?: PantavionPrivateUploadSessionRecord[];
};

const dataDir = path.join(process.cwd(), "data", "kernel");
const stateFile = path.join(dataDir, "private-upload-session-contracts.json");
const auditFile = path.join(dataDir, "private-upload-session-audit.jsonl");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function appendPantavionPrivateUploadSessionAudit(
  event: PantavionPrivateUploadSessionAuditEvent
): Promise<void> {
  await ensureDataDir();
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export async function readPantavionPrivateUploadSessionRecords(): Promise<
  PantavionPrivateUploadSessionRecord[]
> {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(stateFile, "utf8");
    const parsed = JSON.parse(raw) as PantavionPrivateUploadSessionRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (code === "ENOENT") return [];
    throw error;
  }
}

export async function writePantavionPrivateUploadSessionRecords(
  records: PantavionPrivateUploadSessionRecord[]
): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(stateFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function registerPantavionPrivateUploadSessionContract(
  input: PantavionPrivateUploadSessionInput
): Promise<{
  assessment: PantavionPrivateUploadSessionAssessment;
  records: PantavionPrivateUploadSessionRecord[];
}> {
  const assessment = assessPantavionPrivateUploadSession(input);
  const actor = input.actor ?? "system:private-upload-session";
  const now = new Date().toISOString();

  let records = await readPantavionPrivateUploadSessionRecords();

  if (!assessment.canRegisterSessionContract || !assessment.filename) {
    await appendPantavionPrivateUploadSessionAudit({
      event: "private.upload.session.assessed",
      actor,
      createdAt: now,
      request: input,
      assessment,
      records
    });

    return { assessment, records };
  }

  const sessionId =
    assessment.sessionId ?? `upload_session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const artifactId =
    assessment.artifactId ?? `artifact_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const record: PantavionPrivateUploadSessionRecord = {
    id: `private_upload_record_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    sessionId,
    artifactId,
    filename: assessment.filename,
    extension: assessment.extension,
    artifactKind: assessment.artifactKind,
    sizeBytes: assessment.sizeBytes,
    strategy: assessment.strategy,
    status: "registered_pending_adapter",
    storageProvider: assessment.storageProvider,
    sourceTruth: assessment.sourceTruth,
    sensitive: assessment.sensitive,
    production: assessment.production,
    requestedSurface: assessment.requestedSurface,
    sha256: input.sha256,
    privateStorageOnly: true,
    noGitStorage: true,
    noPublicFolder: true,
    publicAccessAllowed: false,
    requiresMultipart: assessment.requiresMultipart,
    requiresResume: assessment.requiresResume,
    requiresRetry: assessment.requiresRetry,
    requiresSha256Finalize: true,
    uploadBytesAllowedNow: false,
    originalMutationAllowed: false,
    originalDwgMutationAllowed: false,
    createdAt: now,
    updatedAt: now,
    actor,
    reason: input.reason
  };

  records = [record, ...records.filter((entry) => entry.sessionId !== sessionId)];

  await writePantavionPrivateUploadSessionRecords(records);

  await appendPantavionPrivateUploadSessionAudit({
    event: "private.upload.session.registered",
    actor,
    createdAt: now,
    request: input,
    assessment,
    records
  });

  return { assessment, records };
}
