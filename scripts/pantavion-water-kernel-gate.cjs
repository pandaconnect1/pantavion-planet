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

const sourceTruthScanFiles = [
  "core/infrastructure/water/cloud-water-network-source.ts",
  "app/api/professional/infrastructure/water/network/route.ts",
  "app/api/professional/infrastructure/water/network/status/route.ts",
  "app/professional/infrastructure/water/page.tsx",
  "app/professional/infrastructure/water/water-network-client.tsx",
];

const dataTruthReportPath = "docs/requirements/pantavion-water-data-truth-report.md",
  "docs/requirements/pantavion-water-data-serving-strategy.md";

const requiredDataTruthReportMarkers = [
  "Google Earth KMZ file is the reference truth",
  "The water network must remain intact",
  "mobile file is allowed only as temporary preview/diagnostic material",
  "5000 features is temporary",
  "It is not final truth",
  "Full private master source from the reference KMZ",
  "No data loss",
  "bbox, vector tiles, PMTiles, MBTiles, PostGIS",
  "No data pipeline change without founder approval",
];


const forbiddenFinalTruthClaims = [
  {
    label: "mobile/preview/sample/subset/5000 described as final/full/master/complete truth",
    pattern: /\\b(mobile|preview|sample|sampled|subset|reduced|5000|5,000)\\b[\\s\\S]{0,140}\\b(final|full|master|complete|production truth|reference truth)\\b/i,
  },
  {
    label: "final/full/master/complete truth described as mobile/preview/sample/subset/5000",
    pattern: /\\b(final|full|master|complete|production truth|reference truth)\\b[\\s\\S]{0,140}\\b(mobile|preview|sample|sampled|subset|reduced|5000|5,000)\\b/i,
  },
  {
    label: "reduced or sampled data presented as production/final/truth",
    pattern: /\\b(reduced|sampled|subset|preview)\\b[\\s\\S]{0,140}\\b(production|final|truth|complete)\\b/i,
  },
];


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

console.log("=== Pantavion Water Kernel Gate v4 ===");

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


console.log("=== Data Truth Report Enforcement v3 ===");

if (!exists(dataTruthReportPath)) {
  fail("Data Truth Report missing: " + dataTruthReportPath);
} else {
  const report = fs.readFileSync(path.join(root, dataTruthReportPath), "utf8");

  for (const marker of requiredDataTruthReportMarkers) {
    if (report.includes(marker)) {
      pass("Data Truth Report marker present: " + marker);
    } else {
      fail("Data Truth Report marker missing: " + marker);
    }
  }
}


console.log("=== Data Serving Strategy Enforcement v4 ===");
const dataServingStrategyRelativePath = "docs/requirements/pantavion-water-data-serving-strategy.md";

if (exists(dataServingStrategyRelativePath)) {
  const dataServingStrategy = fs.readFileSync(path.join(root, dataServingStrategyRelativePath), "utf8");

  const dataServingRequiredMarkers = [
    "No renderer work may proceed before data serving strategy is locked",
    "The full master source must remain complete",
    "The browser must not load the entire raw water network at once",
    "current visible map area",
    "current zoom level",
    "current authorized access level",
    "current permitted network zone",
    "bbox API",
    "vector tiles",
    "PMTiles",
    "MBTiles",
    "PostGIS",
    "protected tile service",
    "The serving system must not expose raw KMZ, KML, full GeoJSON, or complete network exports publicly",
    "Raw export requires founder/admin approval",
    "Founder/admin approval is required before production serving implementation"
  ];

  for (const marker of dataServingRequiredMarkers) {
    if (dataServingStrategy.includes(marker)) {
      pass("Data Serving Strategy marker present: " + marker);
    } else {
      fail("Data Serving Strategy marker missing: " + marker);
    }
  }
}
console.log("=== Source Truth Claim Scan v2 ===");

for (const file of sourceTruthScanFiles) {
  if (!exists(file)) {
    warn("Source truth scan target missing or not yet implemented: " + file);
    continue;
  }

  const content = fs.readFileSync(path.join(root, file), "utf8");

  for (const rule of forbiddenFinalTruthClaims) {
    if (rule.pattern.test(content)) {
      fail("Forbidden final-truth claim in " + file + ": " + rule.label);
    }
  }

  pass("No forbidden final-truth claim in: " + file);
}

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
