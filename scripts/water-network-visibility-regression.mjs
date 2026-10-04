import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const client = await readFile(
  new URL("../app/professional/infrastructure/water/live/controlled-water-segment-client.tsx", import.meta.url),
  "utf8",
);

assert.match(
  client,
  /map\.createPane\("pantavion-water-network"\)/,
  "Map A must create a dedicated network render pane",
);
assert.match(
  client,
  /waterNetworkPane\.style\.zIndex = "450"/,
  "Water network pane must render above basemap tiles",
);
assert.match(
  client,
  /pane: "pantavion-water-network"/,
  "Authentic GeoJSON water features must render in the dedicated network pane",
);
assert.match(
  client,
  /weight: Math\.max\(1, Math\.min\(6, sourceWidth \?\? 1\)\)/,
  "Map A must preserve near-authentic source line widths without artificial thickening",
);
assert.match(
  client,
  /Δίκτυο A ενεργό/,
  "Approved Map A UI must expose visible-feature load status",
);

console.log("water network visibility regression: PASS");
