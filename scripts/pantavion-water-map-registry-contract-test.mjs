import {
  createPantavionWaterMapRegistryEntry,
  getPantavionWaterMapRegistryContract,
} from "../core/infrastructure/water/water-map-registry-contract.ts";
import {
  getPantavionWaterReferenceLayerCatalog,
} from "../core/infrastructure/water/water-reference-layer-catalog.ts";
import {
  assertPantavionWaterSpatialPatch,
  getPantavionWaterSpatialPatchContract,
} from "../core/infrastructure/water/water-spatial-change-patch-contract.ts";
import {
  assertPantavionWaterMapVersion,
  getPantavionWaterMapVersioningContract,
} from "../core/infrastructure/water/water-map-versioning-contract.ts";
import {
  applyWaterMapBAffineTransform,
  calculateWaterMapBAffineTransform,
} from "../core/water/water-map-b-affine-alignment.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const contract = getPantavionWaterMapRegistryContract();
const referenceCatalog = getPantavionWaterReferenceLayerCatalog();
const patchContract = getPantavionWaterSpatialPatchContract();
const versioningContract = getPantavionWaterMapVersioningContract();

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

assert(patchContract.doctrine.editsAreSpatialPatchesNotSilentMasterMutation === true, "Field edits must be spatial patches.");
assert(patchContract.doctrine.pointLinePolygonSupported === true, "Point/LineString/Polygon geometry must be supported.");
assert(patchContract.doctrine.photosPdfScansAndAnyArtifactsMayBeEvidence === true, "Any preserved artifact may attach as patch evidence.");
assert(patchContract.doctrine.masterOfficializationRequiresAuthorizedReview === true, "Officialization must require authorized review.");

assert(versioningContract.doctrine.neverReplaceOldMapBlindly === true, "New design maps must never replace old maps blindly.");
assert(versioningContract.doctrine.preserveEveryOriginalVersion === true, "Every original map version must be preserved.");
assert(versioningContract.doctrine.oldAndNewSelectable === true, "Users must be able to select old or new map versions.");
assert(versioningContract.doctrine.oldAndNewComparable === true, "Users must be able to compare old and new versions.");
assert(versioningContract.doctrine.localChangesCanRenderOnOldAndNewUntilReconciled === true, "Local approved changes must be able to overlay both versions until reconciliation.");
assert(versioningContract.doctrine.unmatchedLocalChangesMustBePreserved === true, "Unmatched local changes must never disappear.");

const valvePatch = assertPantavionWaterSpatialPatch({
  patchId: "PATCH-VAL-000001",
  assetType: "valve",
  operation: "create",
  status: "pending_review",
  geometry: {
    type: "Point",
    coordinates: [33.038, 34.681],
    crs: { authority: "EPSG", code: "4326" },
  },
  location: {
    source: "gps",
    accuracyState: "measured",
    accuracyMeters: 4.5,
    streetName: "Example Road",
    technicalAddressId: "TA-000001",
  },
  attributes: {
    pantavionAssetId: "VAL-000001",
    diameterMm: 100,
    note: "New field valve",
  },
  evidenceRefs: ["evidence-photo-1"],
  artifactRefs: ["artifact-photo-1"],
  relatedJobIds: ["JOB-000001"],
  relatedReportIds: [],
  provenance: {
    createdBy: "approved-user-1",
    createdAt: "2026-09-27T00:00:00.000Z",
    sourceMapId: "A",
    immutableFingerprint: "fingerprint-1",
  },
  review: {
    founderOrAuthorizedApprovalRequired: true,
  },
  truth: {
    directMasterMutationAllowed: false,
    originalMasterPreserved: true,
    visibleBeforeApprovalToSubmitter: true,
    visibleToOtherApprovedUsersOnlyAfterApproval: true,
    fullHistoryRequired: true,
    rollbackRequired: true,
  },
});

assert(valvePatch.geometry.type === "Point", "Valve patch must retain point geometry.");
assert(valvePatch.truth.directMasterMutationAllowed === false, "Patch cannot mutate master directly.");

let blockedApproximateOfficialization = false;
try {
  assertPantavionWaterSpatialPatch({
    ...valvePatch,
    patchId: "PATCH-VAL-000002",
    status: "officialized",
    location: {
      ...valvePatch.location,
      accuracyState: "approximate",
    },
    review: {
      founderOrAuthorizedApprovalRequired: true,
      reviewedBy: "supervisor-1",
      reviewedAt: "2026-09-27T00:10:00.000Z",
    },
  });
} catch {
  blockedApproximateOfficialization = true;
}

assert(blockedApproximateOfficialization, "Approximate/unknown location cannot silently become official.");

const oldMap = assertPantavionWaterMapVersion({
  versionId: "MAP-A-V1",
  mapId: "A",
  versionNumber: 1,
  label: "Old approved map",
  status: "superseded_reference",
  sourceRef: "private://map-a/v1",
  sourceFingerprint: "sha256-old-map",
  receivedAt: "2026-01-01T00:00:00.000Z",
  receivedBy: "design-office",
  immutableSource: true,
  deletedAutomatically: false,
});

const newMap = assertPantavionWaterMapVersion({
  versionId: "MAP-A-V2",
  mapId: "A",
  versionNumber: 2,
  label: "New design-office map",
  status: "candidate",
  sourceRef: "private://map-a/v2",
  sourceFingerprint: "sha256-new-map",
  receivedAt: "2026-09-27T00:00:00.000Z",
  receivedBy: "design-office",
  immutableSource: true,
  deletedAutomatically: false,
});

assert(oldMap.versionId !== newMap.versionId, "Old and new map versions must remain distinct immutable sources.");

const affineControlPoints = [
  {
    id: "cp-1",
    sourceX: 0,
    sourceY: 0,
    longitude: 33,
    latitude: 34,
    provenance: "synthetic-test",
  },
  {
    id: "cp-2",
    sourceX: 1000,
    sourceY: 0,
    longitude: 33.01,
    latitude: 34.002,
    provenance: "synthetic-test",
  },
  {
    id: "cp-3",
    sourceX: 0,
    sourceY: 1000,
    longitude: 32.999,
    latitude: 34.012,
    provenance: "synthetic-test",
  },
  {
    id: "cp-4",
    sourceX: 1000,
    sourceY: 1000,
    longitude: 33.009,
    latitude: 34.014,
    provenance: "synthetic-test",
  },
];

const affine = calculateWaterMapBAffineTransform(affineControlPoints);
const affinePoint = applyWaterMapBAffineTransform(affine, 500, 500);

assert(Math.abs(affine.longitude.a - 0.00001) < 1e-12, "Affine longitude X coefficient must be recovered.");
assert(Math.abs(affine.longitude.b + 0.000001) < 1e-12, "Affine longitude Y coefficient must be recovered.");
assert(Math.abs(affine.latitude.d - 0.000002) < 1e-12, "Affine latitude X coefficient must be recovered.");
assert(Math.abs(affine.latitude.e - 0.000012) < 1e-12, "Affine latitude Y coefficient must be recovered.");
assert(Math.abs(affinePoint.longitude - 33.0045) < 1e-10, "Affine longitude projection must match expected position.");
assert(Math.abs(affinePoint.latitude - 34.007) < 1e-10, "Affine latitude projection must match expected position.");
assert(affine.rmseMeters < 0.001, "Ideal affine control points must have near-zero RMSE.");
assert(affine.maxResidualMeters < 0.001, "Ideal affine control points must have near-zero max residual.");

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
console.log("- valve/pipe/network edits are precise auditable spatial patches with approval and rollback");
console.log("- old/new design-office maps remain selectable, comparable and reconciled without losing local changes");
console.log("- affine georeferencing coefficients and residual metrics are calculated from control points");
