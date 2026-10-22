// Faithful extraction of displayable geometry from a LibreDWG-converted database.
//
// Goal: what the viewer draws must look like the drawing does in AutoCAD's plan
// view. Every primitive keeps its source coordinates and its own resolved
// display properties (colour, linetype, lineweight, linetype scale), resolved
// with AutoCAD's ByLayer / ByBlock rules. Nothing is restyled, recoloured,
// filtered by importance or simplified.
//
// Curves have no straight-line form, so they are sampled with a chord error of at
// most CURVE_TOLERANCE drawing units (5 mm for a metre drawing), which is below
// anything a screen can show. Everything that cannot be reproduced is counted and
// reported, never silently dropped.

export const EXTRACTOR_VERSION = "pantavion-cad-authentic-extract-v1";
const CURVE_TOLERANCE = 0.005;
const MAX_CURVE_STEPS = 4096;
const MAX_HATCH_PATTERN_SEGMENTS = 3_000_000;
const TAU = Math.PI * 2;

const finite = (v) => typeof v === "number" && Number.isFinite(v);
const num = (v, d = 0) => (finite(Number(v)) ? Number(v) : d);
const p2 = (v) => (v && finite(Number(v.x)) && finite(Number(v.y)) ? { x: Number(v.x), y: Number(v.y), z: num(v.z) } : null);

// ---- AutoCAD Color Index ---------------------------------------------------
function hsv(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)].map((c) => Math.floor(c * 255 + 1e-9));
}
const hex = (rgb) => "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");
const ACI = (() => {
  const t = new Array(256).fill("#ffffff");
  const base = ["#000000", "#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff", "aci7", "#808080", "#c0c0c0"];
  base.forEach((c, i) => (t[i] = c));
  const levels = [1, 0.65, 0.5, 0.3, 0.15];
  for (let i = 10; i <= 249; i += 1) {
    const hue = Math.floor((i - 10) / 10) * 15;
    const k = i % 10;
    t[i] = hex(hsv(hue, k % 2 === 0 ? 1 : 0.5, levels[Math.floor(k / 2)]));
  }
  [[51, 51, 51], [91, 91, 91], [132, 132, 132], [173, 173, 173], [214, 214, 214], [255, 255, 255]]
    .forEach((rgb, j) => (t[250 + j] = hex(rgb)));
  return t;
})();
export function aciColor(index) {
  return ACI[Math.abs(Math.trunc(index)) % 256];
}

// DWG stores lineweight as an index; values are hundredths of a millimetre.
const LW_TABLE = [0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211];
const LW_BYLAYER = 29;
const LW_BYBLOCK = 30;

// ---- Object Coordinate System (AutoCAD arbitrary axis algorithm) -----------
function cross(a, b) {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function unit(v) {
  const l = Math.hypot(v.x, v.y, v.z);
  return l > 0 ? { x: v.x / l, y: v.y / l, z: v.z / l } : null;
}
// Returns a 2D affine transform OCS->WCS (plan view), or identity for +Z.
export function ocsTransform(extrusion, elevation = 0) {
  const n = extrusion ? unit({ x: num(extrusion.x), y: num(extrusion.y), z: num(extrusion.z, 1) }) : null;
  if (!n || (Math.abs(n.x) < 1e-12 && Math.abs(n.y) < 1e-12 && n.z > 0)) return null;
  const ax = unit(Math.abs(n.x) < 1 / 64 && Math.abs(n.y) < 1 / 64 ? cross({ x: 0, y: 1, z: 0 }, n) : cross({ x: 0, y: 0, z: 1 }, n));
  const ay = unit(cross(n, ax));
  return { a: ax.x, b: ax.y, c: ay.x, d: ay.y, tx: n.x * elevation, ty: n.y * elevation };
}

const IDENTITY = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
export function apply(t, p) {
  return { x: t.a * p.x + t.c * p.y + t.tx, y: t.b * p.x + t.d * p.y + t.ty };
}
export function compose(parent, local) {
  return {
    a: parent.a * local.a + parent.c * local.b,
    b: parent.b * local.a + parent.d * local.b,
    c: parent.a * local.c + parent.c * local.d,
    d: parent.b * local.c + parent.d * local.d,
    tx: parent.a * local.tx + parent.c * local.ty + parent.tx,
    ty: parent.b * local.tx + parent.d * local.ty + parent.ty,
  };
}
const withOcs = (t, entity, elevation) => {
  const o = ocsTransform(entity?.extrusionDirection, elevation);
  return o ? compose(t, o) : t;
};
const scaleOf = (t) => Math.sqrt(Math.abs(t.a * t.d - t.b * t.c)) || 1;
const angleOf = (t, rot) => Math.atan2(t.b * Math.cos(rot) + t.d * Math.sin(rot), t.a * Math.cos(rot) + t.c * Math.sin(rot));
const mirrored = (t) => t.a * t.d - t.b * t.c < 0;

// ---- curve sampling ------------------------------------------------------------
function arcSteps(radius, sweep) {
  const r = Math.abs(radius);
  if (!(r > CURVE_TOLERANCE)) return 2;
  const step = 2 * Math.acos(1 - CURVE_TOLERANCE / r);
  return Math.max(2, Math.min(MAX_CURVE_STEPS, Math.ceil(Math.abs(sweep) / step)));
}
export function sampleArc(c, r, start, sweep) {
  const n = arcSteps(r, sweep);
  const out = [];
  for (let i = 0; i <= n; i += 1) {
    const a = start + (sweep * i) / n;
    out.push({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) });
  }
  return out;
}
function ccwSweep(start, end) {
  let s = end - start;
  while (s <= 0) s += TAU;
  return s;
}
export function sampleBulge(a, b, bulge) {
  if (!finite(bulge) || Math.abs(bulge) < 1e-12) return [a, b];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const chord = Math.hypot(dx, dy);
  if (!(chord > 0)) return [a, b];
  const theta = 4 * Math.atan(bulge);
  const h = chord / (2 * Math.tan(theta / 2));
  const c = { x: (a.x + b.x) / 2 - (dy / chord) * h, y: (a.y + b.y) / 2 + (dx / chord) * h };
  const r = Math.hypot(a.x - c.x, a.y - c.y);
  const pts = sampleArc(c, r, Math.atan2(a.y - c.y, a.x - c.x), theta);
  pts[0] = a;
  pts[pts.length - 1] = b;
  return pts;
}
function sampleEllipseWcs(e) {
  const c = p2(e.center);
  const m = p2(e.majorAxisEndPoint);
  const ratio = num(e.axisRatio);
  if (!c || !m || !(ratio > 0)) return [];
  const n = unit({ x: num(e.extrusionDirection?.x), y: num(e.extrusionDirection?.y), z: num(e.extrusionDirection?.z, 1) }) || { x: 0, y: 0, z: 1 };
  const minor = cross(n, { x: m.x, y: m.y, z: m.z || 0 });
  const start = num(e.startAngle);
  const sweep = ccwSweep(start, num(e.endAngle, TAU));
  const steps = arcSteps(Math.hypot(m.x, m.y), sweep);
  const out = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = start + (sweep * i) / steps;
    out.push({
      x: c.x + m.x * Math.cos(t) + minor.x * ratio * Math.sin(t),
      y: c.y + m.y * Math.cos(t) + minor.y * ratio * Math.sin(t),
    });
  }
  return out;
}
function nurbs(cps, knots, weights, degree, u) {
  const n = cps.length - 1;
  let basis = new Array(cps.length).fill(0);
  for (let i = 0; i <= n; i += 1) {
    if ((u >= knots[i] && u < knots[i + 1]) || (i === n && u === knots[n + 1])) basis[i] = 1;
  }
  for (let p = 1; p <= degree; p += 1) {
    const next = new Array(cps.length).fill(0);
    for (let i = 0; i <= n; i += 1) {
      const ld = knots[i + p] - knots[i];
      const rd = knots[i + p + 1] - knots[i + 1];
      next[i] = (ld ? ((u - knots[i]) / ld) * basis[i] : 0) + (rd && i + 1 <= n ? ((knots[i + p + 1] - u) / rd) * basis[i + 1] : 0);
    }
    basis = next;
  }
  let sw = 0, x = 0, y = 0;
  for (let i = 0; i <= n; i += 1) {
    const w = finite(weights[i]) ? weights[i] : 1;
    const bw = basis[i] * w;
    sw += bw; x += cps[i].x * bw; y += cps[i].y * bw;
  }
  return sw ? { x: x / sw, y: y / sw } : null;
}
function sampleSplineData(cpsRaw, knotsRaw, weightsRaw, degree, fitRaw) {
  const cps = (cpsRaw || []).map(p2).filter(Boolean);
  const knots = (knotsRaw || []).map(Number);
  const weights = (weightsRaw || cpsRaw?.map((c) => c?.weight) || []).map(Number);
  if (Number.isInteger(degree) && degree >= 1 && cps.length > degree && knots.length === cps.length + degree + 1) {
    const u0 = knots[degree];
    const u1 = knots[cps.length];
    if (u1 > u0) {
      let len = 0;
      for (let i = 1; i < cps.length; i += 1) len += Math.hypot(cps[i].x - cps[i - 1].x, cps[i].y - cps[i - 1].y);
      const steps = Math.max(32, Math.min(MAX_CURVE_STEPS, Math.ceil(len / 0.05)));
      const out = [];
      for (let i = 0; i <= steps; i += 1) {
        const p = nurbs(cps, knots, weights, degree, i === steps ? u1 : u0 + ((u1 - u0) * i) / steps);
        if (p) out.push(p);
      }
      if (out.length >= 2) return out;
    }
  }
  const fit = (fitRaw || []).map(p2).filter(Boolean);
  return fit.length >= 2 ? fit : [];
}

function cadText(value) {
  // MTEXT inline formatting: keep line breaks and the literal characters;
  // formatting codes (font, colour, height overrides) are counted by the caller.
  return String(value ?? "")
    .replace(/\\P/g, "\n")
    .replace(/\\~/g, " ")
    .replace(/\\[\\{}]/g, (m) => m[1])
    .replace(/\\[ACcFfHhQTWpLlOoKk][^;\\]*;?/g, "")
    .replace(/\\S([^;]*);/g, (_m, s) => s.replace(/[#^]/, "/"))
    .replace(/[{}]/g, "")
    .replace(/%%[cC]/g, "Ø")
    .replace(/%%[dD]/g, "°")
    .replace(/%%[pP]/g, "±")
    .replace(/%%[uUoO]/g, "")
    .trim();
}

// ---- main extraction -------------------------------------------------------------
export function extractAuthentic(database) {
  const header = database?.header || {};
  const LTSCALE = num(header.LTSCALE, 1) || 1;
  const LWDEFAULT = finite(Number(header.LWDEFAULT)) && Number(header.LWDEFAULT) >= 0 ? Number(header.LWDEFAULT) : 25;
  const table = (name) => database?.tables?.[name]?.entries || [];

  const layers = [];
  const layerByName = new Map();
  function layerRef(name) {
    const clean = String(name ?? "0").trim() || "0";
    if (!layerByName.has(clean)) {
      layerByName.set(clean, layers.length);
      layers.push({ name: clean, color: "aci7", aci: 7, off: false, frozen: false, lineType: "Continuous", lw: LW_BYLAYER });
    }
    return layerByName.get(clean);
  }
  for (const l of table("LAYER")) {
    const id = layerRef(l.name);
    const ci = Number(l.colorIndex);
    const color = ci >= 1 && ci <= 255 ? aciColor(ci) : finite(Number(l.color)) ? hex([(l.color >> 16) & 255, (l.color >> 8) & 255, l.color & 255]) : "aci7";
    Object.assign(layers[id], {
      color,
      aci: ci >= 1 && ci <= 255 ? ci : null,
      off: Boolean(l.off) || ci < 0,
      frozen: Boolean(l.frozen),
      lineType: String(l.lineType || "Continuous"),
      lw: Number(l.lineweight),
    });
  }
  layerRef("0");

  const linetypes = {};
  for (const t of table("LTYPE")) {
    const pattern = (t.pattern || []).map((e) => {
      const el = { len: num(e.elementLength) };
      const text = typeof e.text === "string" ? e.text : "";
      if (text) {
        Object.assign(el, { text, scale: num(e.scale, 1), rot: num(e.rotation), ox: num(e.offsetX), oy: num(e.offsetY), absRot: (Number(e.elementTypeFlag) & 1) === 1 });
      } else if (num(e.shapeNumber) && (Number(e.elementTypeFlag) & 4)) {
        Object.assign(el, { shape: num(e.shapeNumber) });
      }
      return el;
    });
    linetypes[String(t.name)] = { total: num(t.totalPatternLength), pattern };
  }
  const isContinuous = (name) => {
    const lt = linetypes[name];
    return !name || /^continuous$/i.test(name) || !lt || !lt.pattern.length || !(lt.total > 0);
  };

  const blocks = new Map();
  for (const b of table("BLOCK_RECORD")) if (typeof b?.name === "string") blocks.set(b.name, b);

  const styles = [];
  const styleKey = new Map();
  function styleRef(color, lineType, lw, lts) {
    const lt = isContinuous(lineType) ? null : lineType;
    const key = `${color}|${lt}|${lw}|${lt ? lts : 1}`;
    if (!styleKey.has(key)) {
      styleKey.set(key, styles.length);
      styles.push({ c: color, lt, lw, lts: lt ? lts : 1 });
    }
    return styleKey.get(key);
  }

  const stats = { entityTypes: {}, drawnTypes: {}, notReproduced: {}, hatchPatternTruncated: 0, mtextFormattingCodes: 0, ocsTransformed: 0, hiddenByLayerState: 0 };
  const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };

  const segments = []; // [x1,y1,x2,y2, layerId, styleId, phase, order]
  const fills = []; // [layerId, styleId, kind(0 fill,1 wipeout), rings(flat [x,y,...][]), order]
  const texts = []; // [x,y, layerId, styleId, text, height, rotation, hAlign, vAlign, widthFactor, mirroredX, order]
  const points = []; // [x,y, layerId, styleId, order]
  const leaders = [];
  const blockRefs = []; // [x,y, layerId, blockName] for picking only (not drawn)
  let order = 0;

  function resolve(entity, layerId, inherited) {
    const layer = layers[layerId];
    let color;
    const ci = entity.colorIndex;
    if (finite(Number(entity.color)) && entity.color !== undefined && entity.color !== null) {
      const c = Number(entity.color);
      color = hex([(c >> 16) & 255, (c >> 8) & 255, c & 255]);
    } else if (ci === 0) color = inherited.color;
    else if (ci === undefined || ci === null || ci === 256 || Number(ci) < 0) color = layer.color;
    else color = aciColor(Number(ci));

    let lineType = String(entity.lineType ?? "");
    if (!lineType || /^bylayer$/i.test(lineType)) lineType = layer.lineType;
    else if (/^byblock$/i.test(lineType)) lineType = inherited.lineType;
    if (/^bylayer$/i.test(lineType)) lineType = layer.lineType;

    let lwi = Number(entity.lineweight);
    let lw;
    if (!finite(lwi) || lwi === LW_BYLAYER) lwi = layer.lw;
    if (lwi === LW_BYBLOCK) lw = inherited.lw;
    else if (lwi >= 0 && lwi < LW_TABLE.length) lw = LW_TABLE[lwi];
    else lw = LWDEFAULT;
    if (lw === undefined || lw === null || lw < 0) lw = LWDEFAULT;

    const lts = num(entity.lineTypeScale, 1) * LTSCALE * inherited.ltsFactor;
    return { color, lineType, lw, lts };
  }

  function effectiveLayer(entity, inheritedLayerId) {
    const own = String(entity?.layer ?? "").trim();
    if (!own || own === "0") return inheritedLayerId ?? layerRef("0");
    return layerRef(own);
  }

  // Polyline chain in WCS → segments with linetype phase.
  function chain(pts, layerId, styleId, continuePhase, phaseStart = 0) {
    let phase = phaseStart;
    for (let i = 1; i < pts.length; i += 1) {
      const a = pts[i - 1];
      const b = pts[i];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (!(len > 0) || !finite(a.x) || !finite(b.x)) continue;
      segments.push([a.x, a.y, b.x, b.y, layerId, styleId, styles[styleId].lt ? phase : -1, order]);
      if (continuePhase) phase += len;
    }
    return phase;
  }

  function ringFromPolyline(vertices, closed, t) {
    const out = [];
    const n = vertices.length;
    for (let i = 0; i < n; i += 1) {
      const a = p2(vertices[i]);
      if (!a) continue;
      if (i === n - 1 && !closed) { const w = apply(t, a); out.push(w.x, w.y); break; }
      const b = p2(vertices[(i + 1) % n]);
      const sampled = b ? sampleBulge(a, b, num(vertices[i].bulge)) : [a];
      for (let k = 0; k < sampled.length - 1; k += 1) { const w = apply(t, sampled[k]); out.push(w.x, w.y); }
      if (!b) { const w = apply(t, a); out.push(w.x, w.y); }
    }
    return out;
  }

  function hatchRings(entity, t) {
    const rings = [];
    for (const path of entity.boundaryPaths || []) {
      if (!path) continue;
      if (Array.isArray(path.vertices)) {
        rings.push(ringFromPolyline(path.vertices, true, t));
        continue;
      }
      const ring = [];
      for (const e of path.edges || []) {
        if (!e) continue;
        let pts = [];
        if (e.type === 1) pts = [p2(e.start), p2(e.end)];
        else if (e.type === 2) {
          const c = p2(e.center);
          if (!c) continue;
          const r = num(e.radius);
          let s = num(e.startAngle), en = num(e.endAngle);
          if (e.isCCW === false) { s = -s; en = -en; pts = sampleArc(c, r, s, -ccwSweep(en, s)); }
          else pts = sampleArc(c, r, s, ccwSweep(s, en));
        } else if (e.type === 3) {
          const c = p2(e.center);
          const m = p2(e.end);
          if (!c || !m) continue;
          const ratio = num(e.lengthOfMinorAxis);
          let s = num(e.startAngle), en = num(e.endAngle);
          const ccw = e.isCCW !== false;
          if (!ccw) { s = -s; en = -en; }
          const sweep = ccw ? ccwSweep(s, en) : -ccwSweep(en, s);
          const steps = arcSteps(Math.hypot(m.x, m.y), sweep);
          for (let i = 0; i <= steps; i += 1) {
            const a = s + (sweep * i) / steps;
            pts.push({ x: c.x + m.x * Math.cos(a) - m.y * ratio * Math.sin(a), y: c.y + m.y * Math.cos(a) + m.x * ratio * Math.sin(a) });
          }
        } else if (e.type === 4) {
          pts = sampleSplineData(e.controlPoints, e.knots, e.controlPoints?.map((c) => c?.weight), Number(e.degree), e.fitDatum);
        }
        for (const p of pts.filter(Boolean)) { const w = apply(t, p); ring.push(w.x, w.y); }
      }
      if (ring.length >= 6) rings.push(ring);
    }
    return rings.filter((r) => r.length >= 6);
  }

  function hatchPattern(entity, t, rings, layerId, styleId) {
    // Definition lines are stored final (scaled and rotated) in the hatch's OCS.
    const edges = [];
    for (const r of rings) {
      for (let i = 0; i < r.length; i += 2) {
        const j = (i + 2) % r.length;
        edges.push([r[i], r[i + 1], r[j], r[j + 1]]);
      }
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of edges) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
    let produced = 0;
    for (const dl of entity.definitionLines || []) {
      const ang = angleOf(t, num(dl.angle));
      const base = apply(t, p2(dl.base) || { x: 0, y: 0 });
      const offLocal = p2(dl.offset) || { x: 0, y: 0 };
      const off = { x: t.a * offLocal.x + t.c * offLocal.y, y: t.b * offLocal.x + t.d * offLocal.y };
      const d = { x: Math.cos(ang), y: Math.sin(ang) };
      const nrm = { x: -d.y, y: d.x };
      const perp = off.x * nrm.x + off.y * nrm.y;
      if (!(Math.abs(perp) > 1e-9)) continue;
      const corners = [[minX, minY], [maxX, minY], [minX, maxY], [maxX, maxY]].map(([x, y]) => ((x - base.x) * nrm.x + (y - base.y) * nrm.y) / perp);
      const k0 = Math.floor(Math.min(...corners));
      const k1 = Math.ceil(Math.max(...corners));
      const dashes = (dl.dashLengths || []).map(Number);
      const period = dashes.reduce((s, v) => s + Math.abs(v), 0);
      for (let k = k0; k <= k1; k += 1) {
        const o = { x: base.x + k * off.x, y: base.y + k * off.y };
        const ts = [];
        for (const [x1, y1, x2, y2] of edges) {
          const ex = x2 - x1, ey = y2 - y1;
          const den = d.x * ey - d.y * ex;
          if (Math.abs(den) < 1e-15) continue;
          const wx = x1 - o.x, wy = y1 - o.y;
          const u = (wx * ey - wy * ex) / den; // along hatch line
          const v = (wx * d.y - wy * d.x) / den; // along edge
          if (v >= 0 && v < 1) ts.push(u);
        }
        ts.sort((a, b) => a - b);
        for (let i = 0; i + 1 < ts.length; i += 2) {
          const t0 = ts[i], t1 = ts[i + 1];
          const pieces = [];
          if (!dashes.length || !(period > 0)) pieces.push([t0, t1]);
          else {
            // Each family line starts its dash pattern at its own origin o.
            let pos = Math.floor(t0 / period) * period;
            while (pos < t1 && pieces.length < 1e6) {
              for (const dash of dashes) {
                const len = Math.abs(dash);
                if (dash >= 0) {
                  const a = Math.max(pos, t0), b = Math.min(pos + (dash === 0 ? 0 : len), t1);
                  if (dash === 0 && pos >= t0 && pos <= t1) pieces.push([pos, pos]);
                  else if (b > a) pieces.push([a, b]);
                }
                pos += len;
                if (pos >= t1) break;
              }
            }
          }
          for (const [a, b] of pieces) {
            if (produced >= MAX_HATCH_PATTERN_SEGMENTS) { stats.hatchPatternTruncated += 1; return; }
            const ax = o.x + d.x * a, ay = o.y + d.y * a;
            const bx = o.x + d.x * (b === a ? a + 1e-6 : b), by = o.y + d.y * (b === a ? a + 1e-6 : b);
            segments.push([ax, ay, bx, by, layerId, styleId, -1, order]);
            produced += 1;
          }
        }
      }
    }
  }

  function addText(anchor, text, layerId, styleId, height, rotation, hAlign, vAlign, width, t, multiline = 0) {
    const clean = cadText(text);
    if (!anchor || !clean) return;
    const w = apply(t, anchor);
    texts.push([w.x, w.y, layerId, styleId, clean, height * scaleOf(t), angleOf(t, rotation), hAlign, vAlign, width, mirrored(t) ? 1 : 0, order, multiline]);
  }

  // TEXT / ATTRIB / ATTDEF share AutoCAD TEXT alignment rules.
  function singleLineText(e, base, layerId, styleId, t) {
    const halign = num(base.halign), valign = num(base.valign);
    const useAlign = halign !== 0 || valign !== 0;
    const anchor = p2(useAlign && (halign === 3 || halign === 5) ? base.startPoint : useAlign ? (e.alignmentPoint || base.endPoint) : base.startPoint) || p2(base.startPoint);
    let rot = num(base.rotation);
    const height = num(base.textHeight, 1);
    if (useAlign && (halign === 3 || halign === 5)) {
      const s = p2(base.startPoint), en = p2(e.alignmentPoint || base.endPoint);
      if (s && en) rot = Math.atan2(en.y - s.y, en.x - s.x);
    }
    const ht = withOcs(t, e, 0);
    addText(anchor, base.text, layerId, styleId, height, rot, halign, valign, num(base.xScale, 1), ht);
  }

  const drawnAttribs = new Set();

  function process(e, t, inherited, inheritedLayerId, depth) {
    if (!e || depth > 16) return;
    try {
      processUnsafe(e, t, inherited, inheritedLayerId, depth);
    } catch (error) {
      // One malformed entity must not hide the rest of the drawing; it is
      // counted by type and reported in the manifest.
      bump(stats.notReproduced, `EXTRACT_ERROR_${String(e.type || "UNKNOWN")}`);
      if (!stats.firstErrors) stats.firstErrors = [];
      if (stats.firstErrors.length < 5) stats.firstErrors.push(`${e.type}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function processUnsafe(e, t, inherited, inheritedLayerId, depth) {
    const type = String(e.type || "UNKNOWN");
    bump(stats.entityTypes, type);
    if (e.isVisible === false) return;
    const layerId = effectiveLayer(e, inheritedLayerId);
    const layer = layers[layerId];
    const r = resolve(e, layerId, inherited);
    const styleId = styleRef(r.color, r.lineType, r.lw, r.lts * scaleOf(t));
    order += 1;
    const hiddenLayer = layer.off || layer.frozen;
    if (hiddenLayer) stats.hiddenByLayerState += 1;
    const drew = () => bump(stats.drawnTypes, type);
    if (ocsTransform(e.extrusionDirection) && !["LINE", "POLYLINE3D", "SPLINE", "ELLIPSE", "MTEXT", "POINT", "LEADER", "DIMENSION", "WIPEOUT"].includes(type)) stats.ocsTransformed += 1;

    switch (type) {
      case "LINE": {
        const a = p2(e.startPoint), b = p2(e.endPoint);
        if (a && b) { chain([apply(t, a), apply(t, b)], layerId, styleId, true); drew(); }
        return;
      }
      case "LWPOLYLINE":
      case "POLYLINE2D":
      case "POLYLINE3D": {
        const verts = Array.isArray(e.vertices) ? e.vertices : [];
        const flag = num(e.flag);
        const closed = type === "LWPOLYLINE" ? (flag & 512) !== 0 || (flag & 1) !== 0 : (flag & 1) !== 0;
        const plinegen = (flag & 128) !== 0;
        const ot = type === "POLYLINE3D" ? t : withOcs(t, e, num(e.elevation));
        let phase = 0;
        const n = verts.length;
        for (let i = 0; i < (closed ? n : n - 1); i += 1) {
          const a = p2(verts[i]), b = p2(verts[(i + 1) % n]);
          if (!a || !b) continue;
          const pts = (type === "POLYLINE3D" ? [a, b] : sampleBulge(a, b, num(verts[i].bulge))).map((p) => apply(ot, p));
          phase = chain(pts, layerId, styleId, true, plinegen ? phase : 0);
        }
        drew();
        return;
      }
      case "ARC":
      case "CIRCLE": {
        const c = p2(e.center), radius = num(e.radius);
        if (!c || !(radius > 0)) return;
        const ot = withOcs(t, e, num(c.z));
        const pts = type === "CIRCLE" ? sampleArc(c, radius, 0, TAU) : sampleArc(c, radius, num(e.startAngle), ccwSweep(num(e.startAngle), num(e.endAngle)));
        chain(pts.map((p) => apply(ot, p)), layerId, styleId, true);
        drew();
        return;
      }
      case "ELLIPSE": {
        const pts = sampleEllipseWcs(e);
        if (pts.length >= 2) { chain(pts.map((p) => apply(t, p)), layerId, styleId, true); drew(); }
        return;
      }
      case "SPLINE": {
        const pts = sampleSplineData(e.controlPoints, e.knots, e.weights, Number(e.degree), e.fitPoints);
        if (pts.length >= 2) { chain(pts.map((p) => apply(t, p)), layerId, styleId, true); drew(); }
        else bump(stats.notReproduced, "SPLINE_INVALID");
        return;
      }
      case "LEADER": {
        const pts = (e.vertices || []).map(p2).filter(Boolean);
        const worldVertices = pts.map((p) => apply(t, p));
        if (worldVertices.length) leaders.push({
          layerId, sourceHandle:e.handle == null ? null : String(e.handle),
          vertices:worldVertices.map((p) => [p.x,p.y]), arrowheadEnabled:Boolean(e.isArrowheadEnabled),
          waterFlowVerified:false,
        });
        if (pts.length >= 2) { chain(pts.map((p) => apply(t, p)), layerId, styleId, true); drew(); }
        if (e.isArrowheadEnabled) bump(stats.notReproduced, "LEADER_ARROWHEAD");
        return;
      }
      case "SOLID":
      case "3DFACE": {
        const cs = [p2(e.corner1), p2(e.corner2), p2(e.corner4) || p2(e.corner3), p2(e.corner3)].filter(Boolean);
        const ot = type === "SOLID" ? withOcs(t, e, num(e.elevation)) : t;
        const w = cs.map((p) => apply(ot, p));
        if (type === "SOLID" && w.length >= 3) { fills.push([layerId, styleId, 0, [w.flatMap((p) => [p.x, p.y])], order]); drew(); }
        else if (w.length >= 3) { chain([...w, w[0]], layerId, styleId, false); drew(); }
        return;
      }
      case "HATCH": {
        const ot = withOcs(t, e, num(e.elevation));
        const rings = hatchRings(e, ot);
        if (!rings.length) { bump(stats.notReproduced, "HATCH_NO_BOUNDARY"); return; }
        if (e.solidFill === 1 || e.gradientFlag === 1) {
          let color = r.color;
          if (e.gradientFlag === 1) {
            bump(stats.notReproduced, "HATCH_GRADIENT_SHOWN_AS_FIRST_COLOUR");
            const g = e.gradientColors?.[0];
            if (g && finite(Number(g.rgb))) color = hex([(g.rgb >> 16) & 255, (g.rgb >> 8) & 255, g.rgb & 255]);
          }
          fills.push([layerId, styleRef(color, null, r.lw, 1), 0, rings, order]);
        } else {
          hatchPattern(e, ot, rings, layerId, styleRef(r.color, null, r.lw, 1));
        }
        drew();
        return;
      }
      case "WIPEOUT": {
        const pos = p2(e.position), u = p2(e.uPixel), v = p2(e.vPixel);
        let bp = (e.clippingBoundaryPath || []).map(p2).filter(Boolean);
        if (!pos || !u || !v || bp.length < 2) return;
        if (bp.length === 2) bp = [bp[0], { x: bp[1].x, y: bp[0].y }, bp[1], { x: bp[0].x, y: bp[1].y }];
        const sy = num(e.imageSize?.y, 1);
        const origin = { x: pos.x + u.x * 0.5 - v.x * 0.5 + v.x * sy, y: pos.y + u.y * 0.5 - v.y * 0.5 + v.y * sy };
        const ring = bp.flatMap((p) => { const w = apply(t, { x: origin.x + u.x * p.x - v.x * p.y, y: origin.y + u.y * p.x - v.y * p.y }); return [w.x, w.y]; });
        fills.push([layerId, styleId, 1, [ring], order]);
        drew();
        return;
      }
      case "POINT": {
        const p = p2(e.position);
        if (p) { const w = apply(t, p); points.push([w.x, w.y, layerId, styleId, order]); drew(); }
        return;
      }
      case "TEXT":
        singleLineText(e, e, layerId, styleId, t);
        drew();
        return;
      case "ATTRIB": {
        const key = e.handle;
        if (key && drawnAttribs.has(key)) return;
        if (key) drawnAttribs.add(key);
        if (!(num(e.flags) & 1)) singleLineText(e, { ...(e.text || {}), text: e.text?.text }, layerId, styleId, t);
        drew();
        return;
      }
      case "ATTDEF":
        // In a block definition an ATTDEF is a template; AutoCAD shows the
        // attribute values (ATTRIB), not the definitions.
        if (depth === 0 && !(num(e.flags) & 1)) { singleLineText(e, { ...(e.text || {}), text: e.tag }, layerId, styleId, t); drew(); }
        return;
      case "MTEXT": {
        const p = p2(e.insertionPoint);
        if (/\\[ACcFfHhQTW]/.test(String(e.text || ""))) stats.mtextFormattingCodes += 1;
        const dir = p2(e.direction);
        const rot = dir && (dir.x || dir.y) ? Math.atan2(dir.y, dir.x) : num(e.rotation);
        const ap = num(e.attachmentPoint, 1);
        const h = [0, 0, 1, 2, 0, 1, 2, 0, 1, 2][ap] ?? 0;
        const v = [3, 3, 3, 3, 2, 2, 2, 1, 1, 1][ap] ?? 3;
        addText(p, e.text, layerId, styleId, num(e.textHeight, 1), rot, h, v, 1, t, 1);
        drew();
        return;
      }
      case "INSERT":
      case "DIMENSION": {
        const block = blocks.get(String(e.name || ""));
        if (type === "INSERT") {
          const ip = p2(e.insertionPoint);
          if (ip) {
            const transform = withOcs(t, e, 0);
            const w = apply(transform, ip);
            const rotation = num(e.rotation);
            const sx = num(e.xScale, 1) || 1;
            // Preserve the transformed block X axis as drawing evidence only.
            // The block's legend must establish which axis represents flow.
            const ux = Math.cos(rotation) * sx, uy = Math.sin(rotation) * sx;
            blockRefs.push([w.x, w.y, layerId, String(e.name || ""), {
              sourceHandle: e.handle == null ? null : String(e.handle),
              rotationRadians: rotation,
              worldXAxis: [transform.a * ux + transform.c * uy, transform.b * ux + transform.d * uy],
              waterFlowVerified: false,
            }]);
          }
        }
        if (!block || !Array.isArray(block.entities)) { bump(stats.notReproduced, `${type}_MISSING_BLOCK`); return; }
        const childInherit = { color: r.color, lineType: r.lineType, lw: r.lw, ltsFactor: inherited.ltsFactor };
        if (type === "DIMENSION") {
          for (const child of block.entities) process(child, t, childInherit, layerId, depth + 1);
          drew();
          return;
        }
        const ins = p2(e.insertionPoint) || { x: 0, y: 0 };
        const base = p2(block.basePoint) || { x: 0, y: 0 };
        const sx = num(e.xScale, 1) || 1, sy = num(e.yScale, 1) || 1;
        const rot = num(e.rotation);
        const cols = Math.max(1, Math.min(4096, num(e.columnCount, 1) || 1));
        const rows = Math.max(1, Math.min(4096, num(e.rowCount, 1) || 1));
        const ocs = withOcs(t, e, num(ins.z));
        const cos = Math.cos(rot), sin = Math.sin(rot);
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            const ox = col * num(e.columnSpacing), oy = row * num(e.rowSpacing);
            // translate(ins) · rotate · translate(array offset) · scale · translate(-base)
            const ax = ox * cos - oy * sin, ay = ox * sin + oy * cos;
            const local = {
              a: cos * sx, b: sin * sx, c: -sin * sy, d: cos * sy,
              tx: ins.x + ax - (cos * sx * base.x - sin * sy * base.y),
              ty: ins.y + ay - (sin * sx * base.x + cos * sy * base.y),
            };
            const nested = compose(ocs, local);
            for (const child of block.entities) process(child, nested, childInherit, layerId, depth + 1);
          }
        }
        for (const attrib of Array.isArray(e.attribs) ? e.attribs : []) process({ ...attrib, type: "ATTRIB" }, t, inherited, inheritedLayerId, depth);
        drew();
        return;
      }
      case "VIEWPORT":
        return; // paper-space viewport frames are not model-space geometry
      default:
        bump(stats.notReproduced, type);
    }
  }

  const root = { color: "aci7", lineType: "Continuous", lw: LWDEFAULT, ltsFactor: 1 };
  for (const e of database?.entities || []) {
    if (e?.isInPaperSpace) { bump(stats.notReproduced, "PAPER_SPACE_ENTITY"); continue; }
    process(e, IDENTITY, root, undefined, 0);
  }

  return {
    version: EXTRACTOR_VERSION,
    header: { LTSCALE, LWDEFAULT, LWDISPLAY: num(header.LWDISPLAY), PDMODE: num(header.PDMODE), PDSIZE: num(header.PDSIZE), PLINEGEN: num(header.PLINEGEN), INSUNITS: num(header.INSUNITS) },
    layers,
    linetypes,
    styles,
    segments,
    fills,
    texts,
    points,
    blockRefs,
    leaders,
    stats,
  };
}

