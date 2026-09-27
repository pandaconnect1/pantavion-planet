"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSON as LeafletGeoJSON, Map as LeafletMap } from "leaflet";

import { pantavionWaterApprovedDeviceHeaders } from "@/core/water/water-approved-device-client";

type LayerTruthState =
  | "LIVE_PUBLIC"
  | "CONNECTED_PRIVATE"
  | "REFERENCE_ONLY"
  | "SOURCE_REQUIRED";

type CatalogLayer = {
  id: string;
  group: string;
  name: string;
  provider: string;
  truthState: LayerTruthState;
  coverage: string;
  operationalUse: string;
  sourceUpdatedAt?: string;
  temporalCoverage?: string;
  technicalFields: readonly string[];
  warnings: readonly string[];
  queryable: boolean;
};

type CatalogResponse = {
  ok?: boolean;
  error?: string;
  catalog?: {
    groupLabels?: Record<string, string>;
    layers?: CatalogLayer[];
  };
};

type LayerResponse = {
  ok?: boolean;
  error?: string;
  featureCount?: number;
  truncated?: boolean;
  layer?: CatalogLayer;
  geojson?: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      geometry: unknown;
      properties?: Record<string, unknown>;
      id?: string | number;
    }>;
  };
};

type WaterSegmentResponse = {
  segment?: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      geometry: unknown;
      properties?: Record<string, unknown>;
      id?: string | number;
    }>;
  };
  completeNetworkReturned?: boolean;
  rawMasterReturned?: boolean;
  browserFullNetworkLoaded?: boolean;
  error?: string;
  reason?: string;
};

type ActiveLayerState = {
  opacity: number;
  loading: boolean;
  count: number | null;
  error: string | null;
};

const MAX_ACTIVE_EXTERNAL_LAYERS = 3;
const MIN_DETAIL_ZOOM = 14;
const WATER_TILE_SPAN = 0.045;
const MAX_WATER_TILES = 16;
const WATER_LAYER_ID = "pantavion-water-network";
const LIMASSOL_CENTER: [number, number] = [34.6851, 33.0442];

function safeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function authHeaders() {
  return pantavionWaterApprovedDeviceHeaders();
}

function bboxOf(map: LeafletMap) {
  const bounds = map.getBounds();
  return {
    minLng: bounds.getWest(),
    minLat: bounds.getSouth(),
    maxLng: bounds.getEast(),
    maxLat: bounds.getNorth(),
  };
}

function splitBbox(
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number },
  maxSpan: number,
) {
  const lngSpan = bbox.maxLng - bbox.minLng;
  const latSpan = bbox.maxLat - bbox.minLat;
  const lngSteps = Math.max(1, Math.ceil(lngSpan / maxSpan));
  const latSteps = Math.max(1, Math.ceil(latSpan / maxSpan));

  if (lngSteps * latSteps > MAX_WATER_TILES) {
    throw new Error("zoom_required");
  }

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

function propertyValue(
  properties: Record<string, unknown>,
  names: readonly string[],
) {
  for (const name of names) {
    const direct = properties[name];
    if (direct !== undefined && direct !== null && String(direct).trim() !== "") {
      return direct;
    }

    const lower = name.toLowerCase();
    const match = Object.entries(properties).find(
      ([key, value]) =>
        key.toLowerCase() === lower &&
        value !== undefined &&
        value !== null &&
        String(value).trim() !== "",
    );
    if (match) return match[1];
  }
  return null;
}

function externalPopup(feature: any, layer: CatalogLayer) {
  const properties =
    feature?.properties && typeof feature.properties === "object"
      ? (feature.properties as Record<string, unknown>)
      : {};

  const rows = layer.technicalFields
    .map((field) => [field, propertyValue(properties, [field])] as const)
    .filter(([, value]) => value !== null)
    .slice(0, 14);

  return `
    <div style="font-family:system-ui,sans-serif;min-width:230px;max-width:320px">
      <strong>${safeHtml(layer.name)}</strong><br/>
      <small>${safeHtml(layer.provider)}</small>
      <hr style="margin:8px 0;border:0;border-top:1px solid #ddd"/>
      ${rows.length
        ? rows
            .map(
              ([key, value]) =>
                `<div><b>${safeHtml(key)}:</b> ${safeHtml(value)}</div>`,
            )
            .join("")
        : "<div>Δεν υπάρχουν πρόσθετα τεχνικά πεδία για αυτό το feature.</div>"}
      <hr style="margin:8px 0;border:0;border-top:1px solid #ddd"/>
      <small>Truth: ${safeHtml(layer.truthState)} · Coverage: ${safeHtml(layer.coverage)}</small>
    </div>
  `;
}

function waterPopup(feature: any) {
  const properties =
    feature?.properties && typeof feature.properties === "object"
      ? (feature.properties as Record<string, unknown>)
      : {};
  const name =
    propertyValue(properties, ["name", "Name", "folderName"]) ||
    "Pantavion Water asset";
  return `
    <div style="font-family:system-ui,sans-serif;min-width:200px">
      <strong>${safeHtml(name)}</strong><br/>
      <small>Protected Pantavion Water segment</small>
    </div>
  `;
}

function truthLabel(state: LayerTruthState) {
  if (state === "LIVE_PUBLIC") return "LIVE PUBLIC";
  if (state === "CONNECTED_PRIVATE") return "PRIVATE";
  if (state === "REFERENCE_ONLY") return "REFERENCE";
  return "SOURCE NEEDED";
}

function truthClass(state: LayerTruthState) {
  if (state === "LIVE_PUBLIC")
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  if (state === "CONNECTED_PRIVATE")
    return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
  if (state === "REFERENCE_ONLY")
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

export default function InfrastructureOperationsClient() {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const waterLayerRef = useRef<LeafletGeoJSON | null>(null);
  const externalLayerRefs = useRef(new Map<string, LeafletGeoJSON>());
  const abortRef = useRef<AbortController | null>(null);
  const reloadTimerRef = useRef<number | null>(null);

  const [catalog, setCatalog] = useState<CatalogLayer[]>([]);
  const [groupLabels, setGroupLabels] = useState<Record<string, string>>({});
  const [selectedGroup, setSelectedGroup] = useState("water");
  const [waterEnabled, setWaterEnabled] = useState(true);
  const [waterOpacity, setWaterOpacity] = useState(0.95);
  const [waterCount, setWaterCount] = useState<number | null>(null);
  const [activeLayers, setActiveLayers] = useState<Record<string, ActiveLayerState>>({});
  const [message, setMessage] = useState(
    "Επίλεξε υπηρεσία και layer. Φορτώνεται μόνο η ορατή περιοχή.",
  );
  const [mapReady, setMapReady] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const [pinPoint, setPinPoint] = useState<[number, number] | null>(null);
  const [issueType, setIssueType] = useState("inspection");
  const [issueNote, setIssueNote] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  const activeExternalIds = useMemo(
    () => Object.keys(activeLayers),
    [activeLayers],
  );

  const groups = useMemo(() => {
    const values = Array.from(new Set(catalog.map((layer) => layer.group)));
    return values.sort((a, b) =>
      (groupLabels[a] || a).localeCompare(groupLabels[b] || b, "el"),
    );
  }, [catalog, groupLabels]);

  const visibleCatalog = useMemo(
    () => catalog.filter((layer) => layer.group === selectedGroup),
    [catalog, selectedGroup],
  );

  useEffect(() => {
    let cancelled = false;
    let localMap: LeafletMap | null = null;

    void import("leaflet").then((module) => {
      if (cancelled || !mapEl.current) return;
      const L = module.default || module;
      localMap = L.map(mapEl.current, {
        center: LIMASSOL_CENTER,
        zoom: 15,
        zoomControl: true,
        preferCanvas: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
        attribution: "&copy; OpenStreetMap contributors",
        updateWhenIdle: true,
        keepBuffer: 2,
      }).addTo(localMap);

      mapRef.current = localMap;
      setMapReady(true);
      window.setTimeout(() => localMap?.invalidateSize(), 250);
    });

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      if (reloadTimerRef.current) window.clearTimeout(reloadTimerRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Intentional one-time map boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    void loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    void reloadVisibleLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waterEnabled, activeExternalIds.join("|"), mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const onViewportChange = () => {
      if (reloadTimerRef.current) window.clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = window.setTimeout(() => {
        void reloadVisibleLayers();
      }, 350);
    };

    map.on("moveend zoomend", onViewportChange);
    return () => {
      map.off("moveend zoomend", onViewportChange);
    };
    // Rebind with the current active-layer selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, waterEnabled, activeExternalIds.join("|")]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onClick = (event: any) => {
      if (!pinMode) return;
      setPinPoint([event.latlng.lat, event.latlng.lng]);
    };

    map.off("click");
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [pinMode]);

  async function loadCatalog() {
    try {
      const response = await fetch(
        "/api/professional/infrastructure/water/infrastructure-layers",
        {
          cache: "no-store",
          credentials: "include",
          headers: authHeaders(),
        },
      );
      const json = (await response.json()) as CatalogResponse;
      if (!response.ok || !json.ok) {
        throw new Error(json.error || "catalog_failed");
      }
      setCatalog(json.catalog?.layers || []);
      setGroupLabels(json.catalog?.groupLabels || {});
    } catch {
      setMessage(
        "Τα infrastructure layers απαιτούν εγκεκριμένη Water συσκευή ή admin session.",
      );
    }
  }

  async function reloadVisibleLayers() {
    const map = mapRef.current;
    if (!map) return;

    if (map.getZoom() < MIN_DETAIL_ZOOM) {
      setMessage("Κάνε zoom για φόρτωση λεπτομερών δικτύων.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setMessage("Ενημέρωση ορατών δικτύων…");
      const jobs: Promise<void>[] = [];
      if (waterEnabled) jobs.push(loadWaterLayer(controller.signal));
      for (const layerId of Object.keys(activeLayers)) {
        jobs.push(loadExternalLayer(layerId, controller.signal));
      }
      await Promise.allSettled(jobs);
      if (!controller.signal.aborted) {
        setMessage("Τα ενεργά layers ενημερώθηκαν για την ορατή περιοχή.");
      }
    } catch {
      if (!controller.signal.aborted) {
        setMessage("Κάποιο layer δεν ενημερώθηκε. Τα υπόλοιπα παραμένουν διαθέσιμα.");
      }
    }
  }

  async function loadWaterLayer(signal: AbortSignal) {
    const map = mapRef.current;
    if (!map) return;

    const bbox = bboxOf(map);
    const tiles = splitBbox(bbox, WATER_TILE_SPAN);
    const features: any[] = [];
    const seen = new Set<string>();

    for (const tile of tiles) {
      const params = new URLSearchParams({
        minLng: tile.minLng.toFixed(6),
        minLat: tile.minLat.toFixed(6),
        maxLng: tile.maxLng.toFixed(6),
        maxLat: tile.maxLat.toFixed(6),
        maxFeatures: "900",
      });

      const response = await fetch(
        `/api/professional/infrastructure/water/segment/bbox?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
          headers: authHeaders(),
          signal,
        },
      );
      const json = (await response.json()) as WaterSegmentResponse;
      if (
        !response.ok ||
        json.completeNetworkReturned === true ||
        json.rawMasterReturned === true ||
        json.browserFullNetworkLoaded === true
      ) {
        throw new Error(json.error || json.reason || "water_segment_failed");
      }

      for (const feature of json.segment?.features || []) {
        const key = String(
          feature.id ??
            feature.properties?.placemarkIndex ??
            feature.properties?.featureIndex ??
            JSON.stringify(feature.geometry),
        );
        if (seen.has(key)) continue;
        seen.add(key);
        features.push(feature);
      }
    }

    const L = await import("leaflet");
    waterLayerRef.current?.remove();
    const layer = (L.default || L).geoJSON(
      { type: "FeatureCollection", features } as any,
      {
        style: {
          weight: 4,
          opacity: waterOpacity,
          fillOpacity: Math.min(0.3, waterOpacity),
        },
        pointToLayer: (_feature: any, latlng: any) =>
          (L.default || L).circleMarker(latlng, {
            radius: 5,
            weight: 2,
            opacity: waterOpacity,
            fillOpacity: waterOpacity,
          }),
        onEachFeature: (feature: any, leafletLayer: any) => {
          leafletLayer.bindPopup(waterPopup(feature));
        },
      },
    );
    layer.addTo(map);
    waterLayerRef.current = layer;
    setWaterCount(features.length);
  }

  async function loadExternalLayer(layerId: string, signal: AbortSignal) {
    const map = mapRef.current;
    if (!map) return;

    const bbox = bboxOf(map);
    setActiveLayers((current) => ({
      ...current,
      [layerId]: {
        ...(current[layerId] || { opacity: 0.8, count: null, error: null }),
        loading: true,
        error: null,
      },
    }));

    const params = new URLSearchParams({
      layerId,
      minLng: bbox.minLng.toFixed(6),
      minLat: bbox.minLat.toFixed(6),
      maxLng: bbox.maxLng.toFixed(6),
      maxLat: bbox.maxLat.toFixed(6),
    });

    try {
      const response = await fetch(
        `/api/professional/infrastructure/water/infrastructure-layers?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
          headers: authHeaders(),
          signal,
        },
      );
      const json = (await response.json()) as LayerResponse;
      if (!response.ok || !json.ok || !json.geojson || !json.layer) {
        throw new Error(json.error || "layer_failed");
      }

      const L = await import("leaflet");
      externalLayerRefs.current.get(layerId)?.remove();

      const opacity = activeLayers[layerId]?.opacity ?? 0.8;
      const layer = (L.default || L).geoJSON(json.geojson as any, {
        style: {
          weight: 4,
          opacity,
          fillOpacity: Math.min(0.28, opacity * 0.45),
        },
        pointToLayer: (_feature: any, latlng: any) =>
          (L.default || L).circleMarker(latlng, {
            radius: 6,
            weight: 2,
            opacity,
            fillOpacity: opacity,
          }),
        onEachFeature: (feature: any, leafletLayer: any) => {
          leafletLayer.bindPopup(externalPopup(feature, json.layer!));
        },
      });
      layer.addTo(map);
      externalLayerRefs.current.set(layerId, layer);

      setActiveLayers((current) => ({
        ...current,
        [layerId]: {
          ...(current[layerId] || { opacity: 0.8 }),
          loading: false,
          count: json.featureCount ?? 0,
          error: json.truncated ? "Πολλά features — κάνε zoom για πλήρη εικόνα." : null,
        },
      }));
    } catch (error) {
      if (signal.aborted) return;
      setActiveLayers((current) => ({
        ...current,
        [layerId]: {
          ...(current[layerId] || { opacity: 0.8, count: null }),
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Δεν φορτώθηκε το layer.",
        },
      }));
    }
  }

  function toggleExternal(layer: CatalogLayer) {
    if (!layer.queryable || layer.truthState === "SOURCE_REQUIRED") {
      setMessage(
        `${layer.name}: δεν υπάρχει ακόμη επαληθευμένη συνδεδεμένη geometry source.`,
      );
      return;
    }

    setActiveLayers((current) => {
      if (current[layer.id]) {
        externalLayerRefs.current.get(layer.id)?.remove();
        externalLayerRefs.current.delete(layer.id);
        const next = { ...current };
        delete next[layer.id];
        return next;
      }

      if (Object.keys(current).length >= MAX_ACTIVE_EXTERNAL_LAYERS) {
        setMessage(
          "Για ταχύτητα στο κινητό επιτρέπονται έως 3 εξωτερικά overlays ταυτόχρονα. Κλείσε ένα και άνοιξε το επόμενο.",
        );
        return current;
      }

      return {
        ...current,
        [layer.id]: {
          opacity: 0.8,
          loading: true,
          count: null,
          error: null,
        },
      };
    });
  }

  function setLayerOpacity(layerId: string, opacity: number) {
    setActiveLayers((current) => ({
      ...current,
      [layerId]: {
        ...current[layerId],
        opacity,
      },
    }));
    const layer = externalLayerRefs.current.get(layerId);
    layer?.setStyle({
      opacity,
      fillOpacity: Math.min(0.28, opacity * 0.45),
    });
  }

  function setWaterLayerOpacity(opacity: number) {
    setWaterOpacity(opacity);
    waterLayerRef.current?.setStyle({
      opacity,
      fillOpacity: Math.min(0.3, opacity),
    });
  }

  function clearExternalLayers() {
    for (const layer of externalLayerRefs.current.values()) layer.remove();
    externalLayerRefs.current.clear();
    setActiveLayers({});
  }

  function locateMe() {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) {
      setMessage("Το GPS δεν είναι διαθέσιμο.");
      return;
    }

    setMessage("Εντοπισμός θέσης…");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsAccuracy(position.coords.accuracy);
        setPinPoint([lat, lng]);

        const L = await import("leaflet");
        (L.default || L)
          .circleMarker([lat, lng], {
            radius: 9,
            weight: 3,
            fillOpacity: 0.9,
          })
          .bindTooltip("Η θέση μου")
          .addTo(map);

        map.setView([lat, lng], Math.max(map.getZoom(), 18));
        setMessage(
          `GPS ±${Math.round(position.coords.accuracy)} m · φόρτωση της περιοχής.`,
        );
        window.setTimeout(() => void reloadVisibleLayers(), 250);
      },
      () => setMessage("Δεν ήταν δυνατός ο εντοπισμός GPS."),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000,
      },
    );
  }

  async function saveInspectionPin() {
    if (!pinPoint) {
      setMessage("Πάτησε GPS ή επίλεξε σημείο στον χάρτη.");
      return;
    }

    setSavingPin(true);
    try {
      const [lat, lng] = pinPoint;
      const activeServiceLayers = Object.keys(activeLayers);
      const response = await fetch(
        "/api/professional/infrastructure/water/changes/evidence-pins",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            clientMutationId: `infra-pin-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            mapId: "PANTAVION_INFRASTRUCTURE_OPERATIONS",
            sourceKey:
              activeServiceLayers.length === 1
                ? activeServiceLayers[0]
                : "multi-utility-view",
            x: lng,
            y: lat,
            crsAuthority: "EPSG",
            crsCode: "4326",
            locationSource: gpsAccuracy !== null ? "gps" : "map_click",
            accuracyState:
              gpsAccuracy !== null && gpsAccuracy <= 10
                ? "measured"
                : gpsAccuracy !== null
                  ? "estimated"
                  : "approximate",
            accuracyMeters: gpsAccuracy,
            note: issueNote.trim() || null,
            artifactRefs: [],
            aiObservation: {
              observationType: issueType,
              activeUtilityLayers: activeServiceLayers,
              waterLayerVisible: waterEnabled,
              capturedFrom: "pantavion_infrastructure_operations_map",
            },
          }),
        },
      );

      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        pin?: { pin_id?: string };
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "inspection_pin_failed");
      }

      const L = await import("leaflet");
      (L.default || L)
        .circleMarker(pinPoint, {
          radius: 8,
          weight: 3,
          fillOpacity: 0.95,
        })
        .bindPopup(
          `<strong>${safeHtml(issueType)}</strong><br/>${safeHtml(issueNote || "Field checkpoint")}`,
        )
        .addTo(mapRef.current!);

      setIssueNote("");
      setPinMode(false);
      setMessage(
        "Το σημείο ελέγχου αποθηκεύτηκε ως pending evidence pin. Δεν αλλάζει το επίσημο δίκτυο πριν από review.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Δεν αποθηκεύτηκε το σημείο.",
      );
    } finally {
      setSavingPin(false);
    }
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f2c766]">
              Pantavion Infrastructure Operations
            </p>
            <h1 className="mt-1 text-2xl font-black md:text-3xl">
              Δίκτυα · GPS · Field Check
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={locateMe}
              className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100"
            >
              📍 GPS
            </button>
            <button
              type="button"
              onClick={() => void reloadVisibleLayers()}
              className="rounded-xl border border-[#f2c766]/40 bg-[#f2c766]/10 px-3 py-2 text-xs font-black text-[#f2c766]"
            >
              ↻ Refresh visible
            </button>
            <button
              type="button"
              onClick={clearExternalLayers}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black text-slate-200"
            >
              Κλείσιμο overlays
            </button>
          </div>
        </div>

        <p className="mt-3 rounded-2xl border border-white/10 bg-[#07111f] px-3 py-2 text-xs leading-5 text-slate-200">
          {message}
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/20 p-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {groups.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${
                selectedGroup === group
                  ? "bg-[#f2c766] text-[#07101e]"
                  : "border border-white/10 bg-white/5 text-slate-200"
              }`}
            >
              {groupLabels[group] || group}
            </button>
          ))}
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {visibleCatalog.map((layer) => {
            const active = Boolean(activeLayers[layer.id]);
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => toggleExternal(layer)}
                className={`rounded-2xl border p-3 text-left ${
                  active
                    ? "border-[#f2c766]/60 bg-[#f2c766]/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <strong className="text-sm text-white">{layer.name}</strong>
                  <span
                    className={`rounded-full border px-2 py-1 text-[9px] font-black ${
                      truthClass(layer.truthState)
                    }`}
                  >
                    {truthLabel(layer.truthState)}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-4 text-slate-400">
                  {layer.coverage}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-200">
          <div ref={mapEl} className="h-[64vh] min-h-[480px] w-full" />
        </div>

        <aside className="grid content-start gap-3">
          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-4">
            <label className="flex items-center justify-between gap-3">
              <span>
                <strong className="block text-sm text-white">
                  Pantavion Water
                </strong>
                <span className="text-[11px] text-sky-100/70">
                  protected viewport segments · {waterCount ?? "—"} features
                </span>
              </span>
              <input
                type="checkbox"
                checked={waterEnabled}
                onChange={(event) => {
                  const enabled = event.target.checked;
                  setWaterEnabled(enabled);
                  if (!enabled) {
                    waterLayerRef.current?.remove();
                    waterLayerRef.current = null;
                    setWaterCount(null);
                  }
                }}
              />
            </label>
            <input
              className="mt-3 w-full"
              type="range"
              min="0.15"
              max="1"
              step="0.05"
              value={waterOpacity}
              onChange={(event) =>
                setWaterLayerOpacity(Number(event.target.value))
              }
            />
          </div>

          {Object.entries(activeLayers).map(([layerId, state]) => {
            const layer = catalog.find((item) => item.id === layerId);
            if (!layer) return null;
            return (
              <div
                key={layerId}
                className="rounded-3xl border border-[#f2c766]/20 bg-[#f2c766]/10 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <strong className="block text-sm text-white">
                      {layer.name}
                    </strong>
                    <span className="text-[11px] text-slate-300">
                      {state.loading
                        ? "φόρτωση…"
                        : `${state.count ?? 0} features`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExternal(layer)}
                    className="rounded-lg border border-white/15 px-2 py-1 text-[10px] font-black"
                  >
                    OFF
                  </button>
                </div>
                <input
                  className="mt-3 w-full"
                  type="range"
                  min="0.15"
                  max="1"
                  step="0.05"
                  value={state.opacity}
                  onChange={(event) =>
                    setLayerOpacity(layerId, Number(event.target.value))
                  }
                />
                {state.error ? (
                  <p className="mt-2 text-[10px] leading-4 text-amber-200">
                    {state.error}
                  </p>
                ) : null}
                <p className="mt-2 text-[10px] leading-4 text-slate-400">
                  {layer.provider}
                  {layer.sourceUpdatedAt
                    ? ` · source update ${layer.sourceUpdatedAt}`
                    : ""}
                </p>
              </div>
            );
          })}

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <strong className="block text-sm text-emerald-100">
              📌 Σημείο ελέγχου / βλάβης
            </strong>
            <p className="mt-2 text-[11px] leading-5 text-emerald-50/70">
              GPS ή tap στον χάρτη → καταγραφή → review. Δεν αλλάζει το master
              απευθείας.
            </p>

            <select
              value={issueType}
              onChange={(event) => setIssueType(event.target.value)}
              className="mt-3 w-full rounded-xl border border-emerald-300/20 bg-[#07111f] px-3 py-2 text-xs text-white"
            >
              <option value="inspection">Έλεγχος</option>
              <option value="missing_valve">Δεν εντοπίζεται βάνα</option>
              <option value="leak">Πιθανή διαρροή / απώλεια</option>
              <option value="fault">Βλάβη</option>
              <option value="position_correction">Διόρθωση θέσης</option>
              <option value="new_asset">Νέο asset</option>
              <option value="other">Άλλο</option>
            </select>

            <textarea
              rows={3}
              value={issueNote}
              onChange={(event) => setIssueNote(event.target.value)}
              placeholder="Τι βρήκες στο πεδίο;"
              className="mt-2 w-full rounded-xl border border-emerald-300/20 bg-[#07111f] px-3 py-2 text-xs text-white"
            />

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPinMode((value) => !value)}
                className="rounded-xl border border-emerald-300/30 px-3 py-2 text-xs font-black text-emerald-100"
              >
                {pinMode ? "Tap ενεργό" : "Επίλεξε σημείο"}
              </button>
              <button
                type="button"
                disabled={savingPin}
                onClick={() => void saveInspectionPin()}
                className="rounded-xl bg-emerald-300 px-3 py-2 text-xs font-black text-emerald-950 disabled:opacity-50"
              >
                Αποθήκευση
              </button>
            </div>

            <p className="mt-2 text-[10px] text-emerald-100/60">
              {pinPoint
                ? `Σημείο: ${pinPoint[0].toFixed(6)}, ${pinPoint[1].toFixed(6)}${gpsAccuracy !== null ? ` · GPS ±${Math.round(gpsAccuracy)}m` : ""}`
                : "Δεν έχει επιλεγεί σημείο."}
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
