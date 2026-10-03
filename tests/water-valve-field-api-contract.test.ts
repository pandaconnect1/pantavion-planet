import assert from "node:assert/strict";
import {
  executeReadWaterValveFieldState,
  executeWaterValveFieldConfirmation,
} from "../core/infrastructure/water/water-valve-field-api-contract.ts";
import type { WaterValveFieldEventStore } from "../core/infrastructure/water/water-valve-field-event-store.ts";
import type { WaterValveFieldConfirmation } from "../core/infrastructure/water/water-valve-field-state.ts";

const events: WaterValveFieldConfirmation[] = [];
const store: WaterValveFieldEventStore = {
  async appendConfirmation(confirmation) {
    if (events.some((item) => item.confirmationId === confirmation.confirmationId)) {
      throw new Error("duplicate_confirmation");
    }
    events.push(structuredClone(confirmation));
  },
  async listConfirmations(revisionId, valveFeatureId) {
    return events.filter(
      (item) =>
        item.networkRevisionId === revisionId &&
        item.valveFeatureId === valveFeatureId,
    );
  },
};

const base: WaterValveFieldConfirmation = {
  confirmationId: "event-1",
  networkRevisionId: "revision-1",
  valveFeatureId: "valve-12",
  action: "CONFIRM_CLOSED",
  observedState: "CLOSED",
  confirmedByActorId: "technician-1",
  confirmedAt: "2026-10-03T14:00:00Z",
  position: null,
  faultFeatureId: "fault-1",
  workOrderId: "work-1",
  evidenceRefs: [],
  note: null,
  source: "FIELD_CONFIRMATION",
};

assert.deepEqual(
  await executeReadWaterValveFieldState(null, "revision-1", "valve-12"),
  { ok: false, error: "field_store_unavailable" },
);

const closed = await executeWaterValveFieldConfirmation(store, base);
assert.equal(closed.ok, true);
if (closed.ok) assert.equal(closed.state.observedState, "CLOSED");

const opened = await executeWaterValveFieldConfirmation(store, {
  ...base,
  confirmationId: "event-2",
  action: "CONFIRM_OPEN",
  observedState: "OPEN",
  confirmedAt: "2026-10-03T15:00:00Z",
});
assert.equal(opened.ok, true);
if (opened.ok) assert.equal(opened.state.observedState, "OPEN");

assert.equal(events.length, 2);
assert.equal(events[0]?.observedState, "CLOSED");
assert.equal(events[1]?.observedState, "OPEN");

console.log(JSON.stringify({
  ok: true,
  appendOnlyHistoryPreserved: true,
  failClosedWithoutPersistence: true,
}));
