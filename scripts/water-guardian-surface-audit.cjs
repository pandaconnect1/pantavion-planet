const fs = require("fs");
const path = require("path");

const root = process.cwd();

let failures = 0;
let warnings = 0;

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function fail(message) {
  failures += 1;
  console.error("[FAIL] " + message);
}

function warn(message) {
  warnings += 1;
  console.warn("[WARN] " + message);
}

function pass(message) {
  console.log("[PASS] " + message);
}

function requireFile(relativePath) {
  if (!exists(relativePath)) {
    fail("Required file missing: " + relativePath);
    return "";
  }

  pass("Required file exists: " + relativePath);
  return read(relativePath);
}

function forbidExistingFile(relativePath, reason) {
  if (exists(relativePath)) {
    fail("Forbidden file exists: " + relativePath + " :: " + reason);
  } else {
    pass("Forbidden file absent: " + relativePath);
  }
}

function requireMarker(content, label, marker) {
  if (content.includes(marker)) {
    pass("Marker present in " + label + ": " + marker);
  } else {
    fail("Marker missing in " + label + ": " + marker);
  }
}

function forbidMarker(content, label, marker) {
  if (content.includes(marker)) {
    fail("Forbidden marker found in " + label + ": " + marker);
  } else {
    pass("Forbidden marker absent in " + label + ": " + marker);
  }
}

function walkFiles(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const output = [];

  if (!fs.existsSync(absolutePath)) return output;

  for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
    const childAbsolutePath = path.join(absolutePath, entry.name);
    const childRelativePath = path.relative(root, childAbsolutePath).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      output.push(...walkFiles(childRelativePath));
      continue;
    }

    if (/\.(ts|tsx|js|jsx|cjs|mjs|json|md)$/.test(entry.name)) {
      output.push(childRelativePath);
    }
  }

  return output;
}

console.log("=== Pantavion Water Guardian Surface Audit v2 ===");

const legacyClientPath = "app/professional/infrastructure/water/water-network-client.tsx";
const waterPagePath = "app/professional/infrastructure/water/page.tsx";
const readinessPagePath = "app/professional/infrastructure/water/readiness/page.tsx";
const readinessClientPath = "app/professional/infrastructure/water/readiness/water-readiness-live-console.tsx";
const readinessClientPath =
  "app/professional/infrastructure/water/readiness/water-readiness-live-console.tsx";
const legacyNetworkRoutePath = "app/api/professional/infrastructure/water/network/route.ts";
const productionReadinessRoutePath =
  "app/api/professional/infrastructure/water/production-readiness/route.ts";
const addressCandidatesRoutePath =
  "app/api/professional/infrastructure/water/address/candidates/route.ts";
const servingReadinessRoutePath =
  "app/api/professional/infrastructure/water/serving/readiness/route.ts";
const servingBboxRoutePath =
  "app/api/professional/infrastructure/water/serving/bbox/route.ts";

forbidExistingFile(
  legacyClientPath,
  "Legacy browser renderer must stay deleted until controlled serving is production-ready.",
);

const waterPage = requireFile(waterPagePath);
const readinessPage = requireFile(readinessPagePath);
const readinessClient = requireFile(readinessClientPath);
const readinessSurface = readinessPage + "\n" + readinessClient;
const readinessClient = requireFile(readinessClientPath);
const readinessSurface = readinessPage + "\n" + readinessClient;
const legacyNetworkRoute = requireFile(legacyNetworkRoutePath);
const productionReadinessRoute = requireFile(productionReadinessRoutePath);
const addressCandidatesRoute = requireFile(addressCandidatesRoutePath);
requireFile(servingReadinessRoutePath);
requireFile(servingBboxRoutePath);

console.log("=== Water Presentation Route Enforcement ===");

requireMarker(waterPage, waterPagePath, 'redirect("/professional/infrastructure/water/readiness")');
forbidMarker(waterPage, waterPagePath, "WaterNetworkClient");
forbidMarker(waterPage, waterPagePath, "tile.openstreetmap.org");
forbidMarker(waterPage, waterPagePath, "nominatim.openstreetmap.org");
forbidMarker(waterPage, waterPagePath, "/api/professional/infrastructure/water/network");
forbidMarker(waterPage, waterPagePath, "returnedFeatureCount");
forbidMarker(waterPage, waterPagePath, "limit=5000");

console.log("=== Legacy Network Endpoint Block Enforcement ===");

requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "legacy_water_network_endpoint_blocked_v1");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, 'status: "blocked"');
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, 'productionServingStatus: "blocked"');
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, 'rendererStatus: "blocked"');
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "dataReturned: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "noDataReturned: true");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "waterNetworkDataReturned: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "featuresReturned: 0");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "mayReturnRawMaster: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "mayReturnCompleteNetwork: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "mayReturnPreviewAsProduction: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "mayReturnSampleAsFinal: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "mayLoadFullNetworkInBrowser: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "mayUseLegacyRenderer: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "status: 423");

forbidMarker(legacyNetworkRoute, legacyNetworkRoutePath, "readWaterNetworkSource");
forbidMarker(legacyNetworkRoute, legacyNetworkRoutePath, "selectWaterNetworkMapFeatures");
forbidMarker(legacyNetworkRoute, legacyNetworkRoutePath, "source.collection");
forbidMarker(legacyNetworkRoute, legacyNetworkRoutePath, "selectedFeatures");
forbidMarker(legacyNetworkRoute, legacyNetworkRoutePath, "returnedFeatureCount");
forbidMarker(legacyNetworkRoute, legacyNetworkRoutePath, "features: selectedFeatures");

console.log("=== Safe + Live + Multilingual Readiness Enforcement ===");

const readinessRequiredMarkers = [
  "Water Module Readiness",
  "Production blocked",
  "Address disambiguation",
  "No raw master network is returned",
  "No complete network payload is returned",
  "No renderer or map layer is activated here",
  "pantavion-language-selector",
  "pantavion-language",
  "250",
  "7200",
  "Î•ÎºÏ„Î­Î»ÎµÏƒÎ· live ÎµÎ»Î­Î³Ï‡Î¿Ï…",
  "Run live checks",
  "window.localStorage",
  "window.navigator.language",
  "copyPresentationMessage",
  "openContract",
  "exportSnapshot",
  "loadEndpoint",
  "/api/professional/infrastructure/water/production-readiness",
  "/api/professional/infrastructure/water/serving/readiness",
  "/api/professional/infrastructure/water/address/candidates",
  "/api/professional/infrastructure/water/serving/bbox",
];

for (const marker of readinessRequiredMarkers) {
  requireMarker(readinessSurface, "water readiness surface", marker);
}

forbidMarker(readinessSurface, "water readiness surface", "tile.openstreetmap.org");
forbidMarker(readinessSurface, "water readiness surface", "nominatim.openstreetmap.org");
forbidMarker(readinessSurface, "water readiness surface", "/api/professional/infrastructure/water/network?limit");
forbidMarker(readinessSurface, "water readiness surface", "WaterNetworkClient");

console.log("=== Production Readiness Contract Enforcement ===");

requireMarker(productionReadinessRoute, productionReadinessRoutePath, "getWaterProductionReadinessSummary");
requireMarker(productionReadinessRoute, productionReadinessRoutePath, "Cache-Control");
requireMarker(productionReadinessRoute, productionReadinessRoutePath, "no-store");

console.log("=== Address Candidate Disambiguation Route Enforcement ===");

requireMarker(addressCandidatesRoute, addressCandidatesRoutePath, "planWaterAddressCandidateSearch");
requireMarker(addressCandidatesRoute, addressCandidatesRoutePath, "selectedCandidateId");
requireMarker(addressCandidatesRoute, addressCandidatesRoutePath, "Cache-Control");
requireMarker(addressCandidatesRoute, addressCandidatesRoutePath, "no-store");

console.log("=== Global Forbidden Water Surface Scan ===");

const scanTargets = [
  ...walkFiles("app/professional/infrastructure/water"),
  ...walkFiles("app/api/professional/infrastructure/water"),
];

const globalForbiddenMarkers = [
  "WaterNetworkClient",
  "tile.openstreetmap.org",
  "nominatim.openstreetmap.org",
  "REQUEST_LIMIT",
  "limit=5000",
  "returnedFeatureCount",
  "selectWaterNetworkMapFeatures",
  "features: selectedFeatures",
];

for (const file of scanTargets) {
  const content = read(file);

  for (const marker of globalForbiddenMarkers) {
    if (content.includes(marker)) {
      fail("Forbidden live water surface marker found in " + file + ": " + marker);
    }
  }
}

pass("Global forbidden water surface scan completed.");

console.log("=== Guardian Summary ===");
console.log("Failures: " + failures);
console.log("Warnings: " + warnings);

if (failures > 0) {
  process.exit(1);
}
