import {
  assessPantavionOriginalDwgSourceBinding,
  getPantavionOriginalDwgSourceBinding
} from "./original-dwg-source-binding";
import { assessPantavionSensitiveArtifact } from "@/core/vault/sensitive-artifact-vault";
import { assessPantavionCadViewerAdapter } from "@/core/cad/cad-viewer-adapter-matrix";

export type PantavionOriginalDwgViewerSurface = "B" | "C";

export type PantavionOriginalDwgViewerBridgeStatus =
  | "adapter_required"
  | "ready_for_verified_adapter"
  | "blocked";

export type PantavionOriginalDwgViewerSurfaceConfig = {
  surface: PantavionOriginalDwgViewerSurface;
  label: string;
  pagePath: string;
  mode: "original_only" | "original_plus_future_overlays";
  overlaysAllowedNow: boolean;
  notes: string[];
};

export type PantavionOriginalDwgViewerBridgeInput = {
  surface?: string;
  founderApproved?: boolean;
  licenseAvailable?: boolean;
  cloudApproved?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionOriginalDwgViewerBridgeAssessment = {
  ok: true;
  requestId: string;
  surface: PantavionOriginalDwgViewerSurface;
  status: PantavionOriginalDwgViewerBridgeStatus;
  pagePath: string;
  apiRoute: string;
  originalFilename: string;
  expectedSizeBytes: number;
  expectedSha256: string;
  sourceTruth: true;
  readOnly: true;
  immutable: true;
  noDerivativeAsOriginal: true;
  requiresFounderApproval: true;
  requiresSensitiveVaultCheck: true;
  requiresCadViewerAdapter: true;
  requiresLicenseAdapter: true;
  canRequestAdapter: boolean;
  canRenderOriginal: boolean;
  automaticRenderBlocked: true;
  blocked: boolean;
  sourceAssessmentStatus: string;
  vaultAssessmentStatus: string;
  cadAdapterStatus: string;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

export const PANTAVION_ORIGINAL_DWG_VIEWER_SURFACES: PantavionOriginalDwgViewerSurfaceConfig[] = [
  {
    surface: "B",
    label: "Pantavion Water B - Original DWG",
    pagePath: "/professional/infrastructure/water/b",
    mode: "original_only",
    overlaysAllowedNow: false,
    notes: [
      "Surface B is the original DWG source-truth viewer surface.",
      "No overlays, replacement map, GeoJSON, PDF, image, tile, or reconstruction may be presented as original."
    ]
  },
  {
    surface: "C",
    label: "Pantavion Water C - Original DWG plus future controls",
    pagePath: "/professional/infrastructure/water/c",
    mode: "original_plus_future_overlays",
    overlaysAllowedNow: false,
    notes: [
      "Surface C is bound to the same original DWG source truth.",
      "Future overlays are allowed only after the original DWG adapter is verified and the overlay is clearly labeled as derivative."
    ]
  }
];

function normalizeSurface(value: unknown): PantavionOriginalDwgViewerSurface {
  const raw = String(value || "").trim().toUpperCase();
  return raw === "C" ? "C" : "B";
}

export function listPantavionOriginalDwgViewerSurfaces(): PantavionOriginalDwgViewerSurfaceConfig[] {
  return PANTAVION_ORIGINAL_DWG_VIEWER_SURFACES.map((surface) => ({
    ...surface,
    notes: [...surface.notes]
  }));
}

export function assessPantavionOriginalDwgViewerBridge(
  input: PantavionOriginalDwgViewerBridgeInput
): PantavionOriginalDwgViewerBridgeAssessment {
  const surface = normalizeSurface(input.surface);
  const surfaceConfig =
    PANTAVION_ORIGINAL_DWG_VIEWER_SURFACES.find((entry) => entry.surface === surface) ??
    PANTAVION_ORIGINAL_DWG_VIEWER_SURFACES[0];

  const binding = getPantavionOriginalDwgSourceBinding();

  const sourceAssessment = assessPantavionOriginalDwgSourceBinding({
    observedFilename: binding.filename,
    observedSizeBytes: binding.expectedSizeBytes,
    observedSha256: binding.expectedSha256,
    requestedSurface: surface,
    founderApproved: Boolean(input.founderApproved),
    actor: input.actor,
    reason: input.reason
  });

  const vaultAssessment = assessPantavionSensitiveArtifact({
    filename: binding.filename,
    extension: "dwg",
    artifactClass: "dwg_source_truth",
    operation: "render",
    sourceTruth: true,
    production: false,
    founderApproved: Boolean(input.founderApproved),
    actor: input.actor,
    reason: "Pantavion B/C original DWG viewer bridge"
  });

  const cadAssessment = assessPantavionCadViewerAdapter({
    adapterId: "oda_inweb_dwg_viewer",
    sourceFormat: "dwg",
    target: "embedded_viewer",
    useCase: `Pantavion Water ${surface} original DWG viewer bridge`,
    sourceTruth: true,
    production: false,
    founderApproved: Boolean(input.founderApproved),
    licenseAvailable: Boolean(input.licenseAvailable),
    cloudApproved: Boolean(input.cloudApproved),
    actor: input.actor
  });

  const blocked =
    sourceAssessment.blocked ||
    vaultAssessment.blocked ||
    cadAssessment.status === "blocked";

  const canRequestAdapter = !blocked;

  const canRenderOriginal =
    !blocked &&
    sourceAssessment.identityVerified &&
    vaultAssessment.allowedForExecutionAfterApproval &&
    cadAssessment.allowedForExecution;

  const status: PantavionOriginalDwgViewerBridgeStatus = blocked
    ? "blocked"
    : canRenderOriginal
      ? "ready_for_verified_adapter"
      : "adapter_required";

  const notes = [
    ...surfaceConfig.notes,
    "This bridge connects the B/C pages to the protected original DWG source binding.",
    "This bridge does not convert the DWG and does not expose file bytes.",
    "Actual embedded rendering still requires a real licensed CAD/DWG viewer adapter.",
    "Automatic rendering is blocked until founder approval, vault check, CAD adapter check, and license availability are satisfied."
  ];

  return {
    ok: true,
    requestId: `dwg_viewer_bridge_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    surface,
    status,
    pagePath: surfaceConfig.pagePath,
    apiRoute: "/api/kernel/original-dwg-viewer-bridge",
    originalFilename: binding.filename,
    expectedSizeBytes: binding.expectedSizeBytes,
    expectedSha256: binding.expectedSha256,
    sourceTruth: true,
    readOnly: true,
    immutable: true,
    noDerivativeAsOriginal: true,
    requiresFounderApproval: true,
    requiresSensitiveVaultCheck: true,
    requiresCadViewerAdapter: true,
    requiresLicenseAdapter: true,
    canRequestAdapter,
    canRenderOriginal,
    automaticRenderBlocked: true,
    blocked,
    sourceAssessmentStatus: sourceAssessment.status,
    vaultAssessmentStatus: vaultAssessment.riskZone,
    cadAdapterStatus: cadAssessment.status,
    notes,
    auditTags: [
      "water",
      "dwg",
      "viewer_bridge",
      `surface_${surface.toLowerCase()}`,
      "source_truth",
      "requires_license_adapter",
      status
    ],
    assessedAt: new Date().toISOString()
  };
}
