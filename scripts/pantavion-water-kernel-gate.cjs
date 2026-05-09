const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/infrastructure/water/water-kernel-constitution.ts",
  "data/water-network-private/processed/water-network.geojson",
  "data/water-network-private/mobile/water-network-mobile.geojson",
];

const forbiddenRootFiles = [
  "water-network-mobile-from-kmz.geojson",
  "water-network-mobile-v2-classified.geojson",
  "water-network-mobile-googleearth-style.geojson",
  "water-network-mobile.geojson",
];

const forbiddenPublicExtensions = [".kmz", ".kml", ".geojson"];

const requiredLawMarkers = [
  "NO_DATA_LOSS",
  "NO_SAMPLING_AS_FINAL",
  "NO_PREVIEW_AS_PRODUCTION",
  "NO_PUBLIC_GEODATA",
  "NO_GUESSED_ASSET_TYPES",
  "GOOGLE_EARTH_REFERENCE_REQUIRED",
  "BUILD_TSC_AUDIT_REQUIRED",
  "FOUNDER_APPROVAL_REQUIRED",
];

let failures = 0;
let warnings = 0;

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
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

console.log("=== Pantavion Water Kernel Gate v1 ===");

for (const file of requiredFiles) {
  if (exists(file)) {
    pass("Required file exists: " + file);
  } else {
    fail("Required file missing: " + file);
  }
}

const constitutionPath = path.join(root, "core/infrastructure/water/water-kernel-constitution.ts");

if (fs.existsSync(constitutionPath)) {
  const constitution = fs.readFileSync(constitutionPath, "utf8");

  for (const marker of requiredLawMarkers) {
    if (constitution.includes(marker)) {
      pass("Law marker present: " + marker);
    } else {
      fail("Law marker missing: " + marker);
    }
  }
}

for (const file of forbiddenRootFiles) {
  if (exists(file)) {
    fail("Forbidden temporary root geodata file found: " + file);
  } else {
    pass("No forbidden temporary root geodata file: " + file);
  }
}

const publicDir = path.join(root, "public");

function scanPublicGeodata(dir) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanPublicGeodata(fullPath);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (forbiddenPublicExtensions.includes(extension)) {
      const relativePath = path.relative(root, fullPath).replaceAll("\\", "/");
      fail("Forbidden public geodata exposure: " + relativePath);
    }
  }
}

scanPublicGeodata(publicDir);

const mobileFile = "data/water-network-private/mobile/water-network-mobile.geojson";

if (exists(mobileFile)) {
  warn("Mobile preview file exists, but it is allowed only as temporary preview, never as final production truth.");
}

console.log("=== Gate Summary ===");
console.log("Failures: " + failures);
console.log("Warnings: " + warnings);

if (failures > 0) {
  process.exit(1);
}
