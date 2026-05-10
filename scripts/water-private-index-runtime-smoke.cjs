const fs = require("fs");
const path = require("path");

const root = process.cwd();

const truthPath = path.join(root, "data", "water-network-private", "processed", "water-source-truth-report.json");
const manifestPath = path.join(root, "data", "water-network-private", "derived", "water-segment-index-manifest.json");
const indexPath = path.join(root, "data", "water-network-private", "derived", "water-feature-bbox-index.json");
const ndjsonPath = path.join(root, "data", "water-network-private", "derived", "water-features.ndjson");

function fail(message) {
  console.error("[FAIL] " + message);
  process.exit(1);
}

function pass(message) {
  console.log("[PASS] " + message);
}

for (const file of [truthPath, manifestPath, indexPath, ndjsonPath]) {
  if (!fs.existsSync(file)) fail("Missing private runtime file: " + file);
  pass("Found: " + path.relative(root, file));
}

const truth = JSON.parse(fs.readFileSync(truthPath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

if (truth.placemarks !== 122857) fail("Bad placemarks: " + truth.placemarks);
if (truth.lineStrings !== 125398) fail("Bad lineStrings: " + truth.lineStrings);
if (truth.coordinatePoints !== 528063) fail("Bad coordinatePoints: " + truth.coordinatePoints);
if (truth.badCoordinates !== 0) fail("Bad coordinates: " + truth.badCoordinates);
if (!truth.checks.looksLikeCyprusWgs84) fail("Bad WGS84/Cyprus truth check");

if (!manifest.indexBuiltFromFullMaster) fail("Index is not built from full master");
if (manifest.fullMasterFeatureCount !== 122857) fail("Bad fullMasterFeatureCount: " + manifest.fullMasterFeatureCount);
if (manifest.indexRecordCount !== 122857) fail("Bad indexRecordCount: " + manifest.indexRecordCount);
if (manifest.sampleAsFinal !== false) fail("sampleAsFinal is not false");
if (manifest.previewAsProduction !== false) fail("previewAsProduction is not false");
if (manifest.browserFullNetworkAllowed !== false) fail("browserFullNetworkAllowed is not false");

if (index.length !== 122857) fail("Runtime index length mismatch: " + index.length);

const bbox = {
  minLng: 33.015,
  minLat: 34.668,
  maxLng: 33.055,
  maxLat: 34.700,
};

function intersects(record) {
  return (
    record.minLng <= bbox.maxLng &&
    record.maxLng >= bbox.minLng &&
    record.minLat <= bbox.maxLat &&
    record.maxLat >= bbox.minLat
  );
}

const matches = index.filter(intersects);
if (matches.length === 0) fail("No index matches for Limassol test bbox");

const fd = fs.openSync(ndjsonPath, "r");
let decoded = 0;

try {
  for (const record of matches.slice(0, 25)) {
    const buffer = Buffer.alloc(record.bytes);
    fs.readSync(fd, buffer, 0, record.bytes, record.offset);
    const feature = JSON.parse(buffer.toString("utf8"));

    if (!feature || feature.type !== "Feature" || !feature.geometry) {
      fail("Invalid feature decoded from ndjson");
    }

    decoded += 1;
  }
} finally {
  fs.closeSync(fd);
}

if (decoded === 0) fail("No decoded features");

pass("Truth placemarks: " + truth.placemarks);
pass("Truth LineStrings: " + truth.lineStrings);
pass("Truth coordinate points: " + truth.coordinatePoints);
pass("Index records: " + index.length);
pass("Matching bbox records: " + matches.length);
pass("Decoded sample features: " + decoded);
pass("PRIVATE INDEX RUNTIME SMOKE PASSED");
