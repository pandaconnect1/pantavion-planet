export type PantavionCadAdapterStatus =
  | "supported"
  | "beta"
  | "internal"
  | "future"
  | "requires_license_adapter"
  | "cloud_provider_requires_founder_approval"
  | "blocked";

export type PantavionCadRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionCadSourceTruthPolicy =
  | "preserve_original"
  | "derivative_only"
  | "not_original"
  | "blocked";

export type PantavionCadViewerAdapter = {
  id: string;
  label: string;
  provider: string;
  status: PantavionCadAdapterStatus;
  riskZone: PantavionCadRiskZone;
  sourceTruthPolicy: PantavionCadSourceTruthPolicy;
  requiresFounderApproval: boolean;
  requiresLicense: boolean;
  requiresCloudUpload: boolean;
  canRenderOriginalDwg: boolean;
  canBePresentedAsOriginal: boolean;
  allowedForProduction: boolean;
  notes: string[];
  auditTags: string[];
};

export type PantavionCadViewerAssessmentInput = {
  adapterId?: string;
  sourceFormat?: string;
  target?: string;
  useCase?: string;
  sourceTruth?: boolean;
  production?: boolean;
  founderApproved?: boolean;
  licenseAvailable?: boolean;
  cloudApproved?: boolean;
  actor?: string;
};

export type PantavionCadViewerAssessment = {
  ok: true;
  requestId: string;
  adapterId: string | null;
  status: PantavionCadAdapterStatus;
  riskZone: PantavionCadRiskZone;
  sourceTruthPolicy: PantavionCadSourceTruthPolicy;
  requiresFounderApproval: boolean;
  requiresLicense: boolean;
  requiresCloudApproval: boolean;
  allowedForPlanning: boolean;
  allowedForExecution: boolean;
  allowedForProduction: boolean;
  canBePresentedAsOriginal: boolean;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

const normalize = (value: unknown): string =>
  String(value || "").trim().toLowerCase().replace(/^\./, "");

export const PANTAVION_CAD_VIEWER_ADAPTER_MATRIX: PantavionCadViewerAdapter[] = [
  {
    id: "oda_inweb_dwg_viewer",
    label: "ODA Drawings inWEB DWG Viewer",
    provider: "Open Design Alliance",
    status: "requires_license_adapter",
    riskZone: "Z3",
    sourceTruthPolicy: "preserve_original",
    requiresFounderApproval: true,
    requiresLicense: true,
    requiresCloudUpload: false,
    canRenderOriginalDwg: true,
    canBePresentedAsOriginal: true,
    allowedForProduction: false,
    notes: [
      "Preferred private/cloudless-style path when licensed and integrated correctly.",
      "Must render the original DWG read-only and preserve layers, colors, text, arrows, labels, blocks, coordinates, and entities.",
      "No filtering, removal, sampling, reconstruction, simplification, or derivative presentation as original is allowed."
    ],
    auditTags: ["cad", "dwg", "oda", "source_truth", "licensed_adapter", "founder_approval"]
  },
  {
    id: "oda_mcp_future",
    label: "ODA MCP Servers Future Adapter",
    provider: "Open Design Alliance",
    status: "future",
    riskZone: "Z3",
    sourceTruthPolicy: "preserve_original",
    requiresFounderApproval: true,
    requiresLicense: true,
    requiresCloudUpload: false,
    canRenderOriginalDwg: false,
    canBePresentedAsOriginal: false,
    allowedForProduction: false,
    notes: [
      "Future adapter category only. It must not be treated as an available runtime capability until a real licensed adapter exists.",
      "Any AI/CAD agent access must be identity-scoped, permissioned, audited, and source-truth safe."
    ],
    auditTags: ["cad", "dwg", "oda", "mcp", "future", "requires_adapter"]
  },
  {
    id: "autodesk_aps_cloud_viewer",
    label: "Autodesk APS Cloud Viewer",
    provider: "Autodesk APS",
    status: "cloud_provider_requires_founder_approval",
    riskZone: "Z3",
    sourceTruthPolicy: "preserve_original",
    requiresFounderApproval: true,
    requiresLicense: true,
    requiresCloudUpload: true,
    canRenderOriginalDwg: true,
    canBePresentedAsOriginal: true,
    allowedForProduction: false,
    notes: [
      "Cloud provider path. It requires explicit founder approval before any DWG/source-truth artifact is uploaded or translated.",
      "Must not be enabled silently because source artifacts may leave Pantavion-controlled infrastructure."
    ],
    auditTags: ["cad", "dwg", "autodesk", "aps", "cloud", "founder_approval"]
  },
  {
    id: "mlightcad_experimental",
    label: "MLightCAD Experimental Adapter",
    provider: "MLightCAD",
    status: "internal",
    riskZone: "Z3",
    sourceTruthPolicy: "not_original",
    requiresFounderApproval: true,
    requiresLicense: false,
    requiresCloudUpload: false,
    canRenderOriginalDwg: false,
    canBePresentedAsOriginal: false,
    allowedForProduction: false,
    notes: [
      "Internal experiment only. It must not be presented as a working original DWG viewer until a real documented load/open/render path is verified.",
      "No production use and no source-truth claim."
    ],
    auditTags: ["cad", "dwg", "experimental", "internal", "not_source_truth"]
  },
  {
    id: "dwg_to_geojson_derivative_overlay",
    label: "DWG to GeoJSON Derivative Overlay",
    provider: "Licensed CAD/GIS adapter required",
    status: "requires_license_adapter",
    riskZone: "Z3",
    sourceTruthPolicy: "derivative_only",
    requiresFounderApproval: true,
    requiresLicense: true,
    requiresCloudUpload: false,
    canRenderOriginalDwg: false,
    canBePresentedAsOriginal: false,
    allowedForProduction: false,
    notes: [
      "Allowed only as a derivative overlay path after founder approval.",
      "GeoJSON must never be shown as the original DWG/source truth."
    ],
    auditTags: ["cad", "gis", "dwg", "geojson", "derivative", "founder_approval"]
  },
  {
    id: "leaflet_geojson_as_original",
    label: "Leaflet/GeoJSON Presented As Original DWG",
    provider: "None",
    status: "blocked",
    riskZone: "Z4",
    sourceTruthPolicy: "blocked",
    requiresFounderApproval: true,
    requiresLicense: false,
    requiresCloudUpload: false,
    canRenderOriginalDwg: false,
    canBePresentedAsOriginal: false,
    allowedForProduction: false,
    notes: [
      "Blocked. A Leaflet/GeoJSON map, reconstruction, or simplified derivative must never be presented as the original DWG."
    ],
    auditTags: ["cad", "dwg", "blocked", "fake_original", "source_truth"]
  },
  {
    id: "static_image_pdf_as_original",
    label: "Static Image/PDF/Screenshot Presented As Original DWG",
    provider: "None",
    status: "blocked",
    riskZone: "Z4",
    sourceTruthPolicy: "blocked",
    requiresFounderApproval: true,
    requiresLicense: false,
    requiresCloudUpload: false,
    canRenderOriginalDwg: false,
    canBePresentedAsOriginal: false,
    allowedForProduction: false,
    notes: [
      "Blocked. A screenshot, static image, exported PDF, sampled tile, or visual approximation must never be presented as the original DWG."
    ],
    auditTags: ["cad", "dwg", "blocked", "static_fake_original", "source_truth"]
  }
];

export function listPantavionCadViewerAdapters(): PantavionCadViewerAdapter[] {
  return PANTAVION_CAD_VIEWER_ADAPTER_MATRIX.map((entry) => ({
    ...entry,
    notes: [...entry.notes],
    auditTags: [...entry.auditTags]
  }));
}

export function assessPantavionCadViewerAdapter(
  input: PantavionCadViewerAssessmentInput
): PantavionCadViewerAssessment {
  const requestedAdapterId = normalize(input.adapterId);
  const sourceFormat = normalize(input.sourceFormat || "dwg");

  const adapter =
    PANTAVION_CAD_VIEWER_ADAPTER_MATRIX.find((entry) => entry.id === requestedAdapterId) ??
    null;

  const isDwgSourceTruth = sourceFormat === "dwg" || Boolean(input.sourceTruth);
  const fallbackStatus: PantavionCadAdapterStatus = isDwgSourceTruth
    ? "requires_license_adapter"
    : "internal";

  const status = adapter?.status ?? fallbackStatus;
  const riskZone = adapter?.riskZone ?? (isDwgSourceTruth ? "Z3" : "Z2");
  const sourceTruthPolicy =
    adapter?.sourceTruthPolicy ?? (isDwgSourceTruth ? "preserve_original" : "derivative_only");

  const requiresFounderApproval =
    Boolean(adapter?.requiresFounderApproval) ||
    isDwgSourceTruth ||
    Boolean(input.production) ||
    riskZone === "Z3" ||
    riskZone === "Z4";

  const requiresLicense = Boolean(adapter?.requiresLicense) || status === "requires_license_adapter";
  const requiresCloudApproval = Boolean(adapter?.requiresCloudUpload);

  const blocked = status === "blocked" || riskZone === "Z4" || sourceTruthPolicy === "blocked";

  const founderApproved = Boolean(input.founderApproved);
  const licenseAvailable = Boolean(input.licenseAvailable);
  const cloudApproved = Boolean(input.cloudApproved);

  const allowedForPlanning = !blocked;

  const allowedForExecution =
    !blocked &&
    (!requiresFounderApproval || founderApproved) &&
    (!requiresLicense || licenseAvailable) &&
    (!requiresCloudApproval || cloudApproved);

  const allowedForProduction =
    allowedForExecution &&
    Boolean(input.production) &&
    Boolean(adapter?.allowedForProduction) &&
    Boolean(adapter?.canRenderOriginalDwg);

  const notes = adapter
    ? [...adapter.notes]
    : [
        "No exact CAD viewer adapter was found. Treat this as requires_adapter and do not execute automatically."
      ];

  if (isDwgSourceTruth) {
    notes.push(
      "DWG source-truth rule: preserve the original read-only file. Do not remove, filter, simplify, reconstruct, sample, or present derivatives as original."
    );
  }

  if (requiresFounderApproval && !founderApproved) {
    notes.push("Founder approval is required before execution.");
  }

  if (requiresLicense && !licenseAvailable) {
    notes.push("A verified license/adapter is required before execution.");
  }

  if (requiresCloudApproval && !cloudApproved) {
    notes.push("Cloud upload/translation requires explicit founder approval.");
  }

  if (blocked) {
    notes.push("This adapter/path is blocked and must not execute.");
  }

  return {
    ok: true,
    requestId: `cad_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    adapterId: adapter?.id ?? null,
    status,
    riskZone,
    sourceTruthPolicy,
    requiresFounderApproval,
    requiresLicense,
    requiresCloudApproval,
    allowedForPlanning,
    allowedForExecution,
    allowedForProduction,
    canBePresentedAsOriginal: Boolean(adapter?.canBePresentedAsOriginal) && allowedForExecution,
    notes,
    auditTags: adapter?.auditTags ?? ["cad", "dwg", "unregistered", "review_required"],
    assessedAt: new Date().toISOString()
  };
}
