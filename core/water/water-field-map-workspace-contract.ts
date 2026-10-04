export const WATER_FIELD_MAP_WORKSPACE = {
  id: "A",
  name: "Field Operations",
  audience: ["WORKER", "FIELD_TECHNICIAN", "CREW"],
  principle: "MAP_FIRST_ROLE_SCOPED",
  primaryControls: ["STREET_SEARCH","MY_GPS_POSITION","NAVIGATE_TO_TARGET","FAULTS","WORK_ORDER","LAYERS"],
  streetDirectory: {
    groupBy: ["AREA","ZONE"],
    sort: "ALPHABETICAL",
    accepts: ["GREEK","ENGLISH","LATIN","GREEKLISH"],
    quickFilters: ["RECENT","FAVORITES","ACTIVE_FAULTS"],
  },
  navigation: {
    modes: ["ROAD_GUIDANCE","NEAR_TARGET_FIELD_GUIDANCE"],
    targets: ["ADDRESS","FAULT","VALVE","PIPE","WORK_ORDER"],
    showGpsAccuracy: true,
    neverClaimUndergroundAssetAccuracyFromPhoneGps: true,
  },
  taskPanels: ["FAULT","EXCAVATION","PIPE_REPAIR","VALVE","METER_REPLACEMENT","NETWORK_EXTENSION","PHOTO_OR_SCAN","MATERIALS","LABOR_HOURS","SURFACE_RESTORATION"],
  hiddenFromFieldHome: ["ACCOUNTING","HR_ADMINISTRATION","ENGINEERING_ADMINISTRATION","SOURCE_READINESS","RAW_MASTER_FILES","GLOBAL_ADMIN"],
  safety: {
    authenticNetworkMutation: "PROPOSE_THEN_REVIEW",
    physicalValveOperation: "HUMAN_AUTHORIZED_ONLY",
    history: "APPEND_ONLY",
  },
} as const;
