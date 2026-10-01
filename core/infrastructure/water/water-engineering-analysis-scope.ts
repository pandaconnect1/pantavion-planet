export type WaterEngineeringAnalysisScope =
  | "LOCAL_VIEWPORT"
  | "CONNECTED_SUBNETWORK"
  | "PRESSURE_ZONE"
  | "SUPPLY_PATH"
  | "CITYWIDE_NETWORK";

export const PANTAVION_WATER_ANALYSIS_SCOPE_POLICY = {
  mobileViewportRadiusMeters: 2000,
  mobileViewportIsDisplayOnly: true,
  engineeringMayTraverseBeyondViewport: true,
  defaultEngineeringScope: "CONNECTED_SUBNETWORK" as WaterEngineeringAnalysisScope,
  escalateToPressureZoneWhenNeeded: true,
  escalateToSupplyPathWhenNeeded: true,
  escalateToCitywideWhenNeeded: true,
  authenticNetworkReadAllowed: true,
  authenticNetworkWriteAllowed: false,
  hydraulicGraphMustPreserveConnectivity: true,
  trunkMainsMustNeverBeClippedByViewport: true,
  upstreamDownstreamTracingRequired: true,
  sourceToDemandTracingRequired: true,
} as const;

export type WaterEngineeringScopeDecision = {
  requestedAreaRef: string;
  selectedScope: WaterEngineeringAnalysisScope;
  includedNetworkRevisionId: string;
  expansionReasons: string[];
  includedPressureZones: string[];
  includedSupplyAssets: string[];
  includedTrunkMainRefs: string[];
};

export function assertEngineeringScopeCanExpand(
  scope: WaterEngineeringAnalysisScope,
) {
  if (scope === "LOCAL_VIEWPORT") {
    throw new Error("water_engineering_scope_too_narrow_for_hydraulic_conclusion");
  }
  return true;
}
