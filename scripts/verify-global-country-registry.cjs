const fs = require("node:fs");
const path = require("node:path");

const file = path.join(process.cwd(), "data/global/countries.iso3166.json");
const countries = JSON.parse(fs.readFileSync(file, "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(countries.length === 249, `expected 249 ISO entries, got ${countries.length}`);
assert(new Set(countries.map((x) => x[0])).size === 249, "alpha2 codes must be unique");
assert(new Set(countries.map((x) => x[1])).size === 249, "alpha3 codes must be unique");
assert(new Set(countries.map((x) => x[2])).size === 249, "numeric codes must be unique");
assert(countries.every((x) => /^[A-Z]{2}$/.test(x[0])), "invalid alpha2 code");
assert(countries.every((x) => /^[A-Z]{3}$/.test(x[1])), "invalid alpha3 code");
assert(countries.every((x) => /^\d{3}$/.test(x[2])), "invalid numeric code");
assert(countries.every((x) => typeof x[3] === "string" && x[3].trim().length > 0), "missing canonical name");

console.log(JSON.stringify({
  ok: true,
  entries: countries.length,
  uniqueAlpha2: 249,
  uniqueAlpha3: 249,
  uniqueNumeric: 249,
  evidenceStatus: "registry-only"
}));
