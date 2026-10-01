import assert from "node:assert/strict";
import { PANTAVION_WATER_TOPOLOGY_POLICY } from "../core/infrastructure/water/water-topology-graph-contract.ts";

assert.equal(PANTAVION_WATER_TOPOLOGY_POLICY.sourceNetworkImmutable,true);
assert.equal(PANTAVION_WATER_TOPOLOGY_POLICY.automaticGeometrySnappingAllowed,false);
assert.equal(PANTAVION_WATER_TOPOLOGY_POLICY.automaticEndpointMovingAllowed,false);
assert.equal(PANTAVION_WATER_TOPOLOGY_POLICY.physicalConnectivityIsUndirected,true);
assert.equal(PANTAVION_WATER_TOPOLOGY_POLICY.hydraulicFlowDirectionMustComeFromScenarioSolver,true);
assert.equal(PANTAVION_WATER_TOPOLOGY_POLICY.traceMayCrossEntireNetwork,true);
assert.equal(PANTAVION_WATER_TOPOLOGY_POLICY.topologyPinnedToNetworkRevision,true);

console.log(JSON.stringify({
  ok:true,
  authenticNetworkImmutable:true,
  automaticSnapping:false,
  fullNetworkTrace:true,
  flowDirection:"scenario_solver_only"
}));
