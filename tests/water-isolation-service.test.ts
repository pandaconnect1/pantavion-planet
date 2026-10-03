import assert from "node:assert/strict";
import { simulateWaterIsolation } from "../core/infrastructure/water/water-isolation-service";
import type { WaterTopologyProvider } from "../core/infrastructure/water/water-topology-provider";
import type { WaterTraceResult } from "../core/infrastructure/water/water-topology-graph-contract";

const request = {
  networkRevisionId: "revision-1",
  faultFeatureId: "pipe-fault",
  startNodeIds: ["node-source"],
  closedValveFeatureIds: ["valve-1"],
};

function providerWithTrace(trace: WaterTraceResult): WaterTopologyProvider {
  return {
    async traceConnectedNetwork() {
      return trace;
    },
    async listRevisionFeatureIds() {
      return ["pipe-source", "valve-1", "pipe-fault"];
    },
  };
}

async function run() {
  await assert.rejects(
    () =>
      simulateWaterIsolation(
        providerWithTrace({
          networkRevisionId: "revision-1",
          visitedNodeIds: ["node-source"],
          visitedFeatureIds: ["pipe-source"],
          reachedReservoirOrTankIds: [],
          unresolvedConnectivityRefs: [],
          complete: false,
        }),
        request,
      ),
    /water_topology_trace_incomplete/,
  );

  await assert.rejects(
    () =>
      simulateWaterIsolation(
        providerWithTrace({
          networkRevisionId: "revision-1",
          visitedNodeIds: ["node-source"],
          visitedFeatureIds: ["pipe-source"],
          reachedReservoirOrTankIds: [],
          unresolvedConnectivityRefs: ["link-missing-evidence"],
          complete: true,
        }),
        request,
      ),
    /water_topology_connectivity_unresolved/,
  );

  const result = await simulateWaterIsolation(
    providerWithTrace({
      networkRevisionId: "revision-1",
      visitedNodeIds: ["node-source"],
      visitedFeatureIds: ["pipe-source"],
      reachedReservoirOrTankIds: ["reservoir-1"],
      unresolvedConnectivityRefs: [],
      complete: true,
    }),
    request,
  );

  assert.equal(result.complete, true);
  assert.equal(result.hydraulicImpactConfirmed, false);
  assert.equal(result.fieldConfirmationRequired, true);
  assert.deepEqual(result.isolatedFeatureIds, ["pipe-fault"]);

  console.log("water-isolation-service: fail-closed topology gate ok");
}

run();
