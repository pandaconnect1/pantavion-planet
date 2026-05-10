const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const root = process.cwd();

const kmzPath = path.join(
  root,
  "data",
  "water-network-private",
  "source",
  "diktio_idreusis-authentic.kmz",
);

const ndjsonPath = path.join(
  root,
  "data",
  "water-network-private",
  "derived",
  "water-features.ndjson",
);

const manifestPath = path.join(
  root,
  "data",
  "water-network-private",
  "derived",
  "water-original-kml-style-manifest.json",
);

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

function kmlColorToCss(kmlColor) {
  const clean = String(kmlColor || "").trim();

  if (/^[0-9a-fA-F]{8}$/.test(clean)) {
    const alpha = clean.slice(0, 2);
    const blue = clean.slice(2, 4);
    const green = clean.slice(4, 6);
    const red = clean.slice(6, 8);

    return {
      colorKml: clean,
      color: `#${red}${green}${blue}`.toLowerCase(),
      opacity: Math.max(0.05, Math.min(1, parseInt(alpha, 16) / 255)),
    };
  }

  return {
    colorKml: clean || null,
    color: "#202020",
    opacity: 1,
  };
}

function extractKmlFromKmz() {
  if (!fs.existsSync(kmzPath)) {
    fail("Missing KMZ: " + kmzPath);
  }

  const temp = path.join(process.env.TEMP || process.env.TMP || ".", `pantavion-water-kmz-${Date.now()}`);
  fs.mkdirSync(temp, { recursive: true });

  const zipPath = path.join(temp, "source.zip");
  fs.copyFileSync(kmzPath, zipPath);

  cp.execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${temp.replace(/'/g, "''")}' -Force`,
    ],
    { stdio: "ignore" },
  );

  const stack = [temp];

  while (stack.length) {
    const current = stack.pop();

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name.toLowerCase().endsWith(".kml")) {
        return full;
      }
    }
  }

  fail("No KML found inside KMZ.");
}

function parseStyles(kml) {
  const styles = new Map();
  const styleRegex = /<Style\s+[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Style>/gi;
  let match;

  while ((match = styleRegex.exec(kml))) {
    const id = match[1];
    const block = match[2];
    const lineStyleMatch = block.match(/<LineStyle>([\s\S]*?)<\/LineStyle>/i);

    if (!lineStyleMatch) continue;

    const lineStyle = lineStyleMatch[1];
    const color = kmlColorToCss(extractFirst(lineStyle, "color"));
    const widthRaw = Number(extractFirst(lineStyle, "width"));

    styles.set(`#${id}`, {
      styleUrl: `#${id}`,
      colorKml: color.colorKml,
      color: color.color,
      opacity: color.opacity,
      weight: Number.isFinite(widthRaw) && widthRaw > 0 ? widthRaw : 1,
    });
  }

  return styles;
}

function parsePlacemarkStyleUrls(kml) {
  const urls = [];
  const placemarkRegex = /<Placemark(?:\s[^>]*)?>[\s\S]*?<\/Placemark>/gi;
  let match;

  while ((match = placemarkRegex.exec(kml))) {
    const block = match[0];
    urls.push(extractFirst(block, "styleUrl"));
  }

  return urls;
}

if (!fs.existsSync(ndjsonPath)) {
  fail("Missing private NDJSON: " + ndjsonPath);
}

const kmlPath = extractKmlFromKmz();
const kml = fs.readFileSync(kmlPath, "utf8").replace(/^\uFEFF/, "");

const styles = parseStyles(kml);
const styleUrls = parsePlacemarkStyleUrls(kml);

if (styleUrls.length !== 122857) {
  fail("Expected 122857 placemark style urls, got " + styleUrls.length);
}

if (styles.size === 0) {
  fail("No KML LineStyle entries found.");
}

const lines = fs.readFileSync(ndjsonPath, "utf8").split("\n").filter(Boolean);

if (lines.length !== 122857) {
  fail("Expected 122857 NDJSON pipe assets, got " + lines.length);
}

const output = [];
const usedColors = new Set();
let styled = 0;

for (let index = 0; index < lines.length; index += 1) {
  const feature = JSON.parse(lines[index]);
  const styleUrl = styleUrls[index];
  const style = styles.get(styleUrl) || {
    styleUrl,
    colorKml: null,
    color: "#202020",
    opacity: 1,
    weight: 1,
  };

  if (style.colorKml) styled += 1;
  usedColors.add(style.color);

  feature.properties = {
    ...(feature.properties || {}),
    sourceStyleUrl: styleUrl,
    kmlLineStyle: style,
    waterAssetKind: "water_pipe",
    waterAssetType: "water_pipe_segment",
    waterAssetGreek: "agogos_ydrefsis",
    semanticRule:
      "Every LineString from the source KMZ is a real water pipe segment. Renderer must preserve original KML style and must not force a fake color.",
  };

  output.push(JSON.stringify(feature));
}

fs.writeFileSync(ndjsonPath, output.join("\n") + "\n");

const manifest = {
  marker: "pantavion_water_original_kmz_pipe_styles_v1",
  pipeAssetCount: lines.length,
  placemarkStyleUrlCount: styleUrls.length,
  kmlLineStyleCount: styles.size,
  styledPipeCount: styled,
  uniqueRenderedColors: Array.from(usedColors).sort(),
  hardcodedCyanAllowed: false,
  originalKmlStylesPreserved: true,
  completeNetworkReturned: false,
  rawMasterReturned: false,
  createdAtIso: new Date().toISOString(),
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

if (styled <= 0) {
  fail("No styled pipe segments were created.");
}

pass("KML styles found: " + styles.size);
pass("Pipe assets styled: " + styled);
pass("Unique original colors: " + manifest.uniqueRenderedColors.join(", "));
pass("ORIGINAL KMZ PIPE STYLES APPLIED");
