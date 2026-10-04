export type WaterMaterialCategory =
  | "PIPE" | "ELBOW" | "NIPPLE" | "BALL_VALVE" | "ADAPTOR"
  | "TEE" | "CONNECTOR" | "SOCKET" | "BUSH" | "CROSS"
  | "CLAMP" | "SADDLE" | "PLUG" | "OTHER";

export type WaterMaterialCatalogItem = {
  id: string;
  category: WaterMaterialCategory;
  serviceLabel: string;
  material: "STEEL" | "POLYETHYLENE" | "POLY" | "STAINLESS_STEEL" | "UPVC" | "AC" | "OTHER";
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
  { id:"redi-clamp-15-22", category:"CLAMP", serviceLabel:"REDI CLAMPS 1/2 15-22MM", material:"OTHER", nominalSize:"1/2\"", secondarySize:"15-22MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"redi-clamp-21-25", category:"CLAMP", serviceLabel:"REDI CLAMPS 1/2 21-25MM", material:"OTHER", nominalSize:"1/2\"", secondarySize:"21-25MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"redi-clamp-26-30", category:"CLAMP", serviceLabel:"REDI CLAMPS 3/4 26-30MM", material:"OTHER", nominalSize:"3/4\"", secondarySize:"26-30MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"redi-clamp-28-35", category:"CLAMP", serviceLabel:"REDI CLAMPS 3/4 28-35MM", material:"OTHER", nominalSize:"3/4\"", secondarySize:"28-35MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"redi-clamp-33-37", category:"CLAMP", serviceLabel:"REDI CLAMPS 1 33-37MM", material:"OTHER", nominalSize:"1\"", secondarySize:"33-37MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"redi-clamp-38-44", category:"CLAMP", serviceLabel:"REDI CLAMPS 1 38-44MM", material:"OTHER", nominalSize:"1\"", secondarySize:"38-44MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"redi-clamp-48-56", category:"CLAMP", serviceLabel:"REDI CLAMPS 1 1/2 48-56MM", material:"OTHER", nominalSize:"1 1/2\"", secondarySize:"48-56MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"redi-clamp-67-74", category:"CLAMP", serviceLabel:"REDI CLAMPS 2 67-74MM", material:"OTHER", nominalSize:"2\"", secondarySize:"67-74MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-pe-63x32", category:"SADDLE", serviceLabel:"SADDLES 63X32MM FOR PE", material:"POLYETHYLENE", secondarySize:"63X32MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-pe-75x32", category:"SADDLE", serviceLabel:"SADDLES 75X32MM FOR PE", material:"POLYETHYLENE", secondarySize:"75X32MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-pe-90x32", category:"SADDLE", serviceLabel:"SADDLES 90X32 FOR PE", material:"POLYETHYLENE", secondarySize:"90X32MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-upvc-110x32", category:"SADDLE", serviceLabel:"SADDLES 110X32MM FOR UPVC", material:"UPVC", secondarySize:"110X32MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-upvc-160x32", category:"SADDLE", serviceLabel:"SADDLES 160X32MM FOR UPVC", material:"UPVC", secondarySize:"160X32MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-ac-100x32", category:"SADDLE", serviceLabel:"SADDLES 100X32MM FOR AC", material:"AC", secondarySize:"100X32MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-ac-100x63", category:"SADDLE", serviceLabel:"SADDLES 100X63MM FOR AC", material:"AC", secondarySize:"100X63MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-ac-150x32", category:"SADDLE", serviceLabel:"SADDLES 150X32MM FOR AC", material:"AC", secondarySize:"150X32MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-ac-150x63", category:"SADDLE", serviceLabel:"SADDLES 150X63MM FOR AC", material:"AC", secondarySize:"150X63MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-upvc-110x63", category:"SADDLE", serviceLabel:"SADDLES 110X63MM FOR UPVC", material:"UPVC", secondarySize:"110X63MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-upvc-160x63", category:"SADDLE", serviceLabel:"SADDLES 160X63MM FOR UPVC", material:"UPVC", secondarySize:"160X63MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-ac-200x32", category:"SADDLE", serviceLabel:"SADDLES 200X32MM FOR AC", material:"AC", secondarySize:"200X32MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-ac-200x63", category:"SADDLE", serviceLabel:"SADDLES 200X63MM FOR AC", material:"AC", secondarySize:"200X63MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-upvc-225x32", category:"SADDLE", serviceLabel:"SADDLES 225X32MM FOR UPVC", material:"UPVC", secondarySize:"225X32MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
  { id:"saddle-upvc-225x63", category:"SADDLE", serviceLabel:"SADDLES 225X63MM FOR UPVC", material:"UPVC", secondarySize:"225X63MM", unit:"PCS", source:"FIELD_SERVICE_LIST", verification:"SAMPLE_VERIFIED" },
] as const;
