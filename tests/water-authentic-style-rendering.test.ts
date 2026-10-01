import assert from "node:assert/strict";
import {
  PANTAVION_WATER_AUTHENTIC_STYLE_RENDERING_POLICY,
  WATER_AUTHENTIC_STYLE_MVT_PROPERTIES,
  waterAuthenticLineColorExpression,
  waterAuthenticLineOpacityExpression,
} from "../core/infrastructure/water/water-authentic-style-rendering.ts";

assert.equal(
  WATER_AUTHENTIC_STYLE_MVT_PROPERTIES.sourceColorCss,
  "source_color_css",
);
assert.equal(
  WATER_AUTHENTIC_STYLE_MVT_PROPERTIES.sourceOpacity,
  "source_opacity",
);
assert.equal(
  PANTAVION_WATER_AUTHENTIC_STYLE_RENDERING_POLICY.authenticGeometryMayBeModified,
  false,
);
assert.equal(
  PANTAVION_WATER_AUTHENTIC_STYLE_RENDERING_POLICY.sourceColourMustBePreservedWhenPresent,
  true,
);
assert.deepEqual(
  waterAuthenticLineColorExpression(),
  ["coalesce",["get","source_color_css"],"#22d3ee"],
);
assert.deepEqual(
  waterAuthenticLineOpacityExpression(),
  ["coalesce",["get","source_opacity"],0.92],
);

console.log(JSON.stringify({
  ok:true,
  authenticSourceColour:true,
  authenticGeometryModified:false,
}));
