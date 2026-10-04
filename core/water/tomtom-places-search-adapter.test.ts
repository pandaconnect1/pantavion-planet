import { afterEach, describe, expect, it, vi } from "vitest";
import { TomTomPlacesSearchAdapter } from "./tomtom-places-search-adapter";

describe("TomTomPlacesSearchAdapter", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses Cyprus-only Places v3 filters and keeps results session-only", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        results: [{
          id: "r1",
          type: "street",
          title: "Ανεξαρτησίας",
          subtitles: ["Λεμεσός"],
          position: { lat: 34.6786, lon: 33.0413 },
          address: { municipality: "Λεμεσός" },
        }],
      }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const adapter = new TomTomPlacesSearchAdapter({ apiKey: "test-key" });
    const results = await adapter.discover("Ανεξαρτησίας");

    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(String(init?.body));
    expect(body.filters.countryCodesIso2).toEqual(["CY"]);
    expect(body.maxResults).toBe(20);
    expect(results[0]).toMatchObject({
      kind: "STREET",
      source: "TOMTOM",
      persistence: "SESSION_ONLY",
    });
  });

  it("does not call provider without a query or key", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const adapter = new TomTomPlacesSearchAdapter({ apiKey: "" });
    expect(await adapter.discover("street")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
