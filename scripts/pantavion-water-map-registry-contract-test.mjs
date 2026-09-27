import {
  createPantavionWaterMapRegistryEntry,
  getPantavionWaterMapRegistryContract,
} from "../core/infrastructure/water/water-map-registry-contract.ts";
import {
  getPantavionWaterReferenceLayerCatalog,
} from "../core/infrastructure/water/water-reference-layer-catalog.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const contract = getPantavionWaterMapRegistryContract();
const referenceCatalog = getPantavionWaterReferenceLayerCatalog();

assert(contract.id === "pantavion_water_map_registry_v1", "Wrong registry contract id.");
assert(contract.doctrine.oneViewerForAllMaps === true, "All maps must use one Pantavion viewer.");
assert(contract.doctrine.arbitraryFutureMapIdsAllowed === true, "Registry must not be limited to A/B/C.");
assert(contract.doctrine.legacyAbcBackwardCompatible === true, "A/B/C compatibility must remain.");
assert(contract.doctrine.rawMasterBrowserExposureAllowed === false, "Raw master browser exposure must remain forbidden.");
assert(contract.doctrine.browserFullDatasetLoadAllowed === false, "Full dataset browser loading must remain forbidden.");
assert(contract.artifactIntakePolicy.acceptsAnyArtifactFormat === true, "Universal intake must accept any artifact format.");
assert(contract.artifactIntakePolicy.acceptsMobileUploads === true, "Mobile uploads must be accepted.");
assert(contract.artifactIntakePolicy.acceptsPhotosScansAndPdf === true, "Photos, scans and PDFs must be accepted.");
assert(contract.artifactIntakePolicy.acceptsUnknownFutureFormats === true, "Unknown future formats must be preserved.");
assert(contract.artifactIntakePolicy.unknownFormatsRejectedForLackOfRenderer === false, "Missing renderer must never mean file rejection.");
assert(contract.artifactIntakePolicy.renderabilityIsSeparateFromAcceptance === true, "Acceptance and layer renderability must remain separate.");
assert(contract.artifactIntakePolicy.rendererRequiredAtIntake === false, "Renderer cannot be required to retain an artifact.");
assert(contract.artifactIntakePolicy.adapterRequiredAtIntake === false, "Adapter cannot be required to retain an artifact.");
assert(contract.artifactIntakePolicy.nonRenderableArtifactsRemainFirstClassEvidence === true, "Non-renderable artifacts must remain first-class evidence.");
assert(contract.artifactIntakePolicy.artifactMayAttachToMapWithoutRenderingItsContents === true, "Artifacts must be attachable to maps even without rendering their contents.");
assert(contract.artifactIntakePolicy.preserveOriginalBytesBeforeConversion === true, "Original bytes must be preserved before conversion.");

assert(referenceCatalog.policy.protectedWaterNetworkAlwaysAboveReferenceLayers === true, "Water network must remain above reference layers.");
assert(referenceCatalog.policy.importedMapsAlignedByCrsOrControlPoints === true, "Imported maps must align by CRS or control points.");
assert(referenceCatalog.policy.manualVisualOffsetIsNotCanonicalAlignment === true, "Manual visual offset cannot count as canonical alignment.");
assert(referenceCatalog.policy.accuracyEvidenceRequiredBeforeCanonicalPromotion === true, "Alignment accuracy evidence is required before canonical promotion.");
assert(referenceCatalog.layers.some((layer) => layer.id === "CY_DLS_CADASTRAL"), "Cyprus DLS cadastral reference layer must be registered.");
assert(referenceCatalog.layers.some((layer) => layer.id === "CY_DLS_GENERAL_SEARCH"), "Cyprus DLS general search/roads layer must be registered.");
assert(referenceCatalog.overlayOrder.protectedWaterNetworkZIndex > referenceCatalog.overlayOrder.referenceBackgroundMaxZIndex, "Water network z-order must be above references.");

const builtInIds = contract.maps.map((entry) => entry.mapId);
assert(builtInIds.includes("A"), "Legacy Map A must remain registered.");
assert(builtInIds.includes("B"), "Legacy Map B must remain registered.");
assert(builtInIds.includes("C"), "Legacy Map C must remain registered.");

const capabilityKinds = new Set(contract.sourceCapabilities.map((entry) => entry.kind));
for (const requiredKind of [
  "artifact-reference",
  "dwg",
  "dxf",
  "gpkg",
  "geojson",
  "kml",
  "kmz",
  "geotiff",
  "arcgis-mapserver",
  "arcgis-featureserver",
  "wms",
  "wmts",
  "ogc-api-maps",
  "ogc-api-tiles",
  "ogc-api-features",
]) {
  assert(capabilityKinds.has(requiredKind), `Missing map source capability: ${requiredKind}`);
}

const mapD = createPantavionWaterMapRegistryEntry({
  mapId: "d cadastral reference",
  displayName: "D Map — Cadastral Reference",
  purpose: "External cadastral/reference layer rendered inside the Pantavion Water viewer.",
  order: 3,
  enabled: true,
  sourceKinds: ["arcgis-mapserver"],
  deliveryMode: "arcgis-query",
  runtimeState: "registered",
  sourceRef: "provider-neutral-reference",
  providerAdapter: "arcgis-rest",
  viewer: {
    samePantavionViewer: true,
    layerSwitchable: true,
    progressiveLoadingRequired: true,
    defaultVisible: false,
    zIndex: 90,
  },
  security: {
    approvedAccessRequired: true,
    publicAccessAllowed: false,
    rawSourceExposedToBrowser: false,
    browserFullDatasetLoadAllowed: false,
    serverAuthorizationRequired: true,
  },
});

assert(mapD.mapId === "D_CADASTRAL_REFERENCE", "Future map ids must normalize deterministically.");
assert(mapD.canonicalKey === "WATER_MAP_D_CADASTRAL_REFERENCE", "Future maps need stable canonical keys.");
assert(mapD.viewer.samePantavionViewer === true, "Future maps must remain in the common viewer.");
assert(mapD.security.rawSourceExposedToBrowser === false, "Future maps cannot expose raw protected sources.");
assert(mapD.security.browserFullDatasetLoadAllowed === false, "Future maps cannot enable full browser dataset loading.");

const forcedSafe = createPantavionWaterMapRegistryEntry({
  mapId: "E",
  displayName: "E Map",
  purpose: "Safety coercion test.",
  order: 4,
  enabled: true,
  sourceKinds: ["geojson"],
  deliveryMode: "bbox-features",
  runtimeState: "registered",
  viewer: {
    samePantavionViewer: false,
    layerSwitchable: false,
    progressiveLoadingRequired: false,
  },
  security: {
    approvedAccessRequired: true,
    publicAccessAllowed: false,
    rawSourceExposedToBrowser: true,
    browserFullDatasetLoadAllowed: true,
    serverAuthorizationRequired: true,
  },
});

assert(forcedSafe.viewer.samePantavionViewer === true, "Registry factory must force the common viewer.");
assert(forcedSafe.viewer.layerSwitchable === true, "Registry factory must force layer switching.");
assert(forcedSafe.viewer.progressiveLoadingRequired === true, "Registry factory must force progressive loading.");
assert(forcedSafe.security.rawSourceExposedToBrowser === false, "Registry factory must force raw source protection.");
assert(forcedSafe.security.browserFullDatasetLoadAllowed === false, "Registry factory must force segmented/tiled delivery.");

let rejectedUnsupported = false;
try {
  createPantavionWaterMapRegistryEntry({
    mapId: "F",
    displayName: "F Map",
    purpose: "Unsupported source rejection test.",
    order: 5,
    enabled: true,
    sourceKinds: ["unsupported-secret-format"],
    deliveryMode: "external-layer",
    runtimeState: "registered",
    viewer: {
      samePantavionViewer: true,
      layerSwitchable: true,
      progressiveLoadingRequired: true,
    },
    security: {
      approvedAccessRequired: true,
      publicAccessAllowed: false,
      rawSourceExposedToBrowser: false,
      browserFullDatasetLoadAllowed: false,
      serverAuthorizationRequired: true,
    },
  });
} catch {
  rejectedUnsupported = true;
}

assert(rejectedUnsupported, "Unsupported source kinds must fail closed.");

console.log("PANTAVION WATER MAP REGISTRY CONTRACT TEST: PASSED");
console.log("- A/B/C backward compatibility preserved");
console.log("- D/E/future map ids supported through one registry");
console.log("- ArcGIS/WMS/WMTS/OGC and common file formats registered");
console.log("- raw source and full-browser-dataset exposure forced off");
console.log("- photos/PDF/scans/unknown future formats are accepted and preserved even without a renderer or adapter");
console.log("- non-renderable artifacts can still attach to a map as first-class evidence");
console.log("- cadastral/roads/reference layers share CRS alignment and stay below the protected water network");
