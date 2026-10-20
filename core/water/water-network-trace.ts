/** Pure, side-effect-free water network tracing primitives.
 * This is a candidate calculation, NEVER an instruction to operate a valve.
 * Inputs must originate from a separately validated GIS topology.
 */
export type WaterNode = { id: string; kind?: "junction" | "valve" | "source" | "customer" };
export type WaterEdge = { id: string; from: string; to: string; enabled?: boolean };
export type WaterNetwork = { nodes: WaterNode[]; edges: WaterEdge[] };
export type TraceResult = {
  reachableNodeIds: string[];
  reachableEdgeIds: string[];
  blockedValveIds: string[];
  warnings: string[];
};

export function traceWaterNetwork(
  network: WaterNetwork,
  startNodeId: string,
  closedValveIds: ReadonlySet<string> = new Set(),
): TraceResult {
  const warnings: string[] = [];
  const nodes = new Map<string, WaterNode>();
  for (const node of network.nodes) {
    if (nodes.has(node.id)) warnings.push(`duplicate_node:${node.id}`);
    nodes.set(node.id, node);
  }
  if (!nodes.has(startNodeId)) {
    return { reachableNodeIds: [], reachableEdgeIds: [], blockedValveIds: [], warnings: [...warnings, "start_node_missing"] };
  }
  const adjacency = new Map<string, WaterEdge[]>();
  for (const edge of network.edges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) {
      warnings.push(`dangling_edge:${edge.id}`);
      continue;
    }
    for (const id of [edge.from, edge.to]) {
      const list = adjacency.get(id) ?? [];
      list.push(edge);
      adjacency.set(id, list);
    }
  }
  const visited = new Set<string>([startNodeId]);
  const edges = new Set<string>();
  const blocked = new Set<string>();
  const queue = [startNodeId];
  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i];
    for (const edge of adjacency.get(current) ?? []) {
      if (edge.enabled === false) continue;
      const next = edge.from === current ? edge.to : edge.from;
      const node = nodes.get(next)!;
      if (node.kind === "valve" && closedValveIds.has(next)) {
        blocked.add(next);
        continue;
      }
      edges.add(edge.id);
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return {
    reachableNodeIds: [...visited].sort(),
    reachableEdgeIds: [...edges].sort(),
    blockedValveIds: [...blocked].sort(),
    warnings,
  };
}
