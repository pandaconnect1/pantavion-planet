export type PantavionWaterOperationalAssetKind =
  | "SV"
  | "FH"
  | "PRV"
  | "DMA"
  | "PIPE"
  | "METER"
  | "PUMP"
  | "TANK"
  | "TELEMETRY"
  | "UNKNOWN";

export type PantavionWaterOperationalSurface = "B" | "C";

export type PantavionWaterOperationalState =
  | "natural_open"
  | "closed_temporary_fault"
  | "closed_permanent"
  | "opened_after_repair"
  | "sv_problem_detected"
  | "sv_defective_operable"
  | "sv_defective_inoperable"
  | "sv_replacement_required"
  | "sv_replaced_pending_verification"
  | "sv_lost_or_covered"
  | "field_verification_required"
  | "unknown";

export type PantavionWaterOperationalAction =
  | "mark_closed_fault"
  | "mark_closed_permanent"
  | "mark_open_after_repair"
  | "restore_natural"
  | "restore_all_opened"
  | "mark_sv_problem"
  | "mark_sv_defective_operable"
  | "mark_sv_defective_inoperable"
  | "mark_sv_replacement_required"
  | "mark_sv_replaced_pending_verification"
  | "mark_sv_lost_or_covered"
  | "field_verify";

export type PantavionWaterOperationalOverlayShape =
  | "none"
  | "solid_marker"
  | "circle_ring"
  | "dashed_ring"
  | "dashed_ring_white_hatch"
  | "warning_badge";

export type PantavionWaterOperationalOverlayAdornment =
  | "none"
  | "white_hatch_lines"
  | "lost_badge";

export type PantavionWaterOperationalColorIntent =
  | "natural"
  | "blue_temporary_closed"
  | "red_permanent_closed"
  | "green_open_after_repair"
  | "amber_verify"
  | "orange_problem"
  | "purple_replacement_required"
  | "cyan_lost_covered_ring"
  | "gray_unknown";

export type PantavionWaterOperationalColorRule = {
  state: PantavionWaterOperationalState;
  colorIntent: PantavionWaterOperationalColorIntent;
  hex: string;
  label: string;
  overlayShape: PantavionWaterOperationalOverlayShape;
  overlayAdornment?: PantavionWaterOperationalOverlayAdornment;
  overlayActive: boolean;
  originalDwgMutationAllowed: false;
  replacementRequired: boolean;
  fieldInvestigationRequired: boolean;
  meaning: string;
};

export type PantavionWaterOperationalOverlayInput = {
  action?: PantavionWaterOperationalAction;
  assetId?: string;
  assetKind?: PantavionWaterOperationalAssetKind;
  surface?: PantavionWaterOperationalSurface | string;
  faultId?: string;
  workOrderId?: string;
  reason?: string;
  actor?: string;
  includePermanent?: boolean;
  fieldVerified?: boolean;
  supervisorReviewed?: boolean;
};

export type PantavionWaterOperationalOverlayAssessment = {
  ok: true;
  requestId: string;
  action: PantavionWaterOperationalAction;
  assetId?: string;
  assetKind: PantavionWaterOperationalAssetKind;
  surface: PantavionWaterOperationalSurface;
  nextState: PantavionWaterOperationalState;
  colorIntent: PantavionWaterOperationalColorIntent;
  hex: string;
  overlayShape: PantavionWaterOperationalOverlayShape;
  overlayAdornment?: PantavionWaterOperationalOverlayAdornment;
  overlayActive: boolean;
  originalDwgMutationAllowed: false;
  originalMapNaturalStateRestored: boolean;
  replacementRequired: boolean;
  lostOrCoveredInvestigationRequired: boolean;
  requiresWorkOrder: boolean;
  requiresFieldVerification: boolean;
  requiresSupervisorReview: boolean;
  requiresFounderApproval: boolean;
  requiresAudit: true;
  physicalValveControl: false;
  scadaWriteAllowed: false;
  allowedOnSurfaceB: false;
  allowedOnSurfaceC: true;
  canApplyOverlayState: boolean;
  blocked: boolean;
  notes: string[];
  auditTags: string[];
  assessedAt: string;
};

export type PantavionWaterOperationalOverlayRecord = {
  id: string;
  assetId: string;
  assetKind: PantavionWaterOperationalAssetKind;
  state: PantavionWaterOperationalState;
  colorIntent: PantavionWaterOperationalColorIntent;
  hex: string;
  overlayShape: PantavionWaterOperationalOverlayShape;
  overlayAdornment?: PantavionWaterOperationalOverlayAdornment;
  overlayActive: boolean;
  surface: PantavionWaterOperationalSurface;
  faultId?: string;
  workOrderId?: string;
  reason?: string;
  actor?: string;
  originalDwgMutationAllowed: false;
  physicalValveControl: false;
  scadaWriteAllowed: false;
  createdAt: string;
  updatedAt: string;
  clearedAt?: string;
};

export const PANTAVION_WATER_OPERATIONAL_COLOR_POLICY: PantavionWaterOperationalColorRule[] = [
  {
    state: "natural_open",
    colorIntent: "natural",
    hex: "none",
    label: "Natural map state",
    overlayShape: "none",
    overlayActive: false,
    originalDwgMutationAllowed: false,
    replacementRequired: false,
    fieldInvestigationRequired: false,
    meaning: "No overlay. Original DWG/map style remains visible."
  },
  {
    state: "closed_temporary_fault",
    colorIntent: "blue_temporary_closed",
    hex: "#2563eb",
    label: "Temporary closed for fault",
    overlayShape: "solid_marker",
    overlayActive: true,
    originalDwgMutationAllowed: false,
    replacementRequired: false,
    fieldInvestigationRequired: true,
    meaning: "Temporary SV closure during fault isolation or repair."
  },
  {
    state: "closed_permanent",
    colorIntent: "red_permanent_closed",
    hex: "#dc2626",
    label: "Permanent / locked closed",
    overlayShape: "solid_marker",
    overlayActive: true,
    originalDwgMutationAllowed: false,
    replacementRequired: false,
    fieldInvestigationRequired: true,
    meaning: "Permanent or administratively locked closed SV."
  },
  {
    state: "opened_after_repair",
    colorIntent: "green_open_after_repair",
    hex: "#16a34a",
    label: "Opened after repair",
    overlayShape: "solid_marker",
    overlayActive: true,
    originalDwgMutationAllowed: false,
    replacementRequired: false,
    fieldInvestigationRequired: true,
    meaning: "SV reopened after repair and pending restore to natural state."
  },
  {
    state: "sv_problem_detected",
    colorIntent: "orange_problem",
    hex: "#f97316",
    label: "SV problem detected",
    overlayShape: "warning_badge",
    overlayActive: true,
    originalDwgMutationAllowed: false,
    replacementRequired: false,
    fieldInvestigationRequired: true,
    meaning: "SV has a field problem and requires inspection."
  },
  {
    state: "sv_defective_operable",
    colorIntent: "amber_verify",
    hex: "#f59e0b",
    label: "SV defective but operable",
    overlayShape: "warning_badge",
    overlayActive: true,
    originalDwgMutationAllowed: false,
    replacementRequired: false,
    fieldInvestigationRequired: true,
    meaning: "SV has defect but can still operate with caution."
  },
  {
    state: "sv_defective_inoperable",
    colorIntent: "purple_replacement_required",
    hex: "#7c3aed",
    label: "SV defective and inoperable",
    overlayShape: "warning_badge",
    overlayActive: true,
    originalDwgMutationAllowed: false,
    replacementRequired: true,
    fieldInvestigationRequired: true,
    meaning: "SV is defective/inoperable and should be planned for replacement."
  },
  {
    state: "sv_replacement_required",
    colorIntent: "purple_replacement_required",
    hex: "#9333ea",
    label: "SV replacement required",
    overlayShape: "solid_marker",
    overlayActive: true,
    originalDwgMutationAllowed: false,
    replacementRequired: true,
    fieldInvestigationRequired: true,
    meaning: "SV requires replacement and a work order."
  },
  {
    state: "sv_replaced_pending_verification",
    colorIntent: "green_open_after_repair",
    hex: "#22c55e",
    label: "SV replaced pending verification",
    overlayShape: "circle_ring",
    overlayActive: true,
    originalDwgMutationAllowed: false,
    replacementRequired: false,
    fieldInvestigationRequired: true,
    meaning: "SV was replaced and needs field/as-built verification."
  },
  {
    state: "sv_lost_or_covered",
    colorIntent: "cyan_lost_covered_ring",
    hex: "#06b6d4",
    label: "SV lost / covered / buried / loose",
    overlayShape: "dashed_ring_white_hatch",
    overlayAdornment: "white_hatch_lines",
    overlayActive: true,
    originalDwgMutationAllowed: false,
    replacementRequired: false,
    fieldInvestigationRequired: true,
    meaning: "SV exists in records/DWG but appears lost, covered, buried, paved over, loose, or not visible in the field. It must be shown with a cyan dashed ring plus white internal hatch lines to avoid confusion with blue temporary closed SV."
  },
  {
    state: "field_verification_required",
    colorIntent: "amber_verify",
    hex: "#f59e0b",
    label: "Field verification required",
    overlayShape: "circle_ring",
    overlayActive: true,
    originalDwgMutationAllowed: false,
    replacementRequired: false,
    fieldInvestigationRequired: true,
    meaning: "Field confirmation is required before final state."
  },
  {
    state: "unknown",
    colorIntent: "gray_unknown",
    hex: "#6b7280",
    label: "Unknown",
    overlayShape: "circle_ring",
    overlayActive: true,
    originalDwgMutationAllowed: false,
    replacementRequired: false,
    fieldInvestigationRequired: true,
    meaning: "Operational state is unknown or not verified."
  }
];

function text(value: unknown): string {
  return String(value || "").trim();
}

export function normalizePantavionWaterAssetKind(value: unknown): PantavionWaterOperationalAssetKind {
  const raw = text(value).toUpperCase();

  if (
    raw === "SV" ||
    raw === "FH" ||
    raw === "PRV" ||
    raw === "DMA" ||
    raw === "PIPE" ||
    raw === "METER" ||
    raw === "PUMP" ||
    raw === "TANK" ||
    raw === "TELEMETRY"
  ) {
    return raw;
  }

  return "UNKNOWN";
}

export function normalizePantavionWaterOperationalSurface(
  value: unknown
): PantavionWaterOperationalSurface {
  return text(value).toUpperCase() === "B" ? "B" : "C";
}

export function normalizePantavionWaterOperationalAction(
  value: unknown
): PantavionWaterOperationalAction {
  const raw = text(value);

  const allowed: PantavionWaterOperationalAction[] = [
    "mark_closed_fault",
    "mark_closed_permanent",
    "mark_open_after_repair",
    "restore_natural",
    "restore_all_opened",
    "mark_sv_problem",
    "mark_sv_defective_operable",
    "mark_sv_defective_inoperable",
    "mark_sv_replacement_required",
    "mark_sv_replaced_pending_verification",
    "mark_sv_lost_or_covered",
    "field_verify"
  ];

  return allowed.includes(raw as PantavionWaterOperationalAction)
    ? (raw as PantavionWaterOperationalAction)
    : "mark_closed_fault";
}

export function getPantavionWaterOperationalStateForAction(
  action: PantavionWaterOperationalAction
): PantavionWaterOperationalState {
  const map: Record<PantavionWaterOperationalAction, PantavionWaterOperationalState> = {
    mark_closed_fault: "closed_temporary_fault",
    mark_closed_permanent: "closed_permanent",
    mark_open_after_repair: "opened_after_repair",
    restore_natural: "natural_open",
    restore_all_opened: "natural_open",
    mark_sv_problem: "sv_problem_detected",
    mark_sv_defective_operable: "sv_defective_operable",
    mark_sv_defective_inoperable: "sv_defective_inoperable",
    mark_sv_replacement_required: "sv_replacement_required",
    mark_sv_replaced_pending_verification: "sv_replaced_pending_verification",
    mark_sv_lost_or_covered: "sv_lost_or_covered",
    field_verify: "field_verification_required"
  };

  return map[action];
}

export function getPantavionWaterOperationalColorRule(
  state: PantavionWaterOperationalState
): PantavionWaterOperationalColorRule {
  return (
    PANTAVION_WATER_OPERATIONAL_COLOR_POLICY.find((rule) => rule.state === state) ??
    PANTAVION_WATER_OPERATIONAL_COLOR_POLICY[PANTAVION_WATER_OPERATIONAL_COLOR_POLICY.length - 1]
  );
}

export function listPantavionWaterOperationalColorPolicy(): PantavionWaterOperationalColorRule[] {
  return PANTAVION_WATER_OPERATIONAL_COLOR_POLICY.map((rule) => ({ ...rule }));
}

export function assessPantavionWaterOperationalOverlay(
  input: PantavionWaterOperationalOverlayInput
): PantavionWaterOperationalOverlayAssessment {
  const action = normalizePantavionWaterOperationalAction(input.action);
  const assetId = text(input.assetId);
  const assetKind = normalizePantavionWaterAssetKind(input.assetKind ?? "SV");
  const surface = normalizePantavionWaterOperationalSurface(input.surface ?? "C");
  const nextState = getPantavionWaterOperationalStateForAction(action);
  const colorRule = getPantavionWaterOperationalColorRule(nextState);

  const isBulkRestore = action === "restore_all_opened";
  const missingAsset = !isBulkRestore && assetId.length === 0;
  const surfaceBlocked = surface === "B";
  const permanentChange = action === "mark_closed_permanent" || Boolean(input.includePermanent);
  const replacementChange =
    nextState === "sv_replacement_required" ||
    nextState === "sv_defective_inoperable" ||
    nextState === "sv_replaced_pending_verification";

  const lostOrCovered = nextState === "sv_lost_or_covered";

  const requiresWorkOrder =
    nextState !== "natural_open" ||
    replacementChange ||
    lostOrCovered;

  const requiresSupervisorReview =
    permanentChange ||
    replacementChange ||
    lostOrCovered ||
    action === "restore_all_opened";

  const requiresFounderApproval = permanentChange;

  const blocked = missingAsset || surfaceBlocked;

  const notes: string[] = [
    "Operational state is overlay-only. It must never mutate original DWG colors, layers, blocks, or entities.",
    "This is not remote physical SV/valve control and does not write to SCADA.",
    "Surface B remains original DWG only. Operational overlays belong on Surface C.",
    "Every operational state change requires audit."
  ];

  if (nextState === "closed_temporary_fault") {
    notes.push("Blue means temporary closed SV for fault isolation or repair.");
  }

  if (nextState === "closed_permanent") {
    notes.push("Red means permanent or locked closed SV.");
  }

  if (nextState === "opened_after_repair") {
    notes.push("Green means opened after repair and pending restore to natural state.");
  }

  if (nextState === "sv_replacement_required") {
    notes.push("Purple means SV replacement required.");
  }

  if (nextState === "sv_lost_or_covered") {
    notes.push("Cyan dashed ring with white internal hatch lines means SV exists in records but is lost, covered, buried, paved over, loose, or not visible in the field.");
  }

  if (nextState === "natural_open") {
    notes.push("Natural state clears overlay and restores original map/DWG visual state.");
  }

  if (surfaceBlocked) {
    notes.push("Blocked on Surface B because B must remain original-only.");
  }

  if (missingAsset) {
    notes.push("Asset id is required for single-asset operational changes.");
  }

  if (requiresSupervisorReview && !input.supervisorReviewed) {
    notes.push("Supervisor review is required for permanent, replacement, lost/covered, or bulk restore workflows.");
  }

  if (colorRule.fieldInvestigationRequired && !input.fieldVerified) {
    notes.push("Field verification is required or recommended before closing the operational workflow.");
  }

  return {
    ok: true,
    requestId: `water_ops_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    action,
    assetId: assetId || undefined,
    assetKind,
    surface,
    nextState,
    colorIntent: colorRule.colorIntent,
    hex: colorRule.hex,
    overlayShape: colorRule.overlayShape,
    overlayAdornment: colorRule.overlayAdornment,
    overlayActive: colorRule.overlayActive,
    originalDwgMutationAllowed: false,
    originalMapNaturalStateRestored: nextState === "natural_open",
    replacementRequired: colorRule.replacementRequired,
    lostOrCoveredInvestigationRequired: lostOrCovered,
    requiresWorkOrder,
    requiresFieldVerification: colorRule.fieldInvestigationRequired,
    requiresSupervisorReview,
    requiresFounderApproval,
    requiresAudit: true,
    physicalValveControl: false,
    scadaWriteAllowed: false,
    allowedOnSurfaceB: false,
    allowedOnSurfaceC: true,
    canApplyOverlayState: !blocked,
    blocked,
    notes,
    auditTags: [
      "water_operational_overlay",
      action,
      assetKind.toLowerCase(),
      `surface_${surface.toLowerCase()}`,
      colorRule.colorIntent,
      colorRule.overlayShape,
      colorRule.overlayAdornment ?? "no_adornment",
      blocked ? "blocked" : "allowed",
      "no_original_dwg_mutation",
      "no_scada_write",
      "no_physical_valve_control"
    ],
    assessedAt: new Date().toISOString()
  };
}
