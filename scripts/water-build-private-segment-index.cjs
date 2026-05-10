const fs = require("fs");
const path = require("path");

const root = process.cwd();

const masterPath = path.join(
  root,
  "data",
  "water-network-private",
  "processed",
  "water-network.geojson",
);

const derivedDir = path.join(root, "data", "water-network-private", "derived");
const ndjsonPath = path.join(derivedDir, "water-features.ndjson");
const indexPath = path.join(derivedDir, "water-feature-bbox-index.json");
const manifestPath = path.join(derivedDir, "water-segment-index-manifest.json");

function fail(message) {
  console.error("[FAIL] " + message);
  process.exit(1);
}

function pass(message) {
  console.log("[PASS] " + message);
}

function collectPositions(value, output) {
  if (!Array.isArray(value)) return;

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    output.push([value[0], value[1]]);
    return;
  }

  for (const child of value) collectPositions(child, output);
}

function geometryPositions(geometry) {
  const positions = [];

  if (!geometry) return positions;

  if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    for (const child of geometry.geometries) {
      positions.push(...geometryPositions(child));
    }

    return positions;
  }

  collectPositions(geometry.coordinates, positions);
  return positions;
}

function featureBounds(feature) {
  const positions = geometryPositions(feature.geometry);

  if (positions.length === 0) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of positions) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLng, minLat, maxLng, maxLat };
}

if (!fs.existsSync(masterPath)) {
  fail("Missing authentic private master: " + masterPath);
}

fs.mkdirSync(derivedDir, { recursive: true });

const collection = JSON.parse(fs.readFileSync(masterPath, "utf8"));

if (!collection || collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
  fail("Private master is not FeatureCollection.");
}

const fd = fs.openSync(ndjsonPath, "w");
const index = [];
let offset = 0;
let indexed = 0;
let skippedWithoutGeometry = 0;

for (let i = 0; i < collection.features.length; i += 1) {
  const feature = collection.features[i];
  const bounds = featureBounds(feature);

  if (!bounds) {
    skippedWithoutGeometry += 1;
    continue;
  }

  const line = JSON.stringify(feature) + "\n";
  const bytes = Buffer.byteLength(line);

  fs.writeSync(fd, line, null, "utf8");

  index.push({
    featureIndex: i,
    offset,
    bytes,
    minLng: bounds.minLng,
    minLat: bounds.minLat,
    maxLng: bounds.maxLng,
    maxLat: bounds.maxLat,
  });

  offset += bytes;
  indexed += 1;
}

fs.closeSync(fd);

fs.writeFileSync(indexPath, JSON.stringify(index));
fs.writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      marker: "pantavion_water_private_segment_index_from_authentic_kmz_v1",
      fullMasterFeatureCount: collection.features.length,
      indexedFeatureCount: indexed,
      skippedWithoutGeometry,
      indexBuiltFromFullMaster: true,
      sampleAsFinal: false,
      previewAsProduction: false,
      browserFullNetworkAllowed: false,
      rawMasterPublicExposureAllowed: false,
      createdAtIso: new Date().toISOString(),
    },
    null,
    2,
  ),
);

pass("Full master feature count: " + collection.features.length);
pass("Indexed feature count: " + indexed);
pass("Index written: " + indexPath);
