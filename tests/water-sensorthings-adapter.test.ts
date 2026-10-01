import assert from "node:assert/strict";
import {
  normalizeSensorThingsObservation,
  PANTAVION_WATER_SENSORTHINGS_POLICY,
} from "../core/infrastructure/water/water-sensorthings-adapter.ts";

assert.equal(PANTAVION_WATER_SENSORTHINGS_POLICY.metricInferenceFromVendorNamesAllowed,false);

const o=normalizeSensorThingsObservation({
  "@iot.id":101,
  result:3.4,
  phenomenonTime:"2026-10-01T10:00:00Z",
  Datastream:{"@iot.id":"ds-pressure-1"},
},{
  datastreamId:"ds-pressure-1",
  sensorId:"sensor-pressure-1",
  featureRef:"node-1",
  metric:"PRESSURE_BAR",
  unit:"bar",
  sourceSystem:"SCADA-A",
  defaultQuality:"RAW",
},"2026-10-01T10:00:02Z");

assert.equal(o.metric,"PRESSURE_BAR");
assert.equal(o.value,3.4);
assert.equal(o.sensorId,"sensor-pressure-1");
assert.ok(o.provenanceRef.includes("ds-pressure-1"));

assert.throws(()=>normalizeSensorThingsObservation({
  "@iot.id":102,
  result:2.9,
  phenomenonTime:"2026-10-01T10:01:00Z",
  Datastream:{"@iot.id":"wrong-ds"},
},{
  datastreamId:"ds-pressure-1",
  sensorId:"sensor-pressure-1",
  metric:"PRESSURE_BAR",
  unit:"bar",
  sourceSystem:"SCADA-A",
  defaultQuality:"RAW",
},"2026-10-01T10:01:02Z"),/binding_mismatch/);

console.log(JSON.stringify({ok:true,explicitBinding:true,provenancePreserved:true}));
