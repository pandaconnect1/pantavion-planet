import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path: string) {
  return readFile(new URL("../" + path, import.meta.url), "utf8");
}

async function run() {
  const fresh = await read("infra/postgis/001_pantavion_water_operational_gis.sql");
  const scenarios = await read("infra/postgis/002_pantavion_water_immutable_network_and_scenarios.sql");
  const upgrade = await read("infra/postgis/006_pantavion_water_existing_database_compatibility.sql");

  assert.match(fresh, /network_revision/);
  assert.match(fresh, /workspace_registry/);
  assert.match(fresh, /revision_id text NOT NULL REFERENCES pantavion_water\.network_revision/);
  assert.doesNotMatch(fresh, /map_id text NOT NULL REFERENCES pantavion_water\.map_registry/);

  assert.match(scenarios, /base_revision_id text NOT NULL REFERENCES pantavion_water\.network_revision/);
  assert.doesNotMatch(scenarios, /base_map_id text NOT NULL REFERENCES pantavion_water\.map_registry/);

  assert.match(upgrade, /legacy_map_revision_mapping/);
  assert.match(upgrade, /Never infer A\/B\/C\/D\/E/);
  assert.doesNotMatch(upgrade, /DROP COLUMN|DROP TABLE|TRUNCATE/);

  console.log("water-canonical-revision-schema: ok");
}

run();
