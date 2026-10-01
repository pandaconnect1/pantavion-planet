import {
  type WaterHydraulicModel,
  validateWaterHydraulicModel,
} from "./water-hydraulic-model-contract.ts";

export type WaterEpanetCurveDefinition = {
  curveRef:string;
  points:Array<{flowLps:number;headM:number}>;
};

export type WaterEpanetExportResult = {
  ok:boolean;
  inp?:string;
  blockers:string[];
  headlossFormula?:"D-W"|"H-W";
};

function cleanId(id:string){
  if(!id || /[\s;]/.test(id)) throw new Error("water_epanet_id_invalid");
  return id;
}

function n(value:number|null,code:string){
  if(value===null || !Number.isFinite(value)) throw new Error(code);
  return String(value);
}

export function exportWaterHydraulicModelToEpanetInp(
  model:WaterHydraulicModel,
  curves:WaterEpanetCurveDefinition[],
):WaterEpanetExportResult{
  const validation=validateWaterHydraulicModel(model);
  const blockers=validation.issues
    .filter(i=>i.severity==="BLOCKER")
    .map(i=>`${i.code}:${i.objectRef}`);

  const roughnessModels=[...new Set(model.pipes.map(p=>p.roughness.model))];
  if(roughnessModels.length>1) blockers.push("MIXED_HEADLOSS_FORMULAS_NOT_ALLOWED");

  if(model.valves.some(v=>v.valveType==="ISOLATION")){
    blockers.push("ISOLATION_VALVE_REQUIRES_EXPLICIT_CONTROLLED_PIPE_MAPPING");
  }

  const curveMap=new Map(curves.map(c=>[c.curveRef,c]));
  for(const p of model.pumps){
    if(p.curveRef && !curveMap.has(p.curveRef)) blockers.push(`PUMP_CURVE_DEFINITION_MISSING:${p.featureId}`);
  }
  for(const v of model.valves){
    if(v.valveType==="GPV" && v.curveRef && !curveMap.has(v.curveRef)) blockers.push(`GPV_CURVE_DEFINITION_MISSING:${v.featureId}`);
  }

  if(blockers.length) return {ok:false,blockers};

  const formula: "D-W"|"H-W" =
    roughnessModels[0]==="HAZEN_WILLIAMS" ? "H-W" : "D-W";

  const lines:string[]=[];
  lines.push("[TITLE]","; Pantavion Water Engineering AI - derived simulation model","");

  lines.push("[JUNCTIONS]",";ID\tElevation(m)\tDemand(L/s)\tPattern");
  for(const j of model.junctions){
    lines.push([
      cleanId(j.nodeId),
      n(j.elevationM,"junction_elevation_missing"),
      n(j.baseDemandLps,"junction_demand_missing"),
      j.demandPatternId ? cleanId(j.demandPatternId) : "",
    ].join("\t"));
  }
  lines.push("");

  lines.push("[RESERVOIRS]",";ID\tHead(m)");
  for(const r of model.reservoirs){
    lines.push([cleanId(r.nodeId),n(r.hydraulicHeadM,"reservoir_head_missing")].join("\t"));
  }
  lines.push("");

  lines.push("[TANKS]",";ID\tElevation\tInitLevel\tMinLevel\tMaxLevel\tDiameter\tMinVol");
  for(const t of model.tanks){
    lines.push([
      cleanId(t.nodeId),
      n(t.elevationM,"tank_elevation_missing"),
      n(t.initialLevelM,"tank_initial_level_missing"),
      n(t.minimumLevelM,"tank_min_level_missing"),
      n(t.maximumLevelM,"tank_max_level_missing"),
      n(t.diameterM,"tank_diameter_missing"),
      "0",
    ].join("\t"));
  }
  lines.push("");

  lines.push("[PIPES]",";ID\tNode1\tNode2\tLength(m)\tDiameter(mm)\tRoughness\tMinorLoss\tStatus");
  for(const p of model.pipes){
    lines.push([
      cleanId(p.featureId),
      cleanId(p.fromNodeId),
      cleanId(p.toNodeId),
      n(p.lengthM,"pipe_length_missing"),
      n(p.diameterMm,"pipe_diameter_missing"),
      n(p.roughness.value,"pipe_roughness_missing"),
      String(p.minorLossCoefficient),
      p.initialStatus,
    ].join("\t"));
  }
  lines.push("");

  lines.push("[PUMPS]",";ID\tNode1\tNode2\tParameters");
  for(const p of model.pumps){
    lines.push([
      cleanId(p.featureId),
      cleanId(p.fromNodeId),
      cleanId(p.toNodeId),
      `HEAD ${cleanId(p.curveRef!)}${p.speed!==null ? ` SPEED ${p.speed}` : ""}`,
    ].join("\t"));
  }
  lines.push("");

  lines.push("[VALVES]",";ID\tNode1\tNode2\tDiameter(mm)\tType\tSetting\tMinorLoss");
  for(const v of model.valves){
    if(v.valveType==="ISOLATION") continue;
    const setting=v.valveType==="GPV"
      ? cleanId(v.curveRef!)
      : n(v.setting.value,"valve_setting_missing");
    lines.push([
      cleanId(v.featureId),
      cleanId(v.fromNodeId),
      cleanId(v.toNodeId),
      n(v.diameterMm,"valve_diameter_missing"),
      v.valveType,
      setting,
      "0",
    ].join("\t"));
  }
  lines.push("");

  lines.push("[CURVES]",";ID\tX(flow L/s)\tY(head m)");
  for(const curve of curves){
    for(const point of curve.points){
      lines.push([cleanId(curve.curveRef),String(point.flowLps),String(point.headM)].join("\t"));
    }
  }
  lines.push("");

  lines.push("[OPTIONS]");
  lines.push("UNITS\tLPS");
  lines.push(`HEADLOSS\t${formula}`);
  lines.push("");

  lines.push("[END]");

  return {ok:true,inp:lines.join("\n"),blockers:[],headlossFormula:formula};
}

export const PANTAVION_WATER_EPANET_EXPORT_POLICY={
  sourceNetworkReadOnly:true,
  mixedHeadlossFormulasAllowed:false,
  standaloneIsolationValveAutoConversionAllowed:false,
  pumpAndGpvCurvesMustBeExplicit:true,
  flowUnits:"LPS",
  darcyWeisbachRoughnessUnit:"mm",
} as const;
