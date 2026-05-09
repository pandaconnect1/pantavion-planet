export const PANTAVION_WATER_SERVING_CONTRACT_VERSION = "water-serving-contract-v1" as const;

export type PantavionWaterAccessStatus = "active" | "inactive" | "revoked";

export type PantavionWaterServingPattern =
  | "postgis"
  | "bbox-api"
  | "vector-tiles"
  | "pmtiles"
  | "mbtiles"
  | "mvt"
  | "protected-tile-service";

export type PantavionWaterServingLayer =
  | "protected-full-master-source"
  | "private-processing-pipeline"
  | "private-spatial-index"
  | "controlled-serving-api"
  | "renderer-downstream-only";

export interface PantavionWaterAuthorizedPerson {
  firstName: string;
  lastName: string;
  title: string;
  accessLevel: string;
  status: PantavionWaterAccessStatus;
}

export interface PantavionWaterServingReadinessInput {
  hasWaterKernelConstitution: boolean;
  hasDataTruthReport: boolean;
  hasFullMasterStrategy: boolean;
  hasDataServingStrategy: boolean;
  hasServingArchitectureDecision: boolean;
  fullMasterProtected: boolean;
  spatialServingReady: boolean;
  accessControlReady: boolean;
  founderApprovedProductionActivation: boolean;
}

export interface PantavionWaterServingReadinessResult {
  allowed: boolean;
  blockers: string[];
}

export const PANTAVION_WATER_SERVING_ARCHITECTURE = {
  version: PANTAVION_WATER_SERVING_CONTRACT_VERSION,
  decision: "controlled-hybrid-spatial-serving",
  productionTarget: ["postgis", "bbox-api", "vector-tiles", "protected-tile-service"],
  diagnosticOnly: ["pmtiles", "mbtiles", "mvt"],
  layers: [
    "protected-full-master-source",
    "private-processing-pipeline",
    "private-spatial-index",
    "controlled-serving-api",
    "renderer-downstream-only",
  ],
  forbidden: [
    "The browser must never load the full raw water network directly",
    "No mobile preview as production truth",
    "No 5000-feature subset as production truth",
    "No sampled data as production truth",
    "No public raw KMZ/KML/GeoJSON export",
    "No renderer-first development",
  ],
} as const;

export function isAuthorizedWaterPerson(person: PantavionWaterAuthorizedPerson): boolean {
  return (
    person.status === "active" &&
    person.firstName.trim().length > 0 &&
    person.lastName.trim().length > 0 &&
    person.title.trim().length > 0 &&
    person.accessLevel.trim().length > 0
  );
}

export function evaluateWaterServingReadiness(
  input: PantavionWaterServingReadinessInput,
): PantavionWaterServingReadinessResult {
  const blockers: string[] = [];

  if (!input.hasWaterKernelConstitution) blockers.push("Missing Water Kernel Constitution");
  if (!input.hasDataTruthReport) blockers.push("Missing Water Data Truth Report");
  if (!input.hasFullMasterStrategy) blockers.push("Missing Full Master Strategy");
  if (!input.hasDataServingStrategy) blockers.push("Missing Data Serving Strategy");
  if (!input.hasServingArchitectureDecision) blockers.push("Missing Serving Architecture Decision");
  if (!input.fullMasterProtected) blockers.push("Full master source is not protected");
  if (!input.spatialServingReady) blockers.push("Spatial serving is not ready");
  if (!input.accessControlReady) blockers.push("Access control is not ready");
  if (!input.founderApprovedProductionActivation) blockers.push("Founder/admin approval is required before production activation");

  return {
    allowed: blockers.length === 0,
    blockers,
  };
}
