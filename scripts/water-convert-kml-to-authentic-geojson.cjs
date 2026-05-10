const fs = require("fs");
const path = require("path");

const root = process.cwd();

function fail(message) {
  console.error("[FAIL] " + message);
  process.exit(1);
}

function pass(message) {
  console.log("[PASS] " + message);
}

function stripTags(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirst(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripTags(match[1]) : "";
}

function extractAll(block, tag) {
  const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const values = [];
  let match;

  while ((match = regex.exec(block))) {
    values.push(match[1]);
  }

  return values;
}

function parseCoordinates(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const parts = item.split(",").map(Number);
      const lng = parts[0];
      const lat = parts[1];
      const alt = parts[2];

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

      return Number.isFinite(alt) ? [lng, lat, alt] : [lng, lat];
    })
    .filter(Boolean);
}

function placemarksFromKml(kml) {
  const regex = /<Placemark(?:\s[^>]*)?>[\s\S]*?<\/Placemark>/gi;
  const placemarks = [];
  let match;

  while ((match = regex.exec(kml))) {
    placemarks.push(match[0]);
  }

  return placemarks;
}

function geometriesFromPlacemark(block) {
  const geometries = [];

  for (const lineStringBlock of extractAll(block, "LineString")) {
    const coordinates = parseCoordinates(extractFirst(lineStringBlock, "coordinates"));
    if (coordinates.length >= 2) {
      geometries.push({ type: "LineString", coordinates });
    }
  }

  for (const pointBlock of extractAll(block, "Point")) {
    const coordinates = parseCoordinates(extractFirst(pointBlock, "coordinates"));
    if (coordinates.length >= 1) {
      geometries.push({ type: "Point", coordinates: coordinates[0] });
    }
  }

  for (const polygonBlock of extractAll(block, "Polygon")) {
    const rings = extractAll(polygonBlock, "coordinates")
      .map(parseCoordinates)
      .filter((ring) => ring.length >= 4);

    if (rings.length > 0) {
      geometries.push({ type: "Polygon", coordinates: rings });
    }
  }

  return geometries;
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

const sourcePath = path.resolve(process.argv[2] || "");

if (!sourcePath || !fs.existsSync(sourcePath)) {
  fail("Usage: node scripts/water-convert-kml-to-authentic-geojson.cjs <source.kml>");
}

const processedDir = path.join(root, "data", "water-network-private", "processed");
fs.mkdirSync(processedDir, { recursive: true });

const outputPath = path.join(processedDir, "water-network.geojson");
const manifestPath = path.join(processedDir, "water-network-authentic-source-manifest.json");

const kml = fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, "");
const placemarkBlocks = placemarksFromKml(kml);

if (placemarkBlocks.length === 0) {
  fail("No Placemarks found in KML source.");
}

const features = [];

for (let index = 0; index < placemarkBlocks.length; index += 1) {
  const block = placemarkBlocks[index];
  const geometries = geometriesFromPlacemark(block);

  if (geometries.length === 0) continue;

  const geometry =
    geometries.length === 1
      ? geometries[0]
      : { type: "GeometryCollection", geometries };

  features.push({
    type: "Feature",
    id: index,
    geometry,
    properties: {
      placemarkIndex: index,
      name: extractFirst(block, "name"),
      description: extractFirst(block, "description"),
      styleUrl: extractFirst(block, "styleUrl"),
      source: "authentic_kmz_kml_reference",
    },
  });
}

if (features.length === 0) {
  fail("No features with geometry were created from KML.");
}

const bounds = features
  .map(featureBounds)
  .filter(Boolean)
  .reduce(
    (acc, item) => ({
      minLng: Math.min(acc.minLng, item.minLng),
      minLat: Math.min(acc.minLat, item.minLat),
      maxLng: Math.max(acc.maxLng, item.maxLng),
      maxLat: Math.max(acc.maxLat, item.maxLat),
    }),
    { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity },
  );

fs.writeFileSync(
  outputPath,
  JSON.stringify({
    type: "FeatureCollection",
    features,
  }),
);

fs.writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      marker: "pantavion_water_authentic_kmz_kml_source_v1",
      sourcePath,
      outputPath: "data/water-network-private/processed/water-network.geojson",
      placemarkCount: placemarkBlocks.length,
      featureCount: features.length,
      bounds,
      sourceTruth: "Google Earth KMZ/KML reference",
      sampleAsFinal: false,
      previewAsProduction: false,
      fullMasterPreserved: true,
      browserFullNetworkAllowed: false,
      createdAtIso: new Date().toISOString(),
    },
    null,
    2,
  ),
);

pass("Authentic KML source: " + sourcePath);
pass("Placemark count: " + placemarkBlocks.length);
pass("GeoJSON feature count: " + features.length);
pass("Bounds: " + JSON.stringify(bounds));
pass("Written: " + outputPath);
