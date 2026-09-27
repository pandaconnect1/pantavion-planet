#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { Dwg_File_Type, LibreDwg } from "@mlightcad/libredwg-web";

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
      "water-network-private/source-masters/map-b-original/MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
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
      "water-network-private/source-masters/map-c-original/GEORGE_MAP_MASTER_B_C_FINAL (4).dwg",
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

const GENERATOR_VERSION = "pantavion-map-b-derived-v1";
const DEFAULT_GRID = 64;
const MAX_GRID = 256;
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

  const { data, error } = await admin.storage.from(STORAGE.bucket).download(STORAGE.sourcePath);
  if (error || !data) {
    fail("map_b_source_private_download_failed", {
      storageBucket: STORAGE.bucket,
      storagePath: STORAGE.sourcePath,
      message: error?.message || "missing_private_object",
    });
  }

  const arrayBuffer = await data.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    sourcePath: `supabase://${STORAGE.bucket}/${STORAGE.sourcePath}`,
    acquisition: "supabase_private_storage",
  };
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

  const concurrency = 8;
  let uploadedTiles = 0;

  for (let i = 0; i < tileFiles.length; i += concurrency) {
    const batch = tileFiles.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (fileName) => {
        const local = path.join(outputDir, "tiles", fileName);
        const remote = `${STORAGE.derivedPrefix}/tiles/${fileName}`;
        const { error } = await admin.storage.from(STORAGE.bucket).upload(
          remote,
          fs.readFileSync(local),
          { upsert: true, contentType: "application/json", cacheControl: "60" },
        );
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

    const requestedGrid = Number(process.env.PANTAVION_WATER_MAP_B_TILE_GRID || DEFAULT_GRID);
    const grid = clamp(Number.isInteger(requestedGrid) ? requestedGrid : DEFAULT_GRID, MIN_GRID, MAX_GRID);
    const width = maxX - minX;
    const height = maxY - minY;
    const tileMap = new Map();

    function coordinatesToTile(x, y) {
      const nx = width > 0 ? (x - minX) / width : 0;
      const ny = height > 0 ? (y - minY) / height : 0;
      return {
        x: clamp(Math.floor(nx * grid), 0, grid - 1),
        y: clamp(Math.floor(ny * grid), 0, grid - 1),
      };
    }

    function tileRecord(x, y) {
      const key = tileKey(x, y);
      if (!tileMap.has(key)) {
        tileMap.set(key, { x, y, segments: [], points: [], labels: [] });
      }
      return tileMap.get(key);
    }

    for (const segment of segments) {
      const [x1, y1, x2, y2] = segment;
      const mid = coordinatesToTile((x1 + x2) / 2, (y1 + y2) / 2);
      tileRecord(mid.x, mid.y).segments.push(segment);
    }

    for (const point of points) {
      const t = coordinatesToTile(point[0], point[1]);
      tileRecord(t.x, t.y).points.push(point);
    }

    for (const label of labels) {
      const t = coordinatesToTile(label[0], label[1]);
      tileRecord(t.x, t.y).labels.push(label);
    }

    const outputDir = process.env.PANTAVION_WATER_MAP_B_DERIVED_OUT
      ? path.resolve(process.env.PANTAVION_WATER_MAP_B_DERIVED_OUT)
      : path.join(repoRoot, ".pantavion", "water", "map-b-derived", EXPECTED.sha256);
    const tilesDir = path.join(outputDir, "tiles");
    fs.mkdirSync(tilesDir, { recursive: true });

    const tileIndex = [];
    const tileFiles = [];

    for (const tile of [...tileMap.values()].sort((a, b) => a.y - b.y || a.x - b.x)) {
      const file = `master-b-tile-${tile.x}-${tile.y}.json`;
      const payload = {
        ok: true,
        schemaVersion: "pantavion-water-map-b-derived-tile-v1",
        sourceSha256: EXPECTED.sha256,
        tileX: tile.x,
        tileY: tile.y,
        grid,
        rawDwgIncluded: false,
        coordinateSpace: "source_cad",
        segmentFormat: ["x1", "y1", "x2", "y2", "layerId"],
        pointFormat: ["x", "y", "layerId", "entityType", "blockName"],
        labelFormat: ["x", "y", "layerId", "text", "entityType"],
        segments: tile.segments,
        points: tile.points,
        labels: tile.labels,
      };

      fs.writeFileSync(path.join(tilesDir, file), JSON.stringify(payload), "utf8");
      tileFiles.push(file);
      tileIndex.push({
        x: tile.x,
        y: tile.y,
        file: `tiles/${file}`,
        segmentCount: tile.segments.length,
        pointCount: tile.points.length,
        labelCount: tile.labels.length,
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
      coreBounds: { minX, minY, maxX, maxY },
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
