export type WaterFieldWorkStage =
  | "FAULT"
  | "LOCATE"
  | "SITE_SAFETY"
  | "EXCAVATION"
  | "NETWORK_REPAIR"
  | "TEST"
  | "BACKFILL"
  | "SURFACE_RESTORATION"
  | "CLOSURE";

export type WaterFieldWorkRecord = {
  workOrderId: string;
  stage: WaterFieldWorkStage;
  streetRegistryId?: string | null;
  targetFeatureId?: string | null;
  faultRef?: string | null;
  crew: Array<{ actorRef: string; role: "WORKER" | "FIELD_TECHNICIAN" | "CREW_LEAD" }>;
  contractorRef?: string | null;
  location: { lat?: number; lng?: number; gpsAccuracyMeters?: number };
  excavation?: { lengthM?: number; widthM?: number; depthM?: number; surfaceType?: string };
  networkObservation?: { pipeMaterial?: string; diameterMm?: number; depthM?: number };
  materials: Array<{ itemRef: string; description: string; quantity: number; unit: string }>;
  labor: Array<{ actorRef: string; hours: number }>;
  evidenceRefs: string[];
  notes: string[];
  capturedAt: string;
};

export const WATER_FIELD_WORK_LIFECYCLE = [
  "FAULT","LOCATE","SITE_SAFETY","EXCAVATION","NETWORK_REPAIR","TEST","BACKFILL","SURFACE_RESTORATION","CLOSURE",
] as const;

export function excavationVolumeM3(record: WaterFieldWorkRecord) {
  const e=record.excavation;
  if (!e || ![e.lengthM,e.widthM,e.depthM].every((v)=>typeof v==="number" && Number.isFinite(v) && v!>=0)) return null;
  return Number(((e.lengthM as number)*(e.widthM as number)*(e.depthM as number)).toFixed(3));
}
