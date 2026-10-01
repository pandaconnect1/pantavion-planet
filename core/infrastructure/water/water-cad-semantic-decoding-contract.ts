export type WaterCadSemanticEvidence =
  | "VERIFIED_LEGEND"
  | "LAYER_NAME"
  | "ENTITY_COLOR"
  | "LINETYPE"
  | "LINEWEIGHT"
  | "TEXT_LABEL"
  | "BLOCK_ATTRIBUTE"
  | "SURVEY_RECORD"
  | "FIELD_CONFIRMED";

export type WaterCadEntityStyle = {
  entityId:string;
  layerName?:string;
  aciColor?:number;
  trueColorHex?:string;
  lineType?:string;
  lineWeight?:number;
  nearbyText?:string[];
  blockAttributes?:Record<string,string>;
};

export type WaterPipeSemantic = {
  entityId:string;
  pipeType?:string;
  nominalDiameterMm?:number;
  material?:string;
  pressureClass?:string;
  installationEra?:string;
  evidence:WaterCadSemanticEvidence[];
  confidence:"UNVERIFIED"|"VERIFIED";
};

export type WaterCadLegendRule = {
  ruleId:string;
  sourceRevisionId:string;
  match:{
    layerName?:string;
    aciColor?:number;
    trueColorHex?:string;
    lineType?:string;
  };
  means:{
    pipeType?:string;
    nominalDiameterMm?:number;
    material?:string;
    pressureClass?:string;
  };
  verifiedBy:string;
  verifiedAt:string;
  evidenceRef:string;
};

export const PANTAVION_WATER_CAD_SEMANTIC_POLICY = {
  authenticCadMayBeModified:false,
  metadataMayBeRead:true,
  colourAloneMayNotBecomeHydraulicFactWithoutVerifiedLegend:true,
  layerNameAloneMayNotBecomeHydraulicFactWithoutEvidence:true,
  nearbyTextMaySupportButNotSilentlyOverrideVerifiedLegend:true,
  conflictingEvidenceMustBeFlagged:true,
  unknownDiameterMustRemainUnknown:true,
  unknownMaterialMustRemainUnknown:true,
  hydraulicSolverMustRejectRequiredUnknowns:true,
} as const;

export function decodeWaterPipeSemantic(
  entity:WaterCadEntityStyle,
  rules:WaterCadLegendRule[],
):WaterPipeSemantic {
  const matched=rules.filter(r =>
    (r.match.layerName===undefined || r.match.layerName===entity.layerName) &&
    (r.match.aciColor===undefined || r.match.aciColor===entity.aciColor) &&
    (r.match.trueColorHex===undefined || r.match.trueColorHex===entity.trueColorHex) &&
    (r.match.lineType===undefined || r.match.lineType===entity.lineType)
  );

  if (matched.length===0) {
    return {entityId:entity.entityId,evidence:[],confidence:"UNVERIFIED"};
  }

  const first=matched[0];
  const conflict=matched.some(r =>
    r.means.nominalDiameterMm!==first.means.nominalDiameterMm ||
    r.means.material!==first.means.material ||
    r.means.pipeType!==first.means.pipeType ||
    r.means.pressureClass!==first.means.pressureClass
  );
  if(conflict) throw new Error("water_cad_semantic_conflicting_verified_rules");

  return {
    entityId:entity.entityId,
    ...first.means,
    evidence:["VERIFIED_LEGEND"],
    confidence:"VERIFIED",
  };
}

export const WATER_HYDRAULIC_REQUIRED_PIPE_INPUTS = [
  "length",
  "nominalDiameter",
  "roughnessOrResistanceParameter",
  "connectivity",
] as const;
