"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Point = [number, number];

type Segment = Point[];

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type Viewport = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

type Mode = "pan" | "marker";

const EMPTY_BOUNDS: Bounds = {
  minX: 0,
  minY: 0,
  maxX: 1,
  maxY: 1,
};

function isPoint(value: unknown): value is Point {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function extractSegments(input: unknown): Segment[] {
  const record = input as {
    features?: Array<{
      geometry?: {
        type?: string;
        coordinates?: unknown;
      };
    }>;
  };

  const features = Array.isArray(record.features) ? record.features : [];
  const segments: Segment[] = [];

  for (const feature of features) {
    const geometry = feature.geometry;

    if (!geometry) continue;

    if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
      const line = geometry.coordinates.filter(isPoint);

      if (line.length >= 2) {
        segments.push(line);
      }
    }

    if (geometry.type === "MultiLineString" && Array.isArray(geometry.coordinates)) {
      for (const rawLine of geometry.coordinates) {
        if (!Array.isArray(rawLine)) continue;

        const line = rawLine.filter(isPoint);

        if (line.length >= 2) {
          segments.push(line);
        }
      }
    }
  }

  return segments;
}

function computeBounds(segments: Segment[]): Bounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const segment of segments) {
    for (const [x, y] of segment) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY) ||
    minX === maxX ||
    minY === maxY
  ) {
    return EMPTY_BOUNDS;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
  };
}

function makeProjector(
  bounds: Bounds,
  width: number,
  height: number,
  viewport: Viewport,
) {
  const margin = 28;
  const dataWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const dataHeight = Math.max(bounds.maxY - bounds.minY, 1);
  const baseScale = Math.min(
    Math.max((width - margin * 2) / dataWidth, 0.000001),
    Math.max((height - margin * 2) / dataHeight, 0.000001),
  );
  const scale = baseScale * viewport.zoom;

  function worldToScreen(point: Point) {
    const [x, y] = point;

    return {
      x: margin + (x - bounds.minX) * scale + viewport.offsetX,
      y: height - margin - (y - bounds.minY) * scale + viewport.offsetY,
    };
  }

  function screenToWorld(point: { x: number; y: number }): Point {
    const x = (point.x - margin - viewport.offsetX) / scale + bounds.minX;
    const y = (height - margin + viewport.offsetY - point.y) / scale + bounds.minY;

    return [x, y];
  }

  return {
    worldToScreen,
    screenToWorld,
  };
}

export default function MasterBViewerPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [segments, setSegments] = useState<Segment[]>([]);
  const [status, setStatus] = useState("loading");
  const [details, setDetails] = useState("");
  const [mode, setMode] = useState<Mode>("pan");
  const [marker, setMarker] = useState<Point | null>(null);
  const [viewport, setViewport] = useState<Viewport>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const bounds = useMemo(() => computeBounds(segments), [segments]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      try {
        setStatus("loading");
        setDetails("");

        const response = await fetch("/api/professional/infrastructure/water/master-b-preview", {
          cache: "no-store",
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || `HTTP_${response.status}`);
        }

        const payload = await response.json();
        const nextSegments = extractSegments(payload);

        if (!nextSegments.length) {
          throw new Error("preview_has_no_lines");
        }

        if (!cancelled) {
          setSegments(nextSegments);
          setStatus("ready");
          setDetails(`${nextSegments.length} γραμμές φορτώθηκαν`);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setDetails(error instanceof Error ? error.message : "preview_load_failed");
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const parent = canvas.parentElement;
    const cssWidth = Math.max(parent?.clientWidth || 320, 320);
    const cssHeight = Math.max(Math.round(window.innerHeight * 0.62), 420);
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.floor(cssWidth * pixelRatio);
    canvas.height = Math.floor(cssHeight * pixelRatio);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    ctx.fillStyle = "#07111f";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    ctx.strokeStyle = "rgba(242, 199, 102, 0.85)";
    ctx.lineWidth = 1.15;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const projector = makeProjector(bounds, cssWidth, cssHeight, viewport);

    for (const segment of segments) {
      ctx.beginPath();

      for (let index = 0; index < segment.length; index += 1) {
        const projected = projector.worldToScreen(segment[index]);

        if (index === 0) {
          ctx.moveTo(projected.x, projected.y);
        } else {
          ctx.lineTo(projected.x, projected.y);
        }
      }

      ctx.stroke();
    }

    if (marker) {
      const projected = projector.worldToScreen(marker);

      ctx.beginPath();
      ctx.fillStyle = "#f2c766";
      ctx.arc(projected.x, projected.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.arc(projected.x, projected.y, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "12px system-ui";
    ctx.fillText("Pantavion Master B Live Preview", 16, 24);
  }, [bounds, marker, segments, viewport]);

  function canvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  function placeMarker(event: React.PointerEvent<HTMLCanvasElement>) {
    const point = canvasPoint(event);
    const projector = makeProjector(bounds, point.width, point.height, viewport);

    setMarker(projector.screenToWorld(point));
  }

  return (
    <main className="min-h-screen bg-[#061120] px-4 py-6 text-white">
      <section className="mx-auto max-w-7xl rounded-3xl border border-[#f2c766]/40 bg-[#0b1728] p-4 shadow-2xl md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f2c766]">
              PANTAVION WATER
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              Master B Live Viewer
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
              Ελαφριά ζωντανή προβολή του Master B μέσα στο Pantavion. Το γνήσιο DWG
              παραμένει άθικτο και προστατευμένο.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/professional/infrastructure/water/master-dwg"
              className="rounded-xl border border-slate-600 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
            >
              A / B
            </Link>
            <Link
              href="/professional/infrastructure/water/live"
              className="rounded-xl border border-slate-600 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
            >
              Map A
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("pan")}
            className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-[0.16em] ${
              mode === "pan"
                ? "border-[#f2c766] bg-[#f2c766]/20 text-[#f8e6ad]"
                : "border-slate-700 bg-black/20 text-slate-300"
            }`}
          >
            Move Map
          </button>

          <button
            type="button"
            onClick={() => setMode("marker")}
            className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-[0.16em] ${
              mode === "marker"
                ? "border-[#f2c766] bg-[#f2c766]/20 text-[#f8e6ad]"
                : "border-slate-700 bg-black/20 text-slate-300"
            }`}
          >
            Move Point
          </button>

          <button
            type="button"
            onClick={() =>
              setViewport((current) => ({
                ...current,
                zoom: Math.min(current.zoom * 1.25, 20),
              }))
            }
            className="rounded-xl border border-slate-700 bg-black/20 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
          >
            Zoom +
          </button>

          <button
            type="button"
            onClick={() =>
              setViewport((current) => ({
                ...current,
                zoom: Math.max(current.zoom / 1.25, 0.4),
              }))
            }
            className="rounded-xl border border-slate-700 bg-black/20 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
          >
            Zoom -
          </button>

          <button
            type="button"
            onClick={() => {
              setViewport({
                zoom: 1,
                offsetX: 0,
                offsetY: 0,
              });
              setMarker(null);
            }}
            className="rounded-xl border border-slate-700 bg-black/20 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
          >
            Reset
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-700 bg-[#07111f]">
          <canvas
            ref={canvasRef}
            className="block touch-none"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);

              if (mode === "marker") {
                placeMarker(event);
                return;
              }

              const point = canvasPoint(event);

              pointerRef.current = {
                pointerId: event.pointerId,
                startX: point.x,
                startY: point.y,
                offsetX: viewport.offsetX,
                offsetY: viewport.offsetY,
              };
            }}
            onPointerMove={(event) => {
              if (mode === "marker" && event.buttons === 1) {
                placeMarker(event);
                return;
              }

              const active = pointerRef.current;

              if (!active || active.pointerId !== event.pointerId) return;

              const point = canvasPoint(event);

              setViewport((current) => ({
                ...current,
                offsetX: active.offsetX + point.x - active.startX,
                offsetY: active.offsetY + point.y - active.startY,
              }));
            }}
            onPointerUp={() => {
              pointerRef.current = null;
            }}
            onPointerCancel={() => {
              pointerRef.current = null;
            }}
            onWheel={(event) => {
              event.preventDefault();

              setViewport((current) => ({
                ...current,
                zoom: event.deltaY < 0
                  ? Math.min(current.zoom * 1.12, 20)
                  : Math.max(current.zoom / 1.12, 0.4),
              }));
            }}
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-black/25 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f2c766]">
              Status
            </p>
            <p className="mt-2 text-sm font-black">{status}</p>
            {details ? (
              <p className="mt-2 break-all text-xs font-semibold text-slate-300">
                {details}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-700 bg-black/25 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f2c766]">
              Marker
            </p>
            <p className="mt-2 break-all text-xs font-semibold text-slate-300">
              {marker ? `${marker[0].toFixed(3)}, ${marker[1].toFixed(3)}` : "Δεν έχει μπει σημείο"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-black/25 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f2c766]">
              Rule
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
              Το DWG Master B δεν αλλάζει. Η προβολή είναι ελαφρύ preview για γρήγορο άνοιγμα.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
