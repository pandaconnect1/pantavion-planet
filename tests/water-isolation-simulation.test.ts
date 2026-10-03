import assert from "node:assert/strict";
import { buildIsolationSimulationResult } from "../core/infrastructure/water/water-isolation-simulation.ts";

const result = buildIsolationSimulationResult(
  {
    networkRevisionId: "revision-1",
    faultFeatureId: "pipe-fault",
    startNodeIds: ["node-source"],
    closedValveFeatureIds: ["valve-1"],
  },
  {
    networkRevisionId: "revision-1",
    visitedNodeIds: ["node-source", "node-a"],
    visitedFeatureIds: ["pipe-source"],
    reachedReservoirOrTankIds: ["reservoir-1"],
    unresolvedConnectivityRefs: [],
    complete: true,
  },
  ["pipe-source", "valve-1", "pipe-fault", "pipe-isolated"],
);

assert.deepEqual(result.isolatedFeatureIds, ["pipe-fault", "pipe-isolated"]);
assert.deepEqual(result.closedValveFeatureIds, ["valve-1"]);
assert.equal(result.mode, "SIMULATION");
assert.equal(result.fieldConfirmationRequired, true);
assert.equal(result.complete, true);

assert.throws(
  () =>
    buildIsolationSimulationResult(
      {
        networkRevisionId: "revision-2",
        faultFeatureId: "pipe-fault",
        startNodeIds: ["node-source"],
        closedValveFeatureIds: [],
      },
      {
        networkRevisionId: "revision-1",
        visitedNodeIds: [],
        visitedFeatureIds: [],
        reachedReservoirOrTankIds: [],
        unresolvedConnectivityRefs: [],
        complete: false,
      },
      [],
    ),
  /water_isolation_revision_mismatch/,
);

console.log(JSON.stringify({
  ok: true,
  simulationOnly: true,
  fieldConfirmationRequired: true,
  authenticNetworkModified: false,
}));
