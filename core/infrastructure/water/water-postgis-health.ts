import type { WaterSqlExecutor } from "./water-postgis-topology-provider";

export type WaterPostgisHealth =
  | {
      ok: true;
      status: "READY";
      schemaAvailable: true;
      topologyAvailable: true;
    }
  | {
      ok: false;
      status: "UNAVAILABLE" | "SCHEMA_MISSING" | "TOPOLOGY_MISSING";
      schemaAvailable: boolean;
      topologyAvailable: boolean;
      reason: string;
    };

/**
 * Server-side readiness probe for the Pantavion Water PostGIS core.
 * It never returns connection strings or database credentials.
 * Critical Water operations must fail closed when this probe is not READY.
 */
export async function checkWaterPostgisHealth(
  sql: WaterSqlExecutor | null,
): Promise<WaterPostgisHealth> {
  if (!sql) {
    return {
      ok: false,
      status: "UNAVAILABLE",
      schemaAvailable: false,
      topologyAvailable: false,
      reason: "water_postgis_executor_unavailable",
    };
  }

  try {
    const result = await sql.query<{
      schema_available: boolean;
      topology_available: boolean;
    }>(`
      select
        (to_regnamespace('pantavion_water') is not null) as schema_available,
        (
          to_regprocedure(
            'pantavion_water.trace_connected_network(uuid,uuid[],uuid[])'
          ) is not null
        ) as topology_available
    `);

    const row = result.rows[0];
    const schemaAvailable = row?.schema_available === true;
    const topologyAvailable = row?.topology_available === true;

    if (!schemaAvailable) {
      return {
        ok: false,
        status: "SCHEMA_MISSING",
        schemaAvailable: false,
        topologyAvailable: false,
        reason: "pantavion_water_schema_missing",
      };
    }

    if (!topologyAvailable) {
      return {
        ok: false,
        status: "TOPOLOGY_MISSING",
        schemaAvailable: true,
        topologyAvailable: false,
        reason: "water_topology_trace_missing",
      };
    }

    return {
      ok: true,
      status: "READY",
      schemaAvailable: true,
      topologyAvailable: true,
    };
  } catch {
    return {
      ok: false,
      status: "UNAVAILABLE",
      schemaAvailable: false,
      topologyAvailable: false,
      reason: "water_postgis_health_query_failed",
    };
  }
}
