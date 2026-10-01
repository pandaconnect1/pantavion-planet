import assert from "node:assert/strict";
import { calculatePantavionAuthenticMapAlignment, assertPantavionAuthenticAlignmentSafe } from "../core/water/water-authentic-map-alignment.ts";

for (const mapId of ["A","B","C"] as const) {
  const points=[
    {id:"p1",sourceX:0,sourceY:0,targetEasting:500000,targetNorthing:3800000,provenance:"survey"},
    {id:"p2",sourceX:100,sourceY:0,targetEasting:500100,targetNorthing:3800000,provenance:"survey"},
    {id:"p3",sourceX:0,sourceY:100,targetEasting:500000,targetNorthing:3800100,provenance:"survey"},
  ];
  const a=calculatePantavionAuthenticMapAlignment(mapId,points);
  assert.equal(a.mapId,mapId);
  assert.equal(a.targetCrs,"EPSG:6312");
  assert.equal(a.shearAllowed,false);
  assert.equal(a.independentAxisScaleAllowed,false);
  assert.equal(a.geometryPolicy,"AUTHENTIC_GEOMETRY_NO_DEFORMATION");
  assert.equal(assertPantavionAuthenticAlignmentSafe(a).ok,true);
}
console.log(JSON.stringify({ok:true,gate:"authentic_maps_A_B_C_no_deformation"}));
