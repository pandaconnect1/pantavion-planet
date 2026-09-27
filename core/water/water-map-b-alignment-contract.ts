import {
  WATER_MAP_B_SOURCE_CANDIDATES,
  type WaterMapBSourceKey,
} from "./water-map-b-source-candidates";

export const WATER_MAP_B_ALIGNMENT_CONTRACT_VERSION = "2026-09-27.v2" as const;

export type WaterMapBAlignmentStatus =
  | "needs_review"
  | "partially_georeferenced"
  | "manually_aligned"
  | "georeferenced"
  | "field_confirmed"
  | "approximate"
  | "rejected";

export type WaterMapBControlPoint = {
  id: string;
  sourceX: number;
  sourceY: number;
  longitude: number;
  latitude: number;
  accuracyMeters?: number | null;
  provenance: string;
};

export type WaterMapBAlignmentInput = {
  sourceKey: WaterMapBSourceKey;
  sourceCrs: string | null;
  targetCrs: string;
  controlPoints: WaterMapBControlPoint[];
  rmseMeters: number | null;
  maxResidualMeters: number | null;
  transformName: string | null;
  sourceSha256: string;
};

export type WaterMapBAlignmentDecision = {
  ok: boolean;
  errors: string[];
};

export const WATER_MAP_B_OVERLAY_ELIGIBLE_STATUSES =
  new Set<WaterMapBAlignmentStatus>([
    "georeferenced",
    "field_confirmed",
  ]);

/**
 * Fail-closed evidence validation. It never mutates the original DWG and does
 * not invent an engineering tolerance. RMSE/max residual are recorded evidence;
 * geographic overlay still requires an explicit authorized review decision.
 */
export function validateWaterMapBAlignment(
  input: WaterMapBAlignmentInput,
): WaterMapBAlignmentDecision {
  const errors: string[] = [];
  const source = WATER_MAP_B_SOURCE_CANDIDATES[input.sourceKey];

  if (!source) {
    errors.push("unknown_map_b_source_key");
  } else if (input.sourceSha256 !== source.sha256) {
    errors.push("unexpected_map_b_source_sha256");
  }

  if (!input.sourceCrs) errors.push("source_crs_unverified");
  if (!input.targetCrs) errors.push("target_crs_missing");
  if (!input.transformName) errors.push("transform_not_recorded");

  if (!Array.isArray(input.controlPoints) || input.controlPoints.length < 3) {
    errors.push("insufficient_control_points");
  }

  const pointIds = new Set<string>();

  for (const point of input.controlPoints || []) {
    if (!point.id || !point.provenance) {
      errors.push("control_point_provenance_missing");
    }

    if (point.id) {
      if (pointIds.has(point.id)) errors.push("duplicate_control_point_id");
      pointIds.add(point.id);
    }

    if (
      ![
        point.sourceX,
        point.sourceY,
        point.longitude,
        point.latitude,
      ].every(Number.isFinite)
    ) {
      errors.push("invalid_control_point_coordinate");
    }

    if (
      point.accuracyMeters !== undefined &&
      point.accuracyMeters !== null &&
      (!Number.isFinite(point.accuracyMeters) || point.accuracyMeters < 0)
    ) {
      errors.push("invalid_control_point_accuracy");
    }
  }

  if (
    input.rmseMeters === null ||
    !Number.isFinite(input.rmseMeters) ||
    input.rmseMeters < 0
  ) {
    errors.push("rmse_not_verified");
  }

  if (
    input.maxResidualMeters === null ||
    !Number.isFinite(input.maxResidualMeters) ||
    input.maxResidualMeters < 0
  ) {
    errors.push("max_residual_not_verified");
  }

  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

export function canEnableWaterMapBGeographicOverlay(input: {
  status: WaterMapBAlignmentStatus;
  evidenceValidated: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
}) {
  return Boolean(
    input.evidenceValidated &&
      WATER_MAP_B_OVERLAY_ELIGIBLE_STATUSES.has(input.status) &&
      input.reviewedBy &&
      input.reviewedAt,
  );
}
