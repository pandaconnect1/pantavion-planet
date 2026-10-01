export type PantavionWaterAnalysisScope =
  | "FIELD_VIEW"
  | "HYDRAULIC_INFLUENCE_GRAPH"
  | "FULL_NETWORK_MODEL";

export const PANTAVION_WATER_ANALYSIS_SCOPE_POLICY = {
  fieldView: {
    defaultRadiusMeters: 2000,
    clientMayReceiveWholeNetwork: false,
    purpose: "fast_mobile_operational_view",
  },
  engineeringAnalysis: {
    mayReadWholeCanonicalNetwork: true,
    rawMasterMayBeMutated: false,
    analysisRunsServerSide: true,
    defaultScope: "HYDRAULIC_INFLUENCE_GRAPH" as PantavionWaterAnalysisScope,
    escalateToFullNetworkWhenHydraulicallyRequired: true,
    mustIncludeUpstreamAndDownstreamDependencies: true,
    mustTraversePrimaryAndTrunkMains: true,
    mustIncludeSourcesTanksPumpsAndControlValves: true,
    mustRespectPressureZonesAndHydraulicBoundaries: true,
    mustUsePinnedNetworkRevision: true,
  },
} as const;

export type WaterHydraulicDependencyContext = {
  requestedAreaRef: string;
  networkRevisionId: string;
  sourceNodes: string[];
  reservoirsAndTanks: string[];
  pumps: string[];
  controlValves: string[];
  trunkMains: string[];
  pressureZones: string[];
  upstreamFeatureIds: string[];
  downstreamFeatureIds: string[];
};

export function chooseWaterEngineeringAnalysisScope(input:{
  hasCompleteInfluenceClosure:boolean;
  crossesPressureZoneBoundary:boolean;
  dependsOnRemoteSourceOrTrunkMain:boolean;
  unresolvedHydraulicDependency:boolean;
}):PantavionWaterAnalysisScope{
  if(
    !input.hasCompleteInfluenceClosure ||
    input.crossesPressureZoneBoundary ||
    input.dependsOnRemoteSourceOrTrunkMain ||
    input.unresolvedHydraulicDependency
  ){
    return "FULL_NETWORK_MODEL";
  }
  return "HYDRAULIC_INFLUENCE_GRAPH";
}
