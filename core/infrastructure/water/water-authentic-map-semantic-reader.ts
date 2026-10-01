export type WaterAuthenticMapFeatureKind =
  | "PIPE"
  | "VALVE"
  | "HYDRANT"
  | "JUNCTION"
  | "PUMP"
  | "TANK"
  | "RESERVOIR"
  | "METER"
  | "ROAD"
  | "BUILDING"
  | "TEXT"
  | "SYMBOL"
  | "UNKNOWN";

export type WaterAuthenticMapEvidence = {
  entityRef:string;
  featureKind:WaterAuthenticMapFeatureKind;
  layerName?:string;
  colour?:unknown;
  lineType?:string;
  lineWeight?:number;
  blockName?:string;
  textLabels:string[];
  attributes:Record<string,string>;
  nearbyRoadNames:string[];
  sourceRevisionId:string;
  sourceSha256:string;
};

export type WaterPipeDecodedAttributes = {
  pipeType?:string;
  nominalDiameterMm?:number;
  material?:string;
  pressureClass?:string;
  textEvidence:string[];
  styleEvidence:{
    layerName?:string;
    colour?:unknown;
    lineType?:string;
    lineWeight?:number;
  };
  confidence:"DIRECT_MAP_TEXT"|"DIRECT_BLOCK_ATTRIBUTE"|"CORROBORATED"|"UNRESOLVED";
};

export const PANTAVION_WATER_AUTHENTIC_MAP_READING_POLICY = {
  masterMapIsSourceOfTruth:true,
  masterMapMayBeModified:false,
  textOnAuthenticMapMayDefinePipeAttributes:true,
  blockAttributesMayDefineAssetAttributes:true,
  colourAndLayerAreSupportingEvidence:true,
  colourMustNotOverrideDirectMapText:true,
  roadsValvesSymbolsAndLabelsAreMachineReadableWhenPresent:true,
  unresolvedItemsMustRemainUnresolved:true,
  everyDecodedFactMustRetainEntityAndSourceRevision:true,
} as const;

const DIAMETER_PATTERNS = [
  /(?:Ø|Φ|DN)\s*(\d{2,4})\b/i,
  /\b(\d{2,4})\s*mm\b/i,
];

export function extractPipeDiameterFromAuthenticText(labels:string[]):number|undefined{
  for(const label of labels){
    for(const pattern of DIAMETER_PATTERNS){
      const m=label.match(pattern);
      if(m){
        const n=Number(m[1]);
        if(Number.isFinite(n) && n>0) return n;
      }
    }
  }
  return undefined;
}

export function decodePipeFromAuthenticMap(
  evidence:WaterAuthenticMapEvidence,
):WaterPipeDecodedAttributes{
  const labels=evidence.textLabels.filter(Boolean);
  const diameter=extractPipeDiameterFromAuthenticText(labels);

  const materialText=labels.join(" ").toUpperCase();
  const material =
    /\bHDPE\b|\bPE\b|POLYETHYLENE/.test(materialText) ? "PE" :
    /DUCTILE\s+IRON|\bDI\b/.test(materialText) ? "DI" :
    /CAST\s+IRON|\bCI\b/.test(materialText) ? "CI" :
    /\bPVC\b/.test(materialText) ? "PVC" :
    /STEEL|\bST\b/.test(materialText) ? "STEEL" :
    undefined;

  const pipeType =
    /MAIN|TRUNK|ΚΕΝΤΡΙΚ/.test(materialText) ? "MAIN" :
    /SERVICE|ΠΑΡΟΧ/.test(materialText) ? "SERVICE" :
    undefined;

  const confidence =
    labels.length && (diameter || material || pipeType)
      ? "DIRECT_MAP_TEXT"
      : Object.keys(evidence.attributes).length
        ? "DIRECT_BLOCK_ATTRIBUTE"
        : "UNRESOLVED";

  return {
    pipeType,
    nominalDiameterMm:diameter,
    material,
    textEvidence:labels,
    styleEvidence:{
      layerName:evidence.layerName,
      colour:evidence.colour,
      lineType:evidence.lineType,
      lineWeight:evidence.lineWeight,
    },
    confidence,
  };
}
