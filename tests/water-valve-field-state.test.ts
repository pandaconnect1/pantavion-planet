import assert from "node:assert/strict";
import {
  deriveWaterValveState,
  validateWaterValveFieldConfirmation,
  type WaterValveFieldConfirmation,
} from "../core/infrastructure/water/water-valve-field-state.ts";

const closed: WaterValveFieldConfirmation = {
  confirmationId: "confirm-1",
  networkRevisionId: "revision-1",
  valveFeatureId: "valve-12",
  action: "CONFIRM_CLOSED",
  observedState: "CLOSED",
  confirmedByActorId: "technician-1",
  confirmedAt: "2026-10-03T14:00:00Z",
  position: {
    latitude: 34.68,
    longitude: 33.04,
    accuracyMeters: 6,
    capturedAt: "2026-10-03T13:59:58Z",
  },
  faultFeatureId: "fault-1",
  workOrderId: "work-1",
  evidenceRefs: ["evidence-1"],
  note: "Field closure confirmed",
  source: "FIELD_CONFIRMATION",
};

const opened: WaterValveFieldConfirmation = {
  ...closed,
  confirmationId: "confirm-2",
  action: "CONFIRM_OPEN",
  observedState: "OPEN",
  confirmedAt: "2026-10-03T15:00:00Z",
  note: "Service restored",
};

validateWaterValveFieldConfirmation(closed);
validateWaterValveFieldConfirmation(opened);

const unknown = deriveWaterValveState("revision-1", "valve-12", []);
assert.equal(unknown.observedState, "UNKNOWN");
assert.equal(unknown.source, "NO_CONFIRMED_OBSERVATION");

const afterClosure = deriveWaterValveState("revision-1", "valve-12", [closed]);
assert.equal(afterClosure.observedState, "CLOSED");

const afterRestore = deriveWaterValveState("revision-1", "valve-12", [closed, opened]);
assert.equal(afterRestore.observedState, "OPEN");
assert.equal(afterRestore.lastConfirmationId, "confirm-2");

assert.throws(
  () =>
    validateWaterValveFieldConfirmation({
      ...closed,
      action: "CONFIRM_OPEN",
      observedState: "CLOSED",
    }),
  /water_valve_action_state_mismatch/,
);

console.log(JSON.stringify({
  ok: true,
  simulationCannotSetObservedValveState: true,
  appendOnlyFieldHistoryExpected: true,
  unknownUntilConfirmed: true,
}));
