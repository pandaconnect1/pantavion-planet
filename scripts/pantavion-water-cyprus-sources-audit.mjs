import assert from "node:assert/strict";

const registryModule = await import("../core/water/cyprus-geospatial-source-registry.ts");
const snapshot = registryModule.getCyprusWaterGeospatialSourceSnapshot();
const ids = new Set(snapshot.sources.map((source) => source.id));

assert.equal(snapshot.marker, "pantavion_cyprus_water_geospatial_sources_v2");
assert.equal(snapshot.totalSources, 11);
assert.equal(snapshot.publicSources, 5);
assert.equal(snapshot.authorizedSources, 1);
assert.equal(snapshot.authorityAgreementSources, 5);

for (const id of [
  "dls-hydrography",
  "dls-primary-roads",
  "dls-secondary-roads",
  "dls-other-roads",
  "gsd-geology-geomorphology",
  "dls-photogrammetry-2026",
  "eoa-lemesos-private-water-network",
  "eoa-lefkosia-private-water-network",
  "eoa-larnaka-private-water-network",
  "eoa-ammochostos-private-water-network",
  "eoa-pafos-private-water-network",
]) {
  assert(ids.has(id), `missing source ${id}`);
}

for (const source of snapshot.sources.filter((item) => item.category === "water_network")) {
  assert.equal(source.sensitivity, "critical_infrastructure_private");
  assert.equal(source.access, "AUTHORITY_DATA_AGREEMENT_REQUIRED");
  assert.equal(source.endpoint, null);
  assert.equal(source.productionUse, "private_only_after_authorization");
}

console.log(JSON.stringify({
  marker: "pantavion_cyprus_water_geospatial_sources_audit_v2",
  ok: true,
  totalSources: snapshot.totalSources,
  publicSources: snapshot.publicSources,
  authorizedSources: snapshot.authorizedSources,
  authorityAgreementSources: snapshot.authorityAgreementSources,
  districts: snapshot.districts,
}, null, 2));
