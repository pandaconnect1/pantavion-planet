import assert from "node:assert/strict";
import {
  PANTAVION_MAP_ENGINE_FOUNDATION,
} from "../core/infrastructure/water/pantavion-map-engine-foundation.ts";

const foundation = PANTAVION_MAP_ENGINE_FOUNDATION;

assert.equal(foundation.sameBaseMapForABC, true);
assert.equal(foundation.viewer, "maplibre-gl");
assert.equal(foundation.baseMap.paidProviderAccountRequired, false);
assert.equal(foundation.baseMap.selfHostedProductionRequired, true);

for (const capability of [
  "buildings",
  "house_numbers",
  "streets",
  "street_names",
  "poi",
  "search",
  "gps",
]) {
  assert.ok(
    foundation.baseMap.requiredCapabilities.includes(
      capability as (typeof foundation.baseMap.requiredCapabilities)[number],
    ),
  );
}

for (const surface of ["A", "B", "C"] as const) {
  assert.ok(foundation.surfaces[surface].overlays.includes("water_network"));
}

assert.ok(foundation.surfaces.B.overlays.includes("dwg_reference"));
assert.ok(foundation.surfaces.C.overlays.includes("hydraulic_scenarios"));
assert.equal(foundation.invariants.waterGeometryNeverMutatedByBaseMap, true);
assert.equal(foundation.invariants.rawDwgNeverExposedToBrowser, true);

console.log("Pantavion shared A/B/C map-engine foundation: PASS");
