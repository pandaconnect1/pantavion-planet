#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cp = require("child_process");

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "cxhulvwkagzufbjsdwwu";
const SUPABASE_URL =
  process.env.SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;
const KEY_FILE = process.env.SUPABASE_KEY_FILE;

const BUCKET = "personal-media";
const SOURCE_PATH =
  "water-network-private/source-masters/map-a-original/ccac8b6e5034aec6e8c3c4eb9b2638c4460027ae01fc974467e6692a47e72121/diktio_idreusis (1).kmz";
const SOURCE_SHA256 =
  "ccac8b6e5034aec6e8c3c4eb9b2638c4460027ae01fc974467e6692a47e72121";
const SOURCE_SIZE = 10854140;
const EXPECTED_PLACEMARKS = 122857;
const EXPECTED_LINESTRINGS = 125398;

if (!KEY_FILE || !fs.existsSync(KEY_FILE)) {
  throw new Error("SUPABASE_KEY_FILE is missing.");
}

const serviceKey = fs.readFileSync(KEY_FILE, "utf8").trim();
if (serviceKey.length < 32) {
  throw new Error("Supabase service key is invalid.");
}

function apiHeaders(extra = {}) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    ...extra,
  };
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
  const m = block.match(
    new RegExp(`<${tag}(?:\\\\s[^>]*)?>([\\\\s\\\\S]*?)<\\\\/${tag}>`, "i"),
  );
  return m ? stripTags(m[1]) : "";
}

function kmlColorToCss(raw) {
  const clean = String(raw || "").trim();

  if (!/^[0-9a-fA-F]{8}$/.test(clean)) {
    return {
      colorKml: clean || null,
      color: null,
      opacity: null,
    };
  }

  const alpha = clean.slice(0, 2);
  const blue = clean.slice(2, 4);
  const green = clean.slice(4, 6);
  const red = clean.slice(6, 8);

  return {
    colorKml: clean.toLowerCase(),
    color: `#${red}${green}${blue}`.toLowerCase(),
    opacity: parseInt(alpha, 16) / 255,
  };
}

function parseStyleBlock(id, block) {
  const lineStyle =
    (block.match(/<LineStyle>([\s\S]*?)<\/LineStyle>/i) || [])[1] || "";
  const iconStyle =
    (block.match(/<IconStyle>([\s\S]*?)<\/IconStyle>/i) || [])[1] || "";
  const polyStyle =
    (block.match(/<PolyStyle>([\s\S]*?)<\/PolyStyle>/i) || [])[1] || "";
  const labelStyle =
    (block.match(/<LabelStyle>([\s\S]*?)<\/LabelStyle>/i) || [])[1] || "";

  const lineColor = kmlColorToCss(extractFirst(lineStyle, "color"));
  const widthRaw = Number(extractFirst(lineStyle, "width"));
  const iconColor = kmlColorToCss(extractFirst(iconStyle, "color"));
  const polyColor = kmlColorToCss(extractFirst(polyStyle, "color"));
  const labelColor = kmlColorToCss(extractFirst(labelStyle, "color"));

  return {
    styleUrl: `#${id}`,
    line: {
      colorKml: lineColor.colorKml,
      color: lineColor.color,
      opacity: lineColor.opacity,
      width: Number.isFinite(widthRaw) && widthRaw > 0 ? widthRaw : null,
      colorMode: extractFirst(lineStyle, "colorMode") || null,
    },
    icon: {
      colorKml: iconColor.colorKml,
      color: iconColor.color,
      opacity: iconColor.opacity,
      scale: Number(extractFirst(iconStyle, "scale")) || null,
      heading: Number(extractFirst(iconStyle, "heading")) || null,
      href: extractFirst(iconStyle, "href") || null,
    },
    poly: {
      colorKml: polyColor.colorKml,
      color: polyColor.color,
      opacity: polyColor.opacity,
      fill: extractFirst(polyStyle, "fill") || null,
      outline: extractFirst(polyStyle, "outline") || null,
    },
    label: {
      colorKml: labelColor.colorKml,
      color: labelColor.color,
      opacity: labelColor.opacity,
      scale: Number(extractFirst(labelStyle, "scale")) || null,
    },
    rawStyleXml: `<Style id="${id}">${block}</Style>`,
  };
}

function parseStyles(kml) {
  const direct = new Map();
  const styleRegex =
    /<Style\s+[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Style>/gi;
  let m;

  while ((m = styleRegex.exec(kml))) {
    direct.set(`#${m[1]}`, parseStyleBlock(m[1], m[2]));
  }

  const maps = new Map();
  const mapRegex =
    /<StyleMap\s+[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/StyleMap>/gi;

  while ((m = mapRegex.exec(kml))) {
    const id = `#${m[1]}`;
    const body = m[2];
    const pairRegex = /<Pair>([\s\S]*?)<\/Pair>/gi;
    const pairs = [];
    let p;

    while ((p = pairRegex.exec(body))) {
      const key = extractFirst(p[1], "key");
      const styleUrl = extractFirst(p[1], "styleUrl");
      if (key && styleUrl) pairs.push({ key, styleUrl });
    }

    maps.set(id, {
      styleUrl: id,
      pairs,
      rawStyleMapXml: `<StyleMap id="${m[1]}">${body}</StyleMap>`,
    });
  }

  return { direct, maps };
}

function resolveStyle(styleUrl, direct, maps, stack = new Set()) {
  if (direct.has(styleUrl)) {
    return {
      resolvedFrom: styleUrl,
      style: direct.get(styleUrl),
    };
  }

  if (stack.has(styleUrl)) return null;
  stack.add(styleUrl);

  const map = maps.get(styleUrl);
  if (!map) return null;

  const target =
    map.pairs.find((pair) => pair.key === "normal")?.styleUrl ||
    map.pairs[0]?.styleUrl;

  if (!target) return null;

  const resolved = resolveStyle(target, direct, maps, stack);
  if (!resolved) return null;

  return {
    resolvedFrom: target,
    style: resolved.style,
    styleMap: map,
  };
}

async function main() {
  const tempDir = fs.mkdtempSync("/tmp/pantavion-map-a-styles-");
  const kmzPath = path.join(tempDir, "map-a.kmz");
  const kmlPath = path.join(tempDir, "doc.kml");

  const objectUrl =
    `${SUPABASE_URL}/storage/v1/object/authenticated/${BUCKET}/${encodeStoragePath(SOURCE_PATH)}`;

  const download = await fetch(objectUrl, {
    headers: apiHeaders(),
  });

  if (!download.ok) {
    throw new Error(
      `Private KMZ download failed: HTTP ${download.status}`,
    );
  }

  const bytes = Buffer.from(await download.arrayBuffer());
  fs.writeFileSync(kmzPath, bytes);

  if (bytes.length !== SOURCE_SIZE) {
    throw new Error(
      `Map A size mismatch: ${bytes.length} != ${SOURCE_SIZE}`,
    );
  }

  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  if (sha !== SOURCE_SHA256) {
    throw new Error(`Map A SHA mismatch: ${sha}`);
  }

  const entries = cp
    .execFileSync("unzip", ["-Z1", kmzPath], { encoding: "utf8" })
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  const kmlEntry = entries.find((entry) => /\.kml$/i.test(entry));
  if (!kmlEntry) throw new Error("No KML entry found inside authentic KMZ.");

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

  const placemarkCount = (kml.match(/<Placemark(?:\s[^>]*)?>/gi) || []).length;
  const lineStringCount = (kml.match(/<LineString(?:\s[^>]*)?>/gi) || []).length;

  if (placemarkCount !== EXPECTED_PLACEMARKS) {
    throw new Error(
      `Placemark count mismatch: ${placemarkCount} != ${EXPECTED_PLACEMARKS}`,
    );
  }

  if (lineStringCount !== EXPECTED_LINESTRINGS) {
    throw new Error(
      `LineString count mismatch: ${lineStringCount} != ${EXPECTED_LINESTRINGS}`,
    );
  }

  const { direct, maps } = parseStyles(kml);

  const usedStyleUrls = new Set();
  const placemarkRegex =
    /<Placemark(?:\s[^>]*)?>([\s\S]*?)<\/Placemark>/gi;
  let pm;

  while ((pm = placemarkRegex.exec(kml))) {
    const styleUrl = extractFirst(pm[1], "styleUrl");
    if (styleUrl) usedStyleUrls.add(styleUrl);
  }

  const rows = [];
  const unresolved = [];

  for (const styleUrl of [...usedStyleUrls].sort()) {
    const resolved = resolveStyle(styleUrl, direct, maps);

    if (!resolved) {
      unresolved.push(styleUrl);
      continue;
    }

    const style = resolved.style;
    rows.push({
      style_url: styleUrl,
      color_kml: style.line.colorKml,
      color_css: style.line.color,
      opacity: style.line.opacity,
      width: style.line.width,
      line_style: {
        ...style,
        requestedStyleUrl: styleUrl,
        resolvedFrom: resolved.resolvedFrom,
        styleMap: resolved.styleMap || null,
      },
      source_sha256: SOURCE_SHA256,
      updated_at: new Date().toISOString(),
    });
  }

  if (unresolved.length) {
    throw new Error(
      `Unresolved KML style URLs: ${unresolved.join(", ")}`,
    );
  }

  if (!rows.length) {
    throw new Error("No used KML styles were resolved.");
  }

  const restUrl =
    `${SUPABASE_URL}/rest/v1/water_map_a_kml_styles?on_conflict=style_url`;

  for (let offset = 0; offset < rows.length; offset += 200) {
    const part = rows.slice(offset, offset + 200);
    const response = await fetch(restUrl, {
      method: "POST",
      headers: apiHeaders({
        "content-type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify(part),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `KML style upsert failed: HTTP ${response.status} ${body}`,
      );
    }
  }

  const manifest = {
    marker: "pantavion_water_map_a_authentic_kml_styles_v2",
    sourceFile: "diktio_idreusis (1).kmz",
    sourceSizeBytes: SOURCE_SIZE,
    sourceSha256: SOURCE_SHA256,
    placemarkCount,
    lineStringCount,
    directStyleCount: direct.size,
    styleMapCount: maps.size,
    usedStyleUrlCount: usedStyleUrls.size,
    resolvedUsedStyleCount: rows.length,
    unresolvedUsedStyleUrls: unresolved,
    geometryModified: false,
    coordinatesModified: false,
    layersFiltered: false,
    stylesPreservedFromSource: true,
    generatedAt: new Date().toISOString(),
    usedStyles: rows.map((row) => ({
      styleUrl: row.style_url,
      resolvedFrom: row.line_style.resolvedFrom,
      line: row.line_style.line,
      icon: row.line_style.icon,
      poly: row.line_style.poly,
      label: row.line_style.label,
    })),
  };

  const manifestBody = Buffer.from(
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );

  const manifestPath =
    "water-network-private/derived/water-original-kml-style-manifest.json";
  const manifestUrl =
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeStoragePath(manifestPath)}`;

  const upload = await fetch(manifestUrl, {
    method: "POST",
    headers: apiHeaders({
      "content-type": "application/json",
      "x-upsert": "true",
      "cache-control": "private, no-store",
    }),
    body: manifestBody,
  });

  if (!upload.ok) {
    const body = await upload.text();
    throw new Error(
      `Private style manifest upload failed: HTTP ${upload.status} ${body}`,
    );
  }

  console.log(
    JSON.stringify({
      ok: true,
      sourceSha256: SOURCE_SHA256,
      placemarkCount,
      lineStringCount,
      directStyleCount: direct.size,
      styleMapCount: maps.size,
      usedStyleUrlCount: usedStyleUrls.size,
      resolvedUsedStyleCount: rows.length,
      geometryModified: false,
      coordinatesModified: false,
      layersFiltered: false,
      privateManifestPath: manifestPath,
    }),
  );

  fs.rmSync(tempDir, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
