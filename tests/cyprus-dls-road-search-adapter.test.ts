import assert from "node:assert/strict";
import { CyprusDlsRoadSearchAdapter } from "../core/water/cyprus-dls-road-search-adapter";

const originalFetch = globalThis.fetch;

try {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));

    assert.equal(url.hostname, "dls.test");
    assert.equal(url.searchParams.get("f"), "geojson");
    assert.equal(url.searchParams.get("outSR"), "4326");
    assert.equal(url.searchParams.get("resultRecordCount"), "250");
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
              DIST_CODE: 4,
              VIL_CODE: 101,
              QRTR_CODE: 1,
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
          {
            type: "Feature",
            properties: {
              OBJECTID: 43,
              ROADNAMEGR: "ΑΝΕΞΑΡΤΗΣΙΑΣ",
              ROADNAMERMN: "ANEXARTISIAS",
              ROUTENUMBER: null,
              DIST_CODE: 4,
              VIL_CODE: 202,
              QRTR_CODE: 2,
              STREET_CODE: 1234,
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [32.9901, 34.7011],
                [32.9911, 34.7021],
                [32.9921, 34.7031],
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
  assert.equal(greek.length, 2);
  assert.equal(greek[0].source, "CYPRUS_OFFICIAL");
  assert.equal(greek[0].kind, "STREET");
  assert.equal(greek[0].displayName, "ΑΝΕΞΑΡΤΗΣΙΑΣ");
  assert.deepEqual(greek[0].coordinates, { lat: 34.6821, lng: 33.0411 });
  assert.match(greek[0].secondaryLabel ?? "", /D4/);
  assert.match(greek[0].secondaryLabel ?? "", /V101/);
  assert.match(greek[1].secondaryLabel ?? "", /V202/);
  assert.notEqual(greek[0].sourceResultId, greek[1].sourceResultId);

  const latin = await adapter.search("Anexartisias 25, Limassol");
  assert.equal(latin.length, 2);
  assert.equal(latin[0].displayName, "ANEXARTISIAS");

  console.log("Cyprus DLS road search adapter: PASS");
} finally {
  globalThis.fetch = originalFetch;
}
