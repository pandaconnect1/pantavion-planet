#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cp = require("child_process");

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "cxhulvwkagzufbjsdwwu";
const SUPABASE_URL = process.env.SUPABASE_URL || ("https://" + PROJECT_REF + ".supabase.co");
const KEY_FILE = process.env.SUPABASE_KEY_FILE;

const BUCKET = "personal-media";
const SOURCE_PATH =
  "water-network-private/source-masters/map-a-original/ccac8b6e5034aec6e8c3c4eb9b2638c4460027ae01fc974467e6692a47e72121/diktio_idreusis (1).kmz";
const SOURCE_SHA256 =
  "ccac8b6e5034aec6e8c3c4eb9b2638c4460027ae01fc974467e6692a47e72121";
const SOURCE_SIZE = 10854140;
const EXPECTED_PLACEMARKS = 122857;
const EXPECTED_LINESTRINGS = 125398;
const EXPECTED_COORDINATE_POINTS = 528063;
const TABLE = "water_map_a_live_features_full";
const STATUS_TABLE = "water_map_a_full_status";
const BATCH_SIZE = 400;

if (!KEY_FILE || !fs.existsSync(KEY_FILE)) {
  throw new Error("SUPABASE_KEY_FILE is missing.");
}

const serviceKey = fs.readFileSync(KEY_FILE, "utf8").trim();
if (serviceKey.length < 32) {
  throw new Error("Supabase service key is invalid.");
}

function apiHeaders(extra) {
  return Object.assign(
    {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
    },
    extra || {},
  );
}

function encodeStoragePath(value) {
  return value
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
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
  const match = block.match(
    new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">", "i"),
  );
  return match ? stripTags(match[1]) : "";
}

function extractAll(block, tag) {
  const regex = new RegExp(
    "<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">",
    "gi",
  );
  const values = [];
  let match;

  while ((match = regex.exec(block))) {
    values.push(match[1]);
  }

  return values;
}

function parseCoordinates(text) {
  const coordinates = [];
  let bad = 0;

  for (const item of String(text || "").trim().split(/\s+/).filter(Boolean)) {
    const parts = item.split(",").map(Number);
    const lng = parts[0];
    const lat = parts[1];
    const alt = parts[2];

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      bad += 1;
      continue;
    }

    coordinates.push(Number.isFinite(alt) ? [lng, lat, alt] : [lng, lat]);
  }

  return { coordinates, bad };
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

  for (const child of value) {
    collectPositions(child, output);
  }
}

function geometryPositions(geometry) {
  const positions = [];

  if (!geometry) return positions;

  if (
    geometry.type === "GeometryCollection" &&
    Array.isArray(geometry.geometries)
  ) {
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
  if (!positions.length) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const position of positions) {
    const lng = position[0];
    const lat = position[1];
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLng, minLat, maxLng, maxLat };
}

function parsePlacemark(block, id) {
  const geometries = [];
  let lineStrings = 0;
  let coordinatePoints = 0;
  let badCoordinates = 0;

  for (const lineStringBlock of extractAll(block, "LineString")) {
    lineStrings += 1;
    const parsed = parseCoordinates(extractFirst(lineStringBlock, "coordinates"));
    coordinatePoints += parsed.coordinates.length;
    badCoordinates += parsed.bad;

    if (parsed.coordinates.length >= 2) {
      geometries.push({
        type: "LineString",
        coordinates: parsed.coordinates,
      });
    }
  }

  for (const pointBlock of extractAll(block, "Point")) {
    const parsed = parseCoordinates(extractFirst(pointBlock, "coordinates"));
    coordinatePoints += parsed.coordinates.length;
    badCoordinates += parsed.bad;

    if (parsed.coordinates.length >= 1) {
      geometries.push({
        type: "Point",
        coordinates: parsed.coordinates[0],
      });
    }
  }

  for (const polygonBlock of extractAll(block, "Polygon")) {
    const rings = [];

    for (const coordinatesBlock of extractAll(polygonBlock, "coordinates")) {
      const parsed = parseCoordinates(coordinatesBlock);
      coordinatePoints += parsed.coordinates.length;
      badCoordinates += parsed.bad;

      if (parsed.coordinates.length >= 4) {
        rings.push(parsed.coordinates);
      }
    }

    if (rings.length) {
      geometries.push({
        type: "Polygon",
        coordinates: rings,
      });
    }
  }

  if (!geometries.length) {
    return {
      row: null,
      lineStrings,
      coordinatePoints,
      badCoordinates,
    };
  }

  const geometry =
    geometries.length === 1
      ? geometries[0]
      : {
          type: "GeometryCollection",
          geometries,
        };

  const feature = {
    type: "Feature",
    id,
    geometry,
    properties: {
      placemarkIndex: id,
      name: extractFirst(block, "name"),
      description: extractFirst(block, "description"),
      styleUrl: extractFirst(block, "styleUrl"),
      source: "authentic_map_a_kmz_ccac8b6e",
    },
  };

  const bounds = featureBounds(feature);
  if (!bounds) {
    return {
      row: null,
      lineStrings,
      coordinatePoints,
      badCoordinates,
    };
  }

  return {
    row: {
      id,
      min_lng: bounds.minLng,
      min_lat: bounds.minLat,
      max_lng: bounds.maxLng,
      max_lat: bounds.maxLat,
      feature,
      source_sha256: SOURCE_SHA256,
      updated_at: new Date().toISOString(),
    },
    lineStrings,
    coordinatePoints,
    badCoordinates,
  };
}

async function rest(pathname, options) {
  const response = await fetch(SUPABASE_URL + pathname, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      "Supabase REST failure " +
        response.status +
        " " +
        pathname +
        " " +
        text.slice(0, 500),
    );
  }

  return text;
}

async function updateStatus(status) {
  await rest("/rest/v1/" + STATUS_TABLE + "?on_conflict=id", {
    method: "POST",
    headers: apiHeaders({
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body: JSON.stringify([
      Object.assign(
        {
          id: "map_a_full",
          source_sha256: SOURCE_SHA256,
          source_size_bytes: SOURCE_SIZE,
          geometry_modified: false,
          coordinates_modified: false,
          layers_filtered: false,
          updated_at: new Date().toISOString(),
        },
        status,
      ),
    ]),
  });
}

async function main() {
  const tempDir = fs.mkdtempSync("/tmp/pantavion-map-a-full-");
  const kmzPath = path.join(tempDir, "map-a.kmz");
  const kmlPath = path.join(tempDir, "doc.kml");

  const objectUrl =
    SUPABASE_URL +
    "/storage/v1/object/authenticated/" +
    BUCKET +
    "/" +
    encodeStoragePath(SOURCE_PATH);

  const download = await fetch(objectUrl, {
    headers: apiHeaders(),
  });

  if (!download.ok) {
    throw new Error("Private KMZ download failed: HTTP " + download.status);
  }

  const bytes = Buffer.from(await download.arrayBuffer());
  fs.writeFileSync(kmzPath, bytes);

  if (bytes.length !== SOURCE_SIZE) {
    throw new Error(
      "Map A size mismatch: " + bytes.length + " != " + SOURCE_SIZE,
    );
  }

  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  if (sha !== SOURCE_SHA256) {
    throw new Error("Map A SHA mismatch: " + sha);
  }

  const entries = cp
    .execFileSync("unzip", ["-Z1", kmzPath], { encoding: "utf8" })
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  const kmlEntry = entries.find((entry) => /\.kml$/i.test(entry));
  if (!kmlEntry) {
    throw new Error("No KML entry found inside authentic KMZ.");
  }

  const kmlFd = fs.openSync(kmlPath, "w");
  try {
    cp.execFileSync("unzip", ["-p", kmzPath, kmlEntry], {
      stdio: ["ignore", kmlFd, "inherit"],
      maxBuffer: 1024 * 1024,
    });
  } finally {
    fs.closeSync(kmlFd);
  }

  const kml = fs.readFileSync(kmlPath, "utf8").replace(/^\uFEFF/, "");

  await updateStatus({
    status: "building",
    placemarks: 0,
    line_strings: 0,
    coordinate_points: 0,
    renderable_features: 0,
    bad_coordinates: 0,
  });

  await rest("/rest/v1/" + TABLE + "?id=gte.0", {
    method: "DELETE",
    headers: apiHeaders({
      Prefer: "return=minimal",
    }),
  });

  const placemarkRegex =
    /<Placemark(?:\s[^>]*)?>[\s\S]*?<\/Placemark>/gi;

  let match;
  let placemarks = 0;
  let lineStrings = 0;
  let coordinatePoints = 0;
  let renderableFeatures = 0;
  let badCoordinates = 0;
  let batch = [];

  async function flush() {
    if (!batch.length) return;

    const body = batch;
    batch = [];

    await rest("/rest/v1/" + TABLE + "?on_conflict=id", {
      method: "POST",
      headers: apiHeaders({
        "content-type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify(body),
    });
  }

  while ((match = placemarkRegex.exec(kml))) {
    const parsed = parsePlacemark(match[0], placemarks);

    lineStrings += parsed.lineStrings;
    coordinatePoints += parsed.coordinatePoints;
    badCoordinates += parsed.badCoordinates;

    if (parsed.row) {
      batch.push(parsed.row);
      renderableFeatures += 1;
    }

    placemarks += 1;

    if (batch.length >= BATCH_SIZE) {
      await flush();
    }

    if (placemarks % 10000 === 0) {
      await flush();
      await updateStatus({
        status: "building",
        placemarks,
        line_strings: lineStrings,
        coordinate_points: coordinatePoints,
        renderable_features: renderableFeatures,
        bad_coordinates: badCoordinates,
      });

      console.log(
        JSON.stringify({
          marker: "PANTAVION_MAP_A_FULL_PROGRESS",
          placemarks,
          lineStrings,
          coordinatePoints,
          renderableFeatures,
          badCoordinates,
        }),
      );
    }
  }

  await flush();

  const exact =
    placemarks === EXPECTED_PLACEMARKS &&
    lineStrings === EXPECTED_LINESTRINGS &&
    coordinatePoints === EXPECTED_COORDINATE_POINTS &&
    renderableFeatures === EXPECTED_PLACEMARKS &&
    badCoordinates === 0;

  await updateStatus({
    status: exact ? "ready_exact" : "ready_mismatch",
    placemarks,
    line_strings: lineStrings,
    coordinate_points: coordinatePoints,
    renderable_features: renderableFeatures,
    bad_coordinates: badCoordinates,
  });

  const manifest = {
    marker: "pantavion_water_map_a_full_authentic_index_v1",
    sourceFile: "diktio_idreusis (1).kmz",
    sourceSizeBytes: SOURCE_SIZE,
    sourceSha256: SOURCE_SHA256,
    placemarkCount: placemarks,
    lineStringCount: lineStrings,
    coordinatePointCount: coordinatePoints,
    renderableFeatureCount: renderableFeatures,
    badCoordinateCount: badCoordinates,
    expectedPlacemarkCount: EXPECTED_PLACEMARKS,
    expectedLineStringCount: EXPECTED_LINESTRINGS,
    expectedCoordinatePointCount: EXPECTED_COORDINATE_POINTS,
    exact,
    geometryModified: false,
    coordinatesModified: false,
    layersFiltered: false,
    sampleAsFinal: false,
    sourceMasterPreserved: true,
    generatedAt: new Date().toISOString(),
  };

  const manifestPath =
    "water-network-private/derived/water-map-a-full-authentic-index-manifest.json";

  const uploadUrl =
    SUPABASE_URL +
    "/storage/v1/object/" +
    BUCKET +
    "/" +
    encodeStoragePath(manifestPath);

  const upload = await fetch(uploadUrl, {
    method: "POST",
    headers: apiHeaders({
      "content-type": "application/json",
      "x-upsert": "true",
      "cache-control": "private, no-store",
    }),
    body: Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8"),
  });

  if (!upload.ok) {
    throw new Error(
      "Manifest upload failed: HTTP " +
        upload.status +
        " " +
        (await upload.text()).slice(0, 500),
    );
  }

  console.log(
    JSON.stringify({
      ok: exact,
      sourceSha256: SOURCE_SHA256,
      placemarks,
      lineStrings,
      coordinatePoints,
      renderableFeatures,
      badCoordinates,
      geometryModified: false,
      coordinatesModified: false,
      layersFiltered: false,
      stagingTable: TABLE,
      status: exact ? "ready_exact" : "ready_mismatch",
      privateManifestPath: manifestPath,
    }),
  );

  fs.rmSync(tempDir, { recursive: true, force: true });

  if (!exact) {
    process.exit(2);
  }
}

main().catch(async (error) => {
  try {
    await updateStatus({
      status: "failed",
      placemarks: 0,
      line_strings: 0,
      coordinate_points: 0,
      renderable_features: 0,
      bad_coordinates: 0,
    });
  } catch {}

  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
