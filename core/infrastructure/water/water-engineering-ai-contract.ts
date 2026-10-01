export type WaterEngineeringIntent =
  | "AREA_DIAGNOSTIC"
  | "PRESSURE_ADEQUACY"
  | "CAPACITY_AND_DEMAND"
  | "ELEVATION_AND_PRESSURE_ZONES"
  | "LEAKAGE_AND_NON_REVENUE_WATER"
  | "HIDDEN_LEAK_ANOMALY"
  | "BREAK_PATTERN_ANALYSIS"
  | "VALVE_ISOLATION"
  | "PUMP_AND_TANK_OPERATION"
  | "WATER_AGE_AND_QUALITY"
  | "ENERGY_OPTIMISATION"
  | "ASSET_CONDITION_AND_FAILURE_RISK"
  | "CREW_AND_FIELD_RESPONSE"
  | "EMERGENCY_RESILIENCE"
  | "NETWORK_IMPROVEMENT_OPTIONS";

export type WaterEngineeringEvidenceSource =
  | "AUTHENTIC_NETWORK_REVISION"
  | "DLS_CADASTRAL_REFERENCE"
  | "DLS_TOPOGRAPHY_AND_CONTOURS"
  | "SURVEYED_ELEVATION"
  | "DEM"
  | "SCADA"
  | "PRESSURE_LOGGER"
  | "FLOW_METER"
  | "DMA_METER"
  | "TANK_LEVEL"
  | "PUMP_TELEMETRY"
  | "VALVE_STATE"
  | "CUSTOMER_DEMAND"
  | "SMART_METER"
  | "BILLING_WATER_BALANCE"
  | "BREAK_AND_REPAIR_HISTORY"
  | "WORK_ORDERS"
  | "FIELD_OBSERVATION"
  | "LAB_OR_WATER_QUALITY_SENSOR"
  | "WEATHER"
  | "STAFF_AND_CREW_AVAILABILITY";

export type WaterEngineeringQuery = {
  queryId:string;
  requestedBy:string;
  intent:WaterEngineeringIntent;
  area:{
    center?:{latitude:number;longitude:number};
    radiusMeters?:number;
    polygonRef?:string;
    namedArea?:string;
  };
  timeRange?:{from:string;to:string};
  networkRevisionId:string;
  requestedAt:string;
};

export type WaterEngineeringFinding = {
  id:string;
  category:string;
  severity:"INFO"|"WATCH"|"INVESTIGATE"|"HIGH";
  statement:string;
  evidenceRefs:string[];
  calculationRefs:string[];
  assumptions:string[];
  confidence:"LOW"|"MEDIUM"|"HIGH";
  requiresFieldVerification:boolean;
};

export type WaterEngineeringAnswer = {
  queryId:string;
  networkRevisionId:string;
  scenarioIds:string[];
  evidenceSourcesUsed:WaterEngineeringEvidenceSource[];
  missingCriticalInputs:string[];
  findings:WaterEngineeringFinding[];
  hydraulicChecks:{
    pressure:boolean;
    flow:boolean;
    demand:boolean;
    headloss:boolean;
    elevation:boolean;
    storage:boolean;
    pumpOperation:boolean;
    valveState:boolean;
    waterAge:boolean;
    leakageIndicators:boolean;
  };
  governance:{
    authenticNetworkModified:false;
    automaticRealWorldControlAllowed:false;
    conclusionsMustExposeEvidence:true;
    assumptionsMustBeVisible:true;
    uncertainLeakMustBeReportedAsCandidate:true;
    fieldVerificationRequiredForOperationalChange:true;
  };
};

export const PANTAVION_WATER_ENGINEERING_AI = {
  purpose:"evidence_based_water_utility_engineering_search_analysis_and_recommendation",
  authenticNetworkWriteAllowed:false,
  simulationLayerRequired:true,
  telemetryStandards:["OGC_SENSORTHINGS_API"],
  hydraulicEngines:["EPANET_2_2","WNTR"],
  geospatialAuthorities:["CYPRUS_DLS","COPERNICUS_DEM_WHERE_LICENSE_AND_RESOLUTION_FIT"],
  coreRule:
    "No engineering conclusion may be presented as established when required network, elevation, demand or telemetry evidence is missing.",
} as const;
