export type WaterTopologyNodeKind =
  | "JUNCTION"
  | "RESERVOIR"
  | "TANK"
  | "PUMP_ENDPOINT"
  | "VALVE_ENDPOINT"
  | "SOURCE"
  | "BOUNDARY";

export type WaterTopologyLinkKind =
  | "PIPE"
  | "PUMP"
  | "VALVE"
  | "CONTROL_DEVICE";

export type WaterConnectivityEvidence =
  | "EXPLICIT_SOURCE_TOPOLOGY"
  | "SURVEYED_CONNECTION"
  | "VALIDATED_SHARED_ENDPOINT"
  | "MANUALLY_VERIFIED";

export type WaterTopologyNode = {
  nodeId:string;
  revisionId:string;
  kind:WaterTopologyNodeKind;
  geometryRef:string;
  evidence:WaterConnectivityEvidence;
};

export type WaterTopologyLink = {
  linkId:string;
  revisionId:string;
  authenticFeatureId:string;
  kind:WaterTopologyLinkKind;
  nodeA:string;
  nodeB:string;
  connectivityEvidence:WaterConnectivityEvidence;
  orientationSemantics:"STORAGE_ONLY_NOT_FLOW_DIRECTION";
};

export const PANTAVION_WATER_TOPOLOGY_POLICY = {
  sourceNetworkImmutable:true,
  automaticGeometrySnappingAllowed:false,
  automaticEndpointMovingAllowed:false,
  topologyMayReferenceAuthenticFeatures:true,
  topologyMayModifyAuthenticFeatures:false,
  connectivityMustHaveEvidence:true,
  physicalConnectivityIsUndirected:true,
  hydraulicFlowDirectionMustComeFromScenarioSolver:true,
  traceMayCrossEntireNetwork:true,
  topologyPinnedToNetworkRevision:true,
} as const;

export type WaterTraceRequest = {
  networkRevisionId:string;
  startNodeIds:string[];
  blockedFeatureIds?:string[];
  requiredAssetKinds?:WaterTopologyNodeKind[];
};

export type WaterTraceResult = {
  networkRevisionId:string;
  visitedNodeIds:string[];
  visitedFeatureIds:string[];
  reachedReservoirOrTankIds:string[];
  unresolvedConnectivityRefs:string[];
  complete:boolean;
};
