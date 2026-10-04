import type {
  WaterValveFieldConfirmation,
  WaterValveStateSnapshot,
} from "./water-valve-field-state";
import {
  deriveWaterValveState,
  validateWaterValveFieldConfirmation,
} from "./water-valve-field-state";

export interface WaterValveFieldEventStore {
  appendConfirmation(
    confirmation: WaterValveFieldConfirmation,
  ): Promise<void>;
  listConfirmations(
    networkRevisionId: string,
    valveFeatureId: string,
  ): Promise<WaterValveFieldConfirmation[]>;
}

export async function appendWaterValveFieldConfirmation(
  store: WaterValveFieldEventStore,
  confirmation: WaterValveFieldConfirmation,
): Promise<WaterValveStateSnapshot> {
  validateWaterValveFieldConfirmation(confirmation);
  await store.appendConfirmation(confirmation);
  const history = await store.listConfirmations(
    confirmation.networkRevisionId,
    confirmation.valveFeatureId,
  );
  return deriveWaterValveState(
    confirmation.networkRevisionId,
    confirmation.valveFeatureId,
    history,
  );
}

export async function readWaterValveFieldState(
  store: WaterValveFieldEventStore,
  networkRevisionId: string,
  valveFeatureId: string,
): Promise<WaterValveStateSnapshot> {
  const history = await store.listConfirmations(networkRevisionId, valveFeatureId);
  return deriveWaterValveState(networkRevisionId, valveFeatureId, history);
}
