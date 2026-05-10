"use client";

import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";

type SegmentFeature = {
  type: "Feature";
  geometry: unknown;
  properties?: Record<string, unknown>;
};

type SegmentResponse = {
  marker?: string;
  status?: string;
  sourceMode?: string;
  dataReturned?: boolean;
  segmentReturned?: boolean;
  completeNetworkReturned?: boolean;
  rawMasterReturned?: boolean;
  browserFullNetworkLoaded?: boolean;
  totalMasterFeatureCount?: number;
  indexedFeatureCount?: number;
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

type BboxForm = {
  minLng: string;
  minLat: string;
  maxLng: string;
  maxLat: string;
};

const DEFAULT_LIMASSOL_BBOX: BboxForm = {
  minLng: "33.015",
  minLat: "34.668",
  maxLng: "33.055",
  maxLat: "34.700",
};

const TARGET_AREAS = [
  {
    label: "Λεμεσός κέντρο",
    center: [34.681, 33.038] as [number, number],
    zoom: 15,
  },
  {
    label: "Γερμασόγεια",
    center: [34.704, 33.081] as [number, number],
    zoom: 15,
  },
  {
    label: "Άγιος Αθανάσιος",
    center: [34.714, 33.055] as [number, number],
    zoom: 15,
  },
  {
    label: "Κάψαλος",
    center: [34.696, 33.026] as [number, number],
    zoom: 15,
  },
];

function ensureLeafletCss() {
  if (typeof document === "undefined") return;

  const id = "pantavion-leaflet-css";

  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  link.integrity = "sha256-p4NxAoJBhIINfQPDKk5a8dLcc5qef9iEIOQ6xR6PCL0=";
  link.crossOrigin = "";

  document.head.appendChild(link);
}

function bboxFromMap(map: Leaflet.Map): BboxForm {
  const bounds = map.getBounds();

  return {
    minLng: bounds.getWest().toFixed(6),
    minLat: bounds.getSouth().toFixed(6),
    maxLng: bounds.getEast().toFixed(6),
    maxLat: bounds.getNorth().toFixed(6),
  };
}

function segmentFeatureCollection(response: SegmentResponse | null) {
  return response?.segment?.features?.length
    ? {
        type: "FeatureCollection",
        features: response.segment.features,
      }
    : null;
}

export default function ControlledWaterSegmentClient() {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const waterLayerRef = useRef<Leaflet.GeoJSON | null>(null);

  const [bbox, setBbox] = useState<BboxForm>(DEFAULT_LIMASSOL_BBOX);
  const [viewerToken, setViewerToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [response, setResponse] = useState<SegmentResponse | null>(null);
  const [message, setMessage] = useState("Επίλεξε περιοχή ή πάτησε φόρτωση τμήματος δικτύου.");

  async function loadSegment(nextBbox?: BboxForm) {
    const activeBbox = nextBbox ?? bbox;

    setLoading(true);
    setMessage("Φόρτωση ελεγχόμενου τμήματος δικτύου...");

    try {
      const params = new URLSearchParams({
        minLng: activeBbox.minLng,
        minLat: activeBbox.minLat,
        maxLng: activeBbox.maxLng,
        maxLat: activeBbox.maxLat,
        maxFeatures: "900",
      });

      if (viewerToken.trim()) {
        params.set("viewerToken", viewerToken.trim());
      }

      const apiResponse = await fetch(
        `/api/professional/infrastructure/water/segment/bbox?${params.toString()}`,
        { cache: "no-store" },
      );

      const json = (await apiResponse.json()) as SegmentResponse;

      setResponse(json);

      if (!apiResponse.ok) {
        setMessage(json.reason || json.error || `HTTP ${apiResponse.status}`);
        return;
      }

      setMessage(
        `Φορτώθηκε ελεγχόμενο τμήμα: ${json.segmentCount ?? 0} στοιχεία. Πλήρες δίκτυο στον browser: ${String(
          json.completeNetworkReturned ?? false,
        )}.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Άγνωστο σφάλμα φόρτωσης.");
    } finally {
      setLoading(false);
    }
  }

  function syncBboxFromMap() {
    const map = mapRef.current;

    if (!map) return;

    setBbox(bboxFromMap(map));
  }

  function moveToArea(center: [number, number], zoom: number) {
    const map = mapRef.current;

    if (!map) return;

    map.setView(center, zoom, { animate: true });

    const nextBbox = bboxFromMap(map);
    setBbox(nextBbox);

    window.setTimeout(() => {
      const current = mapRef.current;
      if (!current) return;

      const currentBbox = bboxFromMap(current);
      setBbox(currentBbox);
      void loadSegment(currentBbox);
    }, 450);
  }

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapElementRef.current || mapRef.current) return;

      ensureLeafletCss();

      const leaflet = await import("leaflet");

      if (cancelled || !mapElementRef.current) return;

      leafletRef.current = leaflet;

      const map = leaflet.map(mapElementRef.current, {
        zoomControl: true,
        attributionControl: true,
      });

      map.setView([34.681, 33.038], 14);

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        })
        .addTo(map);

      map.on("moveend", syncBboxFromMap);
      map.on("zoomend", syncBboxFromMap);

      mapRef.current = map;
      setBbox(bboxFromMap(map));
      setMapReady(true);
    }

    void initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    const collection = segmentFeatureCollection(response);

    if (!leaflet || !map) return;

    if (waterLayerRef.current) {
      waterLayerRef.current.removeFrom(map);
      waterLayerRef.current = null;
    }

    if (!collection) return;

    const layer = leaflet.geoJSON(collection as never, {
      style: () => ({
        color: "#12d7ff",
        weight: 3,
        opacity: 0.95,
      }),
      pointToLayer: (_feature, latlng) =>
        leaflet.circleMarker(latlng, {
          radius: 4,
          color: "#12d7ff",
          fillColor: "#12d7ff",
          fillOpacity: 0.8,
        }),
    });

    layer.addTo(map);
    waterLayerRef.current = layer;

    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [24, 24],
        maxZoom: 17,
      });
    }
  }, [response]);

  return (
    <main className="min-h-screen bg-[#07101f] px-4 py-6 text-white md:px-8">
      <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <header className="rounded-[2rem] border border-[#d8b35a]/30 bg-[#101b2f] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#d8b35a]">
            Pantavion Water Network
          </p>

          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold md:text-5xl">
                Πραγματικός χάρτης δικτύου ύδρευσης
              </h1>
              <p className="mt-3 max-w-5xl text-base leading-7 text-slate-200">
                Ο χάρτης φορτώνει μόνο ελεγχόμενο τμήμα από server-side bbox request.
                Το πλήρες master δίκτυο παραμένει προστατευμένο και δεν αποστέλλεται
                ολόκληρο στον browser.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-950/20 p-4 text-sm">
              <p className="font-bold text-emerald-100">Map engine</p>
              <p className="mt-1 text-emerald-50/80">
                {mapReady ? "Interactive map ready" : "Map loading..."}
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex flex-wrap gap-3">
            {TARGET_AREAS.map((area) => (
              <button
                key={area.label}
                type="button"
                onClick={() => moveToArea(area.center, area.zoom)}
                className="rounded-2xl border border-[#d8b35a]/40 bg-[#d8b35a]/10 px-4 py-3 text-sm font-bold text-[#ffe8a3]"
              >
                {area.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                const map = mapRef.current;
                const currentBbox = map ? bboxFromMap(map) : bbox;
                setBbox(currentBbox);
                void loadSegment(currentBbox);
              }}
              className="rounded-2xl border border-emerald-400/40 bg-emerald-950/30 px-5 py-3 text-sm font-bold text-emerald-100"
            >
              {loading ? "Φόρτωση..." : "Φόρτωσε τμήμα από τον χάρτη"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="grid gap-1 text-xs text-slate-300">
              Min longitude
              <input
                value={bbox.minLng}
                onChange={(event) => setBbox((current) => ({ ...current, minLng: event.target.value }))}
                className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
              />
            </label>

            <label className="grid gap-1 text-xs text-slate-300">
              Min latitude
              <input
                value={bbox.minLat}
                onChange={(event) => setBbox((current) => ({ ...current, minLat: event.target.value }))}
                className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
              />
            </label>

            <label className="grid gap-1 text-xs text-slate-300">
              Max longitude
              <input
                value={bbox.maxLng}
                onChange={(event) => setBbox((current) => ({ ...current, maxLng: event.target.value }))}
                className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
              />
            </label>

            <label className="grid gap-1 text-xs text-slate-300">
              Max latitude
              <input
                value={bbox.maxLat}
                onChange={(event) => setBbox((current) => ({ ...current, maxLat: event.target.value }))}
                className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
              />
            </label>
          </div>

          <label className="mt-3 grid gap-1 text-xs text-slate-300">
            Viewer token για protected production, αν έχει οριστεί
            <input
              value={viewerToken}
              onChange={(event) => setViewerToken(event.target.value)}
              className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
              placeholder="Optional locally / required only when production gate is enabled"
            />
          </label>

          <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
            {message}
          </p>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1426]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
              <h2 className="text-2xl font-bold text-[#f2d27a]">
                Χάρτης ύδρευσης
              </h2>
              <p className="text-sm text-slate-300">
                Segment features: <strong>{response?.segmentCount ?? 0}</strong>
              </p>
            </div>

            <div
              ref={mapElementRef}
              className="h-[68vh] min-h-[560px] w-full bg-[#06101d]"
              aria-label="Pantavion controlled water network map"
            />
          </article>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-2xl font-bold text-[#f2d27a]">
              Κατάσταση segment
            </h2>

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
