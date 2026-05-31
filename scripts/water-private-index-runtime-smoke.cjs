const fs = require("fs");
const path = require("path");

const requiredFiles = {
  truthReport: "data/water-network-private/processed/water-source-truth-report.json",
  segmentManifest: "data/water-network-private/derived/water-segment-index-manifest.json",
  bboxIndex: "data/water-network-private/derived/water-feature-bbox-index.json",
  featuresNdjson: "data/water-network-private/derived/water-features.ndjson",
};

function fail(message) {
  console.error(`[FAIL] ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`[PASS] ${message}`);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Cannot read JSON ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

for (const filePath of Object.values(requiredFiles)) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing required private water index file: ${filePath}`);
  }
  pass(`Found: ${filePath}`);
}

const truth = readJson(requiredFiles.truthReport);
const manifest = readJson(requiredFiles.segmentManifest);

const placemarks = Number(truth.placemarks ?? truth.expected?.placemarks ?? 0);
const truthLineStrings = Number(truth.lineStrings ?? truth.expected?.lineStrings ?? 0);
const coordinatePoints = Number(truth.coordinatePoints ?? truth.expected?.coordinatePoints ?? 0);

const indexRecordCount = Number(
  manifest.indexRecordCount ??
  manifest.recordCount ??
  manifest.segmentCount ??
  manifest.totalMasterPipeCount ??
  manifest.totalPipeCount ??
  manifest.count ??
  0
);

if (!Number.isFinite(placemarks) || placemarks < 100000) {
  fail(`Bad truth placemark count: ${placemarks}`);
}

if (!Number.isFinite(truthLineStrings) || truthLineStrings < 100000) {
  fail(`Bad truth lineString count: ${truthLineStrings}`);
}

if (!Number.isFinite(coordinatePoints) || coordinatePoints < 100000) {
  fail(`Bad truth coordinate point count: ${coordinatePoints}`);
}

if (!Number.isFinite(indexRecordCount) || indexRecordCount < 100000) {
  fail(`Bad indexRecordCount: ${indexRecordCount}`);
}

if (indexRecordCount > truthLineStrings) {
  fail(`indexRecordCount cannot exceed truth lineStrings: ${indexRecordCount} > ${truthLineStrings}`);
}

const checks = truth.checks || {};
if (checks.sampleAsFinal === true) {
  fail("Truth report marks sampleAsFinal=true");
}

if (checks.publicGeodata === true) {
  fail("Truth report marks publicGeodata=true");
}

if (checks.mobilePreviewAsProduction === true) {
  fail("Truth report marks mobilePreviewAsProduction=true");
}

const ndjsonStats = fs.statSync(requiredFiles.featuresNdjson);
if (ndjsonStats.size < 1024 * 1024) {
  fail(`Derived NDJSON is suspiciously small: ${ndjsonStats.size} bytes`);
}

pass(`Truth placemarks: ${placemarks}`);
pass(`Truth lineStrings: ${truthLineStrings}`);
pass(`Private renderable pipe/index records: ${indexRecordCount}`);
pass(`Coordinate points: ${coordinatePoints}`);
pass("Private index count is allowed to be lower than total truth lineStrings because it represents renderable pipe/network index records, not every raw KMZ/DWG/DXF entity.");
pass("Water private index runtime smoke passed.");
