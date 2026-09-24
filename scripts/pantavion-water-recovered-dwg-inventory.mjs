import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { Dwg_File_Type, LibreDwg } from "@mlightcad/libredwg-web";

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function fail(reason, details = {}) {
  console.error(JSON.stringify({ ok: false, reason, ...details }, null, 2));
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const sourcePaths = process.argv.slice(2).map((value) => path.resolve(value));
if (!sourcePaths.length) {
  fail("recovered_dwg_source_paths_required", {
    usage:
      "node scripts/pantavion-water-recovered-dwg-inventory.mjs /absolute/source1.dwg [/absolute/source2.dwg ...]",
  });
}

const wasmDir =
  path.join(repoRoot, "node_modules", "@mlightcad", "libredwg-web", "wasm") +
  path.sep;
const libredwg = await LibreDwg.create(wasmDir);

const report = {
  schemaVersion: "pantavion-water-recovered-dwg-inventory-2026-09-24.v1",
  generatedAt: new Date().toISOString(),
  parser: "@mlightcad/libredwg-web / LibreDwg.convertEx",
  sources: [],
  truth: {
    sourceBytesModified: false,
    sourceLayersDropped: false,
    sourceEntitiesDropped: false,
    relationToMapAAutomaticallyAssigned: false,
    canonicalMergeAllowed: false,
  },
};

for (const sourcePath of sourcePaths) {
  if (!fs.existsSync(sourcePath)) {
    fail("recovered_dwg_source_not_available", { sourcePath });
  }

  const stat = fs.statSync(sourcePath);
  if (!stat.isFile()) fail("recovered_dwg_source_not_file", { sourcePath });

  const buffer = fs.readFileSync(sourcePath);
  const header = buffer.subarray(0, 6).toString("ascii");
  if (!/^AC10[0-9]{2}$/.test(header)) {
    fail("recovered_dwg_header_invalid", { sourcePath, header });
  }

  const actualSha256 = sha256(buffer);
  let dwg;

  try {
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
    dwg = libredwg.dwg_read_data(arrayBuffer, Dwg_File_Type.DWG);
    if (!dwg) fail("recovered_dwg_parse_returned_empty", { sourcePath });

    const version = libredwg.dwg_get_version_type(dwg);
    const result = libredwg.convertEx(dwg);
    const database = result?.database;
    const stats = result?.stats || {};

    if (!database) {
      fail("recovered_dwg_database_conversion_failed", { sourcePath });
    }

    const layers = asArray(database?.tables?.layers);
    const blockRecords = asArray(database?.tables?.blockRecords);
    const modelSpace = blockRecords.find(
      (record) => record?.name === "*Model_Space",
    );
    const paperSpace = blockRecords.filter((record) =>
      String(record?.name || "").startsWith("*Paper_Space"),
    );

    const layerManifest = layers.map((layer, index) => ({
      sourceLayerIndex: index,
      sourceLayerName: String(layer?.name ?? ""),
      sourceVisible:
        typeof layer?.isOff === "boolean" ? !layer.isOff : null,
      sourceLocked:
        typeof layer?.isLocked === "boolean" ? layer.isLocked : null,
      sourceColor: layer?.color ?? null,
      sourceLineType:
        layer?.lineTypeName ?? layer?.linetypeName ?? null,
    }));

    const allBlockEntityCount = blockRecords.reduce(
      (sum, record) => sum + asArray(record?.entities).length,
      0,
    );

    report.sources.push({
      sourcePath,
      fileName: path.basename(sourcePath),
      byteSize: stat.size,
      sha256: actualSha256,
      dwgHeader: header,
      parserVersion: version ?? null,
      unknownEntityCount: Number(stats?.unknownEntityCount ?? 0),
      counts: {
        layers: layerManifest.length,
        blockRecords: blockRecords.length,
        modelSpaceEntities: asArray(modelSpace?.entities).length,
        paperSpaceLayouts: paperSpace.length,
        allBlockEntities: allBlockEntityCount,
      },
      layers: layerManifest,
      sourceCrs: null,
      crsState: "unverified",
      relationToMapA: "unproven",
    });
  } finally {
    if (dwg) libredwg.dwg_free(dwg);
  }
}

const outPath = process.env.PANTAVION_WATER_RECOVERED_DWG_INVENTORY_OUT
  ? path.resolve(process.env.PANTAVION_WATER_RECOVERED_DWG_INVENTORY_OUT)
  : path.join(
      repoRoot,
      ".pantavion",
      "water",
      "recovered-dwg-inventory-20260924.json",
    );

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      outputPath: outPath,
      sourceCount: report.sources.length,
      sources: report.sources.map((source) => ({
        fileName: source.fileName,
        byteSize: source.byteSize,
        sha256: source.sha256,
        counts: source.counts,
        unknownEntityCount: source.unknownEntityCount,
      })),
    },
    null,
    2,
  ),
);
