import assert from "node:assert/strict";
import {
  chooseWaterEngineeringAnalysisScope,
  PANTAVION_WATER_ANALYSIS_SCOPE_POLICY,
} from "../core/infrastructure/water/water-analysis-scope-policy.ts";

assert.equal(PANTAVION_WATER_ANALYSIS_SCOPE_POLICY.fieldView.defaultRadiusMeters,2000);
assert.equal(PANTAVION_WATER_ANALYSIS_SCOPE_POLICY.fieldView.clientMayReceiveWholeNetwork,false);
assert.equal(PANTAVION_WATER_ANALYSIS_SCOPE_POLICY.engineeringAnalysis.mayReadWholeCanonicalNetwork,true);

assert.equal(
  chooseWaterEngineeringAnalysisScope({
    hasCompleteInfluenceClosure:true,
    crossesPressureZoneBoundary:false,
    dependsOnRemoteSourceOrTrunkMain:false,
    unresolvedHydraulicDependency:false,
  }),
  "HYDRAULIC_INFLUENCE_GRAPH"
);

assert.equal(
  chooseWaterEngineeringAnalysisScope({
    hasCompleteInfluenceClosure:true,
    crossesPressureZoneBoundary:false,
    dependsOnRemoteSourceOrTrunkMain:true,
    unresolvedHydraulicDependency:false,
  }),
  "FULL_NETWORK_MODEL"
);

console.log(JSON.stringify({
  ok:true,
  fieldRadiusMeters:2000,
  internalEngineeringCanEscalateTo:"FULL_NETWORK_MODEL"
}));
