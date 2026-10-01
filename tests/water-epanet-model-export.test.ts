import assert from "node:assert/strict";
import { exportWaterHydraulicModelToEpanetInp } from "../core/infrastructure/water/water-epanet-model-export";
import type { WaterHydraulicModel } from "../core/infrastructure/water/water-hydraulic-model-contract";

const base:WaterHydraulicModel={
  schemaVersion:"pantavion-water-hydraulic-model.v1",
  networkRevisionId:"rev-1",
  units:{length:"m",elevation:"m",diameter:"mm",flow:"L/s",pressureHead:"m"},
  junctions:[
    {nodeId:"J1",elevationM:100,baseDemandLps:2,evidence:[]},
    {nodeId:"J2",elevationM:95,baseDemandLps:1,evidence:[]},
  ],
  reservoirs:[{nodeId:"R1",hydraulicHeadM:130,evidence:[]}],
  tanks:[],
  pipes:[
    {featureId:"P1",fromNodeId:"R1",toNodeId:"J1",lengthM:1000,diameterMm:200,roughness:{model:"HAZEN_WILLIAMS",value:130,unit:"dimensionless"},minorLossCoefficient:0,initialStatus:"OPEN",evidence:[]},
    {featureId:"P2",fromNodeId:"J1",toNodeId:"J2",lengthM:500,diameterMm:150,roughness:{model:"HAZEN_WILLIAMS",value:130,unit:"dimensionless"},minorLossCoefficient:0,initialStatus:"OPEN",evidence:[]},
  ],
  valves:[],
  pumps:[],
  generatedAt:"2026-10-01T10:30:00Z",
  sourceReadOnly:true,
};

const ok=exportWaterHydraulicModelToEpanetInp(base,[]);
assert.equal(ok.ok,true);
assert.equal(ok.headlossFormula,"H-W");
assert.ok(ok.inp?.includes("UNITS\tLPS"));
assert.ok(ok.inp?.includes("[PIPES]"));

const mixed:WaterHydraulicModel={
  ...base,
  pipes:[
    base.pipes[0],
    {...base.pipes[1],roughness:{model:"DARCY_WEISBACH",value:0.1,unit:"mm"}},
  ],
};
const mixedResult=exportWaterHydraulicModelToEpanetInp(mixed,[]);
assert.equal(mixedResult.ok,false);
assert.ok(mixedResult.blockers.includes("MIXED_HEADLOSS_FORMULAS_NOT_ALLOWED"));

const isolation:WaterHydraulicModel={
  ...base,
  valves:[{
    featureId:"V1",
    fromNodeId:"J1",
    toNodeId:"J2",
    valveType:"ISOLATION",
    diameterMm:150,
    initialStatus:"OPEN",
    evidence:[],
  }],
};
const isolationResult=exportWaterHydraulicModelToEpanetInp(isolation,[]);
assert.equal(isolationResult.ok,false);
assert.ok(isolationResult.blockers.includes("ISOLATION_VALVE_REQUIRES_EXPLICIT_CONTROLLED_PIPE_MAPPING"));

console.log(JSON.stringify({ok:true,validExport:true,mixedBlocked:true,isolationBlocked:true}));
