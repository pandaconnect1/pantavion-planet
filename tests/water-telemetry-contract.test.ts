import assert from "node:assert/strict";
import {
  PANTAVION_WATER_TELEMETRY_POLICY,
  validateWaterTelemetryObservation,
} from "../core/infrastructure/water/water-telemetry-contract.ts";

assert.equal(PANTAVION_WATER_TELEMETRY_POLICY.authenticNetworkWriteAllowed,false);
assert.equal(PANTAVION_WATER_TELEMETRY_POLICY.observationsAppendOnly,true);
assert.equal(PANTAVION_WATER_TELEMETRY_POLICY.badOrMissingObservationMayNotCalibrateModel,true);

const valid=validateWaterTelemetryObservation({
  observationId:"obs-1",
  sensorId:"pressure-1",
  featureRef:"node-1",
  metric:"PRESSURE_BAR",
  value:3.2,
  observedAt:"2026-10-01T10:00:00Z",
  receivedAt:"2026-10-01T10:00:02Z",
  quality:"VALIDATED",
  unit:"bar",
  sourceSystem:"SCADA",
  provenanceRef:"scada:pressure-1:2026-10-01T10:00:00Z",
});
assert.equal(valid.ok,true);

const invalid=validateWaterTelemetryObservation({
  observationId:"obs-2",
  sensorId:"pressure-1",
  metric:"PRESSURE_BAR",
  value:3.2,
  observedAt:"invalid",
  receivedAt:"2026-10-01T10:00:02Z",
  quality:"RAW",
  unit:"bar",
  sourceSystem:"SCADA",
  provenanceRef:"ref",
});
assert.equal(invalid.ok,false);
assert.ok(invalid.errors.includes("observed_at_invalid"));

console.log(JSON.stringify({ok:true,appendOnly:true,validatedTelemetryGate:true}));
