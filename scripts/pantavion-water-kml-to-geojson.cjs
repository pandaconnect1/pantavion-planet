const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const childProcess = require("child_process");

const ROOT = process.cwd();
const ORIGINAL_DIR = path.join(ROOT, "private-infrastructure", "water-network", "original");
const PROCESSED_DIR = path.join(ROOT, "data", "water-network-private", "processed");
const OUTPUT_FILE = path.join(PROCESSED_DIR, "water-network.geojson");
const MANIFEST_FILE = path.join(PROCESSED_DIR, "water-network-manifest.json");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function stripCdata(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .trim();
}

function stripTags(value) {
  return stripCdata(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function matchFirst(text, regex) {
  const match = text.match(regex);
  return match ? decodeXml(stripCdata(match[1])) : "";
}

function parseCoordinateText(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number))
    .filter((parts) => Number.isFinite(parts[0]) && Number.isFinite(parts[1]))
    .map((parts) => {
      const lon = parts[0];
      const lat = parts[1];
      const alt = Number.isFinite(parts[2]) ? parts[2] : undefined;
      return alt === undefined ? [lon, lat] : [lon, lat, alt];
    });
}

function classifyAsset(name, description, geometryType) {
  const text = `${name} ${description}`.toLowerCase();

  if (/valve|βάνα|βανα|vanna|vana|stopcock/.test(text)) return "valve";
  if (/meter|υδρόμετρο|υδρομετρο|hydrometer/.test(text)) return "meter";
  if (/service|connection|παροχή|παροχη|conn/.test(text)) return "service_connection";
  if (/main|central|κεντρ/.test(text)) return "central_main";
  if (/fitting|tee|bend|reducer|coupling|ταφ|γων/.test(text)) return "fitting";
  if (geometryType === "LineString") return "pipe";
  if (geometryType === "Point") return "point_asset";
  if (geometryType === "Polygon") return "area";
  return "unknown_asset";
}

function featureFromGeometry(type, coordinates, properties) {
  if (!coordinates || (Array.isArray(coordinates) && coordinates.length === 0)) return null;

  return {
    type: "Feature",
    geometry: {
      type,
      coordinates,
    },
    properties,
  };
}

function parsePlacemark(placemark, index, sourceFile) {
  const name = stripTags(matchFirst(placemark, /<name[^>]*>([\s\S]*?)<\/name>/i)) || `Asset ${index + 1}`;
  const description = stripTags(matchFirst(placemark, /<description[^>]*>([\s\S]*?)<\/description>/i));
  const styleUrl = stripTags(matchFirst(placemark, /<styleUrl[^>]*>([\s\S]*?)<\/styleUrl>/i));

  const baseProperties = {
    pantavionId: `WATER-KML-${String(index + 1).padStart(6, "0")}`,
    name,
    description,
    styleUrl,
    sourceFile,
    sourceType: "private-kml-import",
    officialStatus: "private_processed_pending_review",
    confidence: "source_file",
  };

  const pointMatch = placemark.match(/<Point[\s\S]*?<coordinates[^>]*>([\s\S]*?)<\/coordinates>[\s\S]*?<\/Point>/i);
  if (pointMatch) {
    const coords = parseCoordinateText(pointMatch[1]);
    const point = coords[0];
    return featureFromGeometry("Point", point, {
      ...baseProperties,
      pantavionAssetType: classifyAsset(name, description, "Point"),
    });
  }

  const lineMatch = placemark.match(/<LineString[\s\S]*?<coordinates[^>]*>([\s\S]*?)<\/coordinates>[\s\S]*?<\/LineString>/i);
  if (lineMatch) {
    const coords = parseCoordinateText(lineMatch[1]);
    return featureFromGeometry("LineString", coords, {
      ...baseProperties,
      pantavionAssetType: classifyAsset(name, description, "LineString"),
    });
  }

  const polygonMatch = placemark.match(/<Polygon[\s\S]*?<outerBoundaryIs[\s\S]*?<coordinates[^>]*>([\s\S]*?)<\/coordinates>[\s\S]*?<\/outerBoundaryIs>[\s\S]*?<\/Polygon>/i);
  if (polygonMatch) {
    const coords = parseCoordinateText(polygonMatch[1]);
    return featureFromGeometry("Polygon", [coords], {
      ...baseProperties,
      pantavionAssetType: classifyAsset(name, description, "Polygon"),
    });
  }

  return null;
}

function readKmlFromKmz(kmzPath) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pantavion-kmz-"));
  const zipPath = path.join(tmpDir, "source.zip");

  fs.copyFileSync(kmzPath, zipPath);

  try {
    if (process.platform === "win32") {
      const safeZip = zipPath.replace(/"/g, '""');
      const safeTmp = tmpDir.replace(/"/g, '""');
      const psCommand = `Expand-Archive -LiteralPath "${safeZip}" -DestinationPath "${safeTmp}" -Force`;

      childProcess.execFileSync("powershell.exe", ["-NoProfile", "-Command", psCommand], {
        stdio: "pipe",
      });
    } else {
      childProcess.execFileSync("unzip", ["-q", zipPath, "-d", tmpDir], {
        stdio: "pipe",
      });
    }
  } catch (error) {
    const stderr = error && error.stderr ? Buffer.from(error.stderr).toString("utf8") : "";
    const message = stderr || (error && error.message ? error.message : "Unknown KMZ extraction error");
    throw new Error(`Unable to extract KMZ private source. The file may be damaged or not a valid KMZ/ZIP container. ${message}`);
  }

  const kmlFiles = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".kml")) kmlFiles.push(full);
    }
  }

  walk(tmpDir);

  if (kmlFiles.length === 0) {
    throw new Error(`No KML file found inside KMZ: ${kmzPath}`);
  }

  return fs.readFileSync(kmlFiles[0], "utf8");
}
function findSourceFile() {
  ensureDir(ORIGINAL_DIR);

  const files = fs
    .readdirSync(ORIGINAL_DIR)
    .filter((name) => /\.(kml|kmz)$/i.test(name))
    .map((name) => path.join(ORIGINAL_DIR, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  return files[0] || null;
}

function convert() {
  ensureDir(ORIGINAL_DIR);
  ensureDir(PROCESSED_DIR);

  const sourceFilePath = findSourceFile();

  if (!sourceFilePath) {
    const empty = {
      type: "FeatureCollection",
      features: [],
      pantavion: {
        status: "no_private_source_file",
        message: "Place a real .kml or .kmz file in private-infrastructure/water-network/original/ and run this script again.",
        generatedAt: new Date().toISOString(),
      },
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(empty, null, 2), "utf8");
    fs.writeFileSync(
      MANIFEST_FILE,
      JSON.stringify(
        {
          status: "no_private_source_file",
          originalDir: ORIGINAL_DIR,
          outputFile: OUTPUT_FILE,
          generatedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      "utf8"
    );

    console.log("[Pantavion] No .kml or .kmz source found.");
    console.log(`[Pantavion] Created empty private layer: ${OUTPUT_FILE}`);
    return;
  }

  const sourceName = path.basename(sourceFilePath);
  const sourceExt = path.extname(sourceFilePath).toLowerCase();
  const kmlText = sourceExt === ".kmz" ? readKmlFromKmz(sourceFilePath) : fs.readFileSync(sourceFilePath, "utf8");

  const placemarks = [...kmlText.matchAll(/<Placemark\b[\s\S]*?<\/Placemark>/gi)].map((match) => match[0]);

  const features = placemarks
    .map((placemark, index) => parsePlacemark(placemark, index, sourceName))
    .filter(Boolean);

  const output = {
    type: "FeatureCollection",
    features,
    pantavion: {
      status: "private_processed_pending_review",
      sourceFile: sourceName,
      sourceSha256: sha256(sourceFilePath),
      featureCount: features.length,
      generatedAt: new Date().toISOString(),
      security: {
        rawFileExposed: false,
        publicFolder: false,
        gitStorage: false,
        privatePipeline: true,
      },
    },
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf8");
  fs.writeFileSync(
    MANIFEST_FILE,
    JSON.stringify(
      {
        status: "private_processed_pending_review",
        sourceFile: sourceName,
        sourceSha256: output.pantavion.sourceSha256,
        featureCount: features.length,
        outputFile: OUTPUT_FILE,
        generatedAt: output.pantavion.generatedAt,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`[Pantavion] Source: ${sourceName}`);
  console.log(`[Pantavion] Features converted: ${features.length}`);
  console.log(`[Pantavion] Private processed layer: ${OUTPUT_FILE}`);
  console.log("[Pantavion] Raw file remains private. Do not commit private-infrastructure or data/water-network-private.");
}

convert();
