import type { WaterFieldWorkRecord } from "./water-field-work-record";

export type WaterFieldWorkSaveResult = {
  recordId: string;
  persisted: boolean;
  provider: "PANTAVION_POSTGRES" | "LEGACY_ADAPTER" | "NONE";
};

export interface WaterFieldWorkRepository {
  readonly provider: WaterFieldWorkSaveResult["provider"];
  readonly ready: boolean;
  save(record: WaterFieldWorkRecord): Promise<WaterFieldWorkSaveResult>;
}

/**
 * Fail-closed default. Domain/UI code depends on this boundary, never directly
 * on Supabase, Vercel Blob, or another replaceable storage provider.
 */
export class UnconfiguredWaterFieldWorkRepository implements WaterFieldWorkRepository {
  readonly provider = "NONE" as const;
  readonly ready = false;

  async save(_record: WaterFieldWorkRecord): Promise<WaterFieldWorkSaveResult> {
    throw new Error("water_field_work_repository_not_configured");
  }
}
