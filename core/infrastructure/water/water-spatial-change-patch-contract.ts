export const PANTAVION_WATER_SPATIAL_PATCH_CONTRACT_ID =
  "pantavion_water_spatial_change_patch_v1" as const;

export type PantavionWaterPatchGeometryType =
  | "Point"
  | "LineString"
  | "Polygon";

export type PantavionWaterPatchAssetType =
  | "valve"
  | "pipe"
  | "network_extension"
  | "service_connection"
  | "meter"
  | "fitting"
  | "hydrant"
  | "chamber"
  | "fault"
  | "leak"
  | "repair"
  | "road_reference"
  | "zone"
  | "general_update";

export type PantavionWaterPatchStatus =
  | "local_only"
  | "pending_review"
  | "approved_overlay"
  | "officialization_candidate"
  | "officialized"
  | "conflict"
  | "rejected"
  | "superseded";

export type PantavionWaterLocationSource =
  | "gps"
  | "assisted_gps"
  | "wifi"
  | "cell"
  | "manual_map"
  | "coordinate_entry"
  | "snapped_to_network"
  | "survey"
  | "cad_gis"
  | "official_plan"
  | "unknown";

export type PantavionWaterAccuracyState =
  | "measured"
  | "verified"
  | "estimated"
  | "approximate"
  | "unknown";

export interface PantavionWaterPatchGeometry {
  type: PantavionWaterPatchGeometryType;
  coordinates:
    | [number, number]
    | Array<[number, number]>
    | Array<Array<[number, number]>>;
  crs: {
    authority: "EPSG" | "ESRI";
    code: string;
  };
}

export interface PantavionWaterSpatialChangePatch {
  patchId: string;
  assetType: PantavionWaterPatchAssetType;
  operation: "create" | "correct" | "replace" | "retire" | "annotate";
  status: PantavionWaterPatchStatus;

  geometry: PantavionWaterPatchGeometry;
  location: {
    source: PantavionWaterLocationSource;
    accuracyState: PantavionWaterAccuracyState;
    accuracyMeters?: number;
    streetName?: string;
    area?: string;
    postalCode?: string;
    parcelReference?: string;
    technicalAddressId?: string;
    snappedAssetId?: string;
  };

  attributes: {
    pantavionAssetId?: string;
    officialAssetId?: string;
    material?: string;
    diameterMm?: number;
    depthM?: number;
    pressureBar?: number;
    note?: string;
    tags?: string[];
  };

  evidenceRefs: string[];
  artifactRefs: string[];
  relatedJobIds: string[];
  relatedReportIds: string[];

  provenance: {
    createdBy: string;
    createdAt: string;
    sourceDeviceId?: string;
    sourceMapId?: string;
    sourceNetworkVersion?: string;
    immutableFingerprint: string;
  };

  review: {
    founderOrAuthorizedApprovalRequired: true;
    reviewedBy?: string;
    reviewedAt?: string;
    decisionNote?: string;
  };

  truth: {
    directMasterMutationAllowed: false;
    originalMasterPreserved: true;
    visibleBeforeApprovalToSubmitter: true;
    visibleToOtherApprovedUsersOnlyAfterApproval: true;
    fullHistoryRequired: true;
    rollbackRequired: true;
  };
}

function finiteCoordinate(value: number) {
  return Number.isFinite(value) && Math.abs(value) <= 1_000_000_000;
}

function assertPair(pair: [number, number]) {
  if (!finiteCoordinate(pair[0]) || !finiteCoordinate(pair[1])) {
    throw new Error("water_patch_coordinate_invalid");
  }
}

export function assertPantavionWaterPatchGeometry(
  geometry: PantavionWaterPatchGeometry,
) {
  if (!geometry?.crs?.code || !geometry?.crs?.authority) {
    throw new Error("water_patch_crs_required");
  }

  if (geometry.type === "Point") {
    const pair = geometry.coordinates as [number, number];
    if (!Array.isArray(pair) || pair.length !== 2) {
      throw new Error("water_patch_point_invalid");
    }
    assertPair(pair);
    return;
  }

  if (geometry.type === "LineString") {
    const line = geometry.coordinates as Array<[number, number]>;
    if (!Array.isArray(line) || line.length < 2) {
      throw new Error("water_patch_line_invalid");
    }
    line.forEach(assertPair);
    return;
  }

  const rings = geometry.coordinates as Array<Array<[number, number]>>;
  if (!Array.isArray(rings) || !rings.length || rings[0].length < 4) {
    throw new Error("water_patch_polygon_invalid");
  }
  for (const ring of rings) {
    if (ring.length < 4) throw new Error("water_patch_polygon_ring_invalid");
    ring.forEach(assertPair);
  }
}

export function assertPantavionWaterSpatialPatch(
  patch: PantavionWaterSpatialChangePatch,
) {
  if (!patch.patchId?.trim()) throw new Error("water_patch_id_required");
  if (!patch.provenance.createdBy?.trim()) {
    throw new Error("water_patch_creator_required");
  }
  if (!patch.provenance.immutableFingerprint?.trim()) {
    throw new Error("water_patch_fingerprint_required");
  }

  assertPantavionWaterPatchGeometry(patch.geometry);

  if (
    patch.location.accuracyMeters !== undefined &&
    (!Number.isFinite(patch.location.accuracyMeters) ||
      patch.location.accuracyMeters < 0)
  ) {
    throw new Error("water_patch_accuracy_invalid");
  }

  if (
    patch.status === "approved_overlay" ||
    patch.status === "officialization_candidate" ||
    patch.status === "officialized"
  ) {
    if (!patch.review.reviewedBy || !patch.review.reviewedAt) {
      throw new Error("water_patch_approval_evidence_required");
    }
  }

  if (patch.status === "officialized") {
    if (
      patch.location.accuracyState === "approximate" ||
      patch.location.accuracyState === "unknown"
    ) {
      throw new Error("water_patch_officialization_requires_location_confidence");
    }
  }

  return patch;
}

export function getPantavionWaterSpatialPatchContract() {
  return {
    id: PANTAVION_WATER_SPATIAL_PATCH_CONTRACT_ID,
    version: "1.0.0",
    doctrine: {
      editsAreSpatialPatchesNotSilentMasterMutation: true,
      pointLinePolygonSupported: true,
      exactRoadOrTechnicalAddressMayBeAttached: true,
      gpsManualCoordinatesSnappingSurveyCadGisSupported: true,
      locationAccuracyMustBeRecordedWhenKnown: true,
      photosPdfScansAndAnyArtifactsMayBeEvidence: true,
      submitterMaySeeOwnPendingPatch: true,
      otherApprovedUsersSeeOnlyApprovedPatch: true,
      masterOfficializationRequiresAuthorizedReview: true,
      originalAndPriorVersionsAlwaysPreserved: true,
      rollbackRequired: true,
      historyRequired: true,
    },
    recommendedGeometryByAsset: {
      valve: "Point",
      meter: "Point",
      fitting: "Point",
      hydrant: "Point",
      chamber: "Point",
      fault: "Point",
      leak: "Point",
      repair: "Point",
      pipe: "LineString",
      network_extension: "LineString",
      service_connection: "LineString",
      road_reference: "LineString",
      zone: "Polygon",
    },
    lifecycle: [
      "local_only",
      "pending_review",
      "approved_overlay",
      "officialization_candidate",
      "officialized",
      "conflict",
      "rejected",
      "superseded",
    ],
  };
}
