import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function run() {
  const source=await readFile(new URL("../app/api/professional/infrastructure/water/field/work/route.ts",import.meta.url),"utf8");
  assert.match(source,/authorizeWaterMapRequest\(request\)/);
  assert.match(source,/access\.mode !== "admin-session"/);
  assert.match(source,/field_work_write_not_authorized/);
  assert.match(source,/repository\.save\(record, \{ actorRef: access\.actorRef \}\)/);
  assert.match(source,/canonicalNetworkMutated:false/);
  assert.doesNotMatch(source,/UPDATE\s+pantavion_water\.network_feature/i);
  assert.doesNotMatch(source,/DELETE\s+FROM\s+pantavion_water\.network_feature/i);
  console.log("water-field-work-api-contract: ok");
}
run();
