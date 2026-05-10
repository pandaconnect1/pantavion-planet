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
  coordinates: {
    lat: number;
    lng: number;
  };
};

type AddressSearchResponse = {
  candidates?: AddressCandidate[];
  candidateCount?: number;
  message?: string;
};


function getPipeStyleFromOriginalKml(feature: { properties?: Record<string, unknown> } | undefined) {
  const properties = feature?.properties;
  const raw = properties?.kmlLineStyle;

  if (!raw || typeof raw !== "object") {
    return {
      color: "#202020",
      weight: 1,
      opacity: 1,
    };
  }

  const style = raw as {
    color?: unknown;
    weight?: unknown;
    opacity?: unknown;
  };

  return {
    color: typeof style.color === "string" ? style.color : "#202020",
    weight:
      typeof style.weight === "number"
        ? Math.max(1, Math.min(8, style.weight))
        : 1,
    opacity:
      typeof style.opacity === "number"
        ? Math.max(0.05, Math.min(1, style.opacity))
        : 1,
  };
}
type SegmentResponse = {
  segmentCount?: number;
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

const QUICK_AREAS = [
  { label: "Î›ÎµÎ¼ÎµÏƒÏŒÏ‚", center: [34.681, 33.038] as [number, number], zoom: 16 },
  { label: "Î“ÎµÏÎ¼Î±ÏƒÏŒÎ³ÎµÎ¹Î±", center: [34.704, 33.081] as [number, number], zoom: 16 },
  { label: "Î†Î³Î¹Î¿Ï‚ Î‘Î¸Î±Î½Î¬ÏƒÎ¹Î¿Ï‚", center: [34.714, 33.055] as [number, number], zoom: 16 },
  { label: "ÎšÎ¬ÏˆÎ±Î»Î¿Ï‚", center: [34.696, 33.026] as [number, number], zoom: 16 },
  { label: "ÎšÎ¿Î»ÏŒÏƒÏƒÎ¹", center: [34.669, 32.933] as [number, number], zoom: 16 },
];

function bboxFromMap(map: Leaflet.Map): BboxForm {
  const bounds = map.getBounds();

  return {
    minLng: bounds.getWest().toFixed(6),
    minLat: bounds.getSouth().toFixed(6),
    maxLng: bounds.getEast().toFixed(6),
    maxLat: bounds.getNorth().toFixed(6),
  };
}

function bboxAroundCandidate(candidate: AddressCandidate): BboxForm {
  const pad = 0.006;

  return {
    minLng: (candidate.coordinates.lng - pad).toFixed(6),
    minLat: (candidate.coordinates.lat - pad).toFixed(6),
    maxLng: (candidate.coordinates.lng + pad).toFixed(6),
    maxLat: (candidate.coordinates.lat + pad).toFixed(6),
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
  const [area, setArea] = useState("Î›ÎµÎ¼ÎµÏƒÏŒÏ‚");
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
  const [message, setMessage] = useState("Î’Î¬Î»Îµ Î¿Î´ÏŒ, Î±ÏÎ¹Î¸Î¼ÏŒ, Ï€ÎµÏÎ¹Î¿Ï‡Î® Î® Ï„Î±Ï‡Ï…Î´ÏÎ¿Î¼Î¹ÎºÏŒ ÎºÎ±Î¹ Ï€Î¬Ï„Î·ÏƒÎµ Î‘Î½Î±Î¶Î®Ï„Î·ÏƒÎ·.");
  const [addressResponse, setAddressResponse] = useState<AddressSearchResponse | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<AddressCandidate | null>(null);
  const [segmentCount, setSegmentCount] = useState<number | null>(null);

  async function searchAddress() {
    setAddressLoading(true);
    setMessage("Î‘Î½Î±Î¶Î®Ï„Î·ÏƒÎ· Î´Î¹ÎµÏÎ¸Ï…Î½ÏƒÎ·Ï‚...");

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
        setMessage(json.message ?? "Î”ÎµÎ½ Î²ÏÎ­Î¸Î·ÎºÎµ Î´Î¹ÎµÏÎ¸Ï…Î½ÏƒÎ·.");
        return;
      }

      setMessage(`Î’ÏÎ­Î¸Î·ÎºÎ±Î½ ${json.candidateCount ?? 0} ÎµÏ€Î¹Î»Î¿Î³Î­Ï‚. Î”Î¹Î¬Î»ÎµÎ¾Îµ ÏƒÏ‰ÏƒÏ„Î® Ï€ÎµÏÎ¹Î¿Ï‡Î®.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Î£Ï†Î¬Î»Î¼Î± Î±Î½Î±Î¶Î®Ï„Î·ÏƒÎ·Ï‚.");
    } finally {
      setAddressLoading(false);
    }
  }

  async function loadSegment(nextBbox?: BboxForm) {
    const activeBbox = nextBbox ?? bbox;

    setSegmentLoading(true);
    setMessage("Î¦ÏŒÏÏ„Ï‰ÏƒÎ· Î´Î¹ÎºÏ„ÏÎ¿Ï… ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚ ÏƒÏ„Î·Î½ ÎµÏ€Î¹Î»ÎµÎ³Î¼Î­Î½Î· Ï€ÎµÏÎ¹Î¿Ï‡Î®...");

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

      if (!response.ok || !json.segment?.features?.length) {
        setMessage(json.error || json.reason || "Î”ÎµÎ½ Î²ÏÎ­Î¸Î·ÎºÎµ Ï„Î¼Î®Î¼Î± Î´Î¹ÎºÏ„ÏÎ¿Ï… ÏƒÎµ Î±Ï…Ï„Î® Ï„Î·Î½ Ï€ÎµÏÎ¹Î¿Ï‡Î®.");
        setSegmentCount(null);
        clearWaterLayer();
        return;
      }

      setSegmentCount(json.segmentCount ?? json.segment.features.length);
      drawWaterSegment(json);
      setMessage(`Î¦Î¿ÏÏ„ÏŽÎ¸Î·ÎºÎµ Ï„Î¼Î®Î¼Î± Î´Î¹ÎºÏ„ÏÎ¿Ï… ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚: ${json.segmentCount ?? json.segment.features.length} ÏƒÏ„Î¿Î¹Ï‡ÎµÎ¯Î±.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Î£Ï†Î¬Î»Î¼Î± Ï†ÏŒÏÏ„Ï‰ÏƒÎ·Ï‚ Î´Î¹ÎºÏ„ÏÎ¿Ï….");
    } finally {
      setSegmentLoading(false);
    }
  }

  function clearWaterLayer() {
    const map = mapRef.current;

    if (map && waterLayerRef.current) {
      waterLayerRef.current.removeFrom(map);
      waterLayerRef.current = null;
    }
  }

  function drawWaterSegment(response: SegmentResponse) {
    const leaflet = leafletRef.current;
    const map = mapRef.current;

    if (!leaflet || !map || !response.segment?.features?.length) return;

    clearWaterLayer();

    const layer = leaflet.geoJSON(response.segment as never, {
      style: (feature) =>
        getPipeStyleFromOriginalKml(
          feature as { properties?: Record<string, unknown> } | undefined,
        ),
      pointToLayer: (feature, latlng) => {
        const style = getPipeStyleFromOriginalKml(
          feature as { properties?: Record<string, unknown> } | undefined,
        );

        return leaflet.circleMarker(latlng, {
          radius: Math.max(3, style.weight),
          color: style.color,
          fillColor: style.color,
          fillOpacity: style.opacity,
          opacity: style.opacity,
          weight: style.weight,
        });
      },
    });

    layer.addTo(map);
    waterLayerRef.current = layer;

    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [34, 34],
        maxZoom: 18,
      });
    }
  }

  function selectCandidate(candidate: AddressCandidate) {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    const nextBbox = bboxAroundCandidate(candidate);

    setSelectedCandidate(candidate);
    setBbox(nextBbox);

    if (leaflet && map) {
      map.setView([candidate.coordinates.lat, candidate.coordinates.lng], 17, {
        animate: true,
      });

      if (markerLayerRef.current) {
        markerLayerRef.current.removeFrom(map);
      }

      const marker = leaflet
        .circleMarker([candidate.coordinates.lat, candidate.coordinates.lng], {
          radius: 9,
          color: "#f2d27a",
          fillColor: "#f2d27a",
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

      const currentBbox = bboxFromMap(current);
      setBbox(currentBbox);
      void loadSegment(currentBbox);
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
          attribution: "Â© OpenStreetMap contributors",
        })
        .addTo(map);

      map.on("moveend", () => setBbox(bboxFromMap(map)));
      map.on("zoomend", () => setBbox(bboxFromMap(map)));

      mapRef.current = map;
      setBbox(bboxFromMap(map));
      setMapReady(true);

      window.setTimeout(() => map.invalidateSize(), 100);
      window.setTimeout(() => map.invalidateSize(), 500);
      window.setTimeout(() => map.invalidateSize(), 1200);
    }

    void initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#07101f] px-4 py-6 text-white md:px-8">
      <section className="mx-auto flex max-w-[1700px] flex-col gap-5">
        <header className="rounded-[2rem] border border-[#d8b35a]/30 bg-[#101b2f] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#d8b35a]">
            Pantavion Water Network
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            Î§Î¬ÏÏ„Î·Ï‚ Î´Î¹ÎºÏ„ÏÎ¿Ï… ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚
          </h1>

          <p className="mt-3 max-w-5xl text-base leading-7 text-slate-200">
            Î‘Î½Î±Î¶Î®Ï„Î·ÏƒÎ· Î¼Îµ Î¿Î´ÏŒ, Î±ÏÎ¹Î¸Î¼ÏŒ, Ï€ÎµÏÎ¹Î¿Ï‡Î® ÎºÎ±Î¹ Ï„Î±Ï‡Ï…Î´ÏÎ¿Î¼Î¹ÎºÏŒ. Î‘Î½ Ï…Ï€Î¬ÏÏ‡Î¿Ï…Î½ Î¯Î´Î¹ÎµÏ‚ Î¿Î´Î¿Î¯
            ÏƒÎµ Î´Î¹Î±Ï†Î¿ÏÎµÏ„Î¹ÎºÎ­Ï‚ Ï€ÎµÏÎ¹Î¿Ï‡Î­Ï‚, Ï€ÏÏŽÏ„Î± ÎµÏ€Î¹Î»Î­Î³ÎµÏ„Î±Î¹ Î· ÏƒÏ‰ÏƒÏ„Î® Î´Î¹ÎµÏÎ¸Ï…Î½ÏƒÎ· ÎºÎ±Î¹ Î¼ÎµÏ„Î¬
            Ï†Î¿ÏÏ„ÏŽÎ½ÎµÎ¹ Ï„Î¿ Î±Î½Ï„Î¯ÏƒÏ„Î¿Î¹Ï‡Î¿ Ï„Î¼Î®Î¼Î± Î´Î¹ÎºÏ„ÏÎ¿Ï….
          </p>
        </header>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
          <h2 className="text-2xl font-bold text-[#f2d27a]">
            Î‘Î½Î±Î¶Î®Ï„Î·ÏƒÎ· Î´Î¹ÎµÏÎ¸Ï…Î½ÏƒÎ·Ï‚
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.5fr_1fr_0.7fr_auto]">
            <input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              placeholder="ÎŸÎ´ÏŒÏ‚"
              className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
            />

            <input
              value={houseNumber}
              onChange={(event) => setHouseNumber(event.target.value)}
              placeholder="Î‘ÏÎ¹Î¸Î¼ÏŒÏ‚"
              className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
            />

            <input
              value={area}
              onChange={(event) => setArea(event.target.value)}
              placeholder="Î ÎµÏÎ¹Î¿Ï‡Î® / Î”Î®Î¼Î¿Ï‚"
              className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
            />

            <input
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              placeholder="Î¤Î±Ï‡Ï…Î´ÏÎ¿Î¼Î¹ÎºÏŒÏ‚"
              className="rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white"
            />

            <button
              type="button"
              onClick={searchAddress}
              className="rounded-xl border border-[#d8b35a]/40 bg-[#d8b35a]/10 px-5 py-3 text-sm font-bold text-[#ffe8a3]"
            >
              {addressLoading ? "Î‘Î½Î±Î¶Î®Ï„Î·ÏƒÎ·..." : "Î‘Î½Î±Î¶Î®Ï„Î·ÏƒÎ·"}
            </button>
          </div>

          {addressResponse?.candidates?.length ? (
            <div className="mt-4 grid gap-3">
              <p className="text-sm font-bold text-[#f2d27a]">
                Î”Î¹Î¬Î»ÎµÎ¾Îµ ÏƒÏ‰ÏƒÏ„Î® Î´Î¹ÎµÏÎ¸Ï…Î½ÏƒÎ·
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
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            {QUICK_AREAS.map((quickArea) => (
              <button
                key={quickArea.label}
                type="button"
                onClick={() => moveToArea(quickArea.center, quickArea.zoom)}
                className="rounded-2xl border border-[#d8b35a]/40 bg-[#d8b35a]/10 px-4 py-3 text-sm font-bold text-[#ffe8a3]"
              >
                {quickArea.label}
              </button>
            ))}

            <button
              type="button"
              onClick={loadFromCurrentMap}
              className="rounded-2xl border border-emerald-400/40 bg-emerald-950/30 px-5 py-3 text-sm font-bold text-emerald-100"
            >
              {segmentLoading ? "Î¦ÏŒÏÏ„Ï‰ÏƒÎ·..." : "Î¦ÏŒÏÏ„Ï‰ÏƒÎµ Î´Î¯ÎºÏ„Ï…Î¿ ÏƒÏ„Î·Î½ Ï€ÎµÏÎ¹Î¿Ï‡Î® Ï„Î¿Ï… Ï‡Î¬ÏÏ„Î·"}
            </button>
          </div>

          <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
            {message}
          </p>
        </section>

        {selectedCandidate ? (
          <section className="rounded-[2rem] border border-[#d8b35a]/20 bg-[#d8b35a]/10 p-4">
            <p className="text-sm font-bold text-[#ffe8a3]">Î•Ï€Î¹Î»ÎµÎ³Î¼Î­Î½Î· Î´Î¹ÎµÏÎ¸Ï…Î½ÏƒÎ·</p>
            <p className="mt-2 text-slate-100">{selectedCandidate.displayName}</p>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1426]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
            <h2 className="text-2xl font-bold text-[#f2d27a]">
              Î§Î¬ÏÏ„Î·Ï‚ ÏÎ´ÏÎµÏ…ÏƒÎ·Ï‚
            </h2>

            <p className="text-sm text-slate-300">
              {mapReady
                ? segmentCount
                  ? `Î¦Î¿ÏÏ„Ï‰Î¼Î­Î½Î± ÏƒÏ„Î¿Î¹Ï‡ÎµÎ¯Î± Î´Î¹ÎºÏ„ÏÎ¿Ï…: ${segmentCount}`
                  : "ÎŸ Ï‡Î¬ÏÏ„Î·Ï‚ ÎµÎ¯Î½Î±Î¹ Î­Ï„Î¿Î¹Î¼Î¿Ï‚ Î³Î¹Î± Î¼ÎµÏ„Î±ÎºÎ¯Î½Î·ÏƒÎ· ÎºÎ±Î¹ zoom."
                : "Î¦ÏŒÏÏ„Ï‰ÏƒÎ· Ï‡Î¬ÏÏ„Î·..."}
            </p>
          </div>

          <div
            ref={mapElementRef}
            className="h-[76vh] min-h-[680px] w-full bg-[#06101d]"
            aria-label="Pantavion controlled water network map"
          />
        </section>
      </section>
    </main>
  );
}
