import {
  evaluateWaterServingReadiness,
  type PantavionWaterAuthorizedPerson,
  type PantavionWaterServingReadinessInput,
  type PantavionWaterServingReadinessResult,
} from "./water-serving-contract";

import { evaluateControlledWaterAccess } from "./controlled-water-access";

export const PANTAVION_WATER_CONTROLLED_SERVING_SCAFFOLD_VERSION =
  "water-controlled-serving-scaffold-v1" as const;

export type PantavionWaterServingMode =
  | "blocked"
  | "diagnostic"
  | "controlled-production-ready";

export interface PantavionWaterBoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface PantavionWaterServingRequest {
  bbox: PantavionWaterBoundingBox;
  zoom: number;
  requester: PantavionWaterAuthorizedPerson;
  readiness: PantavionWaterServingReadinessInput;
}

export interface PantavionWaterServingDecision {
  mode: PantavionWaterServingMode;
  allowed: boolean;
  blockers: string[];
  warnings: string[];
  mayReturnRawMaster: false;
  mayReturnCompleteNetwork: false;
  servingPattern: "none" | "bbox-api" | "protected-vector-tile-service";
}

export function isValidWaterBoundingBox(bbox: PantavionWaterBoundingBox): boolean {
  const validLng =
    Number.isFinite(bbox.minLng) &&
    Number.isFinite(bbox.maxLng) &&
    bbox.minLng >= -180 &&
    bbox.maxLng <= 180 &&
    bbox.minLng < bbox.maxLng;

  const validLat =
    Number.isFinite(bbox.minLat) &&
    Number.isFinite(bbox.maxLat) &&
    bbox.minLat >= -90 &&
    bbox.maxLat <= 90 &&
    bbox.minLat < bbox.maxLat;

  return validLng && validLat;
}

export function isValidWaterZoom(zoom: number): boolean {
  return Number.isInteger(zoom) && zoom >= 0 && zoom <= 24;
}

export function planControlledWaterServingRequest(
  request: PantavionWaterServingRequest,
): PantavionWaterServingDecision {
  const readiness: PantavionWaterServingReadinessResult =
    evaluateWaterServingReadiness(request.readiness);

  const accessDecision = evaluateControlledWaterAccess(request.requester);

  const blockers = [...readiness.blockers, ...accessDecision.blockers];
  const warnings: string[] = [];

  if (!isValidWaterBoundingBox(request.bbox)) {
    blockers.push("Invalid bbox. Controlled serving requires a valid visible spatial area.");
  }

  if (!isValidWaterZoom(request.zoom)) {
    blockers.push("Invalid zoom. Controlled serving requires a valid zoom level.");
  }

  if (blockers.length > 0) {
    return {
      mode: "blocked",
      allowed: false,
      blockers,
      warnings,
      mayReturnRawMaster: false,
      mayReturnCompleteNetwork: false,
      servingPattern: "none",
    };
  }

  warnings.push(
    "Serving is permission-aware and viewport-limited. The full raw master network must never be returned to the browser.",
  );

  if (accessDecision.mayViewFullControlledFounderScope) {
    warnings.push(
      "Founder/admin controlled view may inspect the authorized full scope, but raw export remains blocked.",
    );
  }

  return {
    mode: "controlled-production-ready",
    allowed: true,
    blockers: [],
    warnings,
    mayReturnRawMaster: false,
    mayReturnCompleteNetwork: false,
    servingPattern: "bbox-api",
  };
}
