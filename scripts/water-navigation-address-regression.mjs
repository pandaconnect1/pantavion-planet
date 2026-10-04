import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import { waterAddressSearchQueries } from "../core/infrastructure/water/water-address-search-query.ts";

const fields = { street: "Griva Digeni", area: "Agios Tychonas", houseNumber: "12", postalCode: "4521" };
assert.deepEqual(waterAddressSearchQueries(fields), [
  "12, Griva Digeni, Agios Tychonas, 4521, Cyprus",
  "12, Γρίβα Διγενή, Άγιος Τύχωνας, 4521, Cyprus",
]);
assert.equal(waterAddressSearchQueries({ ...fields, street: "Γρίβα Διγενή", area: "Άγιος Τύχωνας" }).length, 1);
assert.equal(waterAddressSearchQueries({ ...fields, street: "High Street" })[0],
  "12, High Street, Agios Tychonas, 4521, Cyprus");

const client = readFileSync(new URL("../app/professional/infrastructure/water/live/controlled-water-segment-client.tsx", import.meta.url), "utf8");
const navigation = client.slice(client.indexOf("  function moveMapToPoint("), client.indexOf("  async function locateMe("));
const scheduler = client.slice(client.indexOf("    function clearAutoLoadTimer("), client.indexOf("    // Load the first authentic"));
let refreshes = 0;
let marker = null;
let view = null;
let nextTimer = 0;
const timers = new Map();
const oldRequest = new AbortController();
const map = { getZoom: () => 15, setView: (point, zoom, options) => {
  view = { point, zoom, options };
  context.scheduleAutoLoad();
} };
const context = vm.createContext({
  mapRef: { current: map },
  lang: "el", t: { searchFound: "found", failed: "failed" },
  setMessage: () => {},
  placeCircleMarker: async (point) => { marker = point; },
  autoLoadTimerRef: { current: null },
  reloadQueuedRef: { current: true },
  networkLoadAbortRef: { current: oldRequest },
  scheduleViewportReloadRef: { current: null },
  refreshVisibleWaterMap: async () => { refreshes += 1; },
  window: {
    setTimeout: (fn) => { const id = ++nextTimer; timers.set(id, fn); return id; },
    clearTimeout: (id) => timers.delete(id),
  },
});
vm.runInContext(stripTypeScriptTypes(navigation + scheduler), context);
context.scheduleViewportReloadRef.current = context.scheduleAutoLoad;
await context.selectMapPoint({ latlng: { lat: 34.725, lng: 33.137 } });
assert.equal(oldRequest.signal.aborted, true, "manual selection cancels obsolete viewport request");
assert.equal(context.reloadQueuedRef.current, false);
assert.deepEqual(Array.from(view.point), [34.725, 33.137]);
assert.equal(view.zoom, 16, "selected targets retain operational context instead of forcing zoom 18");
assert.match(client, /const MIN_NETWORK_TILE_ZOOM = 13;/, "minimum network tile zoom must stay within the server bbox ceiling");
assert.equal(view.options.animate, false, "new viewport is settled before reloading");
assert.equal(marker.kind, "search", "manual selection preserves GPS marker");
assert.equal(timers.size, 1, "move event plus manual selection produce one pending reload");
for (const fn of timers.values()) fn();
assert.equal(refreshes, 1);
timers.clear();
map.setView = () => {};
await context.selectMapPoint({ latlng: { lat: 34.725, lng: 33.137 } });
assert.equal(timers.size, 1, "same-center selection reloads even without a move event");
for (const fn of timers.values()) fn();
assert.equal(refreshes, 2);

let route = readFileSync(new URL("../app/api/professional/infrastructure/water/address/search/route.ts", import.meta.url), "utf8");
route = route.replace('import { NextResponse } from "next/server";',
  'const NextResponse = { json: (body, options) => Response.json(body, options) };');
route = route.replace('"@/core/infrastructure/water/water-address-search-query"',
  JSON.stringify(pathToFileURL(new URL("../core/infrastructure/water/water-address-search-query.ts", import.meta.url).pathname).href));
const { GET } = await import("data:text/javascript;base64," + Buffer.from(stripTypeScriptTypes(route)).toString("base64"));
const originalFetch = globalThis.fetch;
const requests = [];
const candidate = (id) => ({ place_id: id, display_name: "Γρίβα Διγενή", lat: "34.725", lon: "33.137" });
const request = new Request("https://pantavion.com/api/professional/infrastructure/water/address/search?" + new URLSearchParams(fields));
try {
  globalThis.fetch = async (url) => {
    requests.push(new URL(url).searchParams.get("q"));
    return Response.json(requests.length === 1 ? [] : [candidate(1), candidate(2)]);
  };
  const response = await GET(request);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(requests, waterAddressSearchQueries(fields));
  assert.equal(body.candidateCount, 2, "ambiguous fallback candidates stay available for user selection");
  assert.equal(body.mayAutoPickAmbiguousAddress, false);
  assert.equal(body.waterNetworkDataReturned, false);
  requests.length = 0;
  globalThis.fetch = async () => { requests.push("original"); return Response.json([candidate(1)]); };
  assert.equal((await (await GET(request)).json()).candidateCount, 1);
  assert.equal(requests.length, 1, "successful English search makes no fallback request");
  globalThis.fetch = async () => { throw new Error("timeout"); };
  assert.equal((await GET(request)).status, 502, "provider failure returns a controlled retryable response");
  globalThis.fetch = async () => Response.json([{ ...candidate(1), lat: "" }, { ...candidate(2), lon: "NaN" }]);
  assert.equal((await (await GET(request)).json()).candidateCount, 0, "invalid coordinates cannot become map markers");
} finally {
  globalThis.fetch = originalFetch;
}
console.log("PASS: manual viewport reload, same-center selection, GPS separation, Greek/English/Greeklish candidates, ambiguity and provider failures");
