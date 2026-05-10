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

console.log("=== Pantavion Water Guardian Surface Audit v4 ===");

const legacyClientPath = "app/professional/infrastructure/water/water-network-client.tsx";
const waterPagePath = "app/professional/infrastructure/water/page.tsx";
const readinessPagePath = "app/professional/infrastructure/water/readiness/page.tsx";
const readinessClientPath =
  "app/professional/infrastructure/water/readiness/water-readiness-live-console.tsx";
const liveMapClientPath =
  "app/professional/infrastructure/water/live/controlled-water-segment-client.tsx";
const legacyNetworkRoutePath = "app/api/professional/infrastructure/water/network/route.ts";
const segmentBboxRoutePath = "app/api/professional/infrastructure/water/segment/bbox/route.ts";

forbidExistingFile(
  legacyClientPath,
  "Legacy full-network browser renderer must stay deleted.",
);

const waterPage = requireFile(waterPagePath);
const readinessPage = requireFile(readinessPagePath);
const readinessClient = requireFile(readinessClientPath);
const readinessSurface = readinessPage + "\n" + readinessClient;
const liveMapClient = requireFile(liveMapClientPath);
const legacyNetworkRoute = requireFile(legacyNetworkRoutePath);
const segmentBboxRoute = requireFile(segmentBboxRoutePath);

console.log("=== Water Entry Route Enforcement ===");

requireMarker(waterPage, waterPagePath, 'redirect("/professional/infrastructure/water/readiness")');
forbidMarker(waterPage, waterPagePath, "WaterNetworkClient");
forbidMarker(waterPage, waterPagePath, "/api/professional/infrastructure/water/network");
forbidMarker(waterPage, waterPagePath, "limit=5000");

console.log("=== Legacy Network Endpoint Block Enforcement ===");

requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "legacy_water_network_endpoint_blocked_v1");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, 'status: "blocked"');
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "dataReturned: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "waterNetworkDataReturned: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "featuresReturned: 0");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "mayReturnRawMaster: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "mayReturnCompleteNetwork: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "mayLoadFullNetworkInBrowser: false");
requireMarker(legacyNetworkRoute, legacyNetworkRoutePath, "status: 423");

forbidMarker(legacyNetworkRoute, legacyNetworkRoutePath, "readWaterNetworkSource");
forbidMarker(legacyNetworkRoute, legacyNetworkRoutePath, "selectWaterNetworkMapFeatures");
forbidMarker(legacyNetworkRoute, legacyNetworkRoutePath, "features: selectedFeatures");

console.log("=== Readiness Surface Enforcement ===");

const readinessRequiredMarkers = [
  "Water Module Readiness",
  "Address disambiguation",
  "pantavion-language-selector",
  "pantavion-language",
  "250",
  "7200",
  "Run live checks",
  "window.localStorage",
  "window.navigator.language",
  "copyPresentationMessage",
  "openContract",
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

console.log("=== Controlled Live Map Enforcement ===");

const liveMapRequiredMarkers = [
  "Πραγματικός χάρτης δικτύου ύδρευσης",
  "tile.openstreetmap.org",
  "/api/professional/infrastructure/water/segment/bbox",
  "leaflet.geoJSON",
  "Φόρτωσε τμήμα από τον χάρτη",
  "completeNetworkReturned",
  "rawMasterReturned",
];

for (const marker of liveMapRequiredMarkers) {
  requireMarker(liveMapClient, liveMapClientPath, marker);
}

requireMarker(segmentBboxRoute, segmentBboxRoutePath, "completeNetworkReturned: false");
requireMarker(segmentBboxRoute, segmentBboxRoutePath, "rawMasterReturned: false");
requireMarker(segmentBboxRoute, segmentBboxRoutePath, "segmentReturned: true");

console.log("=== Global Forbidden Water Surface Scan ===");

const scanTargets = [
  ...walkFiles("app/professional/infrastructure/water"),
  ...walkFiles("app/api/professional/infrastructure/water"),
];

const forbiddenEverywhere = [
  "WaterNetworkClient",
  "REQUEST_LIMIT",
  "limit=5000",
  "returnedFeatureCount",
  "selectWaterNetworkMapFeatures",
  "features: selectedFeatures",
  "nominatim.openstreetmap.org",
];

for (const file of scanTargets) {
  const content = read(file);

  for (const marker of forbiddenEverywhere) {
    if (content.includes(marker)) {
      fail("Forbidden water marker found in " + file + ": " + marker);
    }
  }

  if (
    file !== liveMapClientPath &&
    content.includes("tile.openstreetmap.org")
  ) {
    fail("OpenStreetMap tiles are allowed only in controlled live map client, found in " + file);
  }
}

pass("Global forbidden water surface scan completed.");

console.log("=== Guardian Summary ===");
console.log("Failures: " + failures);
console.log("Warnings: " + warnings);

if (failures > 0) {
  process.exit(1);
}
