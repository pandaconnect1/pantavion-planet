#!/usr/bin/env node

const { setTimeout: delay } = require("node:timers/promises");

const DEFAULT_BASE_URL = "https://www.pantavion.com";
const DEFAULT_DEPLOY_WAIT_MS = 8 * 60 * 1000;
const DEFAULT_ALIAS_WAIT_MS = 2 * 60 * 1000;

const baseUrl = (
  process.env.PANTAVION_PRODUCTION_BASE_URL || DEFAULT_BASE_URL
).replace(/\/$/, "");
const repository = process.env.GITHUB_REPOSITORY || "";
const expectedCommitSha =
  process.env.PANTAVION_EXPECTED_GITHUB_SHA || process.env.GITHUB_SHA || "";
const githubToken = process.env.GITHUB_TOKEN || "";
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

function deploymentIdFromTargetUrl(targetUrl) {
  if (typeof targetUrl !== "string" || !targetUrl.startsWith("https://")) {
    return "";
  }

  const id = new URL(targetUrl).pathname.split("/").filter(Boolean).at(-1) || "";
  return id ? `dpl_${id}` : "";
}

async function readVercelCommitStatus() {
  if (!repository || !expectedCommitSha) return null;

  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "pantavion-water-production-guardian",
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const response = await fetchWithTimeout(
    `https://api.github.com/repos/${repository}/commits/${expectedCommitSha}/status`,
    { headers },
  );

  if (!response.ok) {
    fail(`GitHub commit status request returned ${response.status}`);
  }

  const payload = await response.json();
  const statuses = Array.isArray(payload.statuses) ? payload.statuses : [];

  return statuses.find((status) => status.context === "Vercel") || null;
}

async function waitForVercelDeployment() {
  if (!repository || !expectedCommitSha) {
    console.log(
      "[INFO] No GitHub repository/SHA supplied; validating the currently served production deployment.",
    );
    return "";
  }

  const deadline = Date.now() + deployWaitMs;
  let lastState = "missing";

  while (Date.now() < deadline) {
    const status = await readVercelCommitStatus();

    if (status?.state === "success") {
      const deploymentId = deploymentIdFromTargetUrl(status.target_url);

      if (!deploymentId) {
        fail("Vercel succeeded without a valid deployment target URL");
      }

      pass(`Vercel completed deployment ${deploymentId} for ${expectedCommitSha}`);
      return deploymentId;
    }

    if (status?.state === "failure" || status?.state === "error") {
      fail(`Vercel deployment finished with state ${status.state}`);
    }

    const currentState = status?.state || "missing";
    if (currentState !== lastState) {
      console.log(`[INFO] Waiting for Vercel production status: ${currentState}`);
      lastState = currentState;
    }

    await delay(10_000);
  }

  fail(
    `No successful Vercel deployment appeared for ${expectedCommitSha} within ${deployWaitMs}ms`,
  );
}

function readDeploymentId(html) {
  return html.match(/\bdpl_[A-Za-z0-9]+\b/)?.[0] || "";
}

function readWaterClientScript(html) {
  const match = html.match(
    /src="([^"]*\/app\/professional\/infrastructure\/water\/live\/page-[^"]+\.js[^"]*)"/,
  );

  return match?.[1]?.replaceAll("&amp;", "&") || "";
}

async function loadExactProductionPage(expectedDeploymentId) {
  const deadline = Date.now() + aliasWaitMs;
  let lastDeploymentId = "";

  while (Date.now() < deadline) {
    const url = `${baseUrl}/professional/infrastructure/water/live?water_guard=${encodeURIComponent(
      expectedCommitSha || Date.now().toString(),
    )}`;
    const response = await fetchWithTimeout(url);
    const html = await response.text();

    if (response.status !== 200) {
      fail(`water live page returned ${response.status}`);
    }

    const deploymentId = readDeploymentId(html);
    lastDeploymentId = deploymentId || lastDeploymentId;

    if (!expectedDeploymentId || deploymentId === expectedDeploymentId) {
      assert(Boolean(deploymentId), "water live page exposes a Vercel deployment identity");
      pass(`pantavion.com serves ${deploymentId}`);
      return { html, deploymentId };
    }

    console.log(
      `[INFO] Waiting for production alias: current=${deploymentId || "missing"} expected=${expectedDeploymentId}`,
    );
    await delay(8_000);
  }

  fail(
    `pantavion.com did not switch to ${expectedDeploymentId}; last served ${lastDeploymentId || "unknown"}`,
  );
}

async function verifyWaterClientBundle(html, deploymentId) {
  const scriptPath = readWaterClientScript(html);

  assert(Boolean(scriptPath), "water live page references its dedicated client bundle");
  assert(
    scriptPath.includes(`dpl=${deploymentId}`),
    "water client bundle belongs to the active production deployment",
  );

  const response = await fetchWithTimeout(new URL(scriptPath, baseUrl));
  const source = await response.text();

  assert(response.status === 200, "water client bundle returns 200");
  assert(source.includes("WATER_CLIENT_LOAD"), "client keeps safe load diagnostics");
  assert(
    source.includes("WATER_NO_VISIBLE_FEATURES"),
    "client detects missing visible pipe features",
  );
  assert(
    source.includes("/api/professional/infrastructure/water/segment/bbox"),
    "client remains connected to the protected segment endpoint",
  );
  assert(
    source.includes("moveend") && source.includes("zoomend"),
    "client retains automatic pipe reload on map movement",
  );
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

async function runProductionSmoke() {
  console.log("=== Pantavion Water Production Guardian v2 ===");
  console.log(`Base URL: ${baseUrl}`);

  const expectedDeploymentId = await waitForVercelDeployment();
  const { html, deploymentId } =
    await loadExactProductionPage(expectedDeploymentId);

  await verifyWaterClientBundle(html, deploymentId);
  await verifyUnauthenticatedFailClosed();

  console.log("Pantavion water production guardian PASSED.");
}

if (require.main === module) {
  runProductionSmoke().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

module.exports = {
  runProductionSmoke,
};
