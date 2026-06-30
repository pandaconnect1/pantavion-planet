import {
  normalizePantavionWaterAssetKind,
  type PantavionWaterAssetKind
} from "./water-asset-registry";

export type PantavionWaterWorkOrderKind =
  | "fault"
  | "repair"
  | "replacement"
  | "inspection"
  | "lost_covered_investigation"
  | "telemetry_check"
  | "hydraulic_check"
  | "as_built_verification"
  | "unknown";

export type PantavionWaterWorkOrderStatus =
  | "draft"
  | "open"
  | "assigned"
  | "in_progress"
  | "field_verified"
  | "repair_completed"
  | "replacement_completed"
  | "closed"
  | "blocked";

export type PantavionWaterWorkOrderPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent"
  | "critical";

export type PantavionWaterFieldVerificationStatus =
  | "not_required"
  | "required"
  | "pending"
  | "verified"
  | "rejected";

export type PantavionWaterWorkOrderRegistryStatus =
  | "ready_to_register"
  | "requires_asset_link"
  | "requires_field_verification"
  | "requires_supervisor_review"
  | "requires_photo_refs"
  | "requires_telemetry_refs"
  | "metadata_only"
  | "blocked";

export type PantavionWaterWorkOrderRegistryInput = {
  workOrderId?: string;
  assetId?: string;
  assetKind?: PantavionWaterAssetKind | string;
  kind?: PantavionWaterWorkOrderKind | string;
  status?: PantavionWaterWorkOrderStatus | string;
  priority?: PantavionWaterWorkOrderPriority | string;
  title?: string;
  faultId?: string;
  crewId?: string;
  assignedTo?: string[];
  photoRefs?: string[];
  materialRefs?: string[];
  telemetryPointIds?: string[];
  relatedWorkOrderIds?: string[];
  roadName?: string;
  zoneId?: string;
  dmaId?: string;
  sourceDwgBindingId?: string;
  fieldNotes?: string;
  repairNotes?: string;
  replacementNotes?: string;
  fieldVerified?: boolean;
  supervisorReviewed?: boolean;
  replacementRequired?: boolean;
  repairCompleted?: boolean;
  actor?: string;
  reason?: string;
};

export type PantavionWaterWorkOrderAssessment = {
  ok: true;
  requestId: string;
  workOrderId?: string;
  assetId?: string;
  assetKind: PantavionWaterAssetKind;
  kind: PantavionWaterWorkOrderKind;
  status: PantavionWaterWorkOrderStatus;
  priority: PantavionWaterWorkOrderPriority;
  registryStatus: PantavionWaterWorkOrderRegistryStatus;
  fieldVerificationStatus: PantavionWaterFieldVerificationStatus;
  requiresAssetRegistryLink: boolean;
  requiresFieldVerification: boolean;
  requiresSupervisorReview: boolean;
  requiresPhotoRefs: boolean;
  requiresTelemetryRefs: boolean;
  requiresAudit: true;
  originalDwgMutationAllowed: false;
  sourceDwgReferenceOnly: true;
  physicalControlAllowed: false;
  scadaWriteAllowed: false;
  telemetryReadOnly: true;
  canRegisterWorkOrder: boolean;
  canCloseWorkOrder: boolean;
  blocked: boolean;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

export type PantavionWaterWorkOrderRecord = {
  id: string;
  workOrderId: string;
  assetId: string;
  assetKind: PantavionWaterAssetKind;
  kind: PantavionWaterWorkOrderKind;
  status: PantavionWaterWorkOrderStatus;
  priority: PantavionWaterWorkOrderPriority;
  title?: string;
  faultId?: string;
  crewId?: string;
  assignedTo: string[];
  photoRefs: string[];
  materialRefs: string[];
  telemetryPointIds: string[];
  relatedWorkOrderIds: string[];
  roadName?: string;
  zoneId?: string;
  dmaId?: string;
  sourceDwgBindingId?: string;
  fieldNotes?: string;
  repairNotes?: string;
  replacementNotes?: string;
  fieldVerified: boolean;
  supervisorReviewed: boolean;
  replacementRequired: boolean;
  repairCompleted: boolean;
  originalDwgMutationAllowed: false;
  sourceDwgReferenceOnly: true;
  physicalControlAllowed: false;
  scadaWriteAllowed: false;
  telemetryReadOnly: true;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  actor?: string;
  reason?: string;
};

function text(value: unknown): string {
  return String(value || "").trim();
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function normalizePantavionWaterWorkOrderKind(
  value: unknown
): PantavionWaterWorkOrderKind {
  const raw = text(value);

  const allowed: PantavionWaterWorkOrderKind[] = [
    "fault",
    "repair",
    "replacement",
    "inspection",
    "lost_covered_investigation",
    "telemetry_check",
    "hydraulic_check",
    "as_built_verification",
    "unknown"
  ];

  return allowed.includes(raw as PantavionWaterWorkOrderKind)
    ? (raw as PantavionWaterWorkOrderKind)
    : "unknown";
}

export function normalizePantavionWaterWorkOrderStatus(
  value: unknown
): PantavionWaterWorkOrderStatus {
  const raw = text(value);

  const allowed: PantavionWaterWorkOrderStatus[] = [
    "draft",
    "open",
    "assigned",
    "in_progress",
    "field_verified",
    "repair_completed",
    "replacement_completed",
    "closed",
    "blocked"
  ];

  return allowed.includes(raw as PantavionWaterWorkOrderStatus)
    ? (raw as PantavionWaterWorkOrderStatus)
    : "draft";
}

export function normalizePantavionWaterWorkOrderPriority(
  value: unknown
): PantavionWaterWorkOrderPriority {
  const raw = text(value);

  const allowed: PantavionWaterWorkOrderPriority[] = [
    "low",
    "normal",
    "high",
    "urgent",
    "critical"
  ];

  return allowed.includes(raw as PantavionWaterWorkOrderPriority)
    ? (raw as PantavionWaterWorkOrderPriority)
    : "normal";
}

export function normalizePantavionWaterWorkOrderStringArray(value: unknown): string[] {
  return stringArray(value);
}

export function assessPantavionWaterWorkOrder(
  input: PantavionWaterWorkOrderRegistryInput
): PantavionWaterWorkOrderAssessment {
  const workOrderId = text(input.workOrderId);
  const assetId = text(input.assetId);
  const assetKind = normalizePantavionWaterAssetKind(input.assetKind ?? "UNKNOWN");
  const kind = normalizePantavionWaterWorkOrderKind(input.kind ?? "unknown");
  const status = normalizePantavionWaterWorkOrderStatus(input.status ?? "draft");
  const priority = normalizePantavionWaterWorkOrderPriority(input.priority ?? "normal");

  const photoRefs = stringArray(input.photoRefs);
  const telemetryPointIds = stringArray(input.telemetryPointIds);

  const missingWorkOrderId = workOrderId.length === 0;
  const missingAssetId = assetId.length === 0;
  const unsupportedAssetKind = assetKind === "UNKNOWN";
  const unsupportedWorkOrderKind = kind === "unknown";

  const requiresFieldVerification =
    kind === "fault" ||
    kind === "repair" ||
    kind === "replacement" ||
    kind === "inspection" ||
    kind === "lost_covered_investigation" ||
    kind === "as_built_verification" ||
    status === "field_verified" ||
    status === "repair_completed" ||
    status === "replacement_completed" ||
    status === "closed";

  const requiresSupervisorReview =
    kind === "replacement" ||
    kind === "lost_covered_investigation" ||
    kind === "as_built_verification" ||
    Boolean(input.replacementRequired) ||
    status === "replacement_completed" ||
    status === "closed";

  const requiresPhotoRefs =
    kind === "repair" ||
    kind === "replacement" ||
    kind === "lost_covered_investigation" ||
    kind === "as_built_verification";

  const requiresTelemetryRefs =
    kind === "telemetry_check" ||
    kind === "hydraulic_check";

  const fieldVerificationStatus: PantavionWaterFieldVerificationStatus =
    !requiresFieldVerification
      ? "not_required"
      : input.fieldVerified
        ? "verified"
        : "pending";

  const blocked =
    missingAssetId ||
    unsupportedAssetKind ||
    unsupportedWorkOrderKind ||
    status === "blocked";

  let registryStatus: PantavionWaterWorkOrderRegistryStatus = "ready_to_register";

  if (blocked) {
    registryStatus = "blocked";
  } else if (missingWorkOrderId) {
    registryStatus = "metadata_only";
  } else if (missingAssetId) {
    registryStatus = "requires_asset_link";
  } else if (requiresPhotoRefs && photoRefs.length === 0) {
    registryStatus = "requires_photo_refs";
  } else if (requiresTelemetryRefs && telemetryPointIds.length === 0) {
    registryStatus = "requires_telemetry_refs";
  } else if (requiresFieldVerification && !input.fieldVerified) {
    registryStatus = "requires_field_verification";
  } else if (requiresSupervisorReview && !input.supervisorReviewed) {
    registryStatus = "requires_supervisor_review";
  }

  const canRegisterWorkOrder =
    !blocked &&
    !missingWorkOrderId &&
    !missingAssetId;

  const canCloseWorkOrder =
    canRegisterWorkOrder &&
    (status === "closed" ||
      status === "field_verified" ||
      status === "repair_completed" ||
      status === "replacement_completed") &&
    (!requiresFieldVerification || Boolean(input.fieldVerified)) &&
    (!requiresSupervisorReview || Boolean(input.supervisorReviewed));

  const notes: string[] = [
    "Work orders link faults, repairs, replacement, photos, crews, field verification and asset history.",
    "This registry never mutates original DWG source truth.",
    "Source DWG is referenced only.",
    "No physical valve control is allowed.",
    "No SCADA write is allowed.",
    "Telemetry references are read/status bindings only at this stage."
  ];

  if (missingWorkOrderId) {
    notes.push("Work order id is required before persistent registration.");
  }

  if (missingAssetId) {
    notes.push("Asset id is required to bind the work order to SV/FH/PRV/DMA/pipe or telemetry assets.");
  }

  if (unsupportedAssetKind) {
    notes.push("Unsupported asset kind.");
  }

  if (unsupportedWorkOrderKind) {
    notes.push("Unsupported work order kind.");
  }

  if (requiresPhotoRefs && photoRefs.length === 0) {
    notes.push("Photo references are required or recommended for repair, replacement, lost/covered investigation or as-built verification.");
  }

  if (requiresTelemetryRefs && telemetryPointIds.length === 0) {
    notes.push("Telemetry point references are required for telemetry/hydraulic checks.");
  }

  if (requiresFieldVerification && !input.fieldVerified) {
    notes.push("Field verification is required before closing this workflow.");
  }

  if (requiresSupervisorReview && !input.supervisorReviewed) {
    notes.push("Supervisor review is required before final closure.");
  }

  return {
    ok: true,
    requestId: `water_work_order_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    workOrderId: workOrderId || undefined,
    assetId: assetId || undefined,
    assetKind,
    kind,
    status,
    priority,
    registryStatus,
    fieldVerificationStatus,
    requiresAssetRegistryLink: true,
    requiresFieldVerification,
    requiresSupervisorReview,
    requiresPhotoRefs,
    requiresTelemetryRefs,
    requiresAudit: true,
    originalDwgMutationAllowed: false,
    sourceDwgReferenceOnly: true,
    physicalControlAllowed: false,
    scadaWriteAllowed: false,
    telemetryReadOnly: true,
    canRegisterWorkOrder,
    canCloseWorkOrder,
    blocked,
    notes,
    auditTags: [
      "water_work_order_registry",
      kind,
      assetKind.toLowerCase(),
      status,
      priority,
      registryStatus,
      blocked ? "blocked" : "allowed",
      "field_verification",
      "photo_refs",
      "no_original_dwg_mutation",
      "no_scada_write",
      "no_physical_control"
    ],
    assessedAt: new Date().toISOString()
  };
}
