export const WATER_MOBILE_OPERATIONAL_RADIUS_METERS = 2000 as const;
export type WaterMobileCenterMode = "GPS_FOLLOW" | "MANUAL_CENTER";
export type WaterMapPoint = { latitude:number; longitude:number };

export type WaterMobileViewportState = {
  mode: WaterMobileCenterMode;
  center: WaterMapPoint;
  radiusMeters: typeof WATER_MOBILE_OPERATIONAL_RADIUS_METERS;
  gpsPosition: WaterMapPoint | null;
};

function validPoint(p:WaterMapPoint){
  return Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&
    p.latitude>=-90&&p.latitude<=90&&p.longitude>=-180&&p.longitude<=180;
}

export function createGpsCenteredWaterViewport(gps:WaterMapPoint):WaterMobileViewportState{
  if(!validPoint(gps)) throw new Error("water_mobile_gps_invalid");
  return {mode:"GPS_FOLLOW",center:gps,radiusMeters:WATER_MOBILE_OPERATIONAL_RADIUS_METERS,gpsPosition:gps};
}

export function moveWaterViewportManually(
  state:WaterMobileViewportState,
  center:WaterMapPoint,
):WaterMobileViewportState{
  if(!validPoint(center)) throw new Error("water_mobile_manual_center_invalid");
  return {...state,mode:"MANUAL_CENTER",center,radiusMeters:WATER_MOBILE_OPERATIONAL_RADIUS_METERS};
}

export function updateWaterGps(
  state:WaterMobileViewportState,
  gps:WaterMapPoint,
):WaterMobileViewportState{
  if(!validPoint(gps)) throw new Error("water_mobile_gps_invalid");
  return state.mode==="GPS_FOLLOW"
    ? {...state,gpsPosition:gps,center:gps,radiusMeters:WATER_MOBILE_OPERATIONAL_RADIUS_METERS}
    : {...state,gpsPosition:gps,radiusMeters:WATER_MOBILE_OPERATIONAL_RADIUS_METERS};
}

export function returnWaterViewportToGps(state:WaterMobileViewportState):WaterMobileViewportState{
  if(!state.gpsPosition) throw new Error("water_mobile_gps_unavailable");
  return {...state,mode:"GPS_FOLLOW",center:state.gpsPosition,radiusMeters:WATER_MOBILE_OPERATIONAL_RADIUS_METERS};
}
