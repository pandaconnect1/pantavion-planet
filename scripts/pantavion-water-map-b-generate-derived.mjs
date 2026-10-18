#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { Dwg_File_Type, LibreDwg } from "@mlightcad/libredwg-web";
import { loadApprovedOwnerDwg } from "./water-approved-owner-dwg-loader.mjs";

const SOURCES = {
  "canonical-2026-andreaspap": {
    sourceKey: "canonical-2026-andreaspap",
    mapId: "B",
    canonical: true,
    fileName: "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
    byteSize: 205565159,
    sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
    dwgHeader: "AC1032",
    storagePath:
      "water-network-private/source-masters/map-b-original/6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16.dwg",
  },
  "legacy-george-85m": {
    sourceKey: "legacy-george-85m",
    mapId: "C",
    canonical: true,
    fileName: "GEORGE_MAP_MASTER_B_C_FINAL (4).dwg",
    byteSize: 85703125,
    sha256: "038b9bceda2a660296a9162723f5279e5a2d10eb18d499b087d0e8ffa393b800",
    dwgHeader: "AC1032",
    storagePath:
      "water-network-private/source-masters/map-c-original/038b9bceda2a660296a9162723f5279e5a2d10eb18d499b087d0e8ffa393b800.dwg",
  },
};

const SOURCE_KEY =
  process.env.PANTAVION_WATER_MAP_B_SOURCE_KEY === "legacy-george-85m"
    ? "legacy-george-85m"
    : "canonical-2026-andreaspap";

const EXPECTED = SOURCES[SOURCE_KEY];

const STORAGE = {
  bucket: "personal-media",
  sourcePath: EXPECTED.storagePath,
  derivedPrefix: `water-network-private/derived/map-${EXPECTED.mapId.toLowerCase()}/${EXPECTED.sha256}`,
};

const GENERATOR_VERSION = "pantavion-map-b-derived-v2";
const DEFAULT_GRID = 64;
const MAX_GRID = 512;
const TARGET_TILE_SEGMENTS = 40000;
const PART_MAX_SEGMENTS = 40000;
const PART_MAX_POINTS = 20000;
const PART_MAX_LABELS = 10000;
const MIN_GRID = 8;
const MAX_CURVE_SEGMENTS = 256;
const CURVE_STEP_RADIANS = Math.PI / 60; // 3 degrees.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function fail(reason, details = {}) {
  console.error(JSON.stringify({ ok: false, reason, ...details }, null, 2));
  process.exit(1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function point2(value) {
  if (!value || !finite(Number(value.x)) || !finite(Number(value.y))) return null;
  return { x: Number(value.x), y: Number(value.y) };
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function identityTransform() {
  return { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
}

function applyTransform(p, t) {
  return {
    x: t.a * p.x + t.c * p.y + t.tx,
    y: t.b * p.x + t.d * p.y + t.ty,
  };
}

function composeTransform(parent, local) {
  return {
    a: parent.a * local.a + parent.c * local.b,
    b: parent.b * local.a + parent.d * local.b,
    c: parent.a * local.c + parent.c * local.d,
    d: parent.b * local.c + parent.d * local.d,
    tx: parent.a * local.tx + parent.c * local.ty + parent.tx,
    ty: parent.b * local.tx + parent.d * local.ty + parent.ty,
  };
}

function insertTransform(entity, blockRecord, columnIndex = 0, rowIndex = 0) {
  const insertion = point2(entity?.insertionPoint) || { x: 0, y: 0 };
  const base = point2(blockRecord?.basePoint) || { x: 0, y: 0 };
  const sx = finite(Number(entity?.xScale)) ? Number(entity.xScale) : 1;
  const sy = finite(Number(entity?.yScale)) ? Number(entity.yScale) : 1;
  const rotation = finite(Number(entity?.rotation)) ? Number(entity.rotation) : 0;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const colSpacing = finite(Number(entity?.columnSpacing)) ? Number(entity.columnSpacing) : 0;
  const rowSpacing = finite(Number(entity?.rowSpacing)) ? Number(entity.rowSpacing) : 0;
  const offsetX = columnIndex * colSpacing;
  const offsetY = rowIndex * rowSpacing;

  // translate(insertion) * rotate * scale * translate(arrayOffset - blockBase)
  return {
    a: cos * sx,
    b: sin * sx,
    c: -sin * sy,
    d: cos * sy,
    tx:
      insertion.x +
      cos * sx * (offsetX - base.x) -
      sin * sy * (offsetY - base.y),
    ty:
      insertion.y +
      sin * sx * (offsetX - base.x) +
      cos * sy * (offsetY - base.y),
  };
}

function normalizeSweep(start, end) {
  let sweep = end - start;
  while (sweep <= 0) sweep += Math.PI * 2;
  return sweep;
}

function curveStepCount(sweep) {
  return clamp(Math.ceil(Math.abs(sweep) / CURVE_STEP_RADIANS), 2, MAX_CURVE_SEGMENTS);
}

function sampleArc(center, radius, start, sweep) {
  if (!center || !finite(radius) || radius <= 0 || !finite(start) || !finite(sweep)) return [];
  const steps = curveStepCount(sweep);
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = start + sweep * t;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return points;
}

function sampleBulge(start, end, bulge) {
  if (!start || !end || !finite(bulge) || Math.abs(bulge) < 1e-12) {
    return [start, end].filter(Boolean);
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const chord = Math.hypot(dx, dy);
  if (!finite(chord) || chord <= 0) return [start, end];

  const theta = 4 * Math.atan(bulge);
  const tanHalf = Math.tan(theta / 2);
  if (!finite(tanHalf) || Math.abs(tanHalf) < 1e-12) return [start, end];

  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const left = { x: -dy / chord, y: dx / chord };
  const h = chord / (2 * tanHalf);
  const center = { x: mid.x + left.x * h, y: mid.y + left.y * h };
  const radius = Math.hypot(start.x - center.x, start.y - center.y);
  const startAngle = Math.atan2(start.y - center.y, start.x - center.x);

  return sampleArc(center, radius, startAngle, theta);
}

function sampleEllipse(entity) {
  const center = point2(entity?.center);
  const major = point2(entity?.majorAxisEndPoint);
  const ratio = Number(entity?.axisRatio);
  const start = Number(entity?.startAngle);
  const end = Number(entity?.endAngle);

  if (!center || !major || !finite(ratio) || ratio <= 0 || !finite(start) || !finite(end)) {
    return [];
  }

  const a = Math.hypot(major.x, major.y);
  if (!finite(a) || a <= 0) return [];

  const ux = major.x / a;
  const uy = major.y / a;
  const vx = -uy;
  const vy = ux;
  const b = a * ratio;
  const sweep = normalizeSweep(start, end);
  const steps = curveStepCount(sweep);
  const points = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = start + sweep * (i / steps);
    points.push({
      x: center.x + major.x * Math.cos(t) + vx * b * Math.sin(t),
      y: center.y + major.y * Math.cos(t) + vy * b * Math.sin(t),
    });
  }

  return points;
}

function splinePoint(entity, u) {
  const cps = Array.isArray(entity?.controlPoints) ? entity.controlPoints : [];
  const knots = Array.isArray(entity?.knots) ? entity.knots.map(Number) : [];
  const weights = Array.isArray(entity?.weights) ? entity.weights.map(Number) : [];
  const degree = Number(entity?.degree);

  if (
    !Number.isInteger(degree) ||
    degree < 1 ||
    cps.length < degree + 1 ||
    knots.length !== cps.length + degree + 1
  ) {
    return null;
  }

  const n = cps.length - 1;
  let basis = new Array(cps.length).fill(0);

  for (let i = 0; i <= n; i += 1) {
    const last = i === n && u === knots[n + 1];
    if ((u >= knots[i] && u < knots[i + 1]) || last) basis[i] = 1;
  }

  for (let p = 1; p <= degree; p += 1) {
    const next = new Array(cps.length).fill(0);

    for (let i = 0; i <= n; i += 1) {
      const leftDen = knots[i + p] - knots[i];
      const rightDen = knots[i + p + 1] - knots[i + 1];
      const left = leftDen !== 0 ? ((u - knots[i]) / leftDen) * basis[i] : 0;
      const right =
        rightDen !== 0 && i + 1 < basis.length
          ? ((knots[i + p + 1] - u) / rightDen) * basis[i + 1]
          : 0;
      next[i] = left + right;
    }

    basis = next;
  }

  let sumW = 0;
  let x = 0;
  let y = 0;

  for (let i = 0; i <= n; i += 1) {
    const p = point2(cps[i]);
    if (!p) continue;
    const w = finite(weights[i]) ? weights[i] : 1;
    const bw = basis[i] * w;
    sumW += bw;
    x += p.x * bw;
    y += p.y * bw;
  }

  if (!finite(sumW) || Math.abs(sumW) < 1e-12) return null;
  return { x: x / sumW, y: y / sumW };
}

function sampleSpline(entity) {
  const cps = Array.isArray(entity?.controlPoints) ? entity.controlPoints : [];
  const knots = Array.isArray(entity?.knots) ? entity.knots.map(Number) : [];
  const degree = Number(entity?.degree);

  if (
    !Number.isInteger(degree) ||
    degree < 1 ||
    cps.length < degree + 1 ||
    knots.length !== cps.length + degree + 1
  ) {
    const fit = Array.isArray(entity?.fitPoints) ? entity.fitPoints.map(point2).filter(Boolean) : [];
    return fit.length >= 2 ? fit : [];
  }

  const start = knots[degree];
  const end = knots[cps.length];
  if (!finite(start) || !finite(end) || end <= start) return [];

  const steps = clamp(cps.length * 8, 24, MAX_CURVE_SEGMENTS);
  const points = [];

  for (let i = 0; i <= steps; i += 1) {
    const u = i === steps ? end : start + ((end - start) * i) / steps;
    const p = splinePoint(entity, u);
    if (p) points.push(p);
  }

  return points;
}

function stripCadText(value) {
  return String(value ?? "")
    .replace(/\\P/g, " ")
    .replace(/\\[A-Za-z][^;]*;/g, "")
    .replace(/[{}]/g, "")
    .trim();
}

function tableEntries(database, upperName, legacyName) {
  const modern = database?.tables?.[upperName]?.entries;
  if (Array.isArray(modern)) return modern;
  const legacy = database?.tables?.[legacyName];
  return Array.isArray(legacy) ? legacy : [];
}

function canonicalChunkPrefix() {
  return `water-network-private/source-masters/chunked/map-${EXPECTED.mapId.toLowerCase()}/${EXPECTED.sha256}`;
}

async function loadChunkedCanonical(admin) {
  const prefix = canonicalChunkPrefix();
  const manifestPath = `${prefix}/manifest.json`;
  const { data: manifestBlob, error: manifestError } = await admin.storage
    .from(STORAGE.bucket)
    .download(manifestPath);

  if (manifestError || !manifestBlob) {
    return null;
  }

  let manifest;
  try {
    manifest = JSON.parse(await manifestBlob.text());
  } catch {
    fail("map_b_chunked_manifest_invalid_json", { manifestPath });
  }

  if (
    manifest?.schemaVersion !== "pantavion-water-chunked-canonical-v1" ||
    manifest?.representation !== "chunked-private-canonical-v1" ||
    manifest?.sourceKey !== SOURCE_KEY ||
    manifest?.sha256 !== EXPECTED.sha256 ||
    Number(manifest?.sizeBytes) !== EXPECTED.byteSize ||
    manifest?.header !== EXPECTED.dwgHeader ||
    !Array.isArray(manifest?.chunks) ||
    manifest.chunks.length < 1
  ) {
    fail("map_b_chunked_manifest_identity_mismatch", {
      manifestPath,
      sourceKey: manifest?.sourceKey ?? null,
      sha256: manifest?.sha256 ?? null,
      sizeBytes: manifest?.sizeBytes ?? null,
      header: manifest?.header ?? null,
      chunkCount: Array.isArray(manifest?.chunks) ? manifest.chunks.length : 0,
    });
  }

  const orderedChunks = [...manifest.chunks].sort(
    (a, b) => Number(a?.index ?? -1) - Number(b?.index ?? -1),
  );
  const buffers = [];

  for (let expectedIndex = 0; expectedIndex < orderedChunks.length; expectedIndex += 1) {
    const item = orderedChunks[expectedIndex];
    const index = Number(item?.index);
    const chunkPath = String(item?.path || "");

    if (index !== expectedIndex || !chunkPath.startsWith(`${prefix}/chunks/`)) {
      fail("map_b_chunked_manifest_order_invalid", {
        manifestPath,
        expectedIndex,
        actualIndex: index,
        chunkPath,
      });
    }

    const { data: blob, error } = await admin.storage
      .from(STORAGE.bucket)
      .download(chunkPath);

    if (error || !blob) {
      fail("map_b_chunk_private_download_failed", {
        manifestPath,
        chunkIndex: index,
        chunkPath,
        message: error?.message || "missing_private_chunk",
      });
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const expectedBytes = Number(item?.sizeBytes);
    const expectedChunkSha = String(item?.sha256 || "").toLowerCase();
    const actualChunkSha = sha256(buffer);

    if (
      !Number.isSafeInteger(expectedBytes) ||
      buffer.byteLength !== expectedBytes ||
      !/^[a-f0-9]{64}$/.test(expectedChunkSha) ||
      actualChunkSha !== expectedChunkSha
    ) {
      fail("map_b_chunk_identity_mismatch", {
        chunkIndex: index,
        chunkPath,
        expectedBytes,
        actualBytes: buffer.byteLength,
        expectedChunkSha,
        actualChunkSha,
      });
    }

    buffers.push(buffer);
  }

  const buffer = Buffer.concat(buffers);
  return {
    buffer,
    sourcePath: `supabase://${STORAGE.bucket}/${manifestPath}`,
    acquisition: "supabase_private_chunked_canonical",
  };
}

async function loadSourceBuffer() {
  const configured = process.env.PANTAVION_WATER_MAP_B_DWG_PATH?.trim();
  const localPath = configured ? path.resolve(configured) : "";

  if (localPath && fs.existsSync(localPath)) {
    return {
      buffer: fs.readFileSync(localPath),
      sourcePath: localPath,
      acquisition: "local_private_path",
    };
  }

  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "https://cxhulvwkagzufbjsdwwu.supabase.co";
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";

  if (!key) {
    fail("map_b_source_not_available", {
      localPath: localPath || null,
      storageBucket: STORAGE.bucket,
      storagePath: STORAGE.sourcePath,
      hint: "Configure PANTAVION_WATER_MAP_B_DWG_PATH or a server-only Supabase admin credential.",
    });
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.storage
    .from(STORAGE.bucket)
    .download(STORAGE.sourcePath);

  if (!error && data) {
    const arrayBuffer = await data.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      sourcePath: `supabase://${STORAGE.bucket}/${STORAGE.sourcePath}`,
      acquisition: "supabase_private_storage",
    };
  }

  const chunked = await loadChunkedCanonical(admin);
  if (chunked) return chunked;

  // The founder's 7-piece private upload is a different, intentionally
  // staged representation from the older canonical source-master path.
  // Accept it ONLY after the founder approved GIS review and both the
  // stored evidence and the exact original bytes verify against EXPECTED.
  // The derived output is still a source-CAD preview, not GIS alignment.
  const ownerApproved = await loadApprovedOwnerDwg(admin, EXPECTED);
  if (ownerApproved) return ownerApproved;

  fail("map_b_source_private_download_failed", {
    storageBucket: STORAGE.bucket,
    storagePath: STORAGE.sourcePath,
    chunkedManifestPath: `${canonicalChunkPrefix()}/manifest.json`,
    message: error?.message || "missing_private_object_and_chunked_manifest",
  });
}

function verifySource(buffer) {
  const size = buffer.byteLength;
  if (size !== EXPECTED.byteSize) {
    fail("map_b_source_size_mismatch", { expected: EXPECTED.byteSize, actual: size });
  }

  const actualHash = sha256(buffer);
  if (actualHash !== EXPECTED.sha256) {
    fail("map_b_source_sha256_mismatch", { expected: EXPECTED.sha256, actual: actualHash });
  }

  const header = buffer.subarray(0, 6).toString("ascii");
  if (header !== EXPECTED.dwgHeader) {
    fail("map_b_source_header_mismatch", { expected: EXPECTED.dwgHeader, actual: header });
  }

  return { size, sha256: actualHash, header };
}

// Bounds of the dense core of the drawing: the 0.1th to 99.9th percentile of
// segment midpoints, padded by 2%. Falls back to the full extents when the core
// would be degenerate. Used only to lay out the tile grid; no geometry changes.
function robustCoreBounds(segments, all) {
  const n = segments.length;
  const step = Math.max(1, Math.floor(n / 2000000));
  const xs = [];
  const ys = [];
  for (let i = 0; i < n; i += step) {
    const [x1, y1, x2, y2] = segments[i];
    const x = (x1 + x2) / 2;
    const y = (y1 + y2) / 2;
    if (finite(x) && finite(y)) { xs.push(x); ys.push(y); }
  }
  if (xs.length < 100) return { ...all };
  const fx = Float64Array.from(xs).sort();
  const fy = Float64Array.from(ys).sort();
  const at = (arr, q) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(q * (arr.length - 1))))];
  let minX = at(fx, 0.001), maxX = at(fx, 0.999);
  let minY = at(fy, 0.001), maxY = at(fy, 0.999);
  const padX = (maxX - minX) * 0.02;
  const padY = (maxY - minY) * 0.02;
  minX = Math.max(all.minX, minX - padX); maxX = Math.min(all.maxX, maxX + padX);
  minY = Math.max(all.minY, minY - padY); maxY = Math.min(all.maxY, maxY + padY);
  if (!(maxX > minX) || !(maxY > minY)) return { ...all };
  return { minX, minY, maxX, maxY };
}

function tileKey(x, y) {
  return `${x}:${y}`;
}

async function uploadDerived(outputDir, manifest, tileFiles) {
  if (process.env.PANTAVION_WATER_MAP_B_UPLOAD_DERIVED !== "YES") {
    return { uploaded: false, reason: "upload_not_requested" };
  }

  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "https://cxhulvwkagzufbjsdwwu.supabase.co";
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";

  if (!key) {
    fail("derived_upload_admin_credential_missing");
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const manifestBody = Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8");
  const manifestPath = `${STORAGE.derivedPrefix}/manifest.json`;

  const concurrency = 16;
  let uploadedTiles = 0;

  for (let i = 0; i < tileFiles.length; i += concurrency) {
    const batch = tileFiles.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (fileName) => {
        const local = path.join(outputDir, "tiles", fileName);
        const remote = `${STORAGE.derivedPrefix}/tiles/${fileName}`;
        const body = fs.readFileSync(local);
        let error = null;
        for (let attempt = 1; attempt <= 4; attempt += 1) {
          ({ error } = await admin.storage.from(STORAGE.bucket).upload(
            remote,
            body,
            { upsert: true, contentType: "application/json", cacheControl: "60" },
          ));
          if (!error) break;
          await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
        }
        return { fileName, remote, error };
      }),
    );

    for (const result of results) {
      if (result.error) {
        fail("map_b_derived_tile_upload_failed", {
          fileName: result.fileName,
          path: result.remote,
          message: result.error.message,
        });
      }
      uploadedTiles += 1;
    }
  }

  // Publish readiness only after every referenced tile was uploaded successfully.
  const manifestUpload = await admin.storage.from(STORAGE.bucket).upload(
    manifestPath,
    manifestBody,
    { upsert: true, contentType: "application/json", cacheControl: "0" },
  );

  if (manifestUpload.error) {
    fail("map_b_derived_manifest_upload_failed", {
      path: manifestPath,
      message: manifestUpload.error.message,
    });
  }

  return { uploaded: true, manifestPath, uploadedTiles };
}

async function main() {
  if (process.argv.includes("--self-test")) {
    const bulge = Math.tan((Math.PI / 2) / 4);
    const q = sampleBulge({ x: 1, y: 0 }, { x: 0, y: 1 }, bulge);
    if (q.length < 3) fail("self_test_bulge_sampling_failed");
    const first = q[0];
    const last = q[q.length - 1];
    if (Math.abs(first.x - 1) > 1e-9 || Math.abs(last.y - 1) > 1e-9) {
      fail("self_test_bulge_endpoints_failed", { first, last });
    }
    console.log(JSON.stringify({ ok: true, marker: "pantavion_map_b_generator_self_test_v1" }, null, 2));
    return;
  }

  const { buffer, sourcePath, acquisition } = await loadSourceBuffer();
  const verified = verifySource(buffer);

  const wasmDir =
    path.join(repoRoot, "node_modules", "@mlightcad", "libredwg-web", "wasm") + path.sep;
  const libredwg = await LibreDwg.create(wasmDir);
  let dwg;

  try {
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
    dwg = libredwg.dwg_read_data(arrayBuffer, Dwg_File_Type.DWG);
    if (!dwg) fail("map_b_dwg_parse_returned_empty");

    const result = libredwg.convertEx(dwg);
    const database = result?.database;
    if (!database) fail("map_b_database_conversion_failed");

    const entities = Array.isArray(database.entities) ? database.entities : [];
    const layerEntries = tableEntries(database, "LAYER", "layers");
    const blockRecords = tableEntries(database, "BLOCK_RECORD", "blockRecords");
    const blockByName = new Map(
      blockRecords
        .filter((record) => typeof record?.name === "string")
        .map((record) => [String(record.name), record]),
    );

    const layerNames = [];
    const layerIdByName = new Map();

    function layerId(name) {
      const clean = String(name || "0").trim() || "0";
      if (!layerIdByName.has(clean)) {
        layerIdByName.set(clean, layerNames.length);
        layerNames.push(clean);
      }
      return layerIdByName.get(clean);
    }

    for (const layer of layerEntries) layerId(layer?.name);
    layerId("0");

    const segments = [];
    const points = [];
    const labels = [];
    const entityTypeCounts = {};
    const unsupportedTypeCounts = {};
    const approximationCounts = {};
    const layerSegmentCounts = new Map();
    let nonPlanarEntityCount = 0;
    let blockInsertCount = 0;
    let expandedBlockEntityCount = 0;

    function bump(target, key, amount = 1) {
      target[key] = Number(target[key] || 0) + amount;
    }

    function effectiveLayer(entity, inheritedLayer) {
      const own = String(entity?.layer || "").trim();
      if (!own || own === "0") return inheritedLayer || own || "0";
      return own;
    }

    function checkPlanarity(entity) {
      const extrusion = entity?.extrusionDirection;
      if (
        extrusion &&
        (Math.abs(Number(extrusion.x || 0)) > 1e-9 ||
          Math.abs(Number(extrusion.y || 0)) > 1e-9 ||
          Math.abs(Number(extrusion.z ?? 1) - 1) > 1e-9)
      ) {
        nonPlanarEntityCount += 1;
      }
    }

    function addSegment(a, b, layerName, transform, sourceType, approximate = false) {
      const p1 = point2(a);
      const p2 = point2(b);
      if (!p1 || !p2) return;
      const ta = applyTransform(p1, transform);
      const tb = applyTransform(p2, transform);
      if (![ta.x, ta.y, tb.x, tb.y].every(finite)) return;
      if (Math.abs(ta.x - tb.x) < 1e-12 && Math.abs(ta.y - tb.y) < 1e-12) return;

      const lid = layerId(layerName);
      segments.push([ta.x, ta.y, tb.x, tb.y, lid]);
      layerSegmentCounts.set(lid, Number(layerSegmentCounts.get(lid) || 0) + 1);
      if (approximate) bump(approximationCounts, sourceType);
    }

    function addPolyline(rawPoints, layerName, transform, sourceType, approximate = false) {
      const clean = rawPoints.map(point2).filter(Boolean);
      for (let i = 1; i < clean.length; i += 1) {
        addSegment(clean[i - 1], clean[i], layerName, transform, sourceType, approximate);
      }
    }

    function addPoint(raw, layerName, transform, entityType, blockName = null) {
      const p = point2(raw);
      if (!p) return;
      const t = applyTransform(p, transform);
      points.push([t.x, t.y, layerId(layerName), entityType, blockName]);
    }

    function addLabel(raw, text, layerName, transform, entityType) {
      const p = point2(raw);
      const cleanText = stripCadText(text);
      if (!p || !cleanText) return;
      const t = applyTransform(p, transform);
      labels.push([t.x, t.y, layerId(layerName), cleanText, entityType]);
    }

    function processPolylineVertices(entity, layerName, transform, closedMask, sourceType) {
      const vertices = Array.isArray(entity?.vertices) ? entity.vertices : [];
      if (vertices.length < 2) return;

      for (let i = 0; i < vertices.length - 1; i += 1) {
        const a = point2(vertices[i]);
        const b = point2(vertices[i + 1]);
        if (!a || !b) continue;
        const bulge = Number(vertices[i]?.bulge || 0);
        const sampled = sampleBulge(a, b, bulge);
        addPolyline(sampled, layerName, transform, sourceType, Math.abs(bulge) > 1e-12);
      }

      if ((Number(entity?.flag || 0) & closedMask) !== 0 && vertices.length > 2) {
        const a = point2(vertices[vertices.length - 1]);
        const b = point2(vertices[0]);
        if (a && b) {
          const bulge = Number(vertices[vertices.length - 1]?.bulge || 0);
          const sampled = sampleBulge(a, b, bulge);
          addPolyline(sampled, layerName, transform, sourceType, Math.abs(bulge) > 1e-12);
        }
      }
    }

    function processEntity(entity, transform, inheritedLayer = "0", depth = 0) {
      if (!entity || depth > 8) return;
      const type = String(entity.type || "UNKNOWN");
      bump(entityTypeCounts, type);

      if (entity.isVisible === false) return;

      const layerName = effectiveLayer(entity, inheritedLayer);
      checkPlanarity(entity);

      if (type === "LINE") {
        addSegment(entity.startPoint, entity.endPoint, layerName, transform, type);
        return;
      }

      if (type === "LWPOLYLINE") {
        processPolylineVertices(entity, layerName, transform, 512, type);
        return;
      }

      if (type === "POLYLINE2D" || type === "POLYLINE3D") {
        processPolylineVertices(entity, layerName, transform, 1, type);
        return;
      }

      if (type === "ARC") {
        const center = point2(entity.center);
        const radius = Number(entity.radius);
        const start = Number(entity.startAngle);
        const end = Number(entity.endAngle);
        if (center && finite(radius) && finite(start) && finite(end)) {
          addPolyline(
            sampleArc(center, radius, start, normalizeSweep(start, end)),
            layerName,
            transform,
            type,
            true,
          );
        }
        return;
      }

      if (type === "CIRCLE") {
        const center = point2(entity.center);
        const radius = Number(entity.radius);
        if (center && finite(radius)) {
          addPolyline(
            sampleArc(center, radius, 0, Math.PI * 2),
            layerName,
            transform,
            type,
            true,
          );
        }
        return;
      }

      if (type === "ELLIPSE") {
        const sampled = sampleEllipse(entity);
        addPolyline(sampled, layerName, transform, type, true);
        return;
      }

      if (type === "SPLINE") {
        const sampled = sampleSpline(entity);
        if (sampled.length >= 2) {
          addPolyline(sampled, layerName, transform, type, true);
        } else {
          bump(unsupportedTypeCounts, type);
        }
        return;
      }

      if (type === "POINT") {
        addPoint(entity.position || entity.point, layerName, transform, type);
        return;
      }

      if (type === "TEXT") {
        addLabel(entity.startPoint, entity.text, layerName, transform, type);
        return;
      }

      if (type === "MTEXT") {
        addLabel(entity.insertionPoint, entity.text, layerName, transform, type);
        return;
      }

      if (type === "INSERT") {
        blockInsertCount += 1;
        addPoint(entity.insertionPoint, layerName, transform, type, String(entity.name || ""));

        const block = blockByName.get(String(entity.name || ""));
        if (!block || !Array.isArray(block.entities)) {
          bump(unsupportedTypeCounts, "INSERT_MISSING_BLOCK");
          return;
        }

        const columns = clamp(Number(entity.columnCount || 1), 1, 128);
        const rows = clamp(Number(entity.rowCount || 1), 1, 128);

        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < columns; col += 1) {
            const local = insertTransform(entity, block, col, row);
            const nested = composeTransform(transform, local);
            for (const child of block.entities) {
              expandedBlockEntityCount += 1;
              processEntity(child, nested, layerName, depth + 1);
            }
          }
        }

        for (const attrib of Array.isArray(entity.attribs) ? entity.attribs : []) {
          const text = attrib?.text?.text || attrib?.text || attrib?.attrTag || attrib?.tag;
          const p = attrib?.text?.startPoint || attrib?.alignmentPoint || entity.insertionPoint;
          addLabel(p, text, layerName, transform, "ATTRIB");
        }
        return;
      }

      // Decorative/annotation types are counted but do not block a source-CAD network preview.
      const decorative =
        type.startsWith("DIMENSION") ||
        [
          "HATCH",
          "LEADER",
          "MULTILEADER",
          "SOLID",
          "3DFACE",
          "IMAGE",
          "VIEWPORT",
          "WIPEOUT",
          "TABLE",
          "TOLERANCE",
          "OLE2FRAME",
          "OLEFRAME",
        ].includes(type);

      if (!decorative) bump(unsupportedTypeCounts, type);
    }

    for (const entity of entities) {
      processEntity(entity, identityTransform(), "0", 0);
    }

    if (segments.length === 0) {
      fail("map_b_no_renderable_segments_extracted", {
        entityTypeCounts,
        unsupportedTypeCounts,
      });
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    function includeXY(x, y) {
      if (!finite(x) || !finite(y)) return;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    for (const [x1, y1, x2, y2] of segments) {
      includeXY(x1, y1);
      includeXY(x2, y2);
    }
    for (const [x, y] of points) includeXY(x, y);
    for (const [x, y] of labels) includeXY(x, y);

    if (![minX, minY, maxX, maxY].every(finite) || maxX <= minX || maxY <= minY) {
      fail("map_b_derived_bounds_invalid", { minX, minY, maxX, maxY });
    }

    // The grid is laid over the dense core of the drawing, not over its extreme
    // extents. A few stray entities far from the network (common in CAD files)
    // otherwise squeeze the whole city into one or two tiles; a single tile then
    // exceeds the JavaScript string limit and generation fails. Entities outside
    // the core are still kept: they are clamped into the edge tiles, never dropped.
    const core = robustCoreBounds(segments, { minX, minY, maxX, maxY });
    const coreWidth = core.maxX - core.minX;
    const coreHeight = core.maxY - core.minY;

    function tileAt(x, y, g) {
      const nx = coreWidth > 0 ? (x - core.minX) / coreWidth : 0;
      const ny = coreHeight > 0 ? (y - core.minY) / coreHeight : 0;
      return {
        x: clamp(Math.floor(nx * g), 0, g - 1),
        y: clamp(Math.floor(ny * g), 0, g - 1),
      };
    }

    function maxSegmentsPerTile(g) {
      const counts = new Map();
      let max = 0;
      for (const [x1, y1, x2, y2] of segments) {
        const t = tileAt((x1 + x2) / 2, (y1 + y2) / 2, g);
        const key = t.y * g + t.x;
        const next = (counts.get(key) || 0) + 1;
        counts.set(key, next);
        if (next > max) max = next;
      }
      return max;
    }

    const requestedGrid = Number(process.env.PANTAVION_WATER_MAP_B_TILE_GRID || DEFAULT_GRID);
    let grid = clamp(Number.isInteger(requestedGrid) ? requestedGrid : DEFAULT_GRID, MIN_GRID, MAX_GRID);
    let densestTileSegments = maxSegmentsPerTile(grid);
    while (densestTileSegments > TARGET_TILE_SEGMENTS && grid < MAX_GRID) {
      grid = Math.min(MAX_GRID, grid * 2);
      densestTileSegments = maxSegmentsPerTile(grid);
    }

    const tileMap = new Map();

    function tileRecord(x, y) {
      const key = tileKey(x, y);
      if (!tileMap.has(key)) {
        tileMap.set(key, { x, y, segments: [], points: [], labels: [] });
      }
      return tileMap.get(key);
    }

    let outsideCoreCount = 0;
    function outsideCore(x, y) {
      return x < core.minX || x > core.maxX || y < core.minY || y > core.maxY;
    }

    for (const segment of segments) {
      const [x1, y1, x2, y2] = segment;
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      if (outsideCore(mx, my)) outsideCoreCount += 1;
      const mid = tileAt(mx, my, grid);
      tileRecord(mid.x, mid.y).segments.push(segment);
    }

    for (const point of points) {
      if (outsideCore(point[0], point[1])) outsideCoreCount += 1;
      const t = tileAt(point[0], point[1], grid);
      tileRecord(t.x, t.y).points.push(point);
    }

    for (const label of labels) {
      if (outsideCore(label[0], label[1])) outsideCoreCount += 1;
      const t = tileAt(label[0], label[1], grid);
      tileRecord(t.x, t.y).labels.push(label);
    }

    const outputDir = process.env.PANTAVION_WATER_MAP_B_DERIVED_OUT
      ? path.resolve(process.env.PANTAVION_WATER_MAP_B_DERIVED_OUT)
      : path.join(repoRoot, ".pantavion", "water", "map-b-derived", EXPECTED.sha256);
    const tilesDir = path.join(outputDir, "tiles");
    fs.mkdirSync(tilesDir, { recursive: true });

    const tileIndex = [];
    const tileFiles = [];
    let writtenSegments = 0;
    let writtenPoints = 0;
    let writtenLabels = 0;

    for (const tile of [...tileMap.values()].sort((a, b) => a.y - b.y || a.x - b.x)) {
      // A tile that is still very dense (one tile can hold a whole block of the
      // city at the maximum grid) is written as several part files, so no single
      // file can approach the string limit. Every entity is written exactly once.
      const parts = Math.max(
        1,
        Math.ceil(tile.segments.length / PART_MAX_SEGMENTS),
        Math.ceil(tile.points.length / PART_MAX_POINTS),
        Math.ceil(tile.labels.length / PART_MAX_LABELS),
      );
      const slice = (list, part) => {
        const size = Math.ceil(list.length / parts);
        return list.slice(part * size, (part + 1) * size);
      };

      for (let part = 0; part < parts; part += 1) {
        const file = part === 0
          ? `master-b-tile-${tile.x}-${tile.y}.json`
          : `master-b-tile-${tile.x}-${tile.y}-p${part}.json`;
        const partSegments = slice(tile.segments, part);
        const partPoints = slice(tile.points, part);
        const partLabels = slice(tile.labels, part);
        const payload = {
          ok: true,
          schemaVersion: "pantavion-water-map-b-derived-tile-v1",
          sourceSha256: EXPECTED.sha256,
          tileX: tile.x,
          tileY: tile.y,
          part,
          parts,
          grid,
          rawDwgIncluded: false,
          coordinateSpace: "source_cad",
          segmentFormat: ["x1", "y1", "x2", "y2", "layerId"],
          pointFormat: ["x", "y", "layerId", "entityType", "blockName"],
          labelFormat: ["x", "y", "layerId", "text", "entityType"],
          segments: partSegments,
          points: partPoints,
          labels: partLabels,
        };

        fs.writeFileSync(path.join(tilesDir, file), JSON.stringify(payload), "utf8");
        writtenSegments += partSegments.length;
        writtenPoints += partPoints.length;
        writtenLabels += partLabels.length;
        tileFiles.push(file);
        tileIndex.push({
          x: tile.x,
          y: tile.y,
          part,
          parts,
          file: `tiles/${file}`,
          segmentCount: partSegments.length,
          pointCount: partPoints.length,
          labelCount: partLabels.length,
        });
      }
    }

    if (writtenSegments !== segments.length ||
        writtenPoints !== points.length ||
        writtenLabels !== labels.length) {
      fail("map_b_derived_tile_coverage_mismatch", {
        segments: [segments.length, writtenSegments],
        points: [points.length, writtenPoints],
        labels: [labels.length, writtenLabels],
      });
    }

    const topLayers = [...layerSegmentCounts.entries()]
      .map(([id, count]) => ({ layer: layerNames[id] || `layer-${id}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);

    const unsupportedCount = Object.values(unsupportedTypeCounts).reduce(
      (sum, value) => sum + Number(value || 0),
      0,
    );

    const manifest = {
      ok: true,
      schemaVersion: "pantavion-water-map-b-derived-manifest-v1",
      sourceKey: SOURCE_KEY,
      mapId: EXPECTED.mapId,
      canonical: EXPECTED.canonical,
      generatorVersion: GENERATOR_VERSION,
      generatedAt: new Date().toISOString(),
      source: `MASTER_${EXPECTED.mapId}_DWG`,
      sourceFileName: EXPECTED.fileName,
      sourceSha256: verified.sha256,
      sourceSizeBytes: verified.size,
      sourceHeader: verified.header,
      sourceAcquisition: acquisition,
      sourcePath,
      rawDwgIncluded: false,
      publicRawDwgAccess: false,
      coordinateSpace: "source_cad",
      sourceCrs: null,
      geographicAlignmentVerified: false,
      cadastralOverlayAllowed: false,
      canonicalPromotionAllowed: false,
      mobileMustUseDerivedTilesOnly: true,
      grid,
      segmentFormat: ["x1", "y1", "x2", "y2", "layerId"],
      pointFormat: ["x", "y", "layerId", "entityType", "blockName"],
      labelFormat: ["x", "y", "layerId", "text", "entityType"],
      totalEntities: entities.length,
      totalLineSegments: segments.length,
      matchedNetworkSegments: segments.length,
      pointCount: points.length,
      labelCount: labels.length,
      writtenTileCount: tileIndex.length,
      overflowSegmentCount: 0,
      allBounds: { minX, minY, maxX, maxY },
      coreBounds: core,
      outsideCoreEntityCount: outsideCoreCount,
      densestTileSegments,
      layers: layerNames,
      topLayers,
      tiles: tileIndex,
      coverage: {
        entityTypeCounts,
        unsupportedTypeCounts,
        unsupportedCount,
        approximationCounts,
        unknownEntityCount: Number(result?.stats?.unknownEntityCount || 0),
        blockInsertCount,
        expandedBlockEntityCount,
        nonPlanarEntityCount,
        sourceCadPreviewGenerated: true,
        geographicAlignmentVerified: false,
        completeEngineeringCoverageClaimed: false,
      },
      truth: {
        sourceBytesModified: false,
        rawMasterExposedToBrowser: false,
        sourceCadPreviewIsDerived: true,
        geographicOverlayRequiresSeparateAlignmentEvidence: true,
        unsupportedEntitiesAreCountedNotSilentlyDropped: true,
        visualFounderReviewRequired: true,
      },
    };

    fs.writeFileSync(
      path.join(outputDir, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
      "utf8",
    );

    const upload = await uploadDerived(outputDir, manifest, tileFiles);

    console.log(
      JSON.stringify(
        {
          ok: true,
          marker: "pantavion_water_map_b_derived_generator_v1",
          sourceKey: SOURCE_KEY,
          mapId: EXPECTED.mapId,
          canonical: EXPECTED.canonical,
          outputDir,
          source: {
            fileName: EXPECTED.fileName,
            byteSize: verified.size,
            sha256: verified.sha256,
            header: verified.header,
          },
          derived: {
            totalEntities: entities.length,
            segments: segments.length,
            points: points.length,
            labels: labels.length,
            tiles: tileIndex.length,
            layers: layerNames.length,
            unsupportedCount,
            nonPlanarEntityCount,
            geographicAlignmentVerified: false,
          },
          upload,
        },
        null,
        2,
      ),
    );
  } finally {
    if (dwg) libredwg.dwg_free(dwg);
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        reason: "map_b_derived_generator_failed",
        message: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
