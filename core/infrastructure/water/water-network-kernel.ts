export const PANTAVION_WATER_NETWORK_KERNEL_VERSION = "water-network-kernel-v1" as const;

export const WATER_NETWORK_SOURCE_RULES = {
  authenticSourceMustRemainImmutable: true,
  sourceKmzMustNotBeMutatedByUserOverlays: true,
  derivedFilesMayBeRebuiltFromSource: true,
  browserMustNotReceiveFullMasterNetwork: true,
  rawMasterMustNotBePublic: true,
  renderableIndexMayExcludeNonRenderableSourceFeatures: true,
  nonRenderableSourceFeaturesMustRemainPreserved: true,
} as const;

export const WATER_NETWORK_LAYER_TYPES = {
  baseNetwork: "base_network",
  userWorks: "user_works",
  valves: "valves",
  serviceConnections: "service_connections",
  repairs: "repairs",
  leaks: "leaks",
  inspections: "inspections",
  photos: "photos",
  notes: "notes",
  futureSurveyVersion: "future_survey_version",
} as const;

export type WaterNetworkLayerType =
  (typeof WATER_NETWORK_LAYER_TYPES)[keyof typeof WATER_NETWORK_LAYER_TYPES];

export type WaterNetworkVersionRecord = {
  id: string;
  label: string;
  sourceType: "authentic_kmz" | "derived_geojson" | "private_ndjson" | "future_import";
  createdAt: string;
  isProtectedBase: boolean;
  previousVersionId?: string;
  notes?: string;
};

export type WaterUserOverlayRecord = {
  id: string;
  layerType: WaterNetworkLayerType;
  title: string;
  description?: string;
  longitude: number;
  latitude: number;
  createdByUserId: string;
  createdAt: string;
  sourceNetworkVersionId: string;
  status: "draft" | "active" | "reviewed" | "archived";
  attachments?: Array<{
    id: string;
    kind: "photo" | "document" | "voice_note" | "video" | "other";
    privateUrl: string;
  }>;
};

export const WATER_NETWORK_CURRENT_LOCK = {
  checkpointTag: "water-network-live-v1",
  sourceFeatureCount: 122857,
  renderableFeatureCount: 120552,
  nonRenderablePreservedCount: 2305,
  protectedBlobPrefix: "water/private/",
  liveRoute: "/professional/infrastructure/water/live",
  segmentApiRoute: "/api/professional/infrastructure/water/segment/bbox",
} as const;

export function assertWaterOverlayDoesNotMutateBaseLayer(record: WaterUserOverlayRecord) {
  if (!record.sourceNetworkVersionId) {
    throw new Error("Water overlay must reference a protected source network version.");
  }

  if (!Number.isFinite(record.longitude) || !Number.isFinite(record.latitude)) {
    throw new Error("Water overlay must have valid coordinates.");
  }

  return true;
}
