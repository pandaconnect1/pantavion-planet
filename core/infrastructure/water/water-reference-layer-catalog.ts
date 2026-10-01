export type PantavionWaterReferenceLayerKind =
  | "cadastral"
  | "parcels"
  | "buildings"
  | "roads"
  | "sheet-plans"
  | "topography"
  | "contours"
  | "planning-zones"
  | "administrative-boundaries"
  | "orthophoto"
  | "terrain"
  | "elevation-dem"
  | "hillshade"
  | "custom-reference";

export interface PantavionWaterReferenceLayerDefinition {
  id: string;
  name: string;
  kind: PantavionWaterReferenceLayerKind;
  provider: string;
  serviceType: "arcgis-mapserver" | "arcgis-featureserver" | "wms" | "wmts" | "xyz-raster" | "ogc";
  serviceUrl: string;
  layerIds?: readonly number[];
  spatialReference: {
    authority: "EPSG" | "ESRI";
    code: string;
  };
  role: "background-reference";
  enabledByDefault: boolean;
  zIndex: number;
  queryable: boolean;
  searchable: boolean;
  attributionRequired: true;
  networkOverlayMustRemainAbove: true;
  alignment: {
    reprojectToViewerCrs: true;
    sourceGeometryMustNotBeMutated: true;
    manualOffsetForbidden: true;
    controlPointAdjustmentAllowedWhenSourceMapNeedsGeoreferencing: true;
    accuracyEvidenceRequiredBeforeCanonicalPromotion: true;
  };
}

export const PANTAVION_WATER_REFERENCE_LAYER_CATALOG_ID =
  "pantavion_water_reference_layer_catalog_v1" as const;

/**
 * Official Cyprus Department of Lands and Surveys ArcGIS REST services are
 * registered here as external reference sources. Pantavion does not copy or
 * mutate the provider source. The Water Network remains a separate protected
 * overlay above these reference layers.
 */
export const pantavionWaterReferenceLayers: readonly PantavionWaterReferenceLayerDefinition[] = [
  {
    id: "CY_DLS_CADASTRAL",
    name: "Cyprus DLS — Cadastral Map",
    kind: "cadastral",
    provider: "Cyprus Department of Lands and Surveys",
    serviceType: "arcgis-mapserver",
    serviceUrl:
      "https://eservices.dls.moi.gov.cy/arcgis/rest/services/National/CadastralMap_EN/MapServer",
    layerIds: [0, 1, 10, 13, 14, 19, 20, 28, 30, 31, 32, 34, 37],
    spatialReference: { authority: "EPSG", code: "3857" },
    role: "background-reference",
    enabledByDefault: true,
    zIndex: 20,
    queryable: true,
    searchable: false,
    attributionRequired: true,
    networkOverlayMustRemainAbove: true,
    alignment: {
      reprojectToViewerCrs: true,
      sourceGeometryMustNotBeMutated: true,
      manualOffsetForbidden: true,
      controlPointAdjustmentAllowedWhenSourceMapNeedsGeoreferencing: true,
      accuracyEvidenceRequiredBeforeCanonicalPromotion: true,
    },
  },
  {
    id: "CY_DLS_GENERAL_SEARCH",
    name: "Cyprus DLS — General Search / Roads",
    kind: "roads",
    provider: "Cyprus Department of Lands and Surveys",
    serviceType: "arcgis-mapserver",
    serviceUrl:
      "https://eservices.dls.moi.gov.cy/arcgis/rest/services/National/General_Search/MapServer",
    layerIds: [0, 9, 10, 11, 12, 13],
    spatialReference: { authority: "ESRI", code: "102319" },
    role: "background-reference",
    enabledByDefault: false,
    zIndex: 25,
    queryable: true,
    searchable: true,
    attributionRequired: true,
    networkOverlayMustRemainAbove: true,
    alignment: {
      reprojectToViewerCrs: true,
      sourceGeometryMustNotBeMutated: true,
      manualOffsetForbidden: true,
      controlPointAdjustmentAllowedWhenSourceMapNeedsGeoreferencing: true,
      accuracyEvidenceRequiredBeforeCanonicalPromotion: true,
    },
  },
];

export const pantavionWaterOverlayOrder = {
  referenceBackgroundMaxZIndex: 49,
  importedMapLayerStartZIndex: 50,
  evidenceAndAnnotationStartZIndex: 80,
  protectedWaterNetworkZIndex: 100,
  operationalMarkersStartZIndex: 120,
} as const;

export function getPantavionWaterReferenceLayerCatalog() {
  return {
    id: PANTAVION_WATER_REFERENCE_LAYER_CATALOG_ID,
    version: "1.0.0",
    viewerCrs: { authority: "EPSG", code: "3857" },
    policy: {
      referenceLayersMayCoverWholeCountry: true,
      protectedWaterNetworkAlwaysAboveReferenceLayers: true,
      importedMapsAlignedByCrsOrControlPoints: true,
      manualVisualOffsetIsNotCanonicalAlignment: true,
      sourceGeometryNeverSilentlyMutated: true,
      accuracyEvidenceRequiredBeforeCanonicalPromotion: true,
      externalProviderFailureMustNotRemovePantavionWaterData: true,
      backgroundLayersNeverMutateAuthenticWaterNetwork: true,
      elevationAndTerrainAreReferenceContextOnly: true,
      telemetryIsOperationalOverlayNotBackgroundTruth: true,
    },
    overlayOrder: pantavionWaterOverlayOrder,
    layers: pantavionWaterReferenceLayers,
  };
}
