import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { waterRegisterNumberCandidates, waterRegisterAlternateStreetOrder } from "../core/infrastructure/water/water-register-search.ts";

for (const input of ["224 75","224 V75","224-V0075","224/v75","224 - V 75"]) {
  assert.deepEqual(waterRegisterNumberCandidates(input), ["224-V0075"], input);
}
assert.deepEqual(waterRegisterNumberCandidates("000 1"), ["000-V0001"]);
assert.deepEqual(waterRegisterNumberCandidates("224-AV19"), ["224-AV0019"]);
for (const input of ["", "hello", "zzzz", "224", "224 123456", "224@V75"]) {
  assert.deepEqual(waterRegisterNumberCandidates(input), [], input);
}
assert.equal(waterRegisterAlternateStreetOrder("SPYROU KYPRIANOU"), "KYPRIANOU SPYROU");
assert.equal(waterRegisterAlternateStreetOrder("ΚΥΠΡΙΑΝΟΥ ΣΠΥΡΟΥ"), "ΣΠΥΡΟΥ ΚΥΠΡΙΑΝΟΥ");
assert.equal(waterRegisterAlternateStreetOrder("AMATHOUNTOS"), null);
const waterRoute = readFileSync("app/api/professional/infrastructure/water/register/route.ts", "utf8");
assert.match(waterRoute, /authorizeWaterMapRequest\(request\)/);
assert.match(waterRoute, /waterRegisterNumberCandidates\(q\)/);
assert.match(waterRoute, /number\.eq\./);
assert.match(waterRoute, /waterRegisterAlternateStreetOrder\(spelling\)/);
const social = readFileSync("app/api/social/health/route.ts", "utf8");
assert.match(social, /return \{ id, label, ready: false, diagnostic: "auth_required" \}/);
assert.match(social, /schemaAccessVerified/);
assert.match(social, /endToEndVerified: false/);
console.log("Water register lookup and Social diagnostic truth: PASS");
