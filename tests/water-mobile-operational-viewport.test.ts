import assert from "node:assert/strict";
import {
  WATER_MOBILE_OPERATIONAL_RADIUS_METERS,
  createGpsCenteredWaterViewport,
  moveWaterViewportManually,
  updateWaterGps,
  returnWaterViewportToGps,
} from "../core/infrastructure/water/water-mobile-operational-viewport.ts";

const gps={latitude:34.68,longitude:33.04};
let s=createGpsCenteredWaterViewport(gps);
assert.equal(s.radiusMeters,2000);
assert.equal(s.mode,"GPS_FOLLOW");

const manual={latitude:34.70,longitude:33.06};
s=moveWaterViewportManually(s,manual);
assert.equal(s.mode,"MANUAL_CENTER");
assert.deepEqual(s.center,manual);
assert.equal(s.radiusMeters,WATER_MOBILE_OPERATIONAL_RADIUS_METERS);

const movedGps={latitude:34.69,longitude:33.05};
s=updateWaterGps(s,movedGps);
assert.deepEqual(s.center,manual);
assert.deepEqual(s.gpsPosition,movedGps);
assert.equal(s.radiusMeters,2000);

s=returnWaterViewportToGps(s);
assert.equal(s.mode,"GPS_FOLLOW");
assert.deepEqual(s.center,movedGps);
assert.equal(s.radiusMeters,2000);
console.log(JSON.stringify({ok:true,radiusMeters:2000,modes:["GPS_FOLLOW","MANUAL_CENTER"]}));
