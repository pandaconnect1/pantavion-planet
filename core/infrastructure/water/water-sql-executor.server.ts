import "server-only";

import type { WaterSqlExecutor } from "./water-postgis-topology-provider";

export type WaterSqlExecutorFactory = () => WaterSqlExecutor | null;

/**
 * Runtime boundary for Pantavion Water SQL.
 *
 * Deliberately returns null until a verified server-side PostgreSQL driver is
 * installed and wired. Callers must fail closed via checkWaterPostgisHealth().
 * No hosting vendor, credentials, or browser-visible configuration belongs here.
 */
export const createWaterSqlExecutor: WaterSqlExecutorFactory = () => null;
