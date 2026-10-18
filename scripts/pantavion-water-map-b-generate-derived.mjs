#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { Dwg_File_Type, LibreDwg } from "@mlightcad/libredwg-web";
import { loadApprovedOwnerDwg } from "./water-approved-owner-dwg-loader.mjs";
import { extractAuthentic } from "./water-cad-authentic-extract.mjs";

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

const GENERATOR_VERSION = "pantavion-map-b-derived-v3";
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

    const extracted = extractAuthentic(database);
    const { segments, fills, texts, points, blockRefs, styles, layers, linetypes } = extracted;
    const entities = Array.isArray(database.entities) ? database.entities : [];

    if (segments.length === 0) {
      fail("map_b_no_renderable_segments_extracted", { stats: extracted.stats });
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    function includeXY(x, y) {
      if (!finite(x) || !finite(y)) return;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    for (const s of segments) { includeXY(s[0], s[1]); includeXY(s[2], s[3]); }
    for (const t of texts) includeXY(t[0], t[1]);
    for (const p of points) includeXY(p[0], p[1]);
    if (![minX, minY, maxX, maxY].every(finite) || maxX <= minX || maxY <= minY) {
      fail("map_b_derived_bounds_invalid", { minX, minY, maxX, maxY });
    }

    // Grid over the dense core (see robustCoreBounds); geometry outside the core
    // is clamped into the edge tiles, never dropped.
    const core = robustCoreBounds(segments, { minX, minY, maxX, maxY });
    const coreWidth = core.maxX - core.minX;
    const coreHeight = core.maxY - core.minY;
    const cellOf = (v, lo, span, g) => clamp(Math.floor(((v - lo) / span) * g), 0, g - 1);

    function maxSegmentsPerTile(g) {
      const counts = new Map();
      let max = 0;
      for (const s of segments) {
        const key = cellOf((s[1] + s[3]) / 2, core.minY, coreHeight, g) * g + cellOf((s[0] + s[2]) / 2, core.minX, coreWidth, g);
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
      let rec = tileMap.get(key);
      if (!rec) {
        rec = { x, y, segments: [], fills: [], texts: [], points: [], blockRefs: [] };
        tileMap.set(key, rec);
      }
      return rec;
    }
    const range = (lo, hi, min, span) => [cellOf(lo, min, span, grid), cellOf(hi, min, span, grid)];

    // A line belongs to every tile its extent touches, so it is drawn whenever any
    // part of it is on screen. Duplicates across tiles draw on the same pixels.
    let segmentTileRefs = 0;
    for (const s of segments) {
      const [x0, x1] = range(Math.min(s[0], s[2]), Math.max(s[0], s[2]), core.minX, coreWidth);
      const [y0, y1] = range(Math.min(s[1], s[3]), Math.max(s[1], s[3]), core.minY, coreHeight);
      for (let ty = y0; ty <= y1; ty += 1) {
        for (let tx = x0; tx <= x1; tx += 1) { tileRecord(tx, ty).segments.push(s); segmentTileRefs += 1; }
      }
    }
    let fillTileRefs = 0;
    for (const f of fills) {
      let fx0 = Infinity, fy0 = Infinity, fx1 = -Infinity, fy1 = -Infinity;
      for (const ring of f[3]) for (let i = 0; i < ring.length; i += 2) {
        fx0 = Math.min(fx0, ring[i]); fx1 = Math.max(fx1, ring[i]);
        fy0 = Math.min(fy0, ring[i + 1]); fy1 = Math.max(fy1, ring[i + 1]);
      }
      const [x0, x1] = range(fx0, fx1, core.minX, coreWidth);
      const [y0, y1] = range(fy0, fy1, core.minY, coreHeight);
      for (let ty = y0; ty <= y1; ty += 1) for (let tx = x0; tx <= x1; tx += 1) { tileRecord(tx, ty).fills.push(f); fillTileRefs += 1; }
    }
    for (const t of texts) tileRecord(cellOf(t[0], core.minX, coreWidth, grid), cellOf(t[1], core.minY, coreHeight, grid)).texts.push(t);
    for (const p of points) tileRecord(cellOf(p[0], core.minX, coreWidth, grid), cellOf(p[1], core.minY, coreHeight, grid)).points.push(p);
    for (const b of blockRefs) tileRecord(cellOf(b[0], core.minX, coreWidth, grid), cellOf(b[1], core.minY, coreHeight, grid)).blockRefs.push(b);

    const outputDir = process.env.PANTAVION_WATER_MAP_B_DERIVED_OUT
      ? path.resolve(process.env.PANTAVION_WATER_MAP_B_DERIVED_OUT)
      : path.join(repoRoot, ".pantavion", "water", "map-b-derived", EXPECTED.sha256);
    const tilesDir = path.join(outputDir, "tiles");
    fs.mkdirSync(tilesDir, { recursive: true });

    const tileIndex = [];
    const tileFiles = [];
    const written = { segments: 0, fills: 0, texts: 0, points: 0, blockRefs: 0 };

    for (const tile of [...tileMap.values()].sort((a, b) => a.y - b.y || a.x - b.x)) {
      const parts = Math.max(
        1,
        Math.ceil(tile.segments.length / PART_MAX_SEGMENTS),
        Math.ceil(tile.texts.length / PART_MAX_LABELS),
        Math.ceil((tile.points.length + tile.blockRefs.length) / PART_MAX_POINTS),
        Math.ceil(tile.fills.length / PART_MAX_LABELS),
      );
      const slice = (list, part) => {
        const size = Math.ceil(list.length / parts);
        return list.slice(part * size, (part + 1) * size);
      };
      for (let part = 0; part < parts; part += 1) {
        const file = part === 0 ? `master-b-tile-${tile.x}-${tile.y}.json` : `master-b-tile-${tile.x}-${tile.y}-p${part}.json`;
        const payload = {
          ok: true,
          schemaVersion: "pantavion-water-map-b-derived-tile-v3",
          sourceSha256: EXPECTED.sha256,
          tileX: tile.x,
          tileY: tile.y,
          part,
          parts,
          grid,
          rawDwgIncluded: false,
          coordinateSpace: "source_cad",
          segmentFormat: ["x1", "y1", "x2", "y2", "layerId", "styleId", "linetypePhase", "drawOrder"],
          fillFormat: ["layerId", "styleId", "kind(0 fill,1 wipeout)", "rings", "drawOrder"],
          textFormat: ["x", "y", "layerId", "styleId", "text", "height", "rotation", "hAlign", "vAlign", "widthFactor", "mirrored", "drawOrder", "multiline"],
          pointFormat: ["x", "y", "layerId", "styleId", "drawOrder"],
          blockRefFormat: ["x", "y", "layerId", "blockName"],
          segments: slice(tile.segments, part),
          fills: slice(tile.fills, part),
          texts: slice(tile.texts, part),
          points: slice(tile.points, part),
          blockRefs: slice(tile.blockRefs, part),
        };
        fs.writeFileSync(path.join(tilesDir, file), JSON.stringify(payload), "utf8");
        for (const k of Object.keys(written)) written[k] += payload[k].length;
        tileFiles.push(file);
        tileIndex.push({
          x: tile.x,
          y: tile.y,
          part,
          parts,
          file: `tiles/${file}`,
          segmentCount: payload.segments.length,
          fillCount: payload.fills.length,
          pointCount: payload.points.length,
          labelCount: payload.texts.length,
        });
      }
    }

    if (written.segments !== segmentTileRefs || written.fills !== fillTileRefs ||
        written.texts !== texts.length || written.points !== points.length || written.blockRefs !== blockRefs.length) {
      fail("map_b_derived_tile_coverage_mismatch", { written, segmentTileRefs, fillTileRefs, texts: texts.length, points: points.length });
    }

    const layerSegmentCounts = new Map();
    for (const s of segments) layerSegmentCounts.set(s[4], (layerSegmentCounts.get(s[4]) || 0) + 1);
    const topLayers = [...layerSegmentCounts.entries()]
      .map(([id, count]) => ({ layer: layers[id]?.name || `layer-${id}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);

    const notReproducedCount = Object.values(extracted.stats.notReproduced).reduce((sum, v) => sum + Number(v || 0), 0);

    const manifest = {
      ok: true,
      schemaVersion: "pantavion-water-map-b-derived-manifest-v3",
      sourceKey: SOURCE_KEY,
      mapId: EXPECTED.mapId,
      canonical: EXPECTED.canonical,
      generatorVersion: GENERATOR_VERSION,
      extractorVersion: extracted.version,
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
      cadHeader: extracted.header,
      layers: layers.map((l) => l.name),
      layerInfo: layers.map((l) => ({ color: l.color, aci: l.aci, off: l.off, frozen: l.frozen, lineType: l.lineType })),
      styles,
      linetypes,
      segmentFormat: ["x1", "y1", "x2", "y2", "layerId", "styleId", "linetypePhase", "drawOrder"],
      totalEntities: entities.length,
      totalLineSegments: segments.length,
      matchedNetworkSegments: segments.length,
      fillCount: fills.length,
      pointCount: points.length,
      labelCount: texts.length,
      blockRefCount: blockRefs.length,
      writtenTileCount: tileIndex.length,
      overflowSegmentCount: 0,
      segmentTileRefs,
      densestTileSegments,
      allBounds: { minX, minY, maxX, maxY },
      coreBounds: core,
      topLayers,
      tiles: tileIndex,
      coverage: {
        entityTypeCounts: extracted.stats.entityTypes,
        drawnTypeCounts: extracted.stats.drawnTypes,
        notReproduced: extracted.stats.notReproduced,
        notReproducedCount,
        hatchPatternTruncated: extracted.stats.hatchPatternTruncated,
        mtextWithInlineFormatting: extracted.stats.mtextFormattingCodes,
        ocsTransformedEntities: extracted.stats.ocsTransformed,
        onHiddenLayers: extracted.stats.hiddenByLayerState,
        unknownEntityCount: Number(result?.stats?.unknownEntityCount || 0),
        curveChordToleranceUnits: 0.005,
        shxFontsRenderedWithSystemFont: true,
        geographicAlignmentVerified: false,
        completeEngineeringCoverageClaimed: false,
      },
      truth: {
        sourceBytesModified: false,
        rawMasterExposedToBrowser: false,
        coloursLinetypesLineweightsFromSource: true,
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
            fills: fills.length,
            points: points.length,
            texts: texts.length,
            blockRefs: blockRefs.length,
            tiles: tileIndex.length,
            layers: layers.length,
            styles: styles.length,
            densestTileSegments,
            segmentTileRefs,
            notReproduced: extracted.stats.notReproduced,
            ocsTransformed: extracted.stats.ocsTransformed,
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
