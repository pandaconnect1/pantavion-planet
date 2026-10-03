import assert from "node:assert/strict";
import { checkWaterPostgisHealth } from "../core/infrastructure/water/water-postgis-health";
import type { WaterSqlExecutor } from "../core/infrastructure/water/water-postgis-topology-provider";

function healthExecutor(schemaAvailable: boolean, topologyAvailable: boolean): WaterSqlExecutor {
  return {
    async query<Row extends Record<string, unknown>>() {
      return {
        rows: [{ schema_available: schemaAvailable, topology_available: topologyAvailable } as unknown as Row],
      };
    },
  };
}

async function run() {
  assert.deepEqual(await checkWaterPostgisHealth(null), {
    ok: false,
    status: "UNAVAILABLE",
    schemaAvailable: false,
    topologyAvailable: false,
    reason: "water_postgis_executor_unavailable",
  });

  const ready = await checkWaterPostgisHealth(healthExecutor(true, true));
  assert.equal(ready.ok, true);
  assert.equal(ready.status, "READY");

  const schemaMissing = await checkWaterPostgisHealth(healthExecutor(false, false));
  assert.equal(schemaMissing.ok, false);
  assert.equal(schemaMissing.status, "SCHEMA_MISSING");

  const topologyMissing = await checkWaterPostgisHealth(healthExecutor(true, false));
  assert.equal(topologyMissing.ok, false);
  assert.equal(topologyMissing.status, "TOPOLOGY_MISSING");

  const failingExecutor: WaterSqlExecutor = {
    async query<Row extends Record<string, unknown>>() {
      throw new Error("database unavailable");
    },
  };
  const failed = await checkWaterPostgisHealth(failingExecutor);
  assert.equal(failed.ok, false);
  assert.equal(failed.status, "UNAVAILABLE");

  console.log("water-postgis-health: ok");
}

run();
