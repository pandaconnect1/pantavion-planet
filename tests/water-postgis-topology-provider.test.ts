import assert from "node:assert/strict";
import { PostgisWaterTopologyProvider, type WaterSqlExecutor } from "../core/infrastructure/water/water-postgis-topology-provider";

const sql: WaterSqlExecutor = {
  async query<Row extends Record<string, unknown>>() {
    return {
      rows: [
        { node_id: "node-source", feature_id: "pipe-1" },
        { node_id: "node-a", feature_id: "pipe-2" },
      ] as unknown as Row[],
    };
  },
};

async function run() {
  const provider = new PostgisWaterTopologyProvider(sql);
  const trace = await provider.traceConnectedNetwork({
    networkRevisionId: "revision-1",
    startNodeIds: ["node-source"],
    blockedFeatureIds: [],
  });

  assert.deepEqual(trace.visitedNodeIds, ["node-a", "node-source"]);
  assert.deepEqual(trace.visitedFeatureIds, ["pipe-1", "pipe-2"]);
  assert.equal(
    trace.complete,
    false,
    "a connectivity query must not claim topology completeness without revision validation",
  );

  console.log("water-postgis-topology-provider: unverified topology fails closed");
}

run();
