export type PantavionPrivateUploadArtifactKind =
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

export type PantavionPrivateUploadStorageProvider =
  | "vercel_blob_private"
  | "s3_private"
  | "azure_blob_private"
  | "gcs_private"
  | "local_dev_private"
  | "unknown";

export type PantavionPrivateUploadStrategy =
  | "single_private_upload"
  | "multipart_private_upload"
  | "chunked_resumable_upload"
  | "blocked";

export type PantavionPrivateUploadStatus =
  | "ready_to_register"
  | "requires_storage_provider"
  | "requires_private_storage_adapter"
  | "requires_founder_approval"
  | "requires_sha256"
  | "registered_pending_adapter"
  | "blocked";

export type PantavionPrivateUploadRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionPrivateUploadSessionInput = {
  sessionId?: string;
  artifactId?: string;
  filename?: string;
  extension?: string;
  sizeBytes?: number;
  sha256?: string;
  sourceTruth?: boolean;
  sensitive?: boolean;
  production?: boolean;
  requestedSurface?: "B" | "C" | string;
  storageProvider?: PantavionPrivateUploadStorageProvider | string;
  providerConfigured?: boolean;
  founderApproved?: boolean;
  publicAccessRequested?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionPrivateUploadSessionAssessment = {
  ok: true;
  requestId: string;
  sessionId?: string;
  artifactId?: string;
  filename?: string;
  extension: string;
  artifactKind: PantavionPrivateUploadArtifactKind;
  sizeBytes: number;
  strategy: PantavionPrivateUploadStrategy;
  status: PantavionPrivateUploadStatus;
  riskZone: PantavionPrivateUploadRiskZone;
  storageProvider: PantavionPrivateUploadStorageProvider;
  sourceTruth: boolean;
  sensitive: boolean;
  production: boolean;
  requestedSurface: "B" | "C" | "unknown";
  privateStorageOnly: true;
  noGitStorage: true;
  noPublicFolder: true;
  publicAccessAllowed: false;
  requiresPrivateStorageAdapter: true;
  requiresMultipart: boolean;
  requiresResume: boolean;
  requiresRetry: boolean;
  requiresSha256: boolean;
  requiresSha256Finalize: true;
  requiresFounderApproval: boolean;
  requiresAudit: true;
  requiresFinalizationRoute: true;
  uploadBytesAllowedNow: false;
  originalMutationAllowed: false;
  originalDwgMutationAllowed: false;
  sidecarOnlyForProcessing: true;
  recommendedChunkSizeBytes: number;
  estimatedChunks: number;
  canRegisterSessionContract: boolean;
  canUploadBytesNow: false;
  blocked: boolean;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

export type PantavionPrivateUploadSessionRecord = {
  id: string;
  sessionId: string;
  artifactId: string;
  filename: string;
  extension: string;
  artifactKind: PantavionPrivateUploadArtifactKind;
  sizeBytes: number;
  strategy: PantavionPrivateUploadStrategy;
  status: "registered_pending_adapter";
  storageProvider: PantavionPrivateUploadStorageProvider;
  sourceTruth: boolean;
  sensitive: boolean;
  production: boolean;
  requestedSurface: "B" | "C" | "unknown";
  sha256?: string;
  privateStorageOnly: true;
  noGitStorage: true;
  noPublicFolder: true;
  publicAccessAllowed: false;
  requiresMultipart: boolean;
  requiresResume: boolean;
  requiresRetry: boolean;
  requiresSha256Finalize: true;
  uploadBytesAllowedNow: false;
  originalMutationAllowed: false;
  originalDwgMutationAllowed: false;
  createdAt: string;
  updatedAt: string;
  actor?: string;
  reason?: string;
};

type UploadPolicy = {
  extensions: string[];
  riskZone: PantavionPrivateUploadRiskZone;
  sourceTruthByDefault: boolean;
};

export const PANTAVION_PRIVATE_UPLOAD_SUPPORTED_EXTENSIONS: Record<
  PantavionPrivateUploadArtifactKind,
  UploadPolicy
> = {
  dwg: { extensions: ["dwg"], riskZone: "Z4", sourceTruthByDefault: true },
  dxf: { extensions: ["dxf"], riskZone: "Z4", sourceTruthByDefault: true },
  dgn: { extensions: ["dgn"], riskZone: "Z4", sourceTruthByDefault: true },
  kml: { extensions: ["kml"], riskZone: "Z3", sourceTruthByDefault: false },
  kmz: { extensions: ["kmz"], riskZone: "Z3", sourceTruthByDefault: false },
  shp: { extensions: ["shp"], riskZone: "Z3", sourceTruthByDefault: false },
  gpkg: { extensions: ["gpkg"], riskZone: "Z3", sourceTruthByDefault: false },
  geojson: { extensions: ["geojson"], riskZone: "Z2", sourceTruthByDefault: false },
  pdf: { extensions: ["pdf"], riskZone: "Z2", sourceTruthByDefault: false },
  zip: { extensions: ["zip"], riskZone: "Z3", sourceTruthByDefault: false },
  xlsx: { extensions: ["xlsx", "xlsm"], riskZone: "Z2", sourceTruthByDefault: false },
  xls: { extensions: ["xls"], riskZone: "Z2", sourceTruthByDefault: false },
  csv: { extensions: ["csv"], riskZone: "Z1", sourceTruthByDefault: false },
  docx: { extensions: ["docx"], riskZone: "Z2", sourceTruthByDefault: false },
  doc: { extensions: ["doc"], riskZone: "Z2", sourceTruthByDefault: false },
  image: { extensions: ["png", "jpg", "jpeg", "tif", "tiff", "webp"], riskZone: "Z3", sourceTruthByDefault: false },
  json: { extensions: ["json"], riskZone: "Z2", sourceTruthByDefault: false },
  unknown: { extensions: [], riskZone: "Z4", sourceTruthByDefault: true }
};

const MAX_SINGLE_UPLOAD_BYTES = 100 * 1024 * 1024;
const ONE_GB = 1024 * 1024 * 1024;

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

function normalizeProvider(value: unknown): PantavionPrivateUploadStorageProvider {
  const raw = text(value);
  const allowed: PantavionPrivateUploadStorageProvider[] = [
    "vercel_blob_private",
    "s3_private",
    "azure_blob_private",
    "gcs_private",
    "local_dev_private",
    "unknown"
  ];
  return allowed.includes(raw as PantavionPrivateUploadStorageProvider)
    ? (raw as PantavionPrivateUploadStorageProvider)
    : "unknown";
}

function normalizeSurface(value: unknown): "B" | "C" | "unknown" {
  const raw = text(value).toUpperCase();
  if (raw === "B") return "B";
  if (raw === "C") return "C";
  return "unknown";
}

export function getPantavionPrivateUploadArtifactKind(
  extension: string
): PantavionPrivateUploadArtifactKind {
  const ext = lower(extension);

  for (const kind of Object.keys(
    PANTAVION_PRIVATE_UPLOAD_SUPPORTED_EXTENSIONS
  ) as PantavionPrivateUploadArtifactKind[]) {
    if (PANTAVION_PRIVATE_UPLOAD_SUPPORTED_EXTENSIONS[kind].extensions.includes(ext)) {
      return kind;
    }
  }

  return "unknown";
}

function chunkSize(sizeBytes: number): number {
  if (sizeBytes <= MAX_SINGLE_UPLOAD_BYTES) return sizeBytes || MAX_SINGLE_UPLOAD_BYTES;
  if (sizeBytes <= ONE_GB) return 32 * 1024 * 1024;
  return 64 * 1024 * 1024;
}

export function assessPantavionPrivateUploadSession(
  input: PantavionPrivateUploadSessionInput
): PantavionPrivateUploadSessionAssessment {
  const filename = text(input.filename);
  const extension = lower(input.extension || extensionFromFilename(filename));
  const artifactKind = getPantavionPrivateUploadArtifactKind(extension);
  const policy = PANTAVION_PRIVATE_UPLOAD_SUPPORTED_EXTENSIONS[artifactKind];
  const sizeBytes =
    typeof input.sizeBytes === "number" && Number.isFinite(input.sizeBytes) && input.sizeBytes > 0
      ? input.sizeBytes
      : 0;

  const storageProvider = normalizeProvider(input.storageProvider ?? "unknown");
  const requestedSurface = normalizeSurface(input.requestedSurface ?? "unknown");
  const sourceTruth = Boolean(input.sourceTruth) || policy.sourceTruthByDefault;
  const sensitive = Boolean(input.sensitive) || sourceTruth;
  const production = Boolean(input.production);
  const requiresMultipart = sizeBytes > MAX_SINGLE_UPLOAD_BYTES;
  const recommendedChunkSizeBytes = chunkSize(sizeBytes);
  const estimatedChunks = sizeBytes > 0 ? Math.max(1, Math.ceil(sizeBytes / recommendedChunkSizeBytes)) : 0;

  const requiresSha256 =
    sourceTruth || sensitive || production || requiresMultipart || ["dwg", "dxf", "dgn"].includes(artifactKind);

  const requiresFounderApproval =
    sourceTruth || sensitive || production || ["dwg", "dxf", "dgn", "zip"].includes(artifactKind);

  const blocked =
    artifactKind === "unknown" ||
    filename.length === 0 ||
    sizeBytes <= 0 ||
    Boolean(input.publicAccessRequested);

  let strategy: PantavionPrivateUploadStrategy = "single_private_upload";
  if (blocked) strategy = "blocked";
  else if (requiresMultipart && sizeBytes > ONE_GB) strategy = "chunked_resumable_upload";
  else if (requiresMultipart) strategy = "multipart_private_upload";

  let status: PantavionPrivateUploadStatus = "ready_to_register";
  if (blocked) status = "blocked";
  else if (requiresFounderApproval && !input.founderApproved) status = "requires_founder_approval";
  else if (requiresSha256 && text(input.sha256).length === 0) status = "requires_sha256";
  else if (storageProvider === "unknown") status = "requires_storage_provider";
  else if (!input.providerConfigured) status = "requires_private_storage_adapter";

  const canRegisterSessionContract =
    !blocked &&
    filename.length > 0 &&
    sizeBytes > 0 &&
    storageProvider !== "unknown" &&
    (!requiresFounderApproval || Boolean(input.founderApproved)) &&
    (!requiresSha256 || text(input.sha256).length > 0);

  const notes = [
    "This patch creates upload session contracts only. It does not upload bytes yet.",
    "Private storage only. No Git storage. No public folder. No public access.",
    "Original DWG/source truth is immutable and never mutated.",
    "Large files require multipart/chunked upload, resume, retry and finalize verification in later patches.",
    "Processing is sidecar-only through approved workers."
  ];

  return {
    ok: true,
    requestId: `private_upload_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    sessionId: text(input.sessionId) || undefined,
    artifactId: text(input.artifactId) || undefined,
    filename: filename || undefined,
    extension,
    artifactKind,
    sizeBytes,
    strategy,
    status,
    riskZone: policy.riskZone,
    storageProvider,
    sourceTruth,
    sensitive,
    production,
    requestedSurface,
    privateStorageOnly: true,
    noGitStorage: true,
    noPublicFolder: true,
    publicAccessAllowed: false,
    requiresPrivateStorageAdapter: true,
    requiresMultipart,
    requiresResume: requiresMultipart,
    requiresRetry: requiresMultipart,
    requiresSha256,
    requiresSha256Finalize: true,
    requiresFounderApproval,
    requiresAudit: true,
    requiresFinalizationRoute: true,
    uploadBytesAllowedNow: false,
    originalMutationAllowed: false,
    originalDwgMutationAllowed: false,
    sidecarOnlyForProcessing: true,
    recommendedChunkSizeBytes,
    estimatedChunks,
    canRegisterSessionContract,
    canUploadBytesNow: false,
    blocked,
    notes,
    auditTags: [
      "private_upload_session",
      artifactKind,
      strategy,
      status,
      policy.riskZone,
      storageProvider,
      "private_storage_only",
      "no_git_storage",
      "no_public_folder",
      "no_original_dwg_mutation",
      "upload_bytes_disabled_until_adapter"
    ],
    assessedAt: new Date().toISOString()
  };
}
