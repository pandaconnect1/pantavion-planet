export type PantavionPythonWorkerJobKind =
  | "excel_xlsx_parse"
  | "csv_profile"
  | "pdf_text_extract"
  | "pdf_ocr_extract"
  | "docx_text_extract"
  | "image_ocr_extract"
  | "gis_spatial_index"
  | "cad_text_index"
  | "sha256_verify"
  | "telemetry_timeseries_profile"
  | "hydraulic_epanet_prepare"
  | "unknown";

export type PantavionPythonWorkerRuntimeStatus =
  | "ready_to_register"
  | "requires_private_storage"
  | "requires_founder_approval"
  | "requires_worker_runtime"
  | "registered_pending_worker"
  | "blocked";

export type PantavionPythonWorkerRiskZone = "Z1" | "Z2" | "Z3" | "Z4";

export type PantavionPythonWorkerSidecarKind =
  | "metadata_json"
  | "text_index_jsonl"
  | "ocr_index_jsonl"
  | "table_extract_json"
  | "spatial_index_json"
  | "sha256_report_json"
  | "telemetry_profile_json"
  | "hydraulic_prepare_json"
  | "unknown";

export type PantavionPythonWorkerJobDefinition = {
  kind: PantavionPythonWorkerJobKind;
  label: string;
  supportedExtensions: string[];
  sidecarOutputs: PantavionPythonWorkerSidecarKind[];
  riskZone: PantavionPythonWorkerRiskZone;
  requiresPrivateStorage: true;
  requiresSha256: boolean;
  requiresFounderApprovalForSourceTruth: true;
  originalMutationAllowed: false;
  sidecarOnly: true;
  pythonExecutionAllowedNow: false;
  notes: string[];
  auditTags: string[];
};

export type PantavionPythonWorkerRuntimeInput = {
  jobId?: string;
  jobKind?: PantavionPythonWorkerJobKind | string;
  artifactId?: string;
  filename?: string;
  extension?: string;
  sizeBytes?: number;
  sha256?: string;
  sourceTruth?: boolean;
  sensitive?: boolean;
  production?: boolean;
  privateStorageVerified?: boolean;
  founderApproved?: boolean;
  workerRuntimeAvailable?: boolean;
  sandboxAvailable?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionPythonWorkerRuntimeAssessment = {
  ok: true;
  requestId: string;
  jobId?: string;
  jobKind: PantavionPythonWorkerJobKind;
  artifactId?: string;
  filename?: string;
  extension: string;
  status: PantavionPythonWorkerRuntimeStatus;
  riskZone: PantavionPythonWorkerRiskZone;
  sourceTruth: boolean;
  sensitive: boolean;
  production: boolean;
  requiresPrivateStorage: true;
  requiresSha256: boolean;
  requiresFounderApproval: boolean;
  requiresWorkerRuntime: true;
  requiresSandbox: true;
  requiresAudit: true;
  originalMutationAllowed: false;
  originalDwgMutationAllowed: false;
  sidecarOnly: true;
  pythonExecutionAllowedNow: false;
  canRegisterJob: boolean;
  canExecuteNow: false;
  blocked: boolean;
  sidecarOutputs: PantavionPythonWorkerSidecarKind[];
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

export type PantavionPythonWorkerJobRecord = {
  id: string;
  jobId: string;
  jobKind: PantavionPythonWorkerJobKind;
  artifactId: string;
  filename: string;
  extension: string;
  sizeBytes?: number;
  sha256?: string;
  sourceTruth: boolean;
  sensitive: boolean;
  production: boolean;
  status: "registered_pending_worker";
  sidecarOutputs: PantavionPythonWorkerSidecarKind[];
  originalMutationAllowed: false;
  originalDwgMutationAllowed: false;
  sidecarOnly: true;
  pythonExecutionAllowedNow: false;
  createdAt: string;
  updatedAt: string;
  actor?: string;
  reason?: string;
};

export const PANTAVION_PYTHON_WORKER_JOB_DEFINITIONS: PantavionPythonWorkerJobDefinition[] = [
  {
    kind: "excel_xlsx_parse",
    label: "Excel / XLSX Parse",
    supportedExtensions: ["xlsx", "xlsm", "xls"],
    sidecarOutputs: ["metadata_json", "table_extract_json"],
    riskZone: "Z2",
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresFounderApprovalForSourceTruth: true,
    originalMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    notes: ["Parse sheets, tables, headers, quantities and summaries into sidecar outputs only."],
    auditTags: ["python_worker", "excel", "xlsx", "sidecar_only"]
  },
  {
    kind: "csv_profile",
    label: "CSV Profile",
    supportedExtensions: ["csv"],
    sidecarOutputs: ["metadata_json", "table_extract_json"],
    riskZone: "Z1",
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresFounderApprovalForSourceTruth: true,
    originalMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    notes: ["Profile CSV columns, row counts, missing values and simple summaries."],
    auditTags: ["python_worker", "csv", "profile", "sidecar_only"]
  },
  {
    kind: "pdf_text_extract",
    label: "PDF Text Extract",
    supportedExtensions: ["pdf"],
    sidecarOutputs: ["metadata_json", "text_index_jsonl"],
    riskZone: "Z2",
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresFounderApprovalForSourceTruth: true,
    originalMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    notes: ["Extract searchable text from digital PDFs into sidecar index files."],
    auditTags: ["python_worker", "pdf", "text_extract", "sidecar_only"]
  },
  {
    kind: "pdf_ocr_extract",
    label: "PDF OCR Extract",
    supportedExtensions: ["pdf"],
    sidecarOutputs: ["metadata_json", "ocr_index_jsonl"],
    riskZone: "Z3",
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresFounderApprovalForSourceTruth: true,
    originalMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    notes: ["OCR scanned PDFs into sidecar OCR indexes. Never replaces original documents."],
    auditTags: ["python_worker", "pdf", "ocr", "sidecar_only"]
  },
  {
    kind: "docx_text_extract",
    label: "Word / DOCX Text Extract",
    supportedExtensions: ["docx", "doc"],
    sidecarOutputs: ["metadata_json", "text_index_jsonl"],
    riskZone: "Z2",
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresFounderApprovalForSourceTruth: true,
    originalMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    notes: ["Extract document text, headings and tables into sidecar outputs."],
    auditTags: ["python_worker", "word", "docx", "sidecar_only"]
  },
  {
    kind: "image_ocr_extract",
    label: "Image OCR Extract",
    supportedExtensions: ["png", "jpg", "jpeg", "tif", "tiff", "webp"],
    sidecarOutputs: ["metadata_json", "ocr_index_jsonl"],
    riskZone: "Z3",
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresFounderApprovalForSourceTruth: true,
    originalMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    notes: ["OCR image labels, photos or scanned maps into sidecar OCR indexes."],
    auditTags: ["python_worker", "image", "ocr", "sidecar_only"]
  },
  {
    kind: "gis_spatial_index",
    label: "GIS Spatial Index",
    supportedExtensions: ["kml", "kmz", "shp", "gpkg", "geojson"],
    sidecarOutputs: ["metadata_json", "spatial_index_json"],
    riskZone: "Z3",
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresFounderApprovalForSourceTruth: true,
    originalMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    notes: ["Build spatial search indexes for road, zone, DMA and viewport queries."],
    auditTags: ["python_worker", "gis", "spatial_index", "sidecar_only"]
  },
  {
    kind: "cad_text_index",
    label: "CAD Text Index",
    supportedExtensions: ["dwg", "dxf", "dgn"],
    sidecarOutputs: ["metadata_json", "text_index_jsonl", "spatial_index_json"],
    riskZone: "Z4",
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresFounderApprovalForSourceTruth: true,
    originalMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    notes: ["Create searchable sidecar indexes for CAD labels, layers, blocks and approximate extents. Original DWG remains immutable."],
    auditTags: ["python_worker", "cad", "dwg", "source_truth", "sidecar_only"]
  },
  {
    kind: "sha256_verify",
    label: "SHA256 Verify",
    supportedExtensions: ["*"],
    sidecarOutputs: ["sha256_report_json"],
    riskZone: "Z2",
    requiresPrivateStorage: true,
    requiresSha256: false,
    requiresFounderApprovalForSourceTruth: true,
    originalMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    notes: ["Verify file identity and produce SHA256 report sidecar."],
    auditTags: ["python_worker", "sha256", "verification", "sidecar_only"]
  },
  {
    kind: "telemetry_timeseries_profile",
    label: "Telemetry Time-Series Profile",
    supportedExtensions: ["csv", "xlsx", "json", "parquet"],
    sidecarOutputs: ["metadata_json", "telemetry_profile_json"],
    riskZone: "Z3",
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresFounderApprovalForSourceTruth: true,
    originalMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    notes: ["Profile telemetry files for pressure, flow, level and anomaly-prep sidecars. No SCADA write."],
    auditTags: ["python_worker", "telemetry", "timeseries", "read_only"]
  },
  {
    kind: "hydraulic_epanet_prepare",
    label: "Hydraulic / EPANET Prepare",
    supportedExtensions: ["inp", "json", "csv", "xlsx"],
    sidecarOutputs: ["metadata_json", "hydraulic_prepare_json"],
    riskZone: "Z4",
    requiresPrivateStorage: true,
    requiresSha256: true,
    requiresFounderApprovalForSourceTruth: true,
    originalMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    notes: ["Prepare hydraulic model sidecars for future EPANET/OpenFlows-style adapters. No production simulation yet."],
    auditTags: ["python_worker", "hydraulic", "epanet", "adapter_required"]
  }
];

function text(value: unknown): string {
  return String(value || "").trim();
}

function lower(value: unknown): string {
  return text(value).toLowerCase();
}

function extensionFromFilename(filename: string): string {
  const clean = filename.split("?")[0] ?? "";
  const parts = clean.split(".");
  return parts.length > 1 ? lower(parts[parts.length - 1]) : "";
}

export function normalizePantavionPythonWorkerJobKind(
  value: unknown
): PantavionPythonWorkerJobKind {
  const raw = text(value);

  const allowed: PantavionPythonWorkerJobKind[] = [
    "excel_xlsx_parse",
    "csv_profile",
    "pdf_text_extract",
    "pdf_ocr_extract",
    "docx_text_extract",
    "image_ocr_extract",
    "gis_spatial_index",
    "cad_text_index",
    "sha256_verify",
    "telemetry_timeseries_profile",
    "hydraulic_epanet_prepare",
    "unknown"
  ];

  return allowed.includes(raw as PantavionPythonWorkerJobKind)
    ? (raw as PantavionPythonWorkerJobKind)
    : "unknown";
}

export function listPantavionPythonWorkerJobDefinitions(): PantavionPythonWorkerJobDefinition[] {
  return PANTAVION_PYTHON_WORKER_JOB_DEFINITIONS.map((definition) => ({
    ...definition,
    supportedExtensions: [...definition.supportedExtensions],
    sidecarOutputs: [...definition.sidecarOutputs],
    notes: [...definition.notes],
    auditTags: [...definition.auditTags]
  }));
}

export function getPantavionPythonWorkerJobDefinition(
  kind: PantavionPythonWorkerJobKind
): PantavionPythonWorkerJobDefinition | null {
  return PANTAVION_PYTHON_WORKER_JOB_DEFINITIONS.find((definition) => definition.kind === kind) ?? null;
}

export function assessPantavionPythonWorkerRuntime(
  input: PantavionPythonWorkerRuntimeInput
): PantavionPythonWorkerRuntimeAssessment {
  const jobKind = normalizePantavionPythonWorkerJobKind(input.jobKind ?? "unknown");
  const definition = getPantavionPythonWorkerJobDefinition(jobKind);
  const filename = text(input.filename);
  const extension = lower(input.extension || extensionFromFilename(filename));
  const artifactId = text(input.artifactId);
  const sourceTruth = Boolean(input.sourceTruth);
  const sensitive = Boolean(input.sensitive);
  const production = Boolean(input.production);

  const unsupportedJobKind = jobKind === "unknown" || !definition;
  const extensionAllowed =
    Boolean(definition?.supportedExtensions.includes("*")) ||
    Boolean(definition?.supportedExtensions.includes(extension));

  const requiresFounderApproval = sourceTruth || sensitive || production || jobKind === "cad_text_index" || jobKind === "hydraulic_epanet_prepare";
  const missingPrivateStorage = !input.privateStorageVerified;
  const missingFounderApproval = requiresFounderApproval && !input.founderApproved;
  const missingWorkerRuntime = !input.workerRuntimeAvailable || !input.sandboxAvailable;

  const blocked = unsupportedJobKind || (Boolean(definition) && !extensionAllowed);

  let status: PantavionPythonWorkerRuntimeStatus = "ready_to_register";

  if (blocked) {
    status = "blocked";
  } else if (missingFounderApproval) {
    status = "requires_founder_approval";
  } else if (missingPrivateStorage) {
    status = "requires_private_storage";
  } else if (missingWorkerRuntime) {
    status = "requires_worker_runtime";
  }

  const canRegisterJob =
    !blocked &&
    artifactId.length > 0 &&
    filename.length > 0 &&
    Boolean(input.privateStorageVerified) &&
    (!requiresFounderApproval || Boolean(input.founderApproved));

  const notes: string[] = [
    "Python worker runtime is contract-gated. This patch registers jobs but does not execute Python code yet.",
    "Original artifacts are immutable. Original DWG/source truth is never mutated.",
    "Worker outputs must be sidecar files only.",
    "Execution requires a later sandboxed worker, queue, timeout, retry and resource-limit implementation.",
    "No SCADA write and no physical infrastructure control are allowed."
  ];

  if (unsupportedJobKind) {
    notes.push("Unsupported Python worker job kind.");
  }

  if (definition && !extensionAllowed) {
    notes.push(`Extension ${extension || "(missing)"} is not allowed for ${definition.label}.`);
  }

  if (missingFounderApproval) {
    notes.push("Founder approval is required for source-truth, sensitive, production, CAD/DWG or hydraulic worker jobs.");
  }

  if (missingPrivateStorage) {
    notes.push("Private storage verification is required before registering a worker job.");
  }

  if (missingWorkerRuntime) {
    notes.push("Python worker runtime and sandbox are not available yet. Job may be registered pending worker implementation after gates pass.");
  }

  return {
    ok: true,
    requestId: `python_worker_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    jobId: text(input.jobId) || undefined,
    jobKind,
    artifactId: artifactId || undefined,
    filename: filename || undefined,
    extension,
    status,
    riskZone: definition?.riskZone ?? "Z4",
    sourceTruth,
    sensitive,
    production,
    requiresPrivateStorage: true,
    requiresSha256: Boolean(definition?.requiresSha256),
    requiresFounderApproval,
    requiresWorkerRuntime: true,
    requiresSandbox: true,
    requiresAudit: true,
    originalMutationAllowed: false,
    originalDwgMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    canRegisterJob,
    canExecuteNow: false,
    blocked,
    sidecarOutputs: definition?.sidecarOutputs ?? ["unknown"],
    notes,
    auditTags: [
      "python_worker_runtime",
      jobKind,
      definition?.riskZone ?? "Z4",
      status,
      blocked ? "blocked" : "allowed",
      "sidecar_only",
      "no_original_mutation",
      "no_original_dwg_mutation",
      "no_scada_write"
    ],
    assessedAt: new Date().toISOString()
  };
}
