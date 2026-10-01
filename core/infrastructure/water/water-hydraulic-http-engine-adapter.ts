import type {
  WaterHydraulicEngineAdapter,
  WaterHydraulicEngineId,
  WaterHydraulicEngineResult,
} from "./water-hydraulic-worker-contract.ts";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type UnknownRecord = Record<string, unknown>;

export type WaterHydraulicHttpAdapterOptions = {
  endpoint:string;
  token:string;
  engine:WaterHydraulicEngineId;
  timeoutMs?:number;
  demandModel?:"DD"|"PDD";
  fetchImpl?:FetchLike;
};

function normalizeEndpoint(value:string){
  const url=new URL(value);
  const privateRailway=url.hostname.endsWith(".railway.internal");
  const local=url.hostname==="localhost" || url.hostname==="127.0.0.1";
  if(url.protocol!=="https:" && !(url.protocol==="http:" && (privateRailway || local))){
    throw new Error("water_worker_endpoint_requires_https_or_private_network");
  }
  url.pathname=url.pathname.replace(/\/$/,"");
  return url.toString().replace(/\/$/,"");
}

function asFiniteNumberOrNull(value:unknown){
  return typeof value==="number" && Number.isFinite(value) ? value : null;
}

function asRecord(value:unknown):UnknownRecord|null{
  if(value===null || typeof value!=="object" || Array.isArray(value)) return null;
  return value as UnknownRecord;
}

function asArray(value:unknown):unknown[]{
  return Array.isArray(value) ? value : [];
}

function requiredString(record:UnknownRecord,key:string,errorCode:string){
  const value=record[key];
  if(typeof value!=="string" || !value) throw new Error(errorCode);
  return value;
}

export function createWaterHydraulicHttpEngineAdapter(
  options:WaterHydraulicHttpAdapterOptions,
):WaterHydraulicEngineAdapter{
  if(options.token.length<32) throw new Error("water_worker_token_too_short");
  const endpoint=normalizeEndpoint(options.endpoint);
  const timeoutMs=options.timeoutMs ?? 180_000;
  if(!Number.isFinite(timeoutMs) || timeoutMs<1_000 || timeoutMs>900_000){
    throw new Error("water_worker_timeout_invalid");
  }
  const fetchImpl=options.fetchImpl ?? fetch;

  return {
    engine:options.engine,
    engineVersion:"remote-worker",
    async runEpanetInp(input):Promise<WaterHydraulicEngineResult>{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),timeoutMs);
      try{
        const response=await fetchImpl(endpoint+"/run",{
          method:"POST",
          headers:{
            "Authorization":"Bearer "+options.token,
            "Content-Type":"application/json",
            "Accept":"application/json",
          },
          body:JSON.stringify({
            jobId:input.jobId,
            networkRevisionId:input.networkRevisionId,
            engine:options.engine,
            inp:input.inp,
            demandModel:options.demandModel ?? "DD",
          }),
          cache:"no-store",
          signal:controller.signal,
        });

        let payload:unknown=null;
        try{
          payload=await response.json();
        }catch{
          payload=null;
        }
        const record=asRecord(payload);

        if(!response.ok){
          const errorValue=record?.["error"];
          const code=typeof errorValue==="string"
            ? errorValue
            : "worker_http_"+response.status;
          throw new Error("water_worker_failed:"+code);
        }

        if(!record || record["ok"]!==true) throw new Error("water_worker_response_not_ok");
        if(record["jobId"]!==input.jobId) throw new Error("water_worker_job_identity_mismatch");
        if(record["networkRevisionId"]!==input.networkRevisionId) throw new Error("water_worker_revision_identity_mismatch");
        if(record["engine"]!==options.engine) throw new Error("water_worker_engine_identity_mismatch");

        const nodeRows=asArray(record["nodes"]);
        const linkRows=asArray(record["links"]);
        if(!Array.isArray(record["nodes"]) || !Array.isArray(record["links"])){
          throw new Error("water_worker_result_shape_invalid");
        }

        const nodes=nodeRows.map((value)=>{
          const node=asRecord(value);
          if(!node) throw new Error("water_worker_node_shape_invalid");
          return {
            nodeId:requiredString(node,"nodeId","water_worker_node_id_invalid"),
            pressureHeadM:asFiniteNumberOrNull(node["pressureHeadM"]),
            hydraulicHeadM:asFiniteNumberOrNull(node["hydraulicHeadM"]),
            demandLps:asFiniteNumberOrNull(node["demandLps"]),
          };
        });

        const links=linkRows.map((value)=>{
          const link=asRecord(value);
          if(!link) throw new Error("water_worker_link_shape_invalid");
          const status=link["status"];
          return {
            featureId:requiredString(link,"featureId","water_worker_feature_id_invalid"),
            flowLps:asFiniteNumberOrNull(link["flowLps"]),
            velocityMps:asFiniteNumberOrNull(link["velocityMps"]),
            headlossM:asFiniteNumberOrNull(link["headlossM"]),
            status:status==null ? undefined : String(status),
          };
        });

        const rawArtifactRef=record["rawArtifactRef"];

        return {
          engine:options.engine,
          engineVersion:String(record["engineVersion"] ?? "unknown"),
          simulationStartedAt:String(record["simulationStartedAt"] ?? ""),
          simulationFinishedAt:String(record["simulationFinishedAt"] ?? ""),
          nodes,
          links,
          warnings:asArray(record["warnings"]).map((warning)=>String(warning)),
          rawArtifactRef:typeof rawArtifactRef==="string"
            ? rawArtifactRef
            : undefined,
        };
      }finally{
        clearTimeout(timer);
      }
    },
  };
}

export function createWaterHydraulicHttpEngineAdapterFromEnv(
  engine:WaterHydraulicEngineId,
){
  const endpoint=process.env.PANTAVION_WATER_ENGINEERING_WORKER_URL?.trim() ?? "";
  const token=process.env.PANTAVION_WATER_ENGINEERING_WORKER_TOKEN?.trim() ?? "";
  if(!endpoint) throw new Error("water_worker_url_not_configured");
  if(!token) throw new Error("water_worker_token_not_configured");
  return createWaterHydraulicHttpEngineAdapter({endpoint,token,engine});
}
