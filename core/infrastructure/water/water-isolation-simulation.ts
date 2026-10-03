import type { WaterTraceResult } from "./water-topology-graph-contract";

export type WaterIsolationSimulationRequest = {
  networkRevisionId: string;
  faultFeatureId: string;
  /** Supply-side/source nodes used as physical-connectivity seeds. */
  startNodeIds: string[];
  closedValveFeatureIds: string[];
};

export type WaterIsolationSimulationResult = {
  mode: "SIMULATION";
  semantics: "PHYSICAL_CONNECTIVITY_ONLY";
  hydraulicImpactConfirmed: false;
  networkRevisionId: string;
  faultFeatureId: string;
  closedValveFeatureIds: string[];
  /**
   * Features physically disconnected from the supplied start-node set after
   * blocking the proposed valve features. This is not a hydraulic-flow result.
   */
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
    semantics: "PHYSICAL_CONNECTIVITY_ONLY",
    hydraulicImpactConfirmed: false,
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
