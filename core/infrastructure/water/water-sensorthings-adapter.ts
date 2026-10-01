import type {
  WaterTelemetryMetric,
  WaterTelemetryObservation,
  WaterTelemetryQuality,
} from "./water-telemetry-contract.ts";

export type SensorThingsObservation = {
  "@iot.id": string | number;
  result: number | string | boolean;
  phenomenonTime?: string;
  resultTime?: string;
  Datastream?: { "@iot.id"?: string | number };
};

export type WaterSensorThingsDatastreamBinding = {
  datastreamId:string;
  sensorId:string;
  featureRef?:string;
  metric:WaterTelemetryMetric;
  unit:string;
  sourceSystem:string;
  defaultQuality:WaterTelemetryQuality;
};

export function normalizeSensorThingsObservation(
  observation:SensorThingsObservation,
  binding:WaterSensorThingsDatastreamBinding,
  receivedAt:string,
):WaterTelemetryObservation{
  const actualDatastreamId=observation.Datastream?.["@iot.id"];
  if(actualDatastreamId!==undefined && String(actualDatastreamId)!==binding.datastreamId){
    throw new Error("water_sensorthings_datastream_binding_mismatch");
  }

  const observedAt=observation.phenomenonTime ?? observation.resultTime;
  if(!observedAt || !Number.isFinite(Date.parse(observedAt))){
    throw new Error("water_sensorthings_observation_time_required");
  }
  if(!Number.isFinite(Date.parse(receivedAt))){
    throw new Error("water_sensorthings_received_at_invalid");
  }

  const value=observation.result;
  if(
    (typeof value!=="number" && typeof value!=="string" && typeof value!=="boolean") ||
    (typeof value==="number" && !Number.isFinite(value))
  ){
    throw new Error("water_sensorthings_result_unsupported");
  }

  return {
    observationId:`sensorthings:${binding.sourceSystem}:${String(observation["@iot.id"])}`,
    sensorId:binding.sensorId,
    featureRef:binding.featureRef,
    metric:binding.metric,
    value,
    observedAt,
    receivedAt,
    quality:binding.defaultQuality,
    unit:binding.unit,
    sourceSystem:binding.sourceSystem,
    provenanceRef:`sensorthings:datastream:${binding.datastreamId}:observation:${String(observation["@iot.id"])}`,
  };
}

export const PANTAVION_WATER_SENSORTHINGS_POLICY={
  explicitDatastreamBindingRequired:true,
  metricInferenceFromVendorNamesAllowed:false,
  sourceObservationIdentityPreserved:true,
  authenticNetworkWriteAllowed:false,
} as const;
