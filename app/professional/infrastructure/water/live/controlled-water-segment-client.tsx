"use client";

import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";

type BboxForm = {
  minLng: string;
  minLat: string;
  maxLng: string;
  maxLat: string;
};

type AddressCandidate = {
  candidateId: string;
  displayName: string;
  streetName: string | null;
  houseNumber: string | null;
  municipalityOrCity: string | null;
  districtQuarterSectorZone: string | null;
  locality: string;
  postalCode: string | null;
  coordinates: {
    lat: number;
    lng: number;
  };
  bbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  confidence: number | null;
  source: string;
  providerType: string;
};

type AddressSearchResponse = {
  status?: string;
  query?: string;
  candidates?: AddressCandidate[];
  candidateCount?: number;
  selectedCandidateIdRequired?: boolean;
  mayAutoPickAmbiguousAddress?: boolean;
  message?: string;
};

type SegmentResponse = {
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
    features: Array<{
      type: "Feature";
      geometry: unknown;
      properties?: Record<string, unknown>;
    }>;
  };
};

const TARGET_AREAS = [
  { label: "Λεμεσός κέντρο", center: [34.681, 33.038] as [number, number], zoom: 16 },
  { label: "Γερμασόγεια", center: [34.704, 33.081] as [number, number], zoom: 16 },
  { label: "Άγιος Αθανάσιος", center: [34.714, 33.055] as [number, number], zoom: 16 },
  { label: "Κάψαλος", center: [34.696, 33.026] as [number, number], zoom: 16 },
  { label: "Κολόσσι", center: [34.669, 32.933] as [number, number], zoom: 16 },
];

function ensureLeafletCss() {
  if (typeof document === "undefined") return;

  const id = "pantavion-leaflet-runtime-css";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    .leaflet-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #ddd;
      outline: 0;
      font-family: inherit;
    }
    .leaflet-pane,
    .leaflet-tile,
    .leaflet-marker-icon,
    .leaflet-marker-shadow,
    .leaflet-tile-container,
    .leaflet-pane > svg,
    .leaflet-pane > canvas,
    .leaflet-zoom-box,
    .leaflet-image-layer,
    .leaflet-layer {
      position: absolute;
      left: 0;
      top: 0;
    }
    .leaflet-container {
      -webkit-tap-highlight-color: transparent;
    }
    .leaflet-tile {
      filter: inherit;
      visibility: inherit;
      border: 0;
      user-select: none;
      -webkit-user-drag: none;
    }
    .leaflet-tile-pane {
      z-index: 200;
    }
    .leaflet-overlay-pane {
      z-index: 400;
    }
    .leaflet-marker-pane {
      z-index: 600;
    }
    .leaflet-tooltip-pane {
      z-index: 650;
    }
    .leaflet-popup-pane {
      z-index: 700;
    }
    .leaflet-control {
      position: relative;
      z-index: 800;
      pointer-events: auto;
    }
    .leaflet-top,
    .leaflet-bottom {
      position: absolute;
      z-index: 1000;
      pointer-events: none;
    }
    .leaflet-top {
      top: 0;
    }
    .leaflet-right {
      right: 0;
    }
    .leaflet-bottom {
      bottom: 0;
    }
    .leaflet-left {
      left: 0;
    }
    .leaflet-control-zoom {
      margin: 12px;
      border: 1px solid rgba(0, 0, 0, 0.25);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.22);
    }
    .leaflet-control-zoom a {
      display: block;
      width: 34px;
      height: 34px;
      line-height: 34px;
      text-align: center;
      background: white;
      color: #111827;
      font-weight: 900;
      text-decoration: none;
    }
    .leaflet-control-attribution {
      margin: 0;
      padding: 4px 8px;
      background: rgba(255,255,255,0.85);
      color: #1f2937;
      font-size: 11px;
    }
  `;
  document.head.appendChild(style);
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

function bboxFromCandidate(candidate: AddressCandidate): BboxForm {
  const latPad = Math.max((candidate.bbox.maxLat - candidate.bbox.minLat) * 0.55, 0.004);
  const lngPad = Math.max((candidate.bbox.maxLng - candidate.bbox.minLng) * 0.55, 0.004);

  return {
    minLng: (candidate.coordinates.lng - lngPad).toFixed(6),
    minLat: (candidate.coordinates.lat - latPad).toFixed(6),
    maxLng: (candidate.coordinates.lng + lngPad).toFixed(6),
    maxLat: (candidate.coordinates.lat + latPad).toFixed(6),
  };
}

export default function ControlledWaterSegmentClient() {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const waterLayerRef = useRef<Leaflet.GeoJSON | null>(null);
  const markerLayerRef = useRef<Leaflet.Layer | null>(null);

  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [area, setArea] = useState("Λεμεσός");
  const [postalCode, setPostalCode] = useState("");
  const [bbox, setBbox] = useState<BboxForm>({
    minLng: "33.015",
    minLat: "34.668",
    maxLng: "33.055",
    maxLat: "34.700",
  });

  const [addressLoading, setAddressLoading] = useState(false);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [message, setMessage] = useState("Αναζήτησε οδό/αριθμό/περιοχή ή μετακίνησε τον χάρτη.");
  const [addressResponse, setAddressResponse] = useState<AddressSearchResponse | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<AddressCandidate | null>(null);
  const [segmentResponse, setSegmentResponse] = useState<SegmentResponse | null>(null);

  async function searchAddress() {
    setAddressLoading(true);
    setMessage("Αναζήτηση διεύθυνσης και πιθανών ίδιων οδών...");

    try {
      const params = new URLSearchParams({
        street,
        houseNumber,
        area,
        postalCode,
      });

      const response = await fetch(
        `/api/professional/infrastructure/water/address/search?${params.toString()}`,
        { cache: "no-store" },
      );

      const json = (await response.json()) as AddressSearchResponse;
      setAddressResponse(json);

      if (!response.ok) {
        setMessage(json.message ?? "Η αναζήτηση δεν επέστρεψε αποτέλεσμα.");
        return;
      }

      setMessage(
        `Βρέθηκαν ${json.candidateCount ?? 0} υποψήφιες περιοχές. Διάλεξε σωστή περιοχή πριν φορτώσει το δίκτυο.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Σφάλμα αναζήτησης διεύθυνσης.");
    } finally {
      setAddressLoading(false);
    }
  }

  async function loadSegment(nextBbox?: BboxForm) {
    const activeBbox = nextBbox ?? bbox;

    setSegmentLoading(true);
    setMessage("Φόρτωση ελεγχόμενου τμήματος δικτύου ύδρευσης...");

    try {
      const params = new URLSearchParams({
        minLng: activeBbox.minLng,
        minLat: activeBbox.minLat,
        maxLng: activeBbox.maxLng,
        maxLat: activeBbox.maxLat,
        maxFeatures: "1200",
      });

      const response = await fetch(
        `/api/professional/infrastructure/water/segment/bbox?${params.toString()}`,
        { cache: "no-store" },
      );

      const json = (await response.json()) as SegmentResponse;
      setSegmentResponse(json);

      if (!response.ok) {
        setMessage(json.error || json.reason || `HTTP ${response.status}`);
        return;
      }

      setMessage(
        `Φορτώθηκε τμήμα δικτύου: ${json.segmentCount ?? 0} στοιχεία. Source: ${
          json.sourceMode ?? "unknown"
        }. Full network στον browser: ${String(json.completeNetworkReturned ?? false)}.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Σφάλμα φόρτωσης δικτύου.");
    } finally {
      setSegmentLoading(false);
    }
  }

  function selectCandidate(candidate: AddressCandidate) {
    const map = mapRef.current;
    const leaflet = leafletRef.current;
    const nextBbox = bboxFromCandidate(candidate);

    setSelectedCandidate(candidate);
    setBbox(nextBbox);

    if (map && leaflet) {
      map.setView([candidate.coordinates.lat, candidate.coordinates.lng], 17, {
        animate: true,
      });

      if (markerLayerRef.current) {
        markerLayerRef.current.removeFrom(map);
      }

      const marker = leaflet
        .circleMarker([candidate.coordinates.lat, candidate.coordinates.lng], {
          radius: 9,
          color: "#f5c451",
          fillColor: "#f5c451",
          fillOpacity: 0.9,
          weight: 3,
        })
        .bindPopup(candidate.displayName);

      marker.addTo(map);
      markerLayerRef.current = marker;

      window.setTimeout(() => {
        const current = mapRef.current;
        if (!current) return;

        const currentBbox = bboxFromMap(current);
        setBbox(currentBbox);
        void loadSegment(currentBbox);
      }, 500);
    } else {
      void loadSegment(nextBbox);
    }
  }

  function moveToArea(center: [number, number], zoom: number) {
    const map = mapRef.current;
    if (!map) return;

    map.setView(center, zoom, { animate: true });

    window.setTimeout(() => {
      const current = mapRef.current;
      if (!current) return;

      const nextBbox = bboxFromMap(current);
      setBbox(nextBbox);
      void loadSegment(nextBbox);
    }, 500);
  }

  function loadFromCurrentMap() {
    const map = mapRef.current;
    const currentBbox = map ? bboxFromMap(map) : bbox;

    setBbox(currentBbox);
    void loadSegment(currentBbox);
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
        preferCanvas: true,
      });

      map.setView([34.681, 33.038], 15);

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        })
        .addTo(map);

      map.on("moveend", () => setBbox(bboxFromMap(map)));
      map.on("zoomend", () => setBbox(bboxFromMap(map)));

      mapRef.current = map;
      setBbox(bboxFromMap(map));
      setMapReady(true);

      window.setTimeout(() => {
        map.invalidateSize();
      }, 250);
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

    if (!leaflet || !map) return;

    if (waterLayerRef.current) {
      waterLayerRef.current.removeFrom(map);
      waterLayerRef.current = null;
    }

    if (!segmentResponse?.segment?.features?.length) return;

    const layer = leaflet.geoJSON(segmentResponse.segment as never, {
      style: () => ({
        color: "#00d7ff",
        weight: 4,
        opacity: 0.95,
      }),
      pointToLayer: (_feature, latlng) =>
        leaflet.circleMarker(latlng, {
          radius: 4,
          color: "#00d7ff",
          fillColor: "#00d7ff",
          fillOpacity: 0.9,
        }),
    });

    layer.addTo(map);
    waterLayerRef.current = layer;

    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 18,
      });
    }
  }, [segmentResponse]);

  return (
    <main className="min-h-screen bg-[#07101f] px-4 py-6 text-white md:px-8">
      <section className="mx-auto flex max-w-[1600px] flex-col gap-5">
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
                Αναζήτηση με οδό, αριθμό, περιοχή και ταχυδρομικό. Αν υπάρχουν ίδιες
                οδοί σε πολλές περιοχές, εμφανίζονται υποψήφιες περιοχές και απαιτείται
                επιλογή πριν φορτώσει το ελεγχόμενο τμήμα δικτύου.
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
          <h2 className="text-2xl font-bold text-[#f2d27a]">
            Αναζήτηση διεύθυνσης
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.5fr_1fr_0.7fr_auto]">
            <input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              placeholder="Οδός"
              className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
            />

            <input
              value={houseNumber}
              onChange={(event) => setHouseNumber(event.target.value)}
              placeholder="Αριθμός"
              className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
            />

            <input
              value={area}
              onChange={(event) => setArea(event.target.value)}
              placeholder="Περιοχή / Δήμος / Κοινότητα"
              className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
            />

            <input
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              placeholder="Ταχυδρομικός"
              className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
            />

            <button
              type="button"
              onClick={searchAddress}
              className="rounded-xl border border-[#d8b35a]/40 bg-[#d8b35a]/10 px-5 py-3 text-sm font-bold text-[#ffe8a3]"
            >
              {addressLoading ? "Αναζήτηση..." : "Αναζήτηση"}
            </button>
          </div>

          {addressResponse?.candidates?.length ? (
            <div className="mt-4 grid gap-3">
              <p className="text-sm font-bold text-[#f2d27a]">
                Διάλεξε σωστή υποψήφια περιοχή — δεν γίνεται αυτόματη επιλογή.
              </p>

              <div className="grid max-h-72 gap-2 overflow-auto pr-2">
                {addressResponse.candidates.map((candidate) => (
                  <button
                    key={candidate.candidateId}
                    type="button"
                    onClick={() => selectCandidate(candidate)}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left text-sm hover:border-[#d8b35a]/50"
                  >
                    <span className="block font-bold text-white">
                      {candidate.displayName}
                    </span>
                    <span className="mt-1 block text-xs text-slate-300">
                      Candidate ID: {candidate.candidateId}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            {TARGET_AREAS.map((areaItem) => (
              <button
                key={areaItem.label}
                type="button"
                onClick={() => moveToArea(areaItem.center, areaItem.zoom)}
                className="rounded-2xl border border-[#d8b35a]/40 bg-[#d8b35a]/10 px-4 py-3 text-sm font-bold text-[#ffe8a3]"
              >
                {areaItem.label}
              </button>
            ))}

            <button
              type="button"
              onClick={loadFromCurrentMap}
              className="rounded-2xl border border-emerald-400/40 bg-emerald-950/30 px-5 py-3 text-sm font-bold text-emerald-100"
            >
              {segmentLoading ? "Φόρτωση..." : "Φόρτωσε τμήμα από τον χάρτη"}
            </button>
          </div>

          <details className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer text-sm font-bold text-slate-200">
              Advanced bbox τεχνικά στοιχεία
            </summary>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <input value={bbox.minLng} readOnly className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white" />
              <input value={bbox.minLat} readOnly className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white" />
              <input value={bbox.maxLng} readOnly className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white" />
              <input value={bbox.maxLat} readOnly className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white" />
            </div>
          </details>

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
                Segment features: <strong>{segmentResponse?.segmentCount ?? 0}</strong>
              </p>
            </div>

            <div
              ref={mapElementRef}
              className="h-[72vh] min-h-[620px] w-full bg-[#06101d]"
              aria-label="Pantavion controlled water network map"
            />
          </article>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-2xl font-bold text-[#f2d27a]">
              Κατάσταση
            </h2>

            {selectedCandidate ? (
              <div className="mt-4 rounded-2xl border border-[#d8b35a]/20 bg-[#d8b35a]/10 p-4 text-sm">
                <p className="font-bold text-[#ffe8a3]">Επιλεγμένη διεύθυνση</p>
                <p className="mt-2 text-slate-100">{selectedCandidate.displayName}</p>
              </div>
            ) : null}

            <dl className="mt-5 grid gap-3 text-sm">
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Status</dt>
                <dd className="mt-1 font-bold">{segmentResponse?.status ?? "Δεν φορτώθηκε ακόμα"}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Source</dt>
                <dd className="mt-1 font-bold">{segmentResponse?.sourceMode ?? "n/a"}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Master feature count</dt>
                <dd className="mt-1 font-bold">{segmentResponse?.totalMasterFeatureCount ?? "n/a"}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Matching features</dt>
                <dd className="mt-1 font-bold">{segmentResponse?.matchingFeatureCount ?? "n/a"}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Segment returned</dt>
                <dd className="mt-1 font-bold">{String(segmentResponse?.segmentReturned ?? false)}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Complete network returned</dt>
                <dd className="mt-1 font-bold">{String(segmentResponse?.completeNetworkReturned ?? false)}</dd>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <dt className="text-slate-400">Raw master returned</dt>
                <dd className="mt-1 font-bold">{String(segmentResponse?.rawMasterReturned ?? false)}</dd>
              </div>
            </dl>
          </aside>
        </section>
      </section>
    </main>
  );
}
