const DEFAULT_BASE_URL =
  "https://pantavion-planet-git-main-pandaconnect.vercel.app";

const baseUrl = (process.env.PANTAVION_PRODUCTION_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

let failures = 0;

function fail(message) {
  failures += 1;
  console.error("[FAIL] " + message);
}

function pass(message) {
  console.log("[PASS] " + message);
}

function assert(condition, message) {
  if (condition) {
    pass(message);
  } else {
    fail(message);
  }
}

async function fetchText(path) {
  const response = await fetch(baseUrl + path, {
    redirect: "follow",
    cache: "no-store",
  });

  const text = await response.text();

  return {
    response,
    text,
  };
}

async function fetchJson(path) {
  const response = await fetch(baseUrl + path, {
    redirect: "follow",
    cache: "no-store",
  });

  const text = await response.text();

  let json = null;

  try {
    json = JSON.parse(text);
  } catch {
    fail("Response is not JSON for " + path + ": " + text.slice(0, 300));
  }

  return {
    response,
    text,
    json,
  };
}

async function main() {
  console.log("=== Pantavion Water Production Smoke v1 ===");
  console.log("Base URL: " + baseUrl);

  const page = await fetchText("/professional/infrastructure/water");

  assert(page.response.status === 200, "water page returns 200 after redirect");
  assert(page.text.includes("Water Module Readiness"), "water page shows readiness title");
  assert(page.text.includes("Production blocked"), "water page shows production blocked");
  assert(!page.text.includes("Προβολή: 5000"), "water page does not show old 5000 text");
  assert(!page.text.includes("tile.openstreetmap.org"), "water page does not include OSM tile renderer");
  assert(!page.text.includes("WaterNetworkClient"), "water page does not include legacy client name");
  assert(!page.text.includes("nominatim.openstreetmap.org"), "water page does not include direct Nominatim search");

  const legacyNetwork = await fetchJson(
    "/api/professional/infrastructure/water/network?limit=5000",
  );

  assert(legacyNetwork.response.status === 423, "legacy network endpoint returns 423");
  assert(legacyNetwork.json?.status === "blocked", "legacy network status is blocked");
  assert(legacyNetwork.json?.dataReturned === false, "legacy network dataReturned false");
  assert(
    legacyNetwork.json?.waterNetworkDataReturned === false,
    "legacy network waterNetworkDataReturned false",
  );
  assert(legacyNetwork.json?.featuresReturned === 0, "legacy network featuresReturned 0");
  assert(legacyNetwork.json?.mayReturnRawMaster === false, "legacy network raw master blocked");
  assert(
    legacyNetwork.json?.mayReturnCompleteNetwork === false,
    "legacy network complete network blocked",
  );
  assert(
    legacyNetwork.json?.mayLoadFullNetworkInBrowser === false,
    "legacy network browser full loading blocked",
  );
  assert(legacyNetwork.json?.mayUseLegacyRenderer === false, "legacy renderer disabled");

  const productionReadiness = await fetchJson(
    "/api/professional/infrastructure/water/production-readiness",
  );

  assert(productionReadiness.response.status === 200, "production readiness returns 200");
  assert(
    productionReadiness.json?.overallReady === false,
    "production readiness overallReady false",
  );
  assert(
    productionReadiness.json?.productionActivationAllowed === false,
    "production activation remains blocked",
  );
  assert(productionReadiness.json?.noDataReturned === true, "production readiness noDataReturned true");

  const addressCandidates = await fetchJson(
    "/api/professional/infrastructure/water/address/candidates?query=Makariou&city=Limassol",
  );

  assert(addressCandidates.response.status === 423, "address candidates endpoint returns 423");
  assert(
    addressCandidates.json?.mayAutoPickAmbiguousAddress === false,
    "ambiguous address auto-pick blocked",
  );
  assert(
    addressCandidates.json?.selectedCandidateIdRequiredBeforeBbox === true,
    "selectedCandidateId required before bbox",
  );
  assert(
    addressCandidates.json?.waterNetworkDataReturned === false,
    "address candidates return no water network data",
  );

  console.log("=== Production Smoke Summary ===");
  console.log("Failures: " + failures);

  if (failures > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
