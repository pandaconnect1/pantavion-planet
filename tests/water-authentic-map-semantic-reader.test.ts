import assert from "node:assert/strict";
import {
  decodePipeFromAuthenticMap,
  extractPipeDiameterFromAuthenticText,
} from "../core/infrastructure/water/water-authentic-map-semantic-reader.ts";

assert.equal(extractPipeDiameterFromAuthenticText(["PIPE PHI200 DI".replace("PHI","Φ")]),200);
assert.equal(extractPipeDiameterFromAuthenticText(["DN110 PE"]),110);

const decoded=decodePipeFromAuthenticMap({
  entityRef:"pipe-123",
  featureKind:"PIPE",
  layerName:"WATER_MAIN_BLUE",
  colour:5,
  lineType:"Continuous",
  lineWeight:25,
  textLabels:["MAIN PIPE DN200 DI"],
  attributes:{},
  nearbyRoadNames:["ROAD-REF"],
  sourceRevisionId:"rev-1",
  sourceSha256:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
});

assert.equal(decoded.nominalDiameterMm,200);
assert.equal(decoded.material,"DI");
assert.equal(decoded.pipeType,"MAIN");
assert.equal(decoded.confidence,"DIRECT_MAP_TEXT");

console.log(JSON.stringify({ok:true,authenticTextPriority:true}));
