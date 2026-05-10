"use client";

import { useMemo, useState } from "react";

type Position = [number, number];

type SegmentGeometry = {
  type: string;
  coordinates?: unknown;
  geometries?: SegmentGeometry[];
};

type SegmentFeature = {
  type: "Feature";
  geometry: SegmentGeometry | null;
  properties?: Record<string, unknown>;
};

type SegmentResponse = {
  status?: string;
  sourceMode?: string;
  bbox?: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  };
  dataReturned?: boolean;
  completeNetworkReturned?: boolean;
  rawMasterReturned?: boolean;
  segmentReturned?: boolean;
  totalMasterFeatureCount?: number;
  matchingFeatureCount?: number;
  segmentCount?: number;
  segmentTruncated?: boolean;
  reason?: string;
  error?: string;
  segment?: {
    type: "FeatureCollection";
    features: SegmentFeature[];
  };
};

const defaultBbox = {
  minLng: "32.95",
  minLat: "34.62",
  maxLng: "33.10",
  maxLat: "34.75",
};

function collectPositions(value: unknown, output: Position[]) {
  if (!Array.isArray(value)) return;

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    output.push([value[0], value[1]]);
    return;
  }

  for (const child of value) {
    collectPositions(child, output);
  }
}

function geometryPositions(geometry: SegmentGeometry | null): Position[] {
  const positions: Position[] = [];

  if (!geometry) return positions;

  if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    for (const child of geometry.geometries) {
      positions.push(...geometryPositions(child));
    }

    return positions;
  }

  collectPositions(geometry.coordinates, positions);

  return positions;
}

function geometryLineParts(geometry: SegmentGeometry | null): Position[][] {
  if (!geometry) return [];

  if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    return geometry.geometries.flatMap(geometryLineParts);
  }

  if (geometry.type === "LineString") {
    const positions = geometryPositions(geometry);
    return positions.length > 1 ? [positions] : [];
  }

  if (geometry.type === "MultiLineString" || geometry.type === "Polygon") {
    if (!Array.isArray(geometry.coordinates)) return [];

    return geometry.coordinates
      .map((part) => {
        const positions: Position[] = [];
        collectPositions(part, positions);
        return positions;
      })
      .filter((part) => part.length > 1);
  }

  if (geometry.type === "MultiPolygon") {
    if (!Array.isArray(geometry.coordinates)) return [];

    return geometry.coordinates.flatMap((polygon) =>
      Array.isArray(polygon)
        ? polygon
            .map((ring) => {
              const positions: Position[] = [];
              collectPositions(ring, positions);
              return positions;
            })
            .filter((ring) => ring.length > 1)
        : [],
    );
  }

  return [];
}

function computeBounds(features: SegmentFeature[]) {
  const positions = features.flatMap((feature) => geometryPositions(feature.geometry));

  if (positions.length === 0) {
    return null;
  }

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const [lng, lat] of positions) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLng, minLat, maxLng, maxLat };
}

function project(position: Position, bounds: NonNullable<ReturnType<typeof computeBounds>>) {
  const width = 1000;
  const height = 620;
  const padding = 36;

  const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.000001);
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.000001);

  const x = padding + ((position[0] - bounds.minLng) / lngSpan) * (width - padding * 2);
  const y =
    height - padding - ((position[1] - bounds.minLat) / latSpan) * (height - padding * 2);

  return [x, y] as const;
}

export default function ControlledWaterSegmentClient() {
  const [minLng, setMinLng] = useState(defaultBbox.minLng);
  const [minLat, setMinLat] = useState(defaultBbox.minLat);
  const [maxLng, setMaxLng] = useState(defaultBbox.maxLng);
  const [maxLat, setMaxLat] = useState(defaultBbox.maxLat);
  const [viewerToken, setViewerToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SegmentResponse | null>(null);
  const [error, setError] = useState("");

  const features = response?.segment?.features ?? [];
  const bounds = useMemo(() => computeBounds(features), [features]);

  async function loadSegment() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        minLng,
        minLat,
        maxLng,
        maxLat,
        maxFeatures: "1200",
      });

      if (viewerToken.trim()) {
        params.set("viewerToken", viewerToken.trim());
      }

      const apiResponse = await fetch(
        `/api/professional/infrastructure/water/segment/bbox?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const json = (await apiResponse.json()) as SegmentResponse;

      setResponse(json);

      if (!apiResponse.ok) {
        setError(json.reason || json.error || `HTTP ${apiResponse.status}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown request error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07101f] px-5 py-8 text-white md:px-10">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-[#d8b35a]/30 bg-[#101b2f] p-7">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#d8b35a]">
            Pantavion Water Network
          </p>
          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Controlled water segment viewer
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-slate-200">
            Φορτώνει μόνο το ελεγχόμενο τμήμα δικτύου που τέμνει το επιλεγμένο bbox.
            Το πλήρες master μένει server-side/protected και δεν αποστέλλεται στον browser.
          </p>
        </header>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-2xl font-bold text-[#f2d27a]">Περιοχή ελέγχου</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <label className="grid gap-2 text-sm">
              Min longitude
              <input value={minLng} onChange={(event) => setMinLng(event.target.value)} className="rounded-xl border border-white/15 bg-black/30 p-3" />
            </label>
            <label className="grid gap-2 text-sm">
              Min latitude
              <input value={minLat} onChange={(event) => setMinLat(event.target.value)} className="rounded-xl border border-white/15 bg-black/30 p-3" />
            </label>
            <label className="grid gap-2 text-sm">
              Max longitude
              <input value={maxLng} onChange={(event) => setMaxLng(event.target.value)} className="rounded-xl border border-white/15 bg-black/30 p-3" />
            </label>
            <label className="grid gap-2 text-sm">
              Max latitude
              <input value={maxLat} onChange={(event) => setMaxLat(event.target.value)} className="rounded-xl border border-white/15 bg-black/30 p-3" />
            </label>
          </div>

          <label className="mt-4 grid gap-2 text-sm">
            Viewer token για production, αν έχει οριστεί
            <input
              value={viewerToken}
              onChange={(event) => setViewerToken(event.target.value)}
              className="rounded-xl border border-white/15 bg-black/30 p-3"
              placeholder="Optional locally / required in protected production"
            />
          </label>

          <button
            type="button"
            onClick={loadSegment}
            className="mt-5 rounded-2xl border border-[#d8b35a]/50 bg-[#d8b35a]/15 px-6 py-4 font-bold text-[#ffe8a3]"
          >
            {loading ? "Φόρτωση..." : "Φόρτωσε ελεγχόμενο τμήμα δικτύου"}
          </button>

          {error ? (
            <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-950/30 p-4 text-amber-100">
              {error}
            </p>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-[2rem] border border-white/10 bg-[#0b1426] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-[#f2d27a]">Δίκτυο ύδρευσης</h2>
              <p className="text-sm text-slate-300">
                Segment features: <strong>{response?.segmentCount ?? 0}</strong>
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#06101d]">
              <svg viewBox="0 0 1000 620" className="h-[62vh] min-h-[420px] w-full">
                <rect x="0" y="0" width="1000" height="620" fill="#07101f" />
                <g opacity="0.35">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <line
                      key={`v-${index}`}
                      x1={80 + index * 76}
                      y1="0"
                      x2={80 + index * 76}
                      y2="620"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  ))}
                  {Array.from({ length: 8 }).map((_, index) => (
                    <line
                      key={`h-${index}`}
                      x1="0"
                      y1={70 + index * 70}
                      x2="1000"
                      y2={70 + index * 70}
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  ))}
                </g>

                {bounds ? (
                  features.flatMap((feature, featureIndex) =>
                    geometryLineParts(feature.geometry).map((part, partIndex) => {
                      const d = part
                        .map((position, pointIndex) => {
                          const [x, y] = project(position, bounds);
                          return `${pointIndex === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
                        })
                        .join(" ");

                      return (
                        <path
                          key={`${featureIndex}-${partIndex}`}
                          d={d}
                          fill="none"
                          stroke="#66e3ff"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      );
                    }),
                  )
                ) : (
                  <text x="500" y="310" textAnchor="middle" fill="#d8b35a" fontSize="24">
                    Φόρτωσε ελεγχόμενο τμήμα δικτύου
                  </text>
                )}
              </svg>
            </div>
          </article>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-2xl font-bold text-[#f2d27a]">Κατάσταση segment</h2>

            <dl className="mt-5 grid gap-3 text-sm">
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Status</dt>
                <dd className="mt-1 font-bold">{response?.status ?? "Δεν φορτώθηκε ακόμα"}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Source</dt>
                <dd className="mt-1 font-bold">{response?.sourceMode ?? "n/a"}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Master feature count</dt>
                <dd className="mt-1 font-bold">{response?.totalMasterFeatureCount ?? "n/a"}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Matching features</dt>
                <dd className="mt-1 font-bold">{response?.matchingFeatureCount ?? "n/a"}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Segment returned</dt>
                <dd className="mt-1 font-bold">{String(response?.segmentReturned ?? false)}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Complete network returned</dt>
                <dd className="mt-1 font-bold">{String(response?.completeNetworkReturned ?? false)}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Raw master returned</dt>
                <dd className="mt-1 font-bold">{String(response?.rawMasterReturned ?? false)}</dd>
              </div>
            </dl>
          </aside>
        </section>
      </section>
    </main>
  );
}
