import { NextResponse } from "next/server";
import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const VERSION = "pantavion-water-engineering-readiness-v1";

function allowedWorkerUrl(raw:string){
  const url=new URL(raw);
  const local=url.hostname==="localhost" || url.hostname==="127.0.0.1";
  const privateRailway=url.hostname.endsWith(".railway.internal");
  if(url.protocol==="https:") return url;
  if(url.protocol==="http:" && (local || privateRailway)) return url;
  throw new Error("worker_endpoint_not_allowed");
}

export async function GET(request:Request){
  const access=await authorizeWaterMapRequest(request);
  if(!access.ok){
    return NextResponse.json(
      {ok:false,error:"access_not_approved",version:VERSION},
      {status:403,headers:{"Cache-Control":"no-store"}},
    );
  }

  const rawUrl=process.env.PANTAVION_WATER_ENGINEERING_WORKER_URL?.trim() ?? "";
  const tokenConfigured=(process.env.PANTAVION_WATER_ENGINEERING_WORKER_TOKEN?.trim().length ?? 0)>=32;

  if(!rawUrl){
    return NextResponse.json({
      ok:true,
      version:VERSION,
      ready:false,
      status:"not_configured",
      worker:{
        urlConfigured:false,
        tokenConfigured,
        reachable:false,
      },
      authenticNetworkWriteAllowed:false,
    },{headers:{"Cache-Control":"no-store"}});
  }

  let base:URL;
  try{
    base=allowedWorkerUrl(rawUrl);
  }catch{
    return NextResponse.json({
      ok:true,
      version:VERSION,
      ready:false,
      status:"invalid_configuration",
      worker:{
        urlConfigured:true,
        tokenConfigured,
        reachable:false,
      },
      authenticNetworkWriteAllowed:false,
    },{headers:{"Cache-Control":"no-store"}});
  }

  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5_000);
  try{
    const healthUrl=new URL("/health",base);
    const response=await fetch(healthUrl,{
      method:"GET",
      cache:"no-store",
      signal:controller.signal,
    });
    const payload=await response.json().catch(()=>null);
    const healthy=
      response.ok &&
      payload?.ok===true &&
      payload?.service==="pantavion-water-engineering-worker" &&
      payload?.sourceNetworkWriteAllowed===false;

    return NextResponse.json({
      ok:true,
      version:VERSION,
      ready:healthy && tokenConfigured,
      status:healthy && tokenConfigured ? "ready" : "degraded",
      worker:{
        urlConfigured:true,
        tokenConfigured,
        reachable:healthy,
        wntrVersion:healthy ? String(payload.wntrVersion ?? "unknown") : null,
        engines:healthy && Array.isArray(payload.engines)
          ? payload.engines.map((x:unknown)=>String(x))
          : [],
      },
      authenticNetworkWriteAllowed:false,
      accessMode:access.mode,
    },{headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({
      ok:true,
      version:VERSION,
      ready:false,
      status:"worker_unreachable",
      worker:{
        urlConfigured:true,
        tokenConfigured,
        reachable:false,
      },
      authenticNetworkWriteAllowed:false,
    },{headers:{"Cache-Control":"no-store"}});
  }finally{
    clearTimeout(timer);
  }
}
