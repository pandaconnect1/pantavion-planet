export type PantavionCapabilityStatus =
  | "supported"
  | "beta"
  | "internal"
  | "requires_adapter"
  | "blocked";

export type PantavionRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionFormatCategory =
  | "document"
  | "image"
  | "audio"
  | "video"
  | "cad"
  | "gis"
  | "archive"
  | "data"
  | "code"
  | "model"
  | "unknown";

export type PantavionConversionDirection = {
  id: string;
  sourceFormat: string;
  targetFormat: string;
  category: PantavionFormatCategory;
  status: PantavionCapabilityStatus;
  riskZone: PantavionRiskZone;
  providerStatus:
    | "native"
    | "provider_required"
    | "licensed_adapter_required"
    | "manual_review_required"
    | "not_allowed";
  sourceTruthPolicy:
    | "preserve_original"
    | "derivative_only"
    | "not_source_truth"
    | "blocked";
  requiresFounderApproval: boolean;
  notes: string;
  auditTags: string[];
};

export type PantavionConversionRequestInput = {
  sourceFormat: string;
  targetFormat: string;
  useCase?: string;
  sensitive?: boolean;
  sourceTruth?: boolean;
  actor?: string;
};

export type PantavionConversionAssessment = {
  ok: true;
  requestId: string;
  sourceFormat: string;
  targetFormat: string;
  status: PantavionCapabilityStatus;
  riskZone: PantavionRiskZone;
  providerStatus: PantavionConversionDirection["providerStatus"];
  sourceTruthPolicy: PantavionConversionDirection["sourceTruthPolicy"];
  requiresFounderApproval: boolean;
  allowedToExecuteAutomatically: boolean;
  matchedDirectionId: string | null;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

const nowIso = () => new Date().toISOString();

const normalizeFormat = (value: string): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\./, "");

export const PANTAVION_SENSITIVE_SOURCE_TRUTH_FORMATS = [
  "dwg",
  "dxf",
  "dgn",
  "rvt",
  "ifc",
  "las",
  "laz",
  "kml",
  "kmz",
  "shp",
  "gpkg",
  "geojson",
] as const;

export const PANTAVION_CONVERSION_FORMAT_MATRIX: PantavionConversionDirection[] = [
  {
    id: "document_pdf_to_text",
    sourceFormat: "pdf",
    targetFormat: "text",
    category: "document",
    status: "requires_adapter",
    riskZone: "Z2",
    providerStatus: "provider_required",
    sourceTruthPolicy: "derivative_only",
    requiresFounderApproval: false,
    notes:
      "PDF text extraction is allowed only as a derivative artifact. Original PDF remains the source artifact.",
    auditTags: ["conversion", "document", "pdf", "derivative"],
  },
  {
    id: "image_png_to_webp",
    sourceFormat: "png",
    targetFormat: "webp",
    category: "image",
    status: "supported",
    riskZone: "Z1",
    providerStatus: "native",
    sourceTruthPolicy: "derivative_only",
    requiresFounderApproval: false,
    notes:
      "Safe image derivative conversion when the original image is retained unchanged.",
    auditTags: ["conversion", "image", "safe_derivative"],
  },
  {
    id: "image_jpg_to_webp",
    sourceFormat: "jpg",
    targetFormat: "webp",
    category: "image",
    status: "supported",
    riskZone: "Z1",
    providerStatus: "native",
    sourceTruthPolicy: "derivative_only",
    requiresFounderApproval: false,
    notes:
      "Safe image derivative conversion when the original image is retained unchanged.",
    auditTags: ["conversion", "image", "safe_derivative"],
  },
  {
    id: "audio_wav_to_mp3",
    sourceFormat: "wav",
    targetFormat: "mp3",
    category: "audio",
    status: "requires_adapter",
    riskZone: "Z2",
    providerStatus: "provider_required",
    sourceTruthPolicy: "derivative_only",
    requiresFounderApproval: false,
    notes:
      "Audio conversion requires a configured media adapter and audit trail.",
    auditTags: ["conversion", "audio", "adapter_required"],
  },
  {
    id: "video_mov_to_mp4",
    sourceFormat: "mov",
    targetFormat: "mp4",
    category: "video",
    status: "requires_adapter",
    riskZone: "Z2",
    providerStatus: "provider_required",
    sourceTruthPolicy: "derivative_only",
    requiresFounderApproval: false,
    notes:
      "Video conversion requires a configured media adapter and resource limits.",
    auditTags: ["conversion", "video", "adapter_required"],
  },
  {
    id: "cad_dwg_to_embedded_viewer",
    sourceFormat: "dwg",
    targetFormat: "embedded_viewer",
    category: "cad",
    status: "requires_adapter",
    riskZone: "Z3",
    providerStatus: "licensed_adapter_required",
    sourceTruthPolicy: "preserve_original",
    requiresFounderApproval: true,
    notes:
      "DWG viewing must preserve the original source truth. No layer, color, text, arrow, label, block, coordinate, or entity may be removed, filtered, simplified, reconstructed, sampled, or presented as original unless explicitly approved.",
    auditTags: ["conversion", "cad", "dwg", "source_truth", "founder_approval"],
  },
  {
    id: "cad_dwg_to_geojson_derivative",
    sourceFormat: "dwg",
    targetFormat: "geojson",
    category: "cad",
    status: "requires_adapter",
    riskZone: "Z3",
    providerStatus: "licensed_adapter_required",
    sourceTruthPolicy: "derivative_only",
    requiresFounderApproval: true,
    notes:
      "DWG to GeoJSON is only a derivative conversion. It must never be displayed as the original master DWG/source truth.",
    auditTags: ["conversion", "cad", "gis", "dwg", "derivative", "founder_approval"],
  },
  {
    id: "cad_dwg_to_static_image_as_original",
    sourceFormat: "dwg",
    targetFormat: "static_image_original",
    category: "cad",
    status: "blocked",
    riskZone: "Z4",
    providerStatus: "not_allowed",
    sourceTruthPolicy: "blocked",
    requiresFounderApproval: true,
    notes:
      "Blocked: a static image, screenshot, PDF, sampled map, Leaflet/GeoJSON reconstruction, or simplified derivative must not be presented as the original DWG.",
    auditTags: ["conversion", "cad", "dwg", "blocked", "source_truth"],
  },
  {
    id: "gis_kml_to_geojson",
    sourceFormat: "kml",
    targetFormat: "geojson",
    category: "gis",
    status: "requires_adapter",
    riskZone: "Z3",
    providerStatus: "provider_required",
    sourceTruthPolicy: "derivative_only",
    requiresFounderApproval: true,
    notes:
      "GIS conversion can be useful, but the derivative must be labeled as derivative and audited.",
    auditTags: ["conversion", "gis", "derivative", "founder_approval"],
  },
  {
    id: "gis_kmz_to_geojson",
    sourceFormat: "kmz",
    targetFormat: "geojson",
    category: "gis",
    status: "requires_adapter",
    riskZone: "Z3",
    providerStatus: "provider_required",
    sourceTruthPolicy: "derivative_only",
    requiresFounderApproval: true,
    notes:
      "KMZ conversion can be useful, but the derivative must be labeled as derivative and audited.",
    auditTags: ["conversion", "gis", "derivative", "founder_approval"],
  },
  {
    id: "archive_zip_extract",
    sourceFormat: "zip",
    targetFormat: "extracted_files",
    category: "archive",
    status: "internal",
    riskZone: "Z2",
    providerStatus: "native",
    sourceTruthPolicy: "derivative_only",
    requiresFounderApproval: false,
    notes:
      "Archive extraction must use safe path handling, size limits, and malware/suspicious file checks before downstream use.",
    auditTags: ["conversion", "archive", "safe_extract"],
  },
  {
    id: "data_csv_to_json",
    sourceFormat: "csv",
    targetFormat: "json",
    category: "data",
    status: "supported",
    riskZone: "Z1",
    providerStatus: "native",
    sourceTruthPolicy: "derivative_only",
    requiresFounderApproval: false,
    notes:
      "CSV to JSON is allowed as a derivative conversion when the original CSV is retained.",
    auditTags: ["conversion", "data", "safe_derivative"],
  }
];

export function listPantavionConversionMatrix(): PantavionConversionDirection[] {
  return PANTAVION_CONVERSION_FORMAT_MATRIX.map((entry) => ({ ...entry }));
}

export function assessPantavionConversionRequest(
  input: PantavionConversionRequestInput
): PantavionConversionAssessment {
  const sourceFormat = normalizeFormat(input.sourceFormat);
  const targetFormat = normalizeFormat(input.targetFormat);
  const sensitiveFormats = new Set<string>(
    PANTAVION_SENSITIVE_SOURCE_TRUTH_FORMATS as readonly string[]
  );

  const matched =
    PANTAVION_CONVERSION_FORMAT_MATRIX.find(
      (entry) =>
        entry.sourceFormat === sourceFormat && entry.targetFormat === targetFormat
    ) ?? null;

  const isSensitive =
    Boolean(input.sensitive) ||
    Boolean(input.sourceTruth) ||
    sensitiveFormats.has(sourceFormat) ||
    sensitiveFormats.has(targetFormat);

  const fallbackStatus: PantavionCapabilityStatus = "requires_adapter";
  const fallbackRiskZone: PantavionRiskZone = isSensitive ? "Z3" : "Z2";

  const status = matched?.status ?? fallbackStatus;
  const riskZone = matched?.riskZone ?? fallbackRiskZone;
  const providerStatus =
    matched?.providerStatus ??
    (isSensitive ? "manual_review_required" : "provider_required");
  const sourceTruthPolicy =
    matched?.sourceTruthPolicy ?? (isSensitive ? "derivative_only" : "derivative_only");

  const requiresFounderApproval =
    Boolean(matched?.requiresFounderApproval) ||
    isSensitive ||
    riskZone === "Z3" ||
    riskZone === "Z4";

  const blocked = status === "blocked" || riskZone === "Z4";

  const allowedToExecuteAutomatically =
    !blocked &&
    !requiresFounderApproval &&
    (status === "supported" || status === "internal" || status === "beta");

  const notes = [
    matched
      ? matched.notes
      : "No exact conversion direction exists in the matrix. Treat as adapter-required until reviewed.",
  ];

  if (isSensitive) {
    notes.push(
      "Sensitive/source-truth related conversion detected. Founder approval is required before execution."
    );
  }

  if (sourceFormat === "dwg" || targetFormat === "dwg") {
    notes.push(
      "DWG rule: preserve original source truth. Do not filter, simplify, reconstruct, sample, or present derivatives as original."
    );
  }

  return {
    ok: true,
    requestId: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    sourceFormat,
    targetFormat,
    status,
    riskZone,
    providerStatus,
    sourceTruthPolicy,
    requiresFounderApproval,
    allowedToExecuteAutomatically,
    matchedDirectionId: matched?.id ?? null,
    notes,
    auditTags: matched?.auditTags ?? ["conversion", "unregistered", "review_required"],
    assessedAt: nowIso(),
  };
}
