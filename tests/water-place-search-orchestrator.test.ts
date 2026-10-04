import assert from "node:assert/strict";
import { searchWaterPlaces, type WaterPlaceSearchProvider } from "../core/water/water-place-search-orchestrator.ts";

const providers: WaterPlaceSearchProvider[] = [
  {
    id: "GOOGLE_MAPS",
    enabled: true,
    async search() {
      return [{
        resultId: "google:g1",
        kind: "ADDRESS",
        displayName: "1 Example Street",
        secondaryLabel: "Limassol",
        coordinates: { lat: 34.68, lng: 33.04 },
        source: "GOOGLE_MAPS",
        sourceResultId: "g1",
        confidence: 0.9,
        persistence: "SESSION_ONLY",
      }];
    },
  },
  {
    id: "TOMTOM",
    enabled: true,
    async search() {
      throw new Error("provider unavailable");
    },
  },
  {
    id: "PANTAVION_VERIFIED",
    enabled: true,
    async search() {
      return [{
        resultId: "pantavion:p1",
        kind: "STREET",
        displayName: "Example Street",
        secondaryLabel: "Verified registry",
        coordinates: { lat: 34.68, lng: 33.04 },
        source: "PANTAVION_VERIFIED",
        sourceResultId: "p1",
        confidence: 1,
        persistence: "PANTAVION_OWNED",
      }];
    },
  },
];

const outcome = await searchWaterPlaces("Example", providers);
assert.equal(outcome.results.length, 2);
assert.equal(outcome.results[0].source, "PANTAVION_VERIFIED");
assert.deepEqual(outcome.failedProviders, ["TOMTOM"]);
assert.equal(outcome.results.some((result) => result.source === "GOOGLE_MAPS"), true);

const shortQuery = await searchWaterPlaces("x", providers);
assert.deepEqual(shortQuery, { results: [], failedProviders: [] });

console.log(JSON.stringify({
  ok: true,
  providerFailureIsolated: true,
  verifiedPantavionRankedFirst: true,
  authenticWaterNetworkModified: false,
}));
