import {
  assessPantavionOriginalDwgSourceBinding,
  getPantavionOriginalDwgSourceBinding
} from "./original-dwg-source-binding";
import { assessPantavionSensitiveArtifact } from "@/core/vault/sensitive-artifact-vault";
import { assessPantavionCadViewerAdapter } from "@/core/cad/cad-viewer-adapter-matrix";

export type PantavionDwgAdapterKind =
  | "oda_inweb"
  | "oda_mcp_future"
  | "autodesk_aps_cloud"
  | "custom_local"
  | "unknown";

export type PantavionDwgAdapterRuntimeStatus =
  | "contract_only"
  | "requires_founder_approval"
  | "requires_license"
  | "requires_adapter_package"
  | "ready_for_internal_test"
  | "blocked";

export type PantavionDwgAdapterRequiredMethod =
  | "initialize"
  | "loadOriginalDwgReadOnly"
  | "renderEmbedded"
  | "dispose";

export type PantavionDwgAdapterRuntimeContract = {
  id: string;
  adapterKind: PantavionDwgAdapterKind;
  label: string;
  cadAdapterMatrixId: string;
  status: PantavionDwgAdapterRuntimeStatus;
  allowedSurfaces: ("B" | "C")[];
  allowedForOriginalDwg: boolean;
  allowedForDerivativeOnly: boolean;
  canExposeFileBytesToClient: false;
  canPresentDerivativeAsOriginal: false;
  canModifySourceDwg: false;
  requiresFounderApproval: true;
  requiresSensitiveVaultCheck: true;
  requiresOriginalDwgBinding: true;
  requiresLicense: boolean;
  requiresAdapterPackage: boolean;
  requiresCloudApproval: boolean;
  requiresHumanVerification: true;
  requirements: {
    packageName: string;
    requiredMethods: PantavionDwgAdapterRequiredMethod[];
    licenseProofRequired: boolean;
    readOnlySourceRequired: true;
    noEntityFilteringRequired: true;
    noDerivativeAsOriginalRequired: true;
  };
  forbiddenOutputs: string[];
  notes: string[];
  auditTags: string[];
};

export type PantavionLicensedDwgAdapterRuntimeInput = {
  adapterKind?: PantavionDwgAdapterKind;
  surface?: string;
  founderApproved?: boolean;
  licenseAvailable?: boolean;
  adapterPackageAvailable?: boolean;
  cloudApproved?: boolean;
  verifiedMethods?: PantavionDwgAdapterRequiredMethod[];
  production?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionLicensedDwgAdapterRuntimeAssessment = {
  ok: true;
  requestId: string;
  adapterKind: PantavionDwgAdapterKind;
  contractId: string | null;
  status: PantavionDwgAdapterRuntimeStatus;
  surface: "B" | "C";
  originalFilename: string;
  expectedSizeBytes: number;
  expectedSha256: string;
  requiresFounderApproval: true;
  requiresSensitiveVaultCheck: true;
  requiresOriginalDwgBinding: true;
  requiresLicense: boolean;
  requiresAdapterPackage: boolean;
  requiresCloudApproval: boolean;
  requiresHumanVerification: true;
  noFakeRender: true;
  noDerivativeAsOriginal: true;
  noClientFileBytes: true;
  canStartInternalAdapterTest: boolean;
  canRenderOriginalNow: boolean;
  allowedForProduction: false;
  blocked: boolean;
  missingMethods: PantavionDwgAdapterRequiredMethod[];
  sourceAssessmentStatus: string;
  vaultAssessmentRiskZone: string;
  cadAdapterStatus: string;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

export const LICENSED_DWG_ADAPTER_RUNTIME_CONTRACTS: PantavionDwgAdapterRuntimeContract[] = [
  {
    id: "oda_inweb_runtime_contract",
    adapterKind: "oda_inweb",
    label: "ODA inWEB Runtime Contract",
    cadAdapterMatrixId: "oda_inweb_dwg_viewer",
    status: "contract_only",
    allowedSurfaces: ["B", "C"],
    allowedForOriginalDwg: true,
    allowedForDerivativeOnly: false,
    canExposeFileBytesToClient: false,
    canPresentDerivativeAsOriginal: false,
    canModifySourceDwg: false,
    requiresFounderApproval: true,
    requiresSensitiveVaultCheck: true,
    requiresOriginalDwgBinding: true,
    requiresLicense: true,
    requiresAdapterPackage: true,
    requiresCloudApproval: false,
    requiresHumanVerification: true,
    requirements: {
      packageName: "ODA Drawings inWEB SDK",
      requiredMethods: ["initialize", "loadOriginalDwgReadOnly", "renderEmbedded", "dispose"],
      licenseProofRequired: true,
      readOnlySourceRequired: true,
      noEntityFilteringRequired: true,
      noDerivativeAsOriginalRequired: true
    },
    forbiddenOutputs: [
      "pdf_as_original",
      "image_as_original",
      "screenshot_as_original",
      "geojson_as_original",
      "leaflet_reconstruction_as_original",
      "sampled_tiles_as_original",
      "filtered_layers_as_original"
    ],
    notes: [
      "Preferred private licensed DWG adapter contract.",
      "Must load the original DWG read-only.",
      "Must preserve layers, colors, text, arrows, labels, blocks, coordinates, and entities.",
      "Must not expose original DWG bytes to the browser unless a separate protected streaming design is approved."
    ],
    auditTags: ["dwg", "oda", "inweb", "runtime_contract", "source_truth", "founder_approval"]
  },
  {
    id: "oda_mcp_future_runtime_contract",
    adapterKind: "oda_mcp_future",
    label: "ODA MCP Future Runtime Contract",
    cadAdapterMatrixId: "oda_mcp_future",
    status: "contract_only",
    allowedSurfaces: ["B", "C"],
    allowedForOriginalDwg: false,
    allowedForDerivativeOnly: false,
    canExposeFileBytesToClient: false,
    canPresentDerivativeAsOriginal: false,
    canModifySourceDwg: false,
    requiresFounderApproval: true,
    requiresSensitiveVaultCheck: true,
    requiresOriginalDwgBinding: true,
    requiresLicense: true,
    requiresAdapterPackage: true,
    requiresCloudApproval: false,
    requiresHumanVerification: true,
    requirements: {
      packageName: "ODA MCP Server",
      requiredMethods: ["initialize", "loadOriginalDwgReadOnly", "renderEmbedded", "dispose"],
      licenseProofRequired: true,
      readOnlySourceRequired: true,
      noEntityFilteringRequired: true,
      noDerivativeAsOriginalRequired: true
    },
    forbiddenOutputs: [
      "unverified_agent_cad_action",
      "ai_modified_original_dwg",
      "derivative_as_original"
    ],
    notes: [
      "Future contract only. Not available for runtime rendering until a real adapter exists.",
      "Any AI/CAD access must be identity-scoped, permissioned, audited, and approval-gated."
    ],
    auditTags: ["dwg", "oda", "mcp", "future", "runtime_contract"]
  },
  {
    id: "autodesk_aps_cloud_runtime_contract",
    adapterKind: "autodesk_aps_cloud",
    label: "Autodesk APS Cloud Runtime Contract",
    cadAdapterMatrixId: "autodesk_aps_cloud_viewer",
    status: "requires_founder_approval",
    allowedSurfaces: ["B", "C"],
    allowedForOriginalDwg: true,
    allowedForDerivativeOnly: false,
    canExposeFileBytesToClient: false,
    canPresentDerivativeAsOriginal: false,
    canModifySourceDwg: false,
    requiresFounderApproval: true,
    requiresSensitiveVaultCheck: true,
    requiresOriginalDwgBinding: true,
    requiresLicense: true,
    requiresAdapterPackage: true,
    requiresCloudApproval: true,
    requiresHumanVerification: true,
    requirements: {
      packageName: "Autodesk APS Viewer / Model Derivative",
      requiredMethods: ["initialize", "loadOriginalDwgReadOnly", "renderEmbedded", "dispose"],
      licenseProofRequired: true,
      readOnlySourceRequired: true,
      noEntityFilteringRequired: true,
      noDerivativeAsOriginalRequired: true
    },
    forbiddenOutputs: [
      "silent_cloud_upload",
      "unapproved_translation",
      "public_bucket_original_dwg",
      "derivative_as_original"
    ],
    notes: [
      "Cloud route only. Requires explicit founder approval before upload, translation, or processing.",
      "Must not be enabled silently because source-truth files may leave Pantavion-controlled infrastructure."
    ],
    auditTags: ["dwg", "autodesk", "aps", "cloud", "runtime_contract", "founder_approval"]
  },
  {
    id: "custom_local_runtime_contract",
    adapterKind: "custom_local",
    label: "Custom Local DWG Adapter Contract",
    cadAdapterMatrixId: "mlightcad_experimental",
    status: "requires_adapter_package",
    allowedSurfaces: ["B", "C"],
    allowedForOriginalDwg: false,
    allowedForDerivativeOnly: false,
    canExposeFileBytesToClient: false,
    canPresentDerivativeAsOriginal: false,
    canModifySourceDwg: false,
    requiresFounderApproval: true,
    requiresSensitiveVaultCheck: true,
    requiresOriginalDwgBinding: true,
    requiresLicense: false,
    requiresAdapterPackage: true,
    requiresCloudApproval: false,
    requiresHumanVerification: true,
    requirements: {
      packageName: "Verified local DWG renderer",
      requiredMethods: ["initialize", "loadOriginalDwgReadOnly", "renderEmbedded", "dispose"],
      licenseProofRequired: false,
      readOnlySourceRequired: true,
      noEntityFilteringRequired: true,
      noDerivativeAsOriginalRequired: true
    },
    forbiddenOutputs: [
      "undocumented_open_method",
      "fake_canvas",
      "static_placeholder_as_viewer",
      "derivative_as_original"
    ],
    notes: [
      "Only a contract. It must not be treated as available until documented load/open/render behavior is verified.",
      "No production use and no source-truth claim without full adapter verification."
    ],
    auditTags: ["dwg", "custom_local", "runtime_contract", "requires_adapter"]
  }
];

function normalizeSurface(value: unknown): "B" | "C" {
  return String(value || "").trim().toUpperCase() === "C" ? "C" : "B";
}

function normalizeAdapterKind(value: unknown): PantavionDwgAdapterKind {
  const raw = String(value || "").trim().toLowerCase();

  if (raw === "oda_inweb") {
    return "oda_inweb";
  }

  if (raw === "oda_mcp_future") {
    return "oda_mcp_future";
  }

  if (raw === "autodesk_aps_cloud") {
    return "autodesk_aps_cloud";
  }

  if (raw === "custom_local") {
    return "custom_local";
  }

  return "unknown";
}

function normalizeMethods(
  values: PantavionDwgAdapterRequiredMethod[] | undefined
): PantavionDwgAdapterRequiredMethod[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const allowed = new Set<PantavionDwgAdapterRequiredMethod>([
    "initialize",
    "loadOriginalDwgReadOnly",
    "renderEmbedded",
    "dispose"
  ]);

  return values.filter((value): value is PantavionDwgAdapterRequiredMethod =>
    allowed.has(value)
  );
}

export function listPantavionLicensedDwgAdapterRuntimeContracts(): PantavionDwgAdapterRuntimeContract[] {
  return LICENSED_DWG_ADAPTER_RUNTIME_CONTRACTS.map((contract) => ({
    ...contract,
    allowedSurfaces: [...contract.allowedSurfaces],
    requirements: {
      ...contract.requirements,
      requiredMethods: [...contract.requirements.requiredMethods]
    },
    forbiddenOutputs: [...contract.forbiddenOutputs],
    notes: [...contract.notes],
    auditTags: [...contract.auditTags]
  }));
}

export function assessPantavionLicensedDwgAdapterRuntime(
  input: PantavionLicensedDwgAdapterRuntimeInput
): PantavionLicensedDwgAdapterRuntimeAssessment {
  const adapterKind = normalizeAdapterKind(input.adapterKind);
  const surface = normalizeSurface(input.surface);
  const contract =
    LICENSED_DWG_ADAPTER_RUNTIME_CONTRACTS.find((entry) => entry.adapterKind === adapterKind) ??
    null;

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
    production: Boolean(input.production),
    founderApproved: Boolean(input.founderApproved),
    actor: input.actor,
    reason: "Licensed DWG adapter runtime contract"
  });

  const cadAssessment = assessPantavionCadViewerAdapter({
    adapterId: contract?.cadAdapterMatrixId ?? "unknown",
    sourceFormat: "dwg",
    target: "embedded_viewer",
    useCase: "Licensed DWG adapter runtime contract",
    sourceTruth: true,
    production: Boolean(input.production),
    founderApproved: Boolean(input.founderApproved),
    licenseAvailable: Boolean(input.licenseAvailable),
    cloudApproved: Boolean(input.cloudApproved),
    actor: input.actor
  });

  const verifiedMethods = normalizeMethods(input.verifiedMethods);
  const missingMethods = contract
    ? contract.requirements.requiredMethods.filter((method) => !verifiedMethods.includes(method))
    : (["initialize", "loadOriginalDwgReadOnly", "renderEmbedded", "dispose"] as PantavionDwgAdapterRequiredMethod[]);

  const missingLicense = Boolean(contract?.requiresLicense) && !input.licenseAvailable;
  const missingPackage = Boolean(contract?.requiresAdapterPackage) && !input.adapterPackageAvailable;
  const missingCloudApproval = Boolean(contract?.requiresCloudApproval) && !input.cloudApproved;
  const missingFounderApproval = !input.founderApproved;

  const blocked =
    !contract ||
    contract.status === "blocked" ||
    sourceAssessment.blocked ||
    vaultAssessment.blocked ||
    cadAssessment.status === "blocked" ||
    adapterKind === "unknown";

  let status: PantavionDwgAdapterRuntimeStatus = "contract_only";

  if (blocked) {
    status = "blocked";
  } else if (missingFounderApproval || missingCloudApproval) {
    status = "requires_founder_approval";
  } else if (missingLicense) {
    status = "requires_license";
  } else if (missingPackage) {
    status = "requires_adapter_package";
  } else if (missingMethods.length === 0 && cadAssessment.allowedForExecution) {
    status = "ready_for_internal_test";
  }

  const canStartInternalAdapterTest =
    status === "ready_for_internal_test" &&
    sourceAssessment.identityVerified &&
    vaultAssessment.allowedForExecutionAfterApproval &&
    cadAssessment.allowedForExecution;

  const canRenderOriginalNow =
    canStartInternalAdapterTest &&
    contract?.allowedForOriginalDwg === true &&
    !input.production;

  const notes = contract
    ? [...contract.notes]
    : ["No runtime contract matched. Rendering is blocked until a real contract exists."];

  notes.push("No fake render is allowed.");
  notes.push("No derivative may be presented as the original DWG.");
  notes.push("Original DWG bytes must not be exposed to client routes by this contract.");
  notes.push("Production rendering remains disabled until a separate production approval gate exists.");

  if (missingFounderApproval) {
    notes.push("Founder approval is required before adapter execution.");
  }

  if (missingLicense) {
    notes.push("Verified license is required before adapter execution.");
  }

  if (missingPackage) {
    notes.push("Adapter package/runtime must be installed and verified before execution.");
  }

  if (missingCloudApproval) {
    notes.push("Cloud upload/translation approval is required before cloud adapter execution.");
  }

  if (missingMethods.length > 0) {
    notes.push(`Missing verified adapter methods: ${missingMethods.join(", ")}`);
  }

  return {
    ok: true,
    requestId: `dwg_adapter_contract_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    adapterKind,
    contractId: contract?.id ?? null,
    status,
    surface,
    originalFilename: binding.filename,
    expectedSizeBytes: binding.expectedSizeBytes,
    expectedSha256: binding.expectedSha256,
    requiresFounderApproval: true,
    requiresSensitiveVaultCheck: true,
    requiresOriginalDwgBinding: true,
    requiresLicense: Boolean(contract?.requiresLicense),
    requiresAdapterPackage: Boolean(contract?.requiresAdapterPackage),
    requiresCloudApproval: Boolean(contract?.requiresCloudApproval),
    requiresHumanVerification: true,
    noFakeRender: true,
    noDerivativeAsOriginal: true,
    noClientFileBytes: true,
    canStartInternalAdapterTest,
    canRenderOriginalNow,
    allowedForProduction: false,
    blocked,
    missingMethods,
    sourceAssessmentStatus: sourceAssessment.status,
    vaultAssessmentRiskZone: vaultAssessment.riskZone,
    cadAdapterStatus: cadAssessment.status,
    notes,
    auditTags: contract?.auditTags ?? ["dwg", "runtime_contract", "blocked", "unknown_adapter"],
    assessedAt: new Date().toISOString()
  };
}
