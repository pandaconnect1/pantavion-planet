export type WaterHydraulicEvidenceRef = {
  sourceType:
    | "AUTHENTIC_MAP"
    | "SURVEY"
    | "DLS"
    | "SCADA"
    | "PRESSURE_LOGGER"
    | "FLOW_METER"
    | "TANK_LEVEL"
    | "PUMP_TELEMETRY"
    | "FIELD_RECORD"
    | "ENGINEERING_ASSUMPTION";
  ref:string;
};

export type WaterHydraulicJunction = {
  nodeId:string;
  elevationM:number | null;
  baseDemandLps:number | null;
  demandPatternId?:string;
  evidence:WaterHydraulicEvidenceRef[];
};

export type WaterHydraulicReservoir = {
  nodeId:string;
  hydraulicHeadM:number | null;
  evidence:WaterHydraulicEvidenceRef[];
};

export type WaterHydraulicTank = {
  nodeId:string;
  elevationM:number | null;
  initialLevelM:number | null;
  minimumLevelM:number | null;
  maximumLevelM:number | null;
  diameterM:number | null;
  evidence:WaterHydraulicEvidenceRef[];
};

export type WaterHydraulicPipe = {
  featureId:string;
  fromNodeId:string;
  toNodeId:string;
  lengthM:number | null;
  diameterMm:number | null;
  roughnessModel:"DARCY_WEISBACH" | "HAZEN_WILLIAMS";
  roughnessValue:number | null;
  minorLossCoefficient:number;
  initialStatus:"OPEN" | "CLOSED";
  evidence:WaterHydraulicEvidenceRef[];
};

export type WaterHydraulicValve = {
  featureId:string;
  fromNodeId:string;
  toNodeId:string;
  valveType:"PRV"|"PSV"|"PBV"|"FCV"|"TCV"|"GPV"|"ISOLATION";
  diameterMm:number | null;
  setting:number | null;
  initialStatus:"OPEN"|"CLOSED"|"ACTIVE";
  evidence:WaterHydraulicEvidenceRef[];
};

export type WaterHydraulicPump = {
  featureId:string;
  fromNodeId:string;
  toNodeId:string;
  curveRef:string | null;
  speed:number | null;
  initialStatus:"OPEN"|"CLOSED";
  evidence:WaterHydraulicEvidenceRef[];
};

export type WaterHydraulicModel = {
  schemaVersion:"pantavion-water-hydraulic-model.v1";
  networkRevisionId:string;
  units:{
    length:"m";
    elevation:"m";
    diameter:"mm";
    flow:"L/s";
    pressureHead:"m";
  };
  junctions:WaterHydraulicJunction[];
  reservoirs:WaterHydraulicReservoir[];
  tanks:WaterHydraulicTank[];
  pipes:WaterHydraulicPipe[];
  valves:WaterHydraulicValve[];
  pumps:WaterHydraulicPump[];
  generatedAt:string;
  sourceReadOnly:true;
};

export type WaterHydraulicValidationIssue = {
  code:string;
  severity:"BLOCKER"|"WARNING";
  objectRef:string;
  field?:string;
  message:string;
};

export function validateWaterHydraulicModel(model:WaterHydraulicModel){
  const issues:WaterHydraulicValidationIssue[]=[];
  const nodes=new Set<string>();

  for(const j of model.junctions){
    nodes.add(j.nodeId);
    if(j.elevationM===null) issues.push({code:"JUNCTION_ELEVATION_MISSING",severity:"BLOCKER",objectRef:j.nodeId,field:"elevationM",message:"Junction elevation is required for authoritative pressure calculation."});
    if(j.baseDemandLps===null) issues.push({code:"JUNCTION_DEMAND_MISSING",severity:"BLOCKER",objectRef:j.nodeId,field:"baseDemandLps",message:"Demand is required for authoritative hydraulic calculation."});
  }
  for(const r of model.reservoirs){
    nodes.add(r.nodeId);
    if(r.hydraulicHeadM===null) issues.push({code:"RESERVOIR_HEAD_MISSING",severity:"BLOCKER",objectRef:r.nodeId,field:"hydraulicHeadM",message:"Reservoir/source head is required."});
  }
  for(const t of model.tanks){
    nodes.add(t.nodeId);
    for(const [field,value] of Object.entries({
      elevationM:t.elevationM,
      initialLevelM:t.initialLevelM,
      minimumLevelM:t.minimumLevelM,
      maximumLevelM:t.maximumLevelM,
      diameterM:t.diameterM,
    })){
      if(value===null) issues.push({code:"TANK_DATA_MISSING",severity:"BLOCKER",objectRef:t.nodeId,field,message:"Tank geometry/level data is incomplete."});
    }
  }

  const checkLink=(ref:string,from:string,to:string)=>{
    if(!nodes.has(from)) issues.push({code:"LINK_FROM_NODE_MISSING",severity:"BLOCKER",objectRef:ref,field:"fromNodeId",message:"Link references an unknown start node."});
    if(!nodes.has(to)) issues.push({code:"LINK_TO_NODE_MISSING",severity:"BLOCKER",objectRef:ref,field:"toNodeId",message:"Link references an unknown end node."});
  };

  for(const p of model.pipes){
    checkLink(p.featureId,p.fromNodeId,p.toNodeId);
    if(p.lengthM===null || p.lengthM<=0) issues.push({code:"PIPE_LENGTH_MISSING",severity:"BLOCKER",objectRef:p.featureId,field:"lengthM",message:"Pipe length is required."});
    if(p.diameterMm===null || p.diameterMm<=0) issues.push({code:"PIPE_DIAMETER_MISSING",severity:"BLOCKER",objectRef:p.featureId,field:"diameterMm",message:"Pipe diameter is required."});
    if(p.roughnessValue===null || p.roughnessValue<=0) issues.push({code:"PIPE_ROUGHNESS_MISSING",severity:"BLOCKER",objectRef:p.featureId,field:"roughnessValue",message:"Pipe roughness/resistance parameter is required."});
  }
  for(const v of model.valves){
    checkLink(v.featureId,v.fromNodeId,v.toNodeId);
    if(v.diameterMm===null || v.diameterMm<=0) issues.push({code:"VALVE_DIAMETER_MISSING",severity:"BLOCKER",objectRef:v.featureId,field:"diameterMm",message:"Valve diameter is required."});
  }
  for(const p of model.pumps){
    checkLink(p.featureId,p.fromNodeId,p.toNodeId);
    if(!p.curveRef) issues.push({code:"PUMP_CURVE_MISSING",severity:"BLOCKER",objectRef:p.featureId,field:"curveRef",message:"Pump curve or equivalent operating definition is required."});
  }

  if(model.reservoirs.length===0 && model.tanks.length===0){
    issues.push({code:"NO_HYDRAULIC_SOURCE",severity:"BLOCKER",objectRef:model.networkRevisionId,message:"At least one reservoir/source or tank boundary condition is required."});
  }

  return {
    ok:issues.every(i=>i.severity!=="BLOCKER"),
    issues,
    blockerCount:issues.filter(i=>i.severity==="BLOCKER").length,
    warningCount:issues.filter(i=>i.severity==="WARNING").length,
  };
}

export const PANTAVION_WATER_HYDRAULIC_MODEL_POLICY = {
  authenticNetworkReadOnly:true,
  authoritativeResultRequiresZeroBlockers:true,
  engineeringAssumptionsMustBeExplicitEvidence:true,
  missingDataMayNotBeSilentlyInvented:true,
  sourceRevisionMustBePinned:true,
  canonicalUnits:"SI",
} as const;
