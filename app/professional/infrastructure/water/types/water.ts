/** Shared types for the Pantavion Water network module. */

/** A JSON-serialisable value — use instead of `any` for open-ended payloads. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** A water network asset (valve, hydrant, tank, air valve, pipe). */
export interface WaterAsset {
  number: string;
  street: string;
  area_code: string;
  area_name?: string;
  kind: string;
  name?: string;
  dn?: string | null;
  origin?: string;
  status?: string;
  latitude?: number | string;
  longitude?: number | string;
}

/** Payload carried by a cross-map sync event. */
export interface WaterSyncPayload {
  latitude?: number;
  longitude?: number;
  street?: string;
  kind?: string;
  area_code?: string;
  [key: string]: JsonValue | undefined;
}

/** A single sync event broadcast between maps A, B and D. */
export interface WaterSyncMessage {
  type: 'update' | 'delete' | 'create';
  sourceMap: 'A' | 'B' | 'D';
  assetNumber: string;
  data: WaterSyncPayload;
  timestamp: number;
}

/** A GeoJSON point feature as produced by the mock/export pipeline. */
export interface WaterGeoFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    number: string;
    street: string;
    area_code: string;
    area_name?: string;
    kind: string;
    name?: string;
    dn?: string | null;
    origin?: string;
    status?: string;
  };
}
