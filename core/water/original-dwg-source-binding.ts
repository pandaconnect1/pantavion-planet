export type PantavionOriginalDwgBindingStatus =
  | "registered"
  | "metadata_only"
  | "verified"
  | "mismatch"
  | "requires_license_adapter"
  | "blocked";

export type PantavionOriginalDwgSurface = "B" | "C";

export type PantavionOriginalDwgSourceBinding = {
  id: string;
  filename: string;
  expectedSizeBytes: number;
  expectedSha256: string;
  artifactClass: "dwg_source_truth";
  sourceTruth: true;
  readOnly: true;
  immutable: true;
  allowedSurfaces: PantavionOriginalDwgSurface[];
  status: PantavionOriginalDwgBindingStatus;
  requiresFounderApproval: true;
  requiresSensitiveVaultCheck: true;
  requiresCadViewerAdapter: true;
  requiresLicenseAdapter: true;
  allowedAsOriginalOnlyThroughAdapter: true;
  derivativeMayReplaceOriginal: false;
  notes: string[];
  auditTags: string[];
};

export type PantavionOriginalDwgBindingInput = {
  observedFilename?: string;
  observedSizeBytes?: number;
  observedSha256?: string;
  requestedSurface?: string;
  founderApproved?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionOriginalDwgBindingAssessment = {
  ok: true;
  requestId: string;
  bindingId: string;
  filename: string;
  expectedSizeBytes: number;
  expectedSha256: string;
  observedFilename?: string;
  observedSizeBytes?: number;
  observedSha256?: string;
  requestedSurface?: string;
  status: PantavionOriginalDwgBindingStatus;
  filenameMatches: boolean | null;
  sizeMatches: boolean | null;
  sha256Matches: boolean | null;
  identityVerified: boolean;
  requiresFounderApproval: true;
  requiresSensitiveVaultCheck: true;
  requiresCadViewerAdapter: true;
  requiresLicenseAdapter: true;
  allowedForMetadataBinding: boolean;
  allowedForOriginalViewerRequest: boolean;
  allowedForAutomaticRender: false;
  blocked: boolean;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

const normalize = (value: unknown): string => String(value || "").trim();

const normalizeLower = (value: unknown): string => normalize(value).toLowerCase();

export const PANTAVION_ORIGINAL_DWG_SOURCE_BINDING: PantavionOriginalDwgSourceBinding = {
  id: "water_master_b_c_original_dwg",
  filename: "GEORGE_MAP_MASTER_B_C_FINAL.dwg",
  expectedSizeBytes: 205877448,
  expectedSha256: "0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9",
  artifactClass: "dwg_source_truth",
  sourceTruth: true,
  readOnly: true,
  immutable: true,
  allowedSurfaces: ["B", "C"],
  status: "requires_license_adapter",
  requiresFounderApproval: true,
  requiresSensitiveVaultCheck: true,
  requiresCadViewerAdapter: true,
  requiresLicenseAdapter: true,
  allowedAsOriginalOnlyThroughAdapter: true,
  derivativeMayReplaceOriginal: false,
  notes: [
    "This binding registers the original Pantavion Water master DWG as protected source truth.",
    "The original DWG must remain read-only and immutable.",
    "No conversion, PDF, image, screenshot, GeoJSON, Leaflet reconstruction, sampling, simplification, filtering, or derivative may be presented as the original.",
    "B and C surfaces may request the original only through a real licensed CAD/DWG viewer adapter."
  ],
  auditTags: [
    "water",
    "dwg",
    "original",
    "source_truth",
    "b_surface",
    "c_surface",
    "read_only",
    "requires_license_adapter",
    "founder_approval"
  ]
};

export function getPantavionOriginalDwgSourceBinding(): PantavionOriginalDwgSourceBinding {
  return {
    ...PANTAVION_ORIGINAL_DWG_SOURCE_BINDING,
    allowedSurfaces: [...PANTAVION_ORIGINAL_DWG_SOURCE_BINDING.allowedSurfaces],
    notes: [...PANTAVION_ORIGINAL_DWG_SOURCE_BINDING.notes],
    auditTags: [...PANTAVION_ORIGINAL_DWG_SOURCE_BINDING.auditTags]
  };
}

export function assessPantavionOriginalDwgSourceBinding(
  input: PantavionOriginalDwgBindingInput
): PantavionOriginalDwgBindingAssessment {
  const binding = PANTAVION_ORIGINAL_DWG_SOURCE_BINDING;

  const observedFilename = normalize(input.observedFilename);
  const observedSha256 = normalizeLower(input.observedSha256);
  const requestedSurface = normalize(input.requestedSurface);

  const filenameMatches =
    observedFilename.length > 0 ? observedFilename === binding.filename : null;

  const sizeMatches =
    typeof input.observedSizeBytes === "number"
      ? input.observedSizeBytes === binding.expectedSizeBytes
      : null;

  const sha256Matches =
    observedSha256.length > 0 ? observedSha256 === binding.expectedSha256 : null;

  const hasObservedIdentity =
    filenameMatches !== null || sizeMatches !== null || sha256Matches !== null;

  const anyMismatch =
    filenameMatches === false || sizeMatches === false || sha256Matches === false;

  const identityVerified =
    filenameMatches === true && sizeMatches === true && sha256Matches === true;

  const surfaceAllowed =
    requestedSurface.length === 0 ||
    binding.allowedSurfaces.includes(requestedSurface as PantavionOriginalDwgSurface);

  const blocked = anyMismatch || !surfaceAllowed;

  const status: PantavionOriginalDwgBindingStatus = blocked
    ? "mismatch"
    : identityVerified
      ? "verified"
      : hasObservedIdentity
        ? "metadata_only"
        : "registered";

  const notes = [...binding.notes];

  if (identityVerified) {
    notes.push("Original DWG identity verified by filename, size, and SHA256.");
  } else {
    notes.push("Original DWG identity is not fully verified until filename, size, and SHA256 all match.");
  }

  if (!surfaceAllowed) {
    notes.push("Requested surface is not allowed for this original DWG binding.");
  }

  if (anyMismatch) {
    notes.push("Mismatch detected. Do not render or bind this artifact as the Pantavion original DWG.");
  }

  notes.push("Founder approval and licensed CAD viewer adapter are required before original viewer execution.");

  return {
    ok: true,
    requestId: `dwg_binding_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    bindingId: binding.id,
    filename: binding.filename,
    expectedSizeBytes: binding.expectedSizeBytes,
    expectedSha256: binding.expectedSha256,
    observedFilename: observedFilename || undefined,
    observedSizeBytes: input.observedSizeBytes,
    observedSha256: observedSha256 || undefined,
    requestedSurface: requestedSurface || undefined,
    status,
    filenameMatches,
    sizeMatches,
    sha256Matches,
    identityVerified,
    requiresFounderApproval: true,
    requiresSensitiveVaultCheck: true,
    requiresCadViewerAdapter: true,
    requiresLicenseAdapter: true,
    allowedForMetadataBinding: !blocked,
    allowedForOriginalViewerRequest: !blocked,
    allowedForAutomaticRender: false,
    blocked,
    notes,
    auditTags: blocked
      ? [...binding.auditTags, "blocked"]
      : identityVerified
        ? [...binding.auditTags, "verified"]
        : [...binding.auditTags, "metadata_only"],
    assessedAt: new Date().toISOString()
  };
}
