export type WaterMaterialCategory =
  | "PIPE" | "ELBOW" | "NIPPLE" | "BALL_VALVE" | "ADAPTOR"
  | "TEE" | "CONNECTOR" | "SOCKET" | "BUSH" | "CROSS"
  | "CLAMP" | "SADDLE" | "PLUG" | "OTHER";

export type WaterMaterialCatalogItem = {
  id: string;
  category: WaterMaterialCategory;
  serviceLabel: string;
  material: "STEEL" | "POLYETHYLENE" | "POLY" | "STAINLESS_STEEL" | "UPVC" | "OTHER";
  nominalSize?: string;
  metricSizeMm?: number;
  secondarySize?: string;
  angleDeg?: number;
  connection?: "FEMALE_FEMALE" | "MALE_FEMALE" | "PP_PP" | "FEMALE" | "MALE" | "OTHER";
  unit: "PCS" | "M" | "ROLL" | "SET";
  source: "FIELD_SERVICE_LIST";
  verification: "SAMPLE_VERIFIED" | "PENDING_REVIEW";
};

export const WATER_MATERIAL_SAMPLE_CATALOG: readonly WaterMaterialCatalogItem[] = [
  { id:"steel-pipe-15-1-2", category:"PIPE", serviceLabel:"ST/STEEL PIPES 15MM-1/2", material:"STEEL", nominalSize:"1/2\"", metricSizeMm:15, unit:"M", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"steel-elbow-1-2", category:"ELBOW", serviceLabel:"ST/STEEL ELBOWS 1/2", material:"STEEL", nominalSize:"1/2\"", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"steel-nipple-1-2", category:"NIPPLE", serviceLabel:"ST/STEEL NIPPLES 1/2", material:"STEEL", nominalSize:"1/2\"", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"ball-valve-1-2-ff", category:"BALL_VALVE", serviceLabel:"BALL VALVES 1/2 FEMALE/FEMALE", material:"OTHER", nominalSize:"1/2\"", connection:"FEMALE_FEMALE", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"ball-valve-1-2-mf", category:"BALL_VALVE", serviceLabel:"BALL VALVES 1/2 MALE/FEMALE", material:"OTHER", nominalSize:"1/2\"", connection:"MALE_FEMALE", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"poly-bend-1-2-90-pp", category:"ELBOW", serviceLabel:"POLY BENDS 1/2 - 90 PP-PP", material:"POLY", nominalSize:"1/2\"", angleDeg:90, connection:"PP_PP", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"polyethylene-pipe-20-1-2", category:"PIPE", serviceLabel:"POLYTHENE PIPES 20MM-1/2", material:"POLYETHYLENE", nominalSize:"1/2\"", metricSizeMm:20, unit:"M", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"steel-pipe-25-1", category:"PIPE", serviceLabel:"ST/STEEL PIPES 25MM-1", material:"STEEL", nominalSize:"1\"", metricSizeMm:25, unit:"M", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"polyethylene-pipe-32-1", category:"PIPE", serviceLabel:"POLYTHENE PIPES 32MM-1", material:"POLYETHYLENE", nominalSize:"1\"", metricSizeMm:32, unit:"M", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"steel-tee-1", category:"TEE", serviceLabel:"ST/STEEL TEES 1", material:"STEEL", nominalSize:"1\"", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"steel-cross-1", category:"CROSS", serviceLabel:"ST/STEEL CROSSES 1", material:"STEEL", nominalSize:"1\"", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"steel-plug-1", category:"PLUG", serviceLabel:"ST/STEEL PLUGS 1", material:"STEEL", nominalSize:"1\"", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
] as const;
