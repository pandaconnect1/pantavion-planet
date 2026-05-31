"use client";

import { useEffect, useMemo, useState } from "react";

type Segment = [number, number, number, number, number];

type TileIndexItem = {
  x: number;
  y: number;
  file: string;
  segmentCount: number;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type Manifest = {
  ok: boolean;
  type?: string;
  source?: string;
  rawDxfIncluded?: boolean;
  publicRawDxfAccess?: boolean;
  mobileMustUseDerivedTilesOnly?: boolean;
  dxfSizeBytes?: number | null;
  grid?: number | null;
  totalEntities?: number;
  totalLineSegments?: number;
  matchedNetworkSegments?: number;
  writtenTileCount?: number;
  overflowSegmentCount?: number;
  allBounds?: Bounds | null;
  coreBounds?: Bounds | null;
  layers?: string[];
  topLayers?: Array<{ layer: string; count: number }>;
  tiles?: TileIndexItem[];
  error?: string;
  message?: string;
};

type TilePayload = {
  ok?: boolean;
  tileX?: number;
  tileY?: number;
  segmentFormat?: string[];
  segments?: Segment[];
};

type LoadState = "idle" | "loading" | "ready" | "error";

function formatNumber(value: number | undefined | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("el-GR").format(value);
}

function getSegmentBounds(segments: Segment[]): Bounds | null {
  if (!segments.length) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const [x1, y1, x2, y2] of segments) {
    minX = Math.min(minX, x1, x2);
    minY = Math.min(minY, y1, y2);
    maxX = Math.max(maxX, x1, x2);
    maxY = Math.max(maxY, y1, y2);
  }

  if (![minX, minY, maxX, maxY].every(Number.isFinite)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

export default function MasterBMobilePage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [tileLimit, setTileLimit] = useState(48);
  const [layerQuery, setLayerQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError("");

      try {
        const manifestResponse = await fetch(
          "/api/professional/infrastructure/water/master-b/derived/manifest",
          { cache: "no-store" },
        );

        const manifestJson = (await manifestResponse.json()) as Manifest;

        if (!manifestResponse.ok || !manifestJson.ok) {
          throw new Error(
            manifestJson.message ||
              manifestJson.error ||
              "Master B manifest could not be loaded.",
          );
        }

        const selectedTiles = [...(manifestJson.tiles ?? [])]
          .sort((a, b) => b.segmentCount - a.segmentCount)
          .slice(0, tileLimit);

        const tileResponses = await Promise.all(
          selectedTiles.map(async (tile) => {
            const response = await fetch(
              `/api/professional/infrastructure/water/master-b/derived/tile?file=${encodeURIComponent(
                tile.file,
              )}`,
              { cache: "no-store" },
            );

            if (!response.ok) {
              return [] as Segment[];
            }

            const tileJson = (await response.json()) as TilePayload;
            return tileJson.segments ?? [];
          }),
        );

        if (cancelled) {
          return;
        }

        setManifest(manifestJson);
        setSegments(tileResponses.flat().slice(0, 70000));
        setStatus("ready");
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setManifest(null);
        setSegments([]);
        setError(loadError instanceof Error ? loadError.message : "UNKNOWN_ERROR");
        setStatus("error");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tileLimit]);

  const layerNames = manifest?.layers ?? [];

  const filteredSegments = useMemo(() => {
    const query = layerQuery.trim().toUpperCase();

    if (!query) {
      return segments;
    }

    return segments.filter((segment) => {
      const layerName = layerNames[segment[4]] ?? "";
      return layerName.toUpperCase().includes(query);
    });
  }, [layerNames, layerQuery, segments]);

  const bounds = useMemo(() => getSegmentBounds(filteredSegments), [filteredSegments]);

  const viewBox = useMemo(() => {
    if (!bounds) {
      return "0 0 100 100";
    }

    const width = Math.max(bounds.maxX - bounds.minX, 1);
    const height = Math.max(bounds.maxY - bounds.minY, 1);
    const padX = width * 0.04;
    const padY = height * 0.04;

    return `${bounds.minX - padX} ${bounds.minY - padY} ${width + padX * 2} ${
      height + padY * 2
    }`;
  }, [bounds]);

  const topLayers = manifest?.topLayers?.slice(0, 14) ?? [];

  return (
    <main className="min-h-screen bg-[#061120] px-4 py-5 text-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="rounded-3xl border border-[#f2c766]/40 bg-[#0b1728] p-5 shadow-2xl">
          <a
            href="/professional/infrastructure/water"
            className="text-sm font-black text-[#f2c766]"
          >
            ← Πίσω στην Ύδρευση
          </a>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.34em] text-[#f2c766]">
            Pantavion Water · Master B Mobile
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            Master B εγκεκριμένο derived δίκτυο
          </h1>

          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-300 md:text-base">
            Φορτώνει derived vector/network tiles από το DXF. Δεν φορτώνει raw DXF,
            δεν χρησιμοποιεί εικόνα και δεν αγγίζει χρήστες, Map A ή Blob.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Status</p>
            <p className="mt-2 text-xl font-black text-[#f2c766]">{status}</p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Network segments</p>
            <p className="mt-2 text-xl font-black">
              {formatNumber(manifest?.matchedNetworkSegments)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Tiles</p>
            <p className="mt-2 text-xl font-black">
              {formatNumber(manifest?.writtenTileCount)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Loaded lines</p>
            <p className="mt-2 text-xl font-black">{formatNumber(filteredSegments.length)}</p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase text-slate-400">Raw DXF</p>
            <p className="mt-2 text-xl font-black text-emerald-300">Blocked</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/50 bg-red-950/30 p-4 text-sm font-bold text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-[#f2c766]/30 bg-[#020814] p-3">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
                  Live vector viewport
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Initial mobile load: densest {tileLimit} tiles.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[24, 48, 96, 160].map((limit) => (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => setTileLimit(limit)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black ${
                      tileLimit === limit
                        ? "border-[#f2c766] bg-[#f2c766] text-black"
                        : "border-slate-700 bg-[#091426] text-slate-200"
                    }`}
                  >
                    {limit} tiles
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[68vh] min-h-[460px] overflow-hidden rounded-2xl border border-slate-800 bg-white">
              {bounds ? (
                <svg
                  viewBox={viewBox}
                  className="h-full w-full touch-pan-x touch-pan-y"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <rect
                    x={bounds.minX}
                    y={bounds.minY}
                    width={Math.max(bounds.maxX - bounds.minX, 1)}
                    height={Math.max(bounds.maxY - bounds.minY, 1)}
                    fill="white"
                  />

                  <g transform={`scale(1,-1) translate(0,${-(bounds.minY + bounds.maxY)})`}>
                    {filteredSegments.map(([x1, y1, x2, y2], index) => (
                      <line
                        key={`${index}-${x1}-${y1}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#0969da"
                        strokeWidth="1.2"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                      />
                    ))}
                  </g>
                </svg>
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm font-black text-slate-700">
                  {status === "loading" ? "Loading Master B network tiles..." : "B approved derived geometry layer is not configured/processed yet. Raw DWG/DXF remains in the private founder/admin vault. Approved users will receive only browser-safe derived LineString/MultiLineString segments after processing, access approval, and audit."}
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-700 bg-[#091426] p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2c766]">
              Layers / search
            </p>

            <input
              value={layerQuery}
              onChange={(event) => setLayerQuery(event.target.value)}
              placeholder="π.χ. W-DP, UPVC, HDPE"
              className="mt-4 w-full rounded-2xl border border-slate-700 bg-[#061120] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#f2c766]"
            />

            <div className="mt-4 space-y-2">
              {topLayers.map((item) => (
                <button
                  key={`${item.layer}-${item.count}`}
                  type="button"
                  onClick={() => setLayerQuery(item.layer)}
                  className="w-full rounded-xl border border-slate-800 bg-[#061120] px-3 py-2 text-left text-xs font-bold text-slate-300"
                >
                  <span className="block truncate text-[#f2c766]">{item.layer}</span>
                  <span className="text-slate-500">{formatNumber(item.count)} segments</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
