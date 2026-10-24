import assert from "node:assert/strict";
import {
  filterCyprusStreetRecords,
  rowToCyprusStreetRecord,
  type CyprusStreetRegistryRow,
} from "../core/water/cyprus-street-registry-match.ts";

const OBSERVED_AT = "2024-09-18";

function row(overrides: Partial<CyprusStreetRegistryRow> & { id: number }): CyprusStreetRegistryRow {
  return {
    name_el: null,
    name_lat: null,
    district_name: "Lemesos",
    municipality_or_community: "Λεμεσός",
    area_or_parish: null,
    zone_or_section: null,
    postal_codes: ["3000"],
    source: "CYPRUS_POST",
    source_ref: `ref-${overrides.id}`,
    status: "VERIFIED",
    ...overrides,
  };
}

function record(overrides: Partial<CyprusStreetRegistryRow> & { id: number }) {
  const mapped = rowToCyprusStreetRecord(row(overrides), OBSERVED_AT);
  if (!mapped) throw new Error(`record ${overrides.id} must map to a registry record`);
  return mapped;
}

const streets = [
  record({ id: 1, name_el: "Άγιος Τύχωνας", name_lat: "Agios Tychonas" }),
  record({ id: 2, name_el: "Ανεξαρτησίας", name_lat: "Anexartisias" }),
  record({
    id: 3,
    name_el: "Αγίου Τύχωνα",
    name_lat: "Agiou Tychona",
    municipality_or_community: "Ύψωνας",
    area_or_parish: "Ύψωνας",
  }),
  record({ id: 4, name_el: "Οδός Ελευθερίου", name_lat: "Odos Eleftheriou" }),
];

function ids(results: Array<{ streetRegistryId: string }>) {
  return results.map((item) => item.streetRegistryId).sort();
}

// Declension: genitive and nominative forms share a root.
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "Αγίου Τύχωνα" })), ["1", "3"]);
// Word order is free.
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "Τύχωνα Αγίου" })), ["1", "3"]);
// Case is ignored.
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "ΑΓΙΟΥ ΤΥΧΩΝΑ" })), ["1", "3"]);
// Accents are ignored.
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "ανεξαρτησιας" })), ["2"]);
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "ΑΝΕΞΑΡΤΗΣΙΑΣ" })), ["2"]);
// Latin transliteration matches the Latin name field.
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "Anexartisias" })), ["2"]);
// House numbers and the city name never become search roots.
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "Ανεξαρτησίας 25, Λεμεσός" })), ["2"]);
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "Anexartisias 25, Limassol" })), ["2"]);
// Generic road words alone never match every road.
assert.deepEqual(filterCyprusStreetRecords(streets, { query: "Οδός" }), []);
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "Οδός Ελευθερίου" })), ["4"]);
// A locality word narrows the match to that locality.
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "Τύχωνα Ύψωνας" })), ["3"]);
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { municipalityOrCommunity: "Ύψωνας" })), ["3"]);
// A locality-only query lists that locality, but a street-name match always takes precedence.
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "Ύψωνας" })), ["3"]);
assert.deepEqual(ids(filterCyprusStreetRecords(streets, { query: "Ανεξαρτησίας" })), ["2"]);
// A street name that does not exist in the named locality is not returned from elsewhere.
assert.deepEqual(filterCyprusStreetRecords(streets, { query: "Ανεξαρτησίας Ύψωνας" }), []);
// Limits apply after matching and are clamped.
assert.equal(filterCyprusStreetRecords(streets, { query: "Τύχωνα", limit: 1 }).length, 1);
assert.equal(filterCyprusStreetRecords(streets, {}).length, 4, "an empty query lists the registry");
assert.equal(filterCyprusStreetRecords(streets, { limit: 100000 }).length, 4);

// Mapping: unknown source and status fall back to safe values; string postal codes survive.
const mapped = record({
  id: 5,
  name_el: "Ειρήνης",
  source: "UNKNOWN",
  status: "WHATEVER",
  postal_codes: "3031",
});
assert.equal(mapped.streetRegistryId, "5");
assert.equal(mapped.nameEn, null);
assert.equal(mapped.status, "NEW_CANDIDATE");
assert.deepEqual(mapped.postalCodes, ["3031"]);
assert.deepEqual(mapped.sourceReferences, [{ source: "CYPRUS_POST", sourceId: "ref-5", observedAt: OBSERVED_AT }]);
assert.equal(rowToCyprusStreetRecord(row({ id: 9 }), OBSERVED_AT), null, "a row without any name is never a street");

console.log("Cyprus street registry matcher: PASS");
