import type {
  WaterHydraulicEngineAdapter,
  WaterHydraulicEngineId,
  WaterHydraulicEngineResult,
} from "./water-hydraulic-worker-contract.ts";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

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

        let payload:any=null;
        try{ payload=await response.json(); }catch{}
        if(!response.ok){
          const code=typeof payload?.error==="string" ? payload.error : "worker_http_"+response.status;
          throw new Error("water_worker_failed:"+code);
        }

        if(payload?.ok!==true) throw new Error("water_worker_response_not_ok");
        if(payload?.jobId!==input.jobId) throw new Error("water_worker_job_identity_mismatch");
        if(payload?.networkRevisionId!==input.networkRevisionId) throw new Error("water_worker_revision_identity_mismatch");
        if(payload?.engine!==options.engine) throw new Error("water_worker_engine_identity_mismatch");
        if(!Array.isArray(payload?.nodes) || !Array.isArray(payload?.links)){
          throw new Error("water_worker_result_shape_invalid");
        }

        return {
          engine:options.engine,
          engineVersion:String(payload.engineVersion ?? "unknown"),
          simulationStartedAt:String(payload.simulationStartedAt ?? ""),
          simulationFinishedAt:String(payload.simulationFinishedAt ?? ""),
          nodes:payload.nodes.map((n:any)=>({
            nodeId:String(n.nodeId),
            pressureHeadM:asFiniteNumberOrNull(n.pressureHeadM),
            hydraulicHeadM:asFiniteNumberOrNull(n.hydraulicHeadM),
            demandLps:asFiniteNumberOrNull(n.demandLps),
          })),
          links:payload.links.map((l:any)=>({
            featureId:String(l.featureId),
            flowLps:asFiniteNumberOrNull(l.flowLps),
            velocityMps:asFiniteNumberOrNull(l.velocityMps),
            headlossM:asFiniteNumberOrNull(l.headlossM),
            status:l.status==null ? undefined : String(l.status),
          })),
          warnings:Array.isArray(payload.warnings)
            ? payload.warnings.map((w:any)=>String(w))
            : [],
          rawArtifactRef:typeof payload.rawArtifactRef==="string"
            ? payload.rawArtifactRef
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
