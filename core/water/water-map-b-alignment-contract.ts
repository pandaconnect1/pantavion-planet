export const WATER_MAP_B_ALIGNMENT_CONTRACT_VERSION = "2026-08-16.v1" as const;

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

const EXPECTED_SOURCE_SHA256 =
  "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16";

/**
 * Fail-closed gate for geographic alignment. It never mutates the original DWG.
 * Any accepted transform belongs to the GIS presentation/canonical derived layer.
 */
export function validateWaterMapBAlignment(
  input: WaterMapBAlignmentInput,
): WaterMapBAlignmentDecision {
  const errors: string[] = [];

  if (input.sourceSha256 !== EXPECTED_SOURCE_SHA256) {
    errors.push("unexpected_map_b_source_sha256");
  }

  if (!input.sourceCrs) errors.push("source_crs_unverified");
  if (!input.targetCrs) errors.push("target_crs_missing");
  if (!input.transformName) errors.push("transform_not_recorded");

  if (!Array.isArray(input.controlPoints) || input.controlPoints.length < 3) {
    errors.push("insufficient_control_points");
  }

  for (const point of input.controlPoints || []) {
    if (!point.id || !point.provenance) errors.push("control_point_provenance_missing");
    if (![point.sourceX, point.sourceY, point.longitude, point.latitude].every(Number.isFinite)) {
      errors.push("invalid_control_point_coordinate");
    }
  }

  if (input.rmseMeters === null || !Number.isFinite(input.rmseMeters) || input.rmseMeters < 0) {
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
