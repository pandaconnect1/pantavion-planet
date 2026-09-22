import fs from "node:fs";
import assert from "node:assert/strict";

const registryModule = await import("../core/water/cyprus-geospatial-source-registry.ts");
const snapshot = registryModule.getCyprusWaterGeospatialSourceSnapshot();
const sourceIds = new Set(snapshot.sources.map((source) => source.id));
const registry = fs.readFileSync("core/water/cyprus-geospatial-source-registry.ts", "utf8");
const center = fs.readFileSync("app/professional/infrastructure/water/page.tsx", "utf8");
const cyprus = fs.readFileSync("app/professional/infrastructure/water/cyprus/page.tsx", "utf8");
const intake = fs.readFileSync("app/professional/infrastructure/water/import/page.tsx", "utf8");
const universal = fs.readFileSync("core/intake/pantavion-universal-artifact-intake.ts", "utf8");

for (const marker of [
  "dls-admin-boundaries",
  "dls-cadastral-map",
  "dls-topography",
  "dls-photogrammetry-2026",
  "gsd-geology-inspire",
  "eoa-lemesos-private-water-network",
  "eoa-lefkosia-private-water-network",
  "eoa-larnaka-private-water-network",
  "eoa-ammochostos-private-water-network",
  "eoa-pafos-private-water-network",
]) {
  assert(sourceIds.has(marker), `missing Cyprus source: ${marker}`);
}

assert.equal(snapshot.totalSources, 11);
assert.equal(snapshot.authorityAgreementSources, 5);
assert(snapshot.sources.some((source) => source.sensitivity === "critical_infrastructure_private"));
assert(snapshot.sources.some((source) => source.access === "AUTHORITY_DATA_AGREEMENT_REQUIRED"));
assert(registry.includes("No scraping or public exposure"));

assert(center.includes("/professional/infrastructure/water/cyprus"));
assert(center.includes("/professional/infrastructure/water/import"));
assert(cyprus.includes("Cyprus Geospatial Federation"));
assert(intake.includes("/kernel/artifact-upload"));

for (const ext of ["dwg","dxf","dgn","pdf","shp","gpkg","gml","kml","kmz","geotiff","dem","mbtiles","pmtiles"]) {
  assert(new RegExp(`["']${ext}["']`).test(universal), `universal registry missing ${ext}`);
}

console.log(JSON.stringify({
  marker: "pantavion_water_cyprus_federation_audit_v1",
  ok: true,
  districts: 5,
  protectedEoaNetworkSlots: 5,
  officialCyprusFoundation: ["DLS", "INSPIRE", "Geological Survey"],
  universalFormatSafety: true,
}, null, 2));
