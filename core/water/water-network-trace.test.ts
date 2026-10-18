import { describe, expect, it } from "vitest";
import { traceWaterNetwork, type WaterNetwork } from "./water-network-trace";

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

describe("water network tracing (simulation only)", () => {
  it("traces connected assets with all valves open", () => {
    const result = traceWaterNetwork(sample, "source");
    expect(result.reachableNodeIds).toEqual(["customer", "junction", "source", "valve"]);
    expect(result.reachableEdgeIds).toEqual(["pipe1", "pipe2", "pipe3"]);
    expect(result.warnings).toEqual([]);
  });
  it("stops at a closed valve", () => {
    const result = traceWaterNetwork(sample, "source", new Set(["valve"]));
    expect(result.reachableNodeIds).toEqual(["junction", "source"]);
    expect(result.reachableEdgeIds).toEqual(["pipe1"]);
    expect(result.blockedValveIds).toEqual(["valve"]);
  });
  it("reports a missing starting node", () => {
    expect(traceWaterNetwork(sample, "missing").warnings).toContain("start_node_missing");
  });
  it("reports dangling GIS edges", () => {
    const network: WaterNetwork = { ...sample, edges: [...sample.edges, { id: "bad", from: "source", to: "unknown" }] };
    const result = traceWaterNetwork(network, "source");
    expect(result.warnings).toContain("dangling_edge:bad");
    expect(result.reachableEdgeIds).not.toContain("bad");
  });
  it("does not traverse disabled segments", () => {
    const network: WaterNetwork = { ...sample, edges: sample.edges.map(e => e.id === "pipe2" ? { ...e, enabled: false } : e) };
    expect(traceWaterNetwork(network, "source").reachableNodeIds).toEqual(["junction", "source"]);
  });
});
