import assert from "node:assert/strict";
import fs from "node:fs";

import {
  PANTAVION_RESEARCH_CONTINENTS,
  assessPantavionHumanDemand,
  pantavionGlobalHumanDemandRadar,
} from "../core/research/pantavion-global-human-demand-radar.ts";

const seed = JSON.parse(
  fs.readFileSync(
    new URL("../data/research/global-human-demand-radar/2026-08-29-initial-signals.json", import.meta.url),
    "utf8",
  ),
);

assert.equal(PANTAVION_RESEARCH_CONTINENTS.length, 7);
assert.deepEqual(PANTAVION_RESEARCH_CONTINENTS, [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
]);

assert.equal(pantavionGlobalHumanDemandRadar.doctrine.noDirectProductionMutation, true);
assert.equal(pantavionGlobalHumanDemandRadar.doctrine.countryBeforeEnforcement, true);
assert.equal(pantavionGlobalHumanDemandRadar.doctrine.userNeedBeforeFeatureCopy, true);
assert.equal(pantavionGlobalHumanDemandRadar.doctrine.uncertaintyPreserved, true);

assert.ok(Array.isArray(seed.signals));
assert.ok(seed.signals.length >= 8);

const globalSignals = seed.signals.filter((signal) => signal.segment.scope === "global");
assert.ok(globalSignals.length >= 1);
for (const signal of globalSignals) {
  assert.equal(signal.segment.continent, undefined);
  assert.equal(signal.segment.countries, undefined);
}

const continentalSignals = seed.signals.filter((signal) => signal.segment.scope === "continent");
const represented = new Set(continentalSignals.map((signal) => signal.segment.continent));
for (const continent of PANTAVION_RESEARCH_CONTINENTS) {
  assert.equal(represented.has(continent), true, `missing continent ${continent}`);
}

for (const signal of seed.signals) {
  const assessment = assessPantavionHumanDemand(signal);
  assert.equal(assessment.productionMutationAllowed, false);
  assert.ok(assessment.evidenceScore >= 0 && assessment.evidenceScore <= 100);
  assert.ok(assessment.opportunityScore >= 0 && assessment.opportunityScore <= 100);
  assert.ok(assessment.riskScore >= 0 && assessment.riskScore <= 100);
  assert.ok(assessment.researchActions.some((item) => item.includes("country")));
  assert.ok(assessment.safeguards.some((item) => item.includes("cannot mutate production")));
}

const globalAssessment = assessPantavionHumanDemand(globalSignals[0]);
assert.equal(globalAssessment.requiresCountryValidation, true);

const countryAssessment = assessPantavionHumanDemand({
  ...globalSignals[0],
  id: "country-validation-example",
  segment: { scope: "country", continent: "Europe", countries: ["CY"] },
});
assert.equal(countryAssessment.requiresCountryValidation, false);
assert.equal(countryAssessment.productionMutationAllowed, false);

assert.throws(
  () =>
    assessPantavionHumanDemand({
      ...globalSignals[0],
      id: "invalid-global-geography",
      segment: { scope: "global", continent: "Europe" },
    }),
  /pantavion_demand_global_scope_must_not_fake_geography/,
);

assert.throws(
  () =>
    assessPantavionHumanDemand({
      ...globalSignals[0],
      id: "invalid-country-scope",
      segment: { scope: "country", continent: "Asia" },
    }),
  /pantavion_demand_country_scope_requires_country/,
);

console.log("PANTAVION GLOBAL HUMAN DEMAND RADAR: PASSED");
console.log(`- signals: ${seed.signals.length}`);
console.log(`- continents represented: ${represented.size}/7`);
console.log("- global signals cannot fake continental geography: yes");
console.log("- country validation before enforcement: yes");
console.log("- direct production mutation: no");
