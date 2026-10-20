import { traceWaterNetwork, type WaterNetwork } from "./water-network-trace";

// Framework-free regression checks; run via Node's built-in test runner
// with TypeScript stripping, or through the repository's existing test harness.
import assert from "node:assert/strict";
import { test } from "node:test";

const sample: WaterNetwork = {
  nodes: [
    { id: "source", kind: "source" },
    { id: "junction", kind: "junction" },
    { id: "valve", kind: "valve" },
    { id: "customer", kind: "customer" },
  ],
  edges: [
    { id: "pipe1", from: "source", to: "junction" },
    { id: "pipe2", from: "junction", to: "valve" },
    { id: "pipe3", from: "valve", to: "customer" },
  ],
};

test("connected assets are reachable with valves open", () => {
  const result = traceWaterNetwork(sample, "source");
  assert.deepEqual(result.reachableNodeIds, ["customer", "junction", "source", "valve"]);
  assert.deepEqual(result.reachableEdgeIds, ["pipe1", "pipe2", "pipe3"]);
  assert.deepEqual(result.warnings, []);
});

test("closed valves block traversal", () => {
  const result = traceWaterNetwork(sample, "source", new Set(["valve"]));
  assert.deepEqual(result.reachableNodeIds, ["junction", "source"]);
  assert.deepEqual(result.reachableEdgeIds, ["pipe1"]);
  assert.deepEqual(result.blockedValveIds, ["valve"]);
});

test("missing starting nodes are reported", () => {
  assert.ok(traceWaterNetwork(sample, "missing").warnings.includes("start_node_missing"));
});

test("dangling edges are reported and not traversed", () => {
  const network: WaterNetwork = {
    ...sample,
    edges: [...sample.edges, { id: "bad", from: "source", to: "unknown" }],
  };
  const result = traceWaterNetwork(network, "source");
  assert.ok(result.warnings.includes("dangling_edge:bad"));
  assert.ok(!result.reachableEdgeIds.includes("bad"));
});

test("disabled segments are not traversed", () => {
  const network: WaterNetwork = {
    ...sample,
    edges: sample.edges.map((edge) =>
      edge.id === "pipe2" ? { ...edge, enabled: false } : edge
    ),
  };
  assert.deepEqual(traceWaterNetwork(network, "source").reachableNodeIds, ["junction", "source"]);
});
