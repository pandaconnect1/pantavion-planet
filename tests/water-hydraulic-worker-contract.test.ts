import assert from "node:assert/strict";
import { runWaterHydraulicWorker } from "../core/infrastructure/water/water-hydraulic-worker-contract.ts";
import type { WaterHydraulicModel } from "../core/infrastructure/water/water-hydraulic-model-contract.ts";

const model:WaterHydraulicModel={
  schemaVersion:"pantavion-water-hydraulic-model.v1",
  networkRevisionId:"rev-1",
  units:{length:"m",elevation:"m",diameter:"mm",flow:"L/s",pressureHead:"m"},
  junctions:[
    {nodeId:"J1",elevationM:100,baseDemandLps:2,evidence:[]},
  ],
  reservoirs:[
    {nodeId:"R1",hydraulicHeadM:130,evidence:[]},
  ],
  tanks:[],
  pipes:[
    {
      featureId:"P1",
      fromNodeId:"R1",
      toNodeId:"J1",
      lengthM:1000,
      diameterMm:200,
      roughness:{model:"HAZEN_WILLIAMS",value:130,unit:"dimensionless"},
      minorLossCoefficient:0,
      initialStatus:"OPEN",
      evidence:[],
    },
  ],
  valves:[],
  pumps:[],
  generatedAt:"2026-10-01T10:55:00Z",
  sourceReadOnly:true,
};

const blocked=await runWaterHydraulicWorker({
  jobId:"job-1",
  networkRevisionId:"rev-1",
  engineRequested:"EPANET_2_2",
  model,
  curves:[],
},null);
assert.equal(blocked.ok,false);
assert.equal(blocked.code,"HYDRAULIC_ENGINE_UNAVAILABLE");
assert.equal(blocked.governance.authenticNetworkModified,false);

const mock={
  engine:"EPANET_2_2" as const,
  engineVersion:"mock-2.2",
  async runEpanetInp(input:{inp:string;networkRevisionId:string;jobId:string}){
    assert.ok(input.inp.includes("[PIPES]"));
    return {
      engine:"EPANET_2_2" as const,
      engineVersion:"mock-2.2",
      simulationStartedAt:"2026-10-01T10:55:00Z",
      simulationFinishedAt:"2026-10-01T10:55:01Z",
      nodes:[{nodeId:"J1",pressureHeadM:25,hydraulicHeadM:125,demandLps:2}],
      links:[{featureId:"P1",flowLps:2,velocityMps:0.064,headlossM:5,status:"OPEN"}],
      warnings:[],
    };
  }
};

const ok=await runWaterHydraulicWorker({
  jobId:"job-2",
  networkRevisionId:"rev-1",
  engineRequested:"EPANET_2_2",
  model,
  curves:[],
},mock);

assert.equal(ok.ok,true);
if(ok.ok){
  assert.equal(ok.result.nodes[0].pressureHeadM,25);
  assert.equal(ok.governance.authenticNetworkModified,false);
}

console.log(JSON.stringify({ok:true,missingEngineBlocked:true,mockEngineExecuted:true,authenticNetworkModified:false}));
