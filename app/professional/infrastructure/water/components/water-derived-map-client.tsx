"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

type Mode = "b" | "c";

type Bbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

type SegmentResponse = {
  segment?: {
    type: "FeatureCollection";
    features: any[];
  };
  segmentCount?: number;
  pipeSegmentCount?: number;
  completeNetworkReturned?: boolean;
  rawMasterReturned?: boolean;
  browserFullNetworkLoaded?: boolean;
  error?: string;
  reason?: string;
};

type DeviceIdentity = {
  deviceId: string;
  deviceToken: string;
};

const LIMASSOL_CENTER: [number, number] = [34.6851, 33.0442];

const MAX_FEATURES_PER_TILE = 1200;
const VIEWPORT_TILE_SPAN_DEGREES = 0.045;
const MAX_VIEWPORT_TILES = 16;

const DEVICE_ID_KEYS = [
  "pantavion:water:device-id:v1",
  "pantavion_water_device_id",
  "pantavion_water_access_device_id",
  "pantavionWaterAccessDeviceId",
  "waterAccessDeviceId",
];

const DEVICE_TOKEN_KEYS = [
  "pantavion:water:device-token:v1",
  "pantavion_water_device_token",
  "pantavion_water_access_device_token",
  "pantavionWaterAccessDeviceToken",
  "waterAccessDeviceToken",
];

const modeCopy = {
  b: {
    eyebrow: "Pantavion Water B Derived",
    title: "B Derived Protected Map",
    subtitle:
      "Πρώτη προστατευμένη B προβολή από το αυθεντικό master source. Το δίκτυο φορτώνει μόνο σε ελεγχόμενα τμήματα ορατής περιοχής, πάνω σε οδικό υπόβαθρο, για να ελέγχεται αν οι αγωγοί κάθονται σωστά στις οδικές αρτηρίες.",
    status: "B derived preview",
    safety:
      "Δεν γίνεται raw DWG download, δεν φορτώνεται ολόκληρο το master στον browser και δεν αλλάζει καμία γεωμετρία χωρίς founder approval.",
  },
  c: {
    eyebrow: "Pantavion Water C Intelligent",
    title: "C Intelligent Map Preview",
    subtitle:
      "Πρώτη C προβολή για engineering intelligence. Δείχνει το προστατευμένο δίκτυο και οργανώνει τα επόμενα layers: υψόμετρα, πίεση, ζώνες, PRV, βλάβες, αλλαγές πεδίου, φωτογραφίες και τηλεμετρία.",
    status: "C intelligence preview",
    safety:
      "Τα intelligence layers είναι ελεγχόμενα. Δεν εμφανίζονται ψεύτικα δεδομένα πίεσης ή υψομέτρων μέχρι να συνδεθούν επίσημες πηγές και να εγκριθούν.",
  },
} as const;

const cLayers = [
  {
    key: "terrain",
    label: "Υψόμετρα / μορφολογία",
    detail: "Μελλοντική σύνδεση με υψομετρικά δεδομένα και μορφολογία εδάφους.",
  },
  {
    key: "pressure",
    label: "Πίεση / ζώνες",
    detail: "Πίεση, υψηλές/χαμηλές περιοχές και ζώνες ελέγχου όταν υπάρξουν επίσημες μετρήσεις.",
  },
  {
    key: "demand",
    label: "Ανάπτυξη / ζήτηση",
    detail: "Πυκνοκατοίκηση, νέες οικοδομές, ξενοδοχεία, επεκτάσεις και αύξηση φορτίων.",
  },
  {
    key: "prv",
    label: "PRV candidates",
    detail: "Υποψήφιες περιοχές για pressure reducing valve μόνο μετά από engineering review.",
  },
  {
    key: "field",
    label: "Αλλαγές πεδίου",
    detail: "Βάνες, βλάβες, φωτογραφίες, σημειώσεις και αλλαγές που θα γίνονται visible μετά από approval.",
  },
  {
    key: "telemetry",
    label: "Τηλεμετρία",
    detail: "Μελλοντική σύνδεση αισθητήρων, πιέσεων, παροχών και συμβάντων.",
  },
];

function randomSecret() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const values = window.crypto.getRandomValues(new Uint32Array(4));

    return Array.from(values)
      .map((value) => value.toString(36))
      .join("");
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function readStorage(keys: string[]) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return "";
}

function readJsonDevice(): DeviceIdentity | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem("pantavion_water_access_device");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<DeviceIdentity>;

    if (parsed.deviceId && parsed.deviceToken) {
      return {
        deviceId: parsed.deviceId,
        deviceToken: parsed.deviceToken,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function getOrCreateDevice(): DeviceIdentity {
  const jsonDevice = readJsonDevice();

  let deviceId = jsonDevice?.deviceId || readStorage(DEVICE_ID_KEYS);
  let deviceToken = jsonDevice?.deviceToken || readStorage(DEVICE_TOKEN_KEYS);

  if (!deviceId) deviceId = `water-device-${Date.now().toString(36)}-${randomSecret()}`;
  if (!deviceToken) deviceToken = `water-token-${randomSecret()}-${randomSecret()}`;

  if (typeof window !== "undefined") {
    window.localStorage.setItem("pantavion:water:device-id:v1", deviceId);
    window.localStorage.setItem("pantavion:water:device-token:v1", deviceToken);
    window.localStorage.setItem("pantavion_water_device_id", deviceId);
    window.localStorage.setItem("pantavion_water_device_token", deviceToken);
    window.localStorage.setItem(
      "pantavion_water_access_device",
      JSON.stringify({ deviceId, deviceToken })
    );
  }

  return { deviceId, deviceToken };
}

function ensureLeaflet() {
  return new Promise<any>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window_unavailable"));
      return;
    }

    if (window.L) {
      resolve(window.L);
      return;
    }

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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getPipeStyle(feature: any, mode: Mode) {
  const raw = feature?.properties?.kmlLineStyle;

  if (!raw || typeof raw !== "object") {
    return {
      color: mode === "b" ? "#38bdf8" : "#f2c766",
      weight: mode === "b" ? 3 : 4,
      opacity: 0.95,
    };
  }

  const style = raw as {
    color?: unknown;
    weight?: unknown;
    width?: unknown;
    opacity?: unknown;
  };

  const rawWeight =
    typeof style.weight === "number"
      ? style.weight
      : typeof style.width === "number"
        ? style.width
        : mode === "b"
          ? 3
          : 4;

  return {
    color:
      typeof style.color === "string"
        ? style.color
        : mode === "b"
          ? "#38bdf8"
          : "#f2c766",
    weight: Math.max(2, Math.min(10, rawWeight)),
    opacity:
      typeof style.opacity === "number"
        ? Math.max(0.2, Math.min(1, style.opacity))
        : 0.95,
  };
}

function bboxFromMap(map: any): Bbox {
  const bounds = map.getBounds();

  return {
    minLng: bounds.getWest(),
    minLat: bounds.getSouth(),
    maxLng: bounds.getEast(),
    maxLat: bounds.getNorth(),
  };
}

function bboxParams(bbox: Bbox) {
  return {
    minLng: bbox.minLng.toFixed(6),
    minLat: bbox.minLat.toFixed(6),
    maxLng: bbox.maxLng.toFixed(6),
    maxLat: bbox.maxLat.toFixed(6),
  };
}

function splitVisibleBboxIntoSafeTiles(bbox: Bbox) {
  const lngSpan = bbox.maxLng - bbox.minLng;
  const latSpan = bbox.maxLat - bbox.minLat;

  const lngSteps = Math.max(1, Math.ceil(lngSpan / VIEWPORT_TILE_SPAN_DEGREES));
  const latSteps = Math.max(1, Math.ceil(latSpan / VIEWPORT_TILE_SPAN_DEGREES));

  if (lngSteps * latSteps > MAX_VIEWPORT_TILES) {
    throw new Error("VISIBLE_AREA_TOO_LARGE");
  }

  const tiles: Bbox[] = [];

  for (let y = 0; y < latSteps; y += 1) {
    for (let x = 0; x < lngSteps; x += 1) {
      const minLng = bbox.minLng + (lngSpan * x) / lngSteps;
      const maxLng = bbox.minLng + (lngSpan * (x + 1)) / lngSteps;
      const minLat = bbox.minLat + (latSpan * y) / latSteps;
      const maxLat = bbox.minLat + (latSpan * (y + 1)) / latSteps;

      tiles.push({ minLng, minLat, maxLng, maxLat });
    }
  }

  return tiles;
}

function featureKey(feature: any, fallback: string) {
  const id =
    feature?.id ??
    feature?.properties?.placemarkIndex ??
    feature?.properties?.featureIndex ??
    feature?.properties?.name;

  return id === undefined || id === null ? fallback : String(id);
}

function featurePopup(feature: any, mode: Mode) {
  const props = feature?.properties || {};
  const name = props.name || props.Name || props.folderName || "Water segment";
  const folder = props.folderPath || props.folder || "";
  const source = mode === "b" ? "B Derived" : "C Intelligent";

  return `
    <div style="font-family:system-ui,sans-serif;min-width:180px">
      <strong>${escapeHtml(name)}</strong><br/>
      <span>${escapeHtml(source)} protected view</span><br/>
      ${folder ? `<small>${escapeHtml(folder)}</small>` : ""}
    </div>
  `;
}

export default function WaterDerivedMapClient({ mode }: { mode: Mode }) {
  const copy = modeCopy[mode];

  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [area, setArea] = useState("Λεμεσός");
  const [postalCode, setPostalCode] = useState("");
  const [message, setMessage] = useState("Ο χάρτης είναι έτοιμος. Κάνε zoom ή αναζήτηση και φόρτωσε προστατευμένα τμήματα.");
  const [loading, setLoading] = useState(false);
  const [featureCount, setFeatureCount] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [enabledLayers, setEnabledLayers] = useState<string[]>(["field"]);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const loadInProgressRef = useRef(false);

  const activeLayerText = useMemo(() => {
    if (mode !== "c") return "";
    if (enabledLayers.length === 0) return "Δεν έχει ενεργοποιηθεί intelligence layer.";

    return `Ενεργά C workspace layers: ${enabledLayers.length}`;
  }, [enabledLayers.length, mode]);

  useEffect(() => {
    let cancelled = false;

    async function bootMap() {
      const L = await ensureLeaflet();

      if (cancelled || !mapEl.current || mapRef.current) return;

      const map = L.map(mapEl.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(LIMASSOL_CENTER, 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    }

    void bootMap();

    return () => {
      cancelled = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  async function loadVisibleSegments() {
    const map = mapRef.current;

    if (!map || loadInProgressRef.current) return;

    loadInProgressRef.current = true;
    setLoading(true);
    setMessage("Φόρτωση protected derived τμημάτων...");

    try {
      const visibleBbox = bboxFromMap(map);
      const tiles = splitVisibleBboxIntoSafeTiles(visibleBbox);
      const allFeatures: any[] = [];
      const device = getOrCreateDevice();

      for (const tile of tiles) {
        const params = new URLSearchParams({
          ...bboxParams(tile),
          maxFeatures: String(MAX_FEATURES_PER_TILE),
          street,
          houseNumber,
          area,
          postalCode,
        });

        const response = await fetch(
          `/api/professional/infrastructure/water/segment/bbox?${params.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
            headers: {
              "x-pantavion-water-device-id": device.deviceId,
              "x-pantavion-water-device-token": device.deviceToken,
            },
          }
        );

        const json = (await response.json()) as SegmentResponse;

        if (
          !response.ok ||
          json.completeNetworkReturned === true ||
          json.rawMasterReturned === true ||
          json.browserFullNetworkLoaded === true
        ) {
          throw new Error(json.error || json.reason || "safe_segment_failed");
        }

        if (json.segment?.features?.length) {
          allFeatures.push(...json.segment.features);
        }
      }

      const deduped = new Map<string, any>();

      allFeatures.forEach((feature, index) => {
        deduped.set(featureKey(feature, `fallback-${index}`), feature);
      });

      const features = Array.from(deduped.values());

      if (features.length <= 0) {
        throw new Error("NO_FEATURES");
      }

      const L = await ensureLeaflet();

      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }

      const collection = {
        type: "FeatureCollection",
        features,
      };

      const layer = L.geoJSON(collection, {
        style: (feature: any) => getPipeStyle(feature, mode),
        pointToLayer: (feature: any, latlng: any) => {
          const style = getPipeStyle(feature, mode);

          return L.circleMarker(latlng, {
            radius: Math.max(3, style.weight),
            color: style.color,
            fillColor: style.color,
            fillOpacity: style.opacity,
            opacity: style.opacity,
            weight: style.weight,
          });
        },
        onEachFeature: (feature: any, leafletLayer: any) => {
          leafletLayer.bindPopup(featurePopup(feature, mode));
        },
      });

      layer.addTo(map);
      layerRef.current = layer;

      setFeatureCount(features.length);
      setMessage(`Φορτώθηκαν ${features.length} protected derived τμήματα σε ${tiles.length} ασφαλή tiles.`);
    } catch (error) {
      setFeatureCount(null);

      if (error instanceof Error && error.message === "VISIBLE_AREA_TOO_LARGE") {
        setMessage("Η ορατή περιοχή είναι μεγάλη. Κάνε zoom και ξαναφόρτωσε.");
      } else if (error instanceof Error && error.message === "NO_FEATURES") {
        setMessage("Δεν βρέθηκαν αγωγοί στην ορατή περιοχή. Μετακίνησε τον χάρτη ή δοκίμασε άλλη οδό.");
      } else {
        setMessage("Δεν φορτώθηκαν protected derived τμήματα. Έλεγξε access ή κάνε zoom.");
      }
    } finally {
      loadInProgressRef.current = false;
      setLoading(false);
    }
  }

  async function searchAddress() {
    const map = mapRef.current;

    if (!map) return;

    const query = [street, houseNumber, area, postalCode, "Cyprus"]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");

    if (!query || query === "Cyprus") {
      setMessage("Γράψε οδό, αριθμό, περιοχή ή ταχυδρομικό.");
      return;
    }

    setLoading(true);
    setMessage("Αναζήτηση σημείου...");

    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        limit: "1",
        addressdetails: "1",
        countrycodes: "cy",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            accept: "application/json",
          },
        }
      );

      const results = (await response.json()) as Array<{
        lat?: string;
        lon?: string;
        display_name?: string;
      }>;

      const result = results[0];
      const lat = Number(result?.lat);
      const lng = Number(result?.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setMessage("Δεν βρέθηκε το σημείο. Δοκίμασε οδό + περιοχή ή χωρίς αριθμό.");
        return;
      }

      const L = await ensureLeaflet();

      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      markerRef.current = L.circleMarker([lat, lng], {
        radius: 9,
        color: "#07111f",
        weight: 3,
        fillColor: "#f2c766",
        fillOpacity: 0.95,
      })
        .addTo(map)
        .bindPopup(result?.display_name || query);

      map.setView([lat, lng], Math.max(map.getZoom(), 18), {
        animate: true,
      });

      setMessage("Βρέθηκε σημείο. Φόρτωσε τώρα το B/C protected δίκτυο στην ορατή περιοχή.");
    } catch {
      setMessage("Δεν ολοκληρώθηκε η αναζήτηση.");
    } finally {
      setLoading(false);
    }
  }

  async function locateMe() {
    if (typeof window === "undefined" || !window.navigator?.geolocation) {
      setMessage("Δεν είναι διαθέσιμη η θέση στη συσκευή.");
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    setLoading(true);
    setMessage("Εντοπισμός θέσης...");

    window.navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const L = await ensureLeaflet();

        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }

        markerRef.current = L.circleMarker([lat, lng], {
          radius: 9,
          color: "#07111f",
          weight: 3,
          fillColor: "#22c55e",
          fillOpacity: 0.95,
        })
          .addTo(map)
          .bindPopup("Το σημείο μου");

        map.setView([lat, lng], Math.max(map.getZoom(), 18), {
          animate: true,
        });

        setMessage("Βρέθηκε η θέση σου. Φόρτωσε protected derived τμήματα.");
        setLoading(false);
      },
      () => {
        setMessage("Δεν ήταν διαθέσιμη η θέση.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  }

  function toggleLayer(key: string) {
    setEnabledLayers((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  }

  return (
    <main className="min-h-screen bg-[#06101f] px-4 py-6 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#d8b45f]/40 bg-[#0a1629] p-5 shadow-2xl shadow-black/40 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d8b45f]">
            {copy.eyebrow}
          </p>

          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                {copy.title}
              </h1>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">
                {copy.subtitle}
              </p>
            </div>

            <div className="rounded-3xl border border-[#d8b45f]/30 bg-[#d8b45f]/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f3db9d]">
                {copy.status}
              </p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-200">
                {copy.safety}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              placeholder="Οδός"
              className="rounded-2xl border border-white/15 bg-[#06101f] px-4 py-3 text-white outline-none focus:border-[#d8b45f]"
            />
            <input
              value={houseNumber}
              onChange={(event) => setHouseNumber(event.target.value)}
              placeholder="Αριθμός"
              className="rounded-2xl border border-white/15 bg-[#06101f] px-4 py-3 text-white outline-none focus:border-[#d8b45f]"
            />
            <input
              value={area}
              onChange={(event) => setArea(event.target.value)}
              placeholder="Περιοχή"
              className="rounded-2xl border border-white/15 bg-[#06101f] px-4 py-3 text-white outline-none focus:border-[#d8b45f]"
            />
            <input
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              placeholder="Ταχυδρομικός"
              className="rounded-2xl border border-white/15 bg-[#06101f] px-4 py-3 text-white outline-none focus:border-[#d8b45f]"
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <button
              type="button"
              onClick={() => void locateMe()}
              disabled={loading || !mapReady}
              className="rounded-2xl border border-emerald-400/50 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 disabled:opacity-50"
            >
              Το σημείο μου
            </button>

            <button
              type="button"
              onClick={() => void searchAddress()}
              disabled={loading || !mapReady}
              className="rounded-2xl border border-sky-400/50 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 disabled:opacity-50"
            >
              Αναζήτηση οδού
            </button>

            <button
              type="button"
              onClick={() => void loadVisibleSegments()}
              disabled={loading || !mapReady}
              className="rounded-2xl border border-[#d8b45f]/60 bg-[#d8b45f] px-5 py-3 text-sm font-black text-[#07101e] disabled:opacity-50"
            >
              {loading ? "Φόρτωση..." : "Φόρτωση protected δικτύου"}
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#06101f] px-4 py-3 text-sm font-semibold text-slate-200">
            {message}
            {featureCount !== null ? (
              <span className="ml-2 text-[#f3db9d]">
                Segments: {featureCount}
              </span>
            ) : null}
          </div>
        </div>

        {mode === "c" ? (
          <section className="mt-5 rounded-[2rem] border border-[#d8b45f]/30 bg-[#0a1629] p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d8b45f]">
                  C Intelligent Layers
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  Intelligence workspace
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Τα παρακάτω layers οργανώνουν το C Map. Όσα δεν έχουν επίσημα
                  δεδομένα παραμένουν σαν controlled workspace, όχι σαν τελικό
                  engineering συμπέρασμα.
                </p>
              </div>
              <p className="rounded-2xl border border-[#d8b45f]/30 bg-[#d8b45f]/10 px-4 py-3 text-xs font-black text-[#f3db9d]">
                {activeLayerText}
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {cLayers.map((layer) => {
                const active = enabledLayers.includes(layer.key);

                return (
                  <button
                    key={layer.key}
                    type="button"
                    onClick={() => toggleLayer(layer.key)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[#d8b45f]/70 bg-[#d8b45f]/15"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <p className="font-black text-[#f3db9d]">{layer.label}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-300">
                      {layer.detail}
                    </p>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {active ? "workspace active" : "off"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-[#d8b45f]/30 bg-[#0a1629]">
          <div className="flex flex-col gap-1 border-b border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-black text-[#f3db9d]">
              {mode === "b" ? "B Map View" : "C Map View"}
            </h2>
            <span className="text-sm font-semibold text-slate-300">
              Road base + protected network segments
            </span>
          </div>

          <div ref={mapEl} className="h-[72vh] min-h-[520px] w-full bg-slate-200" />
        </section>
      </section>
    </main>
  );
}
