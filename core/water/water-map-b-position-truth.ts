export const WATER_MAP_B_POSITION_TRUTH_VERSION = "2026-08-16.v1" as const;

export type WaterMapBPositionTruth = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  measuredAt: string;
  source: "device-geolocation";
  alignmentVerified: boolean;
};

export type WaterMapBPositionAssessment = {
  usable: boolean;
  quality: "high" | "medium" | "low" | "unusable";
  warning: string | null;
};

/**
 * Presentation-only assessment. It never changes the coordinates returned by
 * the device and must never imply survey-grade accuracy.
 */
export function assessWaterMapBPosition(
  position: WaterMapBPositionTruth,
): WaterMapBPositionAssessment {
  if (
    !Number.isFinite(position.latitude) ||
    !Number.isFinite(position.longitude) ||
    !Number.isFinite(position.accuracyMeters) ||
    position.accuracyMeters < 0
  ) {
    return {
      usable: false,
      quality: "unusable",
      warning: "invalid_device_position",
    };
  }

  if (!position.alignmentVerified) {
    return {
      usable: true,
      quality: position.accuracyMeters <= 5 ? "high" : position.accuracyMeters <= 15 ? "medium" : "low",
      warning: "map_b_master_alignment_not_verified",
    };
  }

  if (position.accuracyMeters <= 5) {
    return { usable: true, quality: "high", warning: null };
  }

  if (position.accuracyMeters <= 15) {
    return {
      usable: true,
      quality: "medium",
      warning: "device_position_accuracy_limited",
    };
  }

  return {
    usable: true,
    quality: "low",
    warning: "device_position_accuracy_low",
  };
}
