export type WaterMapViewMode =
  | "operational_map"
  | "master_map"
  | "terrain_elevation_map"
  | "satellite_building_map"
  | "pressure_risk_map"
  | "demand_growth_map"
  | "prv_candidate_map"
  | "valve_isolation_map"
  | "water_loss_map"
  | "map_change_proposal_map";

export type WaterMapViewerRole =
  | "public"
  | "resident"
  | "field_worker"
  | "supervisor"
  | "engineer"
  | "admin"
  | "founder";

export type WaterMapDataBoundary =
  | "public_safe"
  | "assigned_work_only"
  | "operational_safe_layer"
  | "zone_limited"
  | "engineering_sensitive"
  | "master_sensitive"
  | "founder_only";

export type WaterMapViewAccessDecision = {
  requestedMode: WaterMapViewMode;
  viewerRole: WaterMapViewerRole;
  canView: boolean;
  dataBoundary: WaterMapDataBoundary;
  requiresTrustedDevice: boolean;
  requiresFounderAdminSession: boolean;
  requiresEngineerReview: boolean;
  reason: string;
  warnings: string[];
  nextAction:
    | "open_view"
    | "request_admin_session"
    | "request_trusted_device"
    | "request_role_upgrade"
    | "request_engineer_review"
    | "deny";
};

export type WaterMapViewAccessInput = {
  requestedMode: WaterMapViewMode;
  viewerRole: WaterMapViewerRole;
  hasTrustedDevice?: boolean;
  hasFounderAdminSession?: boolean;
  hasEngineerApproval?: boolean;
  assignedZoneIds?: string[];
  requestedZoneId?: string;
};

export const WATER_MAP_VIEW_MODE_DOCTRINE = {
  title: "Pantavion Water Map View Mode Doctrine",
  purpose:
    "Το Pantavion Water πρέπει να επιτρέπει επιλογή προβολής χάρτη χωρίς να εκθέτει το master δίκτυο σε μη εγκεκριμένους χρήστες.",
  hardRules: [
    "Ο operational χάρτης μπορεί να δείχνει ασφαλές λειτουργικό layer.",
    "Ο master χάρτης δεν είναι δημόσιος.",
    "Ο master χάρτης εμφανίζεται μόνο σε founder/admin/engineer με σωστή πρόσβαση.",
    "Terrain, pressure risk, PRV και demand growth layers είναι engineering-sensitive.",
    "Κανένα AI layer δεν αλλάζει master χάρτη χωρίς founder/admin approval.",
    "Η προβολή μπορεί να είναι ανά περιοχή, ζώνη, οδό, εργασία ή ρόλο.",
  ],
} as const;

const ROLE_RANK: Record<WaterMapViewerRole, number> = {
  public: 0,
  resident: 1,
  field_worker: 2,
  supervisor: 3,
  engineer: 4,
  admin: 5,
  founder: 6,
};

const VIEW_POLICY: Record<
  WaterMapViewMode,
  {
    minimumRole: WaterMapViewerRole;
    dataBoundary: WaterMapDataBoundary;
    requiresTrustedDevice: boolean;
    requiresFounderAdminSession: boolean;
    requiresEngineerReview: boolean;
  }
> = {
  operational_map: {
    minimumRole: "field_worker",
    dataBoundary: "operational_safe_layer",
    requiresTrustedDevice: false,
    requiresFounderAdminSession: false,
    requiresEngineerReview: false,
  },
  master_map: {
    minimumRole: "engineer",
    dataBoundary: "master_sensitive",
    requiresTrustedDevice: true,
    requiresFounderAdminSession: true,
    requiresEngineerReview: true,
  },
  terrain_elevation_map: {
    minimumRole: "supervisor",
    dataBoundary: "engineering_sensitive",
    requiresTrustedDevice: true,
    requiresFounderAdminSession: false,
    requiresEngineerReview: false,
  },
  satellite_building_map: {
    minimumRole: "supervisor",
    dataBoundary: "engineering_sensitive",
    requiresTrustedDevice: true,
    requiresFounderAdminSession: false,
    requiresEngineerReview: false,
  },
  pressure_risk_map: {
    minimumRole: "engineer",
    dataBoundary: "engineering_sensitive",
    requiresTrustedDevice: true,
    requiresFounderAdminSession: false,
    requiresEngineerReview: true,
  },
  demand_growth_map: {
    minimumRole: "engineer",
    dataBoundary: "engineering_sensitive",
    requiresTrustedDevice: true,
    requiresFounderAdminSession: false,
    requiresEngineerReview: true,
  },
  prv_candidate_map: {
    minimumRole: "engineer",
    dataBoundary: "engineering_sensitive",
    requiresTrustedDevice: true,
    requiresFounderAdminSession: false,
    requiresEngineerReview: true,
  },
  valve_isolation_map: {
    minimumRole: "supervisor",
    dataBoundary: "zone_limited",
    requiresTrustedDevice: true,
    requiresFounderAdminSession: false,
    requiresEngineerReview: false,
  },
  water_loss_map: {
    minimumRole: "supervisor",
    dataBoundary: "engineering_sensitive",
    requiresTrustedDevice: true,
    requiresFounderAdminSession: false,
    requiresEngineerReview: false,
  },
  map_change_proposal_map: {
    minimumRole: "field_worker",
    dataBoundary: "assigned_work_only",
    requiresTrustedDevice: false,
    requiresFounderAdminSession: false,
    requiresEngineerReview: false,
  },
};

export function decideWaterMapViewAccess(input: WaterMapViewAccessInput): WaterMapViewAccessDecision {
  const policy = VIEW_POLICY[input.requestedMode];
  const warnings: string[] = [];

  if (ROLE_RANK[input.viewerRole] < ROLE_RANK[policy.minimumRole]) {
    return {
      requestedMode: input.requestedMode,
      viewerRole: input.viewerRole,
      canView: false,
      dataBoundary: policy.dataBoundary,
      requiresTrustedDevice: policy.requiresTrustedDevice,
      requiresFounderAdminSession: policy.requiresFounderAdminSession,
      requiresEngineerReview: policy.requiresEngineerReview,
      reason: "Ο ρόλος χρήστη δεν έχει αρκετό επίπεδο πρόσβασης για αυτή την προβολή.",
      warnings,
      nextAction: "request_role_upgrade",
    };
  }

  if (policy.requiresTrustedDevice && !input.hasTrustedDevice) {
    return {
      requestedMode: input.requestedMode,
      viewerRole: input.viewerRole,
      canView: false,
      dataBoundary: policy.dataBoundary,
      requiresTrustedDevice: true,
      requiresFounderAdminSession: policy.requiresFounderAdminSession,
      requiresEngineerReview: policy.requiresEngineerReview,
      reason: "Αυτή η προβολή χρειάζεται εγκεκριμένη/trusted συσκευή.",
      warnings,
      nextAction: "request_trusted_device",
    };
  }

  if (policy.requiresFounderAdminSession && !input.hasFounderAdminSession) {
    return {
      requestedMode: input.requestedMode,
      viewerRole: input.viewerRole,
      canView: false,
      dataBoundary: policy.dataBoundary,
      requiresTrustedDevice: policy.requiresTrustedDevice,
      requiresFounderAdminSession: true,
      requiresEngineerReview: policy.requiresEngineerReview,
      reason: "Αυτή η προβολή χρειάζεται πραγματικό founder/admin session.",
      warnings,
      nextAction: "request_admin_session",
    };
  }

  if (policy.requiresEngineerReview && !input.hasEngineerApproval && input.viewerRole !== "founder" && input.viewerRole !== "admin") {
    warnings.push("Engineering-sensitive προβολή: οι εισηγήσεις χρειάζονται τεχνική επιβεβαίωση.");
  }

  if (input.requestedZoneId && input.assignedZoneIds?.length && !input.assignedZoneIds.includes(input.requestedZoneId)) {
    return {
      requestedMode: input.requestedMode,
      viewerRole: input.viewerRole,
      canView: false,
      dataBoundary: policy.dataBoundary,
      requiresTrustedDevice: policy.requiresTrustedDevice,
      requiresFounderAdminSession: policy.requiresFounderAdminSession,
      requiresEngineerReview: policy.requiresEngineerReview,
      reason: "Ο χρήστης δεν έχει πρόσβαση στη συγκεκριμένη ζώνη.",
      warnings,
      nextAction: "deny",
    };
  }

  if (input.requestedMode === "master_map") {
    warnings.push("Master map: read-sensitive. Καμία αλλαγή χωρίς approval, audit και rollback.");
  }

  return {
    requestedMode: input.requestedMode,
    viewerRole: input.viewerRole,
    canView: true,
    dataBoundary: policy.dataBoundary,
    requiresTrustedDevice: policy.requiresTrustedDevice,
    requiresFounderAdminSession: policy.requiresFounderAdminSession,
    requiresEngineerReview: policy.requiresEngineerReview,
    reason: "Η προβολή επιτρέπεται με τα τρέχοντα δικαιώματα.",
    warnings,
    nextAction: "open_view",
  };
}

export const WATER_MAP_VIEW_MODE_NEXT_ACTIONS = [
  "Add UI selector for operational / master / terrain / satellite / pressure risk views",
  "Connect role and trusted-device checks to map view selector",
  "Keep master map private and audited",
  "Connect selected view mode to AI Map Kernel context",
] as const;