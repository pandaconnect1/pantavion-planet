import type { WaterTraceRequest, WaterTraceResult } from "./water-topology-graph-contract";

export interface WaterTopologyProvider {
  traceConnectedNetwork(request: WaterTraceRequest): Promise<WaterTraceResult>;
  listRevisionFeatureIds(networkRevisionId: string): Promise<string[]>;
}

export class WaterTopologyUnavailableError extends Error {
  constructor() {
    super("water_topology_provider_unavailable");
    this.name = "WaterTopologyUnavailableError";
  }
}
