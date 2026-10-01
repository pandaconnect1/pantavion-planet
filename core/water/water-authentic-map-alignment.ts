import {
  calculatePantavionMapASimilarityTransform,
  type PantavionRigidControlPoint,
  type PantavionSimilarityTransform,
} from "./water-map-a-similarity-alignment";

export type PantavionAuthenticWaterMapId = "A" | "B" | "C";

export type PantavionAuthenticMapAlignment = PantavionSimilarityTransform & {
  mapId: PantavionAuthenticWaterMapId;
  geometryPolicy: "AUTHENTIC_GEOMETRY_NO_DEFORMATION";
  shearAllowed: false;
  independentAxisScaleAllowed: false;
};

export function calculatePantavionAuthenticMapAlignment(
  mapId: PantavionAuthenticWaterMapId,
  points: PantavionRigidControlPoint[],
): PantavionAuthenticMapAlignment {
  if (!["A","B","C"].includes(mapId)) {
    throw new Error("water_authentic_map_id_invalid");
  }

  const transform=calculatePantavionMapASimilarityTransform(points);

  if (transform.targetCrs !== "EPSG:6312") {
    throw new Error("water_cadastral_target_crs_must_be_epsg_6312");
  }

  return {
    ...transform,
    mapId,
    geometryPolicy:"AUTHENTIC_GEOMETRY_NO_DEFORMATION",
    shearAllowed:false,
    independentAxisScaleAllowed:false,
  };
}

export function assertPantavionAuthenticAlignmentSafe(
  alignment: PantavionAuthenticMapAlignment,
) {
  const errors:string[]=[];
  if (alignment.targetCrs!=="EPSG:6312") errors.push("TARGET_CRS_NOT_EPSG_6312");
  if (alignment.method!=="similarity_2d_no_shear_v1") errors.push("NON_SIMILARITY_TRANSFORM_FORBIDDEN");
  if (alignment.shearAllowed!==false) errors.push("SHEAR_FORBIDDEN");
  if (alignment.independentAxisScaleAllowed!==false) errors.push("INDEPENDENT_AXIS_SCALE_FORBIDDEN");
  if (alignment.geometryPolicy!=="AUTHENTIC_GEOMETRY_NO_DEFORMATION") errors.push("AUTHENTIC_GEOMETRY_POLICY_REQUIRED");
  if (!Number.isFinite(alignment.rmseMeters) || !Number.isFinite(alignment.maxResidualMeters)) errors.push("RESIDUAL_EVIDENCE_REQUIRED");
  return {ok:errors.length===0,errors};
}
