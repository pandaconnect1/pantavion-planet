import {
  buildIsolationSimulationResult,
  type WaterIsolationSimulationRequest,
  type WaterIsolationSimulationResult,
} from "./water-isolation-simulation";
import type { WaterTopologyProvider } from "./water-topology-provider";

export async function simulateWaterIsolation(
  provider: WaterTopologyProvider,
  request: WaterIsolationSimulationRequest,
): Promise<WaterIsolationSimulationResult> {
  if (!request.networkRevisionId.trim()) throw new Error("water_revision_required");
  if (!request.faultFeatureId.trim()) throw new Error("water_fault_feature_required");
  if (request.startNodeIds.length === 0) throw new Error("water_start_node_required");
  if (request.closedValveFeatureIds.length === 0) throw new Error("water_closed_valve_required");

  const [trace, allRevisionFeatureIds] = await Promise.all([
    provider.traceConnectedNetwork({
      networkRevisionId: request.networkRevisionId,
      startNodeIds: request.startNodeIds,
      blockedFeatureIds: request.closedValveFeatureIds,
    }),
    provider.listRevisionFeatureIds(request.networkRevisionId),
  ]);

  // Isolation is safety-relevant operational guidance. Never calculate an
  // isolated area from topology that the provider has not proven complete.
  if (!trace.complete) throw new Error("water_topology_trace_incomplete");
  if (trace.unresolvedConnectivityRefs.length > 0) {
    throw new Error("water_topology_connectivity_unresolved");
  }

  return buildIsolationSimulationResult(request, trace, allRevisionFeatureIds);
}
