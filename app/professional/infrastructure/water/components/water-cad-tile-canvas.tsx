"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { drawWaterAnnotation, type DrawingShape } from "@/core/infrastructure/water/water-map-drawing";

/**
 * Viewport-driven canvas viewer for authentic derived CAD tiles.
 *
 * It draws the drawing the way AutoCAD shows it in plan view: every line,
 * fill, point and text at its source coordinate, with the colour, linetype,
 * lineweight and draw order resolved from the DWG itself, on AutoCAD's dark
 * model-space background (colour 7 shows white). Frozen and off layers stay
 * hidden, as AutoCAD keeps them, unless the user asks to see them.
 *
 * Nothing is simplified, sampled, recoloured or capped. The viewer only decides
 * WHICH tiles to fetch from what is on screen, and never zooms out past the point
 * where the screen would hold more than it can draw, so every view is complete.
 */

export type CadTileIndexItem = {
  x: number;
  y: number;
  file: string;
  segmentCount: number;
  pointCount?: number;
  labelCount?: number;
  fillCount?: number;
  part?: number;
  parts?: number;
};

export type CadBounds = { minX: number; minY: number; maxX: number; maxY: number };

export type CadStyle = { c: string; lt: string | null; lw: number; lts: number };
export type CadLinetypeElement = {
  len: number;
  text?: string;
  scale?: number;
  rot?: number;
  ox?: number;
  oy?: number;
  absRot?: boolean;
  shape?: number;
};
export type CadLinetype = { total: number; pattern: CadLinetypeElement[] };
export type CadLayerInfo = { color: string; aci: number | null; off: boolean; frozen: boolean; lineType: string };

// [x1,y1,x2,y2, layerId, styleId, linetypePhase(-1 continuous), drawOrder]
type Seg = [number, number, number, number, number, number, number, number];
// [layerId, styleId, kind(0 fill, 1 wipeout), rings, drawOrder]
type Fill = [number, number, number, number[][], number];
// [x,y, layerId, styleId, text, height, rotation, hAlign, vAlign, widthFactor, mirrored, drawOrder, multiline?]
type Txt = [number, number, number, number, string, number, number, number, number, number, number, number, number?];
// [x,y, layerId, styleId, drawOrder]
type Pt = [number, number, number, number, number];

export type CadTileData = { segments: Seg[]; fills: Fill[]; texts: Txt[]; points: Pt[] };

type View = { cx: number; cy: number; scale: number }; // scale = CSS px per drawing unit

export type CadLod = { level: number; grid: number; tiles: CadTileIndexItem[] };

type Props = {
  tiles: CadTileIndexItem[];
  /** Coarser overview levels (finest first), drawn when the full detail would not fit. */
  lods?: CadLod[];
  grid: number;
  coreBounds: CadBounds;
  layers: string[];
  layerInfo: CadLayerInfo[];
  styles: CadStyle[];
  linetypes: Record<string, CadLinetype>;
  lineweightDisplay: boolean;
  showHiddenLayers: boolean;
  layerQuery: string;
  fetchTile: (file: string) => Promise<CadTileData | null>;
  onPick?: (point: { x: number; y: number }) => void;
  onStats?: (stats: CanvasStats) => void;
  /** Register markers drawn over the drawing (valves, tanks…), with their number. */
  markers?: CadMarker[];
  annotations?: DrawingShape[];
  /** Open centred on this drawing point (e.g. a register entry), close in. */
  initialCenter?: { x: number; y: number } | null;
  /** Called when the view settles, with the visible drawing bounds. */
  onViewChange?: (bounds: CadBounds, scale: number) => void;
};

export type CadMarker = { x: number; y: number; label: string; color: string; highlight?: boolean };

export type CanvasStats = {
  visibleTileFiles: number;
  loadedTileFiles: number;
  drawnSegments: number;
  drawnFills: number;
  drawnTexts: number;
  pendingTileFiles: number;
  atMinZoom: boolean;
};

const BACKGROUND = "#212830"; // AutoCAD 2D model space default
const COLOR_7 = "#ffffff";
// Phones kill a tab that holds millions of parsed segments, and a full redraw of
// 700k lines blocks touch input. Coarse-pointer or low-memory devices get a
// smaller budget: fewer lines per screen, a smaller cache and a lower canvas DPR.
type Budget = { view: number; cache: number; dpr: number };
let budgetCache: Budget | null = null;
function deviceBudget(): Budget {
  if (budgetCache) return budgetCache;
  if (typeof window === "undefined") return { view: 700_000, cache: 2_500_000, dpr: 2.5 };
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const low = coarse || (typeof memory === "number" && memory <= 4);
  budgetCache = low
    ? { view: 220_000, cache: 650_000, dpr: 2 }
    : { view: 700_000, cache: 2_500_000, dpr: 2.5 };
  return budgetCache;
}
const FETCH_CONCURRENCY = 6;
const MIN_TEXT_PX = 3;
const MIN_PATTERN_PX = 2.5;

const colorOf = (c: string) => (c === "aci7" ? COLOR_7 : c);
// AutoCAD shows lineweights on screen in pixels; 0.25 mm and below is 1 px.
const lineweightPx = (lw: number, on: boolean) => (on ? Math.max(1, Math.round(lw * 0.0378)) : 1);

export default function WaterCadTileCanvas({
  tiles,
  lods,
  grid,
  coreBounds,
  layers,
  layerInfo,
  styles,
  linetypes,
  lineweightDisplay,
  showHiddenLayers,
  layerQuery,
  fetchTile,
  onPick,
  onStats,
  markers,
  annotations,
  initialCenter,
  onViewChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<View | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const cacheRef = useRef(new Map<string, { data: CadTileData; used: number; segs: number }>());
  const pendingRef = useRef(new Set<string>());
  const queueRef = useRef<string[]>([]);
  const activeFetchesRef = useRef(0);
  const frameRef = useRef(0);
  const snapshotRef = useRef<{ bitmap: HTMLCanvasElement; view: View } | null>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewReportedRef = useRef(false);
  const interactingRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawListRef = useRef<{ key: string; list: Array<[number, number, unknown]> } | null>(null);
  const [tick, setTick] = useState(0);

  const query = layerQuery.trim().toUpperCase();
  const layerVisible = useMemo(
    () =>
      layers.map((name, i) => {
        const info = layerInfo[i];
        if (!showHiddenLayers && info && (info.off || info.frozen)) return false;
        return !query || name.toUpperCase().includes(query);
      }),
    [layerInfo, layers, query, showHiddenLayers],
  );

  // Level 0 is the full drawing; each overview level is 4x coarser. Like a
  // street map, the screen always shows the finest level that fits the budget.
  const levels = useMemo(() => {
    const all = [{ grid, tiles }, ...[...(lods ?? [])].sort((a, b) => a.level - b.level)];
    return all
      .filter((l) => l.grid > 0 && l.tiles.length > 0)
      .map((l) => {
        const byCell = new Map<number, CadTileIndexItem[]>();
        for (const t of l.tiles) {
          const key = t.y * l.grid + t.x;
          const list = byCell.get(key);
          if (list) list.push(t);
          else byCell.set(key, [t]);
        }
        return {
          grid: l.grid,
          byCell,
          cellW: (coreBounds.maxX - coreBounds.minX) / l.grid,
          cellH: (coreBounds.maxY - coreBounds.minY) / l.grid,
        };
      });
  }, [coreBounds.maxX, coreBounds.maxY, coreBounds.minX, coreBounds.minY, grid, lods, tiles]);

  const cellW = (coreBounds.maxX - coreBounds.minX) / grid;
  const cellH = (coreBounds.maxY - coreBounds.minY) / grid;

  const visibleFiles = useCallback(
    (view: View) => {
      const { w, h } = sizeRef.current;
      const halfW = w / 2 / view.scale;
      const halfH = h / 2 / view.scale;
      let result = { files: [] as CadTileIndexItem[], segments: 0, cellW, cellH };
      for (const level of levels) {
        const clampCell = (v: number) => Math.max(0, Math.min(level.grid - 1, v));
        const tx0 = clampCell(Math.floor((view.cx - halfW - coreBounds.minX) / level.cellW));
        const tx1 = clampCell(Math.floor((view.cx + halfW - coreBounds.minX) / level.cellW));
        const ty0 = clampCell(Math.floor((view.cy - halfH - coreBounds.minY) / level.cellH));
        const ty1 = clampCell(Math.floor((view.cy + halfH - coreBounds.minY) / level.cellH));
        const files: CadTileIndexItem[] = [];
        let segments = 0;
        for (let ty = ty0; ty <= ty1; ty += 1) {
          for (let tx = tx0; tx <= tx1; tx += 1) {
            const list = level.byCell.get(ty * level.grid + tx);
            if (!list) continue;
            for (const t of list) {
              files.push(t);
              segments += t.segmentCount;
            }
          }
        }
        result = { files, segments, cellW: level.cellW, cellH: level.cellH };
        if (segments <= deviceBudget().view) break;
      }
      return result;
    },
    [cellH, cellW, coreBounds.minX, coreBounds.minY, levels],
  );

  const requestDraw = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      setTick((t) => t + 1);
    });
  }, []);

  const pumpQueue = useCallback(() => {
    while (activeFetchesRef.current < FETCH_CONCURRENCY && queueRef.current.length) {
      const file = queueRef.current.shift() as string;
      if (cacheRef.current.has(file) || pendingRef.current.has(file)) continue;
      pendingRef.current.add(file);
      activeFetchesRef.current += 1;
      fetchTile(file)
        .then((data) => {
          if (!data) return;
          cacheRef.current.set(file, { data, used: performance.now(), segs: data.segments.length });
          let total = 0;
          for (const v of cacheRef.current.values()) total += v.segs;
          if (total > deviceBudget().cache) {
            const byAge = [...cacheRef.current.entries()].sort((a, b) => a[1].used - b[1].used);
            for (const [key, v] of byAge) {
              if (total <= deviceBudget().cache * 0.8) break;
              cacheRef.current.delete(key);
              total -= v.segs;
            }
          }
        })
        .finally(() => {
          pendingRef.current.delete(file);
          activeFetchesRef.current -= 1;
          // Mid-gesture the last frame keeps moving with the finger; the new
          // tile is drawn when the gesture settles, never during it.
          if (!interactingRef.current) snapshotRef.current = null;
          requestDraw();
          pumpQueue();
        });
    }
  }, [fetchTile, requestDraw]);

  const constrain = useCallback(
    (view: View, limit = deviceBudget().view): View => {
      let v = view;
      for (let i = 0; i < 60 && visibleFiles(v).segments > limit; i += 1) {
        v = { ...v, scale: v.scale * 1.25 };
      }
      return v;
    },
    [visibleFiles],
  );

  // Open close in over the area with the most annotation (fittings, names,
  // valves), at the widest zoom that is still complete.
  const fit = useCallback(() => {
    const { w, h } = sizeRef.current;
    if (!w || !h || !tiles.length) return;
    const weight = new Map<number, number>();
    for (const t of tiles) {
      const key = t.y * grid + t.x;
      weight.set(key, (weight.get(key) || 0) + (t.pointCount || 0) + (t.labelCount || 0));
    }
    let bestKey = -1;
    let bestScore = -1;
    for (const [key] of weight) {
      const kx = key % grid;
      const ky = Math.floor(key / grid);
      let score = 0;
      for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) score += weight.get((ky + dy) * grid + (kx + dx)) || 0;
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }
    const kx = bestKey >= 0 ? bestKey % grid : grid / 2;
    const ky = bestKey >= 0 ? Math.floor(bestKey / grid) : grid / 2;
    const bw = coreBounds.maxX - coreBounds.minX;
    const bh = coreBounds.maxY - coreBounds.minY;
    // Open close in, like a street map: a third of the line budget fills the
    // first screen fast and leaves room to prefetch around it.
    viewRef.current = initialCenter
      // A register entry opens about 80 m across, centred on it.
      ? constrain({ cx: initialCenter.x, cy: initialCenter.y, scale: Math.min(w, h) / 80 })
      : constrain({
          cx: coreBounds.minX + (kx + 0.5) * cellW,
          cy: coreBounds.minY + (ky + 0.5) * cellH,
          scale: Math.min(w / bw, h / bh),
        }, deviceBudget().view / 3);
    snapshotRef.current = null;
    requestDraw();
  }, [cellH, cellW, constrain, coreBounds, grid, initialCenter, requestDraw, tiles]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, deviceBudget().dpr);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      if (!viewRef.current) fit();
      snapshotRef.current = null;
      requestDraw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [fit, requestDraw]);

  useEffect(() => {
    viewRef.current = null;
    cacheRef.current.clear();
    queueRef.current = [];
    drawListRef.current = null;
    fit();
  }, [tiles, fit]);

  useEffect(() => {
    snapshotRef.current = null;
    drawListRef.current = null;
    requestDraw();
  }, [layerVisible, lineweightDisplay, requestDraw]);

  useEffect(() => {
    snapshotRef.current = null;
    requestDraw();
  }, [markers, annotations, requestDraw]);

  // ---- drawing -----------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const view = viewRef.current;
    if (!canvas || !view) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = sizeRef.current;
    const toSx = (x: number) => (x - view.cx) * view.scale + w / 2;
    const toSy = (y: number) => h / 2 - (y - view.cy) * view.scale;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, w, h);

    // While a finger moves, re-project the last full frame; redraw when it settles.
    const snap = snapshotRef.current;
    if (interactingRef.current && snap) {
      const k = view.scale / snap.view.scale;
      const dx = (snap.view.cx - view.cx) * view.scale;
      // Screen y grows downward while drawing y grows upward: a larger view.cy
      // moves the old frame down the screen.
      const dy = (view.cy - snap.view.cy) * view.scale;
      ctx.save();
      ctx.translate(w / 2 + dx, h / 2 + dy);
      ctx.scale(k, k);
      ctx.drawImage(snap.bitmap, -w / 2, -h / 2, w, h);
      ctx.restore();
      return;
    }

    const vis = visibleFiles(view);
    const want: string[] = [];
    const now = performance.now();
    const loadedFiles: string[] = [];
    for (const t of vis.files) {
      const hit = cacheRef.current.get(t.file);
      if (!hit) {
        if (!pendingRef.current.has(t.file)) want.push(t.file);
        continue;
      }
      hit.used = now;
      loadedFiles.push(t.file);
    }
    const cxCell = (view.cx - coreBounds.minX) / vis.cellW;
    const cyCell = (view.cy - coreBounds.minY) / vis.cellH;
    const meta = new Map(vis.files.map((t) => [t.file, t]));
    want.sort((a, b) => {
      const ta = meta.get(a) as CadTileIndexItem;
      const tb = meta.get(b) as CadTileIndexItem;
      return Math.hypot(ta.x - cxCell, ta.y - cyCell) - Math.hypot(tb.x - cxCell, tb.y - cyCell);
    });
    // Then the tiles just beyond each edge, so panning finds them already loaded.
    const ring = visibleFiles({ ...view, scale: view.scale / 1.6 });
    let ringSegments = 0;
    for (const t of ring.files) {
      if (ringSegments > deviceBudget().view / 2) break;
      if (meta.has(t.file) || cacheRef.current.has(t.file) || pendingRef.current.has(t.file)) continue;
      want.push(t.file);
      ringSegments += t.segmentCount;
    }
    queueRef.current = want;
    pumpQueue();

    // One list in the drawing's own draw order. Rebuilt only when the set of
    // loaded tiles changes. Kind: 0 segment, 1 fill, 2 text, 3 point.
    const key = loadedFiles.join("|");
    if (!drawListRef.current || drawListRef.current.key !== key) {
      const list: Array<[number, number, unknown]> = [];
      for (const file of loadedFiles) {
        const d = (cacheRef.current.get(file) as { data: CadTileData }).data;
        for (const s of d.segments) if (layerVisible[s[4]]) list.push([s[7], 0, s]);
        for (const f of d.fills) if (layerVisible[f[0]]) list.push([f[4], 1, f]);
        for (const t of d.texts) if (layerVisible[t[2]]) list.push([t[11], 2, t]);
        for (const p of d.points) if (layerVisible[p[2]]) list.push([p[4], 3, p]);
      }
      list.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      drawListRef.current = { key, list };
    }

    let drawnSegments = 0;
    let drawnFills = 0;
    let drawnTexts = 0;
    let pathStyle = -1;
    const flush = () => {
      if (pathStyle >= 0) ctx.stroke();
      pathStyle = -1;
    };
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";

    const dashPieces = (seg: Seg, style: CadStyle, out: (a: number, b: number) => void) => {
      const lt = style.lt ? linetypes[style.lt] : null;
      const period = lt ? lt.total * style.lts : 0;
      const len = Math.hypot(seg[2] - seg[0], seg[3] - seg[1]);
      if (!lt || !(period > 0) || seg[6] < 0 || period * view.scale < MIN_PATTERN_PX) {
        out(0, len);
        return;
      }
      let pos = -(((seg[6] % period) + period) % period);
      let guard = 0;
      while (pos < len && guard < 20000) {
        for (const el of lt.pattern) {
          const l = Math.abs(el.len) * style.lts;
          if (el.len > 0) {
            const a = Math.max(0, pos);
            const b = Math.min(len, pos + l);
            if (b > a) out(a, b);
          } else if (el.len === 0 && !el.text && pos >= 0 && pos <= len) {
            out(pos, pos + Math.max(1 / view.scale, 1e-9));
          }
          pos += l;
          guard += 1;
          if (pos >= len) break;
        }
      }
    };

    const linetypeTexts: Array<[number, number, number, string, number, string]> = [];

    for (const [, kind, item] of drawListRef.current.list) {
      if (kind === 0) {
        const s = item as Seg;
        const style = styles[s[5]];
        if (!style) continue;
        const sx1 = toSx(s[0]);
        const sy1 = toSy(s[1]);
        const sx2 = toSx(s[2]);
        const sy2 = toSy(s[3]);
        if ((sx1 < 0 && sx2 < 0) || (sx1 > w && sx2 > w) || (sy1 < 0 && sy2 < 0) || (sy1 > h && sy2 > h)) continue;
        if (pathStyle !== s[5]) {
          flush();
          ctx.strokeStyle = colorOf(style.c);
          ctx.lineWidth = lineweightPx(style.lw, lineweightDisplay);
          ctx.beginPath();
          pathStyle = s[5];
        }
        const len = Math.hypot(s[2] - s[0], s[3] - s[1]);
        const ux = len > 0 ? (sx2 - sx1) / (len * view.scale) : 0;
        const uy = len > 0 ? (sy2 - sy1) / (len * view.scale) : 0;
        dashPieces(s, style, (a, b) => {
          ctx.moveTo(sx1 + ux * a * view.scale, sy1 + uy * a * view.scale);
          ctx.lineTo(sx1 + ux * b * view.scale, sy1 + uy * b * view.scale);
        });
        // Text embedded in complex linetypes (e.g. "U" in UPVC), at its position in the pattern.
        const lt = style.lt ? linetypes[style.lt] : null;
        if (lt && s[6] >= 0 && lt.pattern.some((e) => e.text)) {
          const period = lt.total * style.lts;
          if (period * view.scale >= 20) {
            let pos = -(((s[6] % period) + period) % period);
            while (pos < len) {
              for (const el of lt.pattern) {
                if (el.text && pos >= 0 && pos <= len) {
                  const hPx = (el.scale || 1) * style.lts * view.scale;
                  if (hPx >= MIN_TEXT_PX) {
                    const ang = Math.atan2(-(sy2 - sy1), sx2 - sx1);
                    const bx = sx1 + ux * pos * view.scale;
                    const by = sy1 + uy * pos * view.scale;
                    const ox = (el.ox || 0) * style.lts * view.scale;
                    const oy = (el.oy || 0) * style.lts * view.scale;
                    linetypeTexts.push([bx + Math.cos(ang) * ox - Math.sin(ang) * oy, by - (Math.sin(ang) * ox + Math.cos(ang) * oy), el.absRot ? -(el.rot || 0) : -ang - (el.rot || 0), el.text, hPx, colorOf(style.c)]);
                  }
                }
                pos += Math.abs(el.len) * style.lts;
                if (pos >= len) break;
              }
            }
          }
        }
        drawnSegments += 1;
      } else if (kind === 1) {
        flush();
        const f = item as Fill;
        const style = styles[f[1]];
        ctx.fillStyle = f[2] === 1 ? BACKGROUND : colorOf(style?.c || "aci7");
        ctx.beginPath();
        for (const ring of f[3]) {
          for (let i = 0; i < ring.length; i += 2) {
            const x = toSx(ring[i]);
            const y = toSy(ring[i + 1]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        }
        ctx.fill("evenodd");
        drawnFills += 1;
      } else if (kind === 2) {
        const t = item as Txt;
        const px = t[5] * view.scale;
        if (px < MIN_TEXT_PX) continue;
        const x = toSx(t[0]);
        const y = toSy(t[1]);
        if (x < -2000 || x > w + 2000 || y < -2000 || y > h + 2000) continue;
        flush();
        const style = styles[t[3]];
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-t[6]);
        ctx.scale(t[9] || 1, 1);
        ctx.fillStyle = colorOf(style?.c || "aci7");
        ctx.font = `${px}px Arial, "Helvetica Neue", sans-serif`;
        const ha = t[7];
        ctx.textAlign = ha === 1 || ha === 4 ? "center" : ha === 2 ? "right" : "left";
        const lines = t[4].split("\n");
        const va = t[8];
        const lineGap = px * 1.6667;
        const block = (lines.length - 1) * lineGap;
        let y0 = 0;
        if (t[12]) {
          // MTEXT: attachment top / middle / bottom of the whole block
          ctx.textBaseline = va === 3 ? "top" : va === 2 ? "middle" : "bottom";
          y0 = va === 3 ? 0 : va === 2 ? -block / 2 : -block;
        } else {
          ctx.textBaseline = va === 3 ? "top" : va === 2 ? "middle" : va === 1 ? "bottom" : "alphabetic";
        }
        lines.forEach((line, i) => ctx.fillText(line, 0, y0 + i * lineGap));
        ctx.restore();
        drawnTexts += 1;
      } else {
        const p = item as Pt;
        const x = toSx(p[0]);
        const y = toSy(p[1]);
        if (x < 0 || y < 0 || x > w || y > h) continue;
        flush();
        ctx.fillStyle = colorOf(styles[p[3]]?.c || "aci7");
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    }
    flush();

    for (const [x, y, rot, text, hPx, color] of linetypeTexts) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = color;
      ctx.font = `${hPx}px Arial, sans-serif`;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    // The first full frame also tells the page what is on screen.
    if (!viewReportedRef.current && onViewChange) {
      viewReportedRef.current = true;
      onViewChange({ minX: view.cx - w / 2 / view.scale, maxX: view.cx + w / 2 / view.scale,
        minY: view.cy - h / 2 / view.scale, maxY: view.cy + h / 2 / view.scale }, view.scale);
    }

    // Register markers: a ring with the number beside it once there is room.
    if (markers?.length) {
      const showLabels = view.scale > 1.2;
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.textBaseline = "middle";
      for (const m of markers) {
        const x = toSx(m.x);
        const y = toSy(m.y);
        if (x < -20 || y < -20 || x > w + 20 || y > h + 20) continue;
        const r = m.highlight ? 9 : 5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.lineWidth = m.highlight ? 3 : 2;
        ctx.strokeStyle = m.color;
        ctx.stroke();
        if (showLabels || m.highlight) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = BACKGROUND;
          ctx.strokeText(m.label, x + r + 3, y);
          ctx.fillStyle = m.highlight ? "#ffd166" : "#ffffff";
          ctx.fillText(m.label, x + r + 3, y);
        }
      }
    }

    for (const annotation of annotations ?? []) {
      drawWaterAnnotation(ctx, annotation, ([x, y]) => [toSx(x), toSy(y)]);
    }

    const bitmap = snapshotCanvasRef.current ?? document.createElement("canvas");
    snapshotCanvasRef.current = bitmap;
    if (bitmap.width !== canvas.width) bitmap.width = canvas.width;
    if (bitmap.height !== canvas.height) bitmap.height = canvas.height;
    const snapCtx = bitmap.getContext("2d");
    snapCtx?.clearRect(0, 0, bitmap.width, bitmap.height);
    snapCtx?.drawImage(canvas, 0, 0);
    snapshotRef.current = { bitmap, view: { ...view } };

    onStats?.({
      visibleTileFiles: vis.files.length,
      loadedTileFiles: loadedFiles.length,
      drawnSegments,
      drawnFills,
      drawnTexts,
      pendingTileFiles: pendingRef.current.size + queueRef.current.length,
      atMinZoom: constrain({ ...view, scale: view.scale / 1.25 }).scale > view.scale / 1.25,
    });
    // `tick` drives redraws.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  // ---- gestures ----------------------------------------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: boolean; startX: number; startY: number; dist: number } | null>(null);

  const settle = useCallback(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      interactingRef.current = false;
      requestDraw();
      const view = viewRef.current;
      if (view && onViewChange) {
        const { w, h } = sizeRef.current;
        onViewChange({
          minX: view.cx - w / 2 / view.scale, maxX: view.cx + w / 2 / view.scale,
          minY: view.cy - h / 2 / view.scale, maxY: view.cy + h / 2 / view.scale,
        }, view.scale);
      }
    }, 140);
  }, [onViewChange, requestDraw]);

  const zoomAt = useCallback(
    (sx: number, sy: number, factor: number) => {
      const view = viewRef.current;
      if (!view) return;
      const { w, h } = sizeRef.current;
      const wx = view.cx + (sx - w / 2) / view.scale;
      const wy = view.cy - (sy - h / 2) / view.scale;
      const scale = Math.max(1e-6, Math.min(5000, view.scale * factor));
      const next = { scale, cx: wx - (sx - w / 2) / scale, cy: wy + (sy - h / 2) / scale };
      // Zooming out stops where the screen would hold more than can be drawn.
      viewRef.current = factor < 1 && visibleFiles(next).segments > deviceBudget().view ? view : next;
      interactingRef.current = true;
      requestDraw();
      settle();
    },
    [requestDraw, settle, visibleFiles],
  );

  const localXY = (event: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = localXY(event);
    pointers.current.set(event.pointerId, p);
    const all = [...pointers.current.values()];
    gesture.current = {
      moved: pointers.current.size === 1 ? false : (gesture.current?.moved ?? false),
      startX: p.x,
      startY: p.y,
      dist: all.length === 2 ? Math.hypot(all[0].x - all[1].x, all[0].y - all[1].y) : 0,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const prev = pointers.current.get(event.pointerId);
    if (!prev || !viewRef.current) return;
    const next = localXY(event);
    pointers.current.set(event.pointerId, next);
    const g = gesture.current;
    if (!g) return;
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (g.dist > 0 && dist > 0) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, dist / g.dist);
      g.dist = dist;
      g.moved = true;
      return;
    }
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    if (Math.hypot(next.x - g.startX, next.y - g.startY) > 6) g.moved = true;
    const view = viewRef.current;
    viewRef.current = constrain({ ...view, cx: view.cx - dx / view.scale, cy: view.cy + dy / view.scale });
    interactingRef.current = true;
    requestDraw();
    settle();
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    if (pointers.current.size === 0) {
      if (g && !g.moved && onPick && viewRef.current) {
        const p = localXY(event);
        const { w, h } = sizeRef.current;
        const view = viewRef.current;
        onPick({ x: view.cx + (p.x - w / 2) / view.scale, y: view.cy - (p.y - h / 2) / view.scale });
      }
      gesture.current = null;
    } else if (g) {
      const all = [...pointers.current.values()];
      g.dist = all.length === 2 ? Math.hypot(all[0].x - all[1].x, all[0].y - all[1].y) : 0;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const p = localXY(event);
      zoomAt(p.x, p.y, Math.exp(-event.deltaY * 0.0015));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  return (
    <div ref={wrapRef} className="relative h-full w-full select-none" style={{ background: BACKGROUND }}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="pointer-events-none absolute right-2 top-2 flex flex-col gap-2">
        {[
          { label: "+", act: () => zoomAt(sizeRef.current.w / 2, sizeRef.current.h / 2, 1.8) },
          { label: "−", act: () => zoomAt(sizeRef.current.w / 2, sizeRef.current.h / 2, 1 / 1.8) },
          { label: "⤢", act: fit },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={b.act}
            className="pointer-events-auto h-11 w-11 rounded-xl border border-slate-500 bg-slate-800/90 text-xl font-black text-white shadow"
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

