const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/infrastructure/water/water-abc-map-system-contract.ts",
  "app/api/professional/infrastructure/water/maps/registry/route.ts",
];

const requiredMarkers = [
  "PANTAVION_WATER_ABC_MAP_SYSTEM_ID",
  "A_OPERATIONAL_GEO_MAP",
  "B_AUTHENTIC_MASTER_MAP",
  "C_INTELLIGENT_ENGINEERING_MAP",
  "approvedUserSeesAMap: true",
  "approvedUserSeesBMap: true",
  "approvedUserSeesCMap: true",
  "rawDtxCadDownloadAllowedForApprovedUsers: false",
  "publicFullExportAllowed: false",
  "githubMasterUploadAllowed: false",
  "approvedUsersMaySubmitChanges: true",
  "founderApprovalRequiredBeforeVisibleToAll: true",
  "approvedChangesVisibleToAllApprovedUsers: true",
  "alphabeticalStreetIndexRequired: true",
  "telemetryAllowed: true",
  "measuredEstimatedReportedUnknownSeparationRequired: true",
  "noFakePressureClaims: true",
  "noAutomaticMasterMutation: true",
];

const routeMarkers = [
  "water_maps_require_approved_access",
  "rawBMasterReturned: false",
  "rawDtxCadDownloadProvided: false",
  "publicFullExportProvided: false",
  "browserFullNetworkLoaded: false",
  "userCanMutateMasterDirectly: false",
  "X-Pantavion-Water-Maps",
];

let failures = 0;

function fail(message) {
  failures += 1;
  console.error("[FAIL] " + message);
}

function pass(message) {
  console.log("[PASS] " + message);
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);

  if (!fs.existsSync(absolutePath)) {
    fail("Missing required file: " + relativePath);
    return "";
  }

  pass("Required file exists: " + relativePath);
  return fs.readFileSync(absolutePath, "utf8").replace(/^\uFEFF/, "");
}

console.log("=== Pantavion Water A/B/C Map System Gate v1 ===");

const contract = read("core/infrastructure/water/water-abc-map-system-contract.ts");
const route = read("app/api/professional/infrastructure/water/maps/registry/route.ts");

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    fail("Required file missing: " + file);
  }
}

for (const marker of requiredMarkers) {
  if (contract.includes(marker)) {
    pass("Contract marker present: " + marker);
  } else {
    fail("Contract marker missing: " + marker);
  }
}

for (const marker of routeMarkers) {
  if (route.includes(marker)) {
    pass("Route marker present: " + marker);
  } else {
    fail("Route marker missing: " + marker);
  }
}

console.log("Failures: " + failures);

if (failures > 0) {
  process.exit(1);
}