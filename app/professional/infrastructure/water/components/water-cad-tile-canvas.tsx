"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Viewport-driven canvas viewer for derived CAD tiles.
 *
 * Every line, point and label is drawn at its source CAD coordinate. Nothing is
 * simplified or capped: the viewer only decides WHICH tiles to fetch, from what
 * is on screen. When the view covers more geometry than a phone can draw, it
 * shows the tile density instead and asks the user to zoom in, rather than
 * silently dropping lines.
 */

export type CadSegment = [number, number, number, number, number];
export type CadPointItem = [number, number, number, string, string | null];
export type CadLabelItem = [number, number, number, string, string];

export type CadTileIndexItem = {
  x: number;
  y: number;
  file: string;
  segmentCount: number;
  pointCount?: number;
  labelCount?: number;
  part?: number;
  parts?: number;
};

export type CadBounds = { minX: number; minY: number; maxX: number; maxY: number };

type TileData = {
  segments: CadSegment[];
  points: CadPointItem[];
  labels: CadLabelItem[];
};

type View = { cx: number; cy: number; scale: number }; // scale = CSS px per CAD unit

type Props = {
  tiles: CadTileIndexItem[];
  grid: number;
  coreBounds: CadBounds;
  layers: string[];
  layerQuery: string;
  fetchTile: (file: string) => Promise<TileData | null>;
  onPick?: (point: { x: number; y: number }) => void;
  onStats?: (stats: CanvasStats) => void;
};

export type CanvasStats = {
  visibleTileFiles: number;
  loadedTileFiles: number;
  drawnSegments: number;
  drawnPoints: number;
  drawnLabels: number;
  pendingTileFiles: number;
  overview: boolean;
};

// Geometry a phone can redraw smoothly. Above this, the view shows density and
// asks for zoom instead of drawing a partial (and therefore misleading) map.
const MAX_SEGMENTS_IN_VIEW = 1_200_000;
const MAX_CACHED_SEGMENTS = 2_500_000;
const FETCH_CONCURRENCY = 6;
const MAX_LABELS_DRAWN = 4000;

function isNetworkLayer(name: string) {
  const n = name.toUpperCase();
  return (
    /^W[-_ ]/.test(n) ||
    /(WATER|PIPE|VALVE|HYDRANT|METER|MAIN|SERVICE|FITTING|FH\b|^FH|UPVC|HDPE|PVC|DUCTILE|ΥΔΡ|ΑΓΩΓ)/.test(n)
  );
}

function isBackgroundLayer(name: string) {
  const n = name.toUpperCase();
  return /(PARCEL|CONTOUR|XOROTAXIK|ΚΤΗΜΑΤ|ΙΣΟΥΨ|TOPO|CADAST)/.test(n);
}

function layerColor(name: string, index: number) {
  if (isNetworkLayer(name)) return "#0550ae";
  if (isBackgroundLayer(name)) return "#c4cbd4";
  const hue = (index * 137.508) % 360;
  return `hsl(${hue.toFixed(0)} 55% 38%)`;
}

export default function WaterCadTileCanvas({
  tiles,
  grid,
  coreBounds,
  layers,
  layerQuery,
  fetchTile,
  onPick,
  onStats,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<View | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const cacheRef = useRef(new Map<string, { data: TileData; used: number; segs: number }>());
  const pendingRef = useRef(new Set<string>());
  const queueRef = useRef<string[]>([]);
  const activeFetchesRef = useRef(0);
  const frameRef = useRef(0);
  const snapshotRef = useRef<{ bitmap: HTMLCanvasElement; view: View } | null>(null);
  const interactingRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tick, setTick] = useState(0);

  const query = layerQuery.trim().toUpperCase();
  const layerColors = useMemo(() => layers.map((name, i) => layerColor(name, i)), [layers]);
  const layerVisible = useMemo(
    () => layers.map((name) => !query || name.toUpperCase().includes(query)),
    [layers, query],
  );

  const tilesByCell = useMemo(() => {
    const map = new Map<number, CadTileIndexItem[]>();
    for (const t of tiles) {
      const key = t.y * grid + t.x;
      const list = map.get(key);
      if (list) list.push(t);
      else map.set(key, [t]);
    }
    return map;
  }, [tiles, grid]);

  const cellW = (coreBounds.maxX - coreBounds.minX) / grid;
  const cellH = (coreBounds.maxY - coreBounds.minY) / grid;

  // Cells beyond the core are clamped into the edge tiles by the generator, so an
  // edge tile may hold geometry outside its cell. Treat edge cells as unbounded.
  const visibleFiles = useCallback(
    (view: View) => {
      const { w, h } = sizeRef.current;
      const halfW = w / 2 / view.scale;
      const halfH = h / 2 / view.scale;
      const x0 = view.cx - halfW;
      const x1 = view.cx + halfW;
      const y0 = view.cy - halfH;
      const y1 = view.cy + halfH;
      const clampCell = (v: number) => Math.max(0, Math.min(grid - 1, v));
      const tx0 = clampCell(Math.floor((x0 - coreBounds.minX) / cellW));
      const tx1 = clampCell(Math.floor((x1 - coreBounds.minX) / cellW));
      const ty0 = clampCell(Math.floor((y0 - coreBounds.minY) / cellH));
      const ty1 = clampCell(Math.floor((y1 - coreBounds.minY) / cellH));
      const files: CadTileIndexItem[] = [];
      let segments = 0;
      for (let ty = ty0; ty <= ty1; ty += 1) {
        for (let tx = tx0; tx <= tx1; tx += 1) {
          const list = tilesByCell.get(ty * grid + tx);
          if (!list) continue;
          for (const t of list) {
            files.push(t);
            segments += t.segmentCount;
          }
        }
      }
      return { files, segments, tx0, tx1, ty0, ty1 };
    },
    [cellH, cellW, coreBounds.minX, coreBounds.minY, grid, tilesByCell],
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
          if (data) {
            cacheRef.current.set(file, { data, used: performance.now(), segs: data.segments.length });
            let total = 0;
            for (const v of cacheRef.current.values()) total += v.segs;
            if (total > MAX_CACHED_SEGMENTS) {
              const byAge = [...cacheRef.current.entries()].sort((a, b) => a[1].used - b[1].used);
              for (const [key, v] of byAge) {
                if (total <= MAX_CACHED_SEGMENTS * 0.8) break;
                cacheRef.current.delete(key);
                total -= v.segs;
              }
            }
          }
        })
        .finally(() => {
          pendingRef.current.delete(file);
          activeFetchesRef.current -= 1;
          requestDraw();
          pumpQueue();
        });
    }
  }, [fetchTile, requestDraw]);

  // Fit the core of the drawing on first layout.
  const fit = useCallback(() => {
    const { w, h } = sizeRef.current;
    if (!w || !h) return;
    const bw = coreBounds.maxX - coreBounds.minX;
    const bh = coreBounds.maxY - coreBounds.minY;
    viewRef.current = {
      cx: (coreBounds.minX + coreBounds.maxX) / 2,
      cy: (coreBounds.minY + coreBounds.maxY) / 2,
      scale: Math.min(w / bw, h / bh) * 0.95,
    };
    snapshotRef.current = null;
    requestDraw();
  }, [coreBounds, requestDraw]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
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
    fit();
  }, [tiles, fit]);

  useEffect(() => {
    snapshotRef.current = null;
    requestDraw();
  }, [query, requestDraw]);

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
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // While a finger is moving, re-project the last full frame instead of
    // redrawing millions of lines; the full redraw happens when it settles.
    const snap = snapshotRef.current;
    if (interactingRef.current && snap) {
      const k = view.scale / snap.view.scale;
      const dx = (snap.view.cx - view.cx) * view.scale;
      const dy = (view.cy - snap.view.cy) * view.scale;
      ctx.save();
      ctx.translate(w / 2 + dx, h / 2 - dy);
      ctx.scale(k, k);
      ctx.drawImage(snap.bitmap, -w / 2, -h / 2, w, h);
      ctx.restore();
      return;
    }

    const vis = visibleFiles(view);
    const overview = vis.segments > MAX_SEGMENTS_IN_VIEW;
    let drawnSegments = 0;
    let drawnPoints = 0;
    let drawnLabels = 0;
    let loaded = 0;

    if (overview) {
      // Density of every tile in view, from the manifest only. Honest overview:
      // it says where geometry is, without pretending to be the drawing.
      let maxCount = 1;
      for (const t of vis.files) maxCount = Math.max(maxCount, t.segmentCount);
      const cellAgg = new Map<number, number>();
      for (const t of vis.files) {
        const key = t.y * grid + t.x;
        cellAgg.set(key, (cellAgg.get(key) || 0) + t.segmentCount);
      }
      for (const [key, count] of cellAgg) {
        const tx = key % grid;
        const ty = Math.floor(key / grid);
        const x = coreBounds.minX + tx * cellW;
        const y = coreBounds.minY + ty * cellH;
        const a = Math.min(1, 0.15 + Math.log10(1 + count) / Math.log10(1 + maxCount));
        ctx.fillStyle = `rgba(5, 80, 174, ${a.toFixed(3)})`;
        const sx = toSx(x);
        const sy = toSy(y + cellH);
        ctx.fillRect(sx, sy, cellW * view.scale + 0.5, cellH * view.scale + 0.5);
      }
      queueRef.current = [];
    } else {
      const want: string[] = [];
      const now = performance.now();
      const byLayer = new Map<number, CadSegment[]>();
      const points: CadPointItem[] = [];
      const labels: CadLabelItem[] = [];
      for (const t of vis.files) {
        const hit = cacheRef.current.get(t.file);
        if (!hit) {
          if (!pendingRef.current.has(t.file)) want.push(t.file);
          continue;
        }
        hit.used = now;
        loaded += 1;
        for (const s of hit.data.segments) {
          if (!layerVisible[s[4]] && layers.length) continue;
          const list = byLayer.get(s[4]);
          if (list) list.push(s);
          else byLayer.set(s[4], [s]);
        }
        for (const p of hit.data.points) if (!layers.length || layerVisible[p[2]]) points.push(p);
        for (const l of hit.data.labels) if (!layers.length || layerVisible[l[2]]) labels.push(l);
      }
      // Nearest tiles first, so the centre of the screen fills in first.
      const cxCell = (view.cx - coreBounds.minX) / cellW;
      const cyCell = (view.cy - coreBounds.minY) / cellH;
      const meta = new Map(vis.files.map((t) => [t.file, t]));
      want.sort((a, b) => {
        const ta = meta.get(a) as CadTileIndexItem;
        const tb = meta.get(b) as CadTileIndexItem;
        return Math.hypot(ta.x - cxCell, ta.y - cyCell) - Math.hypot(tb.x - cxCell, tb.y - cyCell);
      });
      queueRef.current = want;
      pumpQueue();

      // Background layers first, network last so it stays on top.
      const order = [...byLayer.keys()].sort((a, b) => {
        const rank = (id: number) => {
          const name = layers[id] || "";
          return isNetworkLayer(name) ? 2 : isBackgroundLayer(name) ? 0 : 1;
        };
        return rank(a) - rank(b);
      });
      ctx.lineCap = "round";
      for (const id of order) {
        const name = layers[id] || "";
        ctx.strokeStyle = layerColors[id] || "#334155";
        ctx.lineWidth = isNetworkLayer(name) ? 1.6 : isBackgroundLayer(name) ? 0.6 : 0.9;
        ctx.beginPath();
        for (const [x1, y1, x2, y2] of byLayer.get(id) as CadSegment[]) {
          ctx.moveTo(toSx(x1), toSy(y1));
          ctx.lineTo(toSx(x2), toSy(y2));
          drawnSegments += 1;
        }
        ctx.stroke();
      }

      ctx.fillStyle = "#dc2626";
      for (const [x, y] of points) {
        const sx = toSx(x);
        const sy = toSy(y);
        if (sx < -4 || sy < -4 || sx > w + 4 || sy > h + 4) continue;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.4, 0, Math.PI * 2);
        ctx.fill();
        drawnPoints += 1;
      }

      // Text only once it is legible; never more than the screen can hold.
      if (labels.length && view.scale > 0.6) {
        ctx.fillStyle = "#111827";
        ctx.font = "11px system-ui, sans-serif";
        for (const [x, y, , text] of labels) {
          if (drawnLabels >= MAX_LABELS_DRAWN) break;
          const sx = toSx(x);
          const sy = toSy(y);
          if (sx < -50 || sy < -12 || sx > w + 4 || sy > h + 12) continue;
          ctx.fillText(String(text).slice(0, 80), sx, sy);
          drawnLabels += 1;
        }
      }
    }

    // Remember this frame for smooth panning.
    const bitmap = document.createElement("canvas");
    bitmap.width = canvas.width;
    bitmap.height = canvas.height;
    bitmap.getContext("2d")?.drawImage(canvas, 0, 0);
    snapshotRef.current = { bitmap, view: { ...view } };

    onStats?.({
      visibleTileFiles: vis.files.length,
      loadedTileFiles: loaded,
      drawnSegments,
      drawnPoints,
      drawnLabels,
      pendingTileFiles: pendingRef.current.size + queueRef.current.length,
      overview,
    });
    // `tick` drives redraws.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, layerVisible]);

  // ---- gestures ----------------------------------------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: boolean; startX: number; startY: number; dist: number } | null>(null);

  const settle = useCallback(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      interactingRef.current = false;
      requestDraw();
    }, 140);
  }, [requestDraw]);

  const zoomAt = useCallback(
    (sx: number, sy: number, factor: number) => {
      const view = viewRef.current;
      if (!view) return;
      const { w, h } = sizeRef.current;
      const wx = view.cx + (sx - w / 2) / view.scale;
      const wy = view.cy - (sy - h / 2) / view.scale;
      const scale = Math.max(1e-6, Math.min(5000, view.scale * factor));
      viewRef.current = {
        scale,
        cx: wx - (sx - w / 2) / scale,
        cy: wy + (sy - h / 2) / scale,
      };
      interactingRef.current = true;
      requestDraw();
      settle();
    },
    [requestDraw, settle],
  );

  const localXY = (event: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, localXY(event));
    const p = localXY(event);
    const all = [...pointers.current.values()];
    gesture.current = {
      moved: gesture.current?.moved ?? false,
      startX: p.x,
      startY: p.y,
      dist: all.length === 2 ? Math.hypot(all[0].x - all[1].x, all[0].y - all[1].y) : 0,
    };
    if (pointers.current.size === 1) gesture.current.moved = false;
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
    viewRef.current = { ...view, cx: view.cx - dx / view.scale, cy: view.cy + dy / view.scale };
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
        onPick({
          x: view.cx + (p.x - w / 2) / view.scale,
          y: view.cy - (p.y - h / 2) / view.scale,
        });
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
    <div ref={wrapRef} className="relative h-full w-full select-none">
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
            className="pointer-events-auto h-11 w-11 rounded-xl border border-slate-300 bg-white/95 text-xl font-black text-slate-800 shadow"
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
