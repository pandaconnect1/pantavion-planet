export const PANTAVION_WATER_FIELD_ACTIONS = [
  "locate_me",
  "search",
  "layers",
  "report_fault",
  "inspect_valve",
  "inspect_pipe",
  "capture_evidence",
] as const;

export type PantavionWaterFieldAction = typeof PANTAVION_WATER_FIELD_ACTIONS[number];

export const PANTAVION_WATER_FIELD_UI_CONTRACT = {
  version: "2026-10-01.v1",
  principle: "complex_backend_simple_field_surface",
  maxPrimaryActions: 7,
  gps: {
    showAccuracyMeters: true,
    showFixTimestamp: true,
    distinguishNetworkGeometryFromDevicePosition: true,
  },
  network: {
    fullNetworkMobilePushAllowed: false,
    viewportServingRequired: true,
    vectorTilesPreferred: true,
  },
  editing: {
    authorizedRolesOnly: true,
    optimisticVersionRequired: true,
    auditRequired: true,
    silentOverwriteAllowed: false,
  },
  offline: {
    architectureRequired: true,
    queuedEditsMustPreserveOriginalTimestamp: true,
    syncConflictsMustRequireResolution: true,
  },
} as const;
