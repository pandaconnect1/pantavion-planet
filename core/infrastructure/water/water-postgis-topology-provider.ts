import type { WaterTraceRequest, WaterTraceResult } from "./water-topology-graph-contract";
import type { WaterTopologyProvider } from "./water-topology-provider";

export type WaterSqlQueryResult<Row extends Record<string, unknown> = Record<string, unknown>> = {
  rows: Row[];
};

export interface WaterSqlExecutor {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<WaterSqlQueryResult<Row>>;
}

/**
 * Provider-neutral PostGIS topology adapter.
 * The SQL executor is injected by server-only runtime code; this module never reads
 * credentials and can therefore be tested without coupling Water to a hosting vendor.
 */
export class PostgisWaterTopologyProvider implements WaterTopologyProvider {
  constructor(private readonly sql: WaterSqlExecutor) {}

  async traceConnectedNetwork(request: WaterTraceRequest): Promise<WaterTraceResult> {
    const result = await this.sql.query<{
      node_id: string;
      feature_id: string | null;
    }>(
      `select node_id::text, feature_id::text
         from pantavion_water.trace_connected_network($1::uuid,$2::uuid[],$3::uuid[])`,
      [
        request.networkRevisionId,
        request.startNodeIds,
        request.blockedFeatureIds ?? [],
      ],
    );

    const visitedNodeIds = new Set<string>();
    const visitedFeatureIds = new Set<string>();
    for (const row of result.rows) {
      if (row.node_id) visitedNodeIds.add(row.node_id);
      if (row.feature_id) visitedFeatureIds.add(row.feature_id);
    }

    return {
      networkRevisionId: request.networkRevisionId,
      visitedNodeIds: [...visitedNodeIds].sort(),
      visitedFeatureIds: [...visitedFeatureIds].sort(),
      reachedReservoirOrTankIds: [],
      unresolvedConnectivityRefs: [],
      complete: true,
    };
  }

  async listRevisionFeatureIds(networkRevisionId: string): Promise<string[]> {
    const result = await this.sql.query<{ feature_id: string }>(
      `select feature_id::text
         from pantavion_water.network_feature
        where revision_id=$1::uuid
        order by feature_id`,
      [networkRevisionId],
    );
    return result.rows.map((row) => row.feature_id);
  }
}
