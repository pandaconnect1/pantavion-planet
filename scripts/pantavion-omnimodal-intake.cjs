const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const kernelDir = path.join(root, ".pantavion", "kernel");
const dbPath = path.join(kernelDir, "omnimodal-intake.json");

const registry = [
  [".txt", "text", "Plain text", "stored_raw"],
  [".md", "text", "Markdown", "stored_raw"],
  [".json", "text", "JSON", "stored_raw"],
  [".csv", "spreadsheet", "CSV", "stored_raw"],
  [".pdf", "document", "PDF", "stored_raw_readonly_preserve"],
  [".docx", "document", "Word document", "stored_raw"],
  [".xlsx", "spreadsheet", "Excel workbook", "stored_raw"],
  [".pptx", "presentation", "PowerPoint presentation", "stored_raw"],
  [".png", "image", "PNG image", "stored_raw"],
  [".jpg", "image", "JPEG image", "stored_raw"],
  [".jpeg", "image", "JPEG image", "stored_raw"],
  [".mp3", "audio", "MP3 audio", "stored_raw"],
  [".wav", "audio", "WAV audio", "stored_raw"],
  [".mp4", "video", "MP4 video", "stored_raw"],
  [".mov", "video", "MOV video", "stored_raw"],
  [".dwg", "cad", "AutoCAD DWG", "stored_raw_readonly_preserve"],
  [".dxf", "cad", "AutoCAD DXF", "stored_raw_readonly_preserve"],
  [".kml", "gis", "KML map", "stored_raw_readonly_preserve"],
  [".kmz", "gis", "KMZ map archive", "stored_raw_readonly_preserve"],
  [".geojson", "gis", "GeoJSON", "stored_raw"]
];

function safeFileName(input) {
  return String(input || "upload.bin")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 140) || "upload.bin";
}

function extensionOf(input) {
  return path.extname(String(input || "")).toLowerCase() || "unknown";
}

function detect(filePath) {
  const ext = extensionOf(filePath);
  const found = registry.find((entry) => entry[0] === ext);

  if (!found) {
    return {
      extension: ext,
      category: "unknown",
      label: "Unknown or new market format",
      supportStatus: "requires_adapter",
      policy: "Store original bytes safely and mark requires_adapter. No fake parsing or viewing is allowed."
    };
  }

  const [extension, category, label, supportStatus] = found;
  return {
    extension,
    category,
    label,
    supportStatus,
    policy:
      extension === ".dwg"
        ? "Store exact original DWG bytes only. No conversion, no layer filtering, no color/text/arrow removal, no GeoJSON replacement as original truth."
        : "Store original bytes. Later processing requires an explicit adapter and audit."
  };
}

function blockReason(filePath) {
  const lower = path.basename(filePath).toLowerCase();
  const ext = extensionOf(filePath);
  const sensitiveExtensions = [".env", ".pem", ".key", ".p12", ".pfx", ".sqlite", ".db"];

  if (sensitiveExtensions.includes(ext)) {
    return `Sensitive extension is blocked: ${ext}`;
  }

  // path.extname returns "" for bare dotfiles (e.g. ".env"), so match the
  // basename directly to catch files literally named after a sensitive extension.
  for (const sensitive of sensitiveExtensions) {
    if (lower === sensitive || lower.endsWith(sensitive)) {
      return `Sensitive extension is blocked: ${sensitive}`;
    }
  }

  for (const fragment of ["password", "credential", "private_key", "secret_key", "api_key"]) {
    if (lower.includes(fragment)) return `Sensitive filename fragment is blocked: ${fragment}`;
  }

  return null;
}

async function hashFile(filePath) {
  const hash = crypto.createHash("sha256");

  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });

  return hash.digest("hex");
}

async function readDb() {
  try {
    return JSON.parse(await fsp.readFile(dbPath, "utf8"));
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), records: [] };
  }
}

async function main() {
  const filePath = process.argv[2];
  const purpose = process.argv.slice(3).join(" ").trim() || undefined;

  if (!filePath) {
    console.error("Usage: node scripts/pantavion-omnimodal-intake.cjs <file-path> [purpose]");
    process.exit(1);
  }

  const absolute = path.resolve(root, filePath);

  if (!fs.existsSync(absolute)) {
    throw new Error(`File not found: ${absolute}`);
  }

  await fsp.mkdir(kernelDir, { recursive: true });

  const stat = await fsp.stat(absolute);

  if (!stat.isFile()) {
    throw new Error(`Not a file: ${absolute}`);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const originalName = path.basename(absolute);
  const safeName = safeFileName(originalName);
  const detected = detect(originalName);
  const reason = blockReason(originalName);
  const sha256 = await hashFile(absolute);

  let objectRelativePath;
  let supportStatus = detected.supportStatus;
  let processingStatus =
    supportStatus === "requires_adapter"
      ? "requires_adapter"
      : supportStatus === "stored_raw_readonly_preserve"
        ? "ready_for_viewer_adapter"
        : "stored_only";

  if (reason) {
    supportStatus = "blocked_sensitive";
    processingStatus = "blocked";
  } else {
    const datePath = now.slice(0, 7).replace("-", path.sep);
    const objectDir = path.join(kernelDir, "omnimodal", "objects", datePath);
    await fsp.mkdir(objectDir, { recursive: true });

    const target = path.join(objectDir, `${id}-${safeName}`);
    await fsp.copyFile(absolute, target);
    objectRelativePath = path.relative(root, target).replaceAll("\\", "/");
  }

  const safetyZone =
    supportStatus === "blocked_sensitive"
      ? "Z4_BLOCKED_MANUAL_ONLY"
      : detected.category === "cad" || detected.category === "gis"
        ? "Z3_FOUNDER_APPROVAL_REQUIRED"
        : detected.category === "audio" || detected.category === "video" || detected.category === "unknown"
          ? "Z2_PREVIEW_REQUIRED"
          : "Z1_AUTO_SAFE";

  const record = {
    id,
    version: 1,
    createdAt: now,
    updatedAt: now,
    actor: "local-script",
    source: "local_script",
    originalName,
    safeName,
    mimeType: "application/octet-stream",
    extension: detected.extension,
    category: detected.category,
    label: detected.label,
    byteSize: stat.size,
    sha256,
    supportStatus,
    processingStatus,
    safetyZone,
    quarantineReason: reason || undefined,
    objectRelativePath,
    declaredPurpose: purpose,
    preservationPolicy: detected.policy,
    recommendation:
      detected.category === "cad"
        ? "Stored exact CAD original. Use read-only CAD viewer adapter only. Never replace original with derived map."
        : supportStatus === "requires_adapter"
          ? "Stored original bytes and marked requires_adapter."
          : "Stored original bytes. Later processing requires explicit adapter and audit."
  };

  const db = await readDb();
  db.records = [record, ...(Array.isArray(db.records) ? db.records : [])].slice(0, 500);
  db.updatedAt = new Date().toISOString();

  await fsp.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");

  await fsp.appendFile(
    path.join(kernelDir, "omnimodal-intake-audit.jsonl"),
    `${JSON.stringify({
      type: "kernel.omnimodal_intake.created",
      createdAt: new Date().toISOString(),
      intakeId: record.id,
      originalName: record.originalName,
      extension: record.extension,
      category: record.category,
      byteSize: record.byteSize,
      sha256: record.sha256,
      supportStatus: record.supportStatus,
      safetyZone: record.safetyZone
    })}\n`,
    "utf8"
  );

  console.log(JSON.stringify({ ok: true, record }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
