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
  /weight: Math\.max\(3, Math\.min\(10, sourceWidth \?\? 2\)\)/,
  "One-pixel source lines must remain operationally visible on high-DPI phones",
);
assert.match(
  client,
  /Δίκτυο A ενεργό/,
  "Approved Map A UI must expose visible-feature load status",
);

console.log("water network visibility regression: PASS");
