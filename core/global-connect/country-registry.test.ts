import assert from "node:assert/strict";

import {
  GLOBAL_CONNECT_CONTINENTS,
  GLOBAL_CONNECT_COUNTRY_REGISTRY,
  globalConnectCountryRegistryMetrics,
  listGlobalConnectCountries,
  localizedGlobalConnectCountryName,
} from "./country-registry.ts";

const metrics = globalConnectCountryRegistryMetrics();
assert.equal(metrics.total, 249);
assert.equal(metrics.uniqueCodes, 249);
assert.deepEqual(
  metrics.continentCoverage.map((item) => item.continent),
  [...GLOBAL_CONNECT_CONTINENTS],
);
assert.ok(metrics.continentCoverage.every((item) => item.count > 0));
assert.ok(GLOBAL_CONNECT_COUNTRY_REGISTRY.every((record) => record.status === "registry-only"));
assert.ok(GLOBAL_CONNECT_COUNTRY_REGISTRY.every((record) => record.evidence.productionSensitiveFeatures === "blocked"));
assert.ok(GLOBAL_CONNECT_COUNTRY_REGISTRY.every((record) => record.nativeNames.length === 0));

const greekSorted = listGlobalConnectCountries("el");
assert.equal(greekSorted.length, 249);
const greekCollator = new Intl.Collator("el", { sensitivity: "base", usage: "sort" });
for (let index = 1; index < greekSorted.length; index += 1) {
  const previous = localizedGlobalConnectCountryName(greekSorted[index - 1], "el");
  const current = localizedGlobalConnectCountryName(greekSorted[index], "el");
  assert.ok(greekCollator.compare(previous, current) <= 0, `${previous} should sort before ${current}`);
}

console.log("PASS: global-connect 249-country registry");
