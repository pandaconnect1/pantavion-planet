export const WATER_INTELLIGENCE_MASTER_CONTRACT_VERSION = "2026-05-22.v1";

export const WATER_INTELLIGENCE_MASTER_CONTRACT = {
  version: WATER_INTELLIGENCE_MASTER_CONTRACT_VERSION,
  status: "foundation_contract_only",
  scope: "Pantavion Water protected professional infrastructure intelligence",

  protectedExistingSystems: [
    "existing_working_water_map",
    "existing_access_request_flow",
    "existing_approved_device_flow",
    "existing_private_blob_network_source",
  ],

  nonNegotiables: [
    "NO_PUBLIC_RAW_DWG_DXF_KMZ_KML_GEOJSON",
    "NO_RAW_SOURCE_IN_GITHUB",
    "NO_RAW_SOURCE_IN_BROWSER_BUNDLE",
    "NO_FULL_DXF_BROWSER_LOADING",
    "NO_EXISTING_MAP_CHANGES_WITHOUT_EXPLICIT_SCOPE",
    "NO_ACCESS_LOGIC_CHANGES_WITHOUT_EXPLICIT_SCOPE",
    "FOUNDER_APPROVAL_REQUIRED_FOR_MASTER_CHANGES",
    "VERSION_BACKUP_REQUIRED_BEFORE_MASTER_CHANGE",
    "ROLLBACK_REQUIRED_FOR_APPROVED_MASTER_CHANGE",
    "DERIVED_LIGHTWEIGHT_LAYERS_ONLY_FOR_USERS",
    "AI_ESTIMATE_IS_NOT_VERIFIED_TRUTH",
    "USERS_SEE_ONLY_APPROVED_SAFE_LAYERS",
  ],

  foundationModules: [
    "founder_source_vault",
    "water_approval_inbox",
    "water_intelligence_sidebar",
    "field_assistant",
    "change_and_evidence_log",
    "technology_registry",
    "engineering_intelligence",
    "private_source_processing_plan",
  ],

  sourceVaultRules: {
    rawSourcesStayPrivate: true,
    acceptedSourceKinds: [
      "dwg",
      "dxf",
      "kmz",
      "kml",
      "geojson",
      "geopackage",
      "shapefile",
      "pdf",
      "scanner_report",
      "photo",
      "video",
      "voice_note",
      "telemetry_export",
      "satellite_indicator",
      "contractor_as_built_file",
    ],
    sourceStatuses: [
      "received",
      "private_source",
      "pending_inspection",
      "pending_extraction",
      "processing",
      "preview_ready",
      "founder_review",
      "approved_layer_ready",
      "published_to_users",
      "archived",
    ],
  },

  approvalRules: {
    allUserSubmissionsStartPending: true,
    founderCanApproveRejectRevokeArchive: true,
    appliesTo: [
      "access_requests",
      "device_requests",
      "map_notes",
      "photos",
      "voice_notes",
      "fault_reports",
      "valve_changes",
      "pipe_corrections",
      "new_roads",
      "new_areas",
      "pdf_scanner_items",
      "ai_engineering_proposals",
    ],
  },

  visibilityModel: {
    founderSees: [
      "all_sources",
      "all_pending_items",
      "all_notes",
      "all_photos",
      "all_voice_notes",
      "all_faults",
      "ai_engineering_intelligence",
      "risk_layers",
      "technology_registry",
      "approval_controls",
    ],
    approvedUserSees: [
      "approved_map_layers",
      "approved_network_data",
      "own_private_notes",
      "own_pending_submissions",
      "approved_shared_notes",
      "safe_field_assistant_information",
    ],
    hiddenFromApprovedUsers: [
      "raw_dwg_dxf",
      "source_vault",
      "approval_inbox",
      "unapproved_faults",
      "unapproved_submissions",
      "founder_only_engineering_intelligence",
      "sensitive_infrastructure_reports",
    ],
  },
} as const;

export type WaterIntelligenceMasterContract =
  typeof WATER_INTELLIGENCE_MASTER_CONTRACT;