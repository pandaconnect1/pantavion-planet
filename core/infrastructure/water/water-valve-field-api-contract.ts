import type {
  WaterValveFieldConfirmation,
  WaterValveStateSnapshot,
} from "./water-valve-field-state";
import type { WaterValveFieldEventStore } from "./water-valve-field-event-store";
import {
  appendWaterValveFieldConfirmation,
  readWaterValveFieldState,
} from "./water-valve-field-event-store";

export type WaterValveFieldApiResult =
  | { ok: true; state: WaterValveStateSnapshot }
  | {
      ok: false;
      error:
        | "field_store_unavailable"
        | "invalid_confirmation"
        | "field_confirmation_failed";
    };

export async function executeWaterValveFieldConfirmation(
  store: WaterValveFieldEventStore | null,
  confirmation: WaterValveFieldConfirmation,
): Promise<WaterValveFieldApiResult> {
  if (!store) return { ok: false, error: "field_store_unavailable" };

  try {
    const state = await appendWaterValveFieldConfirmation(store, confirmation);
    return { ok: true, state };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("water_valve_")) {
      return { ok: false, error: "invalid_confirmation" };
    }
    return { ok: false, error: "field_confirmation_failed" };
  }
}

export async function executeReadWaterValveFieldState(
  store: WaterValveFieldEventStore | null,
  networkRevisionId: string,
  valveFeatureId: string,
): Promise<WaterValveFieldApiResult> {
  if (!store) return { ok: false, error: "field_store_unavailable" };

  try {
    const state = await readWaterValveFieldState(
      store,
      networkRevisionId,
      valveFeatureId,
    );
    return { ok: true, state };
  } catch {
    return { ok: false, error: "field_confirmation_failed" };
  }
}
