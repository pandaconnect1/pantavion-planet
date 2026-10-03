import assert from "node:assert/strict";
import { executeWaterIsolationSimulation } from "../core/infrastructure/water/water-isolation-api-contract.ts";
import type { WaterTopologyProvider } from "../core/infrastructure/water/water-topology-provider.ts";

const request = {
  networkRevisionId: "revision-1",
  faultFeatureId: "pipe-fault",
  startNodeIds: ["source-node"],
  closedValveFeatureIds: ["valve-1"],
};

const unavailable = await executeWaterIsolationSimulation(null, request);
assert.deepEqual(unavailable, { ok: false, error: "topology_unavailable" });

const provider: WaterTopologyProvider = {
  async traceConnectedNetwork(traceRequest) {
    assert.deepEqual(traceRequest.blockedFeatureIds, ["valve-1"]);
    return {
      networkRevisionId: "revision-1",
      visitedNodeIds: ["source-node"],
      visitedFeatureIds: ["source-pipe"],
      reachedReservoirOrTankIds: ["reservoir-1"],
      unresolvedConnectivityRefs: [],
      complete: true,
    };
  },
  async listRevisionFeatureIds() {
    return ["source-pipe", "valve-1", "pipe-fault", "isolated-pipe"];
  },
};

const success = await executeWaterIsolationSimulation(provider, request);
assert.equal(success.ok, true);
if (success.ok) {
  assert.equal(success.result.mode, "SIMULATION");
  assert.equal(success.result.fieldConfirmationRequired, true);
  assert.deepEqual(success.result.isolatedFeatureIds, ["isolated-pipe", "pipe-fault"]);
}

console.log(JSON.stringify({
  ok: true,
  failClosedWithoutTopologyProvider: true,
  simulationRequiresFieldConfirmation: true,
}));
