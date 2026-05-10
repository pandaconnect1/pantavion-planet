const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/infrastructure/water/water-kernel-constitution.ts",
  "data/water-network-private/processed/water-network.geojson",
  "data/water-network-private/mobile/water-network-mobile.geojson",
  "docs/requirements/pantavion-water-data-truth-report.md",
  "docs/requirements/pantavion-water-full-master-strategy.md",
  "docs/requirements/pantavion-water-data-serving-strategy.md",
  "docs/requirements/pantavion-water-serving-architecture-decision.md",
  "core/infrastructure/water/water-serving-contract.ts",
  "core/infrastructure/water/controlled-water-access.ts",
  "core/infrastructure/water/water-access-control-readiness.ts",
  "core/infrastructure/water/water-authorized-person-store.ts",
  "core/infrastructure/water/controlled-water-serving-scaffold.ts",
  "core/infrastructure/water/water-spatial-serving-readiness.ts",
  "core/infrastructure/water/water-spatial-index.ts",
  "core/infrastructure/water/water-bbox-query-provider.ts",
  "core/infrastructure/water/water-audit-logging.ts",
  "app/api/professional/infrastructure/water/serving/readiness/route.ts",
  "app/api/professional/infrastructure/water/serving/bbox/route.ts",
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

const dataTruthReportPath = "docs/requirements/pantavion-water-data-truth-report.md";
const dataServingStrategyRelativePath = "docs/requirements/pantavion-water-data-serving-strategy.md";
const servingArchitectureDecisionRelativePath = "docs/requirements/pantavion-water-serving-architecture-decision.md";
const servingContractRelativePath = "core/infrastructure/water/water-serving-contract.ts";
const controlledServingScaffoldRelativePath = "core/infrastructure/water/controlled-water-serving-scaffold.ts";

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
  "Founder/admin approval is required before production serving implementation",
];

const servingArchitectureRequiredMarkers = [
  "controlled hybrid spatial-serving architecture",
  "The browser must never load the full raw water network directly",
  "Protected full master source",
  "Private processing pipeline",
  "Private spatial index",
  "Controlled serving API",
  "Renderer receives only permitted bbox/tile data",
  "PostGIS or equivalent spatial database",
  "protected bbox API",
  "protected vector tile service",
  "role/access filtering",
  "audit logging",
  "renderer: later, after serving and access controls are ready",
];

const servingContractRequiredMarkers = [
  "water-serving-contract-v1",
  "controlled-hybrid-spatial-serving",
  "postgis",
  "bbox-api",
  "vector-tiles",
  "protected-tile-service",
  "renderer-downstream-only",
  "The browser must never load the full raw water network directly",
  "founderApprovedProductionActivation",
  "Founder/admin approval is required before production activation",
];

const controlledServingRequiredMarkers = [
  "water-controlled-serving-scaffold-v1",
  "planControlledWaterServingRequest",
  "mayReturnRawMaster: false",
  "mayReturnCompleteNetwork: false",
  "Invalid bbox. Controlled serving requires a valid visible spatial area.",
  "Invalid zoom. Controlled serving requires a valid zoom level.",
  "Requester is not active.",
  "The full raw master network must never be returned to the browser.",
  "bbox-api",
];

const forbiddenFinalTruthClaims = [
  {
    label: "mobile/preview/sample/subset/5000 described as final/full/master/complete truth",
    pattern: /\b(mobile|preview|sample|sampled|subset|reduced|5000|5,000)\b[\s\S]{0,140}\b(final|full|master|complete|production truth|reference truth)\b/i,
  },
  {
    label: "final/full/master/complete truth described as mobile/preview/sample/subset/5000",
    pattern: /\b(final|full|master|complete|production truth|reference truth)\b[\s\S]{0,140}\b(mobile|preview|sample|sampled|subset|reduced|5000|5,000)\b/i,
  },
  {
    label: "reduced or sampled data presented as production/final/truth",
    pattern: /\b(reduced|sampled|subset|preview)\b[\s\S]{0,140}\b(production|final|truth|complete)\b/i,
  },
];

let failures = 0;
let warnings = 0;

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
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

function enforceMarkers(title, relativePath, markers) {
  console.log(title);

  if (!exists(relativePath)) {
    fail("Required enforcement file missing: " + relativePath);
    return;
  }

  const content = read(relativePath);

  for (const marker of markers) {
    if (content.includes(marker)) {
      pass("Marker present in " + relativePath + ": " + marker);
    } else {
      fail("Marker missing in " + relativePath + ": " + marker);
    }
  }
}

console.log("=== Pantavion Water Kernel Gate v17 ===");

for (const file of requiredFiles) {
  if (exists(file)) {
    pass("Required file exists: " + file);
  } else {
    fail("Required file missing: " + file);
  }
}

const constitutionPath = "core/infrastructure/water/water-kernel-constitution.ts";

if (exists(constitutionPath)) {
  const constitution = read(constitutionPath);

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

scanPublicGeodata(path.join(root, "public"));

enforceMarkers("=== Data Truth Report Enforcement v8 ===", dataTruthReportPath, requiredDataTruthReportMarkers);
enforceMarkers("=== Data Serving Strategy Enforcement v8 ===", dataServingStrategyRelativePath, dataServingRequiredMarkers);
enforceMarkers("=== Serving Architecture Decision Enforcement v8 ===", servingArchitectureDecisionRelativePath, servingArchitectureRequiredMarkers);
enforceMarkers("=== Serving Contract Enforcement v8 ===", servingContractRelativePath, servingContractRequiredMarkers);
enforceMarkers("=== Controlled Serving Scaffold Enforcement v8 ===", controlledServingScaffoldRelativePath, controlledServingRequiredMarkers);




console.log("=== Controlled Audit Logging Enforcement v13 ===");
const auditLoggingRelativePath = "core/infrastructure/water/water-audit-logging.ts";

if (exists(auditLoggingRelativePath)) {
  const auditLogging = read(auditLoggingRelativePath);

  const auditLoggingRequiredMarkers = [
    "water-audit-logging-v1",
    "evaluateWaterAuditLoggingReadiness",
    "createWaterAuditLogRecord",
    "durableAuditSinkAvailable",
    "retentionPolicyReady",
    "rawPayloadLoggingBlocked",
    "Founder/admin review must be required for production audit activation.",
    "mayLogRawNetworkPayload: false",
    "mayLogCompleteNetworkPayload: false",
    "rawPayloadStored: false",
    "completeNetworkPayloadStored: false"
  ];

  for (const marker of auditLoggingRequiredMarkers) {
    if (auditLogging.includes(marker)) {
      pass("Controlled Audit Logging marker present: " + marker);
    } else {
      fail("Controlled Audit Logging marker missing: " + marker);
    }
  }
}

console.log("=== Spatial Index Enforcement v16 ===");
const spatialIndexRelativePath = "core/infrastructure/water/water-spatial-index.ts";

if (exists(spatialIndexRelativePath)) {
  const spatialIndex = read(spatialIndexRelativePath);

  const spatialIndexRequiredMarkers = [
    "water-spatial-index-v1",
    "evaluateWaterSpatialIndexReadiness",
    "spatialIndexReady",
    "productionIndexAllowed",
    "indexBuiltFromFullMaster",
    "indexCoversCompleteNetwork",
    "duplicateStreetNameDisambiguationRequired",
    "Coordinate reference system must be declared before spatial indexing.",
    "Founder/admin approval is required before production spatial index activation.",
    "mayStoreRawNetworkPayload: false",
    "mayStoreCompleteNetworkPayload: false"
  ];

  for (const marker of spatialIndexRequiredMarkers) {
    if (spatialIndex.includes(marker)) {
      pass("Spatial Index marker present: " + marker);
    } else {
      fail("Spatial Index marker missing: " + marker);
    }
  }
}

console.log("=== BBOX Query Provider Enforcement v17 ===");
const bboxQueryProviderRelativePath = "core/infrastructure/water/water-bbox-query-provider.ts";

if (exists(bboxQueryProviderRelativePath)) {
  const bboxQueryProvider = read(bboxQueryProviderRelativePath);

  const bboxQueryProviderRequiredMarkers = [
    "water-bbox-query-provider-v1",
    "evaluateWaterBboxQueryProviderReadiness",
    "bboxQueryProviderReady",
    "productionBboxQueriesAllowed",
    "providerBackedByCompleteIndex",
    "viewportLimitEnforced",
    "zoomLimitEnforced",
    "accessFilteringRequired",
    "auditLoggingRequired",
    "BBOX query provider must preserve duplicate street-name and place/zone disambiguation rules.",
    "mayReturnRawMaster: false",
    "mayReturnCompleteNetwork: false",
    "mayBypassAccessFiltering: false"
  ];

  for (const marker of bboxQueryProviderRequiredMarkers) {
    if (bboxQueryProvider.includes(marker)) {
      pass("BBOX Query Provider marker present: " + marker);
    } else {
      fail("BBOX Query Provider marker missing: " + marker);
    }
  }
}
console.log("=== Spatial Serving Readiness Enforcement v12 ===");
const spatialServingReadinessRelativePath = "core/infrastructure/water/water-spatial-serving-readiness.ts";

if (exists(spatialServingReadinessRelativePath)) {
  const spatialServingReadiness = read(spatialServingReadinessRelativePath);

  const spatialServingReadinessRequiredMarkers = [
    "water-spatial-serving-readiness-v1",
    "evaluateWaterSpatialServingReadiness",
    "fullMasterSourceProtected",
    "spatialIndexAvailable",
    "bboxQueryProviderAvailable",
    "accessFilteringAvailable",
    "auditLoggingAvailable",
    "rawExportBlocked",
    "browserFullNetworkBlocked",
    "Founder/admin approval is required before production spatial serving activation.",
    "mayReturnRawMaster: false",
    "mayReturnCompleteNetwork: false"
  ];

  for (const marker of spatialServingReadinessRequiredMarkers) {
    if (spatialServingReadiness.includes(marker)) {
      pass("Spatial Serving Readiness marker present: " + marker);
    } else {
      fail("Spatial Serving Readiness marker missing: " + marker);
    }
  }
}
console.log("=== Serving Readiness Route Enforcement v9 ===");
const servingReadinessRouteRelativePath = "app/api/professional/infrastructure/water/serving/readiness/route.ts";

if (exists(servingReadinessRouteRelativePath)) {
  const servingReadinessRoute = read(servingReadinessRouteRelativePath);

  const servingReadinessRouteRequiredMarkers = [
    "water-serving-readiness-route-v1",
    "productionServingStatus: \"blocked\"",
    "rendererStatus: \"blocked\"",
    "mayReturnRawMaster: false",
    "mayReturnCompleteNetwork: false",
    "No water network data is returned by this route.",
    "Founder/admin approval is required before production activation",
    "spatialServingReady: false",
    "accessControlReady: false"
  ];

  for (const marker of servingReadinessRouteRequiredMarkers) {
    if (servingReadinessRoute.includes(marker)) {
      pass("Serving Readiness Route marker present: " + marker);
    } else {
      fail("Serving Readiness Route marker missing: " + marker);
    }
  }
}

console.log("=== Serving BBOX Route Enforcement v10 ===");
const servingBboxRouteRelativePath = "app/api/professional/infrastructure/water/serving/bbox/route.ts";

if (exists(servingBboxRouteRelativePath)) {
  const servingBboxRoute = read(servingBboxRouteRelativePath);

  const servingBboxRouteRequiredMarkers = [
    "water-serving-bbox-route-v1",
    "productionServingStatus: \"blocked\"",
    "rendererStatus: \"blocked\"",
    "dataReturned: false",
    "mayReturnRawMaster: false",
    "mayReturnCompleteNetwork: false",
    "No water network data is returned by this bbox route.",
    "Founder/admin approval is required before production activation",
    "spatialServingReady: false",
    "accessControlReady: false",
    "founderApprovedProductionActivation: false",
    "requestedViewport",
    "missingParameters",
    "bbox-api"
  ];

  for (const marker of servingBboxRouteRequiredMarkers) {
    if (servingBboxRoute.includes(marker)) {
      pass("Serving BBOX Route marker present: " + marker);
    } else {
      fail("Serving BBOX Route marker missing: " + marker);
    }
  }
}
console.log("=== Source Truth Claim Scan v8 ===");

for (const file of sourceTruthScanFiles) {
  if (!exists(file)) {
    warn("Source truth scan target missing or not yet implemented: " + file);
    continue;
  }

  const content = read(file);

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
