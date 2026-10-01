import assert from "node:assert/strict";
import { createWaterHydraulicJobFingerprint } from "../core/infrastructure/water/water-hydraulic-job-fingerprint.ts";
import type { WaterHydraulicModel } from "../core/infrastructure/water/water-hydraulic-model-contract.ts";

function model(generatedAt:string):WaterHydraulicModel{
  return {
    schemaVersion:"pantavion-water-hydraulic-model.v1",
    networkRevisionId:"rev-1",
    units:{length:"m",elevation:"m",diameter:"mm",flow:"L/s",pressureHead:"m"},
    junctions:[{nodeId:"J1",elevationM:100,baseDemandLps:1,evidence:[]}],
    reservoirs:[{nodeId:"R1",hydraulicHeadM:130,evidence:[]}],
    tanks:[],
    pipes:[{
      featureId:"P1",
      fromNodeId:"R1",
      toNodeId:"J1",
      lengthM:100,
      diameterMm:100,
      roughness:{model:"HAZEN_WILLIAMS",value:130,unit:"dimensionless"},
      minorLossCoefficient:0,
      initialStatus:"OPEN",
      evidence:[],
    }],
    valves:[],
    pumps:[],
    generatedAt,
    sourceReadOnly:true,
  };
}

const a=createWaterHydraulicJobFingerprint({
  engine:"EPANET_2_2",
  analysisScope:"FULL_NETWORK_MODEL",
  networkRevisionId:"rev-1",
  model:model("2026-10-01T10:00:00Z"),
  curves:[],
  telemetrySnapshotRefs:["t2","t1"],
});
const b=createWaterHydraulicJobFingerprint({
  engine:"EPANET_2_2",
  analysisScope:"FULL_NETWORK_MODEL",
  networkRevisionId:"rev-1",
  model:model("2026-10-01T10:05:00Z"),
  curves:[],
  telemetrySnapshotRefs:["t1","t2"],
});
assert.equal(a.sha256,b.sha256);

const c=createWaterHydraulicJobFingerprint({
  engine:"WNTR",
  analysisScope:"FULL_NETWORK_MODEL",
  networkRevisionId:"rev-1",
  model:model("2026-10-01T10:05:00Z"),
  curves:[],
  telemetrySnapshotRefs:["t1","t2"],
});
assert.notEqual(a.sha256,c.sha256);

console.log(JSON.stringify({ok:true,deterministic:true,generatedAtExcluded:true,engineAffectsFingerprint:true}));
