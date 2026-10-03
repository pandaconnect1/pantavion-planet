export type WaterValveObservedState =
  | "OPEN"
  | "CLOSED"
  | "PARTIALLY_OPEN"
  | "UNKNOWN";

export type WaterValveFieldAction = "CONFIRM_OPEN" | "CONFIRM_CLOSED" | "CONFIRM_PARTIAL";

export type WaterValvePositionEvidence = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
};

export type WaterValveFieldConfirmation = {
  confirmationId: string;
  networkRevisionId: string;
  valveFeatureId: string;
  action: WaterValveFieldAction;
  observedState: WaterValveObservedState;
  confirmedByActorId: string;
  confirmedAt: string;
  position: WaterValvePositionEvidence | null;
  faultFeatureId: string | null;
  workOrderId: string | null;
  evidenceRefs: string[];
  note: string | null;
  source: "FIELD_CONFIRMATION";
};

export type WaterValveStateSnapshot = {
  networkRevisionId: string;
  valveFeatureId: string;
  observedState: WaterValveObservedState;
  lastConfirmationId: string | null;
  lastConfirmedAt: string | null;
  source: "FIELD_CONFIRMATION" | "NO_CONFIRMED_OBSERVATION";
};

function expectedStateForAction(action: WaterValveFieldAction): WaterValveObservedState {
  if (action === "CONFIRM_OPEN") return "OPEN";
  if (action === "CONFIRM_CLOSED") return "CLOSED";
  return "PARTIALLY_OPEN";
}

export function validateWaterValveFieldConfirmation(
  confirmation: WaterValveFieldConfirmation,
): void {
  if (!confirmation.confirmationId.trim()) throw new Error("water_valve_confirmation_id_required");
  if (!confirmation.networkRevisionId.trim()) throw new Error("water_valve_revision_required");
  if (!confirmation.valveFeatureId.trim()) throw new Error("water_valve_feature_required");
  if (!confirmation.confirmedByActorId.trim()) throw new Error("water_valve_actor_required");
  if (!confirmation.confirmedAt.trim() || Number.isNaN(Date.parse(confirmation.confirmedAt))) {
    throw new Error("water_valve_confirmation_time_invalid");
  }
  if (confirmation.source !== "FIELD_CONFIRMATION") {
    throw new Error("water_valve_field_source_required");
  }
  if (confirmation.observedState !== expectedStateForAction(confirmation.action)) {
    throw new Error("water_valve_action_state_mismatch");
  }
  if (confirmation.position) {
    const { latitude, longitude, accuracyMeters } = confirmation.position;
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error("water_valve_position_invalid");
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error("water_valve_position_invalid");
    }
    if (accuracyMeters !== null && (!Number.isFinite(accuracyMeters) || accuracyMeters < 0)) {
      throw new Error("water_valve_position_accuracy_invalid");
    }
  }
}

export function deriveWaterValveState(
  networkRevisionId: string,
  valveFeatureId: string,
  confirmations: readonly WaterValveFieldConfirmation[],
): WaterValveStateSnapshot {
  const matching = confirmations
    .filter(
      (item) =>
        item.networkRevisionId === networkRevisionId &&
        item.valveFeatureId === valveFeatureId,
    )
    .map((item) => {
      validateWaterValveFieldConfirmation(item);
      return item;
    })
    .sort(
      (a, b) =>
        Date.parse(b.confirmedAt) - Date.parse(a.confirmedAt) ||
        b.confirmationId.localeCompare(a.confirmationId),
    );

  const latest = matching[0];
  if (!latest) {
    return {
      networkRevisionId,
      valveFeatureId,
      observedState: "UNKNOWN",
      lastConfirmationId: null,
      lastConfirmedAt: null,
      source: "NO_CONFIRMED_OBSERVATION",
    };
  }

  return {
    networkRevisionId,
    valveFeatureId,
    observedState: latest.observedState,
    lastConfirmationId: latest.confirmationId,
    lastConfirmedAt: latest.confirmedAt,
    source: "FIELD_CONFIRMATION",
  };
}
