#!/usr/bin/env node

const { setTimeout: delay } = require("node:timers/promises");

const DEFAULT_BASE_URL = "https://www.pantavion.com";
const DEFAULT_APEX_URL = "https://pantavion.com";
const DEFAULT_DEPLOY_WAIT_MS = 8 * 60 * 1000;
const DEFAULT_ALIAS_WAIT_MS = 2 * 60 * 1000;

const baseUrl = (
  process.env.PANTAVION_PRODUCTION_BASE_URL || DEFAULT_BASE_URL
).replace(/\/$/, "");
const apexUrl = (
  process.env.PANTAVION_CANONICAL_APEX_URL || DEFAULT_APEX_URL
).replace(/\/$/, "");
const expectedCommitSha =
  process.env.PANTAVION_EXPECTED_GITHUB_SHA || process.env.GITHUB_SHA || "";
const deployWaitMs = Number(
  process.env.PANTAVION_DEPLOY_WAIT_MS || DEFAULT_DEPLOY_WAIT_MS,
);
const aliasWaitMs = Number(
  process.env.PANTAVION_ALIAS_WAIT_MS || DEFAULT_ALIAS_WAIT_MS,
);

function fail(message) {
  throw new Error(`[FAIL] ${message}`);
}

function pass(message) {
  console.log(`[PASS] ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
  pass(message);
}

async function fetchWithTimeout(url, options = {}) {
  return fetch(url, {
    redirect: "follow",
    cache: "no-store",
    ...options,
    signal: AbortSignal.timeout(20_000),
  });
}

async function readRuntimeRevision(origin) {
  const response = await fetchWithTimeout(
    `${origin}/api/pantavion/runtime/revision?water_guard=${encodeURIComponent(
      expectedCommitSha || Date.now().toString(),
    )}`,
  );
  const text = await response.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    fail(`runtime revision endpoint at ${origin} returned non-JSON: ${text.slice(0, 200)}`);
  }

  return {
    response,
    payload,
  };
}

async function waitForExactProductionRevision(origin, waitMs = deployWaitMs) {
  const deadline = Date.now() + waitMs;
  let lastRevision = "";
  let lastProvider = "";

  while (Date.now() < deadline) {
    try {
      const { response, payload } = await readRuntimeRevision(origin);
      const revision = typeof payload?.revision === "string" ? payload.revision : "";
      const provider = typeof payload?.provider === "string" ? payload.provider : "unknown";

      if (revision !== lastRevision || provider !== lastProvider) {
        console.log(
          `[INFO] ${origin} runtime provider=${provider} revision=${revision || "missing"} expected=${expectedCommitSha || "<any>"}`,
        );
        lastRevision = revision;
        lastProvider = provider;
      }

      if (
        response.status === 200 &&
        payload?.ok === true &&
        revision &&
        (!expectedCommitSha || revision === expectedCommitSha)
      ) {
        pass(
          `${origin} serves exact runtime revision ${revision} via ${provider}`,
        );
        return payload;
      }
    } catch (error) {
      console.log(
        `[INFO] Runtime revision probe at ${origin} not ready: ${error instanceof Error ? error.message : error}`,
      );
    }

    await delay(10_000);
  }

  fail(
    `${origin} did not serve expected revision ${expectedCommitSha || "<any>"} within ${waitMs}ms; last revision=${lastRevision || "missing"} provider=${lastProvider || "unknown"}`,
  );
}

function readScriptPaths(html) {
  return Array.from(
    html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi),
    (match) => match[1].replaceAll("&amp;", "&"),
  );
}

async function loadProductionWaterPage() {
  const deadline = Date.now() + aliasWaitMs;

  while (Date.now() < deadline) {
    const response = await fetchWithTimeout(
      `${baseUrl}/professional/infrastructure/water/live?water_guard=${encodeURIComponent(
        expectedCommitSha || Date.now().toString(),
      )}`,
    );
    const html = await response.text();

    if (response.status === 200) {
      assert(
        /Pantavion/i.test(html),
        "water live page is served by the Pantavion application",
      );
      pass("water live page returns 200");
      return html;
    }

    console.log(
      `[INFO] Waiting for Water live page at ${baseUrl}: HTTP ${response.status}`,
    );
    await delay(8_000);
  }

  fail("water live page did not become available");
}

async function verifyWaterClientBundle(html) {
  const scriptPaths = readScriptPaths(html);
  assert(scriptPaths.length > 0, "water live page references JavaScript bundles");

  for (const scriptPath of scriptPaths) {
    try {
      const response = await fetchWithTimeout(new URL(scriptPath, baseUrl));
      if (response.status !== 200) continue;
      const source = await response.text();

      const isWaterClient =
        source.includes("/api/professional/infrastructure/water/segment/bbox") &&
        source.includes("WATER_CLIENT_LOAD") &&
        source.includes("WATER_NO_VISIBLE_FEATURES");

      if (!isWaterClient) continue;

      assert(
        source.includes("moveend") && source.includes("zoomend"),
        "water client retains automatic pipe reload on map movement",
      );
      pass("water client bundle is connected to protected segmented network API");
      return;
    } catch {
      // Continue across Next.js chunks until the Water client chunk is found.
    }
  }

  fail("could not locate the Water client bundle with protected segmented-network diagnostics");
}

async function verifyUnauthenticatedFailClosed() {
  const params = new URLSearchParams({
    minLng: "33.02",
    minLat: "34.67",
    maxLng: "33.04",
    maxLat: "34.69",
    maxFeatures: "5",
  });
  const response = await fetchWithTimeout(
    `${baseUrl}/api/professional/infrastructure/water/segment/bbox?${params}`,
  );
  const text = await response.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    fail(`protected segment endpoint returned non-JSON: ${text.slice(0, 200)}`);
  }

  assert(response.status === 403, "unapproved segment request returns 403");
  assert(payload?.status === "access_denied", "unapproved request is access_denied");
  assert(payload?.dataReturned === false, "unapproved request returns no data");
  assert(payload?.segmentReturned === false, "unapproved request returns no segment");
  assert(
    payload?.completeNetworkReturned === false,
    "unapproved request never returns the complete network",
  );
  assert(payload?.rawMasterReturned === false, "unapproved request never returns raw master");
  assert(
    payload?.browserFullNetworkLoaded === false,
    "unapproved browser never loads the full network",
  );
  assert(
    response.headers.get("x-pantavion-water-segment") === "access-denied",
    "protected endpoint keeps the access-denied response contract",
  );
  assert(
    response.headers.get("x-pantavion-data-returned") === "false",
    "protected endpoint declares that no data was returned",
  );
  assert(!text.includes('"features"'), "access-denied body contains no feature collection");
}

async function verifyCanonicalApex() {
  if (!apexUrl || apexUrl === baseUrl) return;

  const payload = await waitForExactProductionRevision(apexUrl, aliasWaitMs);

  assert(
    payload.revision === expectedCommitSha,
    "canonical apex serves the same exact production revision",
  );
}

async function runProductionSmoke() {
  console.log("=== Pantavion Water Production Guardian v3 ===");
  console.log(`Primary production URL: ${baseUrl}`);
  console.log(`Canonical apex URL: ${apexUrl}`);

  await waitForExactProductionRevision(baseUrl);
  const html = await loadProductionWaterPage();
  await verifyWaterClientBundle(html);
  await verifyUnauthenticatedFailClosed();
  await verifyCanonicalApex();

  console.log("Pantavion water production guardian PASSED.");
}

if (require.main === module) {
  runProductionSmoke().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

module.exports = {
  readRuntimeRevision,
  waitForExactProductionRevision,
  runProductionSmoke,
};
