import assert from "node:assert/strict";
import { CyprusDlsRoadSearchAdapter } from "../core/water/cyprus-dls-road-search-adapter";

const originalFetch = globalThis.fetch;

try {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));

    assert.equal(url.hostname, "dls.test");
    assert.equal(url.searchParams.get("f"), "geojson");
    assert.equal(url.searchParams.get("outSR"), "4326");
    assert.match(url.searchParams.get("where") ?? "", /ROADNAMEGR|ROADNAMERMN/);
    // House numbers must not prevent a road-name match.
    assert.doesNotMatch(url.searchParams.get("where") ?? "", /25/);

    return new Response(
      JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              OBJECTID: 42,
              ROADNAMEGR: "ΑΝΕΞΑΡΤΗΣΙΑΣ",
              ROADNAMERMN: "ANEXARTISIAS",
              ROUTENUMBER: null,
              STREET_CODE: 1234,
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [33.0401, 34.6811],
                [33.0411, 34.6821],
                [33.0421, 34.6831],
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/geo+json" } },
    );
  }) as typeof fetch;

  const adapter = new CyprusDlsRoadSearchAdapter({
    baseUrl: "https://dls.test/arcgis/rest/services/National/General_Search/MapServer/13/query",
  });

  const greek = await adapter.search("Ανεξαρτησίας 25");
  assert.equal(greek.length, 1);
  assert.equal(greek[0].source, "CYPRUS_OFFICIAL");
  assert.equal(greek[0].kind, "STREET");
  assert.equal(greek[0].displayName, "ΑΝΕΞΑΡΤΗΣΙΑΣ");
  assert.deepEqual(greek[0].coordinates, { lat: 34.6821, lng: 33.0411 });

  const latin = await adapter.search("Anexartisias 25, Limassol");
  assert.equal(latin.length, 1);
  assert.equal(latin[0].displayName, "ANEXARTISIAS");

  console.log("Cyprus DLS road search adapter: PASS");
} finally {
  globalThis.fetch = originalFetch;
}
