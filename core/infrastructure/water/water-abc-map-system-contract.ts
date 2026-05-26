export type PantavionWaterMapId = "A_OPERATIONAL_GEO_MAP" | "B_AUTHENTIC_MASTER_MAP" | "C_INTELLIGENT_ENGINEERING_MAP";

export type PantavionWaterAccessStatus =
  | "public"
  | "pending"
  | "approved"
  | "revoked"
  | "founder_admin";

export type PantavionWaterEvidenceStatus = "measured" | "estimated" | "reported" | "unknown";

export type PantavionWaterFieldChangeType =
  | "valve"
  | "pipe"
  | "network_extension"
  | "fault"
  | "leak"
  | "repair"
  | "street_name"
  | "pressure_reading"
  | "prv_candidate"
  | "zone_note"
  | "photo_note"
  | "telemetry"
  | "general_update";

export type PantavionWaterFieldChangeStatus =
  | "pending_founder_approval"
  | "approved_visible_to_all_approved_users"
  | "rejected"
  | "needs_more_information"
  | "superseded";

export interface PantavionWaterMapDefinition {
  id: PantavionWaterMapId;
  name: string;
  purpose: string;
  visibleToApprovedUsers: true;
  rawSourceExposedToUsers: false;
  publicAccessAllowed: false;
  browserFullNetworkLoadAllowed: false;
  masterMutationAllowedFromUser: false;
  allowedInputs: string[];
  outputBoundary: string;
}

export interface PantavionWaterFieldChangeProposal {
  id: string;
  type: PantavionWaterFieldChangeType;
  status: PantavionWaterFieldChangeStatus;
  submittedByApprovedUserId: string;
  streetName?: string;
  zone?: string;
  lat?: number;
  lng?: number;
  text?: string;
  pressureBar?: number;
  evidenceStatus: PantavionWaterEvidenceStatus;
  privatePhotoBlobPaths: string[];
  privateAttachmentBlobPaths: string[];
  submittedAt: string;
  founderReviewedAt?: string;
  founderDecisionBy?: string;
  founderCorrectionText?: string;
}

export interface PantavionWaterStreetLedgerRecord {
  streetName: string;
  normalizedStreetName: string;
  approvedChanges: PantavionWaterFieldChangeProposal[];
  pendingChangesVisibleToFounderOnly: PantavionWaterFieldChangeProposal[];
  knownValves: number;
  knownFaults: number;
  knownExtensions: number;
  pressureEvidenceStatus: PantavionWaterEvidenceStatus;
  latestApprovedUpdateAt?: string;
}

export const PANTAVION_WATER_ABC_MAP_SYSTEM_ID =
  "pantavion_water_abc_map_system_v1";

export const pantavionWaterAbcMaps: PantavionWaterMapDefinition[] = [
  {
    id: "A_OPERATIONAL_GEO_MAP",
    name: "A Map — Operational Geo Map",
    purpose:
      "Approved-user operational map for field use, current location, street search, bbox segments, valves, faults, repairs, and approved field notes.",
    visibleToApprovedUsers: true,
    rawSourceExposedToUsers: false,
    publicAccessAllowed: false,
    browserFullNetworkLoadAllowed: false,
    masterMutationAllowedFromUser: false,
    allowedInputs: [
      "approved bbox pipe segments",
      "approved street ledger records",
      "approved field changes",
      "approved photos as protected references",
      "current location",
      "address search",
    ],
    outputBoundary:
      "Shows protected operational map views inside Pantavion only. No raw CAD/DTX download and no full public export.",
  },
  {
    id: "B_AUTHENTIC_MASTER_MAP",
    name: "B Map — Authentic Master Map View",
    purpose:
      "Protected Pantavion view generated from the authentic DTX/CAD master source from the design office. The raw master file stays in private vault.",
    visibleToApprovedUsers: true,
    rawSourceExposedToUsers: false,
    publicAccessAllowed: false,
    browserFullNetworkLoadAllowed: false,
    masterMutationAllowedFromUser: false,
    allowedInputs: [
      "private DTX/CAD source manifest",
      "versioned master source metadata",
      "derived protected render layers",
      "approved field update overlay",
      "founder-approved activation records",
    ],
    outputBoundary:
      "Approved users see the B master as a protected Pantavion map view. They never receive the raw DTX/CAD file or a full public export.",
  },
  {
    id: "C_INTELLIGENT_ENGINEERING_MAP",
    name: "C Map — Intelligent Engineering Map",
    purpose:
      "Intelligent engineering map combining A Map, B Master, approved field changes, photos, street ledgers, telemetry, pressure data, PRV candidates, zones, and AI/kernel analysis.",
    visibleToApprovedUsers: true,
    rawSourceExposedToUsers: false,
    publicAccessAllowed: false,
    browserFullNetworkLoadAllowed: false,
    masterMutationAllowedFromUser: false,
    allowedInputs: [
      "A operational segments",
      "B master derived view",
      "approved field changes",
      "pending founder-only proposals",
      "photos",
      "text notes",
      "pressure readings in bar",
      "telemetry",
      "fault reports",
      "PRV candidates",
      "zone information",
      "street ledger",
      "AI/kernel engineering analysis",
    ],
    outputBoundary:
      "Shows engineering intelligence inside Pantavion. Measured, estimated, reported, and unknown data must be clearly separated.",
  },
];

export const pantavionWaterMapAccessPolicy = {
  publicVisitorSeesMaps: false,
  pendingUserSeesMaps: false,
  revokedUserSeesMaps: false,
  approvedUserSeesAMap: true,
  approvedUserSeesBMap: true,
  approvedUserSeesCMap: true,
  founderAdminControlsApprovalsUploadsVersionsAndRollback: true,
  rawDtxCadDownloadAllowedForApprovedUsers: false,
  publicFullExportAllowed: false,
  githubMasterUploadAllowed: false,
  noApprovalNoMaps: true,
} as const;

export const pantavionWaterFieldChangeWorkflow = {
  approvedUsersMaySubmitChanges: true,
  acceptedSubmissionTypes: [
    "valves",
    "pipes",
    "network extensions",
    "faults",
    "leaks",
    "repairs",
    "street names",
    "pressure readings in bar",
    "PRV candidates",
    "zone notes",
    "photos",
    "text notes",
    "telemetry",
    "general updates",
  ],
  founderApprovalRequiredBeforeVisibleToAll: true,
  founderMayEditBeforeApproval: true,
  approvedChangesVisibleToAllApprovedUsers: true,
  pendingChangesVisibleToFounderOnly: true,
  masterFileNotMutatedByUserSubmission: true,
  auditRequired: true,
  rollbackRequired: true,
} as const;

export const pantavionWaterStreetLedgerPolicy = {
  enabled: true,
  alphabeticalStreetIndexRequired: true,
  perStreetHistoryRequired: true,
  includesApprovedChanges: true,
  includesPendingFounderOnlyChanges: true,
  includesValvesFaultsExtensionsPhotosReportsPressureZonesAndTelemetry: true,
  visibleToApprovedUsersAfterFounderApproval: true,
} as const;

export const pantavionWaterCMapIntelligencePolicy = {
  telemetryAllowed: true,
  photosAllowed: true,
  fieldReportsAllowed: true,
  pressureBarDataAllowed: true,
  prvCandidateAnalysisAllowed: true,
  zoneAnalysisAllowed: true,
  networkImprovementRecommendationsAllowed: true,
  measuredEstimatedReportedUnknownSeparationRequired: true,
  noFakePressureClaims: true,
  noAutomaticMasterMutation: true,
  founderApprovalRequiredForOfficialChange: true,
} as const;

export function getPantavionWaterAbcMapSystemContract() {
  return {
    id: PANTAVION_WATER_ABC_MAP_SYSTEM_ID,
    version: "1.0.0",
    status: "contract_active_not_full_renderer_claim",
    maps: pantavionWaterAbcMaps,
    accessPolicy: pantavionWaterMapAccessPolicy,
    fieldChangeWorkflow: pantavionWaterFieldChangeWorkflow,
    streetLedgerPolicy: pantavionWaterStreetLedgerPolicy,
    cMapIntelligencePolicy: pantavionWaterCMapIntelligencePolicy,
  };
}