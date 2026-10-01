import assert from "node:assert/strict";
import {
  decodeWaterPipeSemantic,
  PANTAVION_WATER_CAD_SEMANTIC_POLICY,
} from "../core/infrastructure/water/water-cad-semantic-decoding-contract.ts";

assert.equal(PANTAVION_WATER_CAD_SEMANTIC_POLICY.authenticCadMayBeModified,false);
assert.equal(PANTAVION_WATER_CAD_SEMANTIC_POLICY.colourAloneMayNotBecomeHydraulicFactWithoutVerifiedLegend,true);

const unknown=decodeWaterPipeSemantic({entityId:"p1",aciColor:1},[]);
assert.equal(unknown.confidence,"UNVERIFIED");
assert.equal(unknown.nominalDiameterMm,undefined);

const verified=decodeWaterPipeSemantic(
  {entityId:"p2",layerName:"WATER_MAIN",aciColor:3},
  [{
    ruleId:"r1",
    sourceRevisionId:"rev-1",
    match:{layerName:"WATER_MAIN",aciColor:3},
    means:{pipeType:"MAIN",nominalDiameterMm:200,material:"DI"},
    verifiedBy:"authorized-user",
    verifiedAt:"2026-10-01T10:00:00Z",
    evidenceRef:"legend:rev-1",
  }]
);
assert.equal(verified.confidence,"VERIFIED");
assert.equal(verified.nominalDiameterMm,200);
assert.equal(verified.material,"DI");

console.log(JSON.stringify({ok:true,unknownStaysUnknown:true,verifiedLegendRequired:true}));
