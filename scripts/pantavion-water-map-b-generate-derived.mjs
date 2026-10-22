#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { Dwg_File_Type, LibreDwg } from "@mlightcad/libredwg-web";
import { loadApprovedOwnerDwg } from "./water-approved-owner-dwg-loader.mjs";
import { extractAuthentic } from "./water-cad-authentic-extract.mjs";
import { buildWaterNetworkDiscovery } from "./water-network-discovery.mjs";

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

const GENERATOR_VERSION = "pantavion-map-b-derived-v4";
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

// ---- network inventory --------------------------------------------------
// What the drawing holds, by layer and block name, plus every text that names
// a tank, valve, hydrant or one of the network's areas. This is the evidence
// the valve/tank register and the area split are built from; nothing here is
// guessed, every entry points back to a layer, block or text of the source.
const INVENTORY_KEYWORDS = {
  flow_reference: /ΡΟΗ|ΚΑΤΕΥΘΥΝ|ΤΡΟΦΟΔ|ΥΔΡΟΔΟΤ|ΕΙΣΑΓΩΓ|ΕΞΑΓΩΓ|FLOW|DIRECTION|SUPPLY|INLET|OUTLET|FEED/i,
  tank: /ΔΕΞΑΜΕΝ|DEXAMEN|TANK|RESERVOIR|ΔΕΞ\./i,
  valve: /ΒΑΝ[ΑΕΙ]|ΒΑΛΒ|VALVE|VALV|\bBANA|\bG\.?V\b|\bS\.?V\b|ΔΙΚΛΙΔ/i,
  hydrant: /ΥΔΡΟΣΤΟΜ|ΠΥΡΟΣΒ|HYDRANT|\bF\.?H\b/i,
  pump: /ΑΝΤΛΙΟΣΤΑΣ|ΑΝΤΛΙ|PUMP/i,
  meter: /ΜΕΤΡΗΤ|METER/i,
  borehole: /ΓΕΩΤΡΗΣ|BOREHOLE|ΠΗΓΗ/i,
  area_amathounta: /ΑΜΑΘΟΥΝΤ|AMATH/i,
  area_germasogeia: /ΓΕΡΜΑΣΟΓ|YERMAS|GERMAS/i,
  area_parekklisia: /ΠΑΡΕΚΚΛΗΣ|PAREKKL|PAREKL/i,
  area_pyrgos: /ΠΥΡΓΟ|PYRGO|PIRGO/i,
  area_agios_tychonas: /ΤΥΧΩΝ|TYCHON|TIHON|TYHON/i,
  area_moutagiaka: /ΜΟΥΤΑΓΙΑΚ|MOUTAG|MOUTAY|MOUTAJ/i,
  area_armenochori: /ΑΡΜΕΝΟΧΩΡ|ARMENOCH|ARMENOX/i,
  area_agios_athanasios: /ΑΘΑΝΑΣ|ATHANAS/i,
  area_finikaria: /ΦΟΙΝΙΚΑΡ|FINIKAR|FOINIKAR|PHINIKAR/i,
  area_akrounta: /ΑΚΡΟΥΝΤ|AKROUNT|AKRUNT/i,
};

// Magenta/pink as drawn: ACI 6, ACI 200-249 (hues 285-360), or an RGB with red
// high, blue present and green low.
function isPinkColor(c) {
  const s = String(c || "");
  const aci = /^aci(\d+)$/i.exec(s);
  if (aci) { const n = Number(aci[1]); return n === 6 || (n >= 200 && n <= 249); }
  const hex = /^#?([0-9a-f]{6})$/i.exec(s);
  if (!hex) return false;
  const v = parseInt(hex[1], 16);
  const r = v >> 16, g = (v >> 8) & 255, b = v & 255;
  return r >= 170 && b >= 90 && g <= 170 && r - g >= 50;
}

// ---- network register -----------------------------------------------------
// Areas: each supply area is a layer named by its number, drawn in dashed pink.
// Its segments are chained into rings; a ring closes when its ends meet within
// RING_GAP drawing units. An area whose lines never close falls back to the
// convex hull of its lines and says so (outline: "hull").
// Assets: valves (W-DV* blocks, diameter from the layer), air valves, hydrants
// and tanks, each with its nearest tag text and the area that contains it.
// Numbering inside an area runs from east to west (then north to south).
// Copies drawn far outside the network (x > 300000) are kept out and counted.
const RING_GAP = 5;
const DUPLICATE_COPY_X = 300000;

function chainRings(segs) {
  const key = (x, y) => `${Math.round(x * 20)},${Math.round(y * 20)}`;
  const adj = new Map();
  const add = (k, i) => { const l = adj.get(k); if (l) l.push(i); else adj.set(k, [i]); };
  segs.forEach((s, i) => { add(key(s[0], s[1]), i); add(key(s[2], s[3]), i); });
  const used = new Uint8Array(segs.length);
  const chains = [];
  for (let i = 0; i < segs.length; i += 1) {
    if (used[i]) continue;
    used[i] = 1;
    const pts = [[segs[i][0], segs[i][1]], [segs[i][2], segs[i][3]]];
    for (const dir of [1, 0]) {
      for (;;) {
        const end = dir ? pts[pts.length - 1] : pts[0];
        const next = (adj.get(key(end[0], end[1])) || []).find((j) => !used[j]);
        if (next === undefined) break;
        used[next] = 1;
        const s = segs[next];
        const forward = key(s[0], s[1]) === key(end[0], end[1]);
        const far = forward ? [s[2], s[3]] : [s[0], s[1]];
        if (dir) pts.push(far); else pts.unshift(far);
      }
    }
    chains.push(pts);
  }
  // Join chain ends that almost meet, then keep the loops that close.
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  let merged = true;
  while (merged) {
    merged = false;
    for (let a = 0; a < chains.length && !merged; a += 1) {
      for (let b = a + 1; b < chains.length && !merged; b += 1) {
        const A = chains[a], B = chains[b];
        const options = [
          [d(A[A.length - 1], B[0]), () => A.concat(B)],
          [d(A[A.length - 1], B[B.length - 1]), () => A.concat([...B].reverse())],
          [d(A[0], B[B.length - 1]), () => B.concat(A)],
          [d(A[0], B[0]), () => [...B].reverse().concat(A)],
        ].sort((x, y) => x[0] - y[0]);
        if (options[0][0] <= RING_GAP) { chains[a] = options[0][1](); chains.splice(b, 1); merged = true; }
      }
    }
  }
  return chains.filter((c) => c.length >= 4 && d(c[0], c[c.length - 1]) <= RING_GAP);
}

function convexHull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  for (const q of p.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function ringArea(r) {
  let a = 0;
  for (let i = 0; i < r.length; i += 1) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]; a += x1 * y2 - x2 * y1; }
  return Math.abs(a) / 2;
}

function insideRing(x, y, r) {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i, i += 1) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function buildNetworkRegister({ segments, texts, blockRefs, layers, styles }) {
  const layerName = (id) => layers[id]?.name || `layer-${id}`;
  const areaSegs = new Map();
  for (const s of segments) {
    const st = styles[s[5]];
    if (!st?.lt || !isPinkColor(st.c)) continue;
    const name = layerName(s[4]);
    if (!/^\d{3}/.test(name)) continue;
    if (s[0] > DUPLICATE_COPY_X || s[2] > DUPLICATE_COPY_X) continue;
    const l = areaSegs.get(name);
    if (l) l.push(s); else areaSegs.set(name, [s]);
  }
  const areas = [];
  for (const [name, segs] of areaSegs) {
    let rings = chainRings(segs);
    let outline = "closed";
    if (!rings.length) {
      outline = "hull";
      rings = [convexHull(segs.flatMap((s) => [[s[0], s[1]], [s[2], s[3]]]))];
    }
    rings.sort((a, b) => ringArea(b) - ringArea(a));
    const ring = rings[0];
    const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
    const r2 = (v) => Math.round(v * 100) / 100;
    areas.push({
      code: name.match(/^\d{3}[A-Z]?/)[0], layer: name, outline, segments: segs.length, rings: rings.length,
      areaM2: Math.round(ringArea(ring)),
      bounds: [r2(Math.min(...xs)), r2(Math.min(...ys)), r2(Math.max(...xs)), r2(Math.max(...ys))],
      centroid: [r2(xs.reduce((a, b) => a + b, 0) / xs.length), r2(ys.reduce((a, b) => a + b, 0) / ys.length)],
      ring: ring.map(([x, y]) => [r2(x), r2(y)]),
    });
  }
  // Two layers can share a number ("930 (SYKAMINOU 1)", "930 (PANTHEA)"):
  // those keep the number and add the rest of the layer name.
  const seen = new Map();
  for (const a of areas) seen.set(a.code, (seen.get(a.code) || 0) + 1);
  for (const a of areas) {
    if (seen.get(a.code) < 2) continue;
    const rest = a.layer.slice(a.code.length).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    a.code = rest ? `${a.code}-${rest}` : `${a.code}-${a.layer.length}`;
  }
  areas.sort((a, b) => a.areaM2 - b.areaM2);
  const areaOf = (x, y) => {
    for (const a of areas) {
      const [x0, y0, x1, y1] = a.bounds;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      if (insideRing(x, y, a.ring)) return a.code;
    }
    return null;
  };

  // Tag texts for valves: W-DV-T labels and valve notes, on a coarse grid.
  const tagCell = 25;
  const tags = new Map();
  for (const t of texts) {
    const ln = layerName(t[2]);
    if (!/^W-DV-T$|^W-WM$|^F\.H\.TEXT$/i.test(ln)) continue;
    const k = `${Math.floor(t[0] / tagCell)},${Math.floor(t[1] / tagCell)}`;
    const l = tags.get(k); const e = { x: t[0], y: t[1], text: String(t[4] || "").replace(/\s+/g, " ").slice(0, 60), layer: ln };
    if (l) l.push(e); else tags.set(k, [e]);
  }
  // Street: the nearest street-name label of the drawing, with its distance.
  const streetCell = 80;
  const streets = new Map();
  for (const t of texts) {
    if (!/^(Street_names|TEXT STREET)$/i.test(layerName(t[2]))) continue;
    if (t[0] > DUPLICATE_COPY_X) continue;
    const name = String(t[4] || "").replace(/\s+/g, " ").trim();
    if (!name || /^\d+$/.test(name)) continue;
    const k = `${Math.floor(t[0] / streetCell)},${Math.floor(t[1] / streetCell)}`;
    const l = streets.get(k); const e = { x: t[0], y: t[1], name: name.slice(0, 60) };
    if (l) l.push(e); else streets.set(k, [e]);
  }
  const nearestStreet = (x, y, max = 120) => {
    let best = null, bd = max;
    const cx = Math.floor(x / streetCell), cy = Math.floor(y / streetCell);
    for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) {
      for (const e of streets.get(`${cx + dx},${cy + dy}`) || []) {
        const dd = Math.hypot(e.x - x, e.y - y);
        if (dd < bd) { bd = dd; best = e; }
      }
    }
    return best ? { name: best.name, distance: Math.round(bd * 10) / 10 } : null;
  };

  const nearestTag = (x, y, max = 15) => {
    let best = null, bd = max;
    const cx = Math.floor(x / tagCell), cy = Math.floor(y / tagCell);
    for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) {
      for (const e of tags.get(`${cx + dx},${cy + dy}`) || []) {
        const dd = Math.hypot(e.x - x, e.y - y);
        if (dd < bd) { bd = dd; best = e; }
      }
    }
    return best ? { text: best.text, layer: best.layer, distance: Math.round(bd * 10) / 10 } : null;
  };

  const assets = [];
  let duplicateCopies = 0;
  for (const b of blockRefs) {
    const ln = layerName(b[2]);
    const block = String(b[3] || "");
    let kind = null, dn = null;
    if (/^W-DV/i.test(ln) || /\$W-DV$|^W-DV$/i.test(block)) {
      kind = "valve";
      const m = /S\s*0*(\d{2,4})/i.exec(ln);
      dn = m ? Number(m[1]) : null;
    } else if (/^A\.V$/i.test(ln) || /AIR VALVE/i.test(block)) kind = "air_valve";
    else if (/^FH$/i.test(ln)) kind = "hydrant";
    else if (/^PRV$/i.test(ln)) kind = "pressure_reducing_valve";
    if (!kind) continue;
    if (b[0] > DUPLICATE_COPY_X) { duplicateCopies += 1; continue; }
    assets.push({ kind, dn, x: Math.round(b[0] * 100) / 100, y: Math.round(b[1] * 100) / 100, layer: ln, block, area: areaOf(b[0], b[1]), street: nearestStreet(b[0], b[1]), tag: kind === "valve" || kind === "hydrant" ? nearestTag(b[0], b[1]) : null });
  }
  for (const t of texts) {
    const ln = layerName(t[2]);
    const text = String(t[4] || "").replace(/\s+/g, " ");
    const plain = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    if (!/ΔΕΞΑΜΕΝ|DEXAMEN|ΥΔΑΤΟΠΥΡΓ/.test(plain) && !/^DEXAMENH$/i.test(ln)) continue;
    // Pipe labels that only point at a tank ("ΕΞΑΓΩΓΗ ΠΡΟΣ … ΔΕΞΑΜΕΝΗ", "ΑΓΩΓΟΣ …") are not tanks.
    if (/ΑΓΩΓ|ΕΞΑΓΩΓ|EΞΑΓΩΓ|ΕΙΣΑΓΩΓ|\bΠΡΟΣ\b|\bPROS\b|PIPE|AGWG|AGOG|VALVE|ΒΑΝΑ/.test(plain)) continue;
    if (t[0] > DUPLICATE_COPY_X) { duplicateCopies += 1; continue; }
    const cap = /(\d[\d.,]*)\s*(M3|M³|ΚΥΒ)/.exec(plain);
    assets.push({ kind: "tank", name: text.slice(0, 80), capacityM3: cap ? Number(cap[1].replace(",", ".")) : null,
      proposed: /ΠΡΟΤΕΙΝΟΜ/.test(plain), x: Math.round(t[0] * 100) / 100, y: Math.round(t[1] * 100) / 100, layer: ln, area: areaOf(t[0], t[1]), street: nearestStreet(t[0], t[1]) });
  }

  // Numbers: per area and kind, east to west, then north to south.
  const prefix = { valve: "V", air_valve: "AV", hydrant: "FH", pressure_reducing_valve: "PRV", tank: "T" };
  const groups = new Map();
  for (const a of assets) {
    const k = `${a.area || "000"}|${a.kind}`;
    const l = groups.get(k); if (l) l.push(a); else groups.set(k, [a]);
  }
  for (const [k, list] of groups) {
    const [area] = k.split("|");
    list.sort((p, q) => q.x - p.x || q.y - p.y);
    list.forEach((a, i) => { a.number = `${area}-${prefix[a.kind]}${String(i + 1).padStart(4, "0")}`; });
  }

  const summary = {};
  for (const a of assets) {
    const k = a.area || "unassigned";
    summary[k] = summary[k] || { valve: 0, air_valve: 0, hydrant: 0, pressure_reducing_valve: 0, tank: 0 };
    summary[k][a.kind] += 1;
  }
  return {
    method: { ringGapUnits: RING_GAP, duplicateCopyX: DUPLICATE_COPY_X, numbering: "area-PREFIXnnnn, east to west then north to south", tagMaxDistance: 15 },
    duplicateCopies,
    areas,
    assets,
    summary,
  };
}

function buildNetworkInventory({ segments, texts, blockRefs, points, layers, styles = [] }) {
  const layerName = (id) => layers[id]?.name || `layer-${id}`;
  const byLayer = new Map();
  const layerRow = (id) => {
    let r = byLayer.get(id);
    if (!r) { r = { layer: layerName(id), sourceOff: layers[id]?.off ?? null, sourceFrozen: layers[id]?.frozen ?? null, segments: 0, blocks: 0, texts: 0, points: 0, minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }; byLayer.set(id, r); }
    return r;
  };
  const grow = (r, x, y) => {
    if (!finite(x) || !finite(y)) return;
    if (x < r.minX) r.minX = x; if (y < r.minY) r.minY = y;
    if (x > r.maxX) r.maxX = x; if (y > r.maxY) r.maxY = y;
  };
  const layerStyles = new Map();
  for (const s of segments) {
    const r = layerRow(s[4]); r.segments += 1; grow(r, s[0], s[1]);
    let m = layerStyles.get(s[4]);
    if (!m) { m = new Map(); layerStyles.set(s[4], m); }
    m.set(s[5], (m.get(s[5]) || 0) + 1);
  }
  for (const t of texts) { const r = layerRow(t[2]); r.texts += 1; grow(r, t[0], t[1]); }
  for (const p of points) layerRow(p[2]).points += 1;

  const blocks = new Map();
  for (const b of blockRefs) {
    const r = layerRow(b[2]); r.blocks += 1; grow(r, b[0], b[1]);
    const name = String(b[3] || "");
    let e = blocks.get(name);
    if (!e) { e = { block: name, count: 0, layers: new Map(), samples: [] }; blocks.set(name, e); }
    e.count += 1;
    e.layers.set(b[2], (e.layers.get(b[2]) || 0) + 1);
    if (e.samples.length < 3) e.samples.push([Math.round(b[0] * 100) / 100, Math.round(b[1] * 100) / 100]);
  }

  const keywords = {};
  for (const [key, re] of Object.entries(INVENTORY_KEYWORDS)) keywords[key] = { count: 0, layers: new Map(), samples: [] };
  for (const t of texts) {
    const text = String(t[4] || "");
    // Greek labels carry accents and mixed case ("Αγ. Τύχωνας"): match on the
    // upper-case text with diacritics removed.
    const plain = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    for (const [key, re] of Object.entries(INVENTORY_KEYWORDS)) {
      if (!re.test(plain)) continue;
      const k = keywords[key];
      k.count += 1;
      k.layers.set(t[2], (k.layers.get(t[2]) || 0) + 1);
      if (k.samples.length < 40) k.samples.push({ text: text.slice(0, 80), layer: layerName(t[2]), x: Math.round(t[0] * 100) / 100, y: Math.round(t[1] * 100) / 100 });
    }
  }
  const topLayers = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ layer: layerName(id), n }));
  const round = (v) => (finite(v) ? Math.round(v) : null);

  // Styles per layer, and the layers drawn mostly in dashed pink: the area and
  // zone boundaries of the network are drawn that way.
  const styleRows = [...layerStyles.entries()].map(([id, m]) => {
    const total = [...m.values()].reduce((a, b) => a + b, 0);
    const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([sid, n]) => ({ color: styles[sid]?.c ?? null, lineType: styles[sid]?.lt ?? null, n }));
    let pinkDashed = 0;
    for (const [sid, n] of m) if (styles[sid]?.lt && isPinkColor(styles[sid]?.c)) pinkDashed += n;
    return { layer: layerName(id), total, pinkDashed, top };
  });
  const pinkDashedLayers = styleRows.filter((r) => r.pinkDashed > 0).sort((a, b) => b.pinkDashed - a.pinkDashed);

  return {
    coverage: {
      hiddenLayersIncluded: true,
      unrepresentedLayers: layers.filter((_, id) => !byLayer.has(id)).map((l) => ({ name: l.name, off: l.off ?? null, frozen: l.frozen ?? null })),
      directionOfWaterFlowVerified: false,
      supplyAreasVerified: false,
    },
    flowEvidence: {
      labelCandidates: texts.filter((t) => INVENTORY_KEYWORDS.flow_reference.test(String(t[4] || "").normalize("NFD").replace(/[\u0300-\u036f]/g, ""))).map((t) => ({ text: String(t[4]), layer: layerName(t[2]), x: t[0], y: t[1] })),
      symbolCandidates: blockRefs.filter((b) => /ARROW|FLOW|DIRECTION|ΒΕΛΟΣ|ΡΟΗ/i.test(String(b[3] || ""))).map((b) => ({ block: b[3], layer: layerName(b[2]), x: b[0], y: b[1], drawingOrientation: b[4] ?? null })),
      verifiedConnections: [],
      candidateSymbolOrientationIsNotVerifiedWaterFlow: true,
    },
    pinkDashedLayers,
    layerStyles: styleRows.sort((a, b) => b.total - a.total),
    totals: { segments: segments.length, texts: texts.length, blockRefs: blockRefs.length, points: points.length, layers: layers.length, blockNames: blocks.size },
    layers: [...byLayer.values()]
      .map((r) => ({ ...r, minX: round(r.minX), minY: round(r.minY), maxX: round(r.maxX), maxY: round(r.maxY) }))
      .sort((a, b) => b.blocks + b.texts + b.segments - (a.blocks + a.texts + a.segments)),
    blocks: [...blocks.values()]
      .sort((a, b) => b.count - a.count)
      .map((e) => ({ block: e.block, count: e.count, layers: topLayers(e.layers), samples: e.samples })),
    keywords: Object.fromEntries(Object.entries(keywords).map(([k, v]) => [k, { count: v.count, layers: topLayers(v.layers), samples: v.samples }])),
  };
}

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

    if (process.env.PANTAVION_WATER_MAP_B_INVENTORY === "YES") {
      const inventory = buildNetworkInventory({ segments, texts, blockRefs, points, layers, styles });
      inventory.register = buildNetworkRegister({ segments, texts, blockRefs, layers, styles });
      inventory.totals.registerAreas = inventory.register.areas.length;
      inventory.totals.registerAssets = inventory.register.assets.length;
      const out = process.env.PANTAVION_WATER_MAP_B_INVENTORY_OUT ||
        path.join(repoRoot, ".pantavion", "water", `map-${EXPECTED.mapId.toLowerCase()}-inventory.json`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, JSON.stringify({ sourceKey: SOURCE_KEY, sourceSha256: verified.sha256, ...inventory }, null, 1) + "\n", "utf8");
      const discovery = buildWaterNetworkDiscovery({ texts, blockRefs, segments, layers, register: inventory.register, leaders: extracted.leaders, stats: extracted.stats, duplicateCutoff: DUPLICATE_COPY_X });
      fs.writeFileSync(out + ".discovery.json", JSON.stringify({ sourceKey: SOURCE_KEY, sourceSha256: verified.sha256, ...discovery }), "utf8");
      console.log(JSON.stringify({ ok: true, marker: "pantavion_water_network_inventory_v1", out, ...inventory.totals }, null, 2));
      return;
    }
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

    // ---- zoom levels (like a street map) ---------------------------------
    // Each overview level has a grid 4x coarser than the one below. A level is
    // meant to be drawn with about 256 px per cell, so geometry is snapped to a
    // 1/256-cell grid: chains of tiny segments collapse onto pixel-sized pieces,
    // exact duplicates are dropped, and what is too small to see is left out.
    // The full-detail tiles stay untouched; overviews only add files.
    const lods = [];
    const LOD_PX = 256;
    const LOD_MAX_SEGMENTS = PART_MAX_SEGMENTS;
    for (let level = 1, g = Math.floor(grid / 4); g >= 2; level += 1, g = Math.floor(g / 4)) {
      const cw = coreWidth / g;
      const ch = coreHeight / g;
      const q = Math.max(cw, ch) / LOD_PX;
      const snap = (v) => Math.round(v / q);
      const lodRange = (lo, hi, min, span) => [cellOf(lo, min, span, g), cellOf(hi, min, span, g)];
      const lodTiles = new Map();
      const lodTile = (x, y) => {
        const key = y * g + x;
        let rec = lodTiles.get(key);
        if (!rec) { rec = { x, y, segments: [], seen: new Set(), fills: [], texts: [] }; lodTiles.set(key, rec); }
        return rec;
      };
      let lodSegments = 0;
      for (const s of segments) {
        const a = snap(s[0]), b = snap(s[1]), c = snap(s[2]), d = snap(s[3]);
        if (a === c && b === d) continue;
        const forward = a < c || (a === c && b < d);
        const key = forward ? `${a},${b},${c},${d},${s[5]},${s[4]}` : `${c},${d},${a},${b},${s[5]},${s[4]}`;
        const out = [a * q, b * q, c * q, d * q, s[4], s[5], s[6], s[7]];
        const [x0, x1] = lodRange(Math.min(out[0], out[2]), Math.max(out[0], out[2]), core.minX, coreWidth);
        const [y0, y1] = lodRange(Math.min(out[1], out[3]), Math.max(out[1], out[3]), core.minY, coreHeight);
        for (let ty = y0; ty <= y1; ty += 1) {
          for (let tx = x0; tx <= x1; tx += 1) {
            const rec = lodTile(tx, ty);
            if (rec.seen.has(key)) continue;
            rec.seen.add(key);
            rec.segments.push(out);
            lodSegments += 1;
          }
        }
      }
      for (const f of fills) {
        let fx0 = Infinity, fy0 = Infinity, fx1 = -Infinity, fy1 = -Infinity;
        const rings = [];
        for (const ring of f[3]) {
          const r = [];
          for (let i = 0; i < ring.length; i += 2) {
            fx0 = Math.min(fx0, ring[i]); fx1 = Math.max(fx1, ring[i]);
            fy0 = Math.min(fy0, ring[i + 1]); fy1 = Math.max(fy1, ring[i + 1]);
            const x = snap(ring[i]) * q, y = snap(ring[i + 1]) * q;
            if (r.length >= 2 && r[r.length - 2] === x && r[r.length - 1] === y) continue;
            r.push(x, y);
          }
          if (r.length >= 6) rings.push(r);
        }
        if (!rings.length || Math.max(fx1 - fx0, fy1 - fy0) < 2 * q) continue;
        const out = [f[0], f[1], f[2], rings, f[4]];
        const [x0, x1] = lodRange(fx0, fx1, core.minX, coreWidth);
        const [y0, y1] = lodRange(fy0, fy1, core.minY, coreHeight);
        for (let ty = y0; ty <= y1; ty += 1) for (let tx = x0; tx <= x1; tx += 1) lodTile(tx, ty).fills.push(out);
      }
      for (const t of texts) {
        if (!(Number(t[5]) >= 3 * q)) continue;
        lodTile(cellOf(t[0], core.minX, coreWidth, g), cellOf(t[1], core.minY, coreHeight, g)).texts.push(t);
      }
      const lodIndex = [];
      let lodWritten = 0;
      for (const rec of [...lodTiles.values()].sort((a, b) => a.y - b.y || a.x - b.x)) {
        rec.seen = null;
        let segs = rec.segments;
        if (segs.length > LOD_MAX_SEGMENTS) {
          // Keep the longest lines: they carry the shape of the network at this scale.
          segs = segs
            .map((s) => [Math.hypot(s[2] - s[0], s[3] - s[1]), s])
            .sort((a, b) => b[0] - a[0])
            .slice(0, LOD_MAX_SEGMENTS)
            .map((e) => e[1])
            .sort((a, b) => a[7] - b[7]);
        }
        const texts_ = rec.texts.slice(0, PART_MAX_LABELS);
        const fills_ = rec.fills.slice(0, PART_MAX_LABELS);
        if (!segs.length && !texts_.length && !fills_.length) continue;
        const file = `master-b-tile-lod${level}-${rec.x}-${rec.y}.json`;
        const payload = {
          ok: true,
          schemaVersion: "pantavion-water-map-b-derived-tile-v3",
          sourceSha256: EXPECTED.sha256,
          lodLevel: level,
          tileX: rec.x,
          tileY: rec.y,
          part: 0,
          parts: 1,
          grid: g,
          snapUnits: q,
          rawDwgIncluded: false,
          coordinateSpace: "source_cad",
          segmentFormat: ["x1", "y1", "x2", "y2", "layerId", "styleId", "linetypePhase", "drawOrder"],
          fillFormat: ["layerId", "styleId", "kind(0 fill,1 wipeout)", "rings", "drawOrder"],
          textFormat: ["x", "y", "layerId", "styleId", "text", "height", "rotation", "hAlign", "vAlign", "widthFactor", "mirrored", "drawOrder", "multiline"],
          segments: segs,
          fills: fills_,
          texts: texts_,
          points: [],
          blockRefs: [],
        };
        fs.writeFileSync(path.join(tilesDir, file), JSON.stringify(payload), "utf8");
        tileFiles.push(file);
        lodWritten += segs.length;
        lodIndex.push({
          x: rec.x, y: rec.y, part: 0, parts: 1, file: `tiles/${file}`,
          segmentCount: segs.length, fillCount: fills_.length, pointCount: 0, labelCount: texts_.length,
        });
      }
      lods.push({ level, grid: g, snapUnits: q, pixelsPerCell: LOD_PX, segments: lodWritten, uniqueSnappedSegments: lodSegments, tiles: lodIndex });
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
      // Coarser overview levels for zoomed-out views; finest first.
      lods,
      coverage: {
        entityTypeCounts: extracted.stats.entityTypes,
        drawnTypeCounts: extracted.stats.drawnTypes,
        notReproduced: extracted.stats.notReproduced,
        notReproducedCount,
        firstExtractErrors: extracted.stats.firstErrors || [],
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
            lods: lods.map((l) => ({ level: l.level, grid: l.grid, tiles: l.tiles.length, segments: l.segments })),
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
        stack: error instanceof Error ? String(error.stack || "").split("\n").slice(0, 8) : [],
      },
      null,
      2,
    ),
  );
  process.exit(1);
});

