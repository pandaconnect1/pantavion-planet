"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    maplibregl?: any;
    pmtiles?: any;
  }
}

type MapId = "A" | "B" | "C";

type DeviceIdentity = {
  deviceId: string;
  deviceToken: string;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: any[];
};

type SegmentPayload = {
  segment?: FeatureCollection;
  error?: string;
  reason?: string;
  completeNetworkReturned?: boolean;
  rawMasterReturned?: boolean;
  browserFullNetworkLoaded?: boolean;
};

const LIMASSOL_CENTER: [number, number] = [33.0442, 34.6851];
const MAX_FEATURES = 1200;
const TILE_SPAN = 0.045;
const MAX_TILES = 16;

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

function randomSecret() {
  if (window.crypto?.getRandomValues) {
    const values = window.crypto.getRandomValues(new Uint32Array(4));
    return Array.from(values).map((value) => value.toString(36)).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function readStorage(keys: string[]) {
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
  window.localStorage.setItem("pantavion_water_device_id", deviceId);
  window.localStorage.setItem("pantavion_water_device_token", deviceToken);

  return { deviceId, deviceToken };
}

function loadScript(src: string, marker: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-pantavion="${marker}"]`);
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute("data-pantavion", marker);
    script.addEventListener("load", () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    }, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

async function ensureMapLibre() {
  if (!document.querySelector('link[data-pantavion="maplibre-css"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.css";
    css.setAttribute("data-pantavion", "maplibre-css");
    document.head.appendChild(css);
  }

  if (!window.maplibregl) {
    await loadScript(
      "https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.js",
      "maplibre-js",
    );
  }

  return window.maplibregl;
}

function splitBounds(bounds: any) {
  const minLng = bounds.getWest();
  const minLat = bounds.getSouth();
  const maxLng = bounds.getEast();
  const maxLat = bounds.getNorth();
  const lngSpan = maxLng - minLng;
  const latSpan = maxLat - minLat;
  const xSteps = Math.max(1, Math.ceil(lngSpan / TILE_SPAN));
  const ySteps = Math.max(1, Math.ceil(latSpan / TILE_SPAN));

  if (xSteps * ySteps > MAX_TILES) {
    throw new Error("VISIBLE_AREA_TOO_LARGE");
  }

  const tiles: Array<{ minLng: number; minLat: number; maxLng: number; maxLat: number }> = [];

  for (let y = 0; y < ySteps; y += 1) {
    for (let x = 0; x < xSteps; x += 1) {
      tiles.push({
        minLng: minLng + (lngSpan * x) / xSteps,
        maxLng: minLng + (lngSpan * (x + 1)) / xSteps,
        minLat: minLat + (latSpan * y) / ySteps,
        maxLat: minLat + (latSpan * (y + 1)) / ySteps,
      });
    }
  }

  return tiles;
}

function featureKey(feature: any, fallback: string) {
  return String(
    feature?.id ??
      feature?.properties?.placemarkIndex ??
      feature?.properties?.featureIndex ??
      feature?.properties?.name ??
      fallback,
  );
}

async function fetchMapASegment(map: any, device: DeviceIdentity) {
  const all = new Map<string, any>();
  const tiles = splitBounds(map.getBounds());

  for (const tile of tiles) {
    const params = new URLSearchParams({
      minLng: tile.minLng.toFixed(7),
      minLat: tile.minLat.toFixed(7),
      maxLng: tile.maxLng.toFixed(7),
      maxLat: tile.maxLat.toFixed(7),
      maxFeatures: String(MAX_FEATURES),
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
      },
    );

    const payload = (await response.json()) as SegmentPayload;

    if (
      !response.ok ||
      payload.completeNetworkReturned === true ||
      payload.rawMasterReturned === true ||
      payload.browserFullNetworkLoaded === true
    ) {
      throw new Error(payload.error || payload.reason || "MAP_A_SEGMENT_FAILED");
    }

    for (const feature of payload.segment?.features || []) {
      all.set(featureKey(feature, `feature-${all.size}`), feature);
    }
  }

  return {
    type: "FeatureCollection",
    features: Array.from(all.values()),
  } as FeatureCollection;
}

export default function WaterLiveGisClient({
  initialMap = "A",
}: {
  initialMap?: MapId;
}) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const deviceRef = useRef<DeviceIdentity | null>(null);
  const loadSeqRef = useRef(0);
  const [activeMap, setActiveMap] = useState<MapId>(initialMap);
  const [status, setStatus] = useState("Εκκίνηση νέας GIS μηχανής…");
  const [featureCount, setFeatureCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;

    async function boot() {
      const maplibregl = await ensureMapLibre();
      if (disposed || !mapEl.current || mapRef.current) return;

      deviceRef.current = getOrCreateDevice();

      const map = new maplibregl.Map({
        container: mapEl.current,
        center: LIMASSOL_CENTER,
        zoom: 14,
        maxZoom: 22,
        attributionControl: true,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
            },
          ],
        },
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "top-right",
      );

      map.on("load", () => {
        if (!map.getSource("water-a")) {
          map.addSource("water-a", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          map.addLayer({
            id: "water-a-lines",
            type: "line",
            source: "water-a",
            filter: ["==", ["geometry-type"], "LineString"],
            paint: {
              "line-color": "#19b5fe",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                12, 1.5,
                16, 3,
                20, 6,
              ],
              "line-opacity": 0.95,
            },
          });

          map.addLayer({
            id: "water-a-points",
            type: "circle",
            source: "water-a",
            filter: ["==", ["geometry-type"], "Point"],
            paint: {
              "circle-radius": 4,
              "circle-color": "#f2c766",
              "circle-stroke-color": "#07101e",
              "circle-stroke-width": 1,
            },
          });
        }

        setReady(true);
        setStatus("MapLibre έτοιμο — φόρτωση Map A…");
        void refreshMapA(map);
      });

      map.on("moveend", () => {
        if (activeMap === "A") void refreshMapA(map);
      });

      map.on("click", "water-a-lines", (event: any) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const name =
          feature.properties?.name ||
          feature.properties?.Name ||
          feature.properties?.folderName ||
          "Water segment";

        new maplibregl.Popup()
          .setLngLat(event.lngLat)
          .setHTML(
            `<strong>${String(name).replace(/[<>&"]/g, "")}</strong><br/><small>Map A · protected live segment</small>`,
          )
          .addTo(map);
      });

      mapRef.current = map;
    }

    async function refreshMapA(map: any) {
      const seq = ++loadSeqRef.current;
      const device = deviceRef.current;
      if (!device || map.getZoom() < 12) {
        setStatus("Κάνε zoom για φόρτωση του προστατευμένου δικτύου.");
        return;
      }

      setStatus("Φόρτωση live δικτύου στην ορατή περιοχή…");

      try {
        const collection = await fetchMapASegment(map, device);
        if (seq !== loadSeqRef.current) return;

        const source = map.getSource("water-a");
        source?.setData(collection);
        setFeatureCount(collection.features.length);
        setStatus(
          collection.features.length
            ? `Map A LIVE · ${collection.features.length} features στην ορατή περιοχή`
            : "Δεν βρέθηκαν features στην ορατή περιοχή.",
        );
      } catch (error) {
        if (seq !== loadSeqRef.current) return;
        const message = error instanceof Error ? error.message : "MAP_A_LOAD_FAILED";
        setFeatureCount(0);
        setStatus(
          message === "VISIBLE_AREA_TOO_LARGE"
            ? "Η περιοχή είναι πολύ μεγάλη — κάνε zoom."
            : "Το Map A δεν φόρτωσε. Έλεγχος πρόσβασης/backend απαιτείται.",
        );
      }
    }

    void boot();

    return () => {
      disposed = true;
      loadSeqRef.current += 1;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [activeMap]);

  function selectMap(mapId: MapId) {
    setActiveMap(mapId);

    if (mapId === "A") {
      setStatus("Map A — live viewport network.");
      return;
    }

    setFeatureCount(0);
    setStatus(
      mapId === "B"
        ? "Map B source recovered · GIS tile generation pending."
        : "Map C source recovered · GIS tile generation pending.",
    );
  }

  return (
    <main className="min-h-screen bg-[#050d19] p-2 text-white sm:p-4">
      <section className="mx-auto w-full max-w-[1800px]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#081426] p-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f2c766]">
              Pantavion Water · New GIS Runtime
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-200">{status}</p>
          </div>
          <div className="flex gap-2">
            {(["A", "B", "C"] as MapId[]).map((mapId) => (
              <button
                key={mapId}
                type="button"
                onClick={() => selectMap(mapId)}
                className={
                  activeMap === mapId
                    ? "rounded-xl bg-[#f2c766] px-4 py-2 text-xs font-black text-[#07101e]"
                    : "rounded-xl border border-white/20 px-4 py-2 text-xs font-black text-white"
                }
              >
                MAP {mapId}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-2 flex flex-wrap gap-2 text-[11px] font-bold text-slate-300">
          <span className="rounded-full border border-emerald-400/30 px-3 py-1">
            Engine: {ready ? "MapLibre LIVE" : "starting"}
          </span>
          <span className="rounded-full border border-sky-400/30 px-3 py-1">
            Visible features: {featureCount}
          </span>
          <span className="rounded-full border border-white/15 px-3 py-1">
            GPS: high accuracy
          </span>
        </div>

        <div
          ref={mapEl}
          className="h-[calc(100dvh-145px)] min-h-[560px] w-full overflow-hidden rounded-2xl border border-[#d8b45f]/25 bg-slate-900"
        />
      </section>
    </main>
  );
}
