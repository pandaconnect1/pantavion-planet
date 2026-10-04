import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;

try {
  const upstreamUrls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    upstreamUrls.push(String(input));
    return new Response(new Uint8Array([137, 80, 78, 71]), {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  }) as typeof fetch;

  const { GET } = await import(
    "../app/api/professional/infrastructure/water/basemap/dls/route.ts"
  );

  const cadastral = await GET(
    new Request(
      "https://pantavion.com/api/professional/infrastructure/water/basemap/dls?mode=cadastral&z=16&x=38782&y=26029",
    ),
  );
  assert.equal(cadastral.status, 200);
  assert.equal(
    cadastral.headers.get("x-pantavion-basemap"),
    "cyprus-dls-detailed-cadastral-v2",
  );
  assert.match(upstreamUrls[0], /National\/CadastralMap_GR\/MapServer\/export/);
  assert.match(upstreamUrls[0], /layers=show%3A0%2C19%2C21%2C22%2C23%2C28/);
  assert.match(upstreamUrls[0], /transparent=false/);
  assert.match(upstreamUrls[0], /size=512%2C512/);
  assert.match(upstreamUrls[0], /dpi=192/);

  const roads = await GET(
    new Request(
      "https://pantavion.com/api/professional/infrastructure/water/basemap/dls?mode=roads&z=16&x=38782&y=26029",
    ),
  );
  assert.equal(roads.status, 200);
  assert.equal(
    roads.headers.get("x-pantavion-basemap"),
    "cyprus-dls-road-labels-v1",
  );
  assert.match(upstreamUrls[1], /National\/Topography_GR\/MapServer\/export/);
  assert.match(upstreamUrls[1], /layers=show%3A4%2C7%2C13%2C14%2C15/);
  assert.match(upstreamUrls[1], /transparent=true/);

  const invalid = await GET(
    new Request(
      "https://pantavion.com/api/professional/infrastructure/water/basemap/dls?mode=roads&z=99&x=1&y=1",
    ),
  );
  assert.equal(invalid.status, 400);

  console.log("Cyprus DLS detailed operational basemap proxy: PASS");
} finally {
  globalThis.fetch = originalFetch;
}
