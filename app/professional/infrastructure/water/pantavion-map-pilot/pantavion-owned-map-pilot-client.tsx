"use client";

import { useEffect, useRef, useState } from "react";

type JsonProperties = Record<string, unknown>;

type GeoJsonFeature = {
  id?: string | number;
  type?: string;
  geometry?: unknown;
  properties?: JsonProperties;
  [key: string]: unknown;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

type SegmentResponse = {
  segment?: FeatureCollection;
  segmentCount?: number;
  segmentTruncated?: boolean;
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

type MapLibreBounds = {
  getWest(): number;
  getSouth(): number;
  getEast(): number;
  getNorth(): number;
};

type MapLibreGeoJsonSource = {
  setData(data: FeatureCollection): void;
};

type MapLibreMap = {
  addControl(control: unknown, position?: string): void;
  on(event: string, handler: () => void): void;
  getSource(id: string): MapLibreGeoJsonSource | undefined;
  addSource(id: string, source: unknown): void;
  getLayer(id: string): unknown;
  addLayer(layer: unknown): void;
  getZoom(): number;
  getBounds(): MapLibreBounds;
  easeTo(options: {
    center: [number, number];
    zoom: number;
    duration?: number;
  }): void;
  remove(): void;
};

type MapLibreMarker = {
  setLngLat(coordinates: [number, number]): MapLibreMarker;
  addTo(map: MapLibreMap): MapLibreMarker;
  remove(): void;
};

type MapLibreApi = {
  Map: new (options: {
    container: HTMLElement;
    style: string;
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
    attributionControl: boolean;
    cooperativeGestures: boolean;
  }) => MapLibreMap;
  NavigationControl: new () => unknown;
  Marker: new (options: { element: HTMLElement }) => MapLibreMarker;
};

const LIMASSOL_CENTER: [number, number] = [33.0442, 34.6851];
const MAX_FEATURES = 1200;

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

function asRecord(value: unknown): JsonProperties | null {
  return value !== null && typeof value === "object"
    ? (value as JsonProperties)
    : null;
}

function randomSecret() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const values = window.crypto.getRandomValues(new Uint32Array(4));
    return Array.from(values).map((value) => value.toString(36)).join("");
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

function getOrCreateDevice(): DeviceIdentity {
  let deviceId = readStorage(DEVICE_ID_KEYS);
  let deviceToken = readStorage(DEVICE_TOKEN_KEYS);

  if (!deviceId) deviceId = `water-device-${Date.now().toString(36)}-${randomSecret()}`;
  if (!deviceToken) deviceToken = `water-token-${randomSecret()}-${randomSecret()}`;

  window.localStorage.setItem("pantavion:water:device-id:v1", deviceId);
  window.localStorage.setItem("pantavion:water:device-token:v1", deviceToken);

  return { deviceId, deviceToken };
}

function ensureMapLibre() {
  return new Promise<MapLibreApi>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window_unavailable"));
      return;
    }

    const existingMapLibre = (window as unknown as { maplibregl?: MapLibreApi }).maplibregl;
    if (existingMapLibre) {
      resolve(existingMapLibre);
      return;
    }

    if (!document.querySelector("link[data-pantavion-maplibre-css]")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/maplibre-gl@6.11.2/dist/maplibre-gl.css";
      css.setAttribute("data-pantavion-maplibre-css", "true");
      document.head.appendChild(css);
    }

    const existing = document.querySelector("script[data-pantavion-maplibre-js]");
    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          const loadedMapLibre = (window as unknown as { maplibregl?: MapLibreApi }).maplibregl;
          if (loadedMapLibre) resolve(loadedMapLibre);
          else reject(new Error("maplibre_missing_after_load"));
        },
        { once: true },
      );
      existing.addEventListener("error", () => reject(new Error("maplibre_script_failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@6.11.2/dist/maplibre-gl.js";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-pantavion-maplibre-js", "true");
    script.onload = () => {
      const loadedMapLibre = (window as unknown as { maplibregl?: MapLibreApi }).maplibregl;
      if (loadedMapLibre) resolve(loadedMapLibre);
      else reject(new Error("maplibre_missing_after_load"));
    };
    script.onerror = () => reject(new Error("maplibre_script_failed"));
    document.head.appendChild(script);
  });
}

function authenticColorExpression(): unknown[] {
  return ["coalesce", ["get", "pantavionColor"], "#00b7ff"];
}

function authenticWidthExpression(): unknown[] {
  return ["coalesce", ["get", "pantavionWidth"], 1];
}

function normalizeFeatures(features: GeoJsonFeature[]): GeoJsonFeature[] {
  return features.map((feature, index) => {
    const properties = asRecord(feature.properties) ?? {};
    const style = asRecord(properties.kmlLineStyle);

    const color =
      style && typeof style.color === "string"
        ? style.color
        : "#00b7ff";

    const rawWidth = style
      ? Number(style.weight ?? style.width ?? 1)
      : 1;

    const width = Math.max(1, Math.min(6, Number.isFinite(rawWidth) ? rawWidth : 1));

    const featureId =
      feature.id ??
      (typeof properties.placemarkIndex === "string" ||
      typeof properties.placemarkIndex === "number"
        ? properties.placemarkIndex
        : undefined) ??
      (typeof properties.featureIndex === "string" ||
      typeof properties.featureIndex === "number"
        ? properties.featureIndex
        : undefined) ??
      `water-${index}`;

    return {
      ...feature,
      id: featureId,
      properties: {
        ...properties,
        pantavionColor: color,
        pantavionWidth: width,
      },
    };
  });
}

export default function PantavionOwnedMapPilotClient({
  styleUrl,
}: {
  styleUrl: string;
}) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadingRef = useRef(false);
  const locationMarkerRef = useRef<MapLibreMarker | null>(null);
  const debounceRef = useRef<number | null>(null);

  const [message, setMessage] = useState("Εκκίνηση Pantavion Map Engine...");
  const [featureCount, setFeatureCount] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(17);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const maplibregl = await ensureMapLibre();

        if (cancelled || !mapEl.current || mapRef.current) return;

        const map = new maplibregl.Map({
          container: mapEl.current,
          style: styleUrl,
          center: LIMASSOL_CENTER,
          zoom: 17,
          pitch: 0,
          bearing: 0,
          attributionControl: true,
          cooperativeGestures: false,
        });

        map.addControl(new maplibregl.NavigationControl(), "top-left");

        map.on("load", () => {
          if (!map.getSource("pantavion-water")) {
            map.addSource("pantavion-water", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [],
              },
            });
          }

          if (!map.getLayer("pantavion-water-lines")) {
            map.addLayer({
              id: "pantavion-water-lines",
              type: "line",
              source: "pantavion-water",
              paint: {
                "line-color": authenticColorExpression(),
                "line-width": authenticWidthExpression(),
                "line-opacity": 0.96,
              },
            });
          }

          if (!map.getLayer("pantavion-water-points")) {
            map.addLayer({
              id: "pantavion-water-points",
              type: "circle",
              source: "pantavion-water",
              filter: ["==", ["geometry-type"], "Point"],
              paint: {
                "circle-radius": 3,
                "circle-color": authenticColorExpression(),
                "circle-stroke-color": "#07111f",
                "circle-stroke-width": 1,
              },
            });
          }

          setMapReady(true);
          setMessage(
            "Pantavion Map Engine pilot ενεργό. Κτίρια, αριθμοί, δρόμοι και POI προέρχονται από ανοικτά vector δεδομένα. Το Water layer παραμένει προστατευμένο και ανεξάρτητο.",
          );
          void loadVisibleWater(map);
        });

        map.on("zoomend", () => {
          setZoom(map.getZoom());

          if (debounceRef.current) window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => void loadVisibleWater(map), 250);
        });

        map.on("moveend", () => {
          if (debounceRef.current) window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => void loadVisibleWater(map), 250);
        });

        mapRef.current = map;
      } catch {
        setMessage("Δεν φορτώθηκε το Pantavion Map Engine pilot.");
      }
    }

    void boot();

    return () => {
      cancelled = true;

      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      try {
        locationMarkerRef.current?.remove();
      } catch {}
      locationMarkerRef.current = null;

      try {
        mapRef.current?.remove();
      } catch {}
      mapRef.current = null;
    };
  }, [styleUrl]);

  async function loadVisibleWater(map: MapLibreMap | null = mapRef.current) {
    if (!map || loadingRef.current || map.getZoom() < 14) return;

    loadingRef.current = true;

    try {
      const bounds = map.getBounds();
      const params = new URLSearchParams({
        minLng: bounds.getWest().toFixed(6),
        minLat: bounds.getSouth().toFixed(6),
        maxLng: bounds.getEast().toFixed(6),
        maxLat: bounds.getNorth().toFixed(6),
        maxFeatures: String(MAX_FEATURES),
      });

      const device = getOrCreateDevice();
      const response = await fetch(
        `/api/professional/infrastructure/water/segment/bbox?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
          headers: {
            "x-pantavion-water-device-id": device.deviceId,
            "x-pantavion-water-device-token": device.deviceToken,
          },
        },
      );

      const json = (await response.json().catch(() => ({}))) as SegmentResponse;

      if (
        !response.ok ||
        json.completeNetworkReturned === true ||
        json.rawMasterReturned === true ||
        json.browserFullNetworkLoaded === true
      ) {
        throw new Error(json.error || json.reason || "water_segment_failed");
      }

      const features = normalizeFeatures(json.segment?.features ?? []);
      const source = map.getSource("pantavion-water");

      if (source) {
        source.setData({
          type: "FeatureCollection",
          features,
        });
      }

      setFeatureCount(features.length);
      setMessage(
        json.segmentTruncated === true
          ? `Βάση χάρτη ενεργή · Water: ${features.length} στοιχεία. Κάνε λίγο zoom για πληρέστερο segment.`
          : `Βάση χάρτη ενεργή · Water: ${features.length} στοιχεία στην ορατή περιοχή.`,
      );
    } catch {
      setFeatureCount(null);
      setMessage(
        "Η βάση χάρτη παραμένει ενεργή. Το προστατευμένο Water layer χρειάζεται εγκεκριμένη πρόσβαση ή μικρότερη ορατή περιοχή.",
      );
    } finally {
      loadingRef.current = false;
    }
  }

  function locateMe() {
    const map = mapRef.current;

    if (!map || !window.navigator?.geolocation) {
      setMessage("Δεν είναι διαθέσιμο GPS στη συσκευή.");
      return;
    }

    setMessage("Εντοπισμός θέσης...");

    window.navigator.geolocation.getCurrentPosition(
      async (position) => {
        const maplibregl = await ensureMapLibre();
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;

        try {
          locationMarkerRef.current?.remove();
        } catch {}

        const markerEl = document.createElement("div");
        markerEl.style.width = "22px";
        markerEl.style.height = "22px";
        markerEl.style.borderRadius = "999px";
        markerEl.style.background = "#22c55e";
        markerEl.style.border = "4px solid white";
        markerEl.style.boxShadow = "0 0 0 2px #07111f";

        locationMarkerRef.current = new maplibregl.Marker({ element: markerEl })
          .setLngLat([lng, lat])
          .addTo(map);

        map.easeTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 18),
          duration: 450,
        });

        setMessage(
          `Βρέθηκε θέση (~${Math.round(position.coords.accuracy)} μ.). Φορτώνω τοπικό δίκτυο.`,
        );

        window.setTimeout(() => void loadVisibleWater(map), 550);
      },
      () => setMessage("Δεν ήταν διαθέσιμη η θέση."),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      },
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-6 text-white">
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-3xl border border-emerald-400/30 bg-[#0b1a2e] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Pantavion-owned architecture · Pilot
          </p>
          <h1 className="mt-2 text-3xl font-bold">Pantavion Map Engine</h1>
          <p className="mt-3 text-sm text-slate-300">
            Χωρίς Google/2GIS/TomTom account. Δικό μας viewer, δικό μας layer stack,
            προστατευμένο Water API και provider-swappable vector source. Το σημερινό
            pilot χρησιμοποιεί ανοικτά OSM Shortbread vector tiles· το επόμενο βήμα
            είναι self-hosted Cyprus tiles ώστε να φύγει και αυτή η εξάρτηση.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={locateMe}
            disabled={!mapReady}
            className="min-h-12 rounded-2xl border border-emerald-400/50 px-5 font-semibold disabled:opacity-50"
          >
            Το σημείο μου
          </button>
          <button
            type="button"
            onClick={() => void loadVisibleWater()}
            disabled={!mapReady}
            className="min-h-12 rounded-2xl border border-sky-400/50 px-5 font-semibold disabled:opacity-50"
          >
            Φόρτωση δικτύου
          </button>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-[#0b1a2e] p-4">
          <p className="mb-3 text-sm text-slate-300">
            {message}
            {featureCount !== null ? ` · Water στοιχεία: ${featureCount}` : ""}
            {Number.isFinite(zoom) ? ` · Zoom: ${zoom.toFixed(1)}` : ""}
          </p>
          <div
            ref={mapEl}
            className="h-[68vh] min-h-[520px] w-full overflow-hidden rounded-2xl bg-slate-900"
          />
        </div>

        <div className="rounded-3xl border border-amber-400/25 bg-[#0b1a2e] p-4 text-sm text-slate-300">
          <strong className="text-amber-300">Pilot rule:</strong> δεν αντικαθιστά τον
          κανονικό Map A μέχρι να επιβεβαιωθούν οπτικά στη Λεμεσό κτίρια, αριθμοί
          υποστατικών, ονόματα δρόμων και POI. Τα δεδομένα OSM παραμένουν με την
          απαιτούμενη attribution και δεν γίνεται bulk/offline λήψη από δημόσιους
          OSM tile servers.
        </div>
      </section>
    </main>
  );
}
