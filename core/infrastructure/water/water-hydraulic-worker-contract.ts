import {
  type WaterHydraulicModel,
  validateWaterHydraulicModel,
} from "./water-hydraulic-model-contract.ts";
import {
  exportWaterHydraulicModelToEpanetInp,
  type WaterEpanetCurveDefinition,
} from "./water-epanet-model-export.ts";

export type WaterHydraulicEngineId = "EPANET_2_2" | "WNTR";

export type WaterHydraulicNodeResult = {
  nodeId:string;
  pressureHeadM:number | null;
  hydraulicHeadM:number | null;
  demandLps:number | null;
};

export type WaterHydraulicLinkResult = {
  featureId:string;
  flowLps:number | null;
  velocityMps:number | null;
  headlossM:number | null;
  status?:string;
};

export type WaterHydraulicEngineResult = {
  engine:WaterHydraulicEngineId;
  engineVersion:string;
  simulationStartedAt:string;
  simulationFinishedAt:string;
  nodes:WaterHydraulicNodeResult[];
  links:WaterHydraulicLinkResult[];
  warnings:string[];
  rawArtifactRef?:string;
};

export interface WaterHydraulicEngineAdapter {
  readonly engine:WaterHydraulicEngineId;
  readonly engineVersion:string;
  runEpanetInp(input:{
    inp:string;
    networkRevisionId:string;
    jobId:string;
  }):Promise<WaterHydraulicEngineResult>;
}

export type WaterHydraulicWorkerInput = {
  jobId:string;
  networkRevisionId:string;
  engineRequested:WaterHydraulicEngineId;
  model:WaterHydraulicModel;
  curves:WaterEpanetCurveDefinition[];
};

export type WaterHydraulicWorkerOutcome =
  | {
      ok:true;
      status:"SUCCEEDED";
      result:WaterHydraulicEngineResult;
      governance:{
        authenticNetworkModified:false;
        sourceRevisionPinned:true;
      };
    }
  | {
      ok:false;
      status:"BLOCKED"|"FAILED";
      code:string;
      blockers:string[];
      governance:{
        authenticNetworkModified:false;
        sourceRevisionPinned:true;
      };
    };

export async function runWaterHydraulicWorker(
  input:WaterHydraulicWorkerInput,
  adapter:WaterHydraulicEngineAdapter | null,
):Promise<WaterHydraulicWorkerOutcome>{
  const governance={
    authenticNetworkModified:false as const,
    sourceRevisionPinned:true as const,
  };

  if(input.model.networkRevisionId!==input.networkRevisionId){
    return {ok:false,status:"BLOCKED",code:"NETWORK_REVISION_MISMATCH",blockers:["NETWORK_REVISION_MISMATCH"],governance};
  }

  const validation=validateWaterHydraulicModel(input.model);
  if(!validation.ok){
    return {
      ok:false,
      status:"BLOCKED",
      code:"HYDRAULIC_MODEL_INVALID",
      blockers:validation.issues.filter(i=>i.severity==="BLOCKER").map(i=>`${i.code}:${i.objectRef}`),
      governance,
    };
  }

  if(!adapter){
    return {ok:false,status:"BLOCKED",code:"HYDRAULIC_ENGINE_UNAVAILABLE",blockers:["HYDRAULIC_ENGINE_UNAVAILABLE"],governance};
  }
  if(adapter.engine!==input.engineRequested){
    return {ok:false,status:"BLOCKED",code:"HYDRAULIC_ENGINE_MISMATCH",blockers:["HYDRAULIC_ENGINE_MISMATCH"],governance};
  }

  const exported=exportWaterHydraulicModelToEpanetInp(input.model,input.curves);
  if(!exported.ok || !exported.inp){
    return {ok:false,status:"BLOCKED",code:"EPANET_EXPORT_BLOCKED",blockers:exported.blockers,governance};
  }

  try{
    const result=await adapter.runEpanetInp({
      inp:exported.inp,
      networkRevisionId:input.networkRevisionId,
      jobId:input.jobId,
    });
    if(result.engine!==input.engineRequested){
      return {ok:false,status:"FAILED",code:"ENGINE_RESULT_IDENTITY_MISMATCH",blockers:["ENGINE_RESULT_IDENTITY_MISMATCH"],governance};
    }
    return {ok:true,status:"SUCCEEDED",result,governance};
  }catch(error){
    return {
      ok:false,
      status:"FAILED",
      code:"HYDRAULIC_ENGINE_EXECUTION_FAILED",
      blockers:[error instanceof Error ? error.message : String(error)],
      governance,
    };
  }
}

export const PANTAVION_WATER_HYDRAULIC_WORKER_POLICY={
  authenticNetworkWriteAllowed:false,
  engineMustBeExplicitlyAvailable:true,
  invalidModelExecutionAllowed:false,
  networkRevisionMismatchAllowed:false,
  externalEngineResultMustMatchRequestedEngine:true,
  resultsAreAnalysisArtifactsNotNetworkEdits:true,
} as const;
