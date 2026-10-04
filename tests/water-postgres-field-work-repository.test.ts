import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function run() {
  const source=await readFile(new URL("../core/infrastructure/water/water-postgres-field-work-repository.ts",import.meta.url),"utf8");
  assert.match(source,/import "server-only"/);
  assert.match(source,/INSERT INTO pantavion_water\.field_work_event/);
  assert.doesNotMatch(source,/UPDATE\s+pantavion_water\.field_work_event/i);
  assert.doesNotMatch(source,/DELETE\s+FROM\s+pantavion_water\.field_work_event/i);
  assert.doesNotMatch(source,/UPDATE\s+pantavion_water\.network_feature/i);
  assert.doesNotMatch(source,/DELETE\s+FROM\s+pantavion_water\.network_feature/i);
  assert.match(source,/context\.actorRef/);
  assert.match(source,/randomUUID/);
  console.log("water-postgres-field-work-repository: ok");
}
run();
