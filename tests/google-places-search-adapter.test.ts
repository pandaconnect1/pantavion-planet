import assert from "node:assert/strict";
import { GooglePlacesSearchAdapter } from "../core/water/google-places-search-adapter";

async function run() {
  const calls: Array<{url:string; init:RequestInit}> = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({url:String(url),init:init ?? {}});
    return new Response(JSON.stringify({places:[{id:"g1",location:{latitude:34.68,longitude:33.04}}]}),{status:200,headers:{"Content-Type":"application/json"}});
  }) as typeof fetch;
  try {
    const results=await new GooglePlacesSearchAdapter({apiKey:"test-key"}).search("Makariou");
    assert.equal(results.length,1);
    assert.equal(results[0].source,"GOOGLE_MAPS");
    assert.equal(results[0].persistence,"SESSION_ONLY");
    assert.deepEqual(results[0].coordinates,{lat:34.68,lng:33.04});
    const headers=new Headers(calls[0].init.headers);
    assert.equal(headers.get("X-Goog-FieldMask"),"places.id,places.location");
    assert.ok(!headers.get("X-Goog-FieldMask")?.includes("displayName"));
    assert.match(String(calls[0].init.body),/"regionCode":"CY"/);
  } finally { globalThis.fetch=original; }
  console.log("google-places-search-adapter: ok");
}
run();
