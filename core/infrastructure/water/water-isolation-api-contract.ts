import type {
  WaterIsolationSimulationRequest,
  WaterIsolationSimulationResult,
} from "./water-isolation-simulation";
import { simulateWaterIsolation } from "./water-isolation-service";
import type { WaterTopologyProvider } from "./water-topology-provider";

export type WaterIsolationApiSuccess = {
  ok: true;
  result: WaterIsolationSimulationResult;
};

export type WaterIsolationApiFailure = {
  ok: false;
  error:
    | "invalid_request"
    | "topology_unavailable"
    | "isolation_simulation_failed";
};

export type WaterIsolationApiResult =
  | WaterIsolationApiSuccess
  | WaterIsolationApiFailure;

export async function executeWaterIsolationSimulation(
  provider: WaterTopologyProvider | null,
  request: WaterIsolationSimulationRequest,
): Promise<WaterIsolationApiResult> {
  if (!provider) {
    return { ok: false, error: "topology_unavailable" };
  }

  try {
    const result = await simulateWaterIsolation(provider, request);
    return { ok: true, result };
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "water_revision_required",
        "water_fault_feature_required",
        "water_start_node_required",
        "water_closed_valve_required",
        "water_isolation_revision_mismatch",
      ].includes(error.message)
    ) {
      return { ok: false, error: "invalid_request" };
    }

    return { ok: false, error: "isolation_simulation_failed" };
  }
}
