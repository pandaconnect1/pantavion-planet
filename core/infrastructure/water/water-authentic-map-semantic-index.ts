import type {
  WaterAuthenticMapFeatureKind,
} from "./water-authentic-map-semantic-reader";

export type WaterAuthenticMapRawEntity = {
  entityRef:string;
  entityType?:string;
  layerName?:string;
  blockName?:string;
  text?:string;
  attributes?:Record<string,string>;
  colour?:unknown;
  lineType?:string;
  lineWeight?:number;
};

export type WaterVerifiedSymbolRule = {
  ruleId:string;
  featureKind:WaterAuthenticMapFeatureKind;
  sourceRevisionId:string;
  match:{
    entityType?:string;
    layerName?:string;
    blockName?:string;
    textContains?:string;
  };
  evidenceRef:string;
};

export type WaterSemanticIndexEntry = {
  entityRef:string;
  featureKind:WaterAuthenticMapFeatureKind;
  original:{
    entityType?:string;
    layerName?:string;
    blockName?:string;
    text?:string;
    attributes?:Record<string,string>;
    colour?:unknown;
    lineType?:string;
    lineWeight?:number;
  };
  classificationEvidence:string[];
  sourceRevisionId:string;
};

function ruleMatches(e:WaterAuthenticMapRawEntity,r:WaterVerifiedSymbolRule){
  const m=r.match;
  return (
    (m.entityType===undefined || m.entityType===e.entityType) &&
    (m.layerName===undefined || m.layerName===e.layerName) &&
    (m.blockName===undefined || m.blockName===e.blockName) &&
    (m.textContains===undefined || (e.text||"").toUpperCase().includes(m.textContains.toUpperCase()))
  );
}

export function buildAuthenticWaterSemanticIndex(
  entities:WaterAuthenticMapRawEntity[],
  rules:WaterVerifiedSymbolRule[],
  sourceRevisionId:string,
):WaterSemanticIndexEntry[]{
  return entities.map(entity=>{
    const matches=rules.filter(r=>r.sourceRevisionId===sourceRevisionId && ruleMatches(entity,r));
    const kinds=[...new Set(matches.map(m=>m.featureKind))];
    if(kinds.length>1) throw new Error("water_semantic_index_conflicting_verified_symbol_rules");
    return {
      entityRef:entity.entityRef,
      featureKind:kinds[0] ?? "UNKNOWN",
      original:{...entity},
      classificationEvidence:matches.map(m=>m.evidenceRef),
      sourceRevisionId,
    };
  });
}

export const PANTAVION_WATER_SEMANTIC_INDEX_POLICY={
  coversAllExtractedEntities:true,
  preservesOriginalMetadata:true,
  modifiesAuthenticMap:false,
  unresolvedEntityIsUnknown:true,
  verifiedSymbolRulesRequiredForClassification:true,
  conflictingRulesAreFatal:true,
} as const;
