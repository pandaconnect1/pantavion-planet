import assert from "node:assert/strict";
import { calculatePantavionMapASimilarityTransform, applyPantavionMapASimilarityTransform } from "../core/water/water-map-a-similarity-alignment.ts";

const scale=1.25, theta=0.2, a=scale*Math.cos(theta), b=scale*Math.sin(theta), tx=12345, ty=67890;
const src=[[0,0],[100,0],[0,100],[120,80]];
const points=src.map(([x,y],i)=>({
 id:`cp-${i+1}`,sourceX:x,sourceY:y,
 targetEasting:a*x-b*y+tx,targetNorthing:b*x+a*y+ty,
 provenance:"synthetic-regression-control"
}));
const t=calculatePantavionMapASimilarityTransform(points);
assert.equal(t.method,"similarity_2d_no_shear_v1");
assert.equal(t.targetCrs,"EPSG:6312");
assert.ok(Math.abs(t.scale-scale)<1e-10);
assert.ok(Math.abs(t.rotationRadians-theta)<1e-10);
assert.ok(t.rmseMeters<1e-9);
assert.ok(t.maxResidualMeters<1e-9);
for(const p of points){
 const q=applyPantavionMapASimilarityTransform(t,p.sourceX,p.sourceY);
 assert.ok(Math.hypot(q.easting-p.targetEasting,q.northing-p.targetNorthing)<1e-9);
}
console.log(JSON.stringify({ok:true,gate:"map_a_similarity_no_shear",rmseMeters:t.rmseMeters,maxResidualMeters:t.maxResidualMeters}));
