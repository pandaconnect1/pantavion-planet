import { pantavionWaterAbcMaps } from "./water-abc-map-system-contract.ts";

export const PANTAVION_WATER_MAP_REGISTRY_ID =
  "pantavion_water_map_registry_v1" as const;

export type PantavionWaterMapSourceKind =
  | "artifact-reference"
  | "internal-vector"
  | "dwg"
  | "dxf"
  | "gpkg"
  | "geojson"
  | "kml"
  | "kmz"
  | "geotiff"
  | "geopdf"
  | "shapefile"
  | "mbtiles"
  | "pmtiles"
  | "arcgis-mapserver"
  | "arcgis-featureserver"
  | "wms"
  | "wmts"
  | "ogc-api-maps"
  | "ogc-api-tiles"
  | "ogc-api-features"
  | "xyz-raster"
  | "xyz-vector";

export type PantavionWaterMapDeliveryMode =
  | "evidence-reference"
  | "bbox-features"
  | "vector-tiles"
  | "raster-tiles"
  | "arcgis-query"
  | "protected-derived-render"
  | "external-layer";

export type PantavionWaterMapRuntimeState =
  | "registered"
  | "adapter-ready"
  | "verified-live"
  | "blocked";

export interface PantavionWaterMapRegistryEntry {
  /** Stable identifier. New maps are not limited to A/B/C. */
  mapId: string;
  canonicalKey: string;
  displayName: string;
  purpose: string;
  order: number;
  enabled: boolean;
  sourceKinds: readonly PantavionWaterMapSourceKind[];
  deliveryMode: PantavionWaterMapDeliveryMode;
  runtimeState: PantavionWaterMapRuntimeState;
  sourceRef?: string;
  providerAdapter?: string;
  spatialReference?: {
    wkid?: number;
    authority?: string;
    code?: string;
  };
  viewer: {
    samePantavionViewer: true;
    layerSwitchable: true;
    progressiveLoadingRequired: true;
    minZoom?: number;
    maxZoom?: number;
    defaultVisible?: boolean;
    zIndex?: number;
  };
  security: {
    approvedAccessRequired: boolean;
    publicAccessAllowed: boolean;
    rawSourceExposedToBrowser: false;
    browserFullDatasetLoadAllowed: false;
    serverAuthorizationRequired: boolean;
  };
  compatibility?: {
    legacyAbcId?: string;
    legacyMapServerLayerId?: number;
  };
}

export interface PantavionWaterMapSourceCapability {
  kind: PantavionWaterMapSourceKind;
  registrationAllowed: true;
  runtimeAdapterRequired: boolean;
  preferredDeliveryMode: PantavionWaterMapDeliveryMode;
}

const SOURCE_CAPABILITIES: readonly PantavionWaterMapSourceCapability[] = [
  { kind: "artifact-reference", registrationAllowed: true, runtimeAdapterRequired: false, preferredDeliveryMode: "evidence-reference" },
  { kind: "internal-vector", registrationAllowed: true, runtimeAdapterRequired: false, preferredDeliveryMode: "bbox-features" },
  { kind: "dwg", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "protected-derived-render" },
  { kind: "dxf", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "protected-derived-render" },
  { kind: "gpkg", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "bbox-features" },
  { kind: "geojson", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "bbox-features" },
  { kind: "kml", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "bbox-features" },
  { kind: "kmz", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "bbox-features" },
  { kind: "geotiff", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "raster-tiles" },
  { kind: "geopdf", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "raster-tiles" },
  { kind: "shapefile", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "bbox-features" },
  { kind: "mbtiles", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "vector-tiles" },
  { kind: "pmtiles", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "vector-tiles" },
  { kind: "arcgis-mapserver", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "arcgis-query" },
  { kind: "arcgis-featureserver", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "arcgis-query" },
  { kind: "wms", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "external-layer" },
  { kind: "wmts", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "raster-tiles" },
  { kind: "ogc-api-maps", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "external-layer" },
  { kind: "ogc-api-tiles", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "vector-tiles" },
  { kind: "ogc-api-features", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "bbox-features" },
  { kind: "xyz-raster", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "raster-tiles" },
  { kind: "xyz-vector", registrationAllowed: true, runtimeAdapterRequired: true, preferredDeliveryMode: "vector-tiles" },
] as const;

const LEGACY_KEY_BY_ID = {
  A_OPERATIONAL_GEO_MAP: "A",
  B_AUTHENTIC_MASTER_MAP: "B",
  C_INTELLIGENT_ENGINEERING_MAP: "C",
} as const;

const LEGACY_LAYER_BY_ID = {
  A_OPERATIONAL_GEO_MAP: 0,
  B_AUTHENTIC_MASTER_MAP: 1,
  C_INTELLIGENT_ENGINEERING_MAP: 2,
} as const;

const LEGACY_SOURCE_KINDS = {
  A_OPERATIONAL_GEO_MAP: ["internal-vector"],
  B_AUTHENTIC_MASTER_MAP: ["dwg", "dxf", "gpkg", "geojson"],
  C_INTELLIGENT_ENGINEERING_MAP: ["internal-vector", "geojson"],
} as const satisfies Record<string, readonly PantavionWaterMapSourceKind[]>;

const LEGACY_DELIVERY_MODE = {
  A_OPERATIONAL_GEO_MAP: "bbox-features",
  B_AUTHENTIC_MASTER_MAP: "protected-derived-render",
  C_INTELLIGENT_ENGINEERING_MAP: "bbox-features",
} as const satisfies Record<string, PantavionWaterMapDeliveryMode>;

export const pantavionWaterMapRegistryEntries: readonly PantavionWaterMapRegistryEntry[] =
  pantavionWaterAbcMaps.map((legacy, index) => ({
    mapId: LEGACY_KEY_BY_ID[legacy.id],
    canonicalKey: `WATER_MAP_${LEGACY_KEY_BY_ID[legacy.id]}`,
    displayName: legacy.name,
    purpose: legacy.purpose,
    order: index,
    enabled: true,
    sourceKinds: LEGACY_SOURCE_KINDS[legacy.id],
    deliveryMode: LEGACY_DELIVERY_MODE[legacy.id],
    runtimeState: "registered",
    viewer: {
      samePantavionViewer: true,
      layerSwitchable: true,
      progressiveLoadingRequired: true,
      defaultVisible: legacy.id === "A_OPERATIONAL_GEO_MAP",
      zIndex: 100 + index,
    },
    security: {
      approvedAccessRequired: true,
      publicAccessAllowed: false,
      rawSourceExposedToBrowser: false,
      browserFullDatasetLoadAllowed: false,
      serverAuthorizationRequired: true,
    },
    compatibility: {
      legacyAbcId: legacy.id,
      legacyMapServerLayerId: LEGACY_LAYER_BY_ID[legacy.id],
    },
  }));

export function normalizePantavionWaterMapId(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
}

export function assertPantavionWaterMapId(value: string): string {
  const normalized = normalizePantavionWaterMapId(value);
  if (!normalized || normalized.length > 64 || !/^[A-Z0-9][A-Z0-9_-]*$/.test(normalized)) {
    throw new Error("invalid_pantavion_water_map_id");
  }
  return normalized;
}

export function createPantavionWaterMapRegistryEntry(
  input: Omit<PantavionWaterMapRegistryEntry, "mapId" | "canonicalKey"> & {
    mapId: string;
    canonicalKey?: string;
  },
): PantavionWaterMapRegistryEntry {
  const mapId = assertPantavionWaterMapId(input.mapId);
  const canonicalKey = assertPantavionWaterMapId(
    input.canonicalKey || `WATER_MAP_${mapId}`,
  );

  if (!input.sourceKinds.length) {
    throw new Error("water_map_source_kind_required");
  }

  const supportedKinds = new Set(SOURCE_CAPABILITIES.map((item) => item.kind));
  for (const kind of input.sourceKinds) {
    if (!supportedKinds.has(kind)) {
      throw new Error(`unsupported_water_map_source_kind:${kind}`);
    }
  }

  return {
    ...input,
    mapId,
    canonicalKey,
    viewer: {
      ...input.viewer,
      samePantavionViewer: true,
      layerSwitchable: true,
      progressiveLoadingRequired: true,
    },
    security: {
      ...input.security,
      rawSourceExposedToBrowser: false,
      browserFullDatasetLoadAllowed: false,
    },
  };
}

export function getPantavionWaterMapRegistryContract() {
  return {
    id: PANTAVION_WATER_MAP_REGISTRY_ID,
    version: "1.1.0",
    status: "registry-contract-active-runtime-adapters-progressive",
    artifactIntakePolicy: {
      routeThroughUniversalArtifactIntake: true,
      acceptsAnyArtifactFormat: true,
      acceptsMobileUploads: true,
      acceptsPhotosScansAndPdf: true,
      acceptsUnknownFutureFormats: true,
      unknownFormatsRejectedForLackOfRenderer: false,
      preserveOriginalBytesBeforeConversion: true,
      renderabilityIsSeparateFromAcceptance: true,
      georeferencingMayBeDeferred: true,
      preservedArtifactsMayRemainEvidenceOnly: true,
      adapterDiscoveryAllowedAfterPreservation: true,
      rendererRequiredAtIntake: false,
      adapterRequiredAtIntake: false,
      nonRenderableArtifactsRemainFirstClassEvidence: true,
      artifactMayAttachToMapWithoutRenderingItsContents: true,
      noFalseRenderableClaim: true,
    },
    doctrine: {
      oneViewerForAllMaps: true,
      arbitraryFutureMapIdsAllowed: true,
      legacyAbcBackwardCompatible: true,
      progressiveViewportLoadingRequired: true,
      providerNeutralSourceReferences: true,
      rawMasterBrowserExposureAllowed: false,
      browserFullDatasetLoadAllowed: false,
      authorizationFailClosed: true,
      noArtifactLossWhenRendererMissing: true,
      universalArtifactIntakeBeforeLayerPromotion: true,
      rendererAndAdapterAreOptionalForArtifactRetention: true,
    },
    sourceCapabilities: SOURCE_CAPABILITIES,
    maps: pantavionWaterMapRegistryEntries,
  };
}
