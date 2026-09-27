export const PANTAVION_UTILITY_COORDINATION_CONTRACT_ID =
  "pantavion_utility_coordination_v1" as const;

export type PantavionUtilityDomain =
  | "water"
  | "sewer"
  | "stormwater"
  | "electricity"
  | "telecommunications"
  | "irrigation"
  | "gas"
  | "district_energy"
  | "other";

export type PantavionUtilityEvidenceState =
  | "confirmed"
  | "approximate"
  | "unavailable"
  | "unauthorized"
  | "unknown";

export type PantavionUtilityConflictSeverity =
  | "clear"
  | "advisory"
  | "caution"
  | "high"
  | "unknown";

export interface PantavionExcavationEnvelope {
  excavationId: string;
  requesterOrganizationId: string;
  requesterUtility: PantavionUtilityDomain;
  geometry: {
    type: "Point" | "LineString" | "Polygon";
    coordinates: unknown;
    crs: {
      authority: "EPSG" | "ESRI";
      code: string;
    };
  };
  safetyBufferMeters: number;
  requestedAt: string;
}

export interface PantavionUtilityConflictFinding {
  providerOrganizationId: string;
  utility: PantavionUtilityDomain;
  evidenceState: PantavionUtilityEvidenceState;
  conflictSeverity: PantavionUtilityConflictSeverity;
  assetClass?: string;
  knownDepthM?: number;
  knownOffsetM?: number;
  sourceReference?: string;
  sourceUpdatedAt?: string;
  warning?: string;
}

export interface PantavionUtilityCoordinationResult {
  excavationId: string;
  requesterOrganizationId: string;
  reciprocalRequestAllowed: boolean;
  exactNetworkGeometryShared: boolean;
  findings: PantavionUtilityConflictFinding[];
  generatedAt: string;
  legalPermitStillRequired: true;
  fieldVerificationStillRequired: true;
}

export const PANTAVION_UTILITY_COORDINATION_POLICY = {
  reciprocalAcrossAuthorizedOrganizations: true,
  organizationIsolationRequired: true,
  leastPrivilegeDisclosureRequired: true,
  bboxOrExcavationEnvelopeScopedAccess: true,
  exactGeometryDisclosureRequiresExplicitAuthorization: true,
  absenceOfReturnedDataMustNotBeInterpretedAsNoUtilityPresent: true,
  auditTrailRequired: true,
  sourceAndFreshnessEvidenceRequired: true,
  legalPermitStillRequired: true,
  professionalFieldVerificationStillRequired: true,
} as const;
