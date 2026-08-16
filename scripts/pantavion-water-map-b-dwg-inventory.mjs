import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { Dwg_File_Type, LibreDwg } from "@mlightcad/libredwg-web";

const EXPECTED = {
  fileName: "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
  sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
  byteSize: 205565159,
  dwgHeader: "AC1032",
};

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function fail(reason, details = {}) {
  console.error(JSON.stringify({ ok: false, reason, ...details }, null, 2));
  process.exit(1);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sourcePath = process.env.PANTAVION_WATER_MAP_B_DWG_PATH
  ? path.resolve(process.env.PANTAVION_WATER_MAP_B_DWG_PATH)
  : path.join(repoRoot, "data", "water-network-private", "source-masters", "map-b", EXPECTED.fileName);

if (!fs.existsSync(sourcePath)) {
  fail("map_b_source_not_available", { sourcePath });
}

const stat = fs.statSync(sourcePath);
if (!stat.isFile()) fail("map_b_source_not_file", { sourcePath });
if (stat.size !== EXPECTED.byteSize) {
  fail("map_b_source_size_mismatch", { expected: EXPECTED.byteSize, actual: stat.size });
}

const buffer = fs.readFileSync(sourcePath);
const actualHash = sha256(buffer);
if (actualHash !== EXPECTED.sha256) {
  fail("map_b_source_sha256_mismatch", { expected: EXPECTED.sha256, actual: actualHash });
}

const header = buffer.subarray(0, 6).toString("ascii");
if (header !== EXPECTED.dwgHeader) {
  fail("map_b_source_header_mismatch", { expected: EXPECTED.dwgHeader, actual: header });
}

const wasmDir = path.join(repoRoot, "node_modules", "@mlightcad", "libredwg-web", "wasm") + path.sep;
const libredwg = await LibreDwg.create(wasmDir);
let dwg;

try {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  dwg = libredwg.dwg_read_data(arrayBuffer, Dwg_File_Type.DWG);
  if (!dwg) fail("map_b_dwg_parse_returned_empty");

  const version = libredwg.dwg_get_version_type(dwg);
  const result = libredwg.convertEx(dwg);
  const database = result?.database;
  const stats = result?.stats || {};

  if (!database) fail("map_b_database_conversion_failed");

  const layers = asArray(database?.tables?.layers);
  const blockRecords = asArray(database?.tables?.blockRecords);
  const layerManifest = layers.map((layer, index) => ({
    sourceLayerIndex: index,
    sourceLayerName: String(layer?.name ?? ""),
    sourceVisible: typeof layer?.isOff === "boolean" ? !layer.isOff : null,
    sourceLocked: typeof layer?.isLocked === "boolean" ? layer.isLocked : null,
    sourceColor: layer?.color ?? null,
    sourceLineType: layer?.lineTypeName ?? layer?.linetypeName ?? null,
  }));

  if (layerManifest.some((layer) => !layer.sourceLayerName)) {
    fail("map_b_empty_layer_name_detected");
  }

  const modelSpace = blockRecords.find((record) => record?.name === "*Model_Space");
  const paperSpace = blockRecords.filter((record) => String(record?.name || "").startsWith("*Paper_Space"));
  const allBlockEntityCount = blockRecords.reduce(
    (sum, record) => sum + asArray(record?.entities).length,
    0,
  );

  const inventory = {
    schemaVersion: "pantavion-water-map-b-inventory-2026-08-16.v1",
    generatedAt: new Date().toISOString(),
    source: {
      fileName: path.basename(sourcePath),
      byteSize: stat.size,
      sha256: actualHash,
      dwgHeader: header,
      parser: "@mlightcad/libredwg-web",
      parserContract: "LibreDwg.convertEx",
      sourceCrs: null,
      crsState: "unverified",
    },
    parser: {
      version: version ?? null,
      unknownEntityCount: Number(stats?.unknownEntityCount ?? 0),
    },
    counts: {
      layers: layerManifest.length,
      blockRecords: blockRecords.length,
      modelSpaceEntities: asArray(modelSpace?.entities).length,
      paperSpaceLayouts: paperSpace.length,
      allBlockEntities: allBlockEntityCount,
    },
    layers: layerManifest,
    truth: {
      geometryModified: false,
      sourceLayersDropped: false,
      sourceEntitiesDropped: false,
      alignmentVerified: false,
      canonicalWriteAllowed: false,
    },
  };

  const outputPath = process.env.PANTAVION_WATER_MAP_B_INVENTORY_OUT
    ? path.resolve(process.env.PANTAVION_WATER_MAP_B_INVENTORY_OUT)
    : path.join(repoRoot, ".pantavion", "water", "map-b-source-inventory.json");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2) + "\n", "utf8");

  console.log(JSON.stringify({ ok: true, outputPath, counts: inventory.counts, parser: inventory.parser }, null, 2));
} finally {
  if (dwg) libredwg.dwg_free(dwg);
}
