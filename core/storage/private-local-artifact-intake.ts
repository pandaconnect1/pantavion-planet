import { createHash, randomUUID } from "crypto";
import { createReadStream, createWriteStream, promises as fs } from "fs";
import path from "path";
import { pipeline } from "stream/promises";

export type PantavionPrivateLocalArtifactKind =
  | "dwg"
  | "dxf"
  | "dgn"
  | "kml"
  | "kmz"
  | "shp"
  | "gpkg"
  | "geojson"
  | "pdf"
  | "zip"
  | "xlsx"
  | "xls"
  | "csv"
  | "docx"
  | "doc"
  | "image"
  | "json"
  | "unknown";

export type PantavionPrivateLocalArtifactStatus =
  | "ready_to_ingest"
  | "requires_founder_approval"
  | "requires_sha256"
  | "blocked"
  | "sha256_mismatch"
  | "ingested";

export type PantavionPrivateLocalArtifactInput = {
  sourcePath?: string;
  artifactId?: string;
  filename?: string;
  expectedSha256?: string;
  sourceTruth?: boolean;
  sensitive?: boolean;
  production?: boolean;
  requestedSurface?: "B" | "C" | string;
  founderApproved?: boolean;
  publicAccessRequested?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionPrivateLocalArtifactAssessment = {
  ok: true;
  requestId: string;
  sourcePath?: string;
  artifactId?: string;
  filename?: string;
  extension: string;
  artifactKind: PantavionPrivateLocalArtifactKind;
  sizeBytes: number;
  status: PantavionPrivateLocalArtifactStatus;
  requestedSurface: "B" | "C" | "unknown";
  sourceTruth: boolean;
  sensitive: boolean;
  production: boolean;
  requiresFounderApproval: boolean;
  requiresSha256: boolean;
  requiresAudit: true;
  privateStorageOnly: true;
  noGitStorage: true;
  noPublicFolder: true;
  publicAccessAllowed: false;
  originalMutationAllowed: false;
  originalDwgMutationAllowed: false;
  sidecarOnlyForProcessing: true;
  canIngestNow: boolean;
  actualSha256?: string;
  destinationRelativePath?: string;
  blocked: boolean;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

export type PantavionPrivateLocalArtifactRecord = {
  id: string;
  artifactId: string;
  filename: string;
  extension: string;
  artifactKind: PantavionPrivateLocalArtifactKind;
  sizeBytes: number;
  sha256: string;
  sourceTruth: boolean;
  sensitive: boolean;
  production: boolean;
  requestedSurface: "B" | "C" | "unknown";
  originalSourcePath: string;
  destinationRelativePath: string;
  privateStorageOnly: true;
  noGitStorage: true;
  noPublicFolder: true;
  publicAccessAllowed: false;
  originalMutationAllowed: false;
  originalDwgMutationAllowed: false;
  createdAt: string;
  updatedAt: string;
  actor?: string;
  reason?: string;
};

export type PantavionPrivateLocalArtifactAuditEvent = {
  event:
    | "private.local.artifact.intake.read"
    | "private.local.artifact.intake.assessed"
    | "private.local.artifact.intake.ingested"
    | "private.local.artifact.intake.failed";
  actor: string;
  createdAt: string;
  request?: PantavionPrivateLocalArtifactInput;
  assessment?: PantavionPrivateLocalArtifactAssessment;
  records?: PantavionPrivateLocalArtifactRecord[];
  error?: string;
};

const dataDir = path.join(process.cwd(), "data", "kernel");
const artifactRootRelative = "data/private-artifacts/originals";
const artifactRoot = path.join(process.cwd(), ...artifactRootRelative.split("/"));
const stateFile = path.join(dataDir, "private-local-artifact-intake-state.json");
const auditFile = path.join(dataDir, "private-local-artifact-intake-audit.jsonl");

const supportedExtensions: Record<PantavionPrivateLocalArtifactKind, string[]> = {
  dwg: ["dwg"],
  dxf: ["dxf"],
  dgn: ["dgn"],
  kml: ["kml"],
  kmz: ["kmz"],
  shp: ["shp"],
  gpkg: ["gpkg"],
  geojson: ["geojson"],
  pdf: ["pdf"],
  zip: ["zip"],
  xlsx: ["xlsx", "xlsm"],
  xls: ["xls"],
  csv: ["csv"],
  docx: ["docx"],
  doc: ["doc"],
  image: ["png", "jpg", "jpeg", "tif", "tiff", "webp"],
  json: ["json"],
  unknown: []
};

function text(value: unknown): string {
  return String(value || "").trim();
}

function lower(value: unknown): string {
  return text(value).toLowerCase();
}

function extensionFromFilename(filename: string): string {
  const parts = filename.split("?")[0].split(".");
  return parts.length > 1 ? lower(parts[parts.length - 1]) : "";
}

function normalizeSurface(value: unknown): "B" | "C" | "unknown" {
  const raw = text(value).toUpperCase();
  if (raw === "B") return "B";
  if (raw === "C") return "C";
  return "unknown";
}

function safeFileName(filename: string): string {
  return filename.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").slice(0, 180);
}

export function getPantavionPrivateLocalArtifactKind(
  extension: string
): PantavionPrivateLocalArtifactKind {
  const ext = lower(extension);

  for (const kind of Object.keys(supportedExtensions) as PantavionPrivateLocalArtifactKind[]) {
    if (supportedExtensions[kind].includes(ext)) {
      return kind;
    }
  }

  return "unknown";
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(artifactRoot, { recursive: true });
}

export async function appendPantavionPrivateLocalArtifactAudit(
  event: PantavionPrivateLocalArtifactAuditEvent
): Promise<void> {
  await ensureDirs();
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export async function readPantavionPrivateLocalArtifactRecords(): Promise<
  PantavionPrivateLocalArtifactRecord[]
> {
  await ensureDirs();

  try {
    const raw = await fs.readFile(stateFile, "utf8");
    const parsed = JSON.parse(raw) as PantavionPrivateLocalArtifactRecord[];
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

export async function writePantavionPrivateLocalArtifactRecords(
  records: PantavionPrivateLocalArtifactRecord[]
): Promise<void> {
  await ensureDirs();
  await fs.writeFile(stateFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

async function fileSha256Copy(sourcePath: string, destinationPath: string): Promise<string> {
  const hash = createHash("sha256");
  const input = createReadStream(sourcePath);
  input.on("data", (chunk) => hash.update(chunk));
  await pipeline(input, createWriteStream(destinationPath, { flags: "wx" }));
  return hash.digest("hex");
}

export async function assessPantavionPrivateLocalArtifactIntake(
  input: PantavionPrivateLocalArtifactInput
): Promise<PantavionPrivateLocalArtifactAssessment> {
  const sourcePath = text(input.sourcePath);
  const resolvedSourcePath = sourcePath ? path.resolve(sourcePath) : "";
  const filename = safeFileName(text(input.filename) || path.basename(resolvedSourcePath || "artifact"));
  const extension = extensionFromFilename(filename || resolvedSourcePath);
  const artifactKind = getPantavionPrivateLocalArtifactKind(extension);
  const requestedSurface = normalizeSurface(input.requestedSurface ?? "unknown");

  let sizeBytes = 0;
  let fileExists = false;
  let isFile = false;

  if (resolvedSourcePath) {
    try {
      const stat = await fs.stat(resolvedSourcePath);
      fileExists = true;
      isFile = stat.isFile();
      sizeBytes = stat.size;
    } catch {
      fileExists = false;
    }
  }

  const isCad = artifactKind === "dwg" || artifactKind === "dxf" || artifactKind === "dgn";
  const sourceTruth = Boolean(input.sourceTruth) || isCad;
  const sensitive = Boolean(input.sensitive) || sourceTruth;
  const production = Boolean(input.production);
  const requiresFounderApproval = sourceTruth || sensitive || production || isCad;
  const requiresSha256 = sourceTruth || isCad || sizeBytes > 100 * 1024 * 1024;
  const expectedSha256 = lower(input.expectedSha256);
  const shaLooksValid = /^[a-f0-9]{64}$/.test(expectedSha256);

  const blocked =
    sourcePath.length === 0 ||
    !fileExists ||
    !isFile ||
    artifactKind === "unknown" ||
    Boolean(input.publicAccessRequested);

  let status: PantavionPrivateLocalArtifactStatus = "ready_to_ingest";

  if (blocked) {
    status = "blocked";
  } else if (requiresFounderApproval && !input.founderApproved) {
    status = "requires_founder_approval";
  } else if (requiresSha256 && !shaLooksValid) {
    status = "requires_sha256";
  }

  const canIngestNow =
    !blocked &&
    status === "ready_to_ingest" &&
    (!requiresFounderApproval || Boolean(input.founderApproved)) &&
    (!requiresSha256 || shaLooksValid);

  const notes = [
    "This is real local private artifact intake. It streams a local/USB file into Pantavion private storage.",
    "Files are never committed to Git and never placed in public folders.",
    "Original DWG/source truth is immutable and never mutated.",
    "Source-truth/CAD artifacts require founder approval and SHA256 verification.",
    "B/C requested surface is stored as metadata for downstream DWG binding."
  ];

  if (!fileExists) notes.push("Source file does not exist.");
  if (fileExists && !isFile) notes.push("Source path is not a file.");
  if (artifactKind === "unknown") notes.push("Unsupported extension.");
  if (Boolean(input.publicAccessRequested)) notes.push("Public access is blocked.");

  return {
    ok: true,
    requestId: `private_local_intake_${Date.now()}_${randomUUID().slice(0, 8)}`,
    sourcePath: resolvedSourcePath || undefined,
    artifactId: text(input.artifactId) || undefined,
    filename: filename || undefined,
    extension,
    artifactKind,
    sizeBytes,
    status,
    requestedSurface,
    sourceTruth,
    sensitive,
    production,
    requiresFounderApproval,
    requiresSha256,
    requiresAudit: true,
    privateStorageOnly: true,
    noGitStorage: true,
    noPublicFolder: true,
    publicAccessAllowed: false,
    originalMutationAllowed: false,
    originalDwgMutationAllowed: false,
    sidecarOnlyForProcessing: true,
    canIngestNow,
    blocked,
    notes,
    auditTags: [
      "private_local_artifact_intake",
      artifactKind,
      status,
      requestedSurface,
      sourceTruth ? "source_truth" : "non_source_truth",
      "private_storage_only",
      "no_git_storage",
      "no_public_folder",
      "no_original_dwg_mutation"
    ],
    assessedAt: new Date().toISOString()
  };
}

export async function ingestPantavionPrivateLocalArtifact(
  input: PantavionPrivateLocalArtifactInput
): Promise<{
  assessment: PantavionPrivateLocalArtifactAssessment;
  records: PantavionPrivateLocalArtifactRecord[];
}> {
  const actor = input.actor ?? "system:private-local-artifact-intake";
  const now = new Date().toISOString();
  const assessment = await assessPantavionPrivateLocalArtifactIntake(input);
  let records = await readPantavionPrivateLocalArtifactRecords();

  if (!assessment.canIngestNow || !assessment.sourcePath || !assessment.filename) {
    await appendPantavionPrivateLocalArtifactAudit({
      event: "private.local.artifact.intake.assessed",
      actor,
      createdAt: now,
      request: input,
      assessment,
      records
    });

    return { assessment, records };
  }

  const artifactId =
    assessment.artifactId ?? `artifact_${Date.now()}_${randomUUID().slice(0, 8)}`;

  const artifactDir = path.join(artifactRoot, artifactId);
  await fs.mkdir(artifactDir, { recursive: true });

  const destinationPath = path.join(artifactDir, assessment.filename);
  const destinationRelativePath = path.relative(process.cwd(), destinationPath).replace(/\\/g, "/");

  try {
    const actualSha256 = await fileSha256Copy(assessment.sourcePath, destinationPath);
    const expectedSha256 = lower(input.expectedSha256);

    if (expectedSha256 && expectedSha256 !== actualSha256) {
      await fs.unlink(destinationPath).catch(() => undefined);

      const failedAssessment: PantavionPrivateLocalArtifactAssessment = {
        ...assessment,
        status: "sha256_mismatch",
        actualSha256,
        destinationRelativePath,
        canIngestNow: false,
        blocked: true,
        notes: [
          ...assessment.notes,
          "SHA256 mismatch. Copied file was removed and the artifact was not registered."
        ]
      };

      await appendPantavionPrivateLocalArtifactAudit({
        event: "private.local.artifact.intake.failed",
        actor,
        createdAt: now,
        request: input,
        assessment: failedAssessment,
        records,
        error: "SHA256 mismatch"
      });

      return { assessment: failedAssessment, records };
    }

    const record: PantavionPrivateLocalArtifactRecord = {
      id: `private_local_artifact_${Date.now()}_${randomUUID().slice(0, 8)}`,
      artifactId,
      filename: assessment.filename,
      extension: assessment.extension,
      artifactKind: assessment.artifactKind,
      sizeBytes: assessment.sizeBytes,
      sha256: actualSha256,
      sourceTruth: assessment.sourceTruth,
      sensitive: assessment.sensitive,
      production: assessment.production,
      requestedSurface: assessment.requestedSurface,
      originalSourcePath: assessment.sourcePath,
      destinationRelativePath,
      privateStorageOnly: true,
      noGitStorage: true,
      noPublicFolder: true,
      publicAccessAllowed: false,
      originalMutationAllowed: false,
      originalDwgMutationAllowed: false,
      createdAt: now,
      updatedAt: now,
      actor,
      reason: input.reason
    };

    records = [record, ...records.filter((entry) => entry.artifactId !== artifactId)];
    await writePantavionPrivateLocalArtifactRecords(records);

    const ingestedAssessment: PantavionPrivateLocalArtifactAssessment = {
      ...assessment,
      artifactId,
      status: "ingested",
      actualSha256,
      destinationRelativePath,
      canIngestNow: false
    };

    await appendPantavionPrivateLocalArtifactAudit({
      event: "private.local.artifact.intake.ingested",
      actor,
      createdAt: now,
      request: input,
      assessment: ingestedAssessment,
      records
    });

    return { assessment: ingestedAssessment, records };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await appendPantavionPrivateLocalArtifactAudit({
      event: "private.local.artifact.intake.failed",
      actor,
      createdAt: now,
      request: input,
      assessment,
      records,
      error: message
    });

    throw error;
  }
}

