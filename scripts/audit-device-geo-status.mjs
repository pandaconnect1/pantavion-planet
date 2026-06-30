import { readFileSync } from "node:fs";

const core = readFileSync("core/geo/device-geo-status.ts", "utf8");
const audit = readFileSync("core/geo/device-geo-status-audit.ts", "utf8");
const route = readFileSync("app/api/kernel/device-geo-status/route.ts", "utf8");
const component = readFileSync("components/geo/DeviceGeoStatusClient.tsx", "utf8");
const page = readFileSync("app/professional/infrastructure/water/geo-status/page.tsx", "utf8");

const requiredTokens = [
  "assessPantavionDeviceGeoStatus",
  "listPantavionDeviceGeoStatusPolicy",
  "browser_geolocation",
  "buildViewport",
  "canOpenCurrentArea",
  "canSearchNearbyRoads",
  "canBindToDwgViewport",
  "preciseLocationStored: false",
  "continuousTracking: false",
  "backgroundTracking: false",
  "device-geo-status-audit.jsonl",
  "appendPantavionDeviceGeoStatusAudit",
  "export async function GET",
  "export async function POST",
  "pantavion_device_geo_status_current_position_viewport",
  "navigator.geolocation.getCurrentPosition",
  "Use my current location",
  "DeviceGeoStatusClient"
];

const combined = `${core}\n${audit}\n${route}\n${component}\n${page}`;
const missing = requiredTokens.filter((token) => !combined.includes(token));

if (missing.length > 0) {
  console.error("Device geo status audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Device geo status audit passed.");
