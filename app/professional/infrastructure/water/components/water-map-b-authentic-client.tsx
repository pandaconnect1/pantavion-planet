"use client";

import { useEffect, useRef, useState } from "react";

import { assessWaterMapBPosition } from "@/core/water/water-map-b-position-truth";

declare global {
  interface Window {
    L?: any;
  }
}

type SegmentResponse = {
  segment?: { type: "FeatureCollection"; features: any[] };
  completeNetworkReturned?: boolean;
  rawMasterReturned?: boolean;
  browserFullNetworkLoaded?: boolean;
  error?: string;
  reason?: string;
};

type DeviceIdentity = { deviceId: string; deviceToken: string };

type PositionState = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  measuredAt: string;
  quality: "high" | "medium" | "low" | "unusable";
  warning: string | null;
} | null;

const LIMASSOL_CENTER: [number, number] = [34.6851, 33.0442];
const MAX_FEATURES_PER_TILE = 1200;
const VIEWPORT_TILE_SPAN_DEGREES = 0.045;
const MAX_VIEWPORT_TILES = 16;

function randomSecret() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    return Array.from(window.crypto.getRandomValues(new Uint32Array(4)))
      .map((value) => value.toString(36))
      .join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateDevice(): DeviceIdentity {
  const stored = window.localStorage.getItem("pantavion_water_access_device");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<DeviceIdentity>;
      if (parsed.deviceId && parsed.deviceToken) {
        return { deviceId: parsed.deviceId, deviceToken: parsed.deviceToken };
      }
    } catch {}
  }

  const device = {
    deviceId: `water-device-${Date.now().toString(36)}-${randomSecret()}`,
    deviceToken: `water-token-${randomSecret()}-${randomSecret()}`,
  };
  window.localStorage.setItem("pantavion_water_access_device", JSON.stringify(device));
  return device;
}

function ensureLeaflet() {
  return new Promise<any>((resolve, reject) => {
    if (window.L) return resolve(window.L);

    if (!document.querySelector("link[data-pantavion-leaflet-css]")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      css.setAttribute("data-pantavion-leaflet-css", "true");
      document.head.appendChild(css);
    }

    const existing = document.querySelector("script[data-pantavion-leaflet-js]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.setAttribute("data-pantavion-leaflet-js", "true");
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function splitVisibleBboxIntoSafeTiles(map: any) {
  const bounds = map.getBounds();
  const bbox = {
    minLng: bounds.getWest(),
    minLat: bounds.getSouth(),
    maxLng: bounds.getEast(),
    maxLat: bounds.getNorth(),
  };
  const lngSpan = bbox.maxLng - bbox.minLng;
  const latSpan = bbox.maxLat - bbox.minLat;
  const lngSteps = Math.max(1, Math.ceil(lngSpan / VIEWPORT_TILE_SPAN_DEGREES));
  const latSteps = Math.max(1, Math.ceil(latSpan / VIEWPORT_TILE_SPAN_DEGREES));
  if (lngSteps * latSteps > MAX_VIEWPORT_TILES) throw new Error("VISIBLE_AREA_TOO_LARGE");

  const tiles = [];
  for (let y = 0; y < latSteps; y += 1) {
    for (let x = 0; x < lngSteps; x += 1) {
      tiles.push({
        minLng: bbox.minLng + (lngSpan * x) / lngSteps,
        maxLng: bbox.minLng + (lngSpan * (x + 1)) / lngSteps,
        minLat: bbox.minLat + (latSpan * y) / latSteps,
        maxLat: bbox.minLat + (latSpan * (y + 1)) / latSteps,
      });
    }
  }
  return tiles;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function WaterMapBAuthenticClient() {
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [area, setArea] = useState("Λεμεσός");
  const [postalCode, setPostalCode] = useState("");
  const [message, setMessage] = useState("Map B έτοιμος για ασφαλή προβολή. Το DWG alignment παραμένει μη επαληθευμένο μέχρι να περάσει το CRS gate.");
  const [loading, setLoading] = useState(false);
  const [featureCount, setFeatureCount] = useState<number | null>(null);
  const [position, setPosition] = useState<PositionState>(null);
  const [mapReady, setMapReady] = useState(false);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const networkLayerRef = useRef<any>(null);
  const pointMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    void ensureLeaflet().then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;
      const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true }).setView(LIMASSOL_CENTER, 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, []);

  async function searchAddress() {
    if (!mapRef.current) return;
    const query = [street, houseNumber, area, postalCode, "Cyprus"].map((v) => v.trim()).filter(Boolean).join(", ");
    if (!query || query === "Cyprus") return setMessage("Γράψε οδό, αριθμό, περιοχή ή ταχυδρομικό κώδικα.");

    setLoading(true);
    setMessage("Αναζήτηση σημείου...");
    try {
      const params = new URLSearchParams({ q: query, format: "json", limit: "1", addressdetails: "1", countrycodes: "cy" });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, { headers: { accept: "application/json" } });
      const results = (await response.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
      const lat = Number(results[0]?.lat);
      const lng = Number(results[0]?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return setMessage("Δεν βρέθηκε το σημείο.");

      const L = await ensureLeaflet();
      if (pointMarkerRef.current) pointMarkerRef.current.remove();
      if (accuracyCircleRef.current) accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
      pointMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 9,
        color: "#07111f",
        weight: 3,
        fillColor: "#f2c766",
        fillOpacity: 0.95,
      }).addTo(mapRef.current).bindPopup(escapeHtml(results[0]?.display_name || query));
      mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), 18), { animate: true });
      setMessage("Βρέθηκε το σημείο αναζήτησης. Η γεωγραφική σύμπτωση με το αυθεντικό DWG θα θεωρηθεί έγκυρη μόνο μετά το CRS/alignment gate.");
    } catch {
      setMessage("Δεν ολοκληρώθηκε η αναζήτηση.");
    } finally {
      setLoading(false);
    }
  }

  async function locateMe() {
    if (!navigator.geolocation || !mapRef.current) return setMessage("Δεν είναι διαθέσιμη η θέση στη συσκευή.");
    setLoading(true);
    setMessage("Εντοπισμός θέσης με υψηλή διαθέσιμη ακρίβεια...");

    navigator.geolocation.getCurrentPosition(
      async (geo) => {
        const lat = geo.coords.latitude;
        const lng = geo.coords.longitude;
        const accuracy = geo.coords.accuracy;
        const measuredAt = new Date(geo.timestamp || Date.now()).toISOString();
        const assessment = assessWaterMapBPosition({
          latitude: lat,
          longitude: lng,
          accuracyMeters: accuracy,
          measuredAt,
          source: "device-geolocation",
          alignmentVerified: false,
        });
        const L = await ensureLeaflet();

        if (pointMarkerRef.current) pointMarkerRef.current.remove();
        if (accuracyCircleRef.current) accuracyCircleRef.current.remove();

        accuracyCircleRef.current = L.circle([lat, lng], {
          radius: accuracy,
          weight: 2,
          opacity: 0.7,
          fillOpacity: 0.12,
        }).addTo(mapRef.current);

        pointMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 9,
          color: "#07111f",
          weight: 3,
          fillColor: "#22c55e",
          fillOpacity: 0.95,
        }).addTo(mapRef.current).bindPopup(`Η θέση μου — ακρίβεια ±${Math.round(accuracy)} m`);

        mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), 18), { animate: true });
        setPosition({ latitude: lat, longitude: lng, accuracyMeters: accuracy, measuredAt, quality: assessment.quality, warning: assessment.warning });
        setMessage(`Βρέθηκε η θέση σου με εκτιμώμενη ακρίβεια ±${Math.round(accuracy)} m. Το DWG alignment δεν έχει ακόμη επαληθευτεί.`);
        setLoading(false);
      },
      () => {
        setMessage("Δεν ήταν διαθέσιμη η θέση. Έλεγξε την άδεια τοποθεσίας της συσκευής/browser.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 },
    );
  }

  async function loadVisibleNetwork() {
    if (!mapRef.current) return;
    setLoading(true);
    setMessage("Φόρτωση προστατευμένων τμημάτων του δικτύου...");
    try {
      const tiles = splitVisibleBboxIntoSafeTiles(mapRef.current);
      const device = getOrCreateDevice();
      const features: any[] = [];
      for (const tile of tiles) {
        const params = new URLSearchParams({
          minLng: tile.minLng.toFixed(6), minLat: tile.minLat.toFixed(6), maxLng: tile.maxLng.toFixed(6), maxLat: tile.maxLat.toFixed(6),
          maxFeatures: String(MAX_FEATURES_PER_TILE), street, houseNumber, area, postalCode,
        });
        const response = await fetch(`/api/professional/infrastructure/water/segment/bbox?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
          headers: { "x-pantavion-water-device-id": device.deviceId, "x-pantavion-water-device-token": device.deviceToken },
        });
        const json = (await response.json()) as SegmentResponse;
        if (!response.ok || json.completeNetworkReturned || json.rawMasterReturned || json.browserFullNetworkLoaded) {
          throw new Error(json.error || json.reason || "safe_segment_failed");
        }
        if (json.segment?.features?.length) features.push(...json.segment.features);
      }
      if (!features.length) throw new Error("NO_FEATURES");

      const L = await ensureLeaflet();
      if (networkLayerRef.current) networkLayerRef.current.remove();
      networkLayerRef.current = L.geoJSON({ type: "FeatureCollection", features }, {
        style: () => ({ weight: 3, opacity: 0.95 }),
        pointToLayer: (_feature: any, latlng: any) => L.circleMarker(latlng, { radius: 4, weight: 2, fillOpacity: 0.8 }),
        onEachFeature: (feature: any, layer: any) => {
          const props = feature?.properties || {};
          const name = props.name || props.Name || props.folderName || "Water asset";
          const sourceLayer = props.folderPath || props.folder || props.layer || "source layer unavailable";
          layer.bindPopup(`<strong>${escapeHtml(name)}</strong><br/><small>${escapeHtml(sourceLayer)}</small>`);
        },
      }).addTo(mapRef.current);
      setFeatureCount(features.length);
      setMessage(`Φορτώθηκαν ${features.length} προστατευμένα features στην ορατή περιοχή. Η canonical αυθεντικότητα του νέου DWG παραμένει δεμένη με το ingestion/CRS gate.`);
    } catch (error) {
      setFeatureCount(null);
      setMessage(error instanceof Error && error.message === "VISIBLE_AREA_TOO_LARGE" ? "Κάνε zoom για μικρότερη ορατή περιοχή." : "Δεν φορτώθηκε το προστατευμένο δίκτυο. Έλεγξε access ή την ορατή περιοχή.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d8b45f]">Pantavion Water / Map B</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_360px]">
            <div>
              <h1 className="text-3xl font-black md:text-5xl">Authentic Master GIS</h1>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">Αυθεντικό Map B ως source of truth, με ξεχωριστό field GIS runtime για θέση συσκευής, αναζήτηση και προστατευμένη προβολή δικτύου. Καμία γεωμετρία δεν θεωρείται γεωγραφικά επαληθευμένη πριν το CRS/alignment gate.</p>
            </div>
            <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm">
              <strong>Alignment:</strong> PENDING VERIFICATION<br/>
              <span className="text-slate-300">GPS/search λειτουργούν, αλλά δεν δηλώνουν ότι ο αγωγός είναι στην ακριβή πραγματική θέση μέχρι να επαληθευτεί το DWG.</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Οδός" className="rounded-2xl border border-white/15 bg-[#06101f] px-4 py-3" />
            <input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} placeholder="Αριθμός" className="rounded-2xl border border-white/15 bg-[#06101f] px-4 py-3" />
            <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Περιοχή" className="rounded-2xl border border-white/15 bg-[#06101f] px-4 py-3" />
            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Ταχυδρομικός" className="rounded-2xl border border-white/15 bg-[#06101f] px-4 py-3" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <button onClick={() => void locateMe()} disabled={loading || !mapReady} className="rounded-2xl border border-emerald-400/50 bg-emerald-400/10 px-5 py-3 font-black disabled:opacity-50">📍 Η θέση μου</button>
            <button onClick={() => void searchAddress()} disabled={loading || !mapReady} className="rounded-2xl border border-sky-400/50 bg-sky-400/10 px-5 py-3 font-black disabled:opacity-50">🔎 Αναζήτηση</button>
            <button onClick={() => void loadVisibleNetwork()} disabled={loading || !mapReady} className="rounded-2xl bg-[#d8b45f] px-5 py-3 font-black text-[#07101e] disabled:opacity-50">{loading ? "Φόρτωση..." : "💧 Φόρτωση δικτύου"}</button>
          </div>

          {position ? (
            <div className="mt-4 grid gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm md:grid-cols-4">
              <div><strong>Ακρίβεια</strong><br/>±{Math.round(position.accuracyMeters)} m</div>
              <div><strong>Ποιότητα</strong><br/>{position.quality}</div>
              <div><strong>Μέτρηση</strong><br/>{new Date(position.measuredAt).toLocaleTimeString("el-CY")}</div>
              <div><strong>DWG alignment</strong><br/>Μη επαληθευμένο</div>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#06101f] px-4 py-3 text-sm text-slate-200">{message}{featureCount !== null ? <span className="ml-2 text-[#f3db9d]">Features: {featureCount}</span> : null}</div>
        </div>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-[#d8b45f]/30 bg-[#0a1629]">
          <div className="border-b border-white/10 px-5 py-4"><h2 className="text-2xl font-black text-[#f3db9d]">Map B Field View</h2><p className="text-sm text-slate-300">Road base + GPS accuracy circle + protected water network viewport</p></div>
          <div ref={mapEl} className="h-[72vh] min-h-[520px] w-full bg-slate-200" />
        </section>
      </section>
    </main>
  );
}
