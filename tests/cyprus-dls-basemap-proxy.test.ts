import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;

try {
  let upstreamUrl = "";

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    upstreamUrl = String(input);
    return new Response(new Uint8Array([137, 80, 78, 71]), {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  }) as typeof fetch;

  const { GET } = await import(
    "../app/api/professional/infrastructure/water/basemap/dls/route.ts"
  );

  const response = await GET(
    new Request(
      "https://pantavion.com/api/professional/infrastructure/water/basemap/dls?z=16&x=38782&y=26029",
    ),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-pantavion-basemap"), "cyprus-dls-topography-proxy-v1");
  assert.match(upstreamUrl, /National\/Topography_GR\/MapServer\/export/);
  assert.match(upstreamUrl, /bboxSR=3857/);
  assert.match(upstreamUrl, /imageSR=3857/);
  assert.match(upstreamUrl, /size=256%2C256/);
  assert.match(upstreamUrl, /f=image/);

  const invalid = await GET(
    new Request(
      "https://pantavion.com/api/professional/infrastructure/water/basemap/dls?z=99&x=1&y=1",
    ),
  );
  assert.equal(invalid.status, 400);

  console.log("Cyprus DLS basemap proxy: PASS");
} finally {
  globalThis.fetch = originalFetch;
}
