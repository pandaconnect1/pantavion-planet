import type { WaterTraceResult } from "./water-topology-graph-contract";

export type WaterIsolationSimulationRequest = {
  networkRevisionId: string;
  faultFeatureId: string;
  startNodeIds: string[];
  closedValveFeatureIds: string[];
};

export type WaterIsolationSimulationResult = {
  mode: "SIMULATION";
  networkRevisionId: string;
  faultFeatureId: string;
  closedValveFeatureIds: string[];
  isolatedFeatureIds: string[];
  visitedNodeIds: string[];
  reachedReservoirOrTankIds: string[];
  unresolvedConnectivityRefs: string[];
  complete: boolean;
  fieldConfirmationRequired: true;
};

export function buildIsolationSimulationResult(
  request: WaterIsolationSimulationRequest,
  trace: WaterTraceResult,
  allRevisionFeatureIds: readonly string[],
): WaterIsolationSimulationResult {
  if (trace.networkRevisionId !== request.networkRevisionId) {
    throw new Error("water_isolation_revision_mismatch");
  }

  const reachable = new Set(trace.visitedFeatureIds);
  const blocked = new Set(request.closedValveFeatureIds);

  const isolatedFeatureIds = [...new Set(allRevisionFeatureIds)]
    .filter((featureId) => !reachable.has(featureId) && !blocked.has(featureId))
    .sort();

  return {
    mode: "SIMULATION",
    networkRevisionId: request.networkRevisionId,
    faultFeatureId: request.faultFeatureId,
    closedValveFeatureIds: [...blocked].sort(),
    isolatedFeatureIds,
    visitedNodeIds: [...new Set(trace.visitedNodeIds)].sort(),
    reachedReservoirOrTankIds: [...new Set(trace.reachedReservoirOrTankIds)].sort(),
    unresolvedConnectivityRefs: [...new Set(trace.unresolvedConnectivityRefs)].sort(),
    complete: trace.complete,
    fieldConfirmationRequired: true,
  };
}
