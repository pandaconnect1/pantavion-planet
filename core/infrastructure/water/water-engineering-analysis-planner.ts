import type {
  WaterEngineeringEvidenceSource,
  WaterEngineeringIntent,
  WaterEngineeringQuery,
} from "./water-engineering-ai-contract.ts";
import {
  chooseWaterEngineeringAnalysisScope,
  type PantavionWaterAnalysisScope,
} from "./water-analysis-scope-policy.ts";
import type { WaterHydraulicEngineId } from "./water-hydraulic-worker-contract.ts";

export type WaterEngineeringAnalysisLevel =
  | "BLOCKED"
  | "SCREENING_ONLY"
  | "CALIBRATED_ENGINEERING";

export type WaterEvidenceRequirement = {
  id:string;
  anyOf:WaterEngineeringEvidenceSource[];
  purpose:string;
  blockingFor:"ANY_ANALYSIS"|"AUTHORITATIVE";
};

export type WaterEngineeringAnalysisPlan = {
  queryId:string;
  intent:WaterEngineeringIntent;
  networkRevisionId:string;
  analysisScope:PantavionWaterAnalysisScope;
  engine:WaterHydraulicEngineId | null;
  analysisLevel:WaterEngineeringAnalysisLevel;
  requiredEvidence:WaterEvidenceRequirement[];
  missingForAnyAnalysis:WaterEvidenceRequirement[];
  missingForAuthoritative:WaterEvidenceRequirement[];
  checks:string[];
  telemetryWindowRequired:boolean;
  rules:{
    authenticNetworkModified:false;
    assumptionsVisible:true;
    recommendationsOnly:true;
  };
};

const NETWORK:WaterEvidenceRequirement={
  id:"network",
  anyOf:["AUTHENTIC_NETWORK_REVISION"],
  purpose:"Pinned authentic network revision and topology.",
  blockingFor:"ANY_ANALYSIS",
};

const ELEVATION:WaterEvidenceRequirement={
  id:"elevation",
  anyOf:["SURVEYED_ELEVATION","DLS_TOPOGRAPHY_AND_CONTOURS","DEM"],
  purpose:"Node/asset elevations and pressure-zone terrain context.",
  blockingFor:"ANY_ANALYSIS",
};

const DEMAND:WaterEvidenceRequirement={
  id:"demand",
  anyOf:["CUSTOMER_DEMAND","SMART_METER","BILLING_WATER_BALANCE"],
  purpose:"Demand/loading for hydraulic balance.",
  blockingFor:"ANY_ANALYSIS",
};

const PRESSURE_CAL:WaterEvidenceRequirement={
  id:"pressure_calibration",
  anyOf:["PRESSURE_LOGGER","SCADA"],
  purpose:"Measured pressure for calibration/validation.",
  blockingFor:"AUTHORITATIVE",
};

const FLOW_CAL:WaterEvidenceRequirement={
  id:"flow_calibration",
  anyOf:["FLOW_METER","DMA_METER","SCADA"],
  purpose:"Measured flow for calibration, balance and anomaly detection.",
  blockingFor:"AUTHORITATIVE",
};

const SOURCE_STATE:WaterEvidenceRequirement={
  id:"source_storage_pump_state",
  anyOf:["TANK_LEVEL","PUMP_TELEMETRY","SCADA"],
  purpose:"Boundary conditions and operating state of sources, tanks and pumps.",
  blockingFor:"AUTHORITATIVE",
};

const VALVE_STATE:WaterEvidenceRequirement={
  id:"valve_state",
  anyOf:["VALVE_STATE","SCADA","FIELD_OBSERVATION"],
  purpose:"Real valve/control state for connectivity and isolation scenarios.",
  blockingFor:"AUTHORITATIVE",
};

const BREAK_HISTORY:WaterEvidenceRequirement={
  id:"break_history",
  anyOf:["BREAK_AND_REPAIR_HISTORY","WORK_ORDERS"],
  purpose:"Failure history and recurrent-break evidence.",
  blockingFor:"AUTHORITATIVE",
};

const STAFF:WaterEvidenceRequirement={
  id:"staff",
  anyOf:["STAFF_AND_CREW_AVAILABILITY"],
  purpose:"Available personnel/crew capability.",
  blockingFor:"ANY_ANALYSIS",
};

const WORK:WaterEvidenceRequirement={
  id:"work_orders",
  anyOf:["WORK_ORDERS","FIELD_OBSERVATION"],
  purpose:"Current incident/work context.",
  blockingFor:"ANY_ANALYSIS",
};

const QUALITY:WaterEvidenceRequirement={
  id:"quality",
  anyOf:["LAB_OR_WATER_QUALITY_SENSOR","SCADA"],
  purpose:"Measured water-quality evidence for validation.",
  blockingFor:"AUTHORITATIVE",
};

function requirementsFor(intent:WaterEngineeringIntent):WaterEvidenceRequirement[]{
  switch(intent){
    case "PRESSURE_ADEQUACY":
      return [NETWORK,ELEVATION,DEMAND,PRESSURE_CAL,FLOW_CAL,SOURCE_STATE,VALVE_STATE];
    case "CAPACITY_AND_DEMAND":
      return [NETWORK,ELEVATION,DEMAND,FLOW_CAL,SOURCE_STATE,VALVE_STATE];
    case "ELEVATION_AND_PRESSURE_ZONES":
      return [NETWORK,ELEVATION,PRESSURE_CAL,VALVE_STATE];
    case "LEAKAGE_AND_NON_REVENUE_WATER":
      return [NETWORK,DEMAND,FLOW_CAL,PRESSURE_CAL,BREAK_HISTORY];
    case "HIDDEN_LEAK_ANOMALY":
      return [
        NETWORK,
        {...FLOW_CAL,blockingFor:"ANY_ANALYSIS"},
        {...PRESSURE_CAL,blockingFor:"ANY_ANALYSIS"},
        BREAK_HISTORY,
      ];
    case "BREAK_PATTERN_ANALYSIS":
      return [NETWORK,{...BREAK_HISTORY,blockingFor:"ANY_ANALYSIS"},PRESSURE_CAL];
    case "VALVE_ISOLATION":
      return [NETWORK,{...VALVE_STATE,blockingFor:"ANY_ANALYSIS"},DEMAND,PRESSURE_CAL];
    case "PUMP_AND_TANK_OPERATION":
      return [NETWORK,ELEVATION,DEMAND,{...SOURCE_STATE,blockingFor:"ANY_ANALYSIS"},FLOW_CAL,PRESSURE_CAL];
    case "WATER_AGE_AND_QUALITY":
      return [NETWORK,DEMAND,SOURCE_STATE,FLOW_CAL,QUALITY];
    case "ENERGY_OPTIMISATION":
      return [NETWORK,DEMAND,{...SOURCE_STATE,blockingFor:"ANY_ANALYSIS"},FLOW_CAL,PRESSURE_CAL];
    case "ASSET_CONDITION_AND_FAILURE_RISK":
      return [NETWORK,{...BREAK_HISTORY,blockingFor:"ANY_ANALYSIS"},PRESSURE_CAL,FLOW_CAL];
    case "CREW_AND_FIELD_RESPONSE":
      return [{...WORK,blockingFor:"ANY_ANALYSIS"},STAFF,NETWORK];
    case "EMERGENCY_RESILIENCE":
      return [NETWORK,ELEVATION,DEMAND,SOURCE_STATE,VALVE_STATE,PRESSURE_CAL,FLOW_CAL,BREAK_HISTORY];
    case "NETWORK_IMPROVEMENT_OPTIONS":
      return [NETWORK,ELEVATION,DEMAND,PRESSURE_CAL,FLOW_CAL,SOURCE_STATE,VALVE_STATE,BREAK_HISTORY];
    case "AREA_DIAGNOSTIC":
    default:
      return [NETWORK,ELEVATION,DEMAND,PRESSURE_CAL,FLOW_CAL,VALVE_STATE,BREAK_HISTORY];
  }
}

function engineFor(intent:WaterEngineeringIntent):WaterHydraulicEngineId|null{
  switch(intent){
    case "CREW_AND_FIELD_RESPONSE":
    case "BREAK_PATTERN_ANALYSIS":
    case "ASSET_CONDITION_AND_FAILURE_RISK":
      return null;
    case "EMERGENCY_RESILIENCE":
    case "HIDDEN_LEAK_ANOMALY":
      return "WNTR";
    default:
      return "EPANET_2_2";
  }
}

function checksFor(intent:WaterEngineeringIntent){
  const common=["network_topology","evidence_coverage","data_freshness"];
  const byIntent:Record<WaterEngineeringIntent,string[]>={
    AREA_DIAGNOSTIC:["pressure","flow","demand","headloss","elevation","valve_state","failure_history"],
    PRESSURE_ADEQUACY:["pressure","hydraulic_grade","elevation","headloss","demand","source_state"],
    CAPACITY_AND_DEMAND:["peak_demand","flow","velocity","headloss","storage","source_capacity"],
    ELEVATION_AND_PRESSURE_ZONES:["elevation","pressure_zone_boundaries","pressure","control_valves"],
    LEAKAGE_AND_NON_REVENUE_WATER:["water_balance","minimum_night_flow","pressure","flow_anomaly","break_history"],
    HIDDEN_LEAK_ANOMALY:["minimum_night_flow","pressure_transient_pattern","flow_anomaly","spatial_break_history"],
    BREAK_PATTERN_ANALYSIS:["break_frequency","pipe_material","diameter","pressure_history","age_or_installation_era"],
    VALVE_ISOLATION:["connectivity_trace","valve_state","affected_demand","alternative_feed"],
    PUMP_AND_TANK_OPERATION:["pump_curve","operating_point","tank_levels","energy","controls","pressure"],
    WATER_AGE_AND_QUALITY:["water_age","source_trace","tank_turnover","measured_quality"],
    ENERGY_OPTIMISATION:["pump_efficiency","operating_point","tariff_window","pressure_constraints"],
    ASSET_CONDITION_AND_FAILURE_RISK:["failure_history","criticality","pressure_stress","material","diameter"],
    CREW_AND_FIELD_RESPONSE:["incident_location","crew_availability","skills","travel_context","isolation_requirements"],
    EMERGENCY_RESILIENCE:["failure_scenarios","pressure_dependent_demand","critical_nodes","isolation","recovery"],
    NETWORK_IMPROVEMENT_OPTIONS:["bottlenecks","redundancy","pressure","velocity","headloss","capacity","resilience"],
  };
  return [...common,...byIntent[intent]];
}

export function planWaterEngineeringAnalysis(input:{
  query:WaterEngineeringQuery;
  availableEvidence:Iterable<WaterEngineeringEvidenceSource>;
  hydraulicDependency:{
    hasCompleteInfluenceClosure:boolean;
    crossesPressureZoneBoundary:boolean;
    dependsOnRemoteSourceOrTrunkMain:boolean;
    unresolvedHydraulicDependency:boolean;
  };
}):WaterEngineeringAnalysisPlan{
  const available=new Set(input.availableEvidence);
  const requirements=requirementsFor(input.query.intent);

  const missing=requirements.filter(
    r=>!r.anyOf.some(source=>available.has(source)),
  );
  const missingForAnyAnalysis=missing.filter(r=>r.blockingFor==="ANY_ANALYSIS");
  const missingForAuthoritative=missing.filter(r=>r.blockingFor==="AUTHORITATIVE");

  const analysisLevel:WaterEngineeringAnalysisLevel=
    missingForAnyAnalysis.length>0
      ? "BLOCKED"
      : missingForAuthoritative.length>0
        ? "SCREENING_ONLY"
        : "CALIBRATED_ENGINEERING";

  const baseScope=chooseWaterEngineeringAnalysisScope(input.hydraulicDependency);
  const analysisScope:PantavionWaterAnalysisScope=
    engineFor(input.query.intent)===null
      ? "HYDRAULIC_INFLUENCE_GRAPH"
      : baseScope;

  return {
    queryId:input.query.queryId,
    intent:input.query.intent,
    networkRevisionId:input.query.networkRevisionId,
    analysisScope,
    engine:engineFor(input.query.intent),
    analysisLevel,
    requiredEvidence:requirements,
    missingForAnyAnalysis,
    missingForAuthoritative,
    checks:checksFor(input.query.intent),
    telemetryWindowRequired:[
      "PRESSURE_ADEQUACY",
      "LEAKAGE_AND_NON_REVENUE_WATER",
      "HIDDEN_LEAK_ANOMALY",
      "PUMP_AND_TANK_OPERATION",
      "ENERGY_OPTIMISATION",
      "EMERGENCY_RESILIENCE",
    ].includes(input.query.intent),
    rules:{
      authenticNetworkModified:false,
      assumptionsVisible:true,
      recommendationsOnly:true,
    },
  };
}
