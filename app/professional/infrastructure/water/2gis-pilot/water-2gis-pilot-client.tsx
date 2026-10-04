"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    mapgl?: any;
  }
}

type SegmentResponse = {
  segment?: {
    type: "FeatureCollection";
    features: any[];
  };
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

function ensure2Gis() {
  return new Promise<any>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window_unavailable"));
      return;
    }

    if (window.mapgl) {
      resolve(window.mapgl);
      return;
    }

    const existing = document.querySelector("script[data-pantavion-2gis-mapgl]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.mapgl), { once: true });
      existing.addEventListener("error", () => reject(new Error("2gis_script_failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://mapgl.2gis.com/api/js/v1";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-pantavion-2gis-mapgl", "true");
    script.onload = () => resolve(window.mapgl);
    script.onerror = () => reject(new Error("2gis_script_failed"));
    document.head.appendChild(script);
  });
}

function authenticStyle(feature: any) {
  const style = feature?.properties?.kmlLineStyle;

  const color =
    style && typeof style === "object" && typeof style.color === "string"
      ? style.color
      : "#00b7ff";

  const rawWidth =
    style && typeof style === "object"
      ? Number(style.weight ?? style.width ?? 1)
      : 1;

  return {
    color,
    width: Math.max(1, Math.min(6, Number.isFinite(rawWidth) ? rawWidth : 1)),
  };
}

function normalizeFeatures(features: any[]) {
  return features.map((feature, index) => {
    const style = authenticStyle(feature);

    return {
      ...feature,
      id:
        feature?.id ??
        feature?.properties?.placemarkIndex ??
        feature?.properties?.featureIndex ??
        `water-${index}`,
      properties: {
        ...(feature?.properties ?? {}),
        pantavionColor: style.color,
        pantavionWidth: style.width,
      },
    };
  });
}

export default function Water2GisPilotClient({ mapKey }: { mapKey: string }) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const mapglRef = useRef<any>(null);
  const sourceRef = useRef<any>(null);
  const waterLayerInstalledRef = useRef(false);
  const locationMarkerRef = useRef<any>(null);
  const loadingRef = useRef(false);

  const [message, setMessage] = useState(
    mapKey
      ? "Εκκίνηση 2GIS pilot..."
      : "Απαιτείται 2GIS demo MapGL key για να εμφανιστεί ο pilot.",
  );
  const [featureCount, setFeatureCount] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapKey) return;

    let cancelled = false;

    async function boot() {
      try {
        const mapgl = await ensure2Gis();

        if (cancelled || !mapEl.current || mapRef.current) return;

        const map = new mapgl.Map(mapEl.current, {
          key: mapKey,
          center: LIMASSOL_CENTER,
          zoom: 17,
          pitch: 0,
          rotation: 0,
          lang: "en",
        });

        mapglRef.current = mapgl;
        mapRef.current = map;

        const installWaterLayer = () => {
          if (waterLayerInstalledRef.current) return;

          map.addLayer({
            type: "line",
            id: "pantavion-water-2gis-pilot",
            filter: [
              "match",
              ["sourceAttr", "pantavionLayer"],
              ["water"],
              true,
              false,
            ],
            style: {
              color: ["get", "pantavionColor"],
              width: ["get", "pantavionWidth"],
            },
          });

          waterLayerInstalledRef.current = true;
        };

        map.on("styleload", installWaterLayer);
        map.on("idle", () => {
          installWaterLayer();
          void loadVisibleNetwork();
        });

        setMapReady(true);
        setMessage(
          "2GIS pilot ενεργό. Έλεγχος κτιρίων, αριθμών, οδών και POI πριν οποιαδήποτε αλλαγή στον κανονικό Map A.",
        );
      } catch {
        setMessage("Δεν φορτώθηκε το 2GIS MapGL. Έλεγξε το demo key ή την υπηρεσία Map Tiles.");
      }
    }

    void boot();

    return () => {
      cancelled = true;
      try {
        sourceRef.current?.destroy?.();
      } catch {}
      sourceRef.current = null;
      waterLayerInstalledRef.current = false;

      try {
        mapRef.current?.destroy?.();
      } catch {}
      mapRef.current = null;
      mapglRef.current = null;
    };
  }, [mapKey]);

  async function loadVisibleNetwork() {
    const map = mapRef.current;
    const mapgl = mapglRef.current;

    if (!map || !mapgl || loadingRef.current || map.getZoom() < 15) return;

    loadingRef.current = true;

    try {
      const bounds = map.getBounds();
      const southWest = bounds.southWest;
      const northEast = bounds.northEast;

      const params = new URLSearchParams({
        minLng: Number(southWest[0]).toFixed(6),
        minLat: Number(southWest[1]).toFixed(6),
        maxLng: Number(northEast[0]).toFixed(6),
        maxLat: Number(northEast[1]).toFixed(6),
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
        throw new Error(json.error || json.reason || "segment_failed");
      }

      if (json.segmentTruncated === true) {
        setMessage("Το 2GIS υπόβαθρο φορτώθηκε. Κάνε λίγο zoom για πλήρες protected Water segment.");
      }

      const features = normalizeFeatures(json.segment?.features ?? []);
      const collection = {
        type: "FeatureCollection",
        features,
      };

      if (!sourceRef.current) {
        sourceRef.current = new mapgl.GeoJsonSource(map, {
          data: collection,
          attributes: {
            pantavionLayer: "water",
          },
        });
      } else {
        sourceRef.current.setData(collection);
      }

      setFeatureCount(features.length);
      if (json.segmentTruncated !== true) {
        setMessage(
          `2GIS pilot + πραγματικό Water layer: ${features.length} στοιχεία στην ορατή περιοχή.`,
        );
      }
    } catch (error) {
      setFeatureCount(null);
      setMessage(
        error instanceof Error && /401|403|access/i.test(error.message)
          ? "Το 2GIS pilot άνοιξε, αλλά το Water layer χρειάζεται εγκεκριμένη Founder/Admin πρόσβαση."
          : "Το 2GIS pilot άνοιξε, αλλά δεν φορτώθηκε ακόμη το protected Water layer.",
      );
    } finally {
      loadingRef.current = false;
    }
  }

  function locateMe() {
    const map = mapRef.current;
    const mapgl = mapglRef.current;

    if (!map || !mapgl || !navigator.geolocation) {
      setMessage("Δεν είναι διαθέσιμο GPS στη συσκευή.");
      return;
    }

    setMessage("Εντοπισμός θέσης...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        if (locationMarkerRef.current) {
          locationMarkerRef.current.destroy?.();
        }

        locationMarkerRef.current = new mapgl.Marker(map, {
          coordinates,
        });

        map.setCenter(coordinates);
        map.setZoom(Math.max(map.getZoom(), 18));
        setMessage(
          `Βρέθηκε θέση (~${Math.round(position.coords.accuracy)} μ.). Φορτώνω τοπικό Water layer.`,
        );

        window.setTimeout(() => void loadVisibleNetwork(), 250);
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
            Pantavion Water · Founder Pilot
          </p>
          <h1 className="mt-2 text-3xl font-bold">2GIS Map A Pilot</h1>
          <p className="mt-3 text-sm text-slate-300">
            Δοκιμή 2GIS για κτίρια, αριθμούς, ονομασίες οδών και POI. Ο κανονικός
            Map A δεν αλλάζει μέχρι να εγκριθεί ο pilot.
          </p>
        </div>

        {!mapKey ? (
          <div className="rounded-3xl border border-amber-400/40 bg-[#0b1a2e] p-5">
            <h2 className="text-xl font-semibold text-amber-300">Χρειάζεται demo key</h2>
            <p className="mt-2 text-sm text-slate-300">
              Ρύθμισε το Render environment variable <code>TWOGIS_MAPGL_KEY</code> με
              2GIS Map Tiles / MapGL demo key. Μέχρι τότε δεν αγγίζουμε το live Map A.
            </p>
          </div>
        ) : (
          <>
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
                onClick={() => void loadVisibleNetwork()}
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
              </p>
              <div
                ref={mapEl}
                className="h-[68vh] min-h-[520px] w-full overflow-hidden rounded-2xl bg-slate-900"
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
