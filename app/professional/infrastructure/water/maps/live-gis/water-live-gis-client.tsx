/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import WaterMapDrawingTools, { useWaterMapDrawing } from "../../components/water-map-drawing-tools";
import { drawWaterAnnotation } from "@/core/infrastructure/water/water-map-drawing";
import {
  waterAuthenticLineColorExpression,
  waterAuthenticLineOpacityExpression,
} from "@/core/infrastructure/water/water-authentic-style-rendering";

declare global {
  interface Window {
    maplibregl?: any;
  }
}

type MapId = "A" | "B" | "C";

const LIMASSOL_CENTER: [number, number] = [33.0442, 34.6851];

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
    script.addEventListener(
      "load",
      () => {
        script.setAttribute("data-loaded", "true");
        resolve();
      },
      { once: true },
    );
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

function mapStatus(mapId: MapId) {
  if (mapId === "A") {
    return "MAP A · POSTGIS / PROTECTED MVT · αυθεντική γεωμετρία και source χρώματα.";
  }
  if (mapId === "B") {
    return "MAP B · AUTHENTIC SOURCE NOT CONNECTED TO GIS YET.";
  }
  return "MAP C · AUTHENTIC SOURCE NOT CONNECTED TO GIS YET.";
}

function geolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === 1) return "GPS: δεν δόθηκε άδεια τοποθεσίας.";
  if (error.code === 2) return "GPS: η θέση δεν είναι διαθέσιμη.";
  if (error.code === 3) return "GPS: έληξε ο χρόνος εντοπισμού.";
  return "GPS: άγνωστο σφάλμα.";
}

function readDeviceClaim() {
  if (typeof window === "undefined") {
    return { deviceId: "", deviceToken: "" };
  }

  const deviceId =
    window.localStorage.getItem("pantavion_water_device_id") ||
    window.localStorage.getItem("pantavion-water-device-id") ||
    window.localStorage.getItem("pantavion:water:device-id:v1") ||
    window.localStorage.getItem("waterDeviceId") ||
    "";

  const deviceToken =
    window.localStorage.getItem("pantavion_water_device_token") ||
    window.localStorage.getItem("pantavion-water-device-token") ||
    window.localStorage.getItem("pantavion:water:device-token:v1") ||
    window.localStorage.getItem("waterDeviceToken") ||
    "";

  return { deviceId, deviceToken };
}

export default function WaterLiveGisClient({
  initialMap = "A",
}: {
  initialMap?: MapId;
}) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const watchRef = useRef<number | null>(null);

  const [activeMap, setActiveMap] = useState<MapId>(initialMap);
  const activeMapRef = useRef(initialMap);
  activeMapRef.current = activeMap;
  const drawing = useWaterMapDrawing("A", null);
  const drawingRef = useRef(drawing);
  drawingRef.current = drawing;
  const annotationCanvas = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState(mapStatus(initialMap));
  const [ready, setReady] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("GPS: δεν ζητήθηκε ακόμη");
  const [networkStatus, setNetworkStatus] = useState(
    "Δίκτυο A: αναμονή PostGIS/MVT",
  );

  useEffect(() => {
    let disposed = false;

    async function boot() {
      const maplibregl = await ensureMapLibre();
      if (disposed || !mapEl.current || mapRef.current) return;

      const params = new URLSearchParams(window.location.search);
      const lng = Number(params.get("lng"));
      const lat = Number(params.get("lat"));
      const hasFocus = Boolean(params.get("lng") && params.get("lat")) && Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
      const map = new maplibregl.Map({
        container: mapEl.current,
        center: hasFocus ? [lng, lat] : LIMASSOL_CENTER,
        zoom: hasFocus ? 19 : 14,
        maxZoom: 22,
        attributionControl: true,
        transformRequest: (url: string) => {
          if (
            url.includes(
              "/api/professional/infrastructure/water/tiles/mvt",
            )
          ) {
            const claim = readDeviceClaim();
            return {
              url,
              headers: {
                "x-pantavion-water-device-id": claim.deviceId,
                "x-pantavion-water-device-token": claim.deviceToken,
              },
            };
          }

          return { url };
        },
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
            topo: {
              type: "raster",
              tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              maxzoom: 17,
              attribution: "© OpenStreetMap contributors · SRTM · OpenTopoMap",
            },
            waterNetwork: {
              type: "vector",
              tiles: [
                `${window.location.origin}/api/professional/infrastructure/water/tiles/mvt?mapId=A&z={z}&x={x}&y={y}`,
              ],
              minzoom: 12,
              maxzoom: 22,
            },
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
              layout: {
                visibility: initialMap === "C" ? "none" : "visible",
              },
            },
            {
              id: "topo",
              type: "raster",
              source: "topo",
              layout: {
                visibility: initialMap === "C" ? "visible" : "none",
              },
            },
            {
              id: "water-pipes",
              type: "line",
              source: "waterNetwork",
              "source-layer": "water",
              minzoom: 12,
              layout: {
                visibility: initialMap === "A" ? "visible" : "none",
                "line-cap": "round",
                "line-join": "round",
              },
              paint: {
                "line-color": waterAuthenticLineColorExpression(),
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  0.7,
                  16,
                  2.2,
                  20,
                  5.5,
                ],
                "line-opacity": waterAuthenticLineOpacityExpression(),
              },
            },
          ],
        },
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      map.on("sourcedata", (event: any) => {
        if (disposed) return;
        if (event?.sourceId === "waterNetwork" && event?.isSourceLoaded) {
          setNetworkStatus("Δίκτυο A: PostGIS/MVT ενεργό · αυθεντικά source χρώματα");
        }
      });

      map.on("error", (event: any) => {
        if (disposed) return;
        const sourceId = event?.sourceId || event?.source?.id || "";
        if (sourceId === "waterNetwork") {
          setNetworkStatus("Δίκτυο A: MVT προσωρινά μη διαθέσιμο");
        }
      });

      map.on("load", () => {
        if (disposed) return;
        mapRef.current = map;
        setReady(true);
      });
      map.on("click", (event: any) => { if (activeMapRef.current === "A") drawingRef.current.pick({ x: event.lngLat.lng, y: event.lngLat.lat }); });
      map.on("render", () => {
        const canvas = annotationCanvas.current;
        if (!canvas) return;
        const rect = map.getCanvas().getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        if (canvas.width !== Math.round(rect.width * ratio)) canvas.width = Math.round(rect.width * ratio);
        if (canvas.height !== Math.round(rect.height * ratio)) canvas.height = Math.round(rect.height * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);
        if (activeMapRef.current === "A") for (const shape of drawingRef.current.shapes) drawWaterAnnotation(ctx, shape, (point) => { const p = map.project(point); return [p.x, p.y]; });
      });
    }

    void boot();

    return () => {
      disposed = true;
      if (watchRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
      watchRef.current = null;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => { if (ready) mapRef.current?.triggerRepaint(); }, [drawing.shapes, ready, activeMap]);

  function selectMap(mapId: MapId) {
    setActiveMap(mapId);
    setStatus(mapStatus(mapId));

    const map = mapRef.current;
    if (!map) return;

    const topoVisible = mapId === "C";
    if (map.getLayer("osm")) {
      map.setLayoutProperty("osm", "visibility", topoVisible ? "none" : "visible");
    }
    if (map.getLayer("topo")) {
      map.setLayoutProperty("topo", "visibility", topoVisible ? "visible" : "none");
    }
    if (map.getLayer("water-pipes")) {
      map.setLayoutProperty(
        "water-pipes",
        "visibility",
        mapId === "A" ? "visible" : "none",
      );
    }
  }

  function locateMe() {
    const map = mapRef.current;
    const maplibregl = window.maplibregl;

    if (!map || !maplibregl) {
      setGpsStatus("GPS: ο χάρτης δεν είναι ακόμη έτοιμος.");
      return;
    }

    if (!("geolocation" in navigator)) {
      setGpsStatus("GPS: δεν υποστηρίζεται από αυτόν τον browser.");
      return;
    }

    setGpsStatus("GPS: εντοπισμός…");

    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;
        const accuracy = Math.round(position.coords.accuracy);

        if (!markerRef.current) {
          markerRef.current = new maplibregl.Marker()
            .setLngLat([lng, lat])
            .addTo(map);
        } else {
          markerRef.current.setLngLat([lng, lat]);
        }

        map.easeTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 18),
          duration: 900,
        });

        setGpsStatus(`GPS: θέση βρέθηκε · ακρίβεια ±${accuracy} m`);
      },
      (error) => {
        setGpsStatus(geolocationErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      },
    );
  }

  return (
    <main className="min-h-screen bg-[#050d19] p-2 text-white sm:p-4">
      <section className="mx-auto w-full max-w-[1800px]">
        <div className="mb-2 rounded-2xl border border-amber-400/30 bg-[#081426] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f2c766]">
                Pantavion Water · GIS Runtime
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-100">{status}</p>
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

          <p className="mt-2 text-xs font-bold text-red-200">
            Κανένα δίκτυο δεν παρουσιάζεται ως αυθεντικό μέχρι να επαληθευτεί το σωστό source master.
          </p>
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-300">
          <span className="rounded-full border border-emerald-400/30 px-3 py-2">
            Engine: {ready ? "MapLibre ready" : "starting"}
          </span>

          <span className="rounded-full border border-white/15 px-3 py-2">
            Background: {activeMap === "C" ? "Υψομετρία / Topographic" : activeMap === "B" ? "Οδικό δίκτυο" : "Οδικό δίκτυο"}
          </span>

          <span className="rounded-full border border-white/15 px-3 py-2">
            {gpsStatus}
          </span>

          <span className="rounded-full border border-cyan-400/30 px-3 py-2 text-cyan-100">
            {networkStatus}
          </span>

          <button
            type="button"
            onClick={locateMe}
            className="rounded-full bg-cyan-300 px-4 py-2 font-black text-[#07101e]"
          >
            ΒΡΕΣ ΜΕ
          </button>
        </div>

        {activeMap === "A" ? <WaterMapDrawingTools drawing={drawing} /> : null}
        <div className="relative">
        <div
          ref={mapEl}
          className="h-[calc(100dvh-150px)] min-h-[560px] w-full overflow-hidden rounded-2xl border border-[#d8b45f]/25 bg-slate-900"
        />
        <canvas ref={annotationCanvas} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
        </div>
      </section>
    </main>
  );
}

