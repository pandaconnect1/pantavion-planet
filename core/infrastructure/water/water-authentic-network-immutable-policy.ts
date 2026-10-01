export const PANTAVION_WATER_AUTHENTIC_NETWORK_POLICY = {
  authority: "FOUNDER_EXPLICIT_DIRECTIVE",
  version: "2026-10-01.v1",
  authenticNetwork: {
    immutable: true,
    assistantMayModify: false,
    assistantMayDelete: false,
    assistantMayReshapeGeometry: false,
    assistantMaySnapFeatures: false,
    assistantMayMoveFeatures: false,
    assistantMayChangeAttributes: false,
    assistantMayAutoCorrect: false,
    assistantMayReplaceSource: false,
  },
  allowedAssistantOperations: [
    "READ",
    "VERIFY_HASH_AND_LINEAGE",
    "INDEX_WITHOUT_MUTATING_SOURCE",
    "RENDER_DERIVED_VIEW_WITHOUT_GEOMETRY_CHANGE",
    "RUN_ANALYSIS_ON_SEPARATE_COPY",
    "GENERATE_RECOMMENDATIONS_ONLY",
  ],
  hydraulicEngineering: {
    mustUseSeparateScenarioLayer: true,
    mayWriteToAuthenticNetwork: false,
    outputsAreProposalsOnly: true,
    requiresExplicitHumanAuthorizationForAnyRealWorldChange: true,
  },
} as const;

export function assertAuthenticNetworkMutationForbidden(operation:string):never {
  throw new Error(`water_authentic_network_mutation_forbidden:${operation}`);
}
