import { createHash } from "node:crypto";
import type { WaterHydraulicModel } from "./water-hydraulic-model-contract.ts";
import type { WaterEpanetCurveDefinition } from "./water-epanet-model-export.ts";
import type { WaterHydraulicEngineId } from "./water-hydraulic-worker-contract.ts";

type CanonicalJson =
  | null
  | boolean
  | number
  | string
  | CanonicalJson[]
  | { [key:string]: CanonicalJson };

function canonicalize(value:unknown):CanonicalJson{
  if(value===null || typeof value==="boolean" || typeof value==="string") return value;
  if(typeof value==="number"){
    if(!Number.isFinite(value)) throw new Error("water_job_fingerprint_non_finite_number");
    return value;
  }
  if(Array.isArray(value)) return value.map(canonicalize);
  if(typeof value==="object"){
    const obj=value as Record<string,unknown>;
    const out:Record<string,CanonicalJson>={};
    for(const key of Object.keys(obj).sort()){
      if(obj[key]===undefined) continue;
      out[key]=canonicalize(obj[key]);
    }
    return out;
  }
  throw new Error("water_job_fingerprint_unsupported_value");
}

export function createWaterHydraulicJobFingerprint(input:{
  engine:WaterHydraulicEngineId;
  analysisScope:"HYDRAULIC_INFLUENCE_GRAPH"|"FULL_NETWORK_MODEL";
  networkRevisionId:string;
  model:WaterHydraulicModel;
  curves:WaterEpanetCurveDefinition[];
  telemetrySnapshotRefs?:string[];
  scenarioParameters?:Record<string,unknown>;
}){
  if(input.model.networkRevisionId!==input.networkRevisionId){
    throw new Error("water_job_fingerprint_revision_mismatch");
  }

  const model={
    ...input.model,
    generatedAt:undefined,
  };

  const payload=canonicalize({
    schema:"pantavion-water-hydraulic-job-fingerprint.v1",
    engine:input.engine,
    analysisScope:input.analysisScope,
    networkRevisionId:input.networkRevisionId,
    model,
    curves:input.curves,
    telemetrySnapshotRefs:[...(input.telemetrySnapshotRefs??[])].sort(),
    scenarioParameters:input.scenarioParameters??{},
  });

  const canonicalJson=JSON.stringify(payload);
  const sha256=createHash("sha256").update(canonicalJson).digest("hex");
  return {sha256,canonicalJson};
}

export const PANTAVION_WATER_JOB_FINGERPRINT_POLICY={
  deterministic:true,
  generatedAtExcluded:true,
  networkRevisionIncluded:true,
  engineIncluded:true,
  analysisScopeIncluded:true,
  telemetrySnapshotRefsIncluded:true,
  scenarioParametersIncluded:true,
} as const;
