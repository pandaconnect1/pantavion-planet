import "server-only";

import { randomUUID } from "node:crypto";
import type { WaterSqlExecutor } from "./water-postgis-topology-provider";
import type {
  WaterFieldWorkRepository,
  WaterFieldWorkSaveResult,
  WaterFieldWorkWriteContext,
} from "@/core/water/water-field-work-repository";
import type { WaterFieldWorkRecord } from "@/core/water/water-field-work-record";

export class PantavionPostgresWaterFieldWorkRepository implements WaterFieldWorkRepository {
  readonly provider = "PANTAVION_POSTGRES" as const;
  readonly ready = true;

  constructor(private readonly sql: WaterSqlExecutor) {}

  async save(
    record: WaterFieldWorkRecord,
    context: WaterFieldWorkWriteContext,
  ): Promise<WaterFieldWorkSaveResult> {
    const actorRef = context.actorRef.trim();
    if (!actorRef) throw new Error("water_field_work_actor_required");

    const eventId = randomUUID();
    await this.sql.query(
      `INSERT INTO pantavion_water.field_work_event (
        event_id, work_order_id, stage, street_registry_id, target_feature_id,
        fault_ref, payload, evidence_refs, captured_at, actor_ref
      ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::timestamptz,$10)`,
      [
        eventId,
        record.workOrderId,
        record.stage,
        record.streetRegistryId ?? null,
        record.targetFeatureId ?? null,
        record.faultRef ?? null,
        JSON.stringify(record),
        JSON.stringify(record.evidenceRefs),
        record.capturedAt,
        actorRef,
      ],
    );
    return { recordId:eventId, persisted:true, provider:this.provider };
  }
}
