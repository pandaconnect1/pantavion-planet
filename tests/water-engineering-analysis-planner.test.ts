import assert from "node:assert/strict";
import { planWaterEngineeringAnalysis } from "../core/infrastructure/water/water-engineering-analysis-planner.ts";
import type { WaterEngineeringQuery, WaterEngineeringEvidenceSource } from "../core/infrastructure/water/water-engineering-ai-contract.ts";

function query(intent:WaterEngineeringQuery["intent"]):WaterEngineeringQuery{
  return {
    queryId:"q-1",
    requestedBy:"authorized-user",
    intent,
    area:{namedArea:"test-area"},
    networkRevisionId:"rev-1",
    requestedAt:"2026-10-01T11:00:00Z",
  };
}

const localDeps={
  hasCompleteInfluenceClosure:true,
  crossesPressureZoneBoundary:false,
  dependsOnRemoteSourceOrTrunkMain:false,
  unresolvedHydraulicDependency:false,
};

const leak=planWaterEngineeringAnalysis({
  query:query("HIDDEN_LEAK_ANOMALY"),
  availableEvidence:["AUTHENTIC_NETWORK_REVISION"],
  hydraulicDependency:localDeps,
});
assert.equal(leak.analysisLevel,"BLOCKED");
assert.equal(leak.engine,"WNTR");
assert.ok(leak.missingForAnyAnalysis.some(x=>x.id==="flow_calibration"));
assert.ok(leak.missingForAnyAnalysis.some(x=>x.id==="pressure_calibration"));

const screening=planWaterEngineeringAnalysis({
  query:query("PRESSURE_ADEQUACY"),
  availableEvidence:[
    "AUTHENTIC_NETWORK_REVISION",
    "SURVEYED_ELEVATION",
    "CUSTOMER_DEMAND",
  ],
  hydraulicDependency:localDeps,
});
assert.equal(screening.analysisLevel,"SCREENING_ONLY");
assert.equal(screening.engine,"EPANET_2_2");
assert.ok(screening.missingForAuthoritative.length>0);

const fullEvidence:WaterEngineeringEvidenceSource[]=[
  "AUTHENTIC_NETWORK_REVISION",
  "SURVEYED_ELEVATION",
  "CUSTOMER_DEMAND",
  "PRESSURE_LOGGER",
  "FLOW_METER",
  "TANK_LEVEL",
  "VALVE_STATE",
];
const calibrated=planWaterEngineeringAnalysis({
  query:query("PRESSURE_ADEQUACY"),
  availableEvidence:fullEvidence,
  hydraulicDependency:{
    ...localDeps,
    dependsOnRemoteSourceOrTrunkMain:true,
  },
});
assert.equal(calibrated.analysisLevel,"CALIBRATED_ENGINEERING");
assert.equal(calibrated.analysisScope,"FULL_NETWORK_MODEL");
assert.equal(calibrated.rules.authenticNetworkModified,false);

console.log(JSON.stringify({
  ok:true,
  hiddenLeakWithoutTelemetry:"BLOCKED",
  incompletePressure:"SCREENING_ONLY",
  calibratedRemoteMain:"FULL_NETWORK_MODEL",
}));
