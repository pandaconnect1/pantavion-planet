export type PantavionWaterAssetKind =
  | "SV"
  | "FH"
  | "PRV"
  | "DMA"
  | "PIPE"
  | "METER"
  | "PUMP"
  | "TANK"
  | "RESERVOIR"
  | "TELEMETRY"
  | "UNKNOWN";

export type PantavionWaterAssetCondition =
  | "normal"
  | "temporary_closed_fault"
  | "permanent_closed"
  | "opened_after_repair"
  | "problem_detected"
  | "defective_operable"
  | "defective_inoperable"
  | "replacement_required"
  | "replaced_pending_verification"
  | "lost_or_covered"
  | "field_verification_required"
  | "unknown";

export type PantavionWaterAssetRegistryStatus =
  | "ready_to_register"
  | "requires_field_verification"
  | "requires_work_order"
  | "metadata_only"
  | "blocked";

export type PantavionWaterAssetTypeDefinition = {
  kind: PantavionWaterAssetKind;
  label: string;
  supportsOperationalOverlay: boolean;
  supportsTelemetry: boolean;
  supportsHydraulicModel: boolean;
  supportsIsolationPlanning: boolean;
  requiresFieldVerification: boolean;
  requiredIdentifiers: string[];
  conditionStates: PantavionWaterAssetCondition[];
  notes: string[];
  auditTags: string[];
};

export type PantavionWaterAssetRegistryInput = {
  assetId?: string;
  kind?: PantavionWaterAssetKind | string;
  displayName?: string;
  condition?: PantavionWaterAssetCondition | string;
  zoneId?: string;
  dmaId?: string;
  roadName?: string;
  sourceDwgBindingId?: string;
  sourceLayerName?: string;
  sourceBlockName?: string;
  latitude?: number;
  longitude?: number;
  mapX?: number;
  mapY?: number;
  telemetryPointIds?: string[];
  workOrderIds?: string[];
  photoRefs?: string[];
  sourceTruth?: boolean;
  fieldVerified?: boolean;
  supervisorReviewed?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionWaterAssetRegistryAssessment = {
  ok: true;
  requestId: string;
  assetId?: string;
  kind: PantavionWaterAssetKind;
  condition: PantavionWaterAssetCondition;
  status: PantavionWaterAssetRegistryStatus;
  sourceTruth: boolean;
  matchedDefinition: boolean;
  supportsOperationalOverlay: boolean;
  supportsTelemetry: boolean;
  supportsHydraulicModel: boolean;
  supportsIsolationPlanning: boolean;
  requiresFieldVerification: boolean;
  requiresWorkOrder: boolean;
  requiresSupervisorReview: boolean;
  requiresAudit: true;
  originalDwgMutationAllowed: false;
  sourceDwgReferenceOnly: true;
  physicalControlAllowed: false;
  scadaWriteAllowed: false;
  canRegisterMetadata: boolean;
  canBindToOperationalOverlay: boolean;
  canBindToTelemetry: boolean;
  canBindToHydraulicModel: boolean;
  blocked: boolean;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

export type PantavionWaterAssetRecord = {
  id: string;
  assetId: string;
  kind: PantavionWaterAssetKind;
  displayName?: string;
  condition: PantavionWaterAssetCondition;
  zoneId?: string;
  dmaId?: string;
  roadName?: string;
  sourceDwgBindingId?: string;
  sourceLayerName?: string;
  sourceBlockName?: string;
  latitude?: number;
  longitude?: number;
  mapX?: number;
  mapY?: number;
  telemetryPointIds: string[];
  workOrderIds: string[];
  photoRefs: string[];
  sourceTruth: boolean;
  fieldVerified: boolean;
  supervisorReviewed: boolean;
  originalDwgMutationAllowed: false;
  sourceDwgReferenceOnly: true;
  physicalControlAllowed: false;
  scadaWriteAllowed: false;
  createdAt: string;
  updatedAt: string;
  actor?: string;
  reason?: string;
};

export const PANTAVION_WATER_ASSET_TYPE_REGISTRY: PantavionWaterAssetTypeDefinition[] = [
  {
    kind: "SV",
    label: "Sluice / Section Valve",
    supportsOperationalOverlay: true,
    supportsTelemetry: false,
    supportsHydraulicModel: true,
    supportsIsolationPlanning: true,
    requiresFieldVerification: true,
    requiredIdentifiers: ["assetId"],
    conditionStates: [
      "normal",
      "temporary_closed_fault",
      "permanent_closed",
      "opened_after_repair",
      "problem_detected",
      "defective_operable",
      "defective_inoperable",
      "replacement_required",
      "replaced_pending_verification",
      "lost_or_covered",
      "field_verification_required",
      "unknown"
    ],
    notes: [
      "SV assets drive isolation planning, closure/opening overlays, defect tracking, replacement history, and lost/covered field investigation."
    ],
    auditTags: ["water_asset", "sv", "valve", "isolation", "overlay"]
  },
  {
    kind: "FH",
    label: "Fire Hydrant",
    supportsOperationalOverlay: true,
    supportsTelemetry: false,
    supportsHydraulicModel: true,
    supportsIsolationPlanning: true,
    requiresFieldVerification: true,
    requiredIdentifiers: ["assetId"],
    conditionStates: ["normal", "problem_detected", "field_verification_required", "unknown"],
    notes: ["FH assets are affected by isolation plans, pressure zones, complaints, and field inspections."],
    auditTags: ["water_asset", "fh", "hydrant"]
  },
  {
    kind: "PRV",
    label: "Pressure Reducing Valve",
    supportsOperationalOverlay: true,
    supportsTelemetry: true,
    supportsHydraulicModel: true,
    supportsIsolationPlanning: true,
    requiresFieldVerification: true,
    requiredIdentifiers: ["assetId"],
    conditionStates: [
      "normal",
      "problem_detected",
      "defective_operable",
      "defective_inoperable",
      "replacement_required",
      "field_verification_required",
      "unknown"
    ],
    notes: ["PRV assets connect pressure zones, telemetry, hydraulic model behaviour, and fault diagnosis."],
    auditTags: ["water_asset", "prv", "pressure", "telemetry"]
  },
  {
    kind: "DMA",
    label: "District Metered Area",
    supportsOperationalOverlay: true,
    supportsTelemetry: true,
    supportsHydraulicModel: true,
    supportsIsolationPlanning: true,
    requiresFieldVerification: false,
    requiredIdentifiers: ["assetId"],
    conditionStates: ["normal", "problem_detected", "field_verification_required", "unknown"],
    notes: ["DMA assets group zones, telemetry meters, leak detection, pressure areas, and customer impact analysis."],
    auditTags: ["water_asset", "dma", "zone", "telemetry"]
  },
  {
    kind: "PIPE",
    label: "Pipe / Main",
    supportsOperationalOverlay: true,
    supportsTelemetry: false,
    supportsHydraulicModel: true,
    supportsIsolationPlanning: true,
    requiresFieldVerification: false,
    requiredIdentifiers: ["assetId"],
    conditionStates: ["normal", "problem_detected", "replacement_required", "field_verification_required", "unknown"],
    notes: ["Pipe assets connect source DWG geometry, hydraulic model edges, fault isolation, and repair history."],
    auditTags: ["water_asset", "pipe", "hydraulic_model"]
  },
  {
    kind: "METER",
    label: "Meter",
    supportsOperationalOverlay: true,
    supportsTelemetry: true,
    supportsHydraulicModel: false,
    supportsIsolationPlanning: false,
    requiresFieldVerification: true,
    requiredIdentifiers: ["assetId"],
    conditionStates: ["normal", "problem_detected", "field_verification_required", "unknown"],
    notes: ["Meter assets can link customers, telemetry, readings, and complaints."],
    auditTags: ["water_asset", "meter", "telemetry"]
  },
  {
    kind: "PUMP",
    label: "Pump / Pump Station",
    supportsOperationalOverlay: true,
    supportsTelemetry: true,
    supportsHydraulicModel: true,
    supportsIsolationPlanning: true,
    requiresFieldVerification: true,
    requiredIdentifiers: ["assetId"],
    conditionStates: ["normal", "problem_detected", "defective_inoperable", "replacement_required", "unknown"],
    notes: ["Pump assets support telemetry, hydraulic model state, alarms, and work orders."],
    auditTags: ["water_asset", "pump", "telemetry", "hydraulic_model"]
  },
  {
    kind: "TANK",
    label: "Tank",
    supportsOperationalOverlay: true,
    supportsTelemetry: true,
    supportsHydraulicModel: true,
    supportsIsolationPlanning: true,
    requiresFieldVerification: true,
    requiredIdentifiers: ["assetId"],
    conditionStates: ["normal", "problem_detected", "field_verification_required", "unknown"],
    notes: ["Tank assets support level telemetry, hydraulic model boundaries, and pressure zone operation."],
    auditTags: ["water_asset", "tank", "telemetry", "hydraulic_model"]
  },
  {
    kind: "RESERVOIR",
    label: "Reservoir",
    supportsOperationalOverlay: true,
    supportsTelemetry: true,
    supportsHydraulicModel: true,
    supportsIsolationPlanning: true,
    requiresFieldVerification: true,
    requiredIdentifiers: ["assetId"],
    conditionStates: ["normal", "problem_detected", "field_verification_required", "unknown"],
    notes: ["Reservoir assets support storage, supply zones, telemetry, and operational status."],
    auditTags: ["water_asset", "reservoir", "telemetry", "hydraulic_model"]
  },
  {
    kind: "TELEMETRY",
    label: "Telemetry Point / Logger / SCADA Tag",
    supportsOperationalOverlay: false,
    supportsTelemetry: true,
    supportsHydraulicModel: true,
    supportsIsolationPlanning: false,
    requiresFieldVerification: false,
    requiredIdentifiers: ["assetId"],
    conditionStates: ["normal", "problem_detected", "field_verification_required", "unknown"],
    notes: ["Telemetry assets are read/status bindings only at this stage. No SCADA write is allowed."],
    auditTags: ["water_asset", "telemetry", "read_only", "no_scada_write"]
  }
];

function text(value: unknown): string {
  return String(value || "").trim();
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizePantavionWaterAssetKind(value: unknown): PantavionWaterAssetKind {
  const raw = text(value).toUpperCase();

  const allowed: PantavionWaterAssetKind[] = [
    "SV",
    "FH",
    "PRV",
    "DMA",
    "PIPE",
    "METER",
    "PUMP",
    "TANK",
    "RESERVOIR",
    "TELEMETRY"
  ];

  return allowed.includes(raw as PantavionWaterAssetKind)
    ? (raw as PantavionWaterAssetKind)
    : "UNKNOWN";
}

export function normalizePantavionWaterAssetCondition(value: unknown): PantavionWaterAssetCondition {
  const raw = text(value);

  const allowed: PantavionWaterAssetCondition[] = [
    "normal",
    "temporary_closed_fault",
    "permanent_closed",
    "opened_after_repair",
    "problem_detected",
    "defective_operable",
    "defective_inoperable",
    "replacement_required",
    "replaced_pending_verification",
    "lost_or_covered",
    "field_verification_required",
    "unknown"
  ];

  return allowed.includes(raw as PantavionWaterAssetCondition)
    ? (raw as PantavionWaterAssetCondition)
    : "unknown";
}

export function listPantavionWaterAssetTypeRegistry(): PantavionWaterAssetTypeDefinition[] {
  return PANTAVION_WATER_ASSET_TYPE_REGISTRY.map((definition) => ({
    ...definition,
    requiredIdentifiers: [...definition.requiredIdentifiers],
    conditionStates: [...definition.conditionStates],
    notes: [...definition.notes],
    auditTags: [...definition.auditTags]
  }));
}

export function getPantavionWaterAssetTypeDefinition(
  kind: PantavionWaterAssetKind
): PantavionWaterAssetTypeDefinition | null {
  return PANTAVION_WATER_ASSET_TYPE_REGISTRY.find((definition) => definition.kind === kind) ?? null;
}

export function normalizePantavionWaterAssetStringArray(value: unknown): string[] {
  return stringArray(value);
}

export function assessPantavionWaterAssetRegistration(
  input: PantavionWaterAssetRegistryInput
): PantavionWaterAssetRegistryAssessment {
  const assetId = text(input.assetId);
  const kind = normalizePantavionWaterAssetKind(input.kind ?? "UNKNOWN");
  const condition = normalizePantavionWaterAssetCondition(input.condition ?? "unknown");
  const definition = getPantavionWaterAssetTypeDefinition(kind);

  const missingAssetId = assetId.length === 0;
  const unsupportedKind = kind === "UNKNOWN" || !definition;

  const hasCoordinate =
    (validNumber(input.latitude) && validNumber(input.longitude)) ||
    (validNumber(input.mapX) && validNumber(input.mapY));

  const sourceTruth = Boolean(input.sourceTruth);

  const conditionNeedsWorkOrder =
    condition === "temporary_closed_fault" ||
    condition === "permanent_closed" ||
    condition === "problem_detected" ||
    condition === "defective_operable" ||
    condition === "defective_inoperable" ||
    condition === "replacement_required" ||
    condition === "replaced_pending_verification" ||
    condition === "lost_or_covered";

  const replacementOrPermanent =
    condition === "permanent_closed" ||
    condition === "defective_inoperable" ||
    condition === "replacement_required" ||
    condition === "replaced_pending_verification";

  const requiresFieldVerification =
    Boolean(definition?.requiresFieldVerification) ||
    condition === "lost_or_covered" ||
    condition === "field_verification_required" ||
    replacementOrPermanent;

  const requiresWorkOrder = conditionNeedsWorkOrder;
  const requiresSupervisorReview =
    replacementOrPermanent ||
    condition === "lost_or_covered";

  const blocked = missingAssetId || unsupportedKind;

  const status: PantavionWaterAssetRegistryStatus = blocked
    ? "blocked"
    : requiresWorkOrder && input.workOrderIds?.length === 0
      ? "requires_work_order"
      : requiresFieldVerification && !input.fieldVerified
        ? "requires_field_verification"
        : hasCoordinate || sourceTruth
          ? "ready_to_register"
          : "metadata_only";

  const notes: string[] = [
    "Asset registry stores operational metadata only. It must never mutate original DWG entities, colors, layers, blocks, text, or labels.",
    "SCADA/telemetry is read/status binding only at this stage. No SCADA write is allowed.",
    "Physical valve control is not allowed.",
    "Source DWG is referenced, not edited."
  ];

  if (missingAssetId) {
    notes.push("Asset id is required.");
  }

  if (unsupportedKind) {
    notes.push("Unsupported water asset kind.");
  }

  if (!hasCoordinate) {
    notes.push("No coordinate/map position provided yet. Asset may be registered as metadata-only until spatial binding is available.");
  }

  if (condition === "lost_or_covered") {
    notes.push("Lost/covered assets require field investigation and may be shown with cyan dashed ring plus white hatch overlay on Surface C.");
  }

  if (condition === "replacement_required" || condition === "defective_inoperable") {
    notes.push("Replacement/inoperable state requires work order and supervisor review.");
  }

  if (requiresFieldVerification && !input.fieldVerified) {
    notes.push("Field verification is required or recommended before closing this asset workflow.");
  }

  return {
    ok: true,
    requestId: `water_asset_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    assetId: assetId || undefined,
    kind,
    condition,
    status,
    sourceTruth,
    matchedDefinition: Boolean(definition),
    supportsOperationalOverlay: Boolean(definition?.supportsOperationalOverlay),
    supportsTelemetry: Boolean(definition?.supportsTelemetry),
    supportsHydraulicModel: Boolean(definition?.supportsHydraulicModel),
    supportsIsolationPlanning: Boolean(definition?.supportsIsolationPlanning),
    requiresFieldVerification,
    requiresWorkOrder,
    requiresSupervisorReview,
    requiresAudit: true,
    originalDwgMutationAllowed: false,
    sourceDwgReferenceOnly: true,
    physicalControlAllowed: false,
    scadaWriteAllowed: false,
    canRegisterMetadata: !blocked,
    canBindToOperationalOverlay: !blocked && Boolean(definition?.supportsOperationalOverlay),
    canBindToTelemetry: !blocked && Boolean(definition?.supportsTelemetry),
    canBindToHydraulicModel: !blocked && Boolean(definition?.supportsHydraulicModel),
    blocked,
    notes,
    auditTags: [
      "water_asset_registry",
      kind.toLowerCase(),
      condition,
      status,
      blocked ? "blocked" : "allowed",
      "no_original_dwg_mutation",
      "no_scada_write",
      "no_physical_control"
    ],
    assessedAt: new Date().toISOString()
  };
}
