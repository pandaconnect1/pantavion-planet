import assert from "node:assert/strict";
import { checkWaterPostgisHealth } from "../core/infrastructure/water/water-postgis-health";

async function run() {
  assert.deepEqual(await checkWaterPostgisHealth(null), {
    ok: false,
    status: "UNAVAILABLE",
    schemaAvailable: false,
    topologyAvailable: false,
    reason: "water_postgis_executor_unavailable",
  });

  const ready = await checkWaterPostgisHealth({
    async query() {
      return { rows: [{ schema_available: true, topology_available: true }] };
    },
  });
  assert.equal(ready.ok, true);
  assert.equal(ready.status, "READY");

  const schemaMissing = await checkWaterPostgisHealth({
    async query() {
      return { rows: [{ schema_available: false, topology_available: false }] };
    },
  });
  assert.equal(schemaMissing.ok, false);
  assert.equal(schemaMissing.status, "SCHEMA_MISSING");

  const topologyMissing = await checkWaterPostgisHealth({
    async query() {
      return { rows: [{ schema_available: true, topology_available: false }] };
    },
  });
  assert.equal(topologyMissing.ok, false);
  assert.equal(topologyMissing.status, "TOPOLOGY_MISSING");

  const failed = await checkWaterPostgisHealth({
    async query() {
      throw new Error("database unavailable");
    },
  });
  assert.equal(failed.ok, false);
  assert.equal(failed.status, "UNAVAILABLE");

  console.log("water-postgis-health: ok");
}

run();
