import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "infra/postgis/006_pantavion_water_existing_database_compatibility.sql",
  "utf8",
);

test("legacy compatibility never mutates authentic network_feature rows", () => {
  assert.doesNotMatch(migration, /UPDATE\s+pantavion_water\.network_feature\b/i);
  assert.doesNotMatch(migration, /DELETE\s+FROM\s+pantavion_water\.network_feature\b/i);
  assert.match(migration, /legacy_map_revision_mapping/i);
});
