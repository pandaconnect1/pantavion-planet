export const WATER_DEVICE_ID_COOKIE = "pantavion_water_device_id_v2";
export const WATER_DEVICE_TOKEN_COOKIE = "pantavion_water_device_token_v2";
export const WATER_DEVICE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function cleanCookieValue(value:string|undefined){
  return typeof value==="string" ? value.trim() : "";
}

function parseCookieHeader(header:string|null){
  const out=new Map<string,string>();
  if(!header) return out;
  for(const part of header.split(";")){
    const idx=part.indexOf("=");
    if(idx<=0) continue;
    const name=part.slice(0,idx).trim();
    const value=part.slice(idx+1).trim();
    try{ out.set(name,decodeURIComponent(value)); }
    catch{ out.set(name,value); }
  }
  return out;
}

export function getWaterDeviceClaimFromRequest(request:Request){
  const cookies=parseCookieHeader(request.headers.get("cookie"));
  const deviceId=cleanCookieValue(cookies.get(WATER_DEVICE_ID_COOKIE));
  const deviceToken=cleanCookieValue(cookies.get(WATER_DEVICE_TOKEN_COOKIE));
  return {deviceId,deviceToken};
}
