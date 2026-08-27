import assert from "node:assert/strict";

import { evaluatePrivilegedRequestBoundary } from "../core/security/privileged-request-boundary.ts";

function request(method, headers = {}) {
  return new Request("https://internal-runtime.vercel.app/api/privileged", {
    method,
    headers: {
      "x-forwarded-host": "www.pantavion.com",
      "x-forwarded-proto": "https",
      ...headers,
    },
  });
}

const sameOriginPost = evaluatePrivilegedRequestBoundary(
  request("POST", {
    origin: "https://www.pantavion.com",
    "sec-fetch-site": "same-origin",
    "content-type": "application/json; charset=utf-8",
  }),
);
assert.deepEqual(sameOriginPost, { allowed: true, reason: "ok" });

const sameOriginDelete = evaluatePrivilegedRequestBoundary(
  request("DELETE", {
    origin: "https://www.pantavion.com",
    "sec-fetch-site": "same-origin",
  }),
);
assert.deepEqual(sameOriginDelete, { allowed: true, reason: "ok" });

const crossOrigin = evaluatePrivilegedRequestBoundary(
  request("POST", {
    origin: "https://attacker.invalid",
    "content-type": "application/json",
  }),
);
assert.equal(crossOrigin.allowed, false);
assert.equal(crossOrigin.reason, "origin_mismatch");

const crossSiteFetch = evaluatePrivilegedRequestBoundary(
  request("POST", {
    origin: "https://www.pantavion.com",
    "sec-fetch-site": "cross-site",
    "content-type": "application/json",
  }),
);
assert.equal(crossSiteFetch.allowed, false);
assert.equal(crossSiteFetch.reason, "cross_site_fetch");

const missingOrigin = evaluatePrivilegedRequestBoundary(
  request("POST", { "content-type": "application/json" }),
);
assert.equal(missingOrigin.allowed, false);
assert.equal(missingOrigin.reason, "missing_origin");

const nonJson = evaluatePrivilegedRequestBoundary(
  request("POST", {
    origin: "https://www.pantavion.com",
    "content-type": "text/plain",
  }),
);
assert.equal(nonJson.allowed, false);
assert.equal(nonJson.reason, "json_required");

const structuredJson = evaluatePrivilegedRequestBoundary(
  request("PATCH", {
    origin: "https://www.pantavion.com",
    "content-type": "application/problem+json",
  }),
);
assert.equal(structuredJson.allowed, true);

const malformedOrigin = evaluatePrivilegedRequestBoundary(
  request("POST", {
    origin: "not an origin",
    "content-type": "application/json",
  }),
);
assert.equal(malformedOrigin.allowed, false);
assert.equal(malformedOrigin.reason, "invalid_origin");

const unsupported = evaluatePrivilegedRequestBoundary(
  request("GET", { origin: "https://www.pantavion.com" }),
);
assert.equal(unsupported.allowed, false);
assert.equal(unsupported.reason, "unsupported_method");

const forwardedChain = new Request("https://internal-runtime.vercel.app/api/privileged", {
  method: "POST",
  headers: {
    origin: "https://www.pantavion.com",
    "content-type": "application/json",
    "x-forwarded-host": "www.pantavion.com, internal-runtime.vercel.app",
    "x-forwarded-proto": "https, http",
  },
});
assert.equal(evaluatePrivilegedRequestBoundary(forwardedChain).allowed, true);

console.log("Pantavion privileged-request boundary contract PASSED.");
console.log("Verified same-origin allow, cross-origin/cross-site deny, Origin requirement, and JSON mutation boundary.");
