export type PantavionArtifactStorageProvider =
  | "local_metadata_only"
  | "vercel_blob_private"
  | "s3_private"
  | "cloudflare_r2_private"
  | "google_drive_import"
  | "onedrive_import"
  | "signed_url_import"
  | "unknown";

export type PantavionArtifactIntakeRuleId =
  | "dwg_original_source_truth_intake"
  | "cad_source_intake"
  | "gis_source_intake"
  | "geojson_derivative_intake"
  | "pdf_document_source_intake"
  | "zip_archive_bundle_intake"
  | "direct_private_upload_session"
  | "multipart_private_upload";

export type PantavionArtifactUploadStrategy =
  | "metadata_only"
  | "direct_private_upload_session"
  | "multipart_private_upload"
  | "external_import";

export type PantavionArtifactIntakeRule = {
  id: PantavionArtifactIntakeRuleId;
  label: string;
  extensions: string[];
  artifactClass:
    | "dwg_source_truth"
    | "cad_source"
    | "gis_source"
    | "geojson_derivative"
    | "pdf_document"
    | "zip_archive"
    | "upload_strategy";
  maxInlineSizeBytes: number;
  requiresFounderApproval: boolean;
  requiresPrivateStorage: boolean;
  requiresSha256: boolean;
  requiresSensitiveVaultCheck: boolean;
  requiresCadAdapterCheck: boolean;
  allowedForPrivateUploadSession: boolean;
  allowedForAutomaticPublicUse: false;
  notes: string[];
};

export type PantavionArtifactIntakeInput = {
  filename?: string;
  extension?: string;
  sizeBytes?: number;
  sha256?: string;
  storageProvider: PantavionArtifactStorageProvider;
  requestedSurface?: string;
  sourceTruth?: boolean;
  production?: boolean;
  founderApproved?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionArtifactIntakeAssessment = {
  ok: true;
  requestId: string;
  matchedRuleId: PantavionArtifactIntakeRuleId | null;
  artifactClass: PantavionArtifactIntakeRule["artifactClass"] | "unknown";
  extension: string | null;
  sizeBytes: number | null;
  storageProvider: PantavionArtifactStorageProvider;
  requestedSurface?: string;
  requiresFounderApproval: boolean;
  requiresPrivateStorage: boolean;
  requiresSha256: boolean;
  requiresSensitiveVaultCheck: boolean;
  requiresCadAdapterCheck: boolean;
  allowedForPrivateUploadSession: boolean;
  allowedForAutomaticPublicUse: false;
  storageProviderIsPrivate: boolean;
  sha256Provided: boolean;
  founderApproved: boolean;
  recommendedUploadStrategy: PantavionArtifactUploadStrategy;
  blocked: boolean;
  blockReasons: string[];
  notes: string[];
  assessedAt: string;
};

const PRIVATE_STORAGE_PROVIDERS: PantavionArtifactStorageProvider[] = [
  "vercel_blob_private",
  "s3_private",
  "cloudflare_r2_private"
];

const LARGE_ARTIFACT_THRESHOLD_BYTES = 4 * 1024 * 1024;

const normalize = (value: unknown): string => String(value || "").trim();

const normalizeLower = (value: unknown): string => normalize(value).toLowerCase();

const extractExtension = (input: PantavionArtifactIntakeInput): string | null => {
  const explicit = normalizeLower(input.extension).replace(/^\./, "");
  if (explicit.length > 0) {
    return explicit;
  }

  const filename = normalizeLower(input.filename);
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex > -1 && dotIndex < filename.length - 1) {
    return filename.slice(dotIndex + 1);
  }

  return null;
};

export const PANTAVION_ARTIFACT_INTAKE_RULES: PantavionArtifactIntakeRule[] = [
  {
    id: "dwg_original_source_truth_intake",
    label: "Original DWG source truth intake",
    extensions: ["dwg"],
    artifactClass: "dwg_source_truth",
    maxInlineSizeBytes: 0,
    requiresFounderApproval: true,
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresSensitiveVaultCheck: true,
    requiresCadAdapterCheck: true,
    allowedForPrivateUploadSession: true,
    allowedForAutomaticPublicUse: false,
    notes: [
      "Original DWG files are protected source truth and must never be committed to Git or served publicly.",
      "Requires private storage, SHA256 verification, vault check, CAD adapter check, and founder approval."
    ]
  },
  {
    id: "cad_source_intake",
    label: "CAD source intake",
    extensions: ["dxf", "dgn", "rvt", "ifc", "step", "stp", "iges", "igs"],
    artifactClass: "cad_source",
    maxInlineSizeBytes: 0,
    requiresFounderApproval: true,
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresSensitiveVaultCheck: true,
    requiresCadAdapterCheck: true,
    allowedForPrivateUploadSession: true,
    allowedForAutomaticPublicUse: false,
    notes: [
      "CAD source artifacts require private storage and a licensed CAD adapter before any render.",
      "Never present a CAD source artifact as an original DWG."
    ]
  },
  {
    id: "gis_source_intake",
    label: "GIS source intake",
    extensions: ["shp", "shx", "dbf", "gdb", "gpkg", "kml", "kmz", "gml"],
    artifactClass: "gis_source",
    maxInlineSizeBytes: 0,
    requiresFounderApproval: true,
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresSensitiveVaultCheck: true,
    requiresCadAdapterCheck: false,
    allowedForPrivateUploadSession: true,
    allowedForAutomaticPublicUse: false,
    notes: [
      "GIS source datasets require private storage and SHA256 verification.",
      "GIS source datasets are not derivatives and must not be auto-published."
    ]
  },
  {
    id: "geojson_derivative_intake",
    label: "GeoJSON derivative intake",
    extensions: ["geojson", "json", "topojson"],
    artifactClass: "geojson_derivative",
    maxInlineSizeBytes: LARGE_ARTIFACT_THRESHOLD_BYTES,
    requiresFounderApproval: false,
    requiresPrivateStorage: false,
    requiresSha256: false,
    requiresSensitiveVaultCheck: false,
    requiresCadAdapterCheck: false,
    allowedForPrivateUploadSession: true,
    allowedForAutomaticPublicUse: false,
    notes: [
      "GeoJSON derivatives must never be presented as the original DWG or as source truth.",
      "Large derivatives must still be stored privately rather than committed to Git."
    ]
  },
  {
    id: "pdf_document_source_intake",
    label: "PDF document source intake",
    extensions: ["pdf"],
    artifactClass: "pdf_document",
    maxInlineSizeBytes: LARGE_ARTIFACT_THRESHOLD_BYTES,
    requiresFounderApproval: false,
    requiresPrivateStorage: true,
    requiresSha256: false,
    requiresSensitiveVaultCheck: false,
    requiresCadAdapterCheck: false,
    allowedForPrivateUploadSession: true,
    allowedForAutomaticPublicUse: false,
    notes: [
      "PDF documents are derivatives and must never replace original DWG source truth.",
      "PDF documents must be stored privately and require founder approval if marked as source truth."
    ]
  },
  {
    id: "zip_archive_bundle_intake",
    label: "ZIP archive bundle intake",
    extensions: ["zip", "7z", "tar", "gz", "tgz", "rar"],
    artifactClass: "zip_archive",
    maxInlineSizeBytes: 0,
    requiresFounderApproval: true,
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresSensitiveVaultCheck: true,
    requiresCadAdapterCheck: false,
    allowedForPrivateUploadSession: true,
    allowedForAutomaticPublicUse: false,
    notes: [
      "Archive bundles may contain protected source truth and must be inspected before use.",
      "Archives require private storage, SHA256 verification, and a vault check."
    ]
  },
  {
    id: "direct_private_upload_session",
    label: "Direct private upload session strategy",
    extensions: [],
    artifactClass: "upload_strategy",
    maxInlineSizeBytes: LARGE_ARTIFACT_THRESHOLD_BYTES,
    requiresFounderApproval: false,
    requiresPrivateStorage: true,
    requiresSha256: false,
    requiresSensitiveVaultCheck: false,
    requiresCadAdapterCheck: false,
    allowedForPrivateUploadSession: true,
    allowedForAutomaticPublicUse: false,
    notes: [
      "Direct private upload sessions are used for artifacts below the multipart threshold.",
      "Bytes are written only to a configured private storage adapter, never to Git or public folders."
    ]
  },
  {
    id: "multipart_private_upload",
    label: "Multipart private upload strategy",
    extensions: [],
    artifactClass: "upload_strategy",
    maxInlineSizeBytes: 0,
    requiresFounderApproval: false,
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresSensitiveVaultCheck: false,
    requiresCadAdapterCheck: false,
    allowedForPrivateUploadSession: true,
    allowedForAutomaticPublicUse: false,
    notes: [
      "Multipart private uploads are required for large artifacts above the inline threshold.",
      "Multipart uploads require SHA256 verification and a configured private storage adapter."
    ]
  }
];

export function listPantavionArtifactIntakeRules(): PantavionArtifactIntakeRule[] {
  return PANTAVION_ARTIFACT_INTAKE_RULES.map((rule) => ({
    ...rule,
    extensions: [...rule.extensions],
    notes: [...rule.notes]
  }));
}

const matchRuleByExtension = (
  extension: string | null
): PantavionArtifactIntakeRule | null => {
  if (!extension) {
    return null;
  }

  return (
    PANTAVION_ARTIFACT_INTAKE_RULES.find(
      (rule) =>
        rule.artifactClass !== "upload_strategy" &&
        rule.extensions.includes(extension)
    ) ?? null
  );
};

export function assessPantavionArtifactIntake(
  input: PantavionArtifactIntakeInput
): PantavionArtifactIntakeAssessment {
  const extension = extractExtension(input);
  const sizeBytes =
    typeof input.sizeBytes === "number" && Number.isFinite(input.sizeBytes)
      ? input.sizeBytes
      : null;
  const storageProvider = input.storageProvider;
  const requestedSurface = normalize(input.requestedSurface);
  const sourceTruth = Boolean(input.sourceTruth);
  const production = Boolean(input.production);
  const founderApproved = Boolean(input.founderApproved);
  const sha256Provided = normalize(input.sha256).length > 0;

  const matchedRule = matchRuleByExtension(extension);

  const storageProviderIsPrivate = PRIVATE_STORAGE_PROVIDERS.includes(storageProvider);

  const requiresFounderApproval = matchedRule?.requiresFounderApproval ?? sourceTruth;
  const requiresPrivateStorage = matchedRule?.requiresPrivateStorage ?? true;
  const requiresSha256 = matchedRule?.requiresSha256 ?? sourceTruth;
  const requiresSensitiveVaultCheck = matchedRule?.requiresSensitiveVaultCheck ?? sourceTruth;
  const requiresCadAdapterCheck = matchedRule?.requiresCadAdapterCheck ?? false;
  const allowedForPrivateUploadSession = matchedRule?.allowedForPrivateUploadSession ?? true;

  const notes: string[] = matchedRule ? [...matchedRule.notes] : [];
  const blockReasons: string[] = [];

  if (!matchedRule) {
    notes.push(
      "No specific intake rule matched. Treating artifact conservatively as private, non-public."
    );
  }

  if (requiresPrivateStorage && !storageProviderIsPrivate) {
    if (
      storageProvider === "local_metadata_only" ||
      storageProvider === "unknown"
    ) {
      blockReasons.push(
        "Artifact requires a configured private storage provider before bytes can be uploaded."
      );
    }
  }

  if (requiresFounderApproval && !founderApproved) {
    blockReasons.push("Artifact requires founder approval before intake.");
  }

  if (requiresSha256 && !sha256Provided && production) {
    blockReasons.push("Artifact requires a SHA256 hash for verification in production.");
  }

  const isLarge =
    sizeBytes !== null &&
    matchedRule !== null &&
    matchedRule.maxInlineSizeBytes >= 0 &&
    sizeBytes > matchedRule.maxInlineSizeBytes;

  let recommendedUploadStrategy: PantavionArtifactUploadStrategy;
  if (
    storageProvider === "google_drive_import" ||
    storageProvider === "onedrive_import" ||
    storageProvider === "signed_url_import"
  ) {
    recommendedUploadStrategy = "external_import";
  } else if (!storageProviderIsPrivate) {
    recommendedUploadStrategy = "metadata_only";
  } else if (isLarge || (matchedRule && matchedRule.maxInlineSizeBytes === 0)) {
    recommendedUploadStrategy = "multipart_private_upload";
  } else {
    recommendedUploadStrategy = "direct_private_upload_session";
  }

  const blocked = blockReasons.length > 0;

  return {
    ok: true,
    requestId: `artifact_intake_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    matchedRuleId: matchedRule?.id ?? null,
    artifactClass: matchedRule?.artifactClass ?? "unknown",
    extension,
    sizeBytes,
    storageProvider,
    requestedSurface: requestedSurface || undefined,
    requiresFounderApproval,
    requiresPrivateStorage,
    requiresSha256,
    requiresSensitiveVaultCheck,
    requiresCadAdapterCheck,
    allowedForPrivateUploadSession,
    allowedForAutomaticPublicUse: false,
    storageProviderIsPrivate,
    sha256Provided,
    founderApproved,
    recommendedUploadStrategy,
    blocked,
    blockReasons,
    notes,
    assessedAt: new Date().toISOString()
  };
}
