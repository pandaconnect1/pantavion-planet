import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(
  "app/professional/infrastructure/water/pantavion-map-pilot/page.tsx",
  "utf8",
);
const client = fs.readFileSync(
  "app/professional/infrastructure/water/pantavion-map-pilot/pantavion-owned-map-pilot-client.tsx",
  "utf8",
);

assert.match(page, /PANTAVION_BASEMAP_STYLE_URL/);
assert.match(page, /vector\.openstreetmap\.org\/styles\/shortbread\/colorful\.json/);
assert.match(client, /maplibre-gl@6\.11\.2/);
assert.match(client, /pantavion-water/);
assert.match(client, /segment\/bbox/);
assert.match(client, /completeNetworkReturned === true/);
assert.match(client, /rawMasterReturned === true/);
assert.match(client, /browserFullNetworkLoaded === true/);
assert.match(client, /self-hosted Cyprus tiles/);
assert.doesNotMatch(client, /2gis/i);
assert.doesNotMatch(client, /GOOGLE_MAPS_API_KEY/);
assert.doesNotMatch(client, /TOMTOM_API_KEY/);

console.log("Pantavion-owned Map Engine pilot contract: PASS");
