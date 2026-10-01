export type WaterTelemetryMetric =
  | "PRESSURE_BAR"
  | "PRESSURE_HEAD_M"
  | "FLOW_LPS"
  | "TANK_LEVEL_M"
  | "PUMP_SPEED_RATIO"
  | "PUMP_STATUS"
  | "VALVE_STATUS"
  | "RESIDUAL_CHLORINE_MG_L"
  | "TURBIDITY_NTU"
  | "TEMPERATURE_C";

export type WaterTelemetryQuality =
  | "VALIDATED"
  | "RAW"
  | "SUSPECT"
  | "BAD"
  | "MISSING";

export type WaterTelemetryObservation = {
  observationId:string;
  sensorId:string;
  featureRef?:string;
  metric:WaterTelemetryMetric;
  value:number | string | boolean;
  observedAt:string;
  receivedAt:string;
  quality:WaterTelemetryQuality;
  unit:string;
  sourceSystem:string;
  provenanceRef:string;
};

export const PANTAVION_WATER_TELEMETRY_POLICY = {
  authenticNetworkWriteAllowed:false,
  observationsAppendOnly:true,
  originalTimestampRequired:true,
  receivedTimestampRequired:true,
  sourceSystemRequired:true,
  provenanceRequired:true,
  qualityFlagRequired:true,
  badOrMissingObservationMayNotCalibrateModel:true,
  validatedTelemetryOutranksGenericEngineeringAssumption:true,
  standardInterface:"OGC_SENSORTHINGS_COMPATIBLE",
} as const;

export function validateWaterTelemetryObservation(o:WaterTelemetryObservation){
  const errors:string[]=[];
  if(!o.observationId) errors.push("observation_id_required");
  if(!o.sensorId) errors.push("sensor_id_required");
  if(!o.sourceSystem) errors.push("source_system_required");
  if(!o.provenanceRef) errors.push("provenance_required");
  if(!Number.isFinite(Date.parse(o.observedAt))) errors.push("observed_at_invalid");
  if(!Number.isFinite(Date.parse(o.receivedAt))) errors.push("received_at_invalid");
  if(typeof o.value==="number" && !Number.isFinite(o.value)) errors.push("value_invalid");
  return {ok:errors.length===0,errors};
}
