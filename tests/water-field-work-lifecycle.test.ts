import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { excavationVolumeM3, WATER_FIELD_WORK_LIFECYCLE } from "../core/water/water-field-work-record";

async function run() {
  assert.deepEqual(WATER_FIELD_WORK_LIFECYCLE,[
    "FAULT","LOCATE","SITE_SAFETY","EXCAVATION","NETWORK_REPAIR","TEST","BACKFILL","SURFACE_RESTORATION","CLOSURE",
  ]);
  assert.equal(excavationVolumeM3({
    workOrderId:"WO-1",stage:"EXCAVATION",crew:[],location:{},
    excavation:{lengthM:4,widthM:1.5,depthM:1.2},materials:[],labor:[],evidenceRefs:[],notes:[],capturedAt:new Date(0).toISOString(),
  }),7.2);
  const sql=await readFile(new URL("../infra/postgis/007_pantavion_water_field_work_ledger.sql",import.meta.url),"utf8");
  assert.match(sql,/append-only/i);
  assert.match(sql,/BEFORE UPDATE OR DELETE/);
  assert.match(sql,/Does not directly mutate canonical water-network truth/);
  console.log("water-field-work-lifecycle: ok");
}
run();
